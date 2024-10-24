// oceanIntegration.ts
import { Provider } from '@oceanprotocol/lib';
import { ethers } from 'ethers';
import { Sapphire } from '@oasisprotocol/sapphire-hardhat';

interface ComputeJob {
  jobId: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  result?: any;
}

interface ComputeParams {
  algorithm: string;
  inputs: any[];
  environment: string;
}

export class OceanComputeService {
  private provider: Provider;
  private contract: ethers.Contract;
  private oceanProvider: string;

  constructor(
    web3Provider: ethers.providers.Web3Provider,
    contractAddress: string,
    oceanProviderUrl: string
  ) {
    this.provider = new Provider({
      web3Provider,
      aquarius: oceanProviderUrl + '/api/aquarius',
      providerUri: oceanProviderUrl
    });

    // Initialize contract
    this.contract = new ethers.Contract(
      contractAddress,
      [
        "function startCompute(address dataToken, address algorithmToken, bytes calldata encryptedParams) external returns (bytes32)",
        "function getComputeResult(bytes32 jobId) external view returns (bytes memory result, uint8 status)"
      ],
      web3Provider.getSigner()
    );

    this.oceanProvider = oceanProviderUrl;
  }

  /**
   * Start a compute-to-data job
   * @param datasetDid Ocean dataset DID
   * @param algorithmDid Ocean algorithm DID
   * @param params Compute parameters
   */
  async startComputeJob(
    datasetDid: string,
    algorithmDid: string,
    params: ComputeParams
  ): Promise<string> {
    try {
      // Get dataset DDO
      const dataset = await this.provider.getDDO(datasetDid);
      const algorithm = await this.provider.getDDO(algorithmDid);

      // Get compute service
      const computeService = dataset.findServiceByType('compute');
      if (!computeService) {
        throw new Error('Dataset does not support compute');
      }

      // Encrypt compute parameters using Sapphire
      const encryptedParams = await this.encryptComputeParams(params);

      // Start compute job
      const tx = await this.contract.startCompute(
        dataset.dataToken,
        algorithm.dataToken,
        encryptedParams
      );
      const receipt = await tx.wait();

      // Get job ID from events
      const event = receipt.events?.find(e => e.event === 'ComputeJobStarted');
      return event?.args?.jobId;
    } catch (error) {
      console.error('Failed to start compute job:', error);
      throw error;
    }
  }

  /**
   * Check status of compute job
   * @param jobId Compute job ID
   */
  async checkComputeStatus(jobId: string): Promise<ComputeJob> {
    try {
      const [result, status] = await this.contract.getComputeResult(jobId);

      if (status === 2) { // Completed
        const decryptedResult = await this.decryptComputeResult(result);
        return {
          jobId,
          status: 'Completed',
          result: decryptedResult
        };
      }

      return {
        jobId,
        status: this.mapStatus(status)
      };
    } catch (error) {
      console.error('Failed to check compute status:', error);
      throw error;
    }
  }

  /**
   * Get compute allowance for user
   * @param dataToken Ocean data token address
   * @param user User address
   */
  async getComputeAllowance(
    dataToken: string,
    user: string
  ): Promise<number> {
    return await this.contract.computeAllowance(dataToken, user);
  }

  /**
   * Encrypt compute parameters
   * @param params Compute parameters
   */
  private async encryptComputeParams(params: ComputeParams): Promise<string> {
    // Generate random key for encryption
    const key = await Sapphire.randomBytes(32, "compute_params");
    
    // Encrypt parameters
    const nonce = ethers.utils.randomBytes(12);
    const encryptedData = await Sapphire.encrypt(
      key,
      ethers.utils.hexlify(nonce),
      ethers.utils.toUtf8Bytes(JSON.stringify(params)),
      new Uint8Array()
    );

    return ethers.utils.hexlify(encryptedData);
  }

  /**
   * Decrypt compute results
   * @param encryptedResult Encrypted computation result
   */
  private async decryptComputeResult(encryptedResult: string): Promise<any> {
    try {
      const key = await this.getResultDecryptionKey();
      const decryptedData = await Sapphire.decrypt(
        key,
        ethers.utils.arrayify(encryptedResult)
      );

      return JSON.parse(ethers.utils.toUtf8String(decryptedData));
    } catch (error) {
      console.error('Failed to decrypt result:', error);
      throw error;
    }
  }

  /**
   * Map numeric status to string
   * @param status Numeric status from contract
   */
  private mapStatus(status: number): ComputeJob['status'] {
    const statusMap = {
      0: 'Pending',
      1: 'Processing',
      2: 'Completed',
      3: 'Failed'
    };
    return statusMap[status] as ComputeJob['status'];
  }

  /**
   * Get decryption key for results
   */
  private async getResultDecryptionKey(): Promise<string> {
    // Implementation would get key from secure storage or generate from seed
    const key = await Sapphire.randomBytes(32, "result_key");
    return ethers.utils.hexlify(key);
  }
}

// Hook for React components
export function useOceanCompute(
  web3Provider: ethers.providers.Web3Provider,
  contractAddress: string,
  oceanProviderUrl: string
) {
  const [computeService] = React.useState(
    () => new OceanComputeService(web3Provider, contractAddress, oceanProviderUrl)
  );

  const startCompute = React.useCallback(
    async (datasetDid: string, algorithmDid: string, params: ComputeParams) => {
      return await computeService.startComputeJob(datasetDid, algorithmDid, params);
    },
    [computeService]
  );

  const checkStatus = React.useCallback(
    async (jobId: string) => {
      return await computeService.checkComputeStatus(jobId);
    },
    [computeService]
  );

  const getAllowance = React.useCallback(
    async (dataToken: string, user: string) => {
      return await computeService.getComputeAllowance(dataToken, user);
    },
    [computeService]
  );

  return {
    startCompute,
    checkStatus,
    getAllowance
  };
}