// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// todo -- there is confusion between 'receiver' -- contract that receives ccip message and 'receiver' of bridging
// lets call t

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TransmissionLib.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

/// @title - A simple messenger contract for sending/receving string data across chains.
contract Mountain is CCIPReceiver, OwnerIsCreator, ReentrancyGuard {
    using TransmissionLib for TransmissionLib.SwapData;
    using TransmissionLib for TransmissionLib.LiquidityStaging;
    using TransmissionLib for TransmissionLib.Liquidity;
    using TransmissionLib for TransmissionLib.TransmissionType;

    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance.
    error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
    error FailedToWithdrawEth(address owner, address target, uint256 value); // Used when the withdrawal of Ether fails.
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector); // Used when the destination chain has not been allowlisted by the contract owner.
    error SourceChainNotAllowlisted(uint64 sourceChainSelector); // Used when the source chain has not been allowlisted by the contract owner.
    error SenderNotAllowlisted(address sender); // Used when the sender has not been allowlisted by the contract owner.

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        bytes data, // The text being sent.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the CCIP message.
    );

    // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed sourceChainSelector, // The chain selector of the source chain.
        address sender, // The address of the sender from the source chain.
        string text, // The text that was received.
        TransmissionLib.TransmissionType transmissionType // transmission type
    );

    // Event to log the staging of liquidity
    event LiquidityStaged(uint256 indexed blockchainId, address indexed provider, address indexed token, uint256 amount);
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenAddress,
        uint256 amountMountain,
        uint256 lakeBlockchainId,
        address lakeContractAddress,
        uint256 amountLake,
        address receiver
    );

    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenAddress,
        uint256 amountMountain,
        uint256 lakeBlockchainId,
        address lakeContractAddress,
        uint256 amountLake,
        address receiver
    );

    enum TerrainType {  LAKE, MOUNTAIN }
//    enum TransmissionLib.TransmissionType {  SwapData, LiquidityStaging, Liquidity }

    struct TerrainInfo {
        uint256 blockchainId;
        address contractAddress;
    }

    bytes32 private s_lastReceivedMessageId; // Store the last received messageId.
    string private s_lastReceivedText; // Store the last received text.
    uint88 public nonce; // successful bridge nonce used across all networks
    uint256 public myNetworkAddress;
    TerrainType public terrain;
    TerrainInfo public mountainInfo;


    // [blockchain identifier][token's address] => amount
    mapping(uint256 => mapping(address => uint256)) public liquidity;
    // [blockchain identifier][token's address] => amount
    mapping(uint256 => mapping(address => uint256)) public liquidityStaging;
    // Mapping for approved withdrawals (used when this contract acts as a Lake)
    mapping(uint256 => mapping(address => uint256)) public approvedWithdrawals;


    // Mapping to keep track of allowlisted destination chains.
    mapping(uint64 => bool) public allowlistedDestinationChains;

    // Mapping to keep track of allowlisted source chains.
    mapping(uint64 => bool) public allowlistedSourceChains;

    // Mapping to keep track of allowlisted senders.
    mapping(address => bool) public allowlistedSenders;

    IERC20 public s_linkToken;

    /// @notice Constructor initializes the contract with the router address.
    /// @param _router The address of the router contract.
    /// @param _link The address of the link contract.
    constructor(address _router, address _link, TerrainType _terrain, uint256 _myNetworkAddress) CCIPReceiver(_router)  {
        s_linkToken = IERC20(_link);
        terrain = _terrain;
        myNetworkAddress = _myNetworkAddress;
    }

    /// @dev Modifier that checks if the chain with the given destinationChainSelector is allowlisted.
    /// @param _destinationChainSelector The selector of the destination chain.
    modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector) {
        // todo -- remove temp 'false &&' overrides
        if (false && !allowlistedDestinationChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }

    /// @dev Modifier that checks if the chain with the given sourceChainSelector is allowlisted and if the sender is allowlisted.
    /// @param _sourceChainSelector The selector of the destination chain.
    /// @param _sender The address of the sender.
    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        // todo -- remove temp 'true &&' overrides
        if (false && !allowlistedSourceChains[_sourceChainSelector])
            revert SourceChainNotAllowlisted(_sourceChainSelector);
        if (false && !allowlistedSenders[_sender]) revert SenderNotAllowlisted(_sender);
        _;
    }



    /**
     * @notice Calculates the amount out for a token swap based on a constant product formula.
     * @param blockchainNumber The identifier for the target blockchain.
     * @param token The address of the token being swapped.
     * @param amountIn The amount of tokens the user is swapping.
     * @return amountOut The amount of tokens the user receives after the swap.
     */
    function calculateAmountOut(uint256 blockchainNumber, address token, uint256 amountIn) public view returns (uint256 amountOut) {
        uint256 x = liquidity[myNetworkAddress][token]; // Reserve in this contract // todo -- add in constant for this network -- or get current amount by queueing balanceOf
        uint256 y = liquidity[blockchainNumber][token]; // Reserve in the target blockchain (best estimate as some tokens change quantity) // todo -- create updateBlockchainTokenAmmounts, or similar, by passing/getting info

        require(x > 0 && y > 0, "Insufficient liquidity");
        require(amountIn < x, "Insufficient liquidity for this amount");

        uint256 k = x * y; // Constant product
        uint256 newX = x + amountIn;
        uint256 newY = k / newX;

        amountOut = y - newY;
        return amountOut;
    }
//
//
//    function calculateCCIPFee(
//        TransmissionLib.TransmissionType structureType,
//        bytes memory transmissionType,
//        address _receiver,
//        uint64 _destinationChainSelector
//    ) external view returns (uint256 fee) {
//        string memory _text;
//
//        // Determine which structure to use and create the text
//        if (structureType == TransmissionLib.TransmissionType.SwapData) {
//            TransmissionLib.SwapData memory swapData = abi.decode(transmissionType, (TransmissionLib.SwapData));
//            _text = TransmissionLib.dataToStringSwap(swapData);
//        } else if (structureType == TransmissionLib.TransmissionType.LiquidityStaging) {
//            TransmissionLib.LiquidityStaging memory liquidityStaging = abi.decode(transmissionType, (TransmissionLib.LiquidityStaging));
//            _text = TransmissionLib.dataToStringLiquidityStaging(liquidityStaging);
//        } else if (structureType == TransmissionLib.TransmissionType.Liquidity) {
//            TransmissionLib.Liquidity memory liquidity = abi.decode(transmissionType, (TransmissionLib.Liquidity));
//            _text = TransmissionLib.dataToStringLiquidity(liquidity);
//        } else {
//            revert("Invalid structure type");
//        }
//
//        // Create an EVM2AnyMessage struct
//        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
//            _receiver,
//            _text,
//            address(0) // Assuming fees are paid in the native currency
//        );
//
//        // Calculate the fee
//        IRouterClient router = IRouterClient(this.getRouter());
//        fee = router.getFee(_destinationChainSelector, evm2AnyMessage);
//
//        return fee;
//    }



    /// @dev Updates the allowlist status of a destination chain for transactions.
    function allowlistDestinationChain(
        uint64 _destinationChainSelector,
        bool allowed
    ) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    /// @dev Updates the allowlist status of a source chain for transactions.
    function allowlistSourceChain(
        uint64 _sourceChainSelector,
        bool allowed
    ) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    /// @dev Updates the allowlist status of a sender for transactions.
    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }


    /**
     * @notice Sets the mountain information.
     * @param _blockchainId The blockchain ID for the mountain.
     * @param _contractAddress The contract address for the mountain.
     * @dev Only callable by the owner (admin) of the contract.
     */
    function setMountainInfo(uint256 _blockchainId, address _contractAddress) external onlyOwner {
        mountainInfo = TerrainInfo({
            blockchainId: _blockchainId,
            contractAddress: _contractAddress
        });
    }


    /// @notice Allows liquidity providers to stage liquidity (ERC20 tokens or ETH)
    /// @param _tokenAddress The address of the ERC20 token to be staged; address(0) for ETH
    /// @param amount The amount of the token (or ETH) to be staged
    function stageLiquidity(address _tokenAddress, uint256 amount) external payable onlyOwner nonReentrant {
        require(_tokenAddress == address(0) || amount > 0, "Invalid amount");
        if (_tokenAddress == address(0)) {
            // Staging ETH
            require(msg.value >= amount, "ETH value mismatch");
            liquidityStaging[myNetworkAddress][_tokenAddress] += msg.value;
        } else {
            // Staging ERC20 token
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), amount);
            liquidityStaging[myNetworkAddress][_tokenAddress] += amount;
        }

        // if Lake, transmit info to Mountain
        if(terrain == TerrainType.LAKE){
            require(mountainInfo.contractAddress!=address(0), "Mountain info not set");
            TransmissionLib.LiquidityStaging memory myData = TransmissionLib.LiquidityStaging(TransmissionLib.TransmissionType.LiquidityStaging, _tokenAddress, msg.sender, nonce, uint120(amount), 0);
//            string memory _text = TransmissionLib.dataToStringLiquidityStaging(myData);

            Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
                mountainInfo.contractAddress,
                abi.encode(myData),
                address(0)
            );

            // Initialize a router client instance to interact with cross-chain router
            IRouterClient router = IRouterClient(this.getRouter());

           // Get the fee required to send the CCIP message
            uint256 fees = router.getFee(uint64(mountainInfo.blockchainId), evm2AnyMessage);

            if (fees + amount < msg.value)
                revert NotEnoughBalance(address(this).balance, fees);
            else{
                uint256 overpay = msg.value - fees - amount;
                if (overpay>0){
                    payable(msg.sender).transfer(overpay);
                }
            }

            // Send the CCIP message through the router and store the returned CCIP message ID
            router.ccipSend{value: fees}(uint64(mountainInfo.blockchainId), evm2AnyMessage);
        }
        emit LiquidityStaged(myNetworkAddress, msg.sender, _tokenAddress, amount);
    }





//    /// @notice Allows liquidity providers to withdraw their staged liquidity (ERC20 tokens or ETH)
//    /// @param token The address of the ERC20 token to be withdrawn; address(0) for ETH
//    function withdrawStagedLiquidity(address token) external nonReentrant {
//        uint256 amount = liquidityStaging[myNetworkAddress][token];
//        require(amount > 0, "No liquidity to withdraw");
//        liquidityStaging[myNetworkAddress][token] = 0;
//
//        if (token == address(0)) {
//            // Withdrawing ETH
//            payable(msg.sender).transfer(amount);
//        } else {
//            // Withdrawing ERC20 tokens
//            IERC20(token).transfer(msg.sender, amount);
//        }
//    }
//










/**
 * @dev Adds liquidity from the staged amounts.
 * Can only be called by the Mountain contract.
 * @param tokenAddress The address of the token for which liquidity is being added.
 * @param lakeBlockchainId The blockchain ID of the Lake contract.
 * @param slippage Slippage tolerance for the liquidity addition.
 * @param receiver The address that will receive the liquidity on the Lake side.
 */    function addLiquidityFromStaged(
        address tokenAddress,
        uint256 lakeBlockchainId,
        uint16 slippage,
        address receiver
    ) external onlyOwner {
        require(terrain == TerrainType.MOUNTAIN, "Function only callable by Mountain");
        require(receiver != address(0), "Liquidity Receiver can not be 0 address");

        uint256 mountainStaged = liquidityStaging[myNetworkAddress][tokenAddress];
        uint256 lakeStaged = liquidityStaging[lakeBlockchainId][tokenAddress];

        require(mountainStaged > 0 && lakeStaged > 0, "Non-zero amounts required in staging");

        // Use the new function to calculate liquidity to add for both sides
        (uint256 mountainSide, uint256 lakeSide) = calculateLiquidityToAdd(tokenAddress, lakeBlockchainId);

        // Check for slippage requirements
        uint256 amountOut = calculateAmountOut(lakeBlockchainId, tokenAddress, mountainSide);
        require(isWithinSlippage(amountOut, lakeSide, slippage), "Slippage limit exceeded");

        // Adjust the liquidity on both sides
        liquidityStaging[myNetworkAddress][tokenAddress] -= mountainSide;
        liquidity[myNetworkAddress][tokenAddress] += mountainSide;

        // Calculate the difference for the staging lake
        uint256 stagingLake = lakeStaged - lakeSide;

        // Update the lake side liquidity in the CCIP message
        TransmissionLib.Liquidity memory liquidityData = TransmissionLib.Liquidity({
            transmissionType: TransmissionLib.TransmissionType.Liquidity,
            token: tokenAddress,
            beneficiary: msg.sender,
            nonce: nonce,
            mountain: uint120(mountainSide),
            lake: uint120(lakeSide),
            stagingLake: uint120(stagingLake)
        });
//        string memory dataStr =TransmissionLib.dataToStringLiquidity(liquidityData);

        // Send CCIP message
        sendMessagePayNative(uint64(lakeBlockchainId), receiver, abi.encode(liquidityData));

        // Increment nonce for next operation
        nonce++;
    }


    function isWithinSlippage(uint256 amountOut, uint256 targetAmount, uint16 slippage) internal pure returns (bool) {
        uint256 slippageAmount = targetAmount > amountOut ? (targetAmount - amountOut) : (amountOut - targetAmount);
        return slippageAmount <= (targetAmount * slippage / 10000); // Slippage in basis points
    }

    function calculateLiquidityToAdd(address tokenAddress, uint256 lakeBlockchainId)
        internal
        view
        returns (uint256 mountainSide, uint256 lakeSide)
    {
        uint256 mountainStaged = liquidityStaging[myNetworkAddress][tokenAddress];
        uint256 lakeStaged = liquidityStaging[lakeBlockchainId][tokenAddress];
        uint256 mountainLiquidity = liquidity[myNetworkAddress][tokenAddress];
        uint256 lakeLiquidity = liquidity[lakeBlockchainId][tokenAddress];

        if (mountainLiquidity == 0 || lakeLiquidity == 0) {
            // If either pool is empty, use the lesser of the two staged amounts for both sides
            uint256 lesserAmount = mountainStaged < lakeStaged ? mountainStaged : lakeStaged;
            return (lesserAmount, lesserAmount);
        }

        // Calculate the equivalent lake amount for the mountain staged amount
        uint256 equivalentLakeAmount = (mountainStaged * lakeLiquidity) / mountainLiquidity;

        // Determine the limiting side
        if (equivalentLakeAmount < lakeStaged) {
            // Mountain side is limiting
            return (mountainStaged, equivalentLakeAmount);
        } else {
            // Lake side is limiting
            uint256 equivalentMountainAmount = (lakeStaged * mountainLiquidity) / lakeLiquidity;
            return (equivalentMountainAmount, lakeStaged);
        }
    }




















    /**
     * @notice Bridges native tokens to a specified destination chain, and sends a message.
     * @dev Calls the _bridge internal function to handle the bridging logic.
     * @param _destinationChainSelector The identifier for the destination blockchain.
     * @param _receiver The address of the recipient on the destination blockchain.
     * @return messageId The ID of the CCIP message that was sent.
     */
    function bridgeNative(
        uint64 _destinationChainSelector,
        uint96 _outAmount,
        address _receiver,
        address _beneficiary,
        uint16 slippage
    )
        external
        payable
        returns (bytes32 messageId)
    {
        require(msg.value > 0, "insufficient funds");



        // todo -- remove bridging fees
        uint96 adjustedIn = uint96(msg.value);

        // Call the internal _bridge function
        return _bridge(address(0), adjustedIn, _outAmount, _destinationChainSelector, _receiver, _beneficiary, slippage);
    }

    /**
     * @notice Bridges ERC20 tokens to a specified destination chain, and sends a message.
     * @dev Transfers ERC20 tokens and then calls the _bridge internal function.
     * @param _tokenAddress The address of the ERC20 token contract.
     * @param _inAmount The amount of ERC20 tokens to bridge.
     * @param _outAmount The expected amount of the asset to receive.
     * @param _destinationChainSelector The identifier for the destination blockchain.
     * @param _receiver The address of the recipient on the destination blockchain.
     * @return messageId The ID of the CCIP message that was sent.
     */
    function bridgeToken(
        address _tokenAddress,
        uint96 _inAmount,
        uint96 _outAmount,
        uint64 _destinationChainSelector,
        address _receiver,
        address _beneficiary,
        uint16 slippage
    )
        external
        returns (bytes32 messageId)
    {
        require(_inAmount > 0, "insufficient amount");

        IERC20 token = IERC20(_tokenAddress);

        // Check if the contract has the necessary allowance
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _inAmount, "Token allowance too low");

        // Transfer tokens to this contract
        token.transferFrom(msg.sender, address(this), _inAmount);


        // Call the internal _bridge function
        return _bridge(_tokenAddress, _inAmount, _outAmount, _destinationChainSelector, _receiver, _beneficiary, slippage);
    }


  /**
     * @notice Bridges ERC20 tokens to a specified destination chain, and sends a message
     * @dev This function transfers ERC20 tokens from the caller to this contract and then
     * calls `sendMessagePayNative` to send a cross-chain message. Ensure that the ERC20
     * token contract has granted an allowance to this contract for the specified amount.
     * @param _tokenAddress The address of the ERC20 token contract
     * @param _inAmount The amount of tokens to bridge
     * @param _outAmount The amount of tokens to bridge
     * @param _destinationChainSelector The identifier for the destination blockchain
     * @param _receiver The address of the recipient on the destination blockchain
     * @param slippage The percent difference that is acceptable in return values --
     * @return messageId The ID of the CCIP message that was sent
     */
    function _bridge(
        address _tokenAddress,
        uint96 _inAmount,
        uint96 _outAmount,
        uint64 _destinationChainSelector,
        address _receiver,
        address _beneficiary,
        uint16 slippage // 100 is 1 percent
    )
        internal
        returns (bytes32 messageId)
    {

        // todo -- we need to remove the fees first
        // update liquidity for Mountain/Lake???
        // todo -- update

        // check if slippage is valid
        // todo see if expected amount works -- if on Mountain
        uint256 outAmountActual = calculateAmountOut(_destinationChainSelector, _tokenAddress, _inAmount);

        // Ensure outAmountActual is not zero to avoid division by zero
        require(outAmountActual > 0, "Invalid output amount.");

        // Calculate slippage
        uint256 slippageAmount = _outAmount > outAmountActual
            ? (_outAmount - outAmountActual) * 100 / outAmountActual
            : (outAmountActual - _outAmount) * 100 / outAmountActual;

        // Check if slippage is within bounds
        require(slippageAmount <= slippage, "Too much slippage.");

        // convert data to string
        TransmissionLib.SwapData memory myData = TransmissionLib.SwapData(TransmissionLib.TransmissionType.SwapData, _tokenAddress, _beneficiary, nonce, _inAmount, _outAmount, slippage);
//        string memory _text = TransmissionLib.dataToStringSwap(myData);


        // Call sendMessagePayNative function
        // Assuming this function is part of the same contract
        messageId = sendMessagePayNative(_destinationChainSelector, _receiver, abi.encode(myData));
    }



