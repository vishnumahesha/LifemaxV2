// Strict Photo Validation Module
// Implements Section A of the spec: REJECT wrong photo types

import {
  ViewType,
  PhotoValidation,
  PoseEstimate,
  VIEW_THRESHOLDS,
  QUALITY_THRESHOLDS,
} from './types';

// Error codes for photo validation
export const ValidationErrorCodes = {
  INVALID_VIEW: 'INVALID_VIEW',
  POSE_INVALID: 'POSE_INVALID',
  LOW_QUALITY: 'LOW_QUALITY',
  SUBJECT_NOT_VISIBLE: 'SUBJECT_NOT_VISIBLE',
  HEAVY_OCCLUSION: 'HEAVY_OCCLUSION',
  BEAUTY_FILTER_DETECTED: 'BEAUTY_FILTER_DETECTED',
  RESOLUTION_TOO_LOW: 'RESOLUTION_TOO_LOW',
  BLUR_DETECTED: 'BLUR_DETECTED',
} as const;

// Human-readable rejection messages
export const RejectionMessages = {
  // Face rejections
  face_not_front: "This doesn't look like a straight-on front face photo. Please upload a neutral front photo with your face directly facing the camera (±12° tolerance).",
  face_not_side: "This doesn't look like a true side profile. Please upload a photo where your face is turned approximately 90° to show your profile.",
  face_three_quarter: "This appears to be a 3/4 angle photo. We only accept front or side views for accurate analysis. Please retake with your face either directly facing the camera or in true profile.",
  face_pose_invalid: "Your head position appears tilted. Please retake with a neutral head position (looking straight ahead, not tilted up/down or to the side).",
  face_occluded: "Part of your face is obscured (hair covering features, sunglasses, hand, etc.). Please retake with your full face visible.",
  
  // Body rejections
  body_not_full: "Body analysis requires a full-body image showing head to feet. This image appears cropped or doesn't show your complete figure.",
  body_not_front: "This doesn't look like a front-facing body photo. Please stand facing the camera directly with shoulders and hips square.",
  body_not_side: "This doesn't look like a true side view. Please stand with your body turned 90° to the camera.",
  body_not_back: "This doesn't look like a back view. Please stand with your back facing the camera.",
  body_pose_invalid: "Your body appears rotated. For accurate measurements, please stand with your body aligned to the expected view angle.",
  
  // Quality rejections
  too_blurry: "The image is too blurry for accurate analysis. Please take a clearer photo in good lighting.",
  resolution_low: "The image resolution is too low. Please upload a higher quality image (minimum 256px for face/body area).",
  poor_lighting: "The lighting is too dark or harsh for accurate analysis. Please retake in even, natural lighting.",
  filter_suspected: "This image appears to have a beauty filter applied. For accurate results, please upload an unfiltered photo.",
} as const;

/**
 * Classify face view based on pose angles
 */
export function classifyFaceView(pose: PoseEstimate): {
  view: 'face_front' | 'face_side' | 'rejected';
  reason?: string;
} {
  const { yaw, pitch, roll } = pose;
  const absYaw = Math.abs(yaw);
  const absPitch = Math.abs(pitch);
  const absRoll = Math.abs(roll);
  
  const frontThresholds = VIEW_THRESHOLDS.face.front;
  const sideThresholds = VIEW_THRESHOLDS.face.side;
  
  // Check for front view
  if (
    absYaw <= frontThresholds.maxYaw &&
    absPitch <= frontThresholds.maxPitch &&
    absRoll <= frontThresholds.maxRoll
  ) {
    return { view: 'face_front' };
  }
  
  // Check for side view
  if (absYaw >= sideThresholds.minYaw && absYaw <= sideThresholds.maxYaw) {
    return { view: 'face_side' };
  }
  
  // Rejected - 3/4 angle or invalid pose
  if (absYaw > frontThresholds.maxYaw && absYaw < sideThresholds.minYaw) {
    return { view: 'rejected', reason: RejectionMessages.face_three_quarter };
  }
  
  return { view: 'rejected', reason: RejectionMessages.face_pose_invalid };
}

