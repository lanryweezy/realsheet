import React from 'react';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  type?: 'line' | 'bar';
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 60,
  height = 20,
  color = '#22d3ee',
  type = 'line'
}) => {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  if (type === 'bar') {
    const barWidth = width / values.length;
    return (
      <svg width={width} height={height} className="overflow-visible">
        {values.map((v, i) => {
          const h = ((v - min) / range) * height || 1;
          return (
            <rect
              key={i}
              x={i * barWidth}
              y={height - h}
              width={barWidth - 1}
              height={h}
              fill={color}
              className="opacity-60"
            />
          );
        })}
      </svg>
    );
  }

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="drop-shadow-[0_0_2px_rgba(34,211,238,0.5)]"
      />
    </svg>
  );
};
