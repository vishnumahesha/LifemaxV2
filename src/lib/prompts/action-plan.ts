// Action Plan Generation Prompt for Gemini API
// Returns deterministic workout + nutrition plan

export const ACTION_PLAN_SYSTEM_PROMPT = `You are an expert fitness and nutrition coach. Generate a personalized workout plan and nutrition targets based on user stats and goals.

CRITICAL RULES:
1. This is aesthetics and fitness guidance, NOT medical advice
2. Never suggest extreme caloric deficits (no less than 1200 for most)
3. Prioritize sustainable, healthy approaches
4. Scale difficulty to experience level
5. Focus on aesthetic priorities from target areas if specified

NUTRITION PRINCIPLES:
- Protein: 0.7-1g per pound bodyweight for muscle goals, slightly less for maintenance
- Deficit for fat loss: 300-500 calories below maintenance
- Surplus for muscle: 200-300 calories above maintenance
- Fiber: 25-35g daily
- Adjust macros based on goal`;

export function buildActionPlanPrompt(params: {
  height: string;
  weight: string;
  age?: number;
  activityLevel?: string;
  goal: string;
  targetAreas?: string[];
}): string {
  const { height, weight, age, activityLevel, goal, targetAreas } = params;
  
  const goalDescriptions: Record<string, string> = {
    fat_loss: 'Lose body fat while preserving muscle',
    muscle_gain: 'Build muscle mass with minimal fat gain',
    body_recomp: 'Simultaneous fat loss and muscle gain (body recomposition)',
    maintenance: 'Maintain current physique',
  };

  const activityDescriptions: Record<string, string> = {
    sedentary: 'Little to no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very hard exercise & physical job',
  };

  return `${ACTION_PLAN_SYSTEM_PROMPT}

USER STATS:
- Height: ${height}
- Weight: ${weight}
- Age: ${age || 'Not specified'}
- Activity Level: ${activityDescriptions[activityLevel || 'moderate'] || activityLevel || 'Moderate'}
- Goal: ${goalDescriptions[goal] || goal}

${targetAreas?.length ? `FOCUS AREAS:\n${targetAreas.map(a => `- ${a}`).join('\n')}` : ''}

Generate a JSON response with this EXACT structure:
{
  "nutrition": {
    "calories": number (daily target),
    "protein": number (grams),
    "carbs": number (grams),
    "fats": number (grams),
    "fiber": number (grams, typically 25-35)
  },
  "workout": {
    "split": "Push/Pull/Legs" | "Upper/Lower" | "Full Body",
    "daysPerWeek": number (3-6),
    "emphasis": ["area1", "area2"] (focus areas),
    "days": [
      {
        "name": "Day 1 - Push",
        "focus": "Chest, Shoulders, Triceps",
        "exercises": [
          {
            "name": "Exercise name",
            "sets": 3,
            "reps": "8-12",
            "notes": "optional form tip"
          }
        ]
      }
    ],
    "notes": ["tip1", "tip2"] (training guidance)
  },
  "priorityAreas": ["area1", "area2", "area3"],
  "timeline": "Expected timeline for visible results (e.g., '8-12 weeks')"
}

WORKOUT GUIDELINES:
- Include 3-5 workout days with 4-6 exercises each
- Focus on compound movements
- Mix in targeted exercises for focus areas
- Include both upper and lower body balance

NUTRITION GUIDELINES:
- Base calories on goal (deficit for fat loss, surplus for muscle)
- High protein for all goals
- Adjust carbs/fats based on preference

Return ONLY valid JSON, no markdown formatting.`;
}
