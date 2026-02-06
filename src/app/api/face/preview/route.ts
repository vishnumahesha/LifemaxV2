import { NextRequest, NextResponse } from 'next/server';
import { getVisionModel, getImageGenerationModel, base64ToGenerativePart, extractJSON } from '@/lib/gemini';
import { success, error, ErrorCodes } from '@/types/api';
import { z } from 'zod';

const requestSchema = z.object({
  photoBase64: z.string(),
  settings: z.object({
    hairstyle: z.string(),
    glasses: z.string(),
    enhancement: z.number().min(1).max(10),
  }),
});

interface PreviewResponse {
  images: Array<{
    imageUrl: string;
    description: string;
  }>;
}

export const maxDuration = 120; // Image generation can take longer

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        error(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', {
          errors: validation.error.flatten().fieldErrors
        }),
        { status: 400 }
      );
    }

    const { photoBase64, settings } = validation.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        error(ErrorCodes.SERVER_ERROR, 'AI service not configured. Please add GEMINI_API_KEY.'),
        { status: 500 }
      );
    }

    console.log('Starting best version generation...');

    // First, analyze the face to get details
    const analysisPrompt = `Analyze this face photo and provide a detailed description for image generation.

Describe:
1. The person's apparent gender, age range, ethnicity
2. Face shape (oval, round, square, heart, etc.)
3. Current hairstyle (color, length, texture, style)
4. Eye color and shape
5. Any distinctive features
6. Current makeup/grooming style if visible

Return a JSON with:
{
  "gender": "male/female",
  "ageRange": "20s/30s/etc",
  "faceShape": "oval/round/etc",
  "currentHair": "description",
  "eyeColor": "color",
  "skinTone": "description",
  "distinctiveFeatures": ["list"],
  "currentStyle": "description"
}

Return ONLY valid JSON.`;

    const imagePart = base64ToGenerativePart(photoBase64, 'image/jpeg');
    const visionModel = getVisionModel();
    
    let faceAnalysis;
    try {
      const analysisResult = await visionModel.generateContent([analysisPrompt, imagePart]);
      const analysisText = analysisResult.response.text();
      faceAnalysis = extractJSON<{
        gender: string;
        ageRange: string;
        faceShape: string;
        currentHair: string;
        eyeColor: string;
        skinTone: string;
        distinctiveFeatures: string[];
        currentStyle: string;
      }>(analysisText);
      console.log('Face analysis complete:', faceAnalysis);
    } catch (analysisError) {
      console.error('Face analysis failed:', analysisError);
      // Continue with default values
      faceAnalysis = {
        gender: 'person',
        ageRange: 'adult',
        faceShape: 'oval',
        currentHair: 'natural hair',
        eyeColor: 'natural',
        skinTone: 'natural',
        distinctiveFeatures: [],
        currentStyle: 'natural'
      };
    }

    // Build the image generation prompt
    const hairstyleDescriptions: Record<string, string> = {
      'current': faceAnalysis.currentHair,
      'optimized': `professionally styled ${faceAnalysis.currentHair} that perfectly frames a ${faceAnalysis.faceShape} face`,
      'short': 'stylish short haircut with clean edges and modern texture',
      'medium': 'elegant medium-length hair with soft layers and movement',
      'long': 'flowing long hair with healthy shine and gentle waves',
    };

    const glassesDescriptions: Record<string, string> = {
      'none': 'no glasses',
      'current': 'current eyewear style',
      'minimal': 'sleek minimalist thin-framed glasses',
      'bold': 'stylish bold-framed designer glasses',
    };

    const enhancementLevel = settings.enhancement <= 3 ? 'subtle natural' : 
                            settings.enhancement <= 6 ? 'moderate' : 'noticeable';

    const imagePrompt = `Generate a photorealistic portrait of a ${faceAnalysis.gender} in their ${faceAnalysis.ageRange} with ${faceAnalysis.faceShape} face shape, ${faceAnalysis.skinTone} skin, and ${faceAnalysis.eyeColor} eyes.

Key features to include:
- ${hairstyleDescriptions[settings.hairstyle] || 'stylish modern haircut'}
- ${glassesDescriptions[settings.glasses] || 'no glasses'}
- ${enhancementLevel} beauty enhancement: clear glowing skin, well-groomed appearance
- Professional headshot style, soft studio lighting
- Confident, approachable expression
- High-end fashion magazine quality

The person should look like an enhanced, more polished version of themselves - NOT a different person.
Keep their distinctive features: ${faceAnalysis.distinctiveFeatures.join(', ') || 'natural features'}.

Style: Professional headshot, editorial quality, natural but polished look.`;

    console.log('Attempting image generation...');
    
    // Try image generation
    let generatedImageUrl: string | null = null;
    let description = '';
    
    try {
      const imageModel = getImageGenerationModel();
      
      // Try to generate with the image as reference
      const imageResult = await imageModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: imagePrompt },
            imagePart
          ]
        }],
        generationConfig: {
          // @ts-ignore - responseModalities is a valid config for image generation
          responseModalities: ['image', 'text'],
        }
      });
      
      const response = imageResult.response;
      
      // Check for generated image in response
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
          // @ts-ignore - inlineData might be present
          if (part.inlineData?.data) {
            // @ts-ignore
            const mimeType = part.inlineData.mimeType || 'image/png';
            // @ts-ignore
            generatedImageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            console.log('Generated image successfully!');
            break;
          }
          // @ts-ignore
          if (part.text) {
            // @ts-ignore
            description = part.text;
          }
        }
      }
    } catch (genError) {
      console.error('Image generation failed:', genError);
      const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
      
      if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
        return NextResponse.json(
          error(ErrorCodes.RATE_LIMITED, 'API rate limit reached. Please wait a minute and try again.'),
          { status: 429 }
        );
      }
      
      // Fall back to text description
      console.log('Falling back to text description...');
    }

    // If image generation failed, provide detailed recommendations
    if (!generatedImageUrl) {
      console.log('No image generated, providing text recommendations...');
      
      const recommendationPrompt = `Based on this face photo, provide specific styling recommendations for their "best version".

Settings:
- Hairstyle: ${settings.hairstyle}
- Glasses: ${settings.glasses}  
- Enhancement level: ${settings.enhancement}/10

Provide a detailed, encouraging description of how they would look with optimal styling.
Focus on: hairstyle changes, grooming, skincare improvements, and overall presentation.
Do NOT suggest bone structure or surgical changes.

Return a single paragraph description (2-3 sentences) of their enhanced look.`;

      try {
        const recResult = await visionModel.generateContent([recommendationPrompt, imagePart]);
        description = recResult.response.text();
      } catch (e) {
        description = `Your best version with ${settings.hairstyle} hairstyle styling and ${settings.glasses === 'none' ? 'no glasses' : settings.glasses + ' frames'}. With the right grooming and presentation, you can enhance your natural features beautifully.`;
      }
    }

    const previewResponse: PreviewResponse = {
      images: [{
        imageUrl: generatedImageUrl || photoBase64,
        description: description || `Enhanced look with ${settings.hairstyle} hairstyle and optimized styling.`
      }]
    };

    console.log('Preview complete!', generatedImageUrl ? 'With generated image' : 'Text only');
    return NextResponse.json(success(previewResponse));

  } catch (err) {
    console.error('Preview generation error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return NextResponse.json(
        error(ErrorCodes.RATE_LIMITED, 'API rate limit reached. Please wait a minute and try again.'),
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      error(ErrorCodes.SERVER_ERROR, `Failed to generate preview: ${errorMessage}`),
      { status: 500 }
    );
  }
}
