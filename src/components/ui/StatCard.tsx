import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: number;
  trendLabel?: string;
  formatter?: (value: number) => string;
  className?: string;
}

function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  return count;
}

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  color = 'bg-primary-500',
  trend,
  trendLabel,
  formatter,
  className,
}: StatCardProps) {
  const animatedValue = useCountUp(value);
  const isPositive = trend !== undefined && trend >= 0;

  const displayValue = formatter ? formatter(animatedValue) : animatedValue.toLocaleString();

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {prefix}
            {displayValue}
            {suffix}
          </p>

          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-sm font-medium',
                  isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl text-white',
              color
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
