
# Confidential Data Exchange 🔒

A decentralized platform for secure AI model and dataset trading with confidential computation capabilities.

## Overview

The "Confidential Data Exchange" platform addresses the critical need for privacy-preserving data sharing and computation in the AI/ML ecosystem. Built on Oasis Sapphire's confidential EVM and integrated with Ocean Protocol, this platform enables:

### Key Features

- **🔐 Confidential Data Sharing**
  - Secure trading of AI models and datasets
  - End-to-end encryption for sensitive data
  - Access control through blockchain-based authentication

- **🎨 NFT-Based Asset Tokenization**
  - Tokenize AI models and datasets as NFTs
  - Transparent ownership verification
  - Maintain confidentiality of underlying assets

- **⚡ Compute-to-Data**
  - Perform computations on encrypted data
  - Ocean Protocol integration for secure data access
  - ROFL-powered off-chain computation

## Technology Stack

- **Blockchain**
  - Oasis Sapphire (Confidential EVM)
  - Ocean Protocol
  - ROFL Framework

- **Frontend**
  - Next.js
  - TypeScript
  - TailwindCSS
  - shadcn/ui

- **Smart Contracts**
  - Solidity
  - Hardhat
  - OpenZeppelin

## Getting Started

### Prerequisites

```bash
# Required
Node.js >= 18
npm >= 9
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/arhansuba/confidential-data-exchange.git
cd confidential-data-exchange
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Set up environment variables
```bash
# Root directory
cp .env.example .env

# Frontend directory
cd frontend
cp .env.example .env.local
```

### Development

1. Compile contracts
```bash
npx hardhat compile
```

2. Run tests
```bash
npx hardhat test
```

3. Start frontend development server
```bash
cd frontend
npm run dev
```

### Deployment

1. Deploy contracts
```bash
# Deploy to Sapphire testnet
npx hardhat run scripts/deploy.ts --network sapphire_testnet

# Verify contracts
npx hardhat verify --network sapphire_testnet <CONTRACT_ADDRESS>
```

2. Deploy frontend
```bash
cd frontend
npm run build
npm run start
```

## Architecture

### Smart Contracts

- `ConfidentialAIModel.sol`: Manages AI model listings and access control
- `NFTMarketplace.sol`: Handles NFT tokenization and trading
- `ROFLIntegration.sol`: Off-chain computation coordination
- `OceanProtocol.sol`: Ocean Protocol integration for compute-to-data

### Frontend Components

- `Marketplace.tsx`: Main trading interface
- `ModelCard.tsx`: AI model display component
- `ComputeJob.tsx`: Computation management
- `DatasetPublisher.tsx`: Dataset publishing interface

## Security

- End-to-end encryption for all sensitive data
- TEE verification for compute jobs
- Access control through smart contracts
- Regular security audits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Oasis Network](https://oasisprotocol.org/)
- [Ocean Protocol](https://oceanprotocol.com/)
- [shadcn/ui](https://ui.shadcn.com/)

