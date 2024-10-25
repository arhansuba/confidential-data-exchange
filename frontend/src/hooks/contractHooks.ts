import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { 
  parseEther, 
  formatEther, 
  keccak256, 
  toHex, 
  fromHex,
  encodeFunctionData,
  type Address 
} from 'viem';
import { useToast } from '@/hooks/use-toast';

// Contract address should be properly typed as Address
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

// Typed contract ABI
const CONTRACT_ABI = [
  {
    inputs: [],
    name: 'getModelCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'getModel',
    outputs: [{
      components: [
        { name: 'owner', type: 'address' },
        { name: 'modelHash', type: 'bytes32' },
        { name: 'encryptedMetadata', type: 'bytes' },
        { name: 'accessKeyHash', type: 'bytes32' },
        { name: 'price', type: 'uint256' },
        { name: 'isActive', type: 'bool' }
      ],
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'getAccessKey',
    outputs: [{ type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  }
] as const;

// Define proper types for model data
interface ModelData {
  owner: Address;
  modelHash: `0x${string}`;
  encryptedMetadata: `0x${string}`;
  accessKeyHash: `0x${string}`;
  price: bigint;
  isActive: boolean;
}

export interface Model extends ModelData {
  id: number;
  decryptedMetadata?: {
    name: string;
    description: string;
    architecture: string;
  };
}

export const useContractIntegration = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load models from the contract
  const loadModels = useCallback(async () => {
    if (!publicClient || !address) return;

    try {
      setLoading(true);
      
      const modelCount = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getModelCount',
      }) as bigint;

      const modelPromises = Array.from({ length: Number(modelCount) }, async (_, index) => {
        const modelData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getModel',
          args: [BigInt(index)],
        }) as ModelData;

        let decryptedMetadata;
        try {
          const accessKey = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getAccessKey',
            args: [BigInt(index)],
          }) as `0x${string}`;
          
          if (accessKey && accessKey !== '0x') {
            decryptedMetadata = await decryptModelMetadata(modelData.encryptedMetadata, accessKey);
          }
        } catch (err) {
          // No access to this model, metadata remains encrypted
        }

        return {
          id: index,
          ...modelData,
          decryptedMetadata
        };
      });

      const loadedModels = await Promise.all(modelPromises);
      setModels(loadedModels);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading models';
      setError(message);
      toast({
        title: "Error Loading Models",
        description: message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [publicClient, address, toast]);

  // List a new model
  const listModel = async (
    modelFile: File,
    metadata: {
      name: string;
      description: string;
      architecture: string;
    },
    price: string
  ) => {
    if (!walletClient || !address) return;

    try {
      setLoading(true);
      
      const modelHash = await generateModelHash(modelFile);
      const { publicKey, privateKey } = await generateEncryptionKeys();
      const encryptedMetadata = await encryptMetadata(metadata, publicKey);
      const accessKeyHash = keccak256(toHex(publicKey));
      const priceWei = parseEther(price);

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'listModel',
        args: [modelHash, encryptedMetadata, accessKeyHash, priceWei],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast({
        title: "Model Listed",
        description: "Your model has been successfully listed on the marketplace",
      });

      await loadModels();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error listing model';
      setError(message);
      toast({
        title: "Listing Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Purchase model access
  const purchaseModel = async (modelId: number, price: bigint) => {
    if (!walletClient || !address || !publicClient) return;

    try {
      setLoading(true);

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'purchaseModel',
        args: [BigInt(modelId)],
        value: price,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Purchase Successful",
        description: "You now have access to this model",
      });

      await loadModels();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error purchasing model';
      setError(message);
      toast({
        title: "Purchase Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update model price
  const updateModelPrice = async (modelId: number, newPrice: string) => {
    if (!walletClient || !address || !publicClient) return;

    try {
      setLoading(true);

      const priceWei = parseEther(newPrice);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'updatePrice',
        args: [BigInt(modelId), priceWei],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Price Updated",
        description: "Model price has been successfully updated",
      });

      await loadModels();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error updating price';
      setError(message);
      toast({
        title: "Update Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && publicClient) {
      loadModels();
    }
  }, [address, publicClient, loadModels]);

  return {
    models,
    loading,
    error,
    listModel,
    purchaseModel,
    updateModelPrice,
    loadModels,
  };
};

// Utility functions with proper typing
const generateModelHash = async (file: File): Promise<`0x${string}`> => {
  const buffer = await file.arrayBuffer();
  return keccak256(toHex(new Uint8Array(buffer)));
};

const generateEncryptionKeys = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // Implementation would use the Sapphire library's encryption capabilities
  return {
    publicKey: "placeholder-public-key",
    privateKey: "placeholder-private-key"
  };
};

const encryptMetadata = async (
  metadata: any,
  publicKey: string
): Promise<`0x${string}`> => {
  // Implementation would use the Sapphire library's encryption capabilities
  return toHex(new TextEncoder().encode(JSON.stringify(metadata))) as `0x${string}`;
};

const decryptModelMetadata = async (
  encryptedMetadata: `0x${string}`,
  accessKey: `0x${string}`
): Promise<any> => {
  // Implementation would use the Sapphire library's decryption capabilities
  const decoder = new TextDecoder();
  const decrypted = decoder.decode(fromHex(encryptedMetadata, 'bytes'));
  return JSON.parse(decrypted);
};

export default useContractIntegration;