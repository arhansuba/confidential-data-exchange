// types/contracts.ts
export interface ConfidentialAIModel {
    mintAIModel(name: string, metadataURI: string): Promise<any>;
  }
  
  export interface NFTMarketplace {
    listModel(modelId: number, price: string): Promise<any>;
    purchaseModel(modelId: number): Promise<any>;
  }
  
  export interface ROFLIntegration {
    evaluateModel(modelId: number, inputData: any): Promise<any>;
  }