import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Server, Play, Check, AlertCircle } from 'lucide-react';

interface ComputeRequestProps {
  modelId: number;
  modelName: string;
  onSubmit: (params: any) => Promise<void>;
}

const ComputeRequest: React.FC<ComputeRequestProps> = ({
  modelId,
  modelName,
  onSubmit
}) => {
  const [computeParams, setComputeParams] = useState({
    inputData: "",
    computeConfig: "",
  });
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setStatus('processing');
      await onSubmit(computeParams);
      setStatus('completed');
      toast({
        title: "Compute Request Submitted",
        description: "Your computation request is being processed",
      });
    } catch (error) {
      setStatus('failed');
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Compute Request</CardTitle>
            <CardDescription>
              Model: {modelName}
            </CardDescription>
          </div>
          <Badge variant={
            status === 'processing' ? "default" :
            status === 'completed' ? "success" :
            status === 'failed' ? "destructive" :
            "secondary"
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Input Data</Label>
            <Textarea
              placeholder="Enter your input data in JSON format"
              value={computeParams.inputData}
              onChange={(e) => setComputeParams({
                ...computeParams,
                inputData: e.target.value
              })}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label>Compute Configuration</Label>
            <Textarea
              placeholder="Enter compute configuration in JSON format"
              value={computeParams.computeConfig}
              onChange={(e) => setComputeParams({
                ...computeParams,
                computeConfig: e.target.value
              })}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Server className="h-4 w-4" />
              ROFL Node: Active
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={status === 'processing'}
            >
              {status === 'processing' ? (
                <>
                  <div className="animate-spin mr-2">
                    <Server className="h-4 w-4" />
                  </div>
                  Processing
                </>
              ) : status === 'completed' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : status === 'failed' ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Retry
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComputeRequest;