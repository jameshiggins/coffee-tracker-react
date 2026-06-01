import { cn } from './cn.js';

/**
 * Skeleton — a shimmering placeholder for loading states.
 *
 * Uses the `surface-muted` token (so it themes for light/dark automatically)
 * with a subtle pulse. The global prefers-reduced-motion rule neutralizes the
 * animation for users who've asked for less motion.
 *
 * Decorative by default (aria-hidden). For screen-reader users, put the
 * skeleton group inside an element with role="status" and an aria-label like
 * "Loading beans" so the loading state is announced once, not per-block.
 */
export default function Skeleton({ className, rounded = 'rounded-md', ...rest }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-surface-muted', rounded, className)}
      {...rest}
    />
  );
}

/**
 * SkeletonBeanCard — mirrors the collapsed BeanCard layout (thumb + lines +
 * chip row + price) so the grid doesn't reflow when real cards swap in.
 */
export function SkeletonBeanCard() {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-20 h-20 flex-shrink-0" rounded="rounded-lg" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <div className="flex gap-1.5 mt-3">
            <Skeleton className="h-5 w-16" rounded="rounded-full" />
            <Skeleton className="h-5 w-14" rounded="rounded-full" />
            <Skeleton className="h-5 w-12" rounded="rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
