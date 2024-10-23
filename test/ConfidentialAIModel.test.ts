import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialAIModel", function () {
    let ConfidentialAIModel: any;
    let confidentialAIModel: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        ConfidentialAIModel = await ethers.getContractFactory("ConfidentialAIModel");
        [owner, addr1] = await ethers.getSigners();

        // Deploy the contract before each test
        confidentialAIModel = await ConfidentialAIModel.deploy();
        await confidentialAIModel.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await confidentialAIModel.owner()).to.equal(owner.address);
        });

        it("Should have the correct initial state", async function () {
            const modelCount = await confidentialAIModel.modelCount();
            expect(modelCount).to.equal(0);
        });
    });

    describe("Minting Models", function () {
        const modelName = "AI Model 1";
        const modelURI = "https://example.com/model1";

        it("Should mint a new model NFT", async function () {
            await confidentialAIModel.mintModel(modelName, modelURI);
            const model = await confidentialAIModel.models(1); // model ID starts from 1
            expect(model.name).to.equal(modelName);
            expect(model.uri).to.equal(modelURI);
        });

        it("Should update model count after minting", async function () {
            await confidentialAIModel.mintModel(modelName, modelURI);
            const modelCount = await confidentialAIModel.modelCount();
            expect(modelCount).to.equal(1);
        });

        it("Should assign the correct owner to the minted model", async function () {
            await confidentialAIModel.mintModel(modelName, modelURI);
            const modelOwner = await confidentialAIModel.ownerOf(1); // model ID starts from 1
            expect(modelOwner).to.equal(owner.address);
        });

        it("Should revert when minting an empty model name", async function () {
            await expect(confidentialAIModel.mintModel("", modelURI)).to.be.revertedWith("Model name cannot be empty");
        });
    });
});
