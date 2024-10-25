import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@oasisprotocol/sapphire-hardhat";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  networks: {
    // Sapphire Testnet
    "sapphire-testnet": {
      url: "https://testnet.sapphire.oasis.dev",
      chainId: 0x5aff,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Sapphire Mainnet
    "sapphire": {
      url: "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      "sapphire-testnet": process.env.SAPPHIRE_API_KEY || "",
      "sapphire": process.env.SAPPHIRE_API_KEY || "",
    },
    customChains: [
      {
        network: "sapphire-testnet",
        chainId: 0x5aff,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev",
        },
      },
      {
        network: "sapphire",
        chainId: 0x5afe,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.dev/api",
          browserURL: "https://explorer.sapphire.oasis.dev",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;