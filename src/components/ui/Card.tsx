import { cn } from '@/lib/utils';

type CardPadding = 'sm' | 'md' | 'lg' | 'none';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  padding?: CardPadding;
  className?: string;
}

const paddingStyles: Record<CardPadding, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
  none: 'p-0',
};

export default function Card({
  children,
  hoverable = false,
  gradient = false,
  gradientFrom = 'from-primary-50',
  gradientTo = 'to-white',
  padding = 'md',
  className,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        'transition-all duration-300 ease-out',
        hoverable && 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        gradient && `bg-gradient-to-br ${gradientFrom} ${gradientTo}`,
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
