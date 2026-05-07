import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  className,
  showBadge = true,
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0;

  return (
    <div className={cn('flex items-center flex-wrap gap-2', className)}>
      <span
        className={cn(
          'font-bold text-[var(--text-primary)]',
          textSizes[size]
        )}
      >
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn(
              'text-[var(--text-secondary)] line-through',
              size === 'xl' ? 'text-xl' : size === 'lg' ? 'text-base' : 'text-sm'
            )}
          >
            {formatPrice(compareAtPrice)}
          </span>

          {showBadge && (
            <span className="badge badge-success flex items-center gap-1">
              <Tag className="w-3 h-3" />
              -{discountPct}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
