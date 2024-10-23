// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is Ownable, ReentrancyGuard {
    struct Listing {
        uint256 tokenId;          // ID of the NFT
        address seller;           // Address of the seller
        uint256 price;            // Price of the NFT
        bool isListed;            // Status of the listing
    }

    // Mapping to keep track of listings
    mapping(uint256 => Listing) public listings;

    // Event emitted when a new NFT is listed for sale
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);

    // Event emitted when an NFT is sold
    event NFTSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);

    // Event emitted when an NFT listing is canceled
    event NFTListingCanceled(uint256 indexed tokenId, address indexed seller);

    // Reference to the ERC721 token contract
    IERC721 public nftContract;

    constructor(address _nftContract) {
        nftContract = IERC721(_nftContract);
    }

    /**
     * @dev List an NFT for sale on the marketplace.
     * @param tokenId The ID of the NFT to be listed.
     * @param price The sale price of the NFT.
     */
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be greater than zero");
        require(nftContract.ownerOf(tokenId) == msg.sender, "You do not own this NFT");
        require(!listings[tokenId].isListed, "NFT is already listed");

        // Transfer the NFT to the marketplace
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        // Create a new listing
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isListed: true
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Buy an NFT from the marketplace.
     * @param tokenId The ID of the NFT to purchase.
     */
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isListed, "NFT is not listed for sale");
        require(msg.value >= listing.price, "Insufficient funds sent");

        // Transfer funds to the seller
        payable(listing.seller).transfer(listing.price);

        // Transfer the NFT to the buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        // Mark the listing as no longer active
        listing.isListed = false;

        emit NFTSold(tokenId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @dev Cancel the listing of an NFT.
     * @param tokenId The ID of the NFT to cancel the listing for.
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isListed, "NFT is not listed for sale");
        require(msg.sender == listing.seller, "You are not the seller");

        // Transfer the NFT back to the seller
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        // Mark the listing as canceled
        listing.isListed = false;

        emit NFTListingCanceled(tokenId, msg.sender);
    }

    /**
     * @dev Retrieve the details of a specific NFT listing.
     * @param tokenId The ID of the NFT to retrieve the listing for.
     * @return The details of the NFT listing.
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @dev Update the price of a listed NFT.
     * @param tokenId The ID of the NFT to update.
     * @param newPrice The new price for the NFT.
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.isListed, "NFT is not listed for sale");
        require(msg.sender == listing.seller, "You are not the seller");
        require(newPrice > 0, "Price must be greater than zero");

        // Update the price
        listing.price = newPrice;
    }
}
