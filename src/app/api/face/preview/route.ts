import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getImageGenerationModel, base64ToGenerativePart, extractJSON } from '@/lib/gemini';
import { success, error, ErrorCodes } from '@/types/api';
import { computeImageHash, getSeedFromHash, getCachedResult, setCachedResult } from '@/lib/scoring';
import { getFaceStyleRecommendations } from '@/lib/style-library';
import { 
  estimateFaceReachability, 
  getChangeBudget, 
  describeAppliedChanges,
  type FacePreviewOptions 
} from '@/lib/reachability';

export const maxDuration = 60;

const ENDPOINT_VERSION = '2.0.0';

// Request schema following spec
const requestSchema = z.object({
  frontPhotoBase64: z.string().min(100),
  sidePhotoBase64: z.string().optional(),
  faceShape: z.enum(['oval', 'round', 'square', 'heart', 'diamond', 'oblong']).optional(),
  faceShapeConfidence: z.number().min(0).max(1).optional().default(0.7),
  photoQuality: z.number().min(0).max(1).optional().default(0.7),
  currentHairLength: z.enum(['short', 'medium', 'long']).optional().default('short'),
  isMinor: z.boolean().optional().default(false),
  options: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    hairstyle: z.object({
      length: z.enum(['short', 'medium', 'long']),
      finish: z.enum(['textured', 'clean']),
    }),
    glasses: z.object({
      enabled: z.boolean(),
      style: z.enum(['round', 'rectangular', 'browline', 'aviator', 'geometric']).optional(),
    }),
    grooming: z.object({
      facialHair: z.enum(['none', 'stubble', 'trimmed']).optional(),
      brows: z.enum(['natural', 'cleaned']).optional(),
    }).optional(),
    lighting: z.enum(['neutral_soft', 'studio_soft', 'outdoor_shade']).optional(),
  }),
});

// Response types
interface PreviewImage {
  url: string;
  seed: number;
}

interface HairstyleChip {
  label: string;
  preset: {
    length: 'short' | 'medium' | 'long';
    finish: 'textured' | 'clean';
  };
  reason: string;
}

interface GlassesChip {
  label: string;
  preset: {
    style: 'round' | 'rectangular' | 'browline' | 'aviator' | 'geometric';
  };
  reason: string;
}

interface PreviewResponse {
  images: PreviewImage[];
  disclaimers: string[];
  appliedChanges: string[];
  recommendedOptions: {
    hairstyleChips: HairstyleChip[];
    glassesChips: GlassesChip[];
  };
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
      faceShape,
      faceShapeConfidence,
      photoQuality,
      currentHairLength,
      isMinor,
      options,
    } = validation.data;

    // Enforce minor restrictions
    const effectiveLevel = isMinor ? 1 : options.level;
    const effectiveOptions: FacePreviewOptions = {
      ...options,
      level: effectiveLevel as 1 | 2 | 3,
    };

    // Compute hash for caching/determinism
    const imageHash = computeImageHash(frontPhotoBase64);
    const optionsHash = JSON.stringify(effectiveOptions);
    const cacheKey = `${imageHash}-${optionsHash}`;
    const seed = getSeedFromHash(imageHash + optionsHash.slice(0, 16));

    // Check cache
    const cachedResult = getCachedResult<PreviewResponse>(cacheKey, ENDPOINT_VERSION);
    if (cachedResult) {
      console.log('Returning cached preview for hash:', imageHash.slice(0, 8));
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

    // Build identity-preserving prompt
    const prompt = buildPreviewPrompt(effectiveOptions, changeBudget, isMinor);

    console.log('Generating face preview with seed:', seed);

    // Call Gemini
    const model = getImageGenerationModel();
    const imageParts = [base64ToGenerativePart(frontPhotoBase64, 'image/jpeg')];
    if (sidePhotoBase64) {
      imageParts.push(base64ToGenerativePart(sidePhotoBase64, 'image/jpeg'));
    }

    let result;
    try {
      result = await model.generateContent([prompt, ...imageParts]);
    } catch (apiError) {
      console.error('Preview generation failed:', apiError);
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
      // If no JSON, treat as description only
      generatedImages = [{ description: text.slice(0, 200) }];
    }

    // Build preview images array
    const previewImages: PreviewImage[] = generatedImages
      .filter((img) => img.imageUrl)
      .map((img, idx) => ({
        url: img.imageUrl!,
        seed: seed + idx,
      }));

    // If no actual images generated, return placeholder message
    if (previewImages.length === 0) {
      previewImages.push({
        url: '', // Would be actual generated image URL
        seed,
      });
    }

    // Get style recommendations
    const styleRecs = getFaceStyleRecommendations(
      faceShape || 'oval',
      faceShapeConfidence || 0.7
    );

    // Build recommendation chips
    const hairstyleChips: HairstyleChip[] = styleRecs.haircuts.slice(0, 3).map((cut) => ({
      label: cut.label,
      preset: {
        length: cut.length,
        finish: cut.finish,
      },
      reason: cut.suitability,
    }));

    const glassesChips: GlassesChip[] = styleRecs.glasses.slice(0, 3).map((g) => ({
      label: g.label,
      preset: { style: g.style },
      reason: g.suitability,
    }));

    // Calculate reachability
    const reachability = estimateFaceReachability(
      effectiveOptions,
      currentHairLength || 'short',
      photoQuality || 0.7
    );

    // Describe what changed
    const appliedChanges = describeAppliedChanges(effectiveOptions, 'face');

    // Build disclaimers
    const disclaimers = [
      'Identity-preserving preview. Does not change bone structure, jaw, nose, or eye shape.',
      'Estimated timelines are ranges and vary by individual.',
    ];
    if (isMinor) {
      disclaimers.push('Minor detected: showing subtle styling improvements only.');
    }
    if (effectiveLevel < options.level) {
      disclaimers.push(`Enhancement level reduced to ${effectiveLevel} for safety.`);
    }

    // Build final response
    const previewResponse: PreviewResponse = {
      images: previewImages,
      disclaimers,
      appliedChanges,
      recommendedOptions: {
        hairstyleChips,
        glassesChips,
      },
      reachability,
    };

    // Cache result
    setCachedResult(cacheKey, ENDPOINT_VERSION, previewResponse);

    return NextResponse.json(success(previewResponse));
  } catch (err) {
    console.error('Face preview error:', err);
    return NextResponse.json(
      error(ErrorCodes.SERVER_ERROR, 'Preview generation failed'),
      { status: 500 }
    );
  }
}

