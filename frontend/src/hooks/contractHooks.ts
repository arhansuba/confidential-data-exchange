// contractHooks.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

// Contract ABI - you would typically import this from a separate file
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
const CONTRACT_ABI = [
  "function listModel(bytes32 modelHash, bytes calldata encryptedMetadata, bytes32 accessKeyHash, uint256 price) external",
  "function purchaseModel(uint256 modelId) external payable",
  "function grantAccess(uint256 modelId, address buyer, bytes calldata encryptedAccessKey) external",
  "function getAccessKey(uint256 modelId) external view returns (bytes memory)",
  "function getModel(uint256 modelId) external view returns (tuple(address owner, bytes32 modelHash, bytes encryptedMetadata, bytes32 accessKeyHash, uint256 price, bool isActive))",
  "function updatePrice(uint256 modelId, uint256 newPrice) external",
  "function deactivateModel(uint256 modelId) external",
  "event ModelListed(uint256 indexed modelId, address indexed owner, uint256 price)",
  "event ModelPurchased(uint256 indexed modelId, address indexed buyer)",
  "event ModelAccessGranted(uint256 indexed modelId, address indexed user)"
];

export interface Model {
  id: number;
  owner: string;
  modelHash: string;
  encryptedMetadata: string;
  accessKeyHash: string;
  price: ethers.BigNumber;
  isActive: boolean;
  decryptedMetadata?: {
    name: string;
    description: string;
    architecture: string;
  };
}

export const useContractIntegration = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize contract and web3 connection
  const initializeContract = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setSigner(signer);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        setContract(contract);

        // Listen for network changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

        // Listen for account changes
        window.ethereum.on('accountsChanged', () => {
          window.location.reload();
        });
      } else {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: "Connection Error",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load models from the contract
  const loadModels = useCallback(async () => {
    if (!contract) return;

    try {
      setLoading(true);
      
      // We'll assume there's a way to get the total number of models
      // You might need to adjust this based on your contract implementation
      const modelIds = await contract.getModelIds(); // Implement this method in your contract
      
      const modelPromises = modelIds.map(async (id: number) => {
        const modelData = await contract.getModel(id);
        
        // Decrypt metadata if we have access
        let decryptedMetadata;
        try {
          const accessKey = await contract.getAccessKey(id);
          if (accessKey) {
            decryptedMetadata = await decryptModelMetadata(modelData.encryptedMetadata, accessKey);
          }
        } catch (err) {
          // No access to this model, metadata remains encrypted
        }

        return {
          id,
          owner: modelData.owner,
          modelHash: modelData.modelHash,
          encryptedMetadata: modelData.encryptedMetadata,
          accessKeyHash: modelData.accessKeyHash,
          price: modelData.price,
          isActive: modelData.isActive,
          decryptedMetadata
        };
      });

      const loadedModels = await Promise.all(modelPromises);
      setModels(loadedModels);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error Loading Models",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [contract, toast]);

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
    if (!contract || !signer) return;

    try {
      setLoading(true);
      
      // Generate model hash
      const modelHash = await generateModelHash(modelFile);
      
      // Generate encryption keys
      const { publicKey, privateKey } = await generateEncryptionKeys();
      
      // Encrypt metadata
      const encryptedMetadata = await encryptMetadata(metadata, publicKey);
      
      // Calculate access key hash
      const accessKeyHash = ethers.utils.keccak256(publicKey);
      
      // Convert price to wei
      const priceWei = ethers.utils.parseEther(price);

      // List model on contract
      const tx = await contract.listModel(
        modelHash,
        encryptedMetadata,
        accessKeyHash,
        priceWei
      );

      await tx.wait();

      toast({
        title: "Model Listed",
        description: "Your model has been successfully listed on the marketplace",
      });

      // Reload models
      await loadModels();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Listing Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Purchase model access
  const purchaseModel = async (modelId: number, price: ethers.BigNumber) => {
    if (!contract || !signer) return;

    try {
      setLoading(true);

      const tx = await contract.purchaseModel(modelId, {
        value: price
      });

      await tx.wait();

      toast({
        title: "Purchase Successful",
        description: "You now have access to this model",
      });

      // Reload models to get updated access
      await loadModels();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Purchase Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update model price
  const updateModelPrice = async (modelId: number, newPrice: string) => {
    if (!contract || !signer) return;

    try {
      setLoading(true);

      const priceWei = ethers.utils.parseEther(newPrice);
      const tx = await contract.updatePrice(modelId, priceWei);
      await tx.wait();

      toast({
        title: "Price Updated",
        description: "Model price has been successfully updated",
      });

      await loadModels();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Update Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Deactivate model
  const deactivateModel = async (modelId: number) => {
    if (!contract || !signer) return;

    try {
      setLoading(true);

      const tx = await contract.deactivateModel(modelId);
      await tx.wait();

      toast({
        title: "Model Deactivated",
        description: "Model has been successfully deactivated",
      });

      await loadModels();
    } catch (err) {
      setError(err.message);
      toast({
        title: "Deactivation Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  // Load models when contract is initialized
  useEffect(() => {
    if (contract) {
      loadModels();
    }
  }, [contract, loadModels]);

  return {
    models,
    loading,
    error,
    listModel,
    purchaseModel,
    updateModelPrice,
    deactivateModel,
    loadModels,
  };
};

// Utility functions for encryption/decryption
const generateModelHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hash = ethers.utils.keccak256(new Uint8Array(buffer));
  return hash;
};

const generateEncryptionKeys = async () => {
  // Implementation would use the Sapphire library's encryption capabilities
  // This is a placeholder
  return {
    publicKey: "placeholder-public-key",
    privateKey: "placeholder-private-key"
  };
};

const encryptMetadata = async (
  metadata: any,
  publicKey: string
): Promise<string> => {
  // Implementation would use the Sapphire library's encryption capabilities
  // This is a placeholder
  return ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes(JSON.stringify(metadata))
  );
};

const decryptModelMetadata = async (
  encryptedMetadata: string,
  accessKey: string
): Promise<any> => {
  // Implementation would use the Sapphire library's decryption capabilities
  // This is a placeholder
  const decrypted = ethers.utils.toUtf8String(
    ethers.utils.arrayify(encryptedMetadata)
  );
  return JSON.parse(decrypted);
};

export default useContractIntegration;