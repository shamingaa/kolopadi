import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Eip1193Provider {
  on: (event: string, handler: () => void) => void;
  removeListener: (event: string, handler: () => void) => void;
}

/// Belt-and-suspenders fix for a real gap: wagmi's injected connector only
/// picks up an account switch if MetaMask actually emits "accountsChanged"
/// for it, which MetaMask sometimes doesn't do reliably unless both
/// accounts already have explicit site permission (a known MetaMask
/// quirk, not something we control). When that event does fire but a
/// query was already cached under a route that doesn't visibly depend on
/// the address (e.g. a stale "no kolo" read from earlier in the session),
/// nothing forces a re-fetch. This listens directly on the raw provider
/// and nukes the whole query cache on any account or chain change, so a
/// switch always shows fresh data without needing a manual page reload.
export function useResyncOnWalletChange() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
    if (!ethereum || typeof ethereum.on !== "function") return;

    const resync = () => {
      queryClient.invalidateQueries();
    };

    // Called as ethereum.on(...)/ethereum.removeListener(...), not through a
    // detached reference - MetaMask's provider is a real EventEmitter whose
    // methods read `this._events`, so calling them without `ethereum` as the
    // receiver throws ("Cannot read properties of undefined (reading '_events')").
    ethereum.on("accountsChanged", resync);
    ethereum.on("chainChanged", resync);

    return () => {
      ethereum.removeListener("accountsChanged", resync);
      ethereum.removeListener("chainChanged", resync);
    };
  }, [queryClient]);
}
