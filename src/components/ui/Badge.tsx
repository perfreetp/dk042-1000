import { cn } from '@/lib/utils';

type BadgeColor =
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'gray';

type BadgeStatus =
  | 'available'
  | 'active'
  | 'frozen'
  | 'pending'
  | 'warning'
  | 'expired'
  | 'disabled'
  | 'inactive';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  status?: BadgeStatus;
  dot?: boolean;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const dotColorStyles: Record<BadgeColor, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
};

const statusToColorMap: Record<BadgeStatus, BadgeColor> = {
  available: 'green',
  active: 'green',
  frozen: 'yellow',
  pending: 'yellow',
  warning: 'orange',
  expired: 'red',
  disabled: 'gray',
  inactive: 'gray',
};

export default function Badge({
  children,
  color,
  status,
  dot = false,
  className,
}: BadgeProps) {
  const resolvedColor = status ? statusToColorMap[status] : color ?? 'gray';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorStyles[resolvedColor],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColorStyles[resolvedColor]
          )}
        />
      )}
      {children}
    </span>
  );
}
