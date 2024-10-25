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
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Database,
  Files,
  Settings,
  BarChart,
  MoreVertical,
  Lock,
  Users,
  Activity,
  Play,
  Pause,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  size: string;
  accessCount: number;
  computeCount: number;
  revenue: string;
  status: 'active' | 'paused' | 'archived';
  accessControl: {
    type: 'fixed' | 'dynamic';
    price: string;
    allowedUsers: string[];
  };
  computeStats: {
    totalJobs: number;
    successRate: number;
    averageTime: string;
  };
}

const DataManagement = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      // Implementation would fetch from Ocean Protocol and Sapphire contracts
      const mockData: Dataset[] = [
        {
          id: "1",
          name: "Healthcare Dataset",
          size: "2.5 GB",
          accessCount: 15,
          computeCount: 45,
          revenue: "2.5 ETH",
          status: 'active',
          accessControl: {
            type: 'fixed',
            price: "0.1 ETH",
            allowedUsers: ["0x123...", "0x456..."]
          },
          computeStats: {
            totalJobs: 45,
            successRate: 95.5,
            averageTime: "12m"
          }
        }
        // Add more mock datasets
      ];
      setDatasets(mockData);
    } catch (error) {
      toast({
        title: "Error Loading Datasets",
        description: (error as any).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDatasetStatus = async (datasetId: string, status: Dataset['status']) => {
    try {
      // Implementation would update status on Ocean Protocol
      setDatasets(prev => 
        prev.map(d => d.id === datasetId ? { ...d, status } : d)
      );
      
      toast({
        title: "Status Updated",
        description: `Dataset status updated to ${status}`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: (error as any).message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="files">
              <Files className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="access">
              <Users className="h-4 w-4 mr-2" />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="compute">
              <Activity className="h-4 w-4 mr-2" />
              Compute Jobs
            </TabsTrigger>
          </TabsList>

          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Dataset
          </Button>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{dataset.name}</CardTitle>
                      <CardDescription>
                        Size: {dataset.size}
                      </CardDescription>
                    </div>
                    <Badge className={
                      dataset.status === 'active' ? 'bg-green-500 text-white' :
                      dataset.status === 'paused' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }>
                      {dataset.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Access Count</p>
                        <p className="text-2xl font-bold">{dataset.accessCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Compute Jobs</p>
                        <p className="text-2xl font-bold">{dataset.computeCount}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Success Rate</p>
                      <Progress value={dataset.computeStats.successRate} />
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-lg font-semibold">{dataset.revenue}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateDatasetStatus(dataset.id, 'active')}>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateDatasetStatus(dataset.id, 'paused')}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedDataset(dataset)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Files</CardTitle>
              <CardDescription>
                Manage your dataset files and versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Database className="h-6 w-6" />
                      <div>
                        <p className="font-medium">{dataset.name}</p>
                        <p className="text-sm text-gray-500">{dataset.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Manage access permissions and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{dataset.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dataset.accessControl.type === 'fixed' ? 'Fixed Price' : 'Dynamic Pricing'}
                        </p>
                      </div>
                      <Badge>
                        <Lock className="h-4 w-4 mr-2" />
                        {dataset.accessControl.allowedUsers.length} Users
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-lg font-semibold">{dataset.accessControl.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Access Count</p>
                        <p className="text-lg font-semibold">{dataset.accessCount}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button>
                        Manage Access
                      </Button>
                      <Button>
                        Update Price
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compute">
          <Card>
            <CardHeader>
              <CardTitle>Compute Jobs</CardTitle>
              <CardDescription>
                Monitor and manage compute-to-data jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{dataset.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dataset.computeStats.totalJobs} Total Jobs
                        </p>
                      </div>
                      <Badge className={
                        dataset.computeStats.successRate > 90 ? 'bg-green-500 text-white' :
                        dataset.computeStats.successRate > 70 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }>
                        {dataset.computeStats.successRate}% Success Rate
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Active Jobs</p>
                        <p className="text-lg font-semibold">
                          {dataset.computeCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg. Time</p>
                        <p className="text-lg font-semibold">
                          {dataset.computeStats.averageTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-lg font-semibold">
                          {dataset.revenue}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button>
                        View Jobs
                      </Button>
                      <Button>
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;