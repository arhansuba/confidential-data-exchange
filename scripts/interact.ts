import { ethers } from "hardhat";
import * as fs from "fs";
import { parseEther } from "ethers";
import type { Contract } from "ethers";

async function main() {
    // Load deployed contract addresses from addresses.json
    const addresses = JSON.parse(fs.readFileSync("./scripts/addresses.json", "utf-8"));

    // Get the Contract Factories first
    const confidentialAIModel = await ethers.getContractFactory("ConfidentialAIModel");
    const nftMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const roflIntegration = await ethers.getContractFactory("ROFLIntegration");

    // Connect to the deployed contracts with type assertions
    const ConfidentialAIModel = confidentialAIModel.attach(addresses.ConfidentialAIModel) as unknown as Contract;
    const NFTMarketplace = nftMarketplace.attach(addresses.NFTMarketplace) as unknown as Contract;
    const ROFLIntegration = roflIntegration.attach(addresses.ROFLIntegration) as unknown as Contract;

    // Example interactions with any function
    async function mintAIModel(name: string, metadataURI: string) {
        // Replace functionName with actual function name from your contract
        const tx = await ConfidentialAIModel['functionName'](name, metadataURI);
        await tx.wait();
        console.log(`Minted AI model: ${name}`);
    }

    async function listModelOnMarketplace(modelId: number, price: string) {
        // Replace functionName with actual function name from your contract
        const tx = await NFTMarketplace['functionName'](modelId, price);
        await tx.wait();
        console.log(`Listed model ID ${modelId} on the marketplace for ${price} tokens`);
    }

    async function purchaseModel(modelId: number) {
        // Replace functionName with actual function name from your contract
        const tx = await NFTMarketplace['functionName'](modelId);
        await tx.wait();
        console.log(`Purchased model ID ${modelId}`);
    }

    async function evaluateModel(modelId: number, inputData: any) {
        // Replace functionName with actual function name from your contract
        const tx = await ROFLIntegration['functionName'](modelId, inputData);
        await tx.wait();
        console.log(`Evaluated model ID ${modelId} with input data:`, inputData);
    }

    // Example usage
    try {
        await mintAIModel("AI Model 1", "https://metadata-uri.com/model1");
        await listModelOnMarketplace(1, parseEther("10").toString());
        await purchaseModel(1);
        await evaluateModel(1, { key: "value" });
    } catch (error) {
        console.error("Error during interaction:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });