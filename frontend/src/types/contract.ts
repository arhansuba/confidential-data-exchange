// types/contracts.ts
import { Address } from 'viem';

export interface ContractCallConfig<T extends (...args: any) => any> {
  address: Address;
  abi: any[];
  functionName: string;
  args: Parameters<T>;
}

export type ContractWriteConfig<T extends (...args: any) => any> = ContractCallConfig<T> & {
  value?: bigint;
};