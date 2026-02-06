// Prompts for meal photo analysis

export function getMealScanPrompt(userNotes?: string): string {
  const notesSection = userNotes
    ? `
USER PROVIDED DETAILS:
"${userNotes}"

Use these details to improve your estimates. If the user mentions:
- Specific ingredients: use them to refine item detection
- Cooking method: adjust calorie estimates (e.g., "fried in oil" adds calories)
- Portion counts: use exact counts instead of guessing
- Restaurant/brand: look up typical nutritional info for that source
- Sauces/oils: include them in the estimate

Label any assumptions you make based on or despite the user's notes.
`
    : '';

  return `You are a nutrition analysis AI. Analyze this meal photo and provide STRICT JSON output.

CRITICAL RULES:
1. Detect 1-6 food items maximum. If more items visible, group similar items.
2. Provide RANGES for all macros to reflect uncertainty.
3. Use grams (g) as the primary portion unit.
4. Confidence scores must be honest (0.0-1.0):
   - 0.8+ = clear item, standard portion
   - 0.5-0.8 = item identified but portion uncertain
   - <0.5 = guessing based on visual cues
5. List all assumptions (sauces, oils, cooking method guesses).
6. If photo quality is poor, widen ranges significantly.
${notesSection}
REQUIRED JSON OUTPUT FORMAT:
{
  "photoQuality": {
    "score": 0.0-1.0,
    "issues": ["list any issues like blur, lighting, partial view"]
  },
  "detectedItems": [
    {
      "name": "Food item name",
      "portion": {
        "gRange": [minGrams, maxGrams],
        "unitHints": ["optional serving descriptions like '1 medium', '1 cup'"]
      },
      "macros": {
        "caloriesRange": [min, max],
        "proteinGRange": [min, max],
        "carbsGRange": [min, max],
        "fatsGRange": [min, max],
        "fiberGRange": [min, max]
      },
      "confidence": 0.0-1.0,
      "assumptions": ["list any assumptions made for this item"]
    }
  ],
  "mealConfidence": 0.0-1.0,
  "warnings": ["any warnings about the estimate"]
}

PORTION ESTIMATION GUIDELINES:
- Use standard serving sizes as baseline
- Estimate based on plate/bowl size reference if visible
- When uncertain, widen the gram range (e.g., 80-150g instead of 100g)
- Common references:
  - Palm-sized meat: ~85-115g
  - Fist of rice/pasta: ~150-200g cooked
  - Thumb of oil/butter: ~14g
  - Standard slice of bread: ~30-40g

MACRO ACCURACY:
- Base macros on USDA/standard nutritional databases
- Account for cooking method (frying adds fat, etc.)
- Include visible sauces, dressings, oils in estimates
- If item has breading/coating, add appropriate carbs/fats

Return ONLY the JSON object, no additional text.`;
}

export function getFoodValidationPrompt(): string {
  return `Analyze this image and determine if it shows FOOD suitable for calorie tracking.

Return STRICT JSON:
{
  "isFood": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

ACCEPT:
- Meals, snacks, drinks (except plain water)
- Individual food items
- Food packaging with visible food

REJECT:
- Selfies or people (no faces)
- Non-food objects
- Empty plates/containers
- Plain water
- Receipts without food
- Food that's too blurry/dark to identify

Return ONLY JSON.`;
}
