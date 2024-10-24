import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  CPU,
  Activity,
  Key
} from 'lucide-react';

interface VerificationProps {
  contractAddress: string;
  taskId: number;
  onVerificationComplete?: (status: boolean) => void;
}

interface AttestationDetails {
  enclave: {
    mrenclave: string;
    mrsigner: string;
    isvprodid: number;
    isvsvn: number;
  };
  timestamp: number;
  signature: string;
}

interface ComputeVerification {
  taskId: number;
  nodeId: string;
  attestation: AttestationDetails;
  resultHash: string;
  status: 'pending' | 'verified' | 'failed';
  verificationSteps: {
    step: string;
    status: 'pending' | 'success' | 'failed';
    details?: string;
  }[];
}

const ROFLVerification: React.FC<VerificationProps> = ({
  contractAddress,
  taskId,
  onVerificationComplete
}) => {
  const [verification, setVerification] = useState<ComputeVerification | null>(null);
  const [detailedView, setDetailedView] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize contract and load verification data
  useEffect(() => {
    loadVerificationData();
  }, [taskId]);

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      
      // Initialize contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function getComputeTask(uint256 taskId) view returns (tuple(address node, bytes attestation, bytes32 resultHash, uint8 status))",
          "function verifyAttestation(bytes attestation) view returns (bool)",
          "function getEnclaveInfo(bytes attestation) view returns (tuple(bytes32 mrenclave, bytes32 mrsigner, uint16 isvprodid, uint16 isvsvn))"
        ],
        provider
      );

      // Get task data
      const taskData = await contract.getComputeTask(taskId);
      
      // Parse attestation
      const attestationDetails = await parseAttestation(taskData.attestation);
      
      // Initialize verification steps
      const verificationSteps = [
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
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyComputation = async () => {
    if (!verification) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, [], provider);

      // Step 1: Verify enclave measurements
      await updateVerificationStep(0, async () => {
        const enclave = verification.attestation.enclave;
        // Verify against known good values
        const validMeasurement = enclave.mrenclave === "expected_value";
        if (!validMeasurement) throw new Error("Invalid enclave measurement");
        return true;
      });

      // Step 2: Verify attestation signature
      await updateVerificationStep(1, async () => {
        const validSignature = await contract.verifyAttestation(
          verification.attestation.signature
        );
        if (!validSignature) throw new Error("Invalid attestation signature");
        return true;
      });

      // Step 3: Verify computation environment
      await updateVerificationStep(2, async () => {
        const enclaveInfo = await contract.getEnclaveInfo(
          verification.attestation.signature
        );
        // Verify environment configuration
        const validEnvironment = verifyEnvironmentConfig(enclaveInfo);
        if (!validEnvironment) throw new Error("Invalid computation environment");
        return true;
      });

      // Step 4: Verify result hash
      await updateVerificationStep(3, async () => {
        // Verify result hash matches attestation
        const validHash = verification.resultHash === "expected_hash";
        if (!validHash) throw new Error("Invalid result hash");
        return true;
      });

      setVerification(prev => prev ? {
        ...prev,
        status: 'verified'
      } : null);

      onVerificationComplete?.(true);

      toast({
        title: "Verification Complete",
        description: "All verification steps passed successfully",
      });
    } catch (error) {
      setVerification(prev => prev ? {
        ...prev,
        status: 'failed'
      } : null);

      onVerificationComplete?.(false);

      toast({
        title: "Verification Failed",
        description: error.message,
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
          details: error.message
        };
        return {
          ...prev,
          verificationSteps: newSteps
        };
      });
      throw error;
    }
  };

  const verifyEnvironmentConfig = (enclaveInfo: any): boolean => {
    // Verify enclave configuration against expected values
    return true; // Implement actual verification logic
  };

  const parseAttestation = async (attestation: string): Promise<AttestationDetails> => {
    // Parse binary attestation into structured data
    // This is a placeholder implementation
    return {
      enclave: {
        mrenclave: "mrenclave_value",
        mrsigner: "mrsigner_value",
        isvprodid: 1,
        isvsvn: 1
      },
      timestamp: Date.now(),
      signature: "signature_value"
    };
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
          <Badge 
            variant={
              verification?.status === 'verified' ? "success" :
              verification?.status === 'failed' ? "destructive" :
              "secondary"
            }
          >
            {verification?.status.toUpperCase()}
          </Badge>
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
                    <TableCell className="text-sm text-gray-500">
                      {step.details || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDetailedView(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
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
                    <CPU className="h-4 w-4" />
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