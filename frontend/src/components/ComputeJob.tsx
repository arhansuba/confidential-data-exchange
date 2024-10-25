import React, { useState } from 'react';
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
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface ComputeConfigProps {
  modelId: string;
  datasetId: string;
  onSubmit: (config: ComputeConfig) => Promise<void>;
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

interface AlgorithmParameters {
  batchSize: number;
  epochs: number;
  learningRate: number;
  customParams: string;
}

interface AdvancedConfig {
  maxRetries: number;
  checkpointInterval: number;
  logLevel: string;
  customEnvVars: string;
}

interface ComputeConfig {
  computeProvider: 'rofl' | 'ocean';
  environment: string;
  timeout: number;
  priority: 'low' | 'normal' | 'high';
  resources: ResourceConfig;
  security: SecurityConfig;
  parameters: AlgorithmParameters;
  advanced: AdvancedConfig;
}

const formSchema = z.object({
  computeProvider: z.enum(['rofl', 'ocean']),
  environment: z.string(),
  timeout: z.number().min(300).max(7200),
  priority: z.enum(['low', 'normal', 'high']),
  resources: z.object({
    cpu: z.number().min(1).max(32),
    memory: z.number().min(1).max(128),
    gpu: z.number().min(0).max(4),
    storage: z.number().min(1).max(1000)
  }),
  security: z.object({
    encryptOutput: z.boolean(),
    verifyTEE: z.boolean(),
    allowNetworkAccess: z.boolean(),
    trustedOnly: z.boolean()
  }),
  parameters: z.object({
    batchSize: z.number().min(1),
    epochs: z.number().min(1),
    learningRate: z.number().min(0.0001).max(1),
    customParams: z.string().optional()
  }),
  advanced: z.object({
    maxRetries: z.number().min(0).max(5),
    checkpointInterval: z.number().min(0),
    logLevel: z.enum(['debug', 'info', 'warning', 'error']),
    customEnvVars: z.string().optional()
  })
});

const defaultValues: ComputeConfig = {
  computeProvider: 'rofl',
  environment: 'python-3.8',
  timeout: 3600,
  priority: 'normal',
  resources: {
    cpu: 2,
    memory: 4,
    gpu: 0,
    storage: 10
  },
  security: {
    encryptOutput: true,
    verifyTEE: true,
    allowNetworkAccess: false,
    trustedOnly: true
  },
  parameters: {
    batchSize: 32,
    epochs: 10,
    learningRate: 0.001,
    customParams: ''
  },
  advanced: {
    maxRetries: 3,
    checkpointInterval: 300,
    logLevel: 'info',
    customEnvVars: ''
  }
};

const ComputeParameterConfig: React.FC<ComputeConfigProps> = ({
  modelId,
  datasetId,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ComputeConfig>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const handleSubmit = async (data: ComputeConfig) => {
    try {
      setIsSubmitting(true);
      const encryptedConfig = await encryptParameters(data);
      await onSubmit(encryptedConfig);

      toast({
        title: "Compute Job Started",
        description: "Your computation request has been submitted successfully"
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const encryptParameters = async (params: ComputeConfig): Promise<ComputeConfig> => {
    // Implementation would use Sapphire's encryption capabilities
    return params;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                      control={form.control}
                      name="computeProvider"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Compute Provider</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeout"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Timeout (seconds)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value: any[]) => field.onChange(value[0])}
                                max={7200}
                                step={300}
                              />
                              <Input
                                type="number"
                                {...field}
                                className="w-24"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
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
                      <FormField
                        control={form.control}
                        name="resources.cpu"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>CPU Cores</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(+e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="resources.memory"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>Memory (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(+e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      <FormField
                        control={form.control}
                        name="security.encryptOutput"
                        render={({ field }: { field: any }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Encrypt Output</FormLabel>
                              <FormDescription>
                                Encrypt computation results
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="advanced.customEnvVars"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Custom Environment Variables</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="KEY=value"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              onClick={() => form.reset(defaultValues)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Reset
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Start Compute Job"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default ComputeParameterConfig;