//    /// @notice Sends data to receiver on the destination chain.
//    /// @notice Pay for fees in LINK.
//    /// @dev Assumes your contract has sufficient LINK.
//    /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
//    /// @param _receiver The address of the recipient on the destination blockchain.
//    /// @param _text The text to be sent.
//    /// @return messageId The ID of the CCIP message that was sent.
//    function sendMessagePayLINK(
//        uint64 _destinationChainSelector,
//        address _receiver,
//        string memory _text
//    )
//        internal
//        onlyOwner
//        onlyAllowlistedDestinationChain(_destinationChainSelector)
//        returns (bytes32 messageId)
//    {
//        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
//        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
//            _receiver,
//            _text,
//            address(s_linkToken)
//        );
//
//        // Initialize a router client instance to interact with cross-chain router
//        IRouterClient router = IRouterClient(this.getRouter());
//
//        // Get the fee required to send the CCIP message
//        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);
//
//        if (fees > s_linkToken.balanceOf(address(this)))
//            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);
//
//        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
//        s_linkToken.approve(address(router), fees);
//
//        // Send the CCIP message through the router and store the returned CCIP message ID
//        messageId = router.ccipSend(_destinationChainSelector, evm2AnyMessage);
//
//        // Emit an event with message details
//        emit MessageSent(
//            messageId,
//            _destinationChainSelector,
//            _receiver,
//            _text,
//            address(s_linkToken),
//            fees
//        );
//
//        // Return the CCIP message ID
//        return messageId;
//    }



    /// @notice Sends data to receiver on the destination chain.
    /// @notice Pay for fees in native gas.
    /// @dev Assumes your contract has sufficient native gas tokens.
    /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param _receiver The address of the recipient on the destination blockchain.
    /// @param _data The data to be sent.
    /// @return messageId The ID of the CCIP message that was sent.
    function sendMessagePayNative(
        uint64 _destinationChainSelector,
        address _receiver,
        bytes memory _data
    )
        public payable
        returns (bytes32 messageId)
    {

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _data,
            address(0)
        );

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router =  IRouterClient(this.getRouter());

        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);

