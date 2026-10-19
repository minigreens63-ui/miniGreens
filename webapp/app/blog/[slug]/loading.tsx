import { Skeleton } from "@/components/skeletons/Skeleton";

export default function BlogPostLoading() {
  return (
    <div className="bg-(--color-cream)">
      <article className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <Skeleton className="h-4 w-36" />

        <Skeleton className="mt-6 h-3 w-24" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-2 h-10 w-2/3" />
        <Skeleton className="mt-4 h-3 w-40" />

        <Skeleton className="mt-8 aspect-[16/9] w-full rounded-3xl" />

        <div className="mt-10 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-black/5 pt-8">
          <Skeleton className="h-12 w-36 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </article>
    </div>
  );
}
