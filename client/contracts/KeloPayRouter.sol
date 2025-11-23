// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KeloPayRouter
 * @dev Routes payments between different contracts and manages payment flows
 * @notice Central router for handling payment routing and multi-step transactions
 */
contract KeloPayRouter is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Events
    event PaymentRouted(
        bytes32 indexed paymentId,
        address indexed from,
        address indexed to,
        address token,
        uint256 amount,
        string paymentType,
        uint256 timestamp
    );

    event MerchantPaymentProcessed(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed customer,
        uint256 amount,
        string orderId,
        uint256 timestamp
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event RouteAdded(
        string indexed routeName,
        address indexed targetContract,
        bool active
    );

    event RouteUpdated(
        string indexed routeName,
        address indexed newContract,
        bool active
    );

    // Structs
    enum PaymentStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    struct Payment {
        address from;
        address to;
        address token;
        uint256 amount;
        string paymentType;
        PaymentStatus status;
        uint256 timestamp;
        bytes metadata;
    }

    struct Route {
        address targetContract;
        bool active;
        uint256 totalPayments;
        uint256 totalVolume;
    }

    // State variables
    mapping(bytes32 => Payment) public payments;
    mapping(string => Route) public routes;
    mapping(address => bytes32[]) public userPayments;
    mapping(address => bytes32[]) public merchantPayments;

    // Merchant registry
    mapping(address => bool) public registeredMerchants;
    mapping(address => string) public merchantNames;

    address public constant ETH_ADDRESS = address(0);

    /**
     * @dev Constructor to initialize the contract
     * @param admin Address of the admin
     */
    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    /**
     * @dev Route a payment through the system
     * @param to Recipient address
     * @param token Token address (ETH_ADDRESS for ETH)
     * @param amount Amount to send
     * @param paymentType Type of payment (e.g., "deposit", "withdrawal", "merchant")
     * @param metadata Additional payment data
     */
    function routePayment(
        address to,
        address token,
        uint256 amount,
        string calldata paymentType,
        bytes calldata metadata
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        bytes32 paymentId = keccak256(
            abi.encodePacked(msg.sender, to, token, amount, block.timestamp, metadata)
        );

        require(payments[paymentId].timestamp == 0, "Payment already exists");

        // Handle token transfer
        if (token == ETH_ADDRESS) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        payments[paymentId] = Payment({
            from: msg.sender,
            to: to,
            token: token,
            amount: amount,
            paymentType: paymentType,
            status: PaymentStatus.PROCESSING,
            timestamp: block.timestamp,
            metadata: metadata
        });

        userPayments[msg.sender].push(paymentId);

        emit PaymentRouted(
            paymentId,
            msg.sender,
            to,
            token,
            amount,
            paymentType,
            block.timestamp
        );

        return paymentId;
    }

    /**
     * @dev Process merchant payment
     * @param merchant Merchant address
     * @param token Token address
     * @param amount Amount to pay
     * @param orderId Merchant's order ID
     */
    function processMerchantPayment(
        address merchant,
        address token,
        uint256 amount,
        string calldata orderId
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(merchant != address(0), "Invalid merchant");
        require(registeredMerchants[merchant], "Merchant not registered");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID required");

        bytes32 paymentId = keccak256(
            abi.encodePacked(msg.sender, merchant, token, amount, orderId, block.timestamp)
        );

        // Handle token transfer
        if (token == ETH_ADDRESS) {
            require(msg.value == amount, "ETH amount mismatch");
            payable(merchant).transfer(amount);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, merchant, amount);
        }

        payments[paymentId] = Payment({
            from: msg.sender,
            to: merchant,
            token: token,
            amount: amount,
            paymentType: "merchant",
            status: PaymentStatus.COMPLETED,
            timestamp: block.timestamp,
            metadata: abi.encode(orderId)
        });

        userPayments[msg.sender].push(paymentId);
        merchantPayments[merchant].push(paymentId);

        emit MerchantPaymentProcessed(
            paymentId,
            merchant,
            msg.sender,
            amount,
            orderId,
            block.timestamp
        );

        return paymentId;
    }

    /**
     * @dev Complete a payment (operator only)
     * @param paymentId ID of the payment to complete
     */
    function completePayment(bytes32 paymentId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Payment storage payment = payments[paymentId];

        require(payment.timestamp > 0, "Payment not found");
        require(payment.status == PaymentStatus.PROCESSING, "Invalid status");

        payment.status = PaymentStatus.COMPLETED;

        // Transfer to recipient
        if (payment.token == ETH_ADDRESS) {
            payable(payment.to).transfer(payment.amount);
        } else {
            IERC20(payment.token).safeTransfer(payment.to, payment.amount);
        }
    }

    /**
     * @dev Fail a payment (operator only)
     * @param paymentId ID of the payment to fail
     */
    function failPayment(bytes32 paymentId) external onlyRole(OPERATOR_ROLE) {
        Payment storage payment = payments[paymentId];

        require(payment.timestamp > 0, "Payment not found");
        require(payment.status == PaymentStatus.PROCESSING, "Invalid status");

        payment.status = PaymentStatus.FAILED;
    }

    /**
     * @dev Refund a payment
     * @param paymentId ID of the payment to refund
     * @param reason Reason for refund
     */
    function refundPayment(
        bytes32 paymentId,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Payment storage payment = payments[paymentId];

        require(payment.timestamp > 0, "Payment not found");
        require(
            payment.status == PaymentStatus.PROCESSING ||
            payment.status == PaymentStatus.COMPLETED,
            "Cannot refund"
        );

        payment.status = PaymentStatus.REFUNDED;

        // Refund to original sender
        if (payment.token == ETH_ADDRESS) {
            payable(payment.from).transfer(payment.amount);
        } else {
            IERC20(payment.token).safeTransfer(payment.from, payment.amount);
        }

        emit PaymentRefunded(paymentId, payment.from, payment.amount, reason, block.timestamp);
    }

    /**
     * @dev Register a merchant
     * @param merchant Merchant address
     * @param merchantName Name of the merchant
     */
    function registerMerchant(
        address merchant,
        string calldata merchantName
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(merchant != address(0), "Invalid merchant address");
        require(bytes(merchantName).length > 0, "Merchant name required");
        require(!registeredMerchants[merchant], "Merchant already registered");

        registeredMerchants[merchant] = true;
        merchantNames[merchant] = merchantName;
    }

    /**
     * @dev Unregister a merchant
     * @param merchant Merchant address to unregister
     */
    function unregisterMerchant(address merchant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registeredMerchants[merchant] = false;
        delete merchantNames[merchant];
    }

    /**
     * @dev Add a new route
     * @param routeName Name of the route
     * @param targetContract Target contract address
     */
    function addRoute(
        string calldata routeName,
        address targetContract
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(targetContract != address(0), "Invalid contract address");
        require(routes[routeName].targetContract == address(0), "Route exists");

        routes[routeName] = Route({
            targetContract: targetContract,
            active: true,
            totalPayments: 0,
            totalVolume: 0
        });

        emit RouteAdded(routeName, targetContract, true);
    }

    /**
     * @dev Update a route
     * @param routeName Name of the route
     * @param newContract New target contract address
     * @param active Whether route is active
     */
    function updateRoute(
        string calldata routeName,
        address newContract,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(routes[routeName].targetContract != address(0), "Route not found");
        require(newContract != address(0), "Invalid contract address");

        routes[routeName].targetContract = newContract;
        routes[routeName].active = active;

        emit RouteUpdated(routeName, newContract, active);
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
     * @dev Get user's payment IDs
     * @param user Address of the user
     */
    function getUserPayments(address user) external view returns (bytes32[] memory) {
        return userPayments[user];
    }

    /**
     * @dev Get merchant's payment IDs
     * @param merchant Address of the merchant
     */
    function getMerchantPayments(address merchant) external view returns (bytes32[] memory) {
        return merchantPayments[merchant];
    }

    /**
     * @dev Get payment details
     * @param paymentId ID of the payment
     */
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
