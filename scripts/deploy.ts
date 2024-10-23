import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    // Get the contract factories
    const ConfidentialAIModel = await ethers.getContractFactory("ConfidentialAIModel");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const ROFLIntegration = await ethers.getContractFactory("ROFLIntegration");

    // Deploy ConfidentialAIModel
    const confidentialAIModel = await ConfidentialAIModel.deploy();
    await confidentialAIModel.deployed();
    console.log("ConfidentialAIModel deployed to:", confidentialAIModel.address);

    // Deploy NFTMarketplace
    const nftMarketplace = await NFTMarketplace.deploy(confidentialAIModel.address); // Pass the address of ConfidentialAIModel if needed
    await nftMarketplace.deployed();
    console.log("NFTMarketplace deployed to:", nftMarketplace.address);

    // Deploy ROFLIntegration
    const roflIntegration = await ROFLIntegration.deploy();
    await roflIntegration.deployed();
    console.log("ROFLIntegration deployed to:", roflIntegration.address);

    // Optionally, you can save the deployed addresses to a file or .env
    const addresses = {
        ConfidentialAIModel: confidentialAIModel.address,
        NFTMarketplace: nftMarketplace.address,
        ROFLIntegration: roflIntegration.address,
    };
    fs.writeFileSync("./scripts/addresses.json", JSON.stringify(addresses, null, 2));
}

// Execute the main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
