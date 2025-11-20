import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner className="text-muted-foreground h-12 w-12" />
    </div>
  );
}
