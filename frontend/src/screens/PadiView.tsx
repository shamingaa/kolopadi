import { koloPadiAbi } from "../abi";
import { KoloPot, type KoloVisualStatus } from "../components/KoloPot";
import { KOLOPADI_ADDRESS } from "../config/contract";
import { useKolo } from "../hooks/useKolo";
import { useMyLatestPadiKoloId } from "../hooks/useKoloLists";
import { useSlashableEpochs } from "../hooks/useSlashableEpochs";
import { useTxState } from "../hooks/useTxState";
import { formatMon } from "../lib/format";
import { KoloStatus } from "../types";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function PadiView() {
  const { koloId, isLoading: isLoadingKoloId, refetch: refetchKoloId } = useMyLatestPadiKoloId();
  const { kolo, currentEpoch, isLoading: isLoadingKolo, refetch: refetchKolo } = useKolo(koloId);
  const { slashableEpochs, refetch: refetchSlashable } = useSlashableEpochs(koloId, kolo?.durationEpochs);

  const refetchAll = () => {
    refetchKolo();
    refetchKoloId();
    refetchSlashable();
  };

  const { writeContract: slash, isBusy: isSlashing, error: slashError } = useTxState(refetchAll);

  if (isLoadingKoloId || (koloId !== undefined && isLoadingKolo && !kolo)) {
    return (
      <div className="screen">
        <p className="muted">Checking if you're anyone's padi...</p>
      </div>
    );
  }

  if (koloId === undefined || !kolo) {
    return (
      <div className="screen">
        <KoloPot fillPercent={0} status="empty" size={160} />
        <h2>You're not watching anyone's kolo yet</h2>
        <p className="muted">Once a friend names you as their padi, you'll see their pot here and you can catch them if they slip.</p>
      </div>
    );
  }

  const target = kolo.depositAmount * kolo.durationEpochs;
  const fillPercent = target > 0n ? Number((kolo.totalSaved * 10000n) / target) / 100 : 0;
  const visualStatus: KoloVisualStatus =
    kolo.status === KoloStatus.Broken ? "broken" : kolo.status === KoloStatus.Claimed ? "claimed" : "active";

  const nextSlashableEpoch = slashableEpochs[0];
  const canSlash = kolo.status === KoloStatus.Active && nextSlashableEpoch !== undefined;
  const bounty = (kolo.totalSaved * 2n) / 100n;

  return (
    <div className="screen">
      <h2>{shortAddress(kolo.owner)}'s kolo</h2>
      <KoloPot fillPercent={fillPercent} status={visualStatus} />

      <div className="home__stats">
        <div className="stat">
          <span className="stat__value">{formatMon(kolo.totalSaved)}</span>
          <span className="stat__label">MON saved</span>
        </div>
        <div className="stat">
          <span className="stat__value">{kolo.currentStreak.toString()}</span>
          <span className="stat__label">Epoch streak</span>
        </div>
      </div>

      <p className="muted">
        Epoch{" "}
        {(currentEpoch !== undefined && currentEpoch < kolo.durationEpochs ? currentEpoch : kolo.durationEpochs).toString()}{" "}
        of {kolo.durationEpochs.toString()}
      </p>

      {kolo.status === KoloStatus.Active && (
        <>
          {canSlash ? (
            <p className="callout callout--danger">
              Your padi missed epoch {nextSlashableEpoch}! Catch am and collect {formatMon(bounty)} MON.
            </p>
          ) : (
            <p className="callout callout--success">Your friend's on track, nothing to catch right now.</p>
          )}

          <button
            className="btn btn--primary btn--large"
            disabled={!canSlash || isSlashing}
            onClick={() =>
              koloId !== undefined &&
              nextSlashableEpoch !== undefined &&
              slash({
                address: KOLOPADI_ADDRESS,
                abi: koloPadiAbi,
                functionName: "slashMiss",
                args: [koloId, BigInt(nextSlashableEpoch)],
              })
            }
          >
            {isSlashing ? <span className="spinner" /> : "Catch am!"}
          </button>
          {slashError && <p className="form__error">{slashError.message}</p>}
        </>
      )}

      {kolo.status === KoloStatus.Broken && <p className="callout callout--danger">This kolo don break already.</p>}
      {kolo.status === KoloStatus.Claimed && (
        <p className="callout callout--success">Your padi finish their kolo.</p>
      )}
    </div>
  );
}
