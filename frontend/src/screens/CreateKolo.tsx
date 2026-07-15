import { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { koloPadiAbi } from "../abi";
import { KOLOPADI_ADDRESS } from "../config/contract";
import { useTxState } from "../hooks/useTxState";
import { monToWei } from "../lib/format";

const REAL_EPOCH_SECONDS = 24 * 60 * 60;
const DEMO_EPOCH_SECONDS = 60;

export function CreateKolo({ onCreated }: { onCreated: () => void }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("0.1");
  const [durationEpochs, setDurationEpochs] = useState("7");
  const [padi, setPadi] = useState("");
  const [mode, setMode] = useState<"real" | "demo">("demo");

  const { writeContract, isBusy, error } = useTxState(onCreated);

  const epochLength = mode === "real" ? REAL_EPOCH_SECONDS : DEMO_EPOCH_SECONDS;

  const amountValid = Number(amount) > 0;
  const durationValid = Number.isInteger(Number(durationEpochs)) && Number(durationEpochs) >= 2;
  const padiValid = isAddress(padi) && padi.toLowerCase() !== address?.toLowerCase();
  const formValid = amountValid && durationValid && padiValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;
    const depositAmount = monToWei(amount);
    writeContract({
      address: KOLOPADI_ADDRESS,
      abi: koloPadiAbi,
      functionName: "createKolo",
      args: [depositAmount, BigInt(epochLength), BigInt(durationEpochs), padi as `0x${string}`],
      value: depositAmount,
    });
  }

  return (
    <div className="screen">
      <h2>Start your kolo</h2>
      <p className="muted">Commit small small. Your padi go watch you.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Deposit per epoch (MON)</span>
          <input
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label className="form__field">
          <span>Duration (number of epochs)</span>
          <input
            type="number"
            min="2"
            step="1"
            value={durationEpochs}
            onChange={(e) => setDurationEpochs(e.target.value)}
            required
          />
        </label>

        <label className="form__field">
          <span>Your padi's wallet address</span>
          <input
            type="text"
            placeholder="0x..."
            value={padi}
            onChange={(e) => setPadi(e.target.value.trim())}
            required
          />
          {padi.length > 0 && !padiValid && (
            <span className="form__hint form__hint--error">
              Must be a valid address, and no be your own wallet.
            </span>
          )}
        </label>

        <div className="form__field">
          <span>Epoch length</span>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-toggle__option ${mode === "real" ? "mode-toggle__option--active" : ""}`}
              onClick={() => setMode("real")}
            >
              Real mode
              <small>24 hours per epoch</small>
            </button>
            <button
              type="button"
              className={`mode-toggle__option ${mode === "demo" ? "mode-toggle__option--active" : ""}`}
              onClick={() => setMode("demo")}
            >
              Demo mode
              <small>60 seconds per epoch</small>
            </button>
          </div>
          {mode === "demo" && (
            <span className="form__hint">Demo mode dey here so judges fit watch the whole thing live.</span>
          )}
        </div>

        <button type="submit" className="btn btn--primary btn--large" disabled={!formValid || isBusy}>
          {isBusy ? <span className="spinner" /> : "Create kolo"}
        </button>
        {error && <p className="form__error">{error.message}</p>}
      </form>
    </div>
  );
}
