// src/types/tee.ts
export interface AttestationReport {
    id: string;
    timestamp: number;
    provider: string;
    measurements: {
      mrenclave: Buffer;
      mrsigner: Buffer;
      isvprodid: number;
      isvsvn: number;
    };
    securityLevel: SecurityLevel;
    rawQuote?: Buffer;
    rawReport?: any;
    rawDocument?: any;
  }
  
  export interface SecurityLevel {
    level: 'high' | 'medium' | 'low';
    score: number;
    factors: string[];
  }
  
  export interface VerificationResult {
    success: boolean;
    error?: string;
    details?: any;
    report?: AttestationReport;
  }
  
  export interface ExpectedMeasurements {
    mrenclave: Buffer;
    mrsigner: Buffer;
    minIsvProdId: number;
    minIsvSvn: number;
  }
  
  export interface TEEProviderConfig {
    type: string;
    config: any;
  }
  
  export interface TEEProvider {
    parseAttestation(attestation: string): Promise<AttestationReport>;
    verifyAttestation(report: AttestationReport): Promise<VerificationResult>;
  }
  
  export interface SGXConfig {
    iasURL: string;
    iasKey: string;
    minIsvSvn: number;
    trustedQuoteStatuses: string[];
  }
  
  export interface SEVConfig {
    arkUrl: string;
    askUrl: string;
    minApiMajor: number;
    minApiMinor: number;
  }
  
  export interface NitroConfig {
    region: string;
    attestationDocumentVersion: string;
    pcrs: {
      [key: number]: Buffer;
    };
  }
  
  export interface PolicyEngine {
    evaluateAttestation(report: AttestationReport): Promise<VerificationResult>;
  }
  
  export interface QuoteValidator {
    validateQuote(quote: Buffer): Promise<boolean>;
  }