//        // Check if there's enough balance to cover fees and amount
//        require(fees + amount <= address(this).balance, string(abi.encodePacked(
//            "Not enough balance: required ",
//            uintToString(fees + amount),
//            ", available ",
//            uintToString(address(this).balance)
//        )));

        // Check if there's enough balance to cover fees and amount
        require(fees < address(this).balance, string("Not enough balance: required "));

        // Send the CCIP message through the router and store the returned CCIP message ID
        messageId = router.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _receiver,
            _data,
            address(0),
            fees
        );

        // Return the CCIP message ID
        return messageId;
    }


    /// handle a received message
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        override
        onlyAllowlisted(
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address))
        ) // Make sure source chain and sender are allowlisted
    {
        s_lastReceivedMessageId = any2EvmMessage.messageId; // fetch the messageId
        s_lastReceivedText = abi.decode(any2EvmMessage.data, (string)); // abi-decoding of the sent text


        TransmissionLib.TransmissionType transmissionType = TransmissionLib.getTypeFromString(s_lastReceivedText);
        if (transmissionType == TransmissionLib.TransmissionType.SwapData) {
            TransmissionLib.SwapData memory mySwapData = TransmissionLib.stringToDataSwap(s_lastReceivedText);
            // Further processing with swapData
            mySwapData; // todo;
        } else if (transmissionType == TransmissionLib.TransmissionType.LiquidityStaging) {
            TransmissionLib.LiquidityStaging memory myLiquidityStaging = TransmissionLib.stringToDataLiquidityStaging(s_lastReceivedText);
            // Further processing with liquidityStaging
            myLiquidityStaging; // todo;
        } else if (transmissionType == TransmissionLib.TransmissionType.Liquidity) {
            TransmissionLib.Liquidity memory myLiquidity = TransmissionLib.stringToDataLiquidity(s_lastReceivedText);
            // Further processing with liquidity
            myLiquidity; // todo;
        } else {
            revert("Unknown transmission type");
        }

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            abi.decode(any2EvmMessage.data, (string)),
            transmissionType
        );
    }


    /// @notice Construct a CCIP message.
    /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for sending a text.
    /// @param _receiver The address of the receiver.
    /// @param _data The  data to be sent.
    /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _feeTokenAddress
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: _data, // ABI-encoded string
                tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array aas no tokens are transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit and non-strict sequencing mode
                    Client.EVMExtraArgsV1({gasLimit: 2_000_000, strict: false})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }



    /**
     * @notice Retrieves the mountain information.
     * @return The terrain information for the mountain.
     */
    function getMountainInfo() external view returns (TerrainInfo memory) {
        return mountainInfo;
    }


    /// @notice Fetches the amount of given asset at given blockchain
    /// @param _id Network Id
    /// @param _address address of asset (ie token). 0 for native.
    /// @return amount of asset at given blockchain
    function getAmountGivenBlockchainAndAddress(uint256 _id, address _address) external view returns (uint256) {
        return liquidity[_id][_address];
    }


    /// @notice Fetches the details of the last received message.
    /// @return messageId The ID of the last received message.
    /// @return text The last received text.
    function getLastReceivedMessageDetails()
        external
        view
        returns (bytes32 messageId, string memory text)
    {
        return (s_lastReceivedMessageId, s_lastReceivedText);
    }

    /// @notice Fallback function to allow the contract to receive Ether.
    /// @dev This function has no function body, making it a default function for receiving Ether.
    /// It is automatically called when Ether is sent to the contract without any data.
    receive() external payable {}

    /// @notice Allows the contract owner to withdraw the entire balance of Ether from the contract.
    /// @dev This function reverts if there are no funds to withdraw or if the transfer fails.
    /// It should only be callable by the owner of the contract.
    /// @param _beneficiary The address to which the Ether should be sent.
    function withdraw(address _beneficiary) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = address(this).balance;

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        // Attempt to send the funds, capturing the success status and discarding any return data
        (bool sent, ) = _beneficiary.call{value: amount}("");

        // Revert if the send failed, with information about the attempted transfer
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }

    /// @notice Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.
    /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
    /// @param _beneficiary The address to which the tokens will be sent.
    /// @param _token The contract address of the ERC20 token to be withdrawn.
    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = IERC20(_token).balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).transfer(_beneficiary, amount);
    }


    // todo -- mark as onlyOwner for now
    /// @notice Withdraws staged liquidity based on the terrain type
    /// @param blockchainId The identifier of the blockchain
    /// @param token The address of the token (address(0) for ETH)
    /// @param amount The amount to withdraw
    function withdrawStagedLiquidity(uint256 blockchainId, address token, uint256 amount) external nonReentrant {
        if (terrain == TerrainType.MOUNTAIN || approvedWithdrawals[blockchainId][token] >= amount) {
            require(liquidityStaging[blockchainId][token] >= amount, "Insufficient liquidity staged");
            liquidityStaging[blockchainId][token] -= amount;
            if (terrain == TerrainType.LAKE) {
                approvedWithdrawals[blockchainId][token] -= amount;
            }

            if (token == address(0)) {
                payable(msg.sender).transfer(amount);
            } else {
                IERC20(token).transfer(msg.sender, amount);
            }
        } else {
            revert("Withdrawal not approved or terrain type mismatch");
        }
    }

//    // Helper function to convert a uint256 to a string
//    function uintToString(uint256 _value) internal pure returns (string memory) {
//        if (_value == 0) {
//            return "0";
//        }
//        uint256 temp = _value;
//        uint256 digits;
//        while (temp != 0) {
//            digits++;
//            temp /= 10;
//        }
//        bytes memory buffer = new bytes(digits);
//        while (_value != 0) {
//            digits -= 1;
//            buffer[digits] = bytes1(uint8(48 + _value % 10));
//            _value /= 10;
//        }
//        return string(buffer);
//    }

}
