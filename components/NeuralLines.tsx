import React from 'react';

interface Point {
    x: number;
    y: number;
}

interface NeuralLinesProps {
    source: Point | null;
    targets: Point[];
}

export const NeuralLines: React.FC<NeuralLinesProps> = ({ source, targets }) => {
    if (!source || targets.length === 0) return null;

    return (
        <svg
            className="absolute inset-0 pointer-events-none z-[60] overflow-visible"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                <filter id="neural-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            {targets.map((target, i) => {
                const midX = (source.x + target.x) / 2;
                const path = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;

                return (
                    <g key={i}>
                        <path
                            d={path}
                            fill="none"
                            stroke="var(--nexus-accent)"
                            strokeWidth="1.5"
                            strokeOpacity="0.4"
                            filter="url(#neural-glow)"
                            className="animate-pulse"
                        />
                        <circle cx={target.x} cy={target.y} r="3" fill="var(--nexus-accent)" className="animate-pulse" />
                    </g>
                );
            })}
            <circle cx={source.x} cy={source.y} r="4" fill="var(--nexus-accent)" filter="url(#neural-glow)" />
        </svg>
    );
};
