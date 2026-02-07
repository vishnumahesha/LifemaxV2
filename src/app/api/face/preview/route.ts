import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getImageGenerationModel, base64ToGenerativePart, extractJSON, extractImageFromResponse } from '@/lib/gemini';
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

// Request schema following spec - made more lenient for client compatibility
const requestSchema = z.object({
  frontPhotoBase64: z.string().min(100),
  sidePhotoBase64: z.string().min(100).optional().nullable(),
  faceShape: z.enum(['oval', 'round', 'square', 'heart', 'diamond', 'oblong']).optional().nullable(),
  faceShapeConfidence: z.number().min(0).max(1).optional().nullable(),
  photoQuality: z.number().min(0).max(1).optional().nullable(),
  currentHairLength: z.enum(['short', 'medium', 'long']).optional().nullable(),
  isMinor: z.boolean().optional().nullable(),
  options: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    hairstyle: z.object({
      length: z.enum(['short', 'medium', 'long']),
      finish: z.enum(['textured', 'clean']),
    }).optional(),
    glasses: z.object({
      enabled: z.boolean(),
      style: z.enum(['round', 'rectangular', 'browline', 'aviator', 'geometric']).optional().nullable(),
    }).optional(),
    grooming: z.object({
      facialHair: z.enum(['none', 'stubble', 'trimmed']).optional().nullable(),
      brows: z.enum(['natural', 'cleaned']).optional().nullable(),
    }).optional().nullable(),
    lighting: z.enum(['neutral_soft', 'studio_soft', 'outdoor_shade']).optional().nullable(),
  }).optional(),
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

    // Normalize null values to undefined or defaults
    const normalizedFaceShape = faceShape || undefined;
    const normalizedFaceShapeConfidence = faceShapeConfidence ?? 0.7;
    const normalizedPhotoQuality = photoQuality ?? 0.7;
    const normalizedCurrentHairLength = currentHairLength || 'short';
    const normalizedIsMinor = isMinor ?? false;

    // Provide defaults for options
    const safeOptions = options || {};
    const requestedLevel = safeOptions.level || 2;

    // Normalize glasses (convert null style to undefined)
    const normalizedGlasses = safeOptions.glasses
      ? {
          enabled: safeOptions.glasses.enabled,
          style: safeOptions.glasses.style || undefined,
        }
      : { enabled: false };

    // Normalize grooming (convert null values to undefined)
    const normalizedGrooming = safeOptions.grooming
      ? {
          facialHair: safeOptions.grooming.facialHair || undefined,
          brows: safeOptions.grooming.brows || undefined,
        }
      : undefined;

    // Normalize lighting (convert null to undefined)
    const normalizedLighting = safeOptions.lighting || undefined;

    // Enforce minor restrictions
    const effectiveLevel = normalizedIsMinor ? 1 : requestedLevel;
    const effectiveOptions: FacePreviewOptions = {
      level: effectiveLevel as 1 | 2 | 3,
      hairstyle: safeOptions.hairstyle || { length: 'short', finish: 'textured' },
      glasses: normalizedGlasses,
      grooming: normalizedGrooming,
      lighting: normalizedLighting,
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
    const prompt = buildPreviewPrompt(effectiveOptions, changeBudget, normalizedIsMinor);

    console.log('Generating face preview with seed:', seed);

    // Call Gemini
    const model = getImageGenerationModel();
    const imageParts = [base64ToGenerativePart(frontPhotoBase64, 'image/jpeg')];
    if (sidePhotoBase64 && sidePhotoBase64.length > 100) {
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
    
    // First, try to extract image directly from response parts (Gemini image gen format)
    const generatedImageUrl = extractImageFromResponse(response);
    
    console.log('Generated image URL exists:', !!generatedImageUrl);
    
    // Build preview images array
    const previewImages: PreviewImage[] = [];
    
    if (generatedImageUrl) {
      previewImages.push({
        url: generatedImageUrl,
        seed,
      });
    } else {
      // Fallback: try parsing JSON from text response
      try {
        const text = response.text();
        console.log('Response text (first 500 chars):', text.slice(0, 500));
        const parsed = extractJSON<{ images?: Array<{ imageUrl?: string }> }>(text);
        if (parsed.images) {
          parsed.images.forEach((img, idx) => {
            if (img.imageUrl) {
              previewImages.push({
                url: img.imageUrl,
                seed: seed + idx,
              });
            }
          });
        }
      } catch (parseError) {
        console.log('No JSON images in response');
      }
    }

    // If no actual images generated, return placeholder message
    if (previewImages.length === 0) {
      previewImages.push({
        url: '', // Would be actual generated image URL
        seed,
      });
    }

    // Get style recommendations
    const styleRecs = getFaceStyleRecommendations(
      normalizedFaceShape || 'oval',
      normalizedFaceShapeConfidence
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
      normalizedCurrentHairLength,
      normalizedPhotoQuality
    );

    // Describe what changed
    const appliedChanges = describeAppliedChanges(effectiveOptions, 'face');

    // Build disclaimers
    const disclaimers = [
      'Identity-preserving preview. Does not change bone structure, jaw, nose, or eye shape.',
      'Estimated timelines are ranges and vary by individual.',
    ];
    if (normalizedIsMinor) {
      disclaimers.push('Minor detected: showing subtle styling improvements only.');
    }
    if (effectiveLevel < requestedLevel) {
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

  return `You are a photo retouching AI that makes MINIMAL edits while preserving the person's identity.

ABSOLUTE RULES - VIOLATING ANY = FAILURE:
1. This MUST be the EXACT SAME PERSON - not a similar looking person, THE SAME person
2. NEVER change: face shape, jaw, chin, nose, eyes, eyebrows shape, forehead, cheekbones, ears, face width, face length
3. NEVER change: skin color, ethnicity, age appearance, gender presentation
4. NEVER make the person look like a model or celebrity
5. The person's friends and family MUST be able to recognize them instantly

WHAT YOU CAN CHANGE (and ONLY these):
${enhancementInstructions}

Enhancement Level: ${options.level} (${levelDescriptions[options.level]})
${minorNote}

TECHNIQUE:
- Think of this as a professional photo retouch, NOT a transformation
- Use the EXACT same face from the input photo
- Only modify hair styling, lighting, and minor skin clarity
- Keep the same camera angle and perspective
- The output should look like a better photo of the same person on a good day

OUTPUT: Generate the enhanced image. The image must pass this test: "Is this clearly the same person as the input photo?" If no, you've failed.`;
}