/**
 * Classify body view based on pose/orientation
 */
export function classifyBodyView(
  shoulderRotation: number, // 0 = front, 90 = side
  hipRotation: number,
  faceVisible: boolean
): {
  view: 'body_front' | 'body_side' | 'body_back' | 'rejected';
  reason?: string;
} {
  const avgRotation = (shoulderRotation + hipRotation) / 2;
  const frontThreshold = VIEW_THRESHOLDS.body.front.maxRotation;
  const sideThresholds = VIEW_THRESHOLDS.body.side;
  
  // Check for front view
  if (avgRotation <= frontThreshold && faceVisible) {
    return { view: 'body_front' };
  }
  
  // Check for side view
  if (avgRotation >= sideThresholds.minRotation && avgRotation <= sideThresholds.maxRotation) {
    return { view: 'body_side' };
  }
  
  // Check for back view (high rotation, face not visible)
  if (avgRotation >= sideThresholds.minRotation && !faceVisible) {
    return { view: 'body_back' };
  }
  
  return { view: 'rejected', reason: RejectionMessages.body_pose_invalid };
}

/**
 * Validate photo quality metrics
 */
export function validatePhotoQuality(
  blurScore: number,      // 0-1, lower = more blur
  resolution: number,     // pixels for face/body area
  brightnessScore: number, // 0-1
  filterScore: number     // 0-1, higher = more filter suspected
): {
  isAcceptable: boolean;
  qualityScore: number;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 1.0;
  
  // Check blur
  if (blurScore < QUALITY_THRESHOLDS.blurThreshold) {
    issues.push(RejectionMessages.too_blurry);
    qualityScore *= 0.5;
  } else if (blurScore < 0.5) {
    warnings.push('Image is slightly blurry');
    qualityScore *= 0.8;
  }
  
  // Check resolution
  if (resolution < QUALITY_THRESHOLDS.minResolution) {
    issues.push(RejectionMessages.resolution_low);
    qualityScore *= 0.4;
  } else if (resolution < QUALITY_THRESHOLDS.minResolution * 1.5) {
    warnings.push('Image resolution is on the lower end');
    qualityScore *= 0.85;
  }
  
  // Check brightness
  if (brightnessScore < 0.3 || brightnessScore > 0.9) {
    warnings.push(RejectionMessages.poor_lighting);
    qualityScore *= 0.7;
  }
  
  // Check filter
  if (filterScore > 0.7) {
    issues.push(RejectionMessages.filter_suspected);
    qualityScore *= 0.5;
  } else if (filterScore > 0.4) {
    warnings.push('Possible light filter detected - results may be less accurate');
    qualityScore *= 0.85;
  }
  
  const isAcceptable = qualityScore >= QUALITY_THRESHOLDS.minAcceptable && issues.length === 0;
  
  return {
    isAcceptable,
    qualityScore: Math.max(0, Math.min(1, qualityScore)),
    issues,
    warnings,
  };
}

/**
 * Main validation function - validates photo for a specific expected view
 */
