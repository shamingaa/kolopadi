// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KoloPadi
/// @notice An onchain "kolo" (Nigerian piggy bank) that you commit to feeding every epoch,
///         with a "padi" (friend) who can slash you a small bounty if you miss a day.
///
/// Plain-English mental model:
///   - You lock in a plan: "I will deposit X every `epochLength` seconds, for `durationEpochs` epochs."
///   - Every deposit IS your check-in. There is no separate "I showed up" button — the chain
///     only believes you if MON actually moved.
///   - If you miss an epoch, your padi (a friend's wallet you named up front) can call
///     `slashMiss` to take 2% of your current pot as a reward for catching you slacking.
///   - If life happens and you need the money early, `breakKolo` gives you 90% back and
///     sends your padi 10% as a "sorry for wasting your time" fee. You are never trapped.
///   - If you make it all the way to the end, `claim` gives you back 100% of what you saved.
contract KoloPadi {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    /// @notice Lifecycle of a single kolo.
    enum Status {
        Active, // still being fed, not finished yet
        Broken, // owner broke it early
        Claimed // owner finished the full duration and withdrew everything

    }

    /// @notice One savings pot. Deliberately holds no mappings inside it, because Solidity
    ///         will not let a function return a struct that contains a mapping. Per-epoch
    ///         detail (deposited? slashed?) lives in separate top-level mappings below.
    struct Kolo {
        address owner; // the saver
        address padi; // the friend who can slash a miss
        uint256 depositAmount; // MON required every epoch, in wei
        uint256 epochLength; // seconds per epoch (>= 60)
        uint256 durationEpochs; // total number of epochs to complete the kolo
        uint256 startTime; // block.timestamp when the kolo was created
        uint256 totalSaved; // MON currently held in this kolo (the real, live pot)
        uint256 depositedCount; // how many epochs have ever been successfully deposited
        uint256 currentStreak; // consecutive epochs deposited, ending at the most recent deposit
        Status status;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @dev Auto-incrementing id. koloId `n` is valid iff n < nextKoloId.
    uint256 public nextKoloId;

    mapping(uint256 koloId => Kolo) public kolos;

    /// @dev Per-epoch bookkeeping, kept outside the struct on purpose (see struct comment).
    mapping(uint256 koloId => mapping(uint256 epochIndex => bool)) public depositedEpochs;
    mapping(uint256 koloId => mapping(uint256 epochIndex => bool)) public slashedEpochs;

    /// @dev Lets the frontend list "all kolos I own" / "all kolos I'm padi for" without
    ///      needing an indexer.
    mapping(address owner => uint256[]) private ownerKolos;
    mapping(address padi => uint256[]) private padiKolos;

    /// @dev Minimal hand-rolled reentrancy lock. A full OpenZeppelin import felt like
    ///      overkill for five lines of logic, so this is written out directly.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private reentrancyStatus = NOT_ENTERED;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event KoloCreated(
        uint256 indexed koloId,
        address indexed owner,
        address indexed padi,
        uint256 depositAmount,
        uint256 epochLength,
        uint256 durationEpochs,
        uint256 startTime
    );
    event Deposited(uint256 indexed koloId, uint256 indexed epochIndex, uint256 amount, uint256 totalSaved);
    event Slashed(uint256 indexed koloId, uint256 indexed epochIndex, address indexed padi, uint256 amount);
    event Broken(uint256 indexed koloId, uint256 ownerPayout, uint256 padiPayout);
    event Claimed(uint256 indexed koloId, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error InvalidKoloId();
    error NotKoloOwner();
    error NotKoloPadi();
    error PadiCannotBeOwner();
    error PadiCannotBeZeroAddress();
    error EpochLengthTooShort();
    error DurationTooShort();
    error DepositAmountMustBePositive();
    error IncorrectDepositValue();
    error KoloNotActive();
    error EpochAlreadyDeposited();
    error KoloDurationEnded();
    error InvalidEpochIndex();
    error EpochNotYetMissed();
    error EpochAlreadySlashed();
    error KoloStillOngoing();
    error EthTransferFailed();
    error Reentrant();

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier nonReentrant() {
        if (reentrancyStatus == ENTERED) revert Reentrant();
        reentrancyStatus = ENTERED;
        _;
        reentrancyStatus = NOT_ENTERED;
    }

    modifier koloExists(uint256 koloId) {
        if (koloId >= nextKoloId) revert InvalidKoloId();
        _;
    }

    // ---------------------------------------------------------------------
    // Core actions
    // ---------------------------------------------------------------------

    /// @notice Start a new kolo. The first deposit happens right here, in the same
    ///         transaction, so a kolo is never created without money already in it.
    /// @param depositAmount How much MON (in wei) you commit to depositing every epoch.
    /// @param epochLength How many seconds one epoch lasts. Minimum 60s (so a "demo mode"
    ///        kolo can run a full lifecycle in minutes for a live demo).
    /// @param durationEpochs How many epochs the kolo runs for. Minimum 2.
    /// @param padi The friend's wallet that gets to slash you if you slack, and gets a cut
    ///        if you break the kolo early.
    function createKolo(uint256 depositAmount, uint256 epochLength, uint256 durationEpochs, address padi)
        external
        payable
    {
        if (padi == msg.sender) revert PadiCannotBeOwner();
        if (padi == address(0)) revert PadiCannotBeZeroAddress();
        if (epochLength < 60) revert EpochLengthTooShort();
        if (durationEpochs < 2) revert DurationTooShort();
        if (depositAmount == 0) revert DepositAmountMustBePositive();
        if (msg.value != depositAmount) revert IncorrectDepositValue();

        uint256 koloId = nextKoloId++;

        kolos[koloId] = Kolo({
            owner: msg.sender,
            padi: padi,
            depositAmount: depositAmount,
            epochLength: epochLength,
            durationEpochs: durationEpochs,
            startTime: block.timestamp,
            totalSaved: msg.value,
            depositedCount: 1,
            currentStreak: 1,
            status: Status.Active
        });

        // Creating the kolo counts as your epoch-0 deposit / check-in.
        depositedEpochs[koloId][0] = true;

        ownerKolos[msg.sender].push(koloId);
        padiKolos[padi].push(koloId);

        emit KoloCreated(koloId, msg.sender, padi, depositAmount, epochLength, durationEpochs, block.timestamp);
        emit Deposited(koloId, 0, msg.value, msg.value);
    }

    /// @notice Feed your kolo for the current epoch. This IS your check-in — there's no
    ///         other way to prove you showed up.
    function deposit(uint256 koloId) external payable koloExists(koloId) {
        Kolo storage kolo = kolos[koloId];

        if (msg.sender != kolo.owner) revert NotKoloOwner();
        if (kolo.status != Status.Active) revert KoloNotActive();

        uint256 epoch = _currentEpoch(kolo);
        if (epoch >= kolo.durationEpochs) revert KoloDurationEnded();
        // Because `epoch` only ever moves forward with block.timestamp, there is no way to
        // target a past epoch here — this is what makes "retro-depositing" for a missed day
        // impossible. You can only ever deposit for *right now*.
        if (depositedEpochs[koloId][epoch]) revert EpochAlreadyDeposited();
        if (msg.value != kolo.depositAmount) revert IncorrectDepositValue();

        depositedEpochs[koloId][epoch] = true;
        kolo.totalSaved += msg.value;
        kolo.depositedCount += 1;

        // Streak = consecutive epochs deposited, ending here. If the epoch right before this
        // one was deposited, extend the streak; otherwise a miss happened, so restart at 1.
        if (epoch > 0 && depositedEpochs[koloId][epoch - 1]) {
            kolo.currentStreak += 1;
        } else {
            kolo.currentStreak = 1;
        }

        emit Deposited(koloId, epoch, msg.value, kolo.totalSaved);
    }

    /// @notice Called by the padi to punish a genuinely missed epoch. Pays the padi 2% of
    ///         the kolo's current pot. One slash per missed epoch, ever.
    function slashMiss(uint256 koloId, uint256 epochIndex) external nonReentrant koloExists(koloId) {
        Kolo storage kolo = kolos[koloId];

        if (msg.sender != kolo.padi) revert NotKoloPadi();
        if (kolo.status != Status.Active) revert KoloNotActive();
        if (epochIndex >= kolo.durationEpochs) revert InvalidEpochIndex();

        uint256 epoch = _currentEpoch(kolo);
        // The epoch's deposit window must have fully closed before it can count as "missed".
        if (epochIndex >= epoch) revert EpochNotYetMissed();
        if (depositedEpochs[koloId][epochIndex]) revert EpochAlreadyDeposited();
        if (slashedEpochs[koloId][epochIndex]) revert EpochAlreadySlashed();

        // Effects before interactions: lock in the slash and shrink the pot first.
        slashedEpochs[koloId][epochIndex] = true;
        uint256 bounty = (kolo.totalSaved * 2) / 100;
        kolo.totalSaved -= bounty;

        emit Slashed(koloId, epochIndex, msg.sender, bounty);

        _sendMon(kolo.padi, bounty);
    }

    /// @notice Break the kolo early. You get 90% back, your padi gets 10%. Funds are never
    ///         permanently trapped — this is the escape hatch.
    function breakKolo(uint256 koloId) external nonReentrant koloExists(koloId) {
        Kolo storage kolo = kolos[koloId];

        if (msg.sender != kolo.owner) revert NotKoloOwner();
        if (kolo.status != Status.Active) revert KoloNotActive();

        uint256 pot = kolo.totalSaved;
        uint256 padiCut = (pot * 10) / 100;
        uint256 ownerCut = pot - padiCut;

        kolo.totalSaved = 0;
        kolo.status = Status.Broken;

        emit Broken(koloId, ownerCut, padiCut);

        _sendMon(kolo.padi, padiCut);
        _sendMon(kolo.owner, ownerCut);
    }

    /// @notice Withdraw the full pot after completing every epoch of the kolo's duration.
    function claim(uint256 koloId) external nonReentrant koloExists(koloId) {
        Kolo storage kolo = kolos[koloId];

        if (msg.sender != kolo.owner) revert NotKoloOwner();
        if (kolo.status != Status.Active) revert KoloNotActive();
        if (block.timestamp < kolo.startTime + kolo.epochLength * kolo.durationEpochs) {
            revert KoloStillOngoing();
        }

        uint256 amount = kolo.totalSaved;
        kolo.totalSaved = 0;
        kolo.status = Status.Claimed;

        emit Claimed(koloId, amount);

        _sendMon(kolo.owner, amount);
    }

    // ---------------------------------------------------------------------
    // View functions (read-only helpers for the frontend)
    // ---------------------------------------------------------------------

    /// @notice Full snapshot of a kolo's state in one call.
    function getKolo(uint256 koloId)
        external
        view
        koloExists(koloId)
        returns (
            address owner,
            address padi,
            uint256 depositAmount,
            uint256 epochLength,
            uint256 durationEpochs,
            uint256 startTime,
            uint256 totalSaved,
            uint256 depositedCount,
            uint256 currentStreak,
            Status status
        )
    {
        Kolo storage kolo = kolos[koloId];
        return (
            kolo.owner,
            kolo.padi,
            kolo.depositAmount,
            kolo.epochLength,
            kolo.durationEpochs,
            kolo.startTime,
            kolo.totalSaved,
            kolo.depositedCount,
            kolo.currentStreak,
            kolo.status
        );
    }

    /// @notice Which epoch "right now" falls into for this kolo. Not capped at
    ///         `durationEpochs`, so it keeps counting even after the kolo's duration is over
    ///         (useful for detecting misses that happened right at the end, before claim()).
    function currentEpochIndex(uint256 koloId) public view koloExists(koloId) returns (uint256) {
        return _currentEpoch(kolos[koloId]);
    }

    /// @notice Seconds left in the current epoch's deposit window. 0 once the kolo's full
    ///         duration has elapsed.
    function secondsUntilNextEpoch(uint256 koloId) external view koloExists(koloId) returns (uint256) {
        Kolo storage kolo = kolos[koloId];
        uint256 epoch = _currentEpoch(kolo);
        if (epoch >= kolo.durationEpochs) return 0;

        uint256 epochEnd = kolo.startTime + (epoch + 1) * kolo.epochLength;
        if (block.timestamp >= epochEnd) return 0;
        return epochEnd - block.timestamp;
    }

    /// @notice True if `epochIndex`'s window has closed and no deposit landed in it.
    function isEpochMissed(uint256 koloId, uint256 epochIndex) public view koloExists(koloId) returns (bool) {
        Kolo storage kolo = kolos[koloId];
        if (epochIndex >= _currentEpoch(kolo)) return false;
        return !depositedEpochs[koloId][epochIndex];
    }

    /// @notice True if the padi could successfully call `slashMiss` on this epoch right now.
    function isEpochSlashable(uint256 koloId, uint256 epochIndex) external view koloExists(koloId) returns (bool) {
        Kolo storage kolo = kolos[koloId];
        if (kolo.status != Status.Active) return false;
        if (epochIndex >= kolo.durationEpochs) return false;
        if (slashedEpochs[koloId][epochIndex]) return false;
        return isEpochMissed(koloId, epochIndex);
    }

    /// @notice All kolo ids owned by `owner`.
    function getKolosByOwner(address owner) external view returns (uint256[] memory) {
        return ownerKolos[owner];
    }

    /// @notice All kolo ids where `padi` is the named friend.
    function getKolosByPadi(address padi) external view returns (uint256[] memory) {
        return padiKolos[padi];
    }

    // ---------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------

    function _currentEpoch(Kolo storage kolo) internal view returns (uint256) {
        return (block.timestamp - kolo.startTime) / kolo.epochLength;
    }

    function _sendMon(address to, uint256 amount) internal {
        (bool success,) = payable(to).call{value: amount}("");
        if (!success) revert EthTransferFailed();
    }
}
