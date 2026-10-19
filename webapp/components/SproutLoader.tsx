import styles from "./SproutLoader.module.css";

export function SproutLoader({ label = "Growing freshness" }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <svg className={styles.svg} viewBox="0 0 160 160" aria-hidden="true">
        <ellipse className={styles.soil} cx="80" cy="132" rx="44" ry="12" />
        <path className={styles.stem} d="M80 130 L80 72" />
        <path
          className={styles.leafLeft}
          d="M80 90 C 54 86, 42 64, 58 48 C 76 62, 82 78, 80 90 Z"
        />
        <path
          className={styles.leafRight}
          d="M80 90 C 106 86, 118 64, 102 48 C 84 62, 78 78, 80 90 Z"
        />
      </svg>
      <span className={styles.label}>{label}</span>
      <span className="sr-only">Loading</span>
    </div>
  );
}
