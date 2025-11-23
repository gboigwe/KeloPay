// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title KeloPayConversion
 * @dev Triggers and tracks crypto-to-fiat and fiat-to-crypto conversions
 * @notice Manages conversion requests and integrates with off-chain payment processors
 */
contract KeloPayConversion is AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Events
    event ConversionRequested(
        bytes32 indexed conversionId,
        address indexed user,
        string conversionType,
        address indexed token,
        uint256 tokenAmount,
        string fiatCurrency,
        uint256 fiatAmount,
        uint256 exchangeRate,
        uint256 timestamp
    );

    event ConversionApproved(
        bytes32 indexed conversionId,
        address indexed approver,
        uint256 timestamp
    );

    event ConversionCompleted(
        bytes32 indexed conversionId,
        string paymentReference,
        uint256 completedAt
    );

    event ConversionFailed(
        bytes32 indexed conversionId,
        string reason,
        uint256 timestamp
    );

    event ConversionCancelled(
        bytes32 indexed conversionId,
        address indexed user,
        uint256 timestamp
    );

    event ExchangeRateUpdated(
        string indexed pair,
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    event PaymentProcessorUpdated(
        string indexed processor,
        bool active,
        uint256 timestamp
    );

    // Structs
    enum ConversionStatus {
        PENDING,
        APPROVED,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    enum ConversionType {
        CRYPTO_TO_FIAT,
        FIAT_TO_CRYPTO
    }

    struct Conversion {
        address user;
        ConversionType conversionType;
        address token;
        uint256 tokenAmount;
        string fiatCurrency;
        uint256 fiatAmount;
        uint256 exchangeRate;
        ConversionStatus status;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 completedAt;
        address approver;
        string paymentProcessor;
        string paymentReference;
        string bankAccount;
        string failureReason;
    }

    // State variables
    mapping(bytes32 => Conversion) public conversions;
    mapping(address => bytes32[]) public userConversions;

    // Exchange rates (stored as rate * 10^8 for precision)
    mapping(string => uint256) public exchangeRates;
    mapping(string => uint256) public lastRateUpdate;

    // Payment processor registry
    mapping(string => bool) public activePaymentProcessors;

    // Supported currencies
    mapping(string => bool) public supportedFiatCurrencies;
    mapping(address => bool) public supportedTokens;

    address public constant ETH_ADDRESS = address(0);

    // Constants
    uint256 public constant RATE_PRECISION = 10**8;
    uint256 public constant MAX_RATE_AGE = 1 hours;

    /**
     * @dev Constructor to initialize the contract
     * @param admin Address of the admin
     */
    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);

        // Initialize supported currencies
        supportedFiatCurrencies["NGN"] = true;
        supportedFiatCurrencies["USD"] = true;
        supportedFiatCurrencies["EUR"] = true;
        supportedFiatCurrencies["GBP"] = true;

        // Initialize supported tokens
        supportedTokens[ETH_ADDRESS] = true;

        // Initialize payment processors
        activePaymentProcessors["paystack"] = true;
        activePaymentProcessors["stripe"] = true;
    }

    /**
     * @dev Request a crypto-to-fiat conversion
     * @param token Token address to convert
     * @param tokenAmount Amount of tokens to convert
     * @param fiatCurrency Target fiat currency
     * @param bankAccount Bank account details (encrypted off-chain)
     * @param paymentProcessor Payment processor to use
     */
    function requestCryptoToFiat(
        address token,
        uint256 tokenAmount,
        string calldata fiatCurrency,
        string calldata bankAccount,
        string calldata paymentProcessor
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedTokens[token], "Token not supported");
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(supportedFiatCurrencies[fiatCurrency], "Currency not supported");
        require(activePaymentProcessors[paymentProcessor], "Processor not active");
        require(bytes(bankAccount).length > 0, "Bank account required");

        // Get exchange rate
        string memory pair = string(abi.encodePacked(_getTokenSymbol(token), "/", fiatCurrency));
        uint256 rate = exchangeRates[pair];
        require(rate > 0, "Exchange rate not available");
        require(
            block.timestamp - lastRateUpdate[pair] < MAX_RATE_AGE,
            "Exchange rate too old"
        );

        // Calculate fiat amount
        uint256 fiatAmount = (tokenAmount * rate) / RATE_PRECISION;

        bytes32 conversionId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                tokenAmount,
                fiatCurrency,
                block.timestamp
            )
        );

        conversions[conversionId] = Conversion({
            user: msg.sender,
            conversionType: ConversionType.CRYPTO_TO_FIAT,
            token: token,
            tokenAmount: tokenAmount,
            fiatCurrency: fiatCurrency,
            fiatAmount: fiatAmount,
            exchangeRate: rate,
            status: ConversionStatus.PENDING,
            requestedAt: block.timestamp,
            approvedAt: 0,
            completedAt: 0,
            approver: address(0),
            paymentProcessor: paymentProcessor,
            paymentReference: "",
            bankAccount: bankAccount,
            failureReason: ""
        });

        userConversions[msg.sender].push(conversionId);

        emit ConversionRequested(
            conversionId,
            msg.sender,
            "CRYPTO_TO_FIAT",
            token,
            tokenAmount,
            fiatCurrency,
            fiatAmount,
            rate,
            block.timestamp
        );

        return conversionId;
    }

    /**
     * @dev Request a fiat-to-crypto conversion
     * @param token Token address to receive
     * @param fiatCurrency Source fiat currency
     * @param fiatAmount Amount of fiat being sent
     * @param paymentProcessor Payment processor used
     * @param paymentReference Reference from payment processor
     */
    function requestFiatToCrypto(
        address token,
        string calldata fiatCurrency,
        uint256 fiatAmount,
        string calldata paymentProcessor,
        string calldata paymentReference
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedTokens[token], "Token not supported");
        require(fiatAmount > 0, "Amount must be greater than 0");
        require(supportedFiatCurrencies[fiatCurrency], "Currency not supported");
        require(activePaymentProcessors[paymentProcessor], "Processor not active");
        require(bytes(paymentReference).length > 0, "Payment reference required");

        // Get exchange rate
        string memory pair = string(abi.encodePacked(_getTokenSymbol(token), "/", fiatCurrency));
        uint256 rate = exchangeRates[pair];
        require(rate > 0, "Exchange rate not available");
        require(
            block.timestamp - lastRateUpdate[pair] < MAX_RATE_AGE,
            "Exchange rate too old"
        );

        // Calculate token amount
        uint256 tokenAmount = (fiatAmount * RATE_PRECISION) / rate;

        bytes32 conversionId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                fiatAmount,
                fiatCurrency,
                paymentReference,
                block.timestamp
            )
        );

        conversions[conversionId] = Conversion({
            user: msg.sender,
            conversionType: ConversionType.FIAT_TO_CRYPTO,
            token: token,
            tokenAmount: tokenAmount,
            fiatCurrency: fiatCurrency,
            fiatAmount: fiatAmount,
            exchangeRate: rate,
            status: ConversionStatus.PENDING,
            requestedAt: block.timestamp,
            approvedAt: 0,
            completedAt: 0,
            approver: address(0),
            paymentProcessor: paymentProcessor,
            paymentReference: paymentReference,
            bankAccount: "",
            failureReason: ""
        });

        userConversions[msg.sender].push(conversionId);

        emit ConversionRequested(
            conversionId,
            msg.sender,
            "FIAT_TO_CRYPTO",
            token,
            tokenAmount,
            fiatCurrency,
            fiatAmount,
            rate,
            block.timestamp
        );

        return conversionId;
    }

    /**
     * @dev Approve a conversion
     * @param conversionId ID of the conversion to approve
     */
    function approveConversion(bytes32 conversionId) external onlyRole(OPERATOR_ROLE) {
        Conversion storage conversion = conversions[conversionId];

        require(conversion.requestedAt > 0, "Conversion not found");
        require(conversion.status == ConversionStatus.PENDING, "Invalid status");

        conversion.status = ConversionStatus.APPROVED;
        conversion.approvedAt = block.timestamp;
        conversion.approver = msg.sender;

        emit ConversionApproved(conversionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Mark conversion as processing
     * @param conversionId ID of the conversion
     */
    function startProcessing(bytes32 conversionId) external onlyRole(OPERATOR_ROLE) {
        Conversion storage conversion = conversions[conversionId];

        require(conversion.requestedAt > 0, "Conversion not found");
        require(conversion.status == ConversionStatus.APPROVED, "Not approved");

        conversion.status = ConversionStatus.PROCESSING;
    }

    /**
     * @dev Complete a conversion
     * @param conversionId ID of the conversion to complete
     * @param paymentReference Reference from payment processor
     */
    function completeConversion(
        bytes32 conversionId,
        string calldata paymentReference
    ) external onlyRole(OPERATOR_ROLE) {
        Conversion storage conversion = conversions[conversionId];

        require(conversion.requestedAt > 0, "Conversion not found");
        require(
            conversion.status == ConversionStatus.APPROVED ||
            conversion.status == ConversionStatus.PROCESSING,
            "Invalid status"
        );

        conversion.status = ConversionStatus.COMPLETED;
        conversion.completedAt = block.timestamp;
        conversion.paymentReference = paymentReference;

        emit ConversionCompleted(conversionId, paymentReference, block.timestamp);
    }

    /**
     * @dev Mark conversion as failed
     * @param conversionId ID of the conversion
     * @param reason Reason for failure
     */
    function failConversion(
        bytes32 conversionId,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        Conversion storage conversion = conversions[conversionId];

        require(conversion.requestedAt > 0, "Conversion not found");
        require(conversion.status != ConversionStatus.COMPLETED, "Already completed");
        require(bytes(reason).length > 0, "Reason required");

        conversion.status = ConversionStatus.FAILED;
        conversion.failureReason = reason;

        emit ConversionFailed(conversionId, reason, block.timestamp);
    }

    /**
     * @dev Cancel a conversion (user can cancel pending conversions)
     * @param conversionId ID of the conversion to cancel
     */
    function cancelConversion(bytes32 conversionId) external nonReentrant {
        Conversion storage conversion = conversions[conversionId];

        require(conversion.user == msg.sender, "Not authorized");
        require(conversion.status == ConversionStatus.PENDING, "Cannot cancel");

        conversion.status = ConversionStatus.CANCELLED;

        emit ConversionCancelled(conversionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update exchange rate (oracle role only)
     * @param pair Trading pair (e.g., "ETH/NGN")
     * @param rate Exchange rate (with 8 decimal precision)
     */
    function updateExchangeRate(
        string calldata pair,
        uint256 rate
    ) external onlyRole(ORACLE_ROLE) {
        require(rate > 0, "Invalid rate");

        uint256 oldRate = exchangeRates[pair];
        exchangeRates[pair] = rate;
        lastRateUpdate[pair] = block.timestamp;

        emit ExchangeRateUpdated(pair, oldRate, rate, block.timestamp);
    }

    /**
     * @dev Add supported token
     * @param token Token address
     */
    function addSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = true;
    }

    /**
     * @dev Remove supported token
     * @param token Token address
     */
    function removeSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = false;
    }

    /**
     * @dev Add supported fiat currency
     * @param currency Currency code (e.g., "NGN")
     */
    function addSupportedCurrency(string calldata currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedFiatCurrencies[currency] = true;
    }

    /**
     * @dev Remove supported fiat currency
     * @param currency Currency code
     */
    function removeSupportedCurrency(string calldata currency) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedFiatCurrencies[currency] = false;
    }

    /**
     * @dev Update payment processor status
     * @param processor Processor name
     * @param active Whether processor is active
     */
    function updatePaymentProcessor(
        string calldata processor,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        activePaymentProcessors[processor] = active;
        emit PaymentProcessorUpdated(processor, active, block.timestamp);
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
     * @dev Get user's conversion IDs
     * @param user Address of the user
     */
    function getUserConversions(address user) external view returns (bytes32[] memory) {
        return userConversions[user];
    }

    /**
     * @dev Get conversion details
     * @param conversionId ID of the conversion
     */
    function getConversion(bytes32 conversionId) external view returns (Conversion memory) {
        return conversions[conversionId];
    }

    /**
     * @dev Get token symbol (internal helper)
     * @param token Token address
     */
    function _getTokenSymbol(address token) internal pure returns (string memory) {
        if (token == ETH_ADDRESS) {
            return "ETH";
        }
        // For ERC20 tokens, would need to call symbol() - simplified for now
        return "TOKEN";
    }
}
