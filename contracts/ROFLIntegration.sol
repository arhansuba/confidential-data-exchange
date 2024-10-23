// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ROFLIntegration is Ownable, ReentrancyGuard {
    // Struct to store the details of each off-chain computation request
    struct OffchainComputationRequest {
        uint256 requestId;
        uint256 tokenId;  // NFT ID for the AI model
        address requester;
        string inputDataHash;  // Hash of the input data (for verification)
        string resultHash;  // Hash of the computed result (to be provided later)
        bool completed;
    }

    // Mapping to store off-chain computation requests
    mapping(uint256 => OffchainComputationRequest) public requests;

    // Counter for generating unique request IDs
    uint256 private requestCounter;

    // Event emitted when an off-chain computation request is initiated
    event ComputationRequested(
        uint256 indexed requestId,
        uint256 indexed tokenId,
        address indexed requester,
        string inputDataHash
    );

    // Event emitted when an off-chain computation is completed and results are verified
    event ComputationCompleted(
        uint256 indexed requestId,
        uint256 indexed tokenId,
        string resultHash,
        bool success
    );

    constructor() {
        requestCounter = 1;  // Start request IDs from 1
    }

    /**
     * @dev Request an off-chain computation for an AI model or dataset.
     * @param tokenId The NFT ID representing the AI model/dataset.
     * @param inputDataHash The hash of the input data for verification purposes.
     * @return requestId The ID of the off-chain computation request.
     */
    function requestComputation(uint256 tokenId, string memory inputDataHash)
        external
        returns (uint256 requestId)
    {
        requestId = requestCounter;
        requestCounter++;

        // Create a new off-chain computation request
        requests[requestId] = OffchainComputationRequest({
            requestId: requestId,
            tokenId: tokenId,
            requester: msg.sender,
            inputDataHash: inputDataHash,
            resultHash: "",
            completed: false
        });

        emit ComputationRequested(requestId, tokenId, msg.sender, inputDataHash);

        // Logic to initiate the ROFL off-chain computation (off-chain process)
        // ROFL API/Service Call to process the request
    }

    /**
     * @dev Submit the result of the off-chain computation and verify it on-chain.
     * @param requestId The ID of the off-chain computation request.
     * @param resultHash The hash of the computed result.
     * @return success Whether the verification succeeded.
     */
    function submitComputationResult(uint256 requestId, string memory resultHash)
        external
        onlyOwner
        nonReentrant
        returns (bool success)
    {
        OffchainComputationRequest storage request = requests[requestId];
        require(request.requestId == requestId, "Invalid request ID");
        require(!request.completed, "Computation already completed");

        // Store the result hash
        request.resultHash = resultHash;
        request.completed = true;

        emit ComputationCompleted(requestId, request.tokenId, resultHash, true);

        // Logic to verify the result (this can include ROFL off-chain verification)
        // This function would also provide the on-chain verification of the off-chain computation.

        return true;
    }

    /**
     * @dev Retrieve the details of a specific computation request.
     * @param requestId The ID of the off-chain computation request.
     * @return The details of the computation request.
     */
    function getComputationRequest(uint256 requestId)
        external
        view
        returns (OffchainComputationRequest memory)
    {
        return requests[requestId];
    }
}
