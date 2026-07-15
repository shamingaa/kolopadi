// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KoloPadi} from "../src/KoloPadi.sol";

contract KoloPadiTest is Test {
    KoloPadi kolo;

    address owner = makeAddr("owner");
    address padi = makeAddr("padi");
    address stranger = makeAddr("stranger");

    uint256 constant DEPOSIT = 1 ether;
    uint256 constant EPOCH_LENGTH = 60; // "demo mode" epoch length
    uint256 constant DURATION = 5;

    function setUp() public {
        kolo = new KoloPadi();
        vm.deal(owner, 100 ether);
        vm.deal(padi, 100 ether);
        vm.deal(stranger, 100 ether);
    }

    function _createKolo() internal returns (uint256 koloId) {
        vm.prank(owner);
        koloId = kolo.createKolo{value: DEPOSIT}(DEPOSIT, EPOCH_LENGTH, DURATION, padi);
    }

    // ------------------------------------------------------------------
    // createKolo
    // ------------------------------------------------------------------

    function test_CreateKolo_StoresStateAndTakesFirstDeposit() public {
        uint256 koloId = _createKolo();
        (
            address o,
            address p,
            uint256 depositAmount,
            uint256 epochLength,
            uint256 durationEpochs,
            uint256 startTime,
            uint256 totalSaved,
            uint256 depositedCount,
            uint256 currentStreak,
            KoloPadi.Status status
        ) = kolo.getKolo(koloId);

        assertEq(o, owner);
        assertEq(p, padi);
        assertEq(depositAmount, DEPOSIT);
        assertEq(epochLength, EPOCH_LENGTH);
        assertEq(durationEpochs, DURATION);
        assertEq(startTime, block.timestamp);
        assertEq(totalSaved, DEPOSIT);
        assertEq(depositedCount, 1);
        assertEq(currentStreak, 1);
        assertEq(uint256(status), uint256(KoloPadi.Status.Active));
        assertEq(address(kolo).balance, DEPOSIT);
    }

    function test_CreateKolo_RevertsIfPadiIsOwner() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.PadiCannotBeOwner.selector);
        kolo.createKolo{value: DEPOSIT}(DEPOSIT, EPOCH_LENGTH, DURATION, owner);
    }

    function test_CreateKolo_RevertsIfPadiIsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.PadiCannotBeZeroAddress.selector);
        kolo.createKolo{value: DEPOSIT}(DEPOSIT, EPOCH_LENGTH, DURATION, address(0));
    }

    function test_CreateKolo_RevertsIfEpochTooShort() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.EpochLengthTooShort.selector);
        kolo.createKolo{value: DEPOSIT}(DEPOSIT, 59, DURATION, padi);
    }

    function test_CreateKolo_RevertsIfDurationTooShort() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.DurationTooShort.selector);
        kolo.createKolo{value: DEPOSIT}(DEPOSIT, EPOCH_LENGTH, 1, padi);
    }

    function test_CreateKolo_RevertsIfDepositAmountZero() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.DepositAmountMustBePositive.selector);
        kolo.createKolo{value: 0}(0, EPOCH_LENGTH, DURATION, padi);
    }

    function test_CreateKolo_RevertsIfMsgValueMismatch() public {
        vm.prank(owner);
        vm.expectRevert(KoloPadi.IncorrectDepositValue.selector);
        kolo.createKolo{value: DEPOSIT - 1}(DEPOSIT, EPOCH_LENGTH, DURATION, padi);
    }

    // ------------------------------------------------------------------
    // Happy path: create -> deposit every epoch -> claim
    // ------------------------------------------------------------------

    function test_HappyPath_FullLifecycleToClaim() public {
        uint256 koloId = _createKolo();

        for (uint256 i = 1; i < DURATION; i++) {
            vm.warp(block.timestamp + EPOCH_LENGTH);
            vm.prank(owner);
            kolo.deposit{value: DEPOSIT}(koloId);
        }

        vm.warp(block.timestamp + EPOCH_LENGTH);

        uint256 balBefore = owner.balance;
        vm.prank(owner);
        kolo.claim(koloId);

        assertEq(owner.balance, balBefore + DEPOSIT * DURATION);
        (,,,,,, uint256 totalSaved,,, KoloPadi.Status status) = kolo.getKolo(koloId);
        assertEq(totalSaved, 0);
        assertEq(uint256(status), uint256(KoloPadi.Status.Claimed));
    }

    function test_Claim_RevertsBeforeDurationOver() public {
        uint256 koloId = _createKolo();
        vm.prank(owner);
        vm.expectRevert(KoloPadi.KoloStillOngoing.selector);
        kolo.claim(koloId);
    }

    function test_Claim_RevertsForNonOwner() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH * DURATION);
        vm.prank(stranger);
        vm.expectRevert(KoloPadi.NotKoloOwner.selector);
        kolo.claim(koloId);
    }

    // ------------------------------------------------------------------
    // deposit() rules
    // ------------------------------------------------------------------

    function test_Deposit_RevertsOnDoubleDepositSameEpoch() public {
        uint256 koloId = _createKolo();
        vm.prank(owner);
        vm.expectRevert(KoloPadi.EpochAlreadyDeposited.selector);
        kolo.deposit{value: DEPOSIT}(koloId);
    }

    function test_Deposit_CannotRetroDepositMissedEpoch() public {
        uint256 koloId = _createKolo();
        // Skip epoch 1 entirely by jumping straight into epoch 2's window.
        vm.warp(block.timestamp + EPOCH_LENGTH * 2);
        vm.prank(owner);
        kolo.deposit{value: DEPOSIT}(koloId);

        // The deposit above can only have landed on epoch 2 - epoch 1 stays missed forever.
        assertTrue(kolo.isEpochMissed(koloId, 1));
        assertFalse(kolo.isEpochMissed(koloId, 2));
    }

    function test_Deposit_RevertsForNonOwner() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(stranger);
        vm.expectRevert(KoloPadi.NotKoloOwner.selector);
        kolo.deposit{value: DEPOSIT}(koloId);
    }

    function test_Deposit_RevertsWithWrongValue() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(owner);
        vm.expectRevert(KoloPadi.IncorrectDepositValue.selector);
        kolo.deposit{value: DEPOSIT - 1}(koloId);
    }

    function test_Deposit_RevertsAfterDurationEnded() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH * DURATION);
        vm.prank(owner);
        vm.expectRevert(KoloPadi.KoloDurationEnded.selector);
        kolo.deposit{value: DEPOSIT}(koloId);
    }

    function test_Deposit_RevertsAfterBroken() public {
        uint256 koloId = _createKolo();
        vm.prank(owner);
        kolo.breakKolo(koloId);

        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(owner);
        vm.expectRevert(KoloPadi.KoloNotActive.selector);
        kolo.deposit{value: DEPOSIT}(koloId);
    }

    // ------------------------------------------------------------------
    // Streak tracking
    // ------------------------------------------------------------------

    function test_Streak_BreaksOnMissThenRestarts() public {
        uint256 koloId = _createKolo(); // epoch 0 -> streak 1

        vm.warp(block.timestamp + EPOCH_LENGTH); // epoch 1
        vm.prank(owner);
        kolo.deposit{value: DEPOSIT}(koloId);
        (,,,,,,,, uint256 streakAfterTwoInARow,) = kolo.getKolo(koloId);
        assertEq(streakAfterTwoInARow, 2);

        vm.warp(block.timestamp + EPOCH_LENGTH * 2); // skip epoch 2, land in epoch 3
        vm.prank(owner);
        kolo.deposit{value: DEPOSIT}(koloId);
        (,,,,,,,, uint256 streakAfterMiss,) = kolo.getKolo(koloId);
        assertEq(streakAfterMiss, 1);
    }

    // ------------------------------------------------------------------
    // slashMiss()
    // ------------------------------------------------------------------

    function test_SlashMiss_PaysPadiTwoPercentOfPot() public {
        uint256 koloId = _createKolo(); // pot = 1 ether
        vm.warp(block.timestamp + EPOCH_LENGTH * 2); // epoch 1 missed, now in epoch 2

        uint256 padiBalBefore = padi.balance;
        vm.prank(padi);
        kolo.slashMiss(koloId, 1);

        uint256 expectedBounty = (DEPOSIT * 2) / 100;
        assertEq(padi.balance, padiBalBefore + expectedBounty);

        (,,,,,, uint256 totalSaved,,,) = kolo.getKolo(koloId);
        assertEq(totalSaved, DEPOSIT - expectedBounty);
    }

    function test_SlashMiss_RevertsIfEpochWasDeposited() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(owner);
        kolo.deposit{value: DEPOSIT}(koloId); // epoch 1 deposited

        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(padi);
        vm.expectRevert(KoloPadi.EpochAlreadyDeposited.selector);
        kolo.slashMiss(koloId, 1);
    }

    function test_SlashMiss_RevertsOnDoubleSlash() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH * 2);

        vm.prank(padi);
        kolo.slashMiss(koloId, 1);

        vm.prank(padi);
        vm.expectRevert(KoloPadi.EpochAlreadySlashed.selector);
        kolo.slashMiss(koloId, 1);
    }

    function test_SlashMiss_RevertsIfEpochNotYetMissed() public {
        uint256 koloId = _createKolo();
        // Still inside epoch 0's own window - nothing has had a chance to be missed yet.
        vm.prank(padi);
        vm.expectRevert(KoloPadi.EpochNotYetMissed.selector);
        kolo.slashMiss(koloId, 0);
    }

    function test_SlashMiss_RevertsForNonPadi() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH * 2);
        vm.prank(stranger);
        vm.expectRevert(KoloPadi.NotKoloPadi.selector);
        kolo.slashMiss(koloId, 1);
    }

    function test_IsEpochSlashable_TrueOnlyWhenGenuinelyMissedAndUnslashed() public {
        uint256 koloId = _createKolo();
        assertFalse(kolo.isEpochSlashable(koloId, 0)); // deposited at creation

        vm.warp(block.timestamp + EPOCH_LENGTH * 2);
        assertTrue(kolo.isEpochSlashable(koloId, 1));

        vm.prank(padi);
        kolo.slashMiss(koloId, 1);
        assertFalse(kolo.isEpochSlashable(koloId, 1));
    }

    // ------------------------------------------------------------------
    // breakKolo()
    // ------------------------------------------------------------------

    function test_BreakKolo_SplitsNinetyTen() public {
        uint256 koloId = _createKolo();
        vm.warp(block.timestamp + EPOCH_LENGTH);
        vm.prank(owner);
        kolo.deposit{value: DEPOSIT}(koloId); // pot = 2 ether

        uint256 ownerBalBefore = owner.balance;
        uint256 padiBalBefore = padi.balance;

        vm.prank(owner);
        kolo.breakKolo(koloId);

        uint256 pot = DEPOSIT * 2;
        uint256 padiCut = (pot * 10) / 100;
        uint256 ownerCut = pot - padiCut;

        assertEq(owner.balance, ownerBalBefore + ownerCut);
        assertEq(padi.balance, padiBalBefore + padiCut);

        (,,,,,, uint256 totalSaved,,, KoloPadi.Status status) = kolo.getKolo(koloId);
        assertEq(totalSaved, 0);
        assertEq(uint256(status), uint256(KoloPadi.Status.Broken));
    }

    function test_BreakKolo_RevertsForNonOwner() public {
        uint256 koloId = _createKolo();
        vm.prank(stranger);
        vm.expectRevert(KoloPadi.NotKoloOwner.selector);
        kolo.breakKolo(koloId);
    }

    function test_BreakKolo_RevertsIfAlreadyBroken() public {
        uint256 koloId = _createKolo();
        vm.prank(owner);
        kolo.breakKolo(koloId);

        vm.prank(owner);
        vm.expectRevert(KoloPadi.KoloNotActive.selector);
        kolo.breakKolo(koloId);
    }

    // ------------------------------------------------------------------
    // Misc views / access control
    // ------------------------------------------------------------------

    function test_RevertsOnInvalidKoloId() public {
        vm.expectRevert(KoloPadi.InvalidKoloId.selector);
        kolo.getKolo(999);
    }

    function test_ViewFunctions_KolosByOwnerAndPadi() public {
        uint256 koloId = _createKolo();
        uint256[] memory ownerList = kolo.getKolosByOwner(owner);
        uint256[] memory padiList = kolo.getKolosByPadi(padi);
        assertEq(ownerList.length, 1);
        assertEq(ownerList[0], koloId);
        assertEq(padiList.length, 1);
        assertEq(padiList[0], koloId);
    }
}
