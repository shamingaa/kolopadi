import { useState } from "react";
import { koloPadiAbi } from "../abi";
import { KOLOPADI_ADDRESS } from "../config/contract";
import { useTxState } from "../hooks/useTxState";
import { formatMon } from "../lib/format";

interface BreakKoloDialogProps {
  koloId: bigint;
  totalSaved: bigint;
  onClose: () => void;
  onBroken: () => void;
}

export function BreakKoloDialog({ koloId, totalSaved, onClose, onBroken }: BreakKoloDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const { writeContract, isBusy, isConfirmed, error } = useTxState(onBroken);

  const penalty = (totalSaved * 10n) / 100n;
  const refund = totalSaved - penalty;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <h2>You wan break your kolo?</h2>
        <p>
          You'll lose 10% to your padi as a penalty. It's better to finish if you can, but your money is never
          trapped, you can always break it early.
        </p>
        <div className="dialog__split">
          <div>
            <span className="dialog__label">You collect</span>
            <strong>{formatMon(refund)} MON</strong>
          </div>
          <div>
            <span className="dialog__label">Padi collect</span>
            <strong>{formatMon(penalty)} MON</strong>
          </div>
        </div>

        {!confirming ? (
          <div className="dialog__actions">
            <button className="btn btn--ghost" onClick={onClose}>
              Never mind
            </button>
            <button className="btn btn--danger" onClick={() => setConfirming(true)}>
              Yes, break am
            </button>
          </div>
        ) : (
          <div className="dialog__actions">
            <button className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={isBusy || isConfirmed}>
              Wait, cancel
            </button>
            <button
              className="btn btn--danger"
              disabled={isBusy || isConfirmed}
              onClick={() =>
                writeContract({
                  address: KOLOPADI_ADDRESS,
                  abi: koloPadiAbi,
                  functionName: "breakKolo",
                  args: [koloId],
                })
              }
            >
              {isBusy ? <span className="spinner" /> : "I dey sure, break am"}
            </button>
          </div>
        )}

        {error && <p className="dialog__error">{error.message}</p>}
      </div>
    </div>
  );
}
