import { type Address } from 'viem';

export const MARKETPLACE_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
export const OCEAN_COMPUTE_ADDRESS = '0x0987654321098765432109876543210987654321' as const;

export const MARKETPLACE_ABI = [{
  inputs: [],
  name: 'getModelCount',
  outputs: [{ type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}, {
  inputs: [{ type: 'uint256' }, { type: 'uint256' }],
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
}] as const;

export const OCEAN_COMPUTE_ABI = [{
  inputs: [
    { type: 'uint256' },
    { type: 'address' },
    { type: 'address' }
  ],
  name: 'startCompute',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
}] as const