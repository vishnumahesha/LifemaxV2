// Reachability Estimator
// Computes realistic time ranges with confidence for "Best Version" previews

import { TIME_ESTIMATES } from './style-library';

// ============================================
// TYPES
// ============================================

export interface ReachabilityEstimate {
  estimatedWeeks: { min: number; max: number };
  confidence: number;
  assumptions: string[];
}

export interface FacePreviewOptions {
  level: 1 | 2 | 3;
  hairstyle: {
    length: 'short' | 'medium' | 'long';
    finish: 'textured' | 'clean';
  };
  glasses: {
    enabled: boolean;
    style?: 'round' | 'rectangular' | 'browline' | 'aviator' | 'geometric';
  };
  grooming?: {
    facialHair?: 'none' | 'stubble' | 'trimmed';
    brows?: 'natural' | 'cleaned';
  };
  lighting?: 'neutral_soft' | 'studio_soft' | 'outdoor_shade';
}

export interface BodyPreviewOptions {
  level: 1 | 2 | 3;
  goal: 'get_leaner' | 'build_muscle' | 'balanced';
  outfit: 'fitted_basics' | 'athleisure' | 'smart_casual' | 'formal';
  postureFocus?: 'neutral' | 'improve_posture';
  variations?: 1 | 2 | 3;
}

// ============================================
// FACE PREVIEW REACHABILITY
// ============================================

export function estimateFaceReachability(
  options: FacePreviewOptions,
  currentHairLength: 'short' | 'medium' | 'long' = 'short',
  photoQuality: number = 0.7
): ReachabilityEstimate {
  const timeRanges: Array<{ min: number; max: number }> = [];
  const assumptions: string[] = [];
  
  // Enhancement level base times
  if (options.level === 1) {
    assumptions.push('Level 1: Same-day improvements only');
    timeRanges.push({ min: 0, max: 1 }); // Essentially instant
  } else if (options.level === 2) {
    assumptions.push('Level 2: Weeks to months of consistent effort');
  } else {
    assumptions.push('Level 3: Months of dedicated routine');
  }
  
  // Hair time estimation
  const hairLengthOrder: Record<string, number> = { short: 1, medium: 2, long: 3 };
  const currentLength = hairLengthOrder[currentHairLength];
  const targetLength = hairLengthOrder[options.hairstyle.length];
  
  if (targetLength > currentLength) {
    // Need to grow hair
    const lengthDiff = targetLength - currentLength;
    if (lengthDiff === 1) {
      timeRanges.push(TIME_ESTIMATES.hair.moderateChange);
      assumptions.push(`Hair growth needed (${currentHairLength} → ${options.hairstyle.length}): ~${TIME_ESTIMATES.hair.growthRate}cm/month typical`);
    } else {
      timeRanges.push(TIME_ESTIMATES.hair.majorChange);
      assumptions.push(`Significant hair growth needed: may take 4-5+ months`);
    }
  } else if (targetLength < currentLength) {
    // Cutting hair - quick
    timeRanges.push(TIME_ESTIMATES.hair.sameDay);
    assumptions.push('Haircut achievable same day');
  } else {
    // Same length, just styling
    if (options.level >= 2) {
      timeRanges.push(TIME_ESTIMATES.hair.minorChange);
      assumptions.push('Minor styling adjustments');
    } else {
      timeRanges.push(TIME_ESTIMATES.hair.sameDay);
    }
  }
  
  // Glasses time
  if (options.glasses.enabled) {
    timeRanges.push(TIME_ESTIMATES.glasses.purchase);
    assumptions.push('Glasses: 0-2 weeks to select and purchase');
  }
  
  // Grooming time
  if (options.grooming?.facialHair === 'stubble') {
    timeRanges.push(TIME_ESTIMATES.grooming.stubble);
    assumptions.push('Stubble: 0-1 week to achieve');
  } else if (options.grooming?.facialHair === 'trimmed') {
    timeRanges.push(TIME_ESTIMATES.grooming.beardGrowth);
    assumptions.push('Trimmed beard: 4-12 weeks depending on growth rate');
  }
  
  // Skin improvement time (level-dependent)
  if (options.level >= 2) {
    timeRanges.push(TIME_ESTIMATES.skin.routineResults);
    assumptions.push('Skin clarity improvements: 6-12 weeks with consistent routine');
  } else {
    timeRanges.push(TIME_ESTIMATES.skin.lightingOnly);
    assumptions.push('Level 1: Lighting improvements only, no skin routine needed');
  }
  
  // Calculate final range
  const minWeeks = Math.max(...timeRanges.map(r => r.min));
  let maxWeeks = Math.max(...timeRanges.map(r => r.max));
  
  // Adjust for photo quality
  let confidence = Math.min(photoQuality * 0.9, 0.85);
  if (photoQuality < 0.6) {
    maxWeeks = Math.ceil(maxWeeks * 1.3);
    confidence *= 0.7;
    assumptions.push('Photo quality lower than ideal; estimates may be less accurate');
  }
  
  assumptions.push('Assumes consistent routine and typical progress rates; individual results vary.');
  
  return {
    estimatedWeeks: { min: minWeeks, max: maxWeeks },
    confidence: Math.round(confidence * 100) / 100,
    assumptions,
  };
}

