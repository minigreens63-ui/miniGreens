import { LoadRipple } from "@/components/ui/load-ripple";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadRipple />
    </div>
  );
}
