// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KeloPayWithdrawal
 * @dev Handles withdrawal requests and fiat-to-crypto conversion completion
 * @notice Manages the process of converting fiat to crypto and withdrawing to user wallets
 */
contract KeloPayWithdrawal is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // Events
    event WithdrawalRequested(
        uint256 indexed withdrawalId,
        address indexed user,
        address indexed token,
        uint256 amount,
        string fiatCurrency,
        uint256 fiatAmount,
        uint256 timestamp
    );

    event WithdrawalApproved(
        uint256 indexed withdrawalId,
        address indexed approver,
        uint256 timestamp
    );

    event WithdrawalCompleted(
        uint256 indexed withdrawalId,
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 txHash,
        uint256 timestamp
    );

    event WithdrawalRejected(
        uint256 indexed withdrawalId,
        address indexed rejector,
        string reason,
        uint256 timestamp
    );

    event WithdrawalCancelled(
        uint256 indexed withdrawalId,
        address indexed user,
        uint256 timestamp
    );

    // Structs
    enum WithdrawalStatus {
        PENDING,
        APPROVED,
        COMPLETED,
        REJECTED,
        CANCELLED
    }

    struct WithdrawalRequest {
        address user;
        address token;
        uint256 amount;
        string fiatCurrency;
        uint256 fiatAmount;
        WithdrawalStatus status;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 completedAt;
        address approver;
        bytes32 txHash;
        string rejectionReason;
    }

    // State variables
    uint256 public withdrawalCounter;
    mapping(uint256 => WithdrawalRequest) public withdrawals;
    mapping(address => uint256[]) public userWithdrawals;
    mapping(address => bool) public supportedTokens;

    // Minimum withdrawal amounts (in token's smallest unit)
    mapping(address => uint256) public minWithdrawalAmounts;

    // Constants
    address public constant ETH_ADDRESS = address(0);

    /**
     * @dev Constructor to initialize the contract
     * @param admin Address of the admin
     */
    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);

        // Support ETH by default
        supportedTokens[ETH_ADDRESS] = true;
        minWithdrawalAmounts[ETH_ADDRESS] = 0.001 ether;
    }

    /**
     * @dev Request a withdrawal
     * @param token Address of the token (ETH_ADDRESS for ETH)
     * @param amount Amount to withdraw
     * @param fiatCurrency Fiat currency code (e.g., "NGN", "USD")
     * @param fiatAmount Equivalent fiat amount (in smallest unit, e.g., kobo for NGN)
     */
    function requestWithdrawal(
        address token,
        uint256 amount,
        string calldata fiatCurrency,
        uint256 fiatAmount
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(supportedTokens[token], "Token not supported");
        require(amount >= minWithdrawalAmounts[token], "Amount below minimum");
        require(bytes(fiatCurrency).length > 0, "Invalid fiat currency");
        require(fiatAmount > 0, "Fiat amount must be greater than 0");

        uint256 withdrawalId = withdrawalCounter++;

        withdrawals[withdrawalId] = WithdrawalRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            fiatCurrency: fiatCurrency,
            fiatAmount: fiatAmount,
            status: WithdrawalStatus.PENDING,
            requestedAt: block.timestamp,
            approvedAt: 0,
            completedAt: 0,
            approver: address(0),
            txHash: bytes32(0),
            rejectionReason: ""
        });

        userWithdrawals[msg.sender].push(withdrawalId);

        emit WithdrawalRequested(
            withdrawalId,
            msg.sender,
            token,
            amount,
            fiatCurrency,
            fiatAmount,
            block.timestamp
        );

        return withdrawalId;
    }

    /**
     * @dev Approve a withdrawal request
     * @param withdrawalId ID of the withdrawal to approve
     */
    function approveWithdrawal(uint256 withdrawalId) external onlyRole(OPERATOR_ROLE) {
        WithdrawalRequest storage withdrawal = withdrawals[withdrawalId];

        require(withdrawal.status == WithdrawalStatus.PENDING, "Invalid status");

        withdrawal.status = WithdrawalStatus.APPROVED;
        withdrawal.approvedAt = block.timestamp;
        withdrawal.approver = msg.sender;

        emit WithdrawalApproved(withdrawalId, msg.sender, block.timestamp);
    }

    /**
     * @dev Complete a withdrawal by sending tokens to user
     * @param withdrawalId ID of the withdrawal to complete
     * @param txHash Transaction hash of the off-chain fiat transfer
     */
    function completeWithdrawal(
        uint256 withdrawalId,
        bytes32 txHash
    ) external onlyRole(TREASURY_ROLE) nonReentrant {
        WithdrawalRequest storage withdrawal = withdrawals[withdrawalId];

        require(withdrawal.status == WithdrawalStatus.APPROVED, "Withdrawal not approved");
        require(txHash != bytes32(0), "Invalid transaction hash");

        withdrawal.status = WithdrawalStatus.COMPLETED;
        withdrawal.completedAt = block.timestamp;
        withdrawal.txHash = txHash;

        // Transfer tokens to user
        if (withdrawal.token == ETH_ADDRESS) {
            require(address(this).balance >= withdrawal.amount, "Insufficient ETH balance");
            payable(withdrawal.user).transfer(withdrawal.amount);
        } else {
            IERC20 token = IERC20(withdrawal.token);
            require(
                token.balanceOf(address(this)) >= withdrawal.amount,
                "Insufficient token balance"
            );
            token.safeTransfer(withdrawal.user, withdrawal.amount);
        }

        emit WithdrawalCompleted(
            withdrawalId,
            withdrawal.user,
            withdrawal.token,
            withdrawal.amount,
            txHash,
            block.timestamp
        );
    }

    /**
     * @dev Reject a withdrawal request
     * @param withdrawalId ID of the withdrawal to reject
     * @param reason Reason for rejection
     */
    function rejectWithdrawal(
        uint256 withdrawalId,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        WithdrawalRequest storage withdrawal = withdrawals[withdrawalId];

        require(
            withdrawal.status == WithdrawalStatus.PENDING ||
            withdrawal.status == WithdrawalStatus.APPROVED,
            "Invalid status"
        );
        require(bytes(reason).length > 0, "Reason required");

        withdrawal.status = WithdrawalStatus.REJECTED;
        withdrawal.rejectionReason = reason;

        emit WithdrawalRejected(withdrawalId, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Cancel a withdrawal request (only by user who requested it)
     * @param withdrawalId ID of the withdrawal to cancel
     */
    function cancelWithdrawal(uint256 withdrawalId) external nonReentrant {
        WithdrawalRequest storage withdrawal = withdrawals[withdrawalId];

        require(withdrawal.user == msg.sender, "Not authorized");
        require(withdrawal.status == WithdrawalStatus.PENDING, "Cannot cancel");

        withdrawal.status = WithdrawalStatus.CANCELLED;

        emit WithdrawalCancelled(withdrawalId, msg.sender, block.timestamp);
    }

    /**
     * @dev Add support for a new token
     * @param token Address of the token to support
     * @param minAmount Minimum withdrawal amount for this token
     */
    function addSupportedToken(
        address token,
        uint256 minAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = true;
        minWithdrawalAmounts[token] = minAmount;
    }

    /**
     * @dev Remove support for a token
     * @param token Address of the token to remove
     */
    function removeSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = false;
    }

    /**
     * @dev Update minimum withdrawal amount for a token
     * @param token Address of the token
     * @param minAmount New minimum amount
     */
    function updateMinWithdrawalAmount(
        address token,
        uint256 minAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(supportedTokens[token], "Token not supported");
        minWithdrawalAmounts[token] = minAmount;
    }

    /**
     * @dev Deposit ETH into the contract for withdrawals
     */
    function depositETH() external payable onlyRole(TREASURY_ROLE) {
        require(msg.value > 0, "Amount must be greater than 0");
    }

    /**
     * @dev Deposit tokens into the contract for withdrawals
     * @param token Address of the token
     * @param amount Amount to deposit
     */
    function depositToken(
        address token,
        uint256 amount
    ) external onlyRole(TREASURY_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(supportedTokens[token], "Token not supported");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Emergency withdraw ETH (admin only)
     * @param to Address to send ETH to
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawETH(
        address payable to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid address");
        require(amount <= address(this).balance, "Insufficient balance");
        to.transfer(amount);
    }

    /**
     * @dev Emergency withdraw tokens (admin only)
     * @param token Address of the token
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid address");
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Get user's withdrawal IDs
     * @param user Address of the user
     */
    function getUserWithdrawals(address user) external view returns (uint256[] memory) {
        return userWithdrawals[user];
    }

    /**
     * @dev Get pending withdrawals count
     */
    function getPendingWithdrawalsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < withdrawalCounter; i++) {
            if (withdrawals[i].status == WithdrawalStatus.PENDING) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
