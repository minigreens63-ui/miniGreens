import { Skeleton } from "@/components/skeletons/Skeleton";

export default function ManageSubscriptionsLoading() {
  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-10 w-80 max-w-full" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mx-auto max-w-2xl space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full max-w-sm">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-3 h-4 w-56" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
              <div className="mt-5 flex gap-3">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
