export default function AdminField({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </label>
      <input
        className="w-full px-4 py-2.5 bg-surface-container-highest border-none
          focus:ring-2 focus:ring-primary/50 text-on-surface rounded-xl transition-all
          placeholder:text-on-surface-variant/50 outline-none text-sm"
        {...props}
      />
    </div>
  );
}