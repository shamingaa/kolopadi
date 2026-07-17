import { useState } from "react";
import { useAccount } from "wagmi";
import "./App.css";
import { ConnectWallet } from "./components/ConnectWallet";
import { KoloPot } from "./components/KoloPot";
import { NetworkGuard } from "./components/NetworkGuard";
import { CreateKolo } from "./screens/CreateKolo";
import { Home } from "./screens/Home";
import { PadiView } from "./screens/PadiView";
import { useResyncOnWalletChange } from "./hooks/useResyncOnWalletChange";

type Tab = "home" | "padi";

function App() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("home");
  const [showCreate, setShowCreate] = useState(false);
  useResyncOnWalletChange();

  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">
          <KoloPot fillPercent={62} status="active" size={34} />
          <span className="app-header__wordmark">KoloPadi</span>
        </div>
        <ConnectWallet />
      </header>

      {!isConnected ? (
        <main className="landing">
          <KoloPot fillPercent={70} status="active" size={180} />
          <h1>Save small small. Your padi dey watch.</h1>
          <p className="muted">
            An onchain kolo you can't sneak into. Miss a day and your padi fit catch you and collect a small
            reward. Break am early and you go still collect 90%. Finish strong and everything na yours.
          </p>
          <ConnectWallet />
        </main>
      ) : (
        <NetworkGuard>
          <nav className="tabs">
            <button className={`tabs__tab ${tab === "home" ? "tabs__tab--active" : ""}`} onClick={() => setTab("home")}>
              My Kolo
            </button>
            <button className={`tabs__tab ${tab === "padi" ? "tabs__tab--active" : ""}`} onClick={() => setTab("padi")}>
              Padi View
            </button>
          </nav>

          <main className="app-main">
            {tab === "home" &&
              (showCreate ? (
                <CreateKolo onCreated={() => setShowCreate(false)} />
              ) : (
                <Home onCreateNew={() => setShowCreate(true)} />
              ))}
            {tab === "padi" && <PadiView />}
          </main>
        </NetworkGuard>
      )}
    </>
  );
}

export default App;
