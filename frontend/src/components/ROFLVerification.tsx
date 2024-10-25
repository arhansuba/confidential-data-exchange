import React, { useState, useEffect } from 'react';
import { 
  useContractRead,
  usePublicClient,
} from 'wagmi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Check, 
  AlertTriangle, 
  FileText,
  Server,
  Cpu,
  Activity,
  Key
} from 'lucide-react';
import { type Address } from 'viem';

interface VerificationProps {
  contractAddress: Address;
  taskId: number;
  onVerificationComplete?: (status: boolean) => void;
}

interface AttestationDetails {
  enclave: {
    mrenclave: `0x${string}`;
    mrsigner: `0x${string}`;
    isvprodid: number;
    isvsvn: number;
  };
  timestamp: number;
  signature: `0x${string}`;
}

type VerificationStatus = 'pending' | 'verified' | 'failed';
type StepStatus = 'pending' | 'success' | 'failed';

interface VerificationStep {
  step: string;
  status: StepStatus;
  details?: string;
}

interface ComputeVerification {
  taskId: number;
  nodeId: Address;
  attestation: AttestationDetails;
  resultHash: `0x${string}`;
  status: VerificationStatus;
  verificationSteps: VerificationStep[];
}

// Contract ABI
const contractAbi = [
  {
    inputs: [{ name: "taskId", type: "uint256" }],
    name: "getComputeTask",
    outputs: [{
      components: [
        { name: "node", type: "address" },
        { name: "attestation", type: "bytes" },
        { name: "resultHash", type: "bytes32" },
        { name: "status", type: "uint8" }
      ],
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "attestation", type: "bytes" }],
    name: "verifyAttestation",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "attestation", type: "bytes" }],
    name: "getEnclaveInfo",
    outputs: [{
      components: [
        { name: "mrenclave", type: "bytes32" },
        { name: "mrsigner", type: "bytes32" },
        { name: "isvprodid", type: "uint16" },
        { name: "isvsvn", type: "uint16" }
      ],
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const ROFLVerification: React.FC<VerificationProps> = ({
  contractAddress,
  taskId,
  onVerificationComplete
}) => {
  const [verification, setVerification] = useState<ComputeVerification | null>(null);
  const [detailedView, setDetailedView] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const { data: taskData }: { data: { node: Address; attestation: `0x${string}`; resultHash: `0x${string}`; status: number } | undefined } = useContractRead({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getComputeTask',
    args: [BigInt(taskId)],
  });

  // Initialize and load verification data
  useEffect(() => {
    if (taskData) {
      loadVerificationData();
    }
  }, [taskData]);

  const loadVerificationData = async () => {
    try {
      setLoading(true);

      if (!taskData) return;

      // Parse attestation
      const attestationDetails = await parseAttestation(taskData.attestation);

      // Initialize verification steps
      const verificationSteps: VerificationStep[] = [
        {
          step: "Enclave Measurement Verification",
          status: 'pending',
        },
        {
          step: "Attestation Signature Verification",
          status: 'pending',
        },
        {
          step: "Computation Environment Validation",
          status: 'pending',
        },
        {
          step: "Result Hash Verification",
          status: 'pending',
        }
      ];

      setVerification({
        taskId,
        nodeId: taskData.node,
        attestation: attestationDetails,
        resultHash: taskData.resultHash,
        status: 'pending',
        verificationSteps
      });

      // Start verification process
      await verifyComputation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load verification data";
      toast({
        title: "Verification Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyComputation = async () => {
    if (!verification || !publicClient) return;

    try {
      // Step 1: Verify enclave measurements
      await updateVerificationStep(0, async () => {
        const enclave = verification.attestation.enclave;
        // Verify against known good values
        const validMeasurement = enclave.mrenclave === "0xexpectedvalue";
        if (!validMeasurement) throw new Error("Invalid enclave measurement");
        return true;
      });

      // ... Rest of the verification steps remain the same ...

      setVerification(prev => prev ? {
        ...prev,
        status: 'verified'
      } : null);

      onVerificationComplete?.(true);

      toast({
        title: "Verification Complete",
        description: "All verification steps passed successfully",
        variant: "default",
      });
    } catch (error) {
      setVerification(prev => prev ? {
        ...prev,
        status: 'failed'
      } : null);

      onVerificationComplete?.(false);

      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Verification failed",
        variant: "destructive"
      });
    }
  };

  const updateVerificationStep = async (
    stepIndex: number,
    verificationFunction: () => Promise<boolean>
  ) => {
    try {
      const result = await verificationFunction();
      setVerification(prev => {
        if (!prev) return null;
        const newSteps = [...prev.verificationSteps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          status: result ? 'success' : 'failed'
        };
        return {
          ...prev,
          verificationSteps: newSteps
        };
      });
    } catch (error) {
      setVerification(prev => {
        if (!prev) return null;
        const newSteps = [...prev.verificationSteps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          status: 'failed',
          details: error instanceof Error ? error.message : "Step failed"
        };
        return {
          ...prev,
          verificationSteps: newSteps
        };
      });
      throw error;
    }
  };

  const parseAttestation = async (attestation: `0x${string}`): Promise<AttestationDetails> => {
    // Parse binary attestation into structured data
    // This is a placeholder implementation
    return {
      enclave: {
        mrenclave: "0x1234" as `0x${string}`,
        mrsigner: "0x5678" as `0x${string}`,
        isvprodid: 1,
        isvsvn: 1
      },
      timestamp: Date.now(),
      signature: "0xabcd" as `0x${string}`
    };
  };

  const getBadgeClass = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return "bg-green-500 hover:bg-green-600";
      case 'failed':
        return "bg-destructive hover:bg-destructive/90";
      default:
        return "bg-secondary hover:bg-secondary/80";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              ROFL Computation Verification
            </CardTitle>
            <CardDescription>
              Task ID: {taskId}
            </CardDescription>
          </div>
          {verification && (
            <Badge className={getBadgeClass(verification.status)}>
              {verification.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verification Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verification?.verificationSteps.map((step, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>
                      {step.status === 'success' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : step.status === 'failed' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-gray-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {step.details || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button
                onClick={() => setDetailedView(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                View Detailed Report
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={detailedView} onOpenChange={setDetailedView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detailed Verification Report</DialogTitle>
            <DialogDescription>
              Complete verification details and attestation information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Node Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Node ID:</span>
                      <br />
                      {verification?.nodeId}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Enclave Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">MRENCLAVE:</span>
                      <br />
                      {verification?.attestation.enclave.mrenclave}
                    </div>
                    <div>
                      <span className="font-medium">MRSIGNER:</span>
                      <br />
                      {verification?.attestation.enclave.mrsigner}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Attestation Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(verification?.attestation, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ROFLVerification;