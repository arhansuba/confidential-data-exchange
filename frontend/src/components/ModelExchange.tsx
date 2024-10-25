import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Lock,
  Server, 
  Upload,
  Download,
  MoreVertical,
  Search,
  FileCode,
  Activity
} from 'lucide-react';

const ModelExchange = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [uploadData, setUploadData] = useState<{
    name: string;
    description: string;
    price: string;
    computeEnabled: boolean;
    file: File | null;
    oceanToken: string;
  }>({
    name: "",
    description: "",
    price: "",
    computeEnabled: false,
    file: null,
    oceanToken: ""
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      // Contract interaction code here
      // This is where you'd fetch models from the contract
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Loading Models",
        description: (error as Error).message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleUpload = () => {
    // Add your upload logic here
    console.log("Uploading model:", uploadData);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Confidential AI Exchange</h1>
          <p className="text-muted-foreground mt-2">
            Secure marketplace for AI models with compute-to-data capabilities
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              List New Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>List AI Model</DialogTitle>
              <DialogDescription>
                Upload and tokenize your AI model with optional compute-to-data functionality
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Model Name</Label>
                <Input
                  id="name"
                  placeholder="Enter model name"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe your model's capabilities"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (ETH)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={uploadData.price}
                    onChange={(e) => setUploadData({ ...uploadData, price: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="oceanToken">Ocean Token Address</Label>
                  <Input
                    id="oceanToken"
                    placeholder="Optional - For compute-to-data"
                    value={uploadData.oceanToken}
                    onChange={(e) => setUploadData({ ...uploadData, oceanToken: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="computeEnabled"
                  checked={uploadData.computeEnabled}
                  onChange={(e) => setUploadData({ ...uploadData, computeEnabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="computeEnabled">Enable Compute-to-Data</Label>
              </div>

              <div className="grid gap-2">
                <Label>Model File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Input
                    type="file"
                    className="hidden"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] ?? null })}
                    accept=".h5,.pkl,.pt,.pth,.onnx"
                  />
                  <FileCode className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports .h5, .pkl, .pt, .pth, .onnx
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleUpload()}>
                List Model
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">
            <Brain className="mr-2 h-4 w-4" />
            Browse Models
          </TabsTrigger>
          <TabsTrigger value="owned">
            <Lock className="mr-2 h-4 w-4" />
            My Models
          </TabsTrigger>
          <TabsTrigger value="compute">
            <Server className="mr-2 h-4 w-4" />
            Compute Requests
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <div className="flex mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="ml-4">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Filter by Price</DropdownMenuItem>
                <DropdownMenuItem>Filter by Type</DropdownMenuItem>
                <DropdownMenuItem>Compute Enabled Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <TabsContent value="browse" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Model Cards */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Sample AI Model</CardTitle>
                        <CardDescription>
                          Advanced language processing model
                        </CardDescription>
                      </div>
                      <Badge>
                        Compute Enabled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          Active Compute Requests: 3
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">0.5 ETH</span>
                        <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Purchase Access
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="owned">
            {/* Owned models section */}
          </TabsContent>

          <TabsContent value="compute">
            {/* Compute requests section */}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ModelExchange;