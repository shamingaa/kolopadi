import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button className="wallet-pill" onClick={() => disconnect()} title="Disconnect wallet">
        <span className="wallet-dot" />
        {shortenAddress(address)}
      </button>
    );
  }

  const injectedConnector = connectors[0];

  return (
    <button
      className="wallet-pill wallet-pill--connect"
      disabled={isPending}
      onClick={() => connect({ connector: injectedConnector })}
    >
      {isPending ? "Connecting..." : "Connect wallet"}
    </button>
  );
}
