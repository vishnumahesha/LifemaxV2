import { NextRequest, NextResponse } from 'next/server';
import { getVisionModel, base64ToGenerativePart, extractJSON } from '@/lib/gemini';
import { faceScanRequestSchema, faceAnalysisResultSchema } from '@/lib/validations/face';
import { success, error, ErrorCodes } from '@/types/api';
import type { FaceAnalysisResult } from '@/types/face';
import { buildFaceAnalysisPrompt } from '@/lib/prompts/face-analysis';

export const maxDuration = 60; // Allow up to 60 seconds for AI processing

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validation = faceScanRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        error(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { frontPhotoBase64, sidePhotoBase64 } = validation.data;

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        error(
          ErrorCodes.SERVER_ERROR,
          'AI service not configured. Please add GEMINI_API_KEY to environment variables.'
        ),
        { status: 500 }
      );
    }

    console.log('Starting face analysis...');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('Front photo size:', frontPhotoBase64.length);

    // Build prompt
    const prompt = buildFaceAnalysisPrompt(!!sidePhotoBase64);

    // Prepare image parts
    const imageParts = [
      base64ToGenerativePart(frontPhotoBase64, 'image/jpeg'),
    ];

    if (sidePhotoBase64) {
      imageParts.push(base64ToGenerativePart(sidePhotoBase64, 'image/jpeg'));
    }

    // Call Gemini API
    console.log('Calling Gemini API...');
    const model = getVisionModel();
    
    let result;
    try {
      result = await model.generateContent([prompt, ...imageParts]);
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      
      // Check for specific error types
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
        return NextResponse.json(
          error(
            ErrorCodes.SERVER_ERROR,
            'Invalid API key. Please check your GEMINI_API_KEY configuration.'
          ),
          { status: 500 }
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
        return NextResponse.json(
          error(
            ErrorCodes.RATE_LIMITED,
            'API rate limit reached. Please wait a minute and try again.'
          ),
          { status: 429 }
        );
      }
      
      if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
        return NextResponse.json(
          error(
            ErrorCodes.ANALYSIS_FAILED,
            'Image was blocked by safety filters. Please try a different photo.'
          ),
          { status: 400 }
        );
      }

      return NextResponse.json(
        error(
          ErrorCodes.SERVER_ERROR,
          `AI service error: ${errorMessage}`
        ),
        { status: 500 }
      );
    }
    
    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini, length:', text.length);

    // Parse JSON response
    let analysisData: FaceAnalysisResult;
    try {
      const rawData = extractJSON<FaceAnalysisResult & { isMinor?: boolean }>(text);
      
      // Remove isMinor from the response (we handle it internally)
      const isMinor = rawData.isMinor;
      
      // If minor detected, sanitize the response
      if (isMinor) {
        if (rawData.appearanceProfile) {
          rawData.appearanceProfile.dimorphismScore10 = undefined;
          rawData.appearanceProfile.masculinityFemininity = undefined;
        }
      }
      
      // Validate with zod
      const validated = faceAnalysisResultSchema.safeParse(rawData);
      
      if (!validated.success) {
        console.error('Validation errors:', validated.error.flatten());
        // Try to use the raw data anyway with some defaults
        analysisData = rawData;
      } else {
        analysisData = validated.data;
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      return NextResponse.json(
        error(
          ErrorCodes.ANALYSIS_FAILED,
          'Failed to process AI response. Please try again.'
        ),
        { status: 500 }
      );
    }

    // Check photo quality
    if (analysisData.photoQuality.score < 0.3) {
      return NextResponse.json(
        error(
          ErrorCodes.PHOTO_QUALITY_TOO_LOW,
          'Photo quality is too low for accurate analysis. Please retake with better lighting and ensure your face is clearly visible.',
          { issues: analysisData.photoQuality.issues }
        ),
        { status: 400 }
      );
    }

    // If photo quality is marginal, add warning to response
    if (analysisData.photoQuality.score < 0.6) {
      // Widen confidence intervals and reduce confidence scores
      analysisData.overall.confidence = Math.min(analysisData.overall.confidence, 0.6);
      analysisData.overall.potentialRange.min = Math.max(
        analysisData.overall.currentScore10 - 1.5,
        1
      );
      analysisData.overall.potentialRange.max = Math.min(
        analysisData.overall.currentScore10 + 2,
        10
      );
    }

    console.log('Analysis complete!');
    return NextResponse.json(success(analysisData));

  } catch (err) {
    console.error('Face scan error:', err);
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    return NextResponse.json(
      error(
        ErrorCodes.SERVER_ERROR,
        `An unexpected error occurred: ${errorMessage}`
      ),
      { status: 500 }
    );
  }
}
