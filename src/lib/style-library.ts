// Style Library for Face and Body Recommendations
// Grounded in face shape, proportions, and Kibbe tendencies

import type { FaceShapeLabel } from '@/types/face';
import type { KibbeType } from '@/types/body';

// ============================================
// FACE STYLING RECOMMENDATIONS
// ============================================

export interface HairstyleRecommendation {
  id: string;
  label: string;
  length: 'short' | 'medium' | 'long';
  finish: 'textured' | 'clean';
  description: string;
  suitability: string;
  timeToAchieve: { min: number; max: number };
}

export interface GlassesRecommendation {
  id: string;
  label: string;
  style: 'round' | 'rectangular' | 'browline' | 'aviator' | 'geometric';
  description: string;
  suitability: string;
}

export interface FaceStyleGuide {
  haircuts: {
    casualTextured: HairstyleRecommendation;
    cleanProfessional: HairstyleRecommendation;
    safeDefault: HairstyleRecommendation;
  };
  glasses: GlassesRecommendation[];
  groomingNotes: string[];
  avoidNotes: string[];
}

// Face shape specific style guides
export const FACE_STYLE_GUIDES: Record<FaceShapeLabel, FaceStyleGuide> = {
  oval: {
    haircuts: {
      casualTextured: {
        id: 'oval-casual',
        label: 'Textured Crop',
        length: 'short',
        finish: 'textured',
        description: 'Versatile textured crop with natural movement',
        suitability: 'Oval faces suit most styles - this adds modern edge',
        timeToAchieve: { min: 0, max: 2 },
      },
      cleanProfessional: {
        id: 'oval-pro',
        label: 'Classic Side Part',
        length: 'medium',
        finish: 'clean',
        description: 'Polished side part with clean lines',
        suitability: 'Timeless professional look for balanced proportions',
        timeToAchieve: { min: 4, max: 12 },
      },
      safeDefault: {
        id: 'oval-safe',
        label: 'Natural Taper',
        length: 'short',
        finish: 'clean',
        description: 'Clean tapered sides with natural top',
        suitability: 'Safe, universally flattering option',
        timeToAchieve: { min: 0, max: 2 },
      },
    },
    glasses: [
      { id: 'oval-g1', label: 'Aviator', style: 'aviator', description: 'Classic teardrop shape', suitability: 'Adds angular contrast to soft oval' },
      { id: 'oval-g2', label: 'Rectangular', style: 'rectangular', description: 'Clean geometric lines', suitability: 'Balanced proportions suit structured frames' },
      { id: 'oval-g3', label: 'Round', style: 'round', description: 'Soft circular frames', suitability: 'Complements natural face curves' },
    ],
    groomingNotes: ['Most styles work well', 'Focus on personal preference', 'Eyebrow grooming enhances symmetry'],
    avoidNotes: ['Avoid overly dramatic styles that fight natural balance'],
  },
  
  round: {
    haircuts: {
      casualTextured: {
        id: 'round-casual',
        label: 'Textured Quiff',
        length: 'medium',
        finish: 'textured',
        description: 'Volume on top with textured height',
        suitability: 'Adds vertical length to balance width',
        timeToAchieve: { min: 6, max: 14 },
      },
      cleanProfessional: {
        id: 'round-pro',
        label: 'High Fade Pompadour',
        length: 'medium',
        finish: 'clean',
        description: 'Clean sides with height on top',
        suitability: 'Creates elongating effect for rounder faces',
        timeToAchieve: { min: 4, max: 10 },
      },
      safeDefault: {
        id: 'round-safe',
        label: 'Side Swept Taper',
        length: 'short',
        finish: 'clean',
        description: 'Angled top swept to side with tapered sides',
        suitability: 'Adds angles without being dramatic',
        timeToAchieve: { min: 0, max: 4 },
      },
    },
    glasses: [
      { id: 'round-g1', label: 'Rectangular', style: 'rectangular', description: 'Angular horizontal frames', suitability: 'Adds structure and angles to soft face' },
      { id: 'round-g2', label: 'Browline', style: 'browline', description: 'Strong upper frame line', suitability: 'Draws eye upward, adds definition' },
      { id: 'round-g3', label: 'Geometric', style: 'geometric', description: 'Modern angular shapes', suitability: 'Contrasts with round features' },
    ],
    groomingNotes: ['Add height with volume on top', 'Keep sides shorter to avoid widening', 'Defined brows add structure'],
    avoidNotes: ['Avoid very round frames', 'Avoid flat, wide cuts that emphasize width'],
  },
  
  square: {
    haircuts: {
      casualTextured: {
        id: 'square-casual',
        label: 'Messy Fringe',
        length: 'medium',
        finish: 'textured',
        description: 'Soft textured fringe with movement',
        suitability: 'Softens strong jawline with natural texture',
        timeToAchieve: { min: 8, max: 16 },
      },
      cleanProfessional: {
        id: 'square-pro',
        label: 'Executive Contour',
        length: 'short',
        finish: 'clean',
        description: 'Classic business cut with soft edges',
        suitability: 'Professional while softening angular features',
        timeToAchieve: { min: 0, max: 4 },
      },
      safeDefault: {
        id: 'square-safe',
        label: 'Textured Crop Fade',
        length: 'short',
        finish: 'textured',
        description: 'Textured top with faded sides',
        suitability: 'Modern and universally flattering',
        timeToAchieve: { min: 0, max: 2 },
      },
    },
    glasses: [
      { id: 'square-g1', label: 'Round', style: 'round', description: 'Soft circular frames', suitability: 'Balances strong angular jaw' },
      { id: 'square-g2', label: 'Aviator', style: 'aviator', description: 'Curved teardrop shape', suitability: 'Adds softness to structured face' },
      { id: 'square-g3', label: 'Browline', style: 'browline', description: 'Retro style with curved bottom', suitability: 'Classic look that softens angles' },
    ],
    groomingNotes: ['Soft textures complement strong features', 'Light stubble can add dimension', 'Natural brow shape works well'],
    avoidNotes: ['Avoid very boxy frames', 'Avoid overly structured cuts that emphasize angularity'],
  },
  
  heart: {
    haircuts: {
      casualTextured: {
        id: 'heart-casual',
        label: 'Side Swept Texture',
        length: 'medium',
        finish: 'textured',
        description: 'Textured layers swept to side',
        suitability: 'Adds width at jawline, balances forehead',
        timeToAchieve: { min: 6, max: 12 },
      },
      cleanProfessional: {
        id: 'heart-pro',
        label: 'Classic Taper',
        length: 'short',
        finish: 'clean',
        description: 'Clean lines with gradual length on top',
        suitability: 'Balanced professional look',
        timeToAchieve: { min: 0, max: 4 },
      },
      safeDefault: {
        id: 'heart-safe',
        label: 'Soft Layers',
        length: 'medium',
        finish: 'textured',
        description: 'Layered cut with soft edges',
        suitability: 'Adds fullness at chin level',
        timeToAchieve: { min: 4, max: 10 },
      },
    },
    glasses: [
      { id: 'heart-g1', label: 'Aviator', style: 'aviator', description: 'Wider at bottom', suitability: 'Balances wider forehead with narrow chin' },
      { id: 'heart-g2', label: 'Round', style: 'round', description: 'Soft curves', suitability: 'Softens pointed chin area' },
      { id: 'heart-g3', label: 'Rectangular', style: 'rectangular', description: 'Low-set rectangular frames', suitability: 'Adds width to lower face' },
    ],
    groomingNotes: ['Styles that add width at jaw level work best', 'Avoid too much height on top', 'Side-swept bangs can balance forehead'],
    avoidNotes: ['Avoid styles that add volume at temples', 'Avoid very narrow frames'],
  },
  
  diamond: {
    haircuts: {
      casualTextured: {
        id: 'diamond-casual',
        label: 'Textured Fringe',
        length: 'medium',
        finish: 'textured',
        description: 'Fringe that adds forehead width',
        suitability: 'Balances narrow forehead and chin',
        timeToAchieve: { min: 6, max: 14 },
      },
      cleanProfessional: {
        id: 'diamond-pro',
        label: 'Side Part Volume',
        length: 'medium',
        finish: 'clean',
        description: 'Volume at temples with clean sides',
        suitability: 'Adds width to narrow areas',
        timeToAchieve: { min: 4, max: 10 },
      },
      safeDefault: {
        id: 'diamond-safe',
        label: 'Classic Crew',
        length: 'short',
        finish: 'clean',
        description: 'Traditional crew cut with soft texture',
        suitability: 'Safe, balanced option',
        timeToAchieve: { min: 0, max: 2 },
      },
    },
    glasses: [
      { id: 'diamond-g1', label: 'Browline', style: 'browline', description: 'Strong upper frame', suitability: 'Adds width at forehead level' },
      { id: 'diamond-g2', label: 'Aviator', style: 'aviator', description: 'Classic teardrop', suitability: 'Balances prominent cheekbones' },
      { id: 'diamond-g3', label: 'Round', style: 'round', description: 'Soft circular shape', suitability: 'Softens angular features' },
    ],
    groomingNotes: ['Add width at forehead and chin', 'Soft texture works well', 'Defined brows enhance balance'],
    avoidNotes: ['Avoid very narrow frames', 'Avoid styles that emphasize cheekbone width'],
  },
  
  oblong: {
    haircuts: {
      casualTextured: {
        id: 'oblong-casual',
        label: 'Textured Fringe Crop',
        length: 'short',
        finish: 'textured',
        description: 'Fringe that adds horizontal lines',
        suitability: 'Shortens face visually with horizontal texture',
        timeToAchieve: { min: 0, max: 4 },
      },
      cleanProfessional: {
        id: 'oblong-pro',
        label: 'Classic Side Part',
        length: 'medium',
        finish: 'clean',
        description: 'Side part without too much height',
        suitability: 'Professional without adding vertical length',
        timeToAchieve: { min: 4, max: 10 },
      },
      safeDefault: {
        id: 'oblong-safe',
        label: 'Layered Medium',
        length: 'medium',
        finish: 'textured',
        description: 'Layers that add width, not height',
        suitability: 'Balanced approach to add horizontal dimension',
        timeToAchieve: { min: 6, max: 12 },
      },
    },
    glasses: [
      { id: 'oblong-g1', label: 'Round', style: 'round', description: 'Wide circular frames', suitability: 'Adds width, shortens face visually' },
      { id: 'oblong-g2', label: 'Geometric', style: 'geometric', description: 'Wide angular shapes', suitability: 'Horizontal emphasis balances length' },
      { id: 'oblong-g3', label: 'Browline', style: 'browline', description: 'Strong horizontal line', suitability: 'Breaks up vertical length' },
    ],
    groomingNotes: ['Avoid adding height on top', 'Horizontal texture helps balance', 'Wider styles preferred'],
    avoidNotes: ['Avoid tall pompadours or quiffs', 'Avoid very narrow frames that elongate'],
  },
};

