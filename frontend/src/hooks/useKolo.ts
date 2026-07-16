import { useEffect, useRef, useState } from "react";
import { useReadContracts } from "wagmi";
import { koloPadiAbi } from "../abi";
import { KOLOPADI_ADDRESS } from "../config/contract";
import type { Kolo } from "../types";

const contractBase = {
  address: KOLOPADI_ADDRESS,
  abi: koloPadiAbi,
} as const;

/// Pulls a kolo's full state (struct + current epoch + seconds left) in one
/// multicall. Returns `refetch` so callers can force a refresh right after a
/// transaction confirms, instead of waiting for the poll interval.
export function useKolo(koloId: bigint | undefined) {
  const enabled = koloId !== undefined;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...contractBase, functionName: "getKolo", args: enabled ? [koloId] : undefined },
      { ...contractBase, functionName: "currentEpochIndex", args: enabled ? [koloId] : undefined },
      { ...contractBase, functionName: "secondsUntilNextEpoch", args: enabled ? [koloId] : undefined },
    ],
    query: {
      enabled,
      refetchInterval: 15_000,
    },
  });

  const [getKoloResult, currentEpochResult, secondsUntilResult] = data ?? [];

  const currentEpochForDepositCheck = currentEpochResult?.status === "success" ? currentEpochResult.result : undefined;

  // Separate read gated on knowing the current epoch first - lets us disable
  // the "Feed your kolo" button once today's deposit already landed.
  const { data: depositedCurrentEpochData, refetch: refetchDepositedCurrentEpoch } = useReadContracts({
    contracts: [
      {
        ...contractBase,
        functionName: "depositedEpochs",
        args: enabled && currentEpochForDepositCheck !== undefined ? [koloId, currentEpochForDepositCheck] : undefined,
      },
    ],
    query: {
      enabled: enabled && currentEpochForDepositCheck !== undefined,
      refetchInterval: 15_000,
    },
  });
  const hasDepositedCurrentEpoch = depositedCurrentEpochData?.[0]?.status === "success" ? depositedCurrentEpochData[0].result : undefined;

  const kolo: Kolo | undefined =
    getKoloResult?.status === "success"
      ? {
          owner: getKoloResult.result[0],
          padi: getKoloResult.result[1],
          depositAmount: getKoloResult.result[2],
          epochLength: getKoloResult.result[3],
          durationEpochs: getKoloResult.result[4],
          startTime: getKoloResult.result[5],
          totalSaved: getKoloResult.result[6],
          depositedCount: getKoloResult.result[7],
          currentStreak: getKoloResult.result[8],
          status: getKoloResult.result[9],
        }
      : undefined;

  const currentEpoch = currentEpochResult?.status === "success" ? currentEpochResult.result : undefined;
  const secondsUntilNextEpochOnChain = secondsUntilResult?.status === "success" ? secondsUntilResult.result : undefined;

  const combinedRefetch = () => {
    refetch();
    refetchDepositedCurrentEpoch();
  };
  // Interval callbacks below close over stale versions of combinedRefetch
  // otherwise, since we deliberately don't restart the interval every render.
  const combinedRefetchRef = useRef(combinedRefetch);
  combinedRefetchRef.current = combinedRefetch;

  // Chain-reported seconds-left goes stale between polls, so count it down
  // locally client-side for a smooth ticking timer, then resync on refetch.
  const [secondsUntilNextEpoch, setSecondsUntilNextEpoch] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    setSecondsUntilNextEpoch(secondsUntilNextEpochOnChain);
  }, [secondsUntilNextEpochOnChain]);

  useEffect(() => {
    if (secondsUntilNextEpoch === undefined) return;
    if (secondsUntilNextEpoch <= 0n) return;
    const id = setInterval(() => {
      setSecondsUntilNextEpoch((s) => {
        if (s === undefined) return s;
        if (s <= 1n) {
          // The countdown just crossed the epoch boundary. Refetch right
          // away instead of waiting for the next scheduled poll (up to
          // 15s later), so the Feed button and epoch counter don't lag
          // behind what actually just happened on chain.
          combinedRefetchRef.current();
          return 0n;
        }
        return s - 1n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsUntilNextEpoch !== undefined]);

  return { kolo, currentEpoch, secondsUntilNextEpoch, hasDepositedCurrentEpoch, isLoading, refetch: combinedRefetch };
}
