import { Skeleton } from "@/components/skeletons/Skeleton";

export default function LoginLoading() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 md:px-10">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </main>
  );
}
