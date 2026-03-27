const Skeleton = ({ className = '' }) => (
  <div className={`bg-surface-container-high rounded-xl animate-pulse ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-surface-container border border-outline-variant/10 rounded-2xl p-4 space-y-3">
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex gap-4 px-4 py-3 border-b border-outline-variant/10">
    <Skeleton className="h-4 w-8"  />
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-20" />
  </div>
);

export default Skeleton;
