// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-hardhat/contracts/Sapphire.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IOceanProvider {
    function startComputeJob(
        address dataset,
        address algorithm,
        bytes calldata params
    ) external returns (bytes32 jobId);
    
    function getComputeResult(bytes32 jobId) 
        external view returns (bytes memory result, bool finished);
}

/**
 * @title OceanComputeIntegration
 * @notice Handles compute-to-data integration with Ocean Protocol
 */
contract OceanComputeIntegration is ReentrancyGuard {
    using Sapphire for *;

    struct ComputeJob {
        address requester;
        address dataToken;
        address algorithmToken;
        bytes32 oceanJobId;
        bytes encryptedParams;
        bytes32 resultHash;
        uint256 timestamp;
        ComputeStatus status;
    }

    enum ComputeStatus {
        Pending,
        Processing,
        Completed,
        Failed
    }

    // State variables
    mapping(bytes32 => ComputeJob) public computeJobs;
    mapping(address => mapping(address => uint256)) public computeAllowance;
    
    address public immutable oceanProvider;
    address public immutable owner;

    // Events
    event ComputeJobStarted(
        bytes32 indexed jobId,
        address indexed requester,
        address dataToken
    );
    event ComputeJobCompleted(
        bytes32 indexed jobId,
        bytes32 resultHash
    );
    event ComputeAllowanceSet(
        address indexed dataToken,
        address indexed user,
        uint256 amount
    );

    constructor(address _oceanProvider) {
        oceanProvider = _oceanProvider;
        owner = msg.sender;
    }

    /**
     * @notice Start a compute-to-data job
     * @param dataToken Ocean data token address
     * @param algorithmToken Ocean algorithm token address
     * @param encryptedParams Encrypted computation parameters
     * @return jobId Unique identifier for the compute job
     */
    function startCompute(
        address dataToken,
        address algorithmToken,
        bytes calldata encryptedParams
    ) external nonReentrant returns (bytes32) {
        require(computeAllowance[dataToken][msg.sender] > 0, "No compute allowance");
        
        // Generate unique nonce for job
        bytes memory nonce = Sapphire.randomBytes(32, "compute_job");
        bytes32 jobId = keccak256(abi.encodePacked(nonce, msg.sender, block.timestamp));

        // Decrypt parameters for Ocean Provider
        bytes memory decryptedParams = decryptComputeParams(encryptedParams);
        
        // Start Ocean compute job
        bytes32 oceanJobId = IOceanProvider(oceanProvider).startComputeJob(
            dataToken,
            algorithmToken,
            decryptedParams
        );

        // Store job details
        computeJobs[jobId] = ComputeJob({
            requester: msg.sender,
            dataToken: dataToken,
            algorithmToken: algorithmToken,
            oceanJobId: oceanJobId,
            encryptedParams: encryptedParams,
            resultHash: bytes32(0),
            timestamp: block.timestamp,
            status: ComputeStatus.Processing
        });

        // Decrease allowance
        computeAllowance[dataToken][msg.sender]--;

        emit ComputeJobStarted(jobId, msg.sender, dataToken);
        
        return jobId;
    }

    /**
     * @notice Check compute job result
     * @param jobId Unique identifier for the compute job
     * @return result Encrypted computation result
     * @return status Current status of the job
     */
    function getComputeResult(bytes32 jobId) 
        external view returns (bytes memory result, ComputeStatus status) 
    {
        ComputeJob storage job = computeJobs[jobId];
        require(job.requester == msg.sender, "Not authorized");

        if (job.status == ComputeStatus.Completed) {
            return (job.encryptedParams, job.status);
        }

        // Check Ocean Provider for results
        (bytes memory oceanResult, bool finished) = IOceanProvider(oceanProvider)
            .getComputeResult(job.oceanJobId);

        if (finished) {
            // Encrypt result before returning
            bytes memory encryptedResult = encryptComputeResult(oceanResult);
            return (encryptedResult, ComputeStatus.Completed);
        }

        return ("", job.status);
    }

    /**
     * @notice Set compute allowance for a user
     * @param dataToken Ocean data token address
     * @param user User address
     * @param amount Number of compute jobs allowed
     */
    function setComputeAllowance(
        address dataToken,
        address user,
        uint256 amount
    ) external {
        require(msg.sender == owner, "Not authorized");
        computeAllowance[dataToken][user] = amount;
        emit ComputeAllowanceSet(dataToken, user, amount);
    }

    /**
     * @notice Decrypt compute parameters for Ocean Provider
     * @param encryptedParams Encrypted parameters
     * @return Decrypted parameters
     */
    function decryptComputeParams(bytes memory encryptedParams) 
        internal view returns (bytes memory) 
    {
        // Implementation would use Sapphire's encryption capabilities
        return encryptedParams;
    }

    /**
     * @notice Encrypt compute result for requester
     * @param result Raw computation result
     * @return Encrypted result
     */
    function encryptComputeResult(bytes memory result) 
        internal view returns (bytes memory) 
    {
        // Implementation would use Sapphire's encryption capabilities
        return result;
    }
}