import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  text?: string;
  className?: string;
}

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({
  size = 'md',
  fullscreen = false,
  text,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-500',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
        {text && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </p>
        )}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center gap-3">
        {spinner}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      </div>
    );
  }

  return spinner;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const baseStyles =
    'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  if (variant === 'circular') {
    return (
      <div
        className={cn(
          baseStyles,
          'rounded-full',
          width || 'w-10',
          height || 'h-10',
          className
        )}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn(
          baseStyles,
          'rounded-lg',
          width || 'w-full',
          height || 'h-32',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        baseStyles,
        'h-4',
        width || 'w-full',
        className
      )}
    />
  );
}

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ count = 1, className }: SkeletonCardProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="w-12" height="h-12" />
            <div className="flex-1 space-y-2">
              <Skeleton width="w-1/3" />
              <Skeleton width="w-1/4" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton />
            <Skeleton width="w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      <div className="h-12 bg-gray-100 dark:bg-gray-700 animate-pulse" />
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center px-4 py-3.5 border-t border-gray-100 dark:border-gray-700 gap-4"
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? 'w-8' : `w-1/${columns}`}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
