// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-hardhat/contracts/Sapphire.sol";

/**
 * @title ROFLIntegration
 * @notice Handles secure off-chain computations for AI model evaluation and data processing
 * @dev Integrates with Oasis ROFL framework for Trusted Execution Environment computations
 */
contract ROFLIntegration {
    using Sapphire for *;

    struct ComputationRequest {
        uint256 modelId;
        bytes encryptedInput;
        bytes encryptedConfig;
        address requester;
        uint256 timestamp;
        bytes32 resultHash;
        ComputationStatus status;
    }

    struct ComputeNode {
        address nodeAddress;
        bytes publicKey;
        bool isActive;
        uint256 totalComputations;
        uint256 reputation;
    }

    enum ComputationStatus {
        Pending,
        Processing,
        Completed,
        Failed
    }

    // State variables
    mapping(uint256 => ComputationRequest) private computationRequests;
    mapping(address => ComputeNode) private computeNodes;
    mapping(uint256 => mapping(address => bool)) private computePermissions;
    
    uint256 private nextRequestId;
    address private immutable owner;
    
    // Events
    event ComputationRequested(
        uint256 indexed requestId,
        uint256 indexed modelId,
        address indexed requester
    );
    event ComputationCompleted(
        uint256 indexed requestId,
        bytes32 resultHash
    );
    event ComputeNodeRegistered(
        address indexed nodeAddress,
        bytes publicKey
    );
    event ComputeNodeStatusUpdated(
        address indexed nodeAddress,
        bool isActive
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "ROFLIntegration: caller is not owner");
        _;
    }

    modifier onlyActiveNode() {
        require(computeNodes[msg.sender].isActive, "ROFLIntegration: not an active compute node");
        _;
    }

    constructor() {
        owner = msg.sender;
        nextRequestId = 1;
    }

    /**
     * @notice Register a new compute node with its public key
     * @param publicKey Node's public key for secure communication
     */
    function registerComputeNode(bytes calldata publicKey) external {
        require(!computeNodes[msg.sender].isActive, "ROFLIntegration: node already registered");
        
        // Verify key format
        require(publicKey.length == 32, "ROFLIntegration: invalid public key length");
        
        ComputeNode storage node = computeNodes[msg.sender];
        node.nodeAddress = msg.sender;
        node.publicKey = publicKey;
        node.isActive = true;
        node.totalComputations = 0;
        node.reputation = 100; // Initial reputation score

        emit ComputeNodeRegistered(msg.sender, publicKey);
    }

    /**
     * @notice Request off-chain computation for an AI model
     * @param modelId ID of the AI model to use
     * @param encryptedInput Encrypted input data
     * @param encryptedConfig Encrypted computation configuration
     * @return requestId Unique identifier for the computation request
     */
    function requestComputation(
        uint256 modelId,
        bytes calldata encryptedInput,
        bytes calldata encryptedConfig
    ) external returns (uint256) {
        require(computePermissions[modelId][msg.sender], "ROFLIntegration: no computation permission");

        // Generate unique nonce for request
        bytes memory nonce = Sapphire.randomBytes(32, abi.encodePacked("compute_request", nextRequestId));
        
        ComputationRequest storage request = computationRequests[nextRequestId];
        request.modelId = modelId;
        request.encryptedInput = encryptedInput;
        request.encryptedConfig = encryptedConfig;
        request.requester = msg.sender;
        request.timestamp = block.timestamp;
        request.status = ComputationStatus.Pending;

        emit ComputationRequested(nextRequestId, modelId, msg.sender);
        
        uint256 requestId = nextRequestId;
        nextRequestId++;
        return requestId;
    }

    /**
     * @notice Submit computation result from TEE
     * @param requestId ID of the computation request
     * @param resultHash Hash of the encrypted result
     * @param proof TEE attestation proof
     */
    function submitComputationResult(
        uint256 requestId,
        bytes32 resultHash,
        bytes calldata proof
    ) external onlyActiveNode {
        ComputationRequest storage request = computationRequests[requestId];
        require(request.status == ComputationStatus.Processing, "ROFLIntegration: invalid request status");
        
        // Verify TEE attestation proof
        require(verifyTEEProof(proof), "ROFLIntegration: invalid TEE proof");

        request.resultHash = resultHash;
        request.status = ComputationStatus.Completed;
        
        // Update node statistics
        ComputeNode storage node = computeNodes[msg.sender];
        node.totalComputations++;
        
        emit ComputationCompleted(requestId, resultHash);
    }

    /**
     * @notice Grant computation permission for a model
     * @param modelId ID of the AI model
     * @param user Address to grant permission to
     */
    function grantComputePermission(uint256 modelId, address user) external {
        require(msg.sender == owner, "ROFLIntegration: not authorized");
        computePermissions[modelId][user] = true;
    }

    /**
     * @notice Update compute node status
     * @param nodeAddress Address of the compute node
     * @param isActive New active status
     */
    function updateNodeStatus(address nodeAddress, bool isActive) external onlyOwner {
        require(computeNodes[nodeAddress].nodeAddress != address(0), "ROFLIntegration: node not registered");
        
        computeNodes[nodeAddress].isActive = isActive;
        emit ComputeNodeStatusUpdated(nodeAddress, isActive);
    }

    /**
     * @notice Get computation request details
     * @param requestId ID of the computation request
     * @return ComputationRequest struct containing request details
     */
    function getComputationRequest(uint256 requestId) external view returns (ComputationRequest memory) {
        return computationRequests[requestId];
    }

    /**
     * @notice Get compute node details
     * @param nodeAddress Address of the compute node
     * @return ComputeNode struct containing node details
     */
    function getComputeNode(address nodeAddress) external view returns (ComputeNode memory) {
        return computeNodes[nodeAddress];
    }

    /**
     * @notice Verify TEE attestation proof
     * @param proof Attestation proof from the TEE
     * @return bool indicating if the proof is valid
     */
    function verifyTEEProof(bytes calldata proof) internal pure returns (bool) {
        // Implement TEE proof verification logic
        // This would typically involve checking the attestation signature
        // and verifying the TEE measurements
        return proof.length > 0; // Placeholder implementation
    }

    /**
     * @notice Update node reputation based on computation performance
     * @param nodeAddress Address of the compute node
     * @param performanceScore Score based on computation performance (0-100)
     */
    function updateNodeReputation(address nodeAddress, uint256 performanceScore) external onlyOwner {
        require(performanceScore <= 100, "ROFLIntegration: invalid performance score");
        
        ComputeNode storage node = computeNodes[nodeAddress];
        require(node.isActive, "ROFLIntegration: node not active");
        
        // Update reputation with weighted average
        node.reputation = (node.reputation * 7 + performanceScore * 3) / 10;
    }
}