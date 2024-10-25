'use client'

import React, { useState, useCallback } from 'react';
import { 
  useAccount, 
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { readContract, writeContract } from '@wagmi/core';
import { Address, formatEther, parseEther } from 'viem';

import { useToast } from '@/hooks/use-toast';

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';

// Icons
import {
  Brain,
  Server as ServerIcon,
  Activity,
  Lock,
  Database,
  PlayCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Contract Configs
import { 
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  OCEAN_COMPUTE_ADDRESS,
  OCEAN_COMPUTE_ABI 
} from '@/config/contracts';

// Types
interface Model {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  hasComputeService: boolean;
  accessType: string;
  computeCount: bigint;
  hasAccess: boolean;
  oceanDataToken: Address;
  algorithmToken: Address;
  decryptedMetadata: any | null;
}

interface ComputeJob {
  id: bigint;
  modelName: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  timestamp: bigint;
}

const marketplaceConfig = {
  address: MARKETPLACE_ADDRESS,
  abi: MARKETPLACE_ABI,
} as const;

const oceanComputeConfig = {
  address: OCEAN_COMPUTE_ADDRESS,
  abi: OCEAN_COMPUTE_ABI,
} as const;

export default function MarketplaceDashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [computeJobs, setComputeJobs] = useState<ComputeJob[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      setIsLoading(true);

      // Get model count
      const count = await readContract({
        ...marketplaceConfig,
        functionName: 'getModelCount',
        args: [],
        account: address,
      } as const);

      // Get models
      const modelData = await readContract({
        ...marketplaceConfig,
        functionName: 'getModels',
        args: [BigInt(0), count],
        account: address,
      } as const);

      // Get compute jobs
      const jobData = await readContract({
        ...marketplaceConfig,
        functionName: 'getComputeJobs',
        args: [address],
        account: address,
      } as const);

      setModels(modelData as Model[]);
      setComputeJobs(jobData as ComputeJob[]);
    } catch (error) {
      toast({
        title: 'Error Loading Data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchaseAccess = async (model: Model) => {
    if (!address || !walletClient) return;

    try {
      setIsProcessing(true);

      const { request } = await writeContract.prepare({
        ...marketplaceConfig,
        functionName: 'purchaseModelAccess',
        args: [model.id],
        value: model.price,
        account: address,
      } as const);

      const hash = await writeContract(request, { account: address });
      await publicClient?.waitForTransactionReceipt({ hash });

      await loadData();
      setSelectedModel(null);
      
      toast({
        title: 'Purchase Successful',
        description: 'You now have access to this model',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartCompute = async (model: Model) => {
    if (!address || !walletClient) return;

    try {
      setIsProcessing(true);

      const { request } = await writeContract.prepare({
        ...oceanComputeConfig,
        functionName: 'startCompute',
        args: [model.id, model.oceanDataToken, model.algorithmToken],
        account: address,
      } as const);

      const hash = await writeContract(request, { account: address });
      await publicClient?.waitForTransactionReceipt({ hash });

      await loadData();
      setSelectedModel(null);

      toast({
        title: 'Compute Job Started',
        description: 'Your computation request is being processed',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Compute Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelAction = async (model: Model) => {
    if (!address) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (model.hasAccess) {
      await handleStartCompute(model);
    } else {
      await handlePurchaseAccess(model);
    }
  };

  const downloadResults = async (jobId: bigint) => {
    try {
      // Implement result download logic
      toast({
        title: 'Download Started',
        description: 'Your results are being downloaded',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getBadgeClass = (status: 'completed' | 'failed' | 'processing') => {
    switch (status) {
      case 'completed':
        return "bg-green-500";
      case 'failed':
        return "bg-destructive";
      default:
        return "bg-blue-500";
    }
  };

  function cn(arg0: string): string | undefined {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">
            <Brain className="mr-2 h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="compute">
            <ServerIcon className="mr-2 h-4 w-4" />
            Compute Jobs
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            My Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card key={String(model.id)} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{model.name}</CardTitle>
                        <CardDescription>{model.description}</CardDescription>
                      </div>
                      {model.hasComputeService && (
                        <Badge className="bg-secondary hover:bg-secondary/80">
                          Compute Enabled
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Compute Jobs: {model.computeCount.toString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Access Type: {model.accessType}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {formatEther(model.price)} ETH
                        </span>
                        <Button
                          onClick={() => setSelectedModel(model)}
                          disabled={isProcessing}
                        >
                          {model.hasAccess ? "Start Compute" : "Purchase Access"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compute">
          <div className="grid grid-cols-1 gap-4">
            {computeJobs.map((job) => (
              <Card key={String(job.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {job.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="h-6 w-6 text-destructive" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-blue-500" />
                      )}
                      <div>
                        <h3 className="font-medium">Compute Job #{String(job.id)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Model: {job.modelName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={cn(getBadgeClass(job.status))}>
                        {job.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Started: {new Date(Number(job.timestamp) * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <Progress value={job.progress} className="mt-4" />
                  )}

                  {job.status === 'completed' && (
                    <Button 
                      onClick={() => downloadResults(job.id)}
                      className="mt-4"
                    >
                      Download Results
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          {/* Data management interface */}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedModel?.hasAccess ? "Start Compute Job" : "Purchase Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedModel?.hasAccess 
                ? "Configure your compute job parameters"
                : "Purchase access to use this model"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedModel && handleModelAction(selectedModel)}
              disabled={isProcessing}
            >
              {selectedModel?.hasAccess ? "Start Compute" : "Purchase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}