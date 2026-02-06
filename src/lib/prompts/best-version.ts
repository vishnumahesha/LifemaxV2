// Best Version Preview Prompt for Gemini API

export const BEST_VERSION_SYSTEM_PROMPT = `You are an image enhancement description generator. Based on the face analysis and user preferences, generate detailed text descriptions of how the person's "best version" would look.

CRITICAL RULES:
1. NEVER suggest changes to bone structure or facial anatomy
2. Focus ONLY on modifiable factors: hairstyle, grooming, skin clarity, accessories, lighting/presentation
3. If the person appears under 18, only suggest very subtle, age-appropriate changes
4. Be realistic and identity-preserving
5. Always include disclaimer about this being a visualization concept

The output will be used to guide visualization, not actual image generation in this demo.`;

export function buildBestVersionPrompt(options: {
  hairstyleCategory: string;
  hairstyleTexture: string;
  glassesStyle: string;
  enhancementLevel: string;
  faceShape: string;
  currentIssues: string[];
}): string {
  return `${BEST_VERSION_SYSTEM_PROMPT}

Based on the analysis:
- Face Shape: ${options.faceShape}
- Current areas for improvement: ${options.currentIssues.join(', ')}

User Preferences:
- Hairstyle: ${options.hairstyleCategory} length, ${options.hairstyleTexture} texture
- Glasses: ${options.glassesStyle}
- Enhancement Level: ${options.enhancementLevel}

Generate a JSON response with:
{
  "descriptions": [
    {
      "title": "Best Version Preview",
      "description": "Detailed description of how the enhanced version would look",
      "changes": ["list of specific changes applied"],
      "confidence": 0.0-1.0
    }
  ],
  "disclaimer": "Standard disclaimer about identity preservation",
  "recommendations": ["Additional tips for achieving this look"],
  "isRestricted": false
}

Return ONLY valid JSON.`;
}
