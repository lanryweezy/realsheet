import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
  animated?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animated = true
}) => {
  const baseClasses = `bg-slate-700/50 ${className}`;
  const animatedClass = animated ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-48 rounded-lg',
    circle: 'rounded-full',
    rect: 'rounded'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'string' ? width : `${width}px`;
  if (height && variant === 'circle' || variant === 'rect') {
    style.height = typeof height === 'string' ? height : `${height}px`;
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animatedClass}`}
      style={style}
    />
  );
};

// Pre-built skeleton layouts
export const CardSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton variant="avatar" width={48} height={48} />
    <Skeleton variant="title" width="70%" />
    <Skeleton variant="text" width="90%" />
    <Skeleton variant="text" width="60%" />
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton variant="avatar" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} variant="rect" height={32} className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="card" />
    ))}
  </div>
);

export default Skeleton;
