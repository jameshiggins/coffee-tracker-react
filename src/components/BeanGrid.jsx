import BeanCard from './BeanCard.jsx';

/**
 * Presentational bean list: the responsive card grid plus its empty
 * state. Pure — owns no filter or data state; the parent passes the
 * already-filtered `beans` and the interaction callbacks. Only one card
 * is expanded at a time (the parent tracks `expandedId`); an expanded
 * card spans the full grid row (handled inside BeanCard).
 */
export default function BeanGrid({
  beans,
  expandedId,
  onExpandToggle,
  onChipClick,
  showRoasterChip = true,
  hasActiveFilters = false,
  onClearAll,
}) {
  if (beans.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 text-center text-fg-muted">
        <p className="font-medium text-fg">No beans match these filters</p>
        <p className="mt-1 text-sm">Try removing a filter or broadening your search.</p>
        {hasActiveFilters && (
          <button onClick={onClearAll} className="mt-3 text-sm text-accent hover:underline">
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {beans.map((bean) => (
        <BeanCard
          key={bean.id}
          coffee={bean}
          isExpanded={expandedId === bean.id}
          onExpandToggle={() => onExpandToggle(bean.id)}
          onChipClick={onChipClick}
          showRoasterChip={showRoasterChip}
        />
      ))}
    </div>
  );
}
