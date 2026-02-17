import { cn } from '../../lib/utils';

export default function Spinner({ className }) {
  return (
    <div
      className={cn(
        'size-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin',
        className
      )}
    />
  );
}