// ============================================
// BODY PREVIEW REACHABILITY
// ============================================

export function estimateBodyReachability(
  options: BodyPreviewOptions,
  photoQuality: number = 0.7,
  hasSideView: boolean = false
): ReachabilityEstimate {
  const timeRanges: Array<{ min: number; max: number }> = [];
  const assumptions: string[] = [];
  
  // Enhancement level base expectations
  if (options.level === 1) {
    assumptions.push('Level 1: Posture + outfit + lighting (achievable in days to weeks)');
    timeRanges.push({ min: 0, max: 2 });
  } else if (options.level === 2) {
    assumptions.push('Level 2: Moderate body recomposition preview (8-16 weeks)');
  } else {
    assumptions.push('Level 3: Significant but realistic changes (12-40 weeks)');
  }
  
  // Goal-based time
  if (options.goal === 'get_leaner') {
    if (options.level === 2) {
      timeRanges.push(TIME_ESTIMATES.body.moderateFatLoss);
      assumptions.push('Fat loss: ~0.5-1% bodyweight/week is sustainable');
    } else if (options.level === 3) {
      timeRanges.push(TIME_ESTIMATES.body.significantFatLoss);
      assumptions.push('Significant leanness change requires sustained deficit');
    } else {
      timeRanges.push(TIME_ESTIMATES.body.lightFatLoss);
    }
  } else if (options.goal === 'build_muscle') {
    if (options.level >= 2) {
      timeRanges.push(TIME_ESTIMATES.body.muscleGainNovice);
      assumptions.push('Muscle gain visible: 8-24+ weeks (faster for beginners)');
    }
    if (options.level === 3) {
      timeRanges.push(TIME_ESTIMATES.body.muscleGainIntermediate);
    }
  } else {
    // Balanced
    if (options.level >= 2) {
      timeRanges.push({ min: 8, max: 20 });
      assumptions.push('Balanced recomp: slower but sustainable');
    }
  }
  
  // Posture improvement
  if (options.postureFocus === 'improve_posture') {
    timeRanges.push(TIME_ESTIMATES.body.postureImprovement);
    if (hasSideView) {
      assumptions.push('Posture improvement: 2-12 weeks with consistent corrective work');
    } else {
      assumptions.push('Posture baseline estimated (side view would improve accuracy)');
    }
  }
  
  // Calculate final range
  const minWeeks = Math.max(...timeRanges.map(r => r.min), 0);
  let maxWeeks = Math.max(...timeRanges.map(r => r.max), 2);
  
  // Adjust for photo quality and side view
  let confidence = photoQuality * 0.8;
  if (!hasSideView) {
    confidence *= 0.85;
    assumptions.push('Side view not provided; posture and composition estimates less precise');
  }
  if (photoQuality < 0.6) {
    maxWeeks = Math.ceil(maxWeeks * 1.4);
    confidence *= 0.7;
    assumptions.push('Photo quality affects estimate precision');
  }
  
  assumptions.push('Assumes consistent training, nutrition, and typical progress rates; individual results vary significantly.');
  
  return {
    estimatedWeeks: { min: minWeeks, max: maxWeeks },
    confidence: Math.round(confidence * 100) / 100,
    assumptions,
  };
}

// ============================================
// CHANGE BUDGET ENFORCEMENT
// ============================================

