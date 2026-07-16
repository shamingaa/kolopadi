import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

/// Thin wrapper around wagmi's write + wait-for-receipt hooks, so every
/// button in the app can show the same three states (idle -> pending in
/// wallet -> confirming on chain -> done) without repeating the plumbing.
export function useTxState(onConfirmed?: () => void) {
  const { writeContract, writeContractAsync, data: hash, isPending: isSigning, error, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  useEffect(() => {
    if (!isConfirmed) return;
    onConfirmedRef.current?.();
    // The RPC node serving reads can lag a moment behind the node that just
    // accepted the write, so an immediate refetch can still see stale state
    // (this is exactly what caused a "Claim" button to stick around after a
    // successful claim). Refetch once more shortly after as a self-healing
    // safety net.
    const id = setTimeout(() => onConfirmedRef.current?.(), 2500);
    return () => clearTimeout(id);
  }, [isConfirmed]);

  return {
    writeContract,
    writeContractAsync,
    isSigning,
    isConfirming,
    isConfirmed,
    isBusy: isSigning || isConfirming,
    error: error ?? receiptError,
    hash,
    reset,
  };
}