// ============================================
// BODY STYLING RECOMMENDATIONS (KIBBE-BASED)
// ============================================

export interface OutfitRecommendation {
  id: string;
  label: string;
  silhouette: 'fitted_basics' | 'athleisure' | 'smart_casual' | 'formal';
  description: string;
  suitability: string;
  keyPieces: string[];
}

export interface KibbeStyleGuide {
  outfits: OutfitRecommendation[];
  necklines: string[];
  pantRise: string;
  layering: string[];
  avoidNotes: string[];
  silhouetteTips: string[];
}

export const KIBBE_STYLE_GUIDES: Partial<Record<KibbeType, KibbeStyleGuide>> = {
  'Dramatic': {
    outfits: [
      { id: 'd-fitted', label: 'Sharp Minimalist', silhouette: 'fitted_basics', description: 'Clean lines, monochromatic', suitability: 'Honors vertical line and angular bone structure', keyPieces: ['Tailored blazer', 'Straight-leg trousers', 'Structured coat'] },
      { id: 'd-smart', label: 'Power Professional', silhouette: 'smart_casual', description: 'Bold, geometric pieces', suitability: 'Leverages strong frame and presence', keyPieces: ['Statement jacket', 'Slim fit shirt', 'Dark denim'] },
      { id: 'd-formal', label: 'Sleek Formal', silhouette: 'formal', description: 'Sharp, elongated silhouettes', suitability: 'Maximizes dramatic impact', keyPieces: ['Fitted suit', 'Minimal accessories', 'Pointed shoes'] },
    ],
    necklines: ['V-neck', 'Deep scoop', 'Angular collar'],
    pantRise: 'High rise preferred',
    layering: ['Long vertical layers', 'Structured pieces over soft', 'Avoid bulk'],
    avoidNotes: ['Avoid fussy details', 'Avoid rounded shapes', 'Avoid overly casual/shapeless'],
    silhouetteTips: ['Honor your vertical line', 'Keep lines long and unbroken', 'Minimal but bold accessories'],
  },
  
  'Soft Dramatic': {
    outfits: [
      { id: 'sd-fitted', label: 'Soft Power', silhouette: 'fitted_basics', description: 'Flowing with structure', suitability: 'Balances yang frame with yin curves', keyPieces: ['Draped blouse', 'High-waisted pants', 'Soft blazer'] },
      { id: 'sd-smart', label: 'Elegant Casual', silhouette: 'smart_casual', description: 'Luxe fabrics, soft draping', suitability: 'Showcases vertical + softness', keyPieces: ['Wrap top', 'Wide-leg trousers', 'Long cardigan'] },
      { id: 'sd-formal', label: 'Red Carpet Ready', silhouette: 'formal', description: 'Dramatic yet soft silhouettes', suitability: 'Maximum impact while honoring curves', keyPieces: ['Draped dress', 'Statement jewelry', 'Heeled boots'] },
    ],
    necklines: ['Cowl neck', 'Deep V', 'Off-shoulder'],
    pantRise: 'High rise to elongate',
    layering: ['Soft over structured', 'Flowing outer layers', 'Avoid stiff fabrics'],
    avoidNotes: ['Avoid boxy shapes', 'Avoid overly tailored/stiff', 'Avoid petite details'],
    silhouetteTips: ['Embrace your curves within vertical', 'Soft draping works beautifully', 'Go for drama with softness'],
  },
  
  'Natural': {
    outfits: [
      { id: 'n-fitted', label: 'Relaxed Minimalist', silhouette: 'fitted_basics', description: 'Easy, unconstructed pieces', suitability: 'Honors broad frame naturally', keyPieces: ['Oversized tee', 'Relaxed jeans', 'Casual blazer'] },
      { id: 'n-athleisure', label: 'Active Comfort', silhouette: 'athleisure', description: 'Sporty, functional style', suitability: 'Natural athletic aesthetic', keyPieces: ['Quality hoodie', 'Joggers', 'Sneakers'] },
      { id: 'n-smart', label: 'Effortless Smart', silhouette: 'smart_casual', description: 'Polished but relaxed', suitability: 'Professional without stiffness', keyPieces: ['Unstructured blazer', 'Chinos', 'Loafers'] },
    ],
    necklines: ['Crew neck', 'Boat neck', 'Open collar'],
    pantRise: 'Mid to low rise',
    layering: ['Relaxed layers', 'Natural fabrics', 'Avoid over-tailoring'],
    avoidNotes: ['Avoid overly fitted/structured', 'Avoid fussy details', 'Avoid delicate fabrics'],
    silhouetteTips: ['Embrace width in shoulders', 'Keep it relaxed and natural', 'Quality over formality'],
  },
  
  'Classic': {
    outfits: [
      { id: 'c-fitted', label: 'Timeless Basics', silhouette: 'fitted_basics', description: 'Balanced, quality pieces', suitability: 'Honors symmetrical proportions', keyPieces: ['Oxford shirt', 'Chinos', 'Leather belt'] },
      { id: 'c-smart', label: 'Refined Casual', silhouette: 'smart_casual', description: 'Polished, coordinated looks', suitability: 'Showcases balanced features', keyPieces: ['Polo shirt', 'Tailored shorts', 'Loafers'] },
      { id: 'c-formal', label: 'Traditional Elegance', silhouette: 'formal', description: 'Classic suit and tie', suitability: 'Maximizes natural sophistication', keyPieces: ['Navy suit', 'White shirt', 'Silk tie'] },
    ],
    necklines: ['Classic collar', 'Moderate V', 'Crew neck'],
    pantRise: 'Mid rise, classic fit',
    layering: ['Balanced layers', 'Matching sets', 'Avoid extremes'],
    avoidNotes: ['Avoid overly trendy pieces', 'Avoid extremes in fit', 'Avoid bold patterns'],
    silhouetteTips: ['Stick to classics', 'Quality fabrics matter', 'Balance is key'],
  },
  
  'Romantic': {
    outfits: [
      { id: 'r-fitted', label: 'Soft Fitted', silhouette: 'fitted_basics', description: 'Gentle curves, soft fabrics', suitability: 'Honors yin-dominant curves', keyPieces: ['Soft knit', 'Fitted pants', 'Rounded accessories'] },
      { id: 'r-smart', label: 'Elegant Soft', silhouette: 'smart_casual', description: 'Romantic details, flowing lines', suitability: 'Showcases natural softness', keyPieces: ['Silk shirt', 'Pleated pants', 'Soft loafers'] },
      { id: 'r-formal', label: 'Luxe Romance', silhouette: 'formal', description: 'Rich fabrics, soft structure', suitability: 'Elegant and curve-honoring', keyPieces: ['Velvet blazer', 'Soft shirt', 'Rounded shoes'] },
    ],
    necklines: ['Round neck', 'Soft V', 'Draped collar'],
    pantRise: 'Mid to high rise',
    layering: ['Soft over soft', 'Avoid stiff layers', 'Flowing cardigans'],
    avoidNotes: ['Avoid sharp angles', 'Avoid overly structured', 'Avoid harsh fabrics'],
    silhouetteTips: ['Embrace curves', 'Soft fabrics are your friend', 'Rounded shapes work best'],
  },
  
  'Gamine': {
    outfits: [
      { id: 'g-fitted', label: 'Playful Fitted', silhouette: 'fitted_basics', description: 'Compact, fitted pieces', suitability: 'Honors petite frame with yang', keyPieces: ['Fitted tee', 'Slim jeans', 'Sneakers'] },
      { id: 'g-smart', label: 'Sharp Casual', silhouette: 'smart_casual', description: 'Mix of sharp and playful', suitability: 'Showcases youthful energy', keyPieces: ['Cropped jacket', 'Ankle pants', 'Bold accessories'] },
      { id: 'g-athleisure', label: 'Active Edge', silhouette: 'athleisure', description: 'Sporty with attitude', suitability: 'Natural fit for compact frame', keyPieces: ['Track jacket', 'Fitted joggers', 'Retro sneakers'] },
    ],
    necklines: ['Crew neck', 'High collar', 'Sharp V'],
    pantRise: 'Any rise, cropped lengths',
    layering: ['Short layers', 'Compact pieces', 'Avoid oversized'],
    avoidNotes: ['Avoid oversized/shapeless', 'Avoid long flowing pieces', 'Avoid heavy fabrics'],
    silhouetteTips: ['Keep it compact', 'Mix yin and yang details', 'Play with contrasts'],
  },
};

