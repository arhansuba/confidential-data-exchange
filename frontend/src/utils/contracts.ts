import { type Config } from 'wagmi';
import { type PublicClient, type WalletClient } from 'viem';

export function getContractParameters<
  TAbi extends readonly unknown[],
  TFunctionName extends string,
>(config: {
  address: `0x${string}`;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  chainId?: number;
  account?: `0x${string}`;
}) {
  return {
    ...config,
    parameters: {
      address: config.address,
      abi: config.abi,
      functionName: config.functionName,
      args: config.args || [],
      chainId: config.chainId,
      account: config.account,
    },
  };
}