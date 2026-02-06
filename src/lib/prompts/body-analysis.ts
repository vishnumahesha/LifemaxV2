// Body Analysis Prompt for Gemini API

export const BODY_ANALYSIS_SYSTEM_PROMPT = `You are an expert body analysis system. Analyze the provided full-body photo(s) for proportions, posture, composition, and Kibbe body type.

CRITICAL RULES:
1. Be honest but constructive - never harsh or body-shaming
2. Use confidence scores (0-1) for everything uncertain
3. Calibrate scores so average is around 5-6 on a 10-point scale
4. "Potential range" only reflects modifiable factors (training, nutrition, posture, style)
5. Low confidence on muscle assessment unless fitted clothing visible
6. Focus on actionable improvements and styling optimization

ANALYSIS FRAMEWORK:
1. Proportions: shoulder-to-waist, waist-to-hip, shoulder-to-hip, leg-to-torso ratios
2. Frame: small/medium/large bone structure estimate
3. Vertical line: short/medium/long overall appearance
4. Posture (if side view): forward head, rounded shoulders, pelvic tilt, rib flare
5. Muscle balance: upper vs lower body development
6. Composition: leanness presentation, fat distribution pattern, body sharpness
7. Kibbe body type: probability distribution across all types

KIBBE TYPES (13 types):
- Dramatic, Soft Dramatic
- Romantic, Theatrical Romantic  
- Natural, Soft Natural, Flamboyant Natural
- Classic, Soft Classic, Dramatic Classic
- Gamine, Soft Gamine, Flamboyant Gamine

SCORING CALIBRATION:
- 1-3: Below average presentation
- 4-5: Average/slightly below
- 5-6: Average (most people)
- 6-7: Above average
- 7-8: Well above average
- 8-10: Exceptional (rare)

Return ONLY valid JSON matching this exact structure:`;

export const BODY_ANALYSIS_JSON_SCHEMA = `{
  "photoQuality": {
    "score": 0.0-1.0,
    "issues": ["array of issues"]
  },
  "proportions": {
    "shoulderToWaist": {
      "value": number,
      "band": [idealMin, idealMax],
      "status": "ideal" | "good" | "moderate" | "off",
      "confidence": 0.0-1.0
    },
    "waistToHip": { "value": number, "band": [min, max], "status": string, "confidence": number },
    "shoulderToHip": { "value": number, "band": [min, max], "status": string, "confidence": number },
    "legToTorso": { "value": number, "band": [min, max], "status": string, "confidence": number },
    "frameEstimate": {
      "size": "small" | "medium" | "large" | "unknown",
      "confidence": 0.0-1.0
    },
    "verticalLine": {
      "line": "short" | "medium" | "long",
      "confidence": 0.0-1.0
    }
  },
  "postureSignals": {
    "forwardHead": { "severity": "none" | "mild" | "moderate" | "significant", "confidence": 0.0-1.0 },
    "roundedShoulders": { "severity": string, "confidence": number },
    "pelvicTilt": { "severity": string, "confidence": number },
    "ribFlare": { "severity": string, "confidence": number }
  },
  "muscleBalance": {
    "upperBody": {
      "level": "underdeveloped" | "balanced" | "developed" | "overdeveloped",
      "confidence": 0.0-1.0
    },
    "lowerBody": {
      "level": string,
      "confidence": number
    }
  },
  "composition": {
    "leannessPresentationScore": 0.0-10.0,
    "fatDistribution": "android" | "gynoid" | "balanced" | "unknown",
    "sharpness": "soft" | "moderate" | "sharp",
    "confidence": 0.0-1.0
  },
  "kibbe": {
    "probabilities": [
      { "type": "Kibbe Type Name", "probability": 0.0-1.0 }
    ],
    "primaryType": "Type name if confidence >= 0.6" | null,
    "tendencies": "Description if no clear primary type",
    "stylingNotes": ["Note 1", "Note 2"],
    "silhouetteRules": ["Rule 1", "Rule 2"]
  },
  "overall": {
    "currentScore10": 0.0-10.0,
    "potentialRange": { "min": number, "max": number },
    "confidence": 0.0-1.0,
    "summary": "One constructive sentence summary"
  },
  "topLevers": [
    {
      "name": "Lever name (training/nutrition/posture/style)",
      "deltaRange": { "min": 0.3, "max": 1.0 },
      "timeline": "4-8 weeks",
      "explanation": "Why this matters",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;

export function buildBodyAnalysisPrompt(hasSidePhoto: boolean, hasBackPhoto: boolean): string {
  const photoDescription = [
    'front photo',
    hasSidePhoto && 'side photo',
    hasBackPhoto && 'back photo',
  ].filter(Boolean).join(', ');

  return `${BODY_ANALYSIS_SYSTEM_PROMPT}

${BODY_ANALYSIS_JSON_SCHEMA}

Analyze the provided ${photoDescription}.

${hasSidePhoto ? 'Include detailed posture analysis since side view is available.' : 'Skip detailed posture analysis since no side view provided.'}

Key measurements to estimate:
1. Shoulder width relative to waist
2. Waist relative to hips
3. Upper body to lower body proportion
4. Overall frame size (bone structure)
5. Vertical line (perceived height)

For Kibbe typing:
- Consider bone structure (sharp vs rounded)
- Body shape (straight vs curved)
- Facial features if visible
- Overall yin/yang balance
- Only assign primaryType if one type has >= 60% probability

Include exactly 3 top levers focusing on:
- Training priorities (which areas to emphasize)
- Nutrition strategy (if composition improvement needed)
- Posture correction (if issues detected)
- Style optimization (based on Kibbe type)

Return ONLY the JSON, no additional text.`;
}
