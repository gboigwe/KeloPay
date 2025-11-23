// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KeloPay
 * @dev Main contract for handling deposits and escrow functionality
 * @notice Allows users to deposit crypto and hold funds in escrow for conversion
 */
contract KeloPay is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed depositId,
        uint256 timestamp
    );

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed depositor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // Structs
    struct DepositInfo {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool withdrawn;
    }

    struct EscrowInfo {
        address depositor;
        address token;
        uint256 amount;
        uint256 createdAt;
        uint256 releaseTime;
        bool released;
        bool refunded;
        bytes32 conversionRequestId;
    }

    // State variables
    uint256 public depositCounter;
    uint256 public escrowCounter;
    uint256 public platformFeeBasisPoints; // Fee in basis points (100 = 1%)
    address public treasury;

    mapping(uint256 => DepositInfo) public deposits;
    mapping(uint256 => EscrowInfo) public escrows;
    mapping(address => uint256[]) public userDeposits;
    mapping(address => uint256[]) public userEscrows;
    mapping(address => bool) public supportedTokens;

    // Constants
    uint256 public constant MAX_FEE_BASIS_POINTS = 500; // 5% max fee
    address public constant ETH_ADDRESS = address(0);

    /**
     * @dev Constructor to initialize the contract
     * @param _treasury Address of the treasury to collect fees
     * @param _platformFeeBasisPoints Initial platform fee in basis points
     */
    constructor(address _treasury, uint256 _platformFeeBasisPoints) Ownable(_treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        require(_platformFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");

        treasury = _treasury;
        platformFeeBasisPoints = _platformFeeBasisPoints;

        // Support ETH by default
        supportedTokens[ETH_ADDRESS] = true;
    }

    /**
     * @dev Deposit ETH into the contract
     */
    function depositETH() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");

        uint256 depositId = depositCounter++;

        deposits[depositId] = DepositInfo({
            user: msg.sender,
            token: ETH_ADDRESS,
            amount: msg.value,
            timestamp: block.timestamp,
            withdrawn: false
        });

        userDeposits[msg.sender].push(depositId);

        emit Deposit(msg.sender, ETH_ADDRESS, msg.value, depositId, block.timestamp);
    }

    /**
     * @dev Deposit ERC20 tokens into the contract
     * @param token Address of the ERC20 token
     * @param amount Amount of tokens to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");
        require(supportedTokens[token], "Token not supported");

        uint256 depositId = depositCounter++;

        deposits[depositId] = DepositInfo({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            withdrawn: false
        });

        userDeposits[msg.sender].push(depositId);

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, token, amount, depositId, block.timestamp);
    }

    /**
     * @dev Create an escrow for a conversion request
     * @param token Address of the token (ETH_ADDRESS for ETH)
     * @param amount Amount to hold in escrow
     * @param releaseTime Timestamp when escrow can be released
     * @param conversionRequestId Unique ID for the conversion request
     */
    function createEscrow(
        address token,
        uint256 amount,
        uint256 releaseTime,
        bytes32 conversionRequestId
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(releaseTime > block.timestamp, "Release time must be in future");
        require(supportedTokens[token], "Token not supported");

        uint256 escrowId = escrowCounter++;

        if (token == ETH_ADDRESS) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        escrows[escrowId] = EscrowInfo({
            depositor: msg.sender,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            releaseTime: releaseTime,
            released: false,
            refunded: false,
            conversionRequestId: conversionRequestId
        });

        userEscrows[msg.sender].push(escrowId);

        emit EscrowCreated(escrowId, msg.sender, token, amount, block.timestamp);

        return escrowId;
    }

    /**
     * @dev Release escrow funds to recipient (called by owner/operator)
     * @param escrowId ID of the escrow to release
     * @param recipient Address to receive the funds
     */
    function releaseEscrow(uint256 escrowId, address recipient) external onlyOwner nonReentrant {
        EscrowInfo storage escrow = escrows[escrowId];

        require(!escrow.released, "Escrow already released");
        require(!escrow.refunded, "Escrow already refunded");
        require(block.timestamp >= escrow.releaseTime, "Escrow not ready for release");
        require(recipient != address(0), "Invalid recipient");

        escrow.released = true;

        uint256 fee = (escrow.amount * platformFeeBasisPoints) / 10000;
        uint256 amountAfterFee = escrow.amount - fee;

        if (escrow.token == ETH_ADDRESS) {
            payable(treasury).transfer(fee);
            payable(recipient).transfer(amountAfterFee);
        } else {
            IERC20(escrow.token).safeTransfer(treasury, fee);
            IERC20(escrow.token).safeTransfer(recipient, amountAfterFee);
        }

        emit EscrowReleased(escrowId, recipient, amountAfterFee, block.timestamp);
    }

    /**
     * @dev Refund escrow to depositor (called by owner in case of failure)
     * @param escrowId ID of the escrow to refund
     */
    function refundEscrow(uint256 escrowId) external onlyOwner nonReentrant {
        EscrowInfo storage escrow = escrows[escrowId];

        require(!escrow.released, "Escrow already released");
        require(!escrow.refunded, "Escrow already refunded");

        escrow.refunded = true;

        if (escrow.token == ETH_ADDRESS) {
            payable(escrow.depositor).transfer(escrow.amount);
        } else {
            IERC20(escrow.token).safeTransfer(escrow.depositor, escrow.amount);
        }

        emit EscrowRefunded(escrowId, escrow.depositor, escrow.amount, block.timestamp);
    }

    /**
     * @dev Add support for a new ERC20 token
     * @param token Address of the token to support
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = true;
    }

    /**
     * @dev Remove support for an ERC20 token
     * @param token Address of the token to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    /**
     * @dev Update platform fee
     * @param newFeeBasisPoints New fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBasisPoints) external onlyOwner {
        require(newFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
        uint256 oldFee = platformFeeBasisPoints;
        platformFeeBasisPoints = newFeeBasisPoints;
        emit PlatformFeeUpdated(oldFee, newFeeBasisPoints);
    }

    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get user's deposit IDs
     * @param user Address of the user
     */
    function getUserDeposits(address user) external view returns (uint256[] memory) {
        return userDeposits[user];
    }

    /**
     * @dev Get user's escrow IDs
     * @param user Address of the user
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }
}