// ============================================
// RECOMMENDATION FUNCTIONS
// ============================================

export function getFaceStyleRecommendations(
  faceShape: FaceShapeLabel,
  faceShapeConfidence: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ratioSignals?: Array<{ key: string; status: string }>
): {
  haircuts: HairstyleRecommendation[];
  glasses: GlassesRecommendation[];
  groomingNotes: string[];
  confidence: number;
} {
  // If confidence too low, return safe defaults
  if (faceShapeConfidence < 0.6) {
    return {
      haircuts: [
        FACE_STYLE_GUIDES.oval.haircuts.casualTextured,
        FACE_STYLE_GUIDES.oval.haircuts.cleanProfessional,
        FACE_STYLE_GUIDES.oval.haircuts.safeDefault,
      ],
      glasses: FACE_STYLE_GUIDES.oval.glasses,
      groomingNotes: ['Focus on clean, balanced styles', 'Experiment to find what works', 'Consider professional consultation'],
      confidence: faceShapeConfidence,
    };
  }
  
  const guide = FACE_STYLE_GUIDES[faceShape];
  
  return {
    haircuts: [
      guide.haircuts.casualTextured,
      guide.haircuts.cleanProfessional,
      guide.haircuts.safeDefault,
    ],
    glasses: guide.glasses,
    groomingNotes: guide.groomingNotes,
    confidence: faceShapeConfidence,
  };
}

