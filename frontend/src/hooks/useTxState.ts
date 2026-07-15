import { useEffect } from "react";
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

  useEffect(() => {
    if (isConfirmed) onConfirmed?.();
    // Only re-run when the confirmation flips, not on every onConfirmed identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
