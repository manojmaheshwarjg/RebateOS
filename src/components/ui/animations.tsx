'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    showPercentage?: boolean;
}

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    showPercentage = true
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-muted opacity-20"
                />
                {/* Progress circle with gradient */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                    </linearGradient>
                </defs>
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                </div>
            )}
        </div>
    );
}

interface PulsingDotProps {
    color?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function PulsingDot({ color = 'primary', size = 'md' }: PulsingDotProps) {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <div className="relative inline-flex">
            <motion.div
                className={`${sizeClasses[size]} rounded-full bg-${color}`}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-${color}`}
                animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.6, 0, 0.6],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
}

interface TypewriterTextProps {
    text: string;
    delay?: number;
    onComplete?: () => void;
}

export function TypewriterText({ text, delay = 30, onComplete }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, delay);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, delay, text, onComplete]);

    return <span>{displayedText}</span>;
}

interface ScanLineProps {
    height?: number;
}

export function ScanLine({ height = 200 }: ScanLineProps) {
    return (
        <div className="relative overflow-hidden" style={{ height }}>
            <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{
                    y: [0, height, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
}

interface ConfettiExplosionProps {
    onComplete?: () => void;
}

export function ConfettiExplosion({ onComplete }: ConfettiExplosionProps) {
    const [particles] = useState(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100 - 50,
            y: Math.random() * -100 - 50,
            rotation: Math.random() * 360,
            color: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'][
                Math.floor(Math.random() * 3)
            ],
            size: Math.random() * 8 + 4,
        }))
    );

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-sm"
                    style={{
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                    }}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        rotate: 0,
                    }}
                    animate={{
                        x: particle.x * 4,
                        y: particle.y * 4,
                        opacity: 0,
                        rotate: particle.rotation,
                    }}
                    transition={{
                        duration: 1.5,
                        ease: 'easeOut',
                    }}
                    onAnimationComplete={() => {
                        if (particle.id === particles.length - 1 && onComplete) {
                            onComplete();
                        }
                    }}
                />
            ))}
        </div>
    );
}

interface ShimmerCardProps {
    width?: string;
    height?: string;
    className?: string;
}

export function ShimmerCard({ width = 'w-full', height = 'h-32', className = '' }: ShimmerCardProps) {
    return (
        <div className={`${width} ${height} ${className} relative overflow-hidden rounded-lg bg-muted/30`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    );
}

interface ProcessingStageIndicatorProps {
    stages: {
        name: string;
        status: 'pending' | 'active' | 'completed';
        icon?: React.ReactNode;
    }[];
}

export function ProcessingStageIndicator({ stages }: ProcessingStageIndicatorProps) {
    return (
        <div className="space-y-2">
            {stages.map((stage, index) => (
                <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                >
                    {/* Status indicator */}
                    <div className="relative flex items-center justify-center w-6 h-6">
                        {stage.status === 'completed' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                        )}
                        {stage.status === 'active' && <PulsingDot size="md" />}
                        {stage.status === 'pending' && (
                            <div className="w-6 h-6 rounded-full border-2 border-muted" />
                        )}
                    </div>

                    {/* Stage name */}
                    <span
                        className={`text-sm font-medium ${stage.status === 'completed'
                                ? 'text-green-600'
                                : stage.status === 'active'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            }`}
                    >
                        {stage.status === 'active' ? (
                            <TypewriterText text={stage.name} />
                        ) : (
                            stage.name
                        )}
                    </span>

                    {/* Icon */}
                    {stage.icon && stage.status !== 'pending' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto"
                        >
                            {stage.icon}
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
