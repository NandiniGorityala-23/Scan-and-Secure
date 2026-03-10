export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-16 text-slate-400">
      {Icon && <Icon size={32} className="mx-auto mb-3 text-slate-300" />}
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}

