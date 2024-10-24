// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Sapphire.sol";

/**
 * @title ConfidentialAIModel
 * @notice Enables secure exchange of AI models with encrypted metadata and access control
 */
contract ConfidentialAIModel {
    struct Model {
        address owner;
        bytes32 modelHash;
        bytes encryptedMetadata;
        bytes32 accessKeyHash;
        uint256 price;
        bool isActive;
    }

    // Mapping from model ID to Model struct
    mapping(uint256 => Model) private models;
    // Mapping from model ID to user address to access key
    mapping(uint256 => mapping(address => bytes)) private accessKeys;
    uint256 private nextModelId;

    event ModelListed(uint256 indexed modelId, address indexed owner, uint256 price);
    event ModelPurchased(uint256 indexed modelId, address indexed buyer);
    event ModelAccessGranted(uint256 indexed modelId, address indexed user);

    constructor() {
        nextModelId = 1;
    }

    /**
     * @notice List a new AI model with encrypted metadata
     * @param modelHash Hash of the model file
     * @param encryptedMetadata Encrypted model metadata (description, architecture, etc.)
     * @param accessKeyHash Hash of the access key for the model
     * @param price Price in native tokens
     */
    function listModel(
        bytes32 modelHash,
        bytes calldata encryptedMetadata,
        bytes32 accessKeyHash,
        uint256 price
    ) external {
        // Generate random nonce for encryption
        bytes memory nonce = Sapphire.randomBytes(32, "model_listing");
        
        // Create new model entry
        models[nextModelId] = Model({
            owner: msg.sender,
            modelHash: modelHash,
            encryptedMetadata: encryptedMetadata,
            accessKeyHash: accessKeyHash,
            price: price,
            isActive: true
        });

        emit ModelListed(nextModelId, msg.sender, price);
        nextModelId++;
    }

    /**
     * @notice Purchase access to a model
     * @param modelId ID of the model to purchase
     */
    function purchaseModel(uint256 modelId) external payable {
        Model storage model = models[modelId];
        require(model.isActive, "Model not available");
        require(msg.value >= model.price, "Insufficient payment");
        require(accessKeys[modelId][msg.sender].length == 0, "Already purchased");

        // Transfer payment to model owner
        payable(model.owner).transfer(msg.value);

        emit ModelPurchased(modelId, msg.sender);
    }

    /**
     * @notice Grant access to a purchased model
     * @param modelId ID of the model
     * @param buyer Address of the buyer
     * @param encryptedAccessKey Encrypted access key for the buyer
     */
    function grantAccess(
        uint256 modelId,
        address buyer,
        bytes calldata encryptedAccessKey
    ) external {
        Model storage model = models[modelId];
        require(msg.sender == model.owner, "Not model owner");
        require(accessKeys[modelId][buyer].length == 0, "Access already granted");

        // Store encrypted access key for the buyer
        accessKeys[modelId][buyer] = encryptedAccessKey;

        emit ModelAccessGranted(modelId, buyer);
    }

    /**
     * @notice Get encrypted access key for a purchased model
     * @param modelId ID of the model
     * @return encryptedKey Encrypted access key
     */
    function getAccessKey(uint256 modelId) external view returns (bytes memory) {
        require(accessKeys[modelId][msg.sender].length > 0, "No access");
        return accessKeys[modelId][msg.sender];
    }

    /**
     * @notice Get model details
     * @param modelId ID of the model
     * @return Model struct containing model details
     */
    function getModel(uint256 modelId) external view returns (Model memory) {
        return models[modelId];
    }

    /**
     * @notice Update model price
     * @param modelId ID of the model
     * @param newPrice New price in native tokens
     */
    function updatePrice(uint256 modelId, uint256 newPrice) external {
        require(models[modelId].owner == msg.sender, "Not model owner");
        models[modelId].price = newPrice;
    }

    /**
     * @notice Deactivate model listing
     * @param modelId ID of the model
     */
    function deactivateModel(uint256 modelId) external {
        require(models[modelId].owner == msg.sender, "Not model owner");
        models[modelId].isActive = false;
    }
}