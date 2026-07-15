export const KoloStatus = {
  Active: 0,
  Broken: 1,
  Claimed: 2,
} as const;

export type KoloStatusValue = (typeof KoloStatus)[keyof typeof KoloStatus];

export interface Kolo {
  owner: `0x${string}`;
  padi: `0x${string}`;
  depositAmount: bigint;
  epochLength: bigint;
  durationEpochs: bigint;
  startTime: bigint;
  totalSaved: bigint;
  depositedCount: bigint;
  currentStreak: bigint;
  // Solidity's `enum Status` decodes to a plain number via viem, not a
  // literal-typed union, so we keep this loose and compare against
  // KoloStatus.Active/.Broken/.Claimed instead of narrowing the type.
  status: number;
}
