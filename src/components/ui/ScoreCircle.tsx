'use client';

import { motion } from 'framer-motion';
import { cn, formatScore } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  className?: string;
  showGlow?: boolean;
  animated?: boolean;
  colorOverride?: string;
}

export function ScoreCircle({
  score,
  maxScore = 10,
  size = 'md',
  label,
  sublabel,
  className,
  showGlow = true,
  animated = true,
  colorOverride,
}: ScoreCircleProps) {
  const percentage = (score / maxScore) * 100;
  
  const sizes = {
    sm: { outer: 80, stroke: 6, textSize: 'text-xl', labelSize: 'text-xs' },
    md: { outer: 120, stroke: 8, textSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { outer: 160, stroke: 10, textSize: 'text-4xl', labelSize: 'text-base' },
  };
  
  const config = sizes[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Color based on score
  const getColor = () => {
    if (colorOverride) return colorOverride;
    if (score >= 7) return '#22c55e'; // green
    if (score >= 5) return '#a855f7'; // purple
    if (score >= 3) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  const color = getColor();

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Outer glow ring */}
      {showGlow && (
        <motion.div
          className="absolute rounded-full opacity-30"
          style={{
            width: config.outer + 20,
            height: config.outer + 20,
            left: -10,
            top: -10,
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      <div
        className="relative"
        style={{ width: config.outer, height: config.outer }}
      >
        <svg
          width={config.outer}
          height={config.outer}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(63, 63, 70, 0.5)"
            strokeWidth={config.stroke}
          />
          
          {/* Subtle inner glow */}
          <motion.circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius - 4}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: animated ? offset * 1.1 : offset * 1.1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              opacity: 0.2,
              filter: `blur(3px)`,
            }}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: animated ? circumference : offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
            style={{
              filter: showGlow ? `drop-shadow(0 0 12px ${color}80) drop-shadow(0 0 4px ${color})` : undefined,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn(config.textSize, 'font-bold')}
            style={{ 
              color,
              textShadow: showGlow ? `0 0 20px ${color}60` : undefined 
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animated ? 0.5 : 0, duration: 0.3 }}
          >
            {formatScore(score)}
          </motion.span>
          {label && (
            <span className={cn(config.labelSize, 'text-zinc-400')}>
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animated ? 0.7 : 0 }}
          className="mt-2 text-xs text-zinc-500 text-center"
        >
          {sublabel}
        </motion.span>
      )}
    </div>
  );
}
