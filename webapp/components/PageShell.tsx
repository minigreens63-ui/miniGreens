interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ eyebrow, title, intro, badge, children }: Props) {
  return (
    <div>
      <div className="border-b border-black/5 bg-(--color-cream)">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            {eyebrow}
          </p>
          <h1 className="font-serif-display mt-3 text-4xl leading-[1.08] text-(--color-forest) sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-(--color-forest)/70">{intro}</p>
          {badge && <div className="mt-6">{badge}</div>}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_2px_14px_rgba(31,58,36,0.06)] md:p-8">
      {title && <h2 className="font-serif-display text-2xl text-(--color-forest)">{title}</h2>}
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-(--color-forest)/70">{children}</div>
    </section>
  );
}
