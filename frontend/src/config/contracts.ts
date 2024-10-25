import { Address } from 'viem';


export const MARKETPLACE_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
export const OCEAN_COMPUTE_ADDRESS = '0x0987654321098765432109876543210987654321' as const;

export const MARKETPLACE_ABI = [
  {
    inputs: [],
    name: 'getModelCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    name: 'getModels',
    outputs: [{
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'uint256' },
        { name: 'hasComputeService', type: 'bool' },
        { name: 'accessType', type: 'string' },
        { name: 'computeCount', type: 'uint256' },
        { name: 'hasAccess', type: 'bool' },
        { name: 'oceanDataToken', type: 'address' },
        { name: 'algorithmToken', type: 'address' }
      ],
      type: 'tuple[]'
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getComputeJobs',
    outputs: [{
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'modelName', type: 'string' },
        { name: 'status', type: 'uint8' },
        { name: 'progress', type: 'uint8' },
        { name: 'timestamp', type: 'uint256' }
      ],
      type: 'tuple[]'
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'modelId', type: 'uint256' }],
    name: 'purchaseModelAccess',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  }
] as const;

export const OCEAN_COMPUTE_ABI = [
  {
    inputs: [
      { name: 'modelId', type: 'uint256' },
      { name: 'dataToken', type: 'address' },
      { name: 'algorithmToken', type: 'address' }
    ],
    name: 'startCompute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  }
] as const;
interface ContractConfig {
  address: Address;
  abi: readonly [...any[]];
}

export const marketplaceConfig = {
  address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address,
  abi: [] as const, // Your ABI here
} as const;

export const oceanComputeConfig = {
  address: process.env.NEXT_PUBLIC_OCEAN_COMPUTE_ADDRESS as Address,
  abi: [] as const, // Your ABI here
} as const;