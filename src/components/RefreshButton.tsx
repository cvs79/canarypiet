import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  onRefresh: () => void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  return (
    <Button onClick={onRefresh}>
      Refresh
    </Button>
  );
}
