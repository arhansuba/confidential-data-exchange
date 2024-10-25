import { ethers, network } from "hardhat";
import { verify } from "./verify";
import type { ConfidentialAIModel, NFTMarketplace, ROFLIntegration } from "../typechain-types";

async function main() {
  // Deploy ConfidentialAIModel
  const ConfidentialAIModel = await ethers.getContractFactory("ConfidentialAIModel");
  const confidentialAIModel = await ConfidentialAIModel.deploy();
  await confidentialAIModel.waitForDeployment();
  console.log(`ConfidentialAIModel deployed to: ${await confidentialAIModel.getAddress()}`);

  // Deploy NFTMarketplace
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy("0xYourNFTContractAddress");
  await nftMarketplace.waitForDeployment();
  console.log(`NFTMarketplace deployed to: ${await nftMarketplace.getAddress()}`);

  // Deploy ROFLIntegration
  const ROFLIntegration = await ethers.getContractFactory("ROFLIntegration");
  const roflIntegration = await ROFLIntegration.deploy();
  await roflIntegration.waitForDeployment();
  console.log(`ROFLIntegration deployed to: ${await roflIntegration.getAddress()}`);

  // Initialize contracts if needed
  // Example: await confidentialAIModel.initialize(...args);
  
  // Save deployed addresses
  const addresses = {
    confidentialAIModel: await confidentialAIModel.getAddress(),
    nftMarketplace: await nftMarketplace.getAddress(),
    roflIntegration: await roflIntegration.getAddress(),
  };

  // Save addresses to a file for frontend use
  const fs = require("fs");
  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );

  // Verify contracts if not on localhost
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("Verifying contracts...");
    
    // Add delay before verification
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    await verify(await confidentialAIModel.getAddress(), []);
    await verify(await nftMarketplace.getAddress(), []);
    await verify(await roflIntegration.getAddress(), []);
  }

  console.log("Deployment complete! Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });