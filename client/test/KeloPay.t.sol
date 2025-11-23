// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {KeloPay} from "../contracts/KeloPay.sol";

contract KeloPayTest is Test {
    KeloPay public keloPay;
    address public treasury;
    address public user1;
    address public user2;

    uint256 constant PLATFORM_FEE = 100; // 1%

    function setUp() public {
        treasury = makeAddr("treasury");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        keloPay = new KeloPay(treasury, PLATFORM_FEE);
    }

    function test_Deployment() public view {
        assertEq(keloPay.treasury(), treasury);
        assertEq(keloPay.platformFeeBasisPoints(), PLATFORM_FEE);
        assertEq(keloPay.owner(), treasury);
    }

    function test_DepositETH() public {
        uint256 depositAmount = 1 ether;

        vm.deal(user1, depositAmount);
        vm.prank(user1);

        keloPay.depositETH{value: depositAmount}();

        (address user, address token, uint256 amount, , bool withdrawn) = keloPay.deposits(0);

        assertEq(user, user1);
        assertEq(token, address(0)); // ETH_ADDRESS
        assertEq(amount, depositAmount);
        assertFalse(withdrawn);
    }

    function test_DepositETH_RevertsIfZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        keloPay.depositETH{value: 0}();
    }

    function test_CreateEscrow() public {
        uint256 escrowAmount = 1 ether;
        uint256 releaseTime = block.timestamp + 1 days;
        bytes32 conversionId = keccak256("conversion1");

        vm.deal(user1, escrowAmount);
        vm.prank(user1);

        uint256 escrowId = keloPay.createEscrow{value: escrowAmount}(
            address(0),
            escrowAmount,
            releaseTime,
            conversionId
        );

        (
            address depositor,
            address token,
            uint256 amount,
            ,
            uint256 releaseTimeStored,
            bool released,
            bool refunded,

        ) = keloPay.escrows(escrowId);

        assertEq(depositor, user1);
        assertEq(token, address(0));
        assertEq(amount, escrowAmount);
        assertEq(releaseTimeStored, releaseTime);
        assertFalse(released);
        assertFalse(refunded);
    }

    function test_CreateEscrow_RevertsIfPastReleaseTime() public {
        uint256 escrowAmount = 1 ether;
        uint256 pastTime = block.timestamp - 1;
        bytes32 conversionId = keccak256("conversion1");

        vm.deal(user1, escrowAmount);
        vm.prank(user1);

        vm.expectRevert("Release time must be in future");
        keloPay.createEscrow{value: escrowAmount}(
            address(0),
            escrowAmount,
            pastTime,
            conversionId
        );
    }

    function test_ReleaseEscrow() public {
        uint256 escrowAmount = 1 ether;
        uint256 releaseTime = block.timestamp + 1 days;
        bytes32 conversionId = keccak256("conversion1");

        // Create escrow
        vm.deal(user1, escrowAmount);
        vm.prank(user1);
        uint256 escrowId = keloPay.createEscrow{value: escrowAmount}(
            address(0),
            escrowAmount,
            releaseTime,
            conversionId
        );

        // Fast forward time
        vm.warp(releaseTime);

        // Release escrow
        uint256 balanceBefore = user2.balance;
        vm.prank(treasury);
        keloPay.releaseEscrow(escrowId, user2);

        uint256 fee = (escrowAmount * PLATFORM_FEE) / 10000;
        uint256 expectedAmount = escrowAmount - fee;

        assertEq(user2.balance - balanceBefore, expectedAmount);
        assertEq(treasury.balance, fee);
    }

    function test_RefundEscrow() public {
        uint256 escrowAmount = 1 ether;
        uint256 releaseTime = block.timestamp + 1 days;
        bytes32 conversionId = keccak256("conversion1");

        // Create escrow
        vm.deal(user1, escrowAmount);
        vm.prank(user1);
        uint256 escrowId = keloPay.createEscrow{value: escrowAmount}(
            address(0),
            escrowAmount,
            releaseTime,
            conversionId
        );

        uint256 balanceBefore = user1.balance;

        // Refund escrow
        vm.prank(treasury);
        keloPay.refundEscrow(escrowId);

        assertEq(user1.balance - balanceBefore, escrowAmount);

        (, , , , , bool released, bool refunded, ) = keloPay.escrows(escrowId);
        assertFalse(released);
        assertTrue(refunded);
    }

    function test_UpdatePlatformFee() public {
        uint256 newFee = 200; // 2%

        vm.prank(treasury);
        keloPay.updatePlatformFee(newFee);

        assertEq(keloPay.platformFeeBasisPoints(), newFee);
    }

    function test_UpdatePlatformFee_RevertsIfTooHigh() public {
        uint256 tooHighFee = 600; // 6% > MAX_FEE (5%)

        vm.prank(treasury);
        vm.expectRevert("Fee too high");
        keloPay.updatePlatformFee(tooHighFee);
    }

    function test_Pause() public {
        vm.prank(treasury);
        keloPay.pause();

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert();
        keloPay.depositETH{value: 1 ether}();
    }

    function test_Unpause() public {
        vm.prank(treasury);
        keloPay.pause();

        vm.prank(treasury);
        keloPay.unpause();

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        keloPay.depositETH{value: 1 ether}();
    }
}
