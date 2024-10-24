import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useOceanCompute } from './oceanIntegration';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain,
  Server,
  Upload,
  Activity,
  Lock,
  Database,
  PlayCircle,
  CheckCircle2,
  XCircle 
} from 'lucide-react';

// Contract ABIs and addresses
const MARKETPLACE_ABI = [/* Your ABI here */];
const OCEAN_COMPUTE_ABI = [/* Your ABI here */];
const ROFL_COMPUTE_ABI = [/* Your ABI here */];

const MARKETPLACE_ADDRESS = "YOUR_MARKETPLACE_ADDRESS";
const OCEAN_COMPUTE_ADDRESS = "YOUR_OCEAN_COMPUTE_ADDRESS";
const ROFL_COMPUTE_ADDRESS = "YOUR_ROFL_COMPUTE_ADDRESS";

export default function MarketplaceDashboard() {
  // State for different components
  const [models, setModels] = useState([]);
  const [computeJobs, setComputeJobs] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computeLoading, setComputeLoading] = useState(false);
  
  // Contract instances
  const [contracts, setContracts] = useState({
    marketplace: null,
    oceanCompute: null,
    roflCompute: null
  });

  // Ocean Protocol integration
  const { startCompute, checkStatus, getAllowance } = useOceanCompute(
    window.ethereum,
    OCEAN_COMPUTE_ADDRESS,
    "YOUR_OCEAN_PROVIDER_URL"
  );

  const { toast } = useToast();

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          setContracts({
            marketplace: new ethers.Contract(
              MARKETPLACE_ADDRESS,
              MARKETPLACE_ABI,
              signer
            ),
            oceanCompute: new ethers.Contract(
              OCEAN_COMPUTE_ADDRESS,
              OCEAN_COMPUTE_ABI,
              signer
            ),
            roflCompute: new ethers.Contract(
              ROFL_COMPUTE_ADDRESS,
              ROFL_COMPUTE_ABI,
              signer
            )
          });

          await loadModels();
          await loadComputeJobs();
        } catch (error) {
          toast({
            title: "Connection Error",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    };

    initContracts();
  }, []);

  // Load models from marketplace
  const loadModels = async () => {
    if (!contracts.marketplace) return;
    
    try {
      setLoading(true);
      const modelCount = await contracts.marketplace.getModelCount();
      const modelPromises = [];

      for (let i = 0; i < modelCount; i++) {
        modelPromises.push(contracts.marketplace.getModel(i));
      }

      const loadedModels = await Promise.all(modelPromises);
      setModels(loadedModels.map(model => ({
        ...model,
        decryptedMetadata: null // Will be decrypted if user has access
      })));
    } catch (error) {
      toast({
        title: "Error Loading Models",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Start compute job
  const startComputeJob = async (modelId, params) => {
    try {
      setComputeLoading(true);
      
      // Check compute allowance
      const allowance = await getAllowance(
        contracts.oceanCompute.address,
        await window.ethereum.request({ method: 'eth_accounts' })[0]
      );

      if (allowance <= 0) {
        throw new Error("Insufficient compute allowance");
      }

      // Start Ocean compute job
      const oceanJobId = await startCompute(
        models[modelId].oceanDataToken,
        models[modelId].algorithmToken,
        params
      );

      // Create ROFL compute task
      const tx = await contracts.roflCompute.requestComputation(
        modelId,
        ethers.utils.toUtf8Bytes(JSON.stringify(params)),
        ethers.utils.toUtf8Bytes(JSON.stringify({ oceanJobId }))
      );
      await tx.wait();

      toast({
        title: "Compute Job Started",
        description: "Your computation request is being processed",
      });

      await loadComputeJobs();
    } catch (error) {
      toast({
        title: "Compute Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setComputeLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList>
          <TabsTrigger value="models">
            <Brain className="mr-2 h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="compute">
            <Server className="mr-2 h-4 w-4" />
            Compute Jobs
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            My Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{model.name}</CardTitle>
                      <CardDescription>{model.description}</CardDescription>
                    </div>
                    {model.hasComputeService && (
                      <Badge variant="secondary">
                        Compute Enabled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Compute Jobs: {model.computeCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Access Type: {model.accessType}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {ethers.utils.formatEther(model.price)} ETH
                      </span>
                      <Button 
                        onClick={() => handleModelSelect(model)}
                        variant="default"
                      >
                        {model.hasAccess ? "Start Compute" : "Purchase Access"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compute" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {computeJobs.map((job, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {job.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <PlayCircle className="h-6 w-6 text-blue-500" />
                      )}
                      <div>
                        <h3 className="font-medium">
                          Compute Job #{job.id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Model: {job.modelName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium capitalize">
                        {job.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        Started: {new Date(job.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <Progress 
                      value={job.progress} 
                      className="mt-4"
                    />
                  )}

                  {job.status === 'completed' && (
                    <Button 
                      className="mt-4"
                      onClick={() => downloadResults(job.id)}
                    >
                      Download Results
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data management interface */}
        </TabsContent>
      </Tabs>

      {/* Model Selection Dialog */}
      <AlertDialog open={!!selectedModel}>
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
          
          {/* Dialog content based on access status */}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedModel(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleModelAction(selectedModel)}>
              {selectedModel?.hasAccess ? "Start Compute" : "Purchase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}