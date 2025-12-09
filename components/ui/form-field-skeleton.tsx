import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type LabelWidth = 'sm' | 'md' | 'lg' | 'xl';

const LABEL_WIDTH_CLASSES: Record<LabelWidth, string> = {
  sm: 'w-24', // 96px
  md: 'w-32', // 128px (default, matches most labels)
  lg: 'w-40', // 160px
  xl: 'w-48', // 192px
};

type FormFieldSkeletonProps = {
  /**
   * Show label skeleton
   * @default true
   */
  showLabel?: boolean;
  /**
   * Label width preset
   * @default "md"
   */
  labelWidth?: LabelWidth;
  /**
   * Additional className for the wrapper
   */
  className?: string;
};

/**
 * Reusable skeleton for form fields (inputs, selects, etc.)
 *
 * @example
 * ```tsx
 * <FormFieldSkeleton />
 * <FormFieldSkeleton showLabel={false} />
 * <FormFieldSkeleton labelWidth="lg" />
 * ```
 */
export function FormFieldSkeleton({
  showLabel = true,
  labelWidth = 'md',
  className,
}: FormFieldSkeletonProps) {
  return (
    <div className={cn('block space-y-2 text-sm', className)}>
      {showLabel && <Skeleton className={cn('h-[20px]', LABEL_WIDTH_CLASSES[labelWidth])} />}
      <Skeleton className="h-[38px] w-full" />
    </div>
  );
}
