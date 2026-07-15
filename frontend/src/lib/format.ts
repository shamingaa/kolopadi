import { formatEther, parseEther } from "viem";

export function formatMon(wei: bigint | undefined, maxDecimals = 4): string {
  if (wei === undefined) return "0";
  const asString = formatEther(wei);
  const [whole, frac = ""] = asString.split(".");
  const trimmedFrac = frac.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmedFrac ? `${whole}.${trimmedFrac}` : whole;
}

export function monToWei(mon: string): bigint {
  return parseEther(mon || "0");
}

/// "1d 04:02:11" style countdown - big and legible, since urgency is the product.
export function formatCountdown(totalSeconds: bigint | undefined): string {
  if (totalSeconds === undefined || totalSeconds < 0n) return "--:--:--";
  const s = Number(totalSeconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function formatEpochLength(seconds: bigint | number): string {
  const s = Number(seconds);
  if (s < 3600) return `${Math.round(s / 60)} minutes`;
  if (s < 86400) return `${Math.round(s / 3600)} hours`;
  return `${Math.round(s / 86400)} day${s / 86400 !== 1 ? "s" : ""}`;
}
