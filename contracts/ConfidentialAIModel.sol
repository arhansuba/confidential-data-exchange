// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ConfidentialAIModel is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;

    // Mapping from token ID to encrypted AI model URI (Confidential Data URI)
    mapping(uint256 => string) private _encryptedModels;

    // Event emitted when a new AI model is minted
    event ModelTokenized(uint256 indexed tokenId, address indexed owner, string tokenURI);

    // Event emitted when an AI model is purchased
    event ModelPurchased(uint256 indexed tokenId, address indexed buyer);

    constructor() ERC721("ConfidentialAIModel", "CAIM") {}

    /**
     * @dev Tokenize an AI model or dataset.
     * @param modelURI The metadata URI (off-chain) of the model.
     * @param encryptedModelURI The URI of the encrypted AI model or dataset (off-chain storage).
     * @return tokenId The ID of the tokenized AI model.
     */
    function tokenizeModel(string memory modelURI, string memory encryptedModelURI)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        _tokenIds.increment();
        tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);  // Mint NFT to the owner
        _setTokenURI(tokenId, modelURI);  // Set metadata URI (e.g., description, creator info)
        _encryptedModels[tokenId] = encryptedModelURI;  // Store encrypted model data

        emit ModelTokenized(tokenId, msg.sender, modelURI);
    }

    /**
     * @dev Purchase an AI model by transferring the NFT.
     * @param tokenId The ID of the tokenized AI model to purchase.
     */
    function purchaseModel(uint256 tokenId) external payable nonReentrant {
        address owner = ownerOf(tokenId);

        require(msg.sender != owner, "Cannot purchase your own model");
        require(msg.value > 0, "Payment required to purchase model");

        // Transfer NFT to buyer and transfer payment to the owner
        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);

        emit ModelPurchased(tokenId, msg.sender);
    }

    /**
     * @dev Retrieve the encrypted AI model URI for a token ID.
     * Only the token owner can access the encrypted model.
     * @param tokenId The ID of the tokenized AI model.
     * @return The encrypted AI model URI (e.g., IPFS link).
     */
    function getEncryptedModel(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "You do not own this token");

        return _encryptedModels[tokenId];  // Return the encrypted model URI
    }

    /**
     * @dev Withdraw contract funds (in case of accumulated payments).
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(owner()).transfer(balance);
    }
}
