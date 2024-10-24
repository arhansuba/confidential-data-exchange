import { ethers } from 'ethers';

// Configuration types and interfaces
interface ComputeConfig {
  provider: 'rofl' | 'ocean';
  environment: string;
  resources: ResourceConfig;
  security: SecurityConfig;
  timeout: number;
  priority: 'low' | 'normal' | 'high';
  advanced: AdvancedConfig;
}

interface ResourceConfig {
  cpu: number;
  memory: number;
  gpu: number;
  storage: number;
}

interface SecurityConfig {
  encryptOutput: boolean;
  verifyTEE: boolean;
  allowNetworkAccess: boolean;
  trustedOnly: boolean;
}

interface AdvancedConfig {
  maxRetries: number;
  checkpointInterval: number;
  logLevel: string;
  customParams: Record<string, any>;
}

// Provider-specific configurations
interface ROFLConfig extends ComputeConfig {
  teeType: 'sgx' | 'sev' | 'nitro';
  attestationConfig: {
    minSecurityLevel: number;
    requiredFeatures: string[];
  };
}

interface OceanConfig extends ComputeConfig {
  algorithm: {
    did: string;
    checksum: string;
  };
  datatoken: string;
  consumerAddress: string;
}

// Validation and cost estimation class
export class ComputeConfigManager {
  private readonly providerLimits: Record<string, ResourceLimits> = {
    rofl: {
      cpu: { min: 1, max: 32 },
      memory: { min: 1, max: 128 },
      gpu: { min: 0, max: 4 },
      storage: { min: 1, max: 1000 },
      timeout: { min: 60, max: 86400 }
    },
    ocean: {
      cpu: { min: 1, max: 16 },
      memory: { min: 2, max: 64 },
      gpu: { min: 0, max: 2 },
      storage: { min: 5, max: 500 },
      timeout: { min: 300, max: 43200 }
    }
  };

  private readonly pricingModel = {
    rofl: {
      baseFee: ethers.utils.parseEther('0.01'),
      cpuPerHour: ethers.utils.parseEther('0.005'),
      memoryPerGBHour: ethers.utils.parseEther('0.002'),
      gpuPerHour: ethers.utils.parseEther('0.5'),
      storagePerGBHour: ethers.utils.parseEther('0.001')
    },
    ocean: {
      baseFee: ethers.utils.parseEther('0.02'),
      cpuPerHour: ethers.utils.parseEther('0.008'),
      memoryPerGBHour: ethers.utils.parseEther('0.003'),
      gpuPerHour: ethers.utils.parseEther('0.6'),
      storagePerGBHour: ethers.utils.parseEther('0.0015')
    }
  };