export function getBodyStyleRecommendations(
  kibbeType: KibbeType | null,
  kibbeConfidence: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _proportions?: { verticalLine?: string; frameSize?: string }
): {
  outfits: OutfitRecommendation[];
  silhouetteTips: string[];
  avoidNotes: string[];
  confidence: number;
} {
  // If no clear type or low confidence, return universal tips
  if (!kibbeType || kibbeConfidence < 0.6) {
    return {
      outfits: [
        { id: 'universal-1', label: 'Clean Basics', silhouette: 'fitted_basics', description: 'Well-fitted essentials', suitability: 'Works for most body types', keyPieces: ['Fitted tee', 'Dark jeans', 'Clean sneakers'] },
        { id: 'universal-2', label: 'Smart Casual', silhouette: 'smart_casual', description: 'Polished everyday wear', suitability: 'Universally flattering', keyPieces: ['Button-down', 'Chinos', 'Loafers'] },
      ],
      silhouetteTips: ['Focus on fit over style', 'Tailor when possible', 'Quality basics go far'],
      avoidNotes: ['Avoid extremes in fit', 'Avoid trendy pieces until you know your style'],
      confidence: kibbeConfidence,
    };
  }
  
  const guide = KIBBE_STYLE_GUIDES[kibbeType];
  
  if (!guide) {
    // Fallback for types not fully defined
    return {
      outfits: [
        { id: 'fallback-1', label: 'Balanced Basics', silhouette: 'fitted_basics', description: 'Versatile essentials', suitability: 'Safe starting point', keyPieces: ['Neutral tee', 'Classic jeans', 'Simple sneakers'] },
      ],
      silhouetteTips: ['Experiment with different silhouettes', 'Note what feels natural'],
      avoidNotes: [],
      confidence: kibbeConfidence * 0.7,
    };
  }
  
  return {
    outfits: guide.outfits,
    silhouetteTips: guide.silhouetteTips,
    avoidNotes: guide.avoidNotes,
    confidence: kibbeConfidence,
  };
}

// ============================================
// TIME ESTIMATION CONSTANTS
// ============================================

export const TIME_ESTIMATES = {
  hair: {
    sameDay: { min: 0, max: 0 },
    minorChange: { min: 0, max: 2 },
    moderateChange: { min: 4, max: 10 },
    majorChange: { min: 8, max: 20 },
    growthRate: 1.25, // cm per month
  },
  skin: {
    lightingOnly: { min: 0, max: 0 },
    minorImprovement: { min: 2, max: 6 },
    routineResults: { min: 6, max: 12 },
    significantChange: { min: 12, max: 24 },
  },
  grooming: {
    immediate: { min: 0, max: 0 },
    stubble: { min: 0, max: 1 },
    beardGrowth: { min: 4, max: 12 },
  },
  glasses: {
    purchase: { min: 0, max: 2 },
  },
  body: {
    postureImprovement: { min: 2, max: 12 },
    lightFatLoss: { min: 4, max: 8 },
    moderateFatLoss: { min: 8, max: 16 },
    significantFatLoss: { min: 16, max: 40 },
    muscleGainNovice: { min: 8, max: 16 },
    muscleGainIntermediate: { min: 12, max: 24 },
  },
};