export interface ChangeBudget {
  hair: 'tidy_only' | 'minor_cut' | 'major_cut';
  skin: 'lighting_only' | 'minor_clarity' | 'moderate_clarity';
  grooming: 'none' | 'minor' | 'full';
  glasses: boolean;
  bodyComposition: 'presentation_only' | 'minor_recomp' | 'moderate_recomp';
  posture: 'none' | 'subtle' | 'improved';
}

export function getChangeBudget(level: 1 | 2 | 3): ChangeBudget {
  switch (level) {
    case 1:
      return {
        hair: 'tidy_only',
        skin: 'lighting_only',
        grooming: 'minor',
        glasses: true,
        bodyComposition: 'presentation_only',
        posture: 'subtle',
      };
    case 2:
      return {
        hair: 'minor_cut',
        skin: 'minor_clarity',
        grooming: 'full',
        glasses: true,
        bodyComposition: 'minor_recomp',
        posture: 'improved',
      };
    case 3:
      return {
        hair: 'major_cut',
        skin: 'moderate_clarity',
        grooming: 'full',
        glasses: true,
        bodyComposition: 'moderate_recomp',
        posture: 'improved',
      };
  }
}

// ============================================
// APPLIED CHANGES DESCRIPTION
// ============================================

export function describeAppliedChanges(
  options: FacePreviewOptions | BodyPreviewOptions,
  type: 'face' | 'body'
): string[] {
  const changes: string[] = [];
  const budget = getChangeBudget(options.level);
  
  if (type === 'face') {
    const faceOpts = options as FacePreviewOptions;
    
    // Hair
    if (budget.hair === 'tidy_only') {
      changes.push('Hair: Tidied and styled');
    } else if (budget.hair === 'minor_cut') {
      changes.push(`Hair: ${faceOpts.hairstyle.length} length, ${faceOpts.hairstyle.finish} finish`);
    } else {
      changes.push(`Hair: New ${faceOpts.hairstyle.length} ${faceOpts.hairstyle.finish} style`);
    }
    
    // Skin
    if (budget.skin === 'lighting_only') {
      changes.push('Lighting: Improved exposure and balance');
    } else if (budget.skin === 'minor_clarity') {
      changes.push('Skin: Subtle clarity improvement');
    } else {
      changes.push('Skin: Clearer complexion (realistic texture preserved)');
    }
    
    // Grooming
    if (faceOpts.grooming?.facialHair && faceOpts.grooming.facialHair !== 'none') {
      changes.push(`Grooming: ${faceOpts.grooming.facialHair} facial hair`);
    }
    if (faceOpts.grooming?.brows === 'cleaned') {
      changes.push('Grooming: Tidied eyebrows');
    }
    
    // Glasses
    if (faceOpts.glasses.enabled) {
      changes.push(`Glasses: ${faceOpts.glasses.style} frames added`);
    }
    
    // Lighting
    if (faceOpts.lighting) {
      const lightingNames: Record<string, string> = {
        'neutral_soft': 'soft neutral',
        'studio_soft': 'studio quality',
        'outdoor_shade': 'natural outdoor',
      };
      changes.push(`Lighting: ${lightingNames[faceOpts.lighting] || faceOpts.lighting}`);
    }
  } else {
    const bodyOpts = options as BodyPreviewOptions;
    
    // Outfit
    const outfitNames: Record<string, string> = {
      'fitted_basics': 'Clean fitted basics',
      'athleisure': 'Athleisure style',
      'smart_casual': 'Smart casual',
      'formal': 'Formal attire',
    };
    changes.push(`Outfit: ${outfitNames[bodyOpts.outfit] || bodyOpts.outfit}`);
    
    // Body composition
    if (budget.bodyComposition !== 'presentation_only') {
      const goalNames: Record<string, string> = {
        'get_leaner': 'leaner presentation',
        'build_muscle': 'enhanced muscle tone',
        'balanced': 'balanced recomposition',
      };
      changes.push(`Composition: ${goalNames[bodyOpts.goal] || bodyOpts.goal}`);
    } else {
      changes.push('Composition: Presentation/styling only');
    }
    
    // Posture
    if (bodyOpts.postureFocus === 'improve_posture' && budget.posture !== 'none') {
      changes.push('Posture: Improved alignment');
    }
    
    changes.push('Lighting: Optimized for clarity');
  }
  
  return changes;
}
