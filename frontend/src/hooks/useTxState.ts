import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

/// Thin wrapper around wagmi's write + wait-for-receipt hooks, so every
/// button in the app can show the same three states (idle -> pending in
/// wallet -> confirming on chain -> done) without repeating the plumbing.
export function useTxState(onConfirmed?: () => void) {
  const { writeContract, writeContractAsync, data: hash, isPending: isSigning, error, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: receiptFetched,
    data: receipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  // A fetched receipt only means the transaction was MINED, not that it
  // succeeded - a reverted tx still gets a receipt (status: "reverted"),
  // fetched without error. Treating "receipt fetched" as "it worked" is
  // exactly what let a padi's slash attempt on an already-claimed kolo
  // revert on-chain while the UI showed no error and never refreshed.
  const isReverted = receiptFetched && receipt?.status === "reverted";
  const isConfirmed = receiptFetched && receipt?.status === "success";

  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  useEffect(() => {
    if (!isConfirmed && !isReverted) return;
    // Refetch on a revert too - the on-chain state didn't change, but ours
    // might be stale (e.g. someone else changed it first), so re-syncing
    // is what makes a now-invalid button correctly disable itself.
    onConfirmedRef.current?.();
    // The RPC node serving reads can lag a moment behind the node that just
    // accepted the write, so an immediate refetch can still see stale state
    // (this is exactly what caused a "Claim" button to stick around after a
    // successful claim). Refetch once more shortly after as a self-healing
    // safety net.
    const id = setTimeout(() => onConfirmedRef.current?.(), 2500);
    return () => clearTimeout(id);
  }, [isConfirmed, isReverted]);

  return {
    writeContract,
    writeContractAsync,
    isSigning,
    isConfirming,
    isConfirmed,
    isReverted,
    isBusy: isSigning || isConfirming,
    error: error ?? receiptError ?? (isReverted ? new Error("Transaction reverted on-chain - this action is no longer valid.") : undefined),
    hash,
    reset,
  };
}
