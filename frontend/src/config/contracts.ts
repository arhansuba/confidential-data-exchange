import { Address } from 'viem';

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