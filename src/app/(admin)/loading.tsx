import { Shield } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="animate-heartbeat text-accent">
        <Shield size={48} />
      </div>
    </div>
  );
}