export function validatePhoto(
  pose: PoseEstimate,
  expectedView: ViewType,
  qualityMetrics: {
    blurScore: number;
    resolution: number;
    brightnessScore: number;
    filterScore: number;
  },
  subjectMetrics: {
    faceVisible: boolean;
    fullBodyVisible: boolean;
    occlusionScore: number; // 0 = no occlusion, 1 = fully occluded
  }
): PhotoValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Validate quality first
  const quality = validatePhotoQuality(
    qualityMetrics.blurScore,
    qualityMetrics.resolution,
    qualityMetrics.brightnessScore,
    qualityMetrics.filterScore
  );
  issues.push(...quality.issues);
  warnings.push(...quality.warnings);
  
  // Check occlusion
  if (subjectMetrics.occlusionScore > 0.3) {
    issues.push(expectedView.startsWith('face_') 
      ? RejectionMessages.face_occluded 
      : 'Key body parts are obscured');
  }
  
  // Check subject visibility
  if (expectedView.startsWith('face_') && !subjectMetrics.faceVisible) {
    issues.push(RejectionMessages.face_occluded);
  }
  if (expectedView.startsWith('body_') && !subjectMetrics.fullBodyVisible) {
    issues.push(RejectionMessages.body_not_full);
  }
  
  // Classify the actual view
  let detectedView: ViewType | 'unknown' | 'rejected' = 'unknown';
  let rejectionReason: string | undefined;
  
  if (expectedView.startsWith('face_')) {
    const classification = classifyFaceView(pose);
    if (classification.view === 'rejected') {
      detectedView = 'rejected';
      rejectionReason = classification.reason;
    } else {
      detectedView = classification.view;
    }
  } else {
    // For body views, we need shoulder/hip rotation info
    // This would come from pose estimation in real implementation
    // For now, use a simplified check
    const shoulderRotation = Math.abs(pose.yaw);
    const hipRotation = Math.abs(pose.yaw); // Simplified - would be separate in real impl
    
    const classification = classifyBodyView(
      shoulderRotation,
      hipRotation,
      subjectMetrics.faceVisible
    );
    
    if (classification.view === 'rejected') {
      detectedView = 'rejected';
      rejectionReason = classification.reason;
    } else {
      detectedView = classification.view;
    }
  }
  
  // Check if detected view matches expected view
  // Cast detectedView to allow comparison
  const viewToCheck = detectedView as string;
  if (viewToCheck !== 'rejected' && viewToCheck !== 'unknown' && detectedView !== expectedView) {
    rejectionReason = getViewMismatchMessage(expectedView, detectedView as ViewType);
    detectedView = 'rejected';
  }
  
  // Final validation result
  const isValid = 
    viewToCheck !== 'rejected' && 
    viewToCheck !== 'unknown' && 
    quality.isAcceptable &&
    issues.length === 0;
  
  return {
    isValid,
    detectedView,
    pose,
    qualityScore: quality.qualityScore,
    issues,
    warnings,
    rejectionReason,
  };
}

/**
 * Generate helpful message for view mismatch
 */
function getViewMismatchMessage(expected: ViewType, got: ViewType | 'unknown'): string {
  const messages: Record<string, Record<string, string>> = {
    face_front: {
      face_side: "You uploaded a side profile, but we need a front-facing photo for this slot.",
      unknown: "Could not determine the view angle. Please upload a clear front-facing photo.",
    },
    face_side: {
      face_front: "You uploaded a front-facing photo, but we need a side profile for this slot.",
      unknown: "Could not determine the view angle. Please upload a clear side profile.",
    },
    body_front: {
      body_side: "You uploaded a side view, but we need a front-facing full body photo.",
      body_back: "You uploaded a back view, but we need a front-facing full body photo.",
      unknown: "Could not determine the body orientation. Please upload a front-facing full body photo.",
    },
    body_side: {
      body_front: "You uploaded a front view, but we need a side view of your body.",
      body_back: "You uploaded a back view, but we need a side view of your body.",
      unknown: "Could not determine the body orientation. Please upload a side view of your body.",
    },
    body_back: {
      body_front: "You uploaded a front view, but we need a back view of your body.",
      body_side: "You uploaded a side view, but we need a back view of your body.",
      unknown: "Could not determine the body orientation. Please upload a back view of your body.",
    },
  };
  
  return messages[expected]?.[got] || 
    `Expected ${expected.replace('_', ' ')} view, but detected ${(got as string).replace('_', ' ')} view.`;
}

/**
 * Quick check if view classification is valid without full validation
 */
export function quickViewCheck(pose: PoseEstimate, expectedView: ViewType): boolean {
  if (expectedView.startsWith('face_')) {
    const classification = classifyFaceView(pose);
    return classification.view === expectedView;
  }
  // Simplified for body - would need more info in real implementation
  return true;
}
