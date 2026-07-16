// Hand-drawn urn silhouette used as both the visible outline and the clip
// path for the "fill" liquid. One path, reused twice, keeps the two perfectly
// aligned no matter how the shape is tweaked.
const POT_PATH =
  "M75,15 L125,15 Q140,15 142,30 L145,50 Q185,70 188,120 Q190,175 145,195 " +
  "Q100,210 55,195 Q10,175 12,120 Q15,70 55,50 L58,30 Q60,15 75,15 Z";

export type KoloVisualStatus = "active" | "broken" | "claimed" | "empty";

interface KoloPotProps {
  fillPercent: number; // 0-100
  status: KoloVisualStatus;
  size?: number;
}

export function KoloPot({ fillPercent, status, size = 220 }: KoloPotProps) {
  const clampedFill = Math.max(0, Math.min(100, fillPercent));
  // Pot's drawable interior runs roughly from y=32 (neck) to y=203 (base).
  const fillTop = 203 - (171 * clampedFill) / 100;

  const isBroken = status === "broken";
  const isClaimed = status === "claimed";
  const isEmpty = status === "empty";

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={`kolo-pot kolo-pot--${status}`}
      role="img"
      aria-label={
        isBroken
          ? "Broken kolo"
          : isClaimed
            ? "Completed kolo, fully claimed"
            : `Kolo, ${Math.round(clampedFill)} percent full`
      }
    >
      <defs>
        <clipPath id="potClip">
          <path d={POT_PATH} />
        </clipPath>
        <linearGradient id="clayGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--clay-400)" />
          <stop offset="100%" stopColor="var(--clay-600)" />
        </linearGradient>
        <linearGradient id="fillGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--gold-500)" />
          <stop offset="100%" stopColor="#f0c778" />
        </linearGradient>
      </defs>

      <g className={isBroken ? "kolo-pot__shard kolo-pot__shard--left" : undefined}>
        <path d={POT_PATH} fill="url(#clayGradient)" />
        <g clipPath="url(#potClip)">
          {!isEmpty && (
            <rect
              className="kolo-pot__liquid"
              x="0"
              y={fillTop}
              width="200"
              height={220 - fillTop}
              fill={isClaimed ? "var(--moss-500)" : "url(#fillGradient)"}
            />
          )}
          {/* Soft ceramic sheen - the detail that reads as "glazed pottery" rather than a flat icon. */}
          <ellipse cx="66" cy="62" rx="20" ry="30" fill="#fff" opacity="0.14" />
        </g>
        <path d={POT_PATH} fill="none" stroke="var(--clay-900)" strokeWidth="1.5" opacity="0.18" />
      </g>

      {isBroken && (
        <g className="kolo-pot__cracks" stroke="var(--clay-900)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M100,20 L88,70 L108,110 L92,150 L104,198" />
          <path d="M60,60 L78,90 L64,125" />
          <path d="M140,65 L124,95 L138,135" />
        </g>
      )}
    </svg>
  );
}