function buildPreviewPrompt(
  options: FacePreviewOptions,
  changeBudget: ReturnType<typeof getChangeBudget>,
  isMinor: boolean
): string {
  const levelDescriptions = {
    1: 'subtle same-day improvements only (hair tidy, lighting, minor cleanup)',
    2: 'moderate realistic changes achievable in weeks/months (new haircut, consistent grooming, clearer skin)',
    3: 'maximum realistic modifiable factors (still identity-preserving, months of consistent effort)',
  };

  let enhancementInstructions = '';
  
  if (changeBudget.hair === 'tidy_only') {
    enhancementInstructions += '- Hair: Only tidy and shape existing hair, no dramatic length change\n';
  } else if (changeBudget.hair === 'minor_cut') {
    enhancementInstructions += `- Hair: Show a ${options.hairstyle.length} length ${options.hairstyle.finish} style (plausible within one haircut session)\n`;
  } else {
    enhancementInstructions += `- Hair: Show a complete ${options.hairstyle.length} ${options.hairstyle.finish} style transformation\n`;
  }

  if (changeBudget.skin === 'lighting_only') {
    enhancementInstructions += '- Skin: Improve lighting/exposure only, no texture changes\n';
  } else if (changeBudget.skin === 'minor_clarity') {
    enhancementInstructions += '- Skin: Subtle clarity improvement, still show natural texture and pores\n';
  } else {
    enhancementInstructions += '- Skin: Clearer complexion but MUST preserve natural skin texture (no porcelain blur)\n';
  }

  if (options.glasses.enabled && options.glasses.style) {
    enhancementInstructions += `- Glasses: Add ${options.glasses.style} frame glasses\n`;
  }

  if (options.grooming?.facialHair && options.grooming.facialHair !== 'none') {
    enhancementInstructions += `- Facial hair: ${options.grooming.facialHair}\n`;
  }
  if (options.grooming?.brows === 'cleaned') {
    enhancementInstructions += '- Eyebrows: Cleaned and tidied\n';
  }

  if (options.lighting) {
    const lightingMap: Record<string, string> = {
      neutral_soft: 'soft neutral lighting',
      studio_soft: 'studio-quality soft lighting',
      outdoor_shade: 'natural outdoor shade lighting',
    };
    enhancementInstructions += `- Lighting: ${lightingMap[options.lighting]}\n`;
  }

  const minorNote = isMinor
    ? '\nIMPORTANT: Subject appears to be a minor. Only apply subtle styling/grooming improvements. No attractiveness-focused changes.'
    : '';

  return `You are an identity-preserving image enhancement AI. Generate a "best version" preview of this person.

CRITICAL CONSTRAINTS (MUST FOLLOW):
1. PRESERVE IDENTITY: Same person, same face. Do NOT change:
   - Bone structure
   - Jaw shape or width
   - Nose size or shape
   - Eye shape
   - Skull shape
   - Any anatomical features
2. NO "DIFFERENT PERSON": The output must be recognizably the same individual
3. ONLY MODIFY MODIFIABLE FACTORS as specified below

Enhancement Level: ${options.level} (${levelDescriptions[options.level]})

ALLOWED CHANGES FOR THIS LEVEL:
${enhancementInstructions}
${minorNote}

ANGLE: Eye-level only, no distorting angles.

Generate a realistic preview showing what this person could look like with these modifiable improvements.

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
