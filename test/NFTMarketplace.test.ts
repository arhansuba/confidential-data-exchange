import { expect } from "chai";
import Web3 from "web3";
import { abi as ConfidentialAIModelABI } from "../artifacts/ConfidentialAIModel.json";
import { abi as NFTMarketplaceABI } from "../artifacts/NFTMarketplace.json";

const web3 = new Web3("http://127.0.0.1:8545"); // Connect to your local Ethereum node

describe("NFTMarketplace", function () {
    let nftMarketplace: any;
    let confidentialAIModel: any;
    let accounts: string[];
    
    const modelName = "AI Model 1";
    const modelURI = "https://example.com/model1";
    
    before(async function () {
        accounts = await web3.eth.getAccounts(); // Fetch accounts
        // Deploy ConfidentialAIModel
        const ConfidentialAIModelContract = new web3.eth.Contract(ConfidentialAIModelABI);
        confidentialAIModel = await ConfidentialAIModelContract
            .deploy({ data: ConfidentialAIModelABI.bytecode })
            .send({ from: accounts[0], gas: "5000000" });
        
        // Mint a model NFT
        await confidentialAIModel.methods.mintModel(modelName, modelURI).send({ from: accounts[0] });
        
        // Deploy NFTMarketplace
        const NFTMarketplaceContract = new web3.eth.Contract(NFTMarketplaceABI);
        nftMarketplace = await NFTMarketplaceContract
            .deploy({ data: NFTMarketplaceABI.bytecode, arguments: [confidentialAIModel.options.address] })
            .send({ from: accounts[0], gas: "5000000" });
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const owner = await nftMarketplace.methods.owner().call();
            expect(owner).to.equal(accounts[0]);
        });
    });

    describe("Listing NFTs", function () {
        it("Should list an NFT for sale", async function () {
            await confidentialAIModel.methods.approve(nftMarketplace.options.address, 1).send({ from: accounts[0] }); // Approve the marketplace to manage the NFT
            await nftMarketplace.methods.listNFT(1, web3.utils.toWei("1", "ether")).send({ from: accounts[0] }); // List for 1 Ether

            const listing = await nftMarketplace.methods.listings(1).call();
            expect(listing[0]).to.equal(web3.utils.toWei("1", "ether")); // Check price
            expect(listing[1]).to.equal(accounts[0]); // Check seller
            expect(listing[2]).to.equal(true); // Check if listed
        });

        it("Should revert if the NFT is not owned by the seller", async function () {
            await expect(
                nftMarketplace.methods.listNFT(1, web3.utils.toWei("1", "ether")).send({ from: accounts[1] })
            ).to.be.rejectedWith("You do not own this NFT");
        });
    });

    describe("Purchasing NFTs", function () {
        beforeEach(async function () {
            await confidentialAIModel.methods.approve(nftMarketplace.options.address, 1).send({ from: accounts[0] }); // Approve the marketplace to manage the NFT
            await nftMarketplace.methods.listNFT(1, web3.utils.toWei("1", "ether")).send({ from: accounts[0] }); // List for 1 Ether
        });

        it("Should allow a user to purchase an NFT", async function () {
            const initialBalance = await web3.eth.getBalance(accounts[1]);
            await nftMarketplace.methods.purchaseNFT(1).send({ from: accounts[1], value: web3.utils.toWei("1", "ether") });

            const newOwner = await confidentialAIModel.methods.ownerOf(1).call();
            expect(newOwner).to.equal(accounts[1]);

            const finalBalance = await web3.eth.getBalance(accounts[1]);
            const balanceDiff = initialBalance - finalBalance;
            expect(balanceDiff).to.be.closeTo(web3.utils.toWei("1", "ether"), web3.utils.toWei("0.01", "ether")); // Check balance difference
        });

        it("Should revert if the price is not met", async function () {
            await expect(
                nftMarketplace.methods.purchaseNFT(1).send({ from: accounts[1], value: web3.utils.toWei("0.5", "ether") })
            ).to.be.rejectedWith("Insufficient payment");
        });

        it("Should revert if the NFT is not listed", async function () {
            await nftMarketplace.methods.unlistNFT(1).send({ from: accounts[0] }); // Unlist the NFT
            await expect(
                nftMarketplace.methods.purchaseNFT(1).send({ from: accounts[1], value: web3.utils.toWei("1", "ether") })
            ).to.be.rejectedWith("NFT is not listed for sale");
        });
    });
});
