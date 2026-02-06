import { NextRequest, NextResponse } from 'next/server';
import { getTextModel, extractJSON } from '@/lib/gemini';
import { success, error, ErrorCodes } from '@/types/api';
import type { ActionPlan } from '@/types/database';
import { buildActionPlanPrompt } from '@/lib/prompts/action-plan';
import { z } from 'zod';

const requestSchema = z.object({
  stats: z.object({
    height: z.string(),
    weight: z.string(),
    age: z.number().optional(),
    activityLevel: z.string().optional(),
  }),
  goal: z.string(),
  targetAreas: z.array(z.string()).optional(),
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

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

    const { stats, goal, targetAreas } = validation.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        error(ErrorCodes.SERVER_ERROR, 'AI service not configured. Please add GEMINI_API_KEY.'),
        { status: 500 }
      );
    }

    console.log('Starting action plan generation...');

    const prompt = buildActionPlanPrompt({
      height: stats.height,
      weight: stats.weight,
      age: stats.age,
      activityLevel: stats.activityLevel,
      goal,
      targetAreas,
    });

    console.log('Calling Gemini API...');
    const model = getTextModel();
    
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
        return NextResponse.json(
          error(ErrorCodes.SERVER_ERROR, 'Invalid API key. Please check your GEMINI_API_KEY configuration.'),
          { status: 500 }
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
        return NextResponse.json(
          error(ErrorCodes.RATE_LIMITED, 'API rate limit reached. Please wait a minute and try again.'),
          { status: 429 }
        );
      }

      return NextResponse.json(
        error(ErrorCodes.SERVER_ERROR, `AI service error: ${errorMessage}`),
        { status: 500 }
      );
    }
    
    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini, length:', text.length);

    let planData: ActionPlan;
    try {
      const rawData = extractJSON<Record<string, unknown>>(text);
      
      // Map the response to our ActionPlan format
      planData = {
        id: '',
        userId: '',
        workoutPlan: rawData.workoutPlan as ActionPlan['workoutPlan'],
        nutritionTargets: rawData.nutritionTargets as ActionPlan['nutritionTargets'],
        summary: rawData.summary as string,
        createdAt: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error('Failed to parse action plan:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      return NextResponse.json(
        error(ErrorCodes.GENERATION_FAILED, 'Failed to generate action plan. Please try again.'),
        { status: 500 }
      );
    }

    console.log('Action plan generated!');
    return NextResponse.json(success(planData));

  } catch (err) {
    console.error('Action plan error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      error(ErrorCodes.SERVER_ERROR, `Failed to generate action plan: ${errorMessage}`),
      { status: 500 }
    );
  }
}
