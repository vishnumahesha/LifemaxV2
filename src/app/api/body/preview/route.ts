import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getImageGenerationModel, base64ToGenerativePart, extractJSON } from '@/lib/gemini';
import { success, error, ErrorCodes } from '@/types/api';
import { computeImageHash, getSeedFromHash, getCachedResult, setCachedResult } from '@/lib/scoring';
import { getBodyStyleRecommendations } from '@/lib/style-library';
import {
  estimateBodyReachability,
  getChangeBudget,
  describeAppliedChanges,
  type BodyPreviewOptions,
} from '@/lib/reachability';
import type { KibbeType } from '@/types/body';

export const maxDuration = 60;

const ENDPOINT_VERSION = '1.0.0';

// Request schema following spec
const requestSchema = z.object({
  frontPhotoBase64: z.string().min(100),
  sidePhotoBase64: z.string().optional(),
  backPhotoBase64: z.string().optional(),
  kibbeType: z.string().nullable().optional(),
  kibbeConfidence: z.number().min(0).max(1).optional().default(0.5),
  photoQuality: z.number().min(0).max(1).optional().default(0.7),
  isMinor: z.boolean().optional().default(false),
  options: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    goal: z.enum(['get_leaner', 'build_muscle', 'balanced']),
    outfit: z.enum(['fitted_basics', 'athleisure', 'smart_casual', 'formal']),
    postureFocus: z.enum(['neutral', 'improve_posture']).optional(),
    variations: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(1),
  }),
});

// Response types
interface PreviewImage {
  url: string;
  seed: number;
}

interface OutfitChip {
  label: string;
  preset: {
    outfit: 'fitted_basics' | 'athleisure' | 'smart_casual' | 'formal';
  };
  reason: string;
}

interface BodyPreviewResponse {
  images: PreviewImage[];
  disclaimers: string[];
  appliedChanges: string[];
  recommendedOutfits: OutfitChip[];
  silhouetteTips: string[];
  reachability: {
    estimatedWeeks: { min: number; max: number };
    confidence: number;
    assumptions: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        error(ErrorCodes.VALIDATION_ERROR, 'Invalid request', {
          errors: validation.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const {
      frontPhotoBase64,
      sidePhotoBase64,
      backPhotoBase64,
      kibbeType,
      kibbeConfidence,
      photoQuality,
      isMinor,
      options,
    } = validation.data;

    // Enforce minor restrictions
    const effectiveLevel = isMinor ? 1 : options.level;
    const effectiveOptions: BodyPreviewOptions = {
      ...options,
      level: effectiveLevel as 1 | 2 | 3,
    };

    // Compute hash for caching/determinism
    const imageHash = computeImageHash(frontPhotoBase64);
    const optionsHash = JSON.stringify(effectiveOptions);
    const cacheKey = `body-${imageHash}-${optionsHash}`;
    const seed = getSeedFromHash(imageHash + optionsHash.slice(0, 16));

    // Check cache
    const cachedResult = getCachedResult<BodyPreviewResponse>(cacheKey, ENDPOINT_VERSION);
    if (cachedResult) {
      console.log('Returning cached body preview for hash:', imageHash.slice(0, 8));
      return NextResponse.json(success(cachedResult));
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        error(ErrorCodes.SERVER_ERROR, 'AI service not configured'),
        { status: 500 }
      );
    }

    // Get change budget for this level
    const changeBudget = getChangeBudget(effectiveLevel as 1 | 2 | 3);
    const hasSideView = !!sidePhotoBase64;

    // Build identity-preserving prompt
    const prompt = buildBodyPreviewPrompt(effectiveOptions, changeBudget, isMinor, hasSideView);

    console.log('Generating body preview with seed:', seed);

    // Call Gemini
    const model = getImageGenerationModel();
    const imageParts = [base64ToGenerativePart(frontPhotoBase64, 'image/jpeg')];
    if (sidePhotoBase64) {
      imageParts.push(base64ToGenerativePart(sidePhotoBase64, 'image/jpeg'));
    }
    if (backPhotoBase64) {
      imageParts.push(base64ToGenerativePart(backPhotoBase64, 'image/jpeg'));
    }

    let result;
    try {
      result = await model.generateContent([prompt, ...imageParts]);
    } catch (apiError) {
      console.error('Body preview generation failed:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown';

      if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
        return NextResponse.json(
          error(ErrorCodes.RATE_LIMITED, 'Please wait and try again'),
          { status: 429 }
        );
      }
      if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
        return NextResponse.json(
          error(ErrorCodes.ANALYSIS_FAILED, 'Image blocked by safety filters'),
          { status: 400 }
        );
      }

      return NextResponse.json(
        error(ErrorCodes.SERVER_ERROR, `Preview generation failed: ${errorMessage}`),
        { status: 500 }
      );
    }

    const response = await result.response;
    const text = response.text();

    // Parse response
    let generatedImages: Array<{ imageUrl?: string; description?: string }> = [];
    try {
      const parsed = extractJSON<{ images?: typeof generatedImages }>(text);
      generatedImages = parsed.images || [];
    } catch {
      generatedImages = [{ description: text.slice(0, 200) }];
    }

    // Build preview images array
    const previewImages: PreviewImage[] = generatedImages
      .filter((img) => img.imageUrl)
      .slice(0, effectiveOptions.variations || 1)
      .map((img, idx) => ({
        url: img.imageUrl!,
        seed: seed + idx,
      }));

    // If no actual images generated, return placeholder
    if (previewImages.length === 0) {
      previewImages.push({
        url: '',
        seed,
      });
    }

    // Get style recommendations based on Kibbe type
    const styleRecs = getBodyStyleRecommendations(
      kibbeType as KibbeType | null,
      kibbeConfidence || 0.5
    );

    // Build outfit chips
    const recommendedOutfits: OutfitChip[] = styleRecs.outfits.slice(0, 3).map((outfit) => ({
      label: outfit.label,
      preset: { outfit: outfit.silhouette },
      reason: outfit.suitability,
    }));

    // Calculate reachability
    const reachability = estimateBodyReachability(
      effectiveOptions,
      photoQuality || 0.7,
      hasSideView
    );

    // Describe what changed
    const appliedChanges = describeAppliedChanges(effectiveOptions, 'body');

    // Build disclaimers
    const disclaimers = [
      'Identity-preserving preview. Does not change bone structure or body frame.',
      'Body composition changes shown are estimates based on typical progress rates.',
      'Actual results depend on individual factors, consistency, and genetics.',
    ];
    if (isMinor) {
      disclaimers.push('Minor detected: showing styling and posture improvements only.');
    }
    if (!hasSideView) {
      disclaimers.push('Side view not provided; posture estimates less precise.');
    }
    if (effectiveLevel < options.level) {
      disclaimers.push(`Enhancement level reduced to ${effectiveLevel} for safety.`);
    }

    // Build final response
    const previewResponse: BodyPreviewResponse = {
      images: previewImages,
      disclaimers,
      appliedChanges,
      recommendedOutfits,
      silhouetteTips: styleRecs.silhouetteTips,
      reachability,
    };

    // Cache result
    setCachedResult(cacheKey, ENDPOINT_VERSION, previewResponse);

    return NextResponse.json(success(previewResponse));
  } catch (err) {
    console.error('Body preview error:', err);
    return NextResponse.json(
      error(ErrorCodes.SERVER_ERROR, 'Preview generation failed'),
      { status: 500 }
    );
  }
}

