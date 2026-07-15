import { useAccount, useReadContract } from "wagmi";
import { koloPadiAbi } from "../abi";
import { KOLOPADI_ADDRESS } from "../config/contract";

const contractBase = {
  address: KOLOPADI_ADDRESS,
  abi: koloPadiAbi,
} as const;

/// The most recently created kolo owned by the connected wallet, if any.
/// KoloPadi supports multiple kolos per owner, but the UI only ever shows
/// one at a time - the newest one is the one you're actively feeding.
export function useMyLatestKoloId() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    ...contractBase,
    functionName: "getKolosByOwner",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const koloId = data && data.length > 0 ? data[data.length - 1] : undefined;
  return { koloId, isLoading, refetch };
}

/// The most recent kolo where the connected wallet is named as padi.
export function useMyLatestPadiKoloId() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    ...contractBase,
    functionName: "getKolosByPadi",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const koloId = data && data.length > 0 ? data[data.length - 1] : undefined;
  return { koloId, isLoading, refetch };
}
