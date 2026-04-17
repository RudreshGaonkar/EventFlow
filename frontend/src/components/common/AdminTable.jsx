import { Plus } from 'lucide-react';
// import { TableRowSkeleton } from './components/common/LoadingSkeleton';

export default function AdminTable({ title, onAdd, loading, columns, rows, hideAdd }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface font-headline">{title}</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{rows.length} records</p>
        </div>
        {!hideAdd && onAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-container
              text-on-primary-container text-sm font-semibold rounded-xl
              hover:opacity-90 transition-all">
            <Plus size={15} /> Add New
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-container border border-outline-variant/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10px] font-bold uppercase
                    tracking-widest text-on-surface-variant/60">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant/10 last:border-0">
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-surface-container-high rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-on-surface-variant text-sm">No records found</td></tr>
                  : rows.map((row, i) => (
                      <tr key={i} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-on-surface-variant whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
