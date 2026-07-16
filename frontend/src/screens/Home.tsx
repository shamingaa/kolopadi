import { useState } from "react";
import { useAccount } from "wagmi";
import { koloPadiAbi } from "../abi";
import { BreakKoloDialog } from "../components/BreakKoloDialog";
import { KoloPot, type KoloVisualStatus } from "../components/KoloPot";
import { KOLOPADI_ADDRESS } from "../config/contract";
import { useKolo } from "../hooks/useKolo";
import { useMyLatestKoloId } from "../hooks/useKoloLists";
import { useTxState } from "../hooks/useTxState";
import { formatCountdown, formatMon } from "../lib/format";
import { KoloStatus } from "../types";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function Home({ onCreateNew }: { onCreateNew: () => void }) {
  const { address } = useAccount();
  const { koloId, isLoading: isLoadingKoloId, refetch: refetchKoloId } = useMyLatestKoloId();
  const { kolo, currentEpoch, secondsUntilNextEpoch, hasDepositedCurrentEpoch, isLoading: isLoadingKolo, refetch } =
    useKolo(koloId);
  const [showBreakDialog, setShowBreakDialog] = useState(false);

  const refetchAll = () => {
    refetch();
    refetchKoloId();
  };

  const {
    writeContract: deposit,
    isBusy: isDepositing,
    error: depositError,
  } = useTxState(refetchAll);

  const {
    writeContract: claim,
    isBusy: isClaiming,
    error: claimError,
  } = useTxState(refetchAll);

  if (!address) return null;

  if (isLoadingKoloId || (koloId !== undefined && isLoadingKolo && !kolo)) {
    return (
      <div className="screen screen--center">
        <p className="muted">Checking for your kolo...</p>
      </div>
    );
  }

  if (koloId === undefined || !kolo) {
    return (
      <div className="screen screen--center">
        <KoloPot fillPercent={0} status="empty" size={160} />
        <h2>You don't have a kolo yet</h2>
        <p className="muted">Start one today - little by little, the pot fills up.</p>
        <button className="btn btn--primary" onClick={onCreateNew}>
          Start your kolo
        </button>
      </div>
    );
  }

  const target = kolo.depositAmount * kolo.durationEpochs;
  const fillPercent = target > 0n ? Number((kolo.totalSaved * 10000n) / target) / 100 : 0;
  const durationElapsed = currentEpoch !== undefined && currentEpoch >= kolo.durationEpochs;

  const visualStatus: KoloVisualStatus =
    kolo.status === KoloStatus.Broken ? "broken" : kolo.status === KoloStatus.Claimed ? "claimed" : "active";

  return (
    <div className="screen">
      <KoloPot fillPercent={fillPercent} status={visualStatus} />

      <div className="home__stats">
        <div className="stat">
          <span className="stat__value">{formatMon(kolo.totalSaved)}</span>
          <span className="stat__label">MON saved</span>
        </div>
        <div className="stat">
          <span className="stat__value">{kolo.currentStreak.toString()}</span>
          <span className="stat__label">epoch streak</span>
        </div>
      </div>

      <p className="muted">
        Padi: {shortAddress(kolo.padi)} · epoch{" "}
        {(currentEpoch !== undefined && currentEpoch < kolo.durationEpochs ? currentEpoch : kolo.durationEpochs).toString()}{" "}
        of {kolo.durationEpochs.toString()}
      </p>

      {kolo.status === KoloStatus.Active && !durationElapsed && (
        <>
          <div className="countdown">
            <span className="countdown__label">Time left to feed am</span>
            <span className="countdown__clock">{formatCountdown(secondsUntilNextEpoch)}</span>
          </div>

          <button
            className="btn btn--primary btn--large"
            disabled={isDepositing || hasDepositedCurrentEpoch === true}
            onClick={() =>
              deposit({
                address: KOLOPADI_ADDRESS,
                abi: koloPadiAbi,
                functionName: "deposit",
                args: [koloId],
                value: kolo.depositAmount,
              })
            }
          >
            {isDepositing ? (
              <span className="spinner" />
            ) : hasDepositedCurrentEpoch ? (
              "Already fed for this epoch"
            ) : (
              "Feed your kolo"
            )}
          </button>
          {depositError && <p className="form__error">{depositError.message}</p>}

          <button className="btn btn--link" onClick={() => setShowBreakDialog(true)}>
            Break kolo
          </button>
        </>
      )}

      {kolo.status === KoloStatus.Active && durationElapsed && (
        <>
          <p className="callout callout--success">You're done! Claim your full kolo now.</p>
          <button
            className="btn btn--primary btn--large"
            disabled={isClaiming}
            onClick={() =>
              claim({
                address: KOLOPADI_ADDRESS,
                abi: koloPadiAbi,
                functionName: "claim",
                args: [koloId],
              })
            }
          >
            {isClaiming ? <span className="spinner" /> : `Claim ${formatMon(kolo.totalSaved)} MON`}
          </button>
          {claimError && <p className="form__error">{claimError.message}</p>}
        </>
      )}

      {kolo.status === KoloStatus.Broken && (
        <p className="callout callout--danger">This kolo don break. You collect your money, padi chop 10%.</p>
      )}

      {kolo.status === KoloStatus.Claimed && (
        <p className="callout callout--success">Kolo complete, full payout landed!</p>
      )}

      {kolo.status !== KoloStatus.Active && (
        <button className="btn btn--primary" onClick={onCreateNew}>
          Start a new kolo
        </button>
      )}

      {showBreakDialog && (
        <BreakKoloDialog
          koloId={koloId}
          totalSaved={kolo.totalSaved}
          onClose={() => setShowBreakDialog(false)}
          onBroken={() => {
            refetchAll();
            setShowBreakDialog(false);
          }}
        />
      )}
    </div>
  );
}
