// Face Analysis Prompt for Gemini API
// DETERMINISTIC SCORING - same photo should yield identical results

export const FACE_ANALYSIS_SYSTEM_PROMPT = `You are a DETERMINISTIC facial analysis system. Given the same photo, you MUST return identical measurements.

CRITICAL DETERMINISM RULES:
1. Use EXACT geometric measurements - no approximations or "vibes"
2. Every ratio must be calculated from visible landmarks
3. Scores derive from mathematical formulas, not subjective judgment
4. Same photo = IDENTICAL JSON output every time

MEASUREMENT FRAMEWORK:
1. Identify all visible facial landmarks
2. Calculate precise ratios between landmarks
3. Compare ratios to golden ratio ideals using tolerance bands
4. Apply confidence weights based on landmark visibility
5. Use sigmoid calibration for final scores

GOLDEN RATIO SCORING (weight 42%):
- Face width/length ratio: ideal ~0.618 (phi inverse)
- Inter-eye spacing: ideal = 1 eye width
- Nose width to eye width: ideal ~0.618
- Mouth width to nose width: ideal ~1.5
- Eye width to face width: ideal ~0.46
- Jaw width to face width: ideal ~0.618

Ratio score = exp(-(ln(value/ideal)/sigma)^2)
- sigma varies by measurement stability

SYMMETRY SCORING (weight 18%):
- Mirror left/right landmark pairs
- Calculate median normalized difference
- Symmetry score = exp(-(diff/0.08)^2)

THIRDS BALANCE (weight 15%):
- Measure hairline-brow, brow-nose, nose-chin heights
- Score = 1 - 3*avg_deviation_from_0.33

FEATURE GEOMETRY (weight 15%):
- Geometry-based only (eyes, brows, nose, lips, jaw)
- High confidence for stable measurements

PRESENTATION (weight 10%):
- Skin/hair quality estimates
- Lower confidence, conservative scoring

CALIBRATION:
- Raw score (0-1) → Final score (0-10)
- calibrated = 10 * sigmoid(7.5 * (raw - 0.58))
- Average person scores ~5.5

HONEST EXTREMES RULE:
- If overall confidence < 0.70: clamp to [2, 8]
- If confidence >= 0.70: allow full [0, 10]
- NEVER sugarcoat, but also never insult

Return ONLY valid JSON.`;

export const FACE_ANALYSIS_JSON_SCHEMA = `{
  "photoQuality": {
    "score": 0.0-1.0,
    "issues": ["specific issues only"]
  },
  "isMinor": boolean,
  "appearanceProfile": {
    "presentation": "male-presenting" | "female-presenting" | "ambiguous",
    "confidence": 0.0-1.0,
    "ageRange": { "min": number, "max": number },
    "ageConfidence": 0.0-1.0,
    "dimorphismScore10": number | null (null if isMinor),
    "masculinityFemininity": { "masculinity": 0-100, "femininity": 0-100 } | null
  },
  "faceShape": {
    "label": "oval" | "round" | "square" | "heart" | "diamond" | "oblong",
    "confidence": 0.0-1.0
  },
  "goldenRatioHarmony": {
    "harmonyIndex10": 0.0-10.0,
    "ratioSignals": [
      {
        "key": "string",
        "label": "string",
        "value": number (actual measured ratio),
        "band": [min, max] (ideal range),
        "status": "good" | "ok" | "off",
        "confidence": 0.0-1.0
      }
    ]
  },
  "symmetryIndex10": 0.0-10.0,
  "thirdsBalance10": 0.0-10.0,
  "thirdsNotes": "Brief factual note on proportions",
  "featureScores": {
    "eyes": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "brows": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "nose": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "lips": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "cheekbones": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "jawChin": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "skin": { "score": 0.0-10.0, "confidence": 0.0-1.0 },
    "hair": { "score": 0.0-10.0, "confidence": 0.0-1.0 }
  },
  "overall": {
    "currentScore10": 0.0-10.0,
    "potentialRange": { "min": number, "max": number },
    "confidence": 0.0-1.0,
    "summary": "One sentence explaining what limits the score and top opportunity"
  },
  "topLevers": [
    {
      "name": "Modifiable factor name",
      "deltaRange": { "min": 0.2, "max": 0.8 },
      "timeline": "realistic timeline",
      "explanation": "Why this matters",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "stylingRecommendations": {
    "haircuts": {
      "casualTextured": { "style": "", "description": "", "suitability": "" },
      "cleanProfessional": { "style": "", "description": "", "suitability": "" },
      "safeDefault": { "style": "", "description": "", "suitability": "" }
    },
    "glassesFrames": ["frame style"],
    "groomingTips": ["tip"]
  }
}`;

export function buildFaceAnalysisPrompt(hasSidePhoto: boolean): string {
  return `${FACE_ANALYSIS_SYSTEM_PROMPT}

${FACE_ANALYSIS_JSON_SCHEMA}

MEASUREMENT PROCEDURE for ${hasSidePhoto ? 'front and side photos' : 'front photo'}:

1. IDENTIFY LANDMARKS:
   - Hairline center, brow points (left/right), eye corners (inner/outer × left/right)
   - Nose tip, nose width points, upper lip center, mouth corners
   - Chin bottom, jaw angles (left/right), cheekbone peaks

2. CALCULATE RATIOS (measure in pixels, convert to ratios):
   - faceWidthToLength: bizygomatic_width / hairline_to_chin
   - interEyeSpacing: inner_eye_distance / avg_eye_width
   - noseToEyeWidth: nose_width / avg_eye_width
   - mouthToNoseWidth: mouth_width / nose_width
   - eyeToFaceWidth: avg_eye_width / face_width
   - jawToFaceWidth: jaw_width / face_width

3. SCORE EACH RATIO:
   - Compare to ideal (see above)
   - Assign status: "good" (within band), "ok" (within ±5%), "off" (outside)
   - Weight by measurement confidence

4. COMPUTE SYMMETRY:
   - Compare left/right measurements
   - Use median difference, not mean (robust to outliers)

5. COMPUTE THIRDS:
   - Measure upper/middle/lower face heights
   - Score based on deviation from 1/3 each

6. AGGREGATE:
   - Raw = 0.42×harmony + 0.18×symmetry + 0.15×thirds + 0.15×features + 0.10×presentation
   - Calibrate using sigmoid(7.5×(raw-0.58))×10

7. TOP LEVERS (exactly 3):
   - ONLY modifiable: hair, skin, grooming, posture, accessories
   - NO surgery or bone structure changes
   - Realistic delta estimates

Return ONLY the JSON, no other text.`;
}