function buildBodyPreviewPrompt(
  options: BodyPreviewOptions,
  changeBudget: ReturnType<typeof getChangeBudget>,
  isMinor: boolean,
  hasSideView: boolean
): string {
  const levelDescriptions = {
    1: 'posture + outfit + lighting only (days to 2 weeks)',
    2: 'moderate recomposition preview (8-16 weeks of consistent effort)',
    3: 'significant but realistic changes (12-40 weeks depending on starting point)',
  };

  const goalDescriptions = {
    get_leaner: 'leaner physique with reduced body fat',
    build_muscle: 'increased muscle mass and tone',
    balanced: 'balanced recomposition (slight fat loss + muscle gain)',
  };

  const outfitDescriptions = {
    fitted_basics: 'clean fitted basics (t-shirt, well-fitted jeans)',
    athleisure: 'athletic/leisure wear (fitted activewear)',
    smart_casual: 'smart casual (button-down, chinos)',
    formal: 'formal attire (blazer, dress shirt)',
  };

  let enhancementInstructions = '';

  // Outfit
  enhancementInstructions += `- Outfit: ${outfitDescriptions[options.outfit]}\n`;

  // Body composition based on budget
  if (changeBudget.bodyComposition === 'presentation_only') {
    enhancementInstructions += '- Body: Presentation/styling only, NO physique changes\n';
  } else if (changeBudget.bodyComposition === 'minor_recomp') {
    enhancementInstructions += `- Body: Subtle ${goalDescriptions[options.goal]} (realistic 8-16 week progress)\n`;
  } else {
    enhancementInstructions += `- Body: ${goalDescriptions[options.goal]} (realistic 12-40 week progress, NOT extreme)\n`;
  }

  // Posture
  if (options.postureFocus === 'improve_posture' && changeBudget.posture !== 'none') {
    if (hasSideView) {
      enhancementInstructions += '- Posture: Improved alignment (shoulders back, neutral spine)\n';
    } else {
      enhancementInstructions += '- Posture: Subtle improvement (limited by no side view reference)\n';
    }
  }

  enhancementInstructions += '- Lighting: Optimized for clarity and natural presentation\n';

  const minorNote = isMinor
    ? '\nIMPORTANT: Subject appears to be a minor. Only apply styling and posture improvements. NO body composition or attractiveness-focused changes.'
    : '';

  return `You are an identity-preserving body visualization AI. Generate a "best version" preview of this person.

CRITICAL CONSTRAINTS (MUST FOLLOW):
1. PRESERVE IDENTITY: Same person, same body frame. Do NOT change:
   - Bone structure or skeletal frame
   - Height
   - Natural body proportions
   - Fundamental shape
2. NO "DIFFERENT PERSON": The output must be the same individual
3. NO IMPOSSIBLE TRANSFORMATIONS: Changes must be achievable naturally
4. ONLY MODIFY as specified below

Enhancement Level: ${options.level} (${levelDescriptions[options.level]})

ALLOWED CHANGES FOR THIS LEVEL:
${enhancementInstructions}
${minorNote}

REALISM CONSTRAINTS:
- Fat loss: Show ~0.5-1% bodyweight/week equivalent (not extreme)
- Muscle gain: Show 8-24 weeks of novice/intermediate progress (not bodybuilder)
- Maintain natural proportions and frame size

Generate a realistic preview showing what this person could look like with these achievable improvements.

Return JSON:
{
  "images": [
    {
      "imageUrl": "base64_encoded_image_data",
      "description": "Brief description of changes applied"
    }
  ]
}

Return ONLY valid JSON.`;
}
