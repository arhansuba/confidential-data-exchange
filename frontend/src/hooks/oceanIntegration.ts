// oceanIntegration.ts
import { PublicClient, WalletClient } from 'viem';
import { randomBytes } from 'crypto';
//import { encrypt, decrypt } from '@oasisprotocol/sapphire-paratime/crypto';

// Ocean Protocol types
interface DDO {
  id: string;
  dataToken: string;
  services: Array<{
    type: string;
    serviceEndpoint: string;
    attributes: Record<string, unknown>;
  }>;
}

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

type ComputeStatus = 0 | 1 | 2 | 3;

const computeABI = [
  {
    name: 'startCompute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dataToken', type: 'address' },
      { name: 'algorithmToken', type: 'address' },
      { name: 'encryptedParams', type: 'bytes' }
    ],
    outputs: [{ name: 'jobId', type: 'bytes32' }]
  },
  {
    name: 'getComputeResult',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [
      { name: 'result', type: 'bytes' },
      { name: 'status', type: 'uint8' }
    ]
  }
] as const;

export class OceanComputeService {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private contractAddress: `0x${string}`;
  private oceanProviderUrl: string;

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient,
    contractAddress: `0x${string}`,
    oceanProviderUrl: string
  ) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.contractAddress = contractAddress;
    this.oceanProviderUrl = oceanProviderUrl;
  }

  async getDDO(did: string): Promise<DDO> {
    const response = await fetch(`${this.oceanProviderUrl}/api/aquarius/assets/ddo/${did}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch DDO: ${response.statusText}`);
    }
    return response.json();
  }

  async startComputeJob(
    datasetDid: string,
    algorithmDid: string,
    params: ComputeParams
  ): Promise<string> {
    try {
      // Get dataset and algorithm DDOs
      const [dataset, algorithm] = await Promise.all([
        this.getDDO(datasetDid),
        this.getDDO(algorithmDid)
      ]);

      // Check compute service availability
      const computeService = dataset.services.find(s => s.type === 'compute');
      if (!computeService) {
        throw new Error('Dataset does not support compute');
      }

      // Encrypt compute parameters
      const encryptedParams = await this.encryptComputeParams(params);

      // Start compute job
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: computeABI,
        functionName: 'startCompute',
        args: [dataset.dataToken as `0x${string}`, algorithm.dataToken as `0x${string}`, encryptedParams]
      });

      const hash = await this.walletClient.writeContract({
        ...request,
        account: this.walletClient.account ?? null // Ensure the account property is included
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Parse events to get job ID
      const jobId = receipt.logs[0].topics[1]; // Assuming first topic after event signature is job ID
      if (!jobId) {
        throw new Error('Failed to retrieve job ID from transaction receipt');
      }
      return jobId;
    } catch (error) {
      console.error('Failed to start compute job:', error);
      throw error;
    }
  }

  async checkComputeStatus(jobId: string): Promise<ComputeJob> {
    try {
      const [result, status] = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: computeABI,
        functionName: 'getComputeResult',
        args: [jobId as `0x${string}`]
      });

      if (status === 2) { // Completed
        const decryptedResult = await this.decryptComputeResult(Buffer.from(result.slice(2), 'hex'));
        return {
          jobId,
          status: 'Completed',
          result: decryptedResult
        };
      }

      return {
        jobId,
        status: this.mapStatus(status as ComputeStatus)
      };
    } catch (error) {
      console.error('Failed to check compute status:', error);
      throw error;
    }
  }

  private async encryptComputeParams(params: ComputeParams): Promise<`0x${string}`> {
    const key = randomBytes(32);
    const nonce = randomBytes(12);
    
    const serializedParams = JSON.stringify(params);
    const encryptedData = await encrypt(
      key,
      Buffer.from(serializedParams),
      { additionalData: Buffer.from('compute_params') }
    );

    return `0x${encryptedData.toString('hex')}`;
  }

  private async decryptComputeResult(encryptedResult: Uint8Array): Promise<any> {
    try {
      const key = await this.getResultDecryptionKey();
      const decryptedData = await decrypt(
        key,
        Buffer.from(encryptedResult),
        { additionalData: Buffer.from('compute_result') }
      );

      return JSON.parse(decryptedData.toString());
    } catch (error) {
      console.error('Failed to decrypt result:', error);
      throw error;
    }
  }

  private mapStatus(status: ComputeStatus): ComputeJob['status'] {
    const statusMap: Record<ComputeStatus, ComputeJob['status']> = {
      0: 'Pending',
      1: 'Processing',
      2: 'Completed',
      3: 'Failed'
    };
    return statusMap[status];
  }

  private async getResultDecryptionKey(): Promise<Buffer> {
    // In a real implementation, this would get the key from secure storage
    return randomBytes(32);
  }
}
import { createCipheriv, createDecipheriv } from 'crypto';

function encrypt(key: Buffer, data: Buffer, options: { additionalData: Buffer; }): Buffer {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(options.additionalData);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, tag, encrypted]);
}

function decrypt(key: Buffer, encryptedData: Buffer, options: { additionalData: Buffer; }): Buffer {
  const nonce = encryptedData.slice(0, 12);
  const tag = encryptedData.slice(12, 28);
  const data = encryptedData.slice(28);
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAAD(options.additionalData);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted;
}

