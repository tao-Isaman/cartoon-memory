import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-heartbeat text-primary">
        <Sparkles size={48} />
      </div>
    </div>
  );
}
