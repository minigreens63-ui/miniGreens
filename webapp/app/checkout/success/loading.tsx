import { Skeleton } from "@/components/skeletons/Skeleton";

export default function CheckoutSuccessLoading() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center md:px-10">
      <Skeleton className="mx-auto size-14 rounded-full" />
      <Skeleton className="mx-auto mt-6 h-9 w-72 max-w-full" />
      <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />

      <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white p-6 text-left shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
        <div className="flex justify-between border-b border-black/[0.07] py-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between py-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Skeleton className="h-[52px] w-full rounded-full" />
        <Skeleton className="h-[52px] w-full rounded-full" />
      </div>
    </main>
  );
}
