import { Skeleton } from "@/components/skeletons/Skeleton";

export default function OffersLoading() {
  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-10 w-80 max-w-full" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
