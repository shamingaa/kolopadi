import { useReadContracts } from "wagmi";
import { koloPadiAbi } from "../abi";
import { KOLOPADI_ADDRESS } from "../config/contract";

const MAX_EPOCHS_SCANNED = 200;

/// Scans every epoch of a kolo and asks the contract, one by one (batched
/// into a single multicall), whether it's currently slashable. Good enough
/// for demo-scale durations; a longer-running real-mode kolo would want a
/// smarter approach, but the contract's own `isEpochSlashable` is the
/// source of truth either way.
export function useSlashableEpochs(koloId: bigint | undefined, durationEpochs: bigint | undefined) {
  const count = durationEpochs !== undefined ? Math.min(Number(durationEpochs), MAX_EPOCHS_SCANNED) : 0;
  const enabled = koloId !== undefined && count > 0;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: enabled
      ? Array.from({ length: count }, (_, epochIndex) => ({
          address: KOLOPADI_ADDRESS,
          abi: koloPadiAbi,
          functionName: "isEpochSlashable" as const,
          args: [koloId, BigInt(epochIndex)] as const,
        }))
      : [],
    query: { enabled, refetchInterval: 15_000 },
  });

  const slashableEpochs = (data ?? [])
    .map((result, epochIndex) => (result.status === "success" && result.result ? epochIndex : null))
    .filter((epochIndex): epochIndex is number => epochIndex !== null);

  return { slashableEpochs, isLoading, refetch };
}
