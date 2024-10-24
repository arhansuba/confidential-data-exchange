import React, { useState } from 'react';
import { ethers } from 'ethers';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Cpu,
  Clock,
  Shield,
  Database,
  Code,
  Lock,
  Play
} from 'lucide-react';

interface ComputeConfigProps {
  modelId: string;
  datasetId: string;
  onSubmit: (config: any) => Promise<void>;
}

const ComputeParameterConfig: React.FC<ComputeConfigProps> = ({
  modelId,
  datasetId,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [config, setConfig] = useState({
    // Basic Configuration
    computeProvider: 'rofl', // 'rofl' or 'ocean'
    environment: 'python-3.8',
    timeout: 3600,
    priority: 'normal',

    // Resource Configuration
    resources: {
      cpu: 2,
      memory: 4,
      gpu: 0,
      storage: 10
    },

    // Security Configuration
    security: {
      encryptOutput: true,
      verifyTEE: true,
      allowNetworkAccess: false,
      trustedOnly: true
    },

    // Algorithm Parameters
    parameters: {
      batchSize: 32,
      epochs: 10,
      learningRate: 0.001,
      customParams: ''
    },

    // Advanced Configuration
    advanced: {
      maxRetries: 3,
      checkpointInterval: 300,
      logLevel: 'info',
      customEnvVars: ''
    }
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Encrypt sensitive parameters
      const encryptedConfig = await encryptParameters(config);

      // Submit compute job
      await onSubmit(encryptedConfig);

      toast({
        title: "Compute Job Started",
        description: "Your computation request has been submitted successfully"
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const encryptParameters = async (params: any) => {
    // Implementation would use Sapphire's encryption capabilities
    return params;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Compute Configuration
        </CardTitle>
        <CardDescription>
          Configure parameters for your compute job
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 gap-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="basic">
              <div className="space-y-4">
                <FormField
                  name="computeProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compute Provider</FormLabel>
                      <Select
                        value={config.computeProvider}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          computeProvider: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select compute provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rofl">
                            ROFL (Trusted Execution)
                          </SelectItem>
                          <SelectItem value="ocean">
                            Ocean Protocol
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the compute provider for your job
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compute Environment</FormLabel>
                      <Select
                        value={config.environment}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          environment: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python-3.8">Python 3.8</SelectItem>
                          <SelectItem value="python-3.9">Python 3.9</SelectItem>
                          <SelectItem value="python-3.10">Python 3.10</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (seconds)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[config.timeout]}
                            onValueChange={(value) => setConfig(prev => ({
                              ...prev,
                              timeout: value[0]
                            }))}
                            max={7200}
                            step={300}
                          />
                          <Input
                            type="number"
                            value={config.timeout}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              timeout: parseInt(e.target.value)
                            }))}
                            className="w-24"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Compute Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormItem>
                    <FormLabel>CPU Cores</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={config.resources.cpu}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          resources: {
                            ...prev.resources,
                            cpu: parseInt(e.target.value)
                          }
                        }))}
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Memory (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={config.resources.memory}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          resources: {
                            ...prev.resources,
                            memory: parseInt(e.target.value)
                          }
                        }))}
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>GPU Units</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={config.resources.gpu}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          resources: {
                            ...prev.resources,
                            gpu: parseInt(e.target.value)
                          }
                        }))}
                      />
                    </FormControl>
                  </FormItem>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Encrypt Output</FormLabel>
                      <FormDescription>
                        Encrypt computation results
                      </FormDescription>
                    </div>
                    <Switch
                      checked={config.security.encryptOutput}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          encryptOutput: checked
                        }
                      }))}
                    />
                  </FormItem>

                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Verify TEE</FormLabel>
                      <FormDescription>
                        Verify trusted execution environment
                      </FormDescription>
                    </div>
                    <Switch
                      checked={config.security.verifyTEE}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          verifyTEE: checked
                        }
                      }))}
                    />
                  </FormItem>

                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Network Access</FormLabel>
                      <FormDescription>
                        Allow network access during computation
                      </FormDescription>
                    </div>
                    <Switch
                      checked={config.security.allowNetworkAccess}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          allowNetworkAccess: checked
                        }
                      }))}
                    />
                  </FormItem>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-4">
                <FormField
                  name="maxRetries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Retries</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={config.advanced.maxRetries}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            advanced: {
                              ...prev.advanced,
                              maxRetries: parseInt(e.target.value)
                            }
                          }))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  name="customParams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Parameters (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          value={config.parameters.customParams}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              customParams: e.target.value
                            }
                          }))}
                          placeholder="{}"
                          className="font-mono"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  name="logLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Log Level</FormLabel>
                      <Select
                        value={config.advanced.logLevel}
                        onValueChange={(value) => setConfig(prev => ({
                          ...prev,
                          advanced: {
                            ...prev.advanced,
                            logLevel: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveTab('basic')}>
          Reset
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          <Play className="h-4 w-4 mr-2" />
          {isSubmitting ? "Submitting..." : "Start Compute Job"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ComputeParameterConfig;