  /**
   * Validate compute configuration
   */
  public validateConfig(config: ComputeConfig): ValidationResult {
    try {
      // Basic validation
      this.validateBasicConfig(config);

      // Provider-specific validation
      if (config.provider === 'rofl') {
        this.validateROFLConfig(config as ROFLConfig);
      } else {
        this.validateOceanConfig(config as OceanConfig);
      }

      // Resource validation
      this.validateResources(config);

      // Security validation
      this.validateSecurity(config);

      // Advanced options validation
      this.validateAdvanced(config);

      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Estimate compute cost
   */
  public estimateCost(config: ComputeConfig): CostEstimate {
    const provider = this.pricingModel[config.provider];
    const duration = config.timeout / 3600; // Convert to hours

    // Calculate base cost
    let totalCost = provider.baseFee;

    // Resource costs
    totalCost = totalCost.add(
      provider.cpuPerHour.mul(config.resources.cpu).mul(duration)
    );
    totalCost = totalCost.add(
      provider.memoryPerGBHour.mul(config.resources.memory).mul(duration)
    );
    totalCost = totalCost.add(
      provider.gpuPerHour.mul(config.resources.gpu).mul(duration)
    );
    totalCost = totalCost.add(
      provider.storagePerGBHour.mul(config.resources.storage).mul(duration)
    );

    // Priority multiplier
    const priorityMultiplier = {
      low: 0.8,
      normal: 1.0,
      high: 1.5
    }[config.priority];

    totalCost = totalCost.mul(priorityMultiplier);

    // Security features cost
    if (config.security.encryptOutput) {
      totalCost = totalCost.add(ethers.utils.parseEther('0.005'));
    }
    if (config.security.verifyTEE) {
      totalCost = totalCost.add(ethers.utils.parseEther('0.01'));
    }

    return {
      totalCost,
      breakdown: {
        baseFee: provider.baseFee,
        computeCost: totalCost.sub(provider.baseFee),
        priorityMultiplier,
        securityCost: config.security.encryptOutput || config.security.verifyTEE ?
          ethers.utils.parseEther('0.015') : ethers.utils.parseEther('0')
      }
    };
  }

  /**
   * Generate provider-specific configuration
   */
  public generateProviderConfig(
    baseConfig: ComputeConfig,
    providerType: 'rofl' | 'ocean'
  ): ROFLConfig | OceanConfig {
    if (providerType === 'rofl') {
      return {
        ...baseConfig,
        teeType: 'sgx',
        attestationConfig: {
          minSecurityLevel: 2,
          requiredFeatures: ['sealing', 'remote-attestation']
        }
      } as ROFLConfig;
    } else {
      return {
        ...baseConfig,
        algorithm: {
          did: '',
          checksum: ''
        },
        datatoken: '',
        consumerAddress: ''
      } as OceanConfig;
    }
  }

  private validateBasicConfig(config: ComputeConfig): void {
    const limits = this.providerLimits[config.provider];

    // Validate timeout
    if (config.timeout < limits.timeout.min || config.timeout > limits.timeout.max) {
      throw new Error(`Timeout must be between ${limits.timeout.min} and ${limits.timeout.max} seconds`);
    }

    // Validate environment
    const validEnvironments = ['python-3.8', 'python-3.9', 'python-3.10', 'r-4.0'];
    if (!validEnvironments.includes(config.environment)) {
      throw new Error(`Invalid environment. Must be one of: ${validEnvironments.join(', ')}`);
    }

    // Validate priority
    if (!['low', 'normal', 'high'].includes(config.priority)) {
      throw new Error('Invalid priority level');
    }
  }

  private validateResources(config: ComputeConfig): void {
    const limits = this.providerLimits[config.provider];

    // CPU validation
    if (config.resources.cpu < limits.cpu.min || config.resources.cpu > limits.cpu.max) {
      throw new Error(`CPU cores must be between ${limits.cpu.min} and ${limits.cpu.max}`);
    }

    // Memory validation
    if (config.resources.memory < limits.memory.min || config.resources.memory > limits.memory.max) {
      throw new Error(`Memory must be between ${limits.memory.min}GB and ${limits.memory.max}GB`);
    }

    // GPU validation
    if (config.resources.gpu < limits.gpu.min || config.resources.gpu > limits.gpu.max) {
      throw new Error(`GPU units must be between ${limits.gpu.min} and ${limits.gpu.max}`);
    }

    // Storage validation
    if (config.resources.storage < limits.storage.min || config.resources.storage > limits.storage.max) {
      throw new Error(`Storage must be between ${limits.storage.min}GB and ${limits.storage.max}GB`);
    }
  }

  private validateSecurity(config: ComputeConfig): void {
    if (config.security.verifyTEE && config.provider === 'rofl') {
      // Validate TEE configuration
      const roflConfig = config as ROFLConfig;
      if (!['sgx', 'sev', 'nitro'].includes(roflConfig.teeType)) {
        throw new Error('Invalid TEE type specified');
      }
    }

    if (config.security.trustedOnly && !config.security.verifyTEE) {
      throw new Error('TEE verification must be enabled for trusted-only mode');
    }
  }

  private validateAdvanced(config: ComputeConfig): void {
    if (config.advanced.maxRetries < 0 || config.advanced.maxRetries > 5) {
      throw new Error('Max retries must be between 0 and 5');
    }

    if (config.advanced.checkpointInterval < 0) {
      throw new Error('Checkpoint interval must be non-negative');
    }

    if (!['debug', 'info', 'warning', 'error'].includes(config.advanced.logLevel)) {
      throw new Error('Invalid log level specified');
    }
  }

  private validateROFLConfig(config: ROFLConfig): void {
    // Validate ROFL-specific settings
    if (config.security.verifyTEE) {
      if (config.attestationConfig.minSecurityLevel < 1 || 
          config.attestationConfig.minSecurityLevel > 3) {
        throw new Error('Security level must be between 1 and 3');
      }

      const validFeatures = ['sealing', 'remote-attestation', 'memory-encryption'];
      for (const feature of config.attestationConfig.requiredFeatures) {
        if (!validFeatures.includes(feature)) {
          throw new Error(`Invalid feature: ${feature}`);
        }
      }
    }
  }

  private validateOceanConfig(config: OceanConfig): void {
    // Validate Ocean-specific settings
    if (!ethers.utils.isHexString(config.algorithm.did)) {
      throw new Error('Invalid algorithm DID format');
    }

    if (!ethers.utils.isHexString(config.datatoken)) {
      throw new Error('Invalid datatoken address format');
    }

    if (!ethers.utils.isAddress(config.consumerAddress)) {
      throw new Error('Invalid consumer address format');
    }
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface CostEstimate {
  totalCost: ethers.BigNumber;
  breakdown: {
    baseFee: ethers.BigNumber;
    computeCost: ethers.BigNumber;
    priorityMultiplier: number;
    securityCost: ethers.BigNumber;
  };
}

interface ResourceLimits {
  cpu: { min: number; max: number };
  memory: { min: number; max: number };
  gpu: { min: number; max: number };
  storage: { min: number; max: number };
  timeout: { min: number; max: number };
}

export const computeManager = new ComputeConfigManager();