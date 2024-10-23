import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    // Load deployed contract addresses from addresses.json
    const addresses = JSON.parse(fs.readFileSync("./scripts/addresses.json", "utf-8"));

    // Connect to the deployed contracts
    const ConfidentialAIModel = await ethers.getContractAt("ConfidentialAIModel", addresses.ConfidentialAIModel);
    const NFTMarketplace = await ethers.getContractAt("NFTMarketplace", addresses.NFTMarketplace);
    const ROFLIntegration = await ethers.getContractAt("ROFLIntegration", addresses.ROFLIntegration);

    // Example interactions
    // 1. Mint a new AI model
    async function mintAIModel(name: string, metadataURI: string) {
        const tx = await ConfidentialAIModel.mintAIModel(name, metadataURI);
        await tx.wait();
        console.log(`Minted AI model: ${name}`);
    }

    // 2. List an AI model on the marketplace
    async function listModelOnMarketplace(modelId: number, price: string) {
        const tx = await NFTMarketplace.listModel(modelId, price);
        await tx.wait();
        console.log(`Listed model ID ${modelId} on the marketplace for ${price} tokens`);
    }

    // 3. Purchase a model from the marketplace
    async function purchaseModel(modelId: number) {
        const tx = await NFTMarketplace.purchaseModel(modelId);
        await tx.wait();
        console.log(`Purchased model ID ${modelId}`);
    }

    // 4. Offchain interaction with ROFL
    async function evaluateModel(modelId: number, inputData: any) {
        const tx = await ROFLIntegration.evaluateModel(modelId, inputData);
        await tx.wait();
        console.log(`Evaluated model ID ${modelId} with input data: ${inputData}`);
    }

    // Uncomment to call the functions with actual parameters
    // await mintAIModel("AI Model 1", "https://metadata-uri.com/model1");
    // await listModelOnMarketplace(1, ethers.utils.parseUnits("10", "ether")); // Price set to 10 tokens
    // await purchaseModel(1);
    // await evaluateModel(1, { key: "value" }); // Replace with actual input data

}

// Execute the main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
