import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function connectorLabel(connectorId: string) {
  if (connectorId === "injected") return "Browser wallet";
  if (connectorId === "walletConnect") return "WalletConnect (mobile)";
  return connectorId;
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isConnected && address) {
    return (
      <button className="wallet-pill" onClick={() => disconnect()} title="Disconnect wallet">
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="wallet-pill wallet-pill--connect"
        disabled={isPending}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {isPending ? "Connecting..." : "Connect wallet"}
      </button>

      {menuOpen && !isPending && (
        <>
          <button className="wallet-connect__backdrop" aria-label="Close" onClick={() => setMenuOpen(false)} />
          <div className="wallet-connect__menu">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                className="wallet-connect__option"
                onClick={() => {
                  setMenuOpen(false);
                  connect({ connector });
                }}
              >
                {connectorLabel(connector.id)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
