import { Skeleton } from "@/components/skeletons/Skeleton";

export default function PartnerApplyLoading() {
  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-80 max-w-full" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-xl" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-black/[0.07] bg-white p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-2xl border border-black/[0.07] bg-white p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
