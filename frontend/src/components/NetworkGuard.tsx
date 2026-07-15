import type { ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { monadTestnet } from "../config/chain";

/// Wraps the app content. If the wallet is connected but pointed at the
/// wrong chain, shows a "switch network" prompt instead of the real UI -
/// there's no point letting someone try to feed a kolo that doesn't exist
/// on whatever chain they're currently on.
export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isConnected || chainId === monadTestnet.id) {
    return <>{children}</>;
  }

  return (
    <div className="network-guard">
      <div className="network-guard__card">
        <h2>Wrong network, padi</h2>
        <p>KoloPadi only dey live on Monad Testnet. Switch to continue.</p>
        <button
          className="btn btn--primary"
          disabled={isPending}
          onClick={() => switchChain({ chainId: monadTestnet.id })}
        >
          {isPending ? "Switching..." : "Switch to Monad Testnet"}
        </button>
        {error && <p className="network-guard__error">{error.message}</p>}
      </div>
    </div>
  );
}
