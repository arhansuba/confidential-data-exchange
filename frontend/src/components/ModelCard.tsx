import React, { useState } from 'react';
import { ethers } from 'ethers';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Lock, 
  ExternalLink, 
  Edit,
  AlertCircle,
  Download,
  Activity
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export interface ModelCardProps {
  id: number;
  owner: string;
  modelHash: string;
  price: ethers.BigNumber;
  isActive: boolean;
  decryptedMetadata?: {
    name: string;
    description: string;
    architecture: string;
    performance?: {
      accuracy: number;
      latency: number;
    };
  };
  hasAccess: boolean;
  onPurchase: (id: number, price: ethers.BigNumber) => Promise<void>;
  onUpdatePrice?: (id: number, newPrice: string) => Promise<void>;
  onDeactivate?: (id: number) => Promise<void>;
}

const ModelCard: React.FC<ModelCardProps> = ({
  id,
  owner,
  modelHash,
  price,
  isActive,
  decryptedMetadata,
  hasAccess,
  onPurchase,
  onUpdatePrice,
  onDeactivate
}) => {
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const isOwner = owner === window.ethereum?.selectedAddress;

  const handlePurchase = async () => {
    try {
      await onPurchase(id, price);
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = async () => {
    if (!onUpdatePrice) return;
    
    try {
      setIsUpdating(true);
      await onUpdatePrice(id, newPrice);
      setNewPrice("");
      toast({
        title: "Price Updated",
        description: "Model price has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              {decryptedMetadata?.name || `Model #${id}`}
              {hasAccess && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="ml-2">
                        <Lock className="h-3 w-3 mr-1" />
                        Access Granted
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      You have access to download and use this model
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <CardDescription>
              {decryptedMetadata?.description || "Encrypted model description"}
            </CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Architecture:</span>
            <span className="font-medium">
              {decryptedMetadata?.architecture || "Encrypted"}
            </span>
          </div>

          {decryptedMetadata?.performance && (
            <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <div>
                  <div className="text-sm font-medium">
                    {decryptedMetadata.performance.accuracy}%
                  </div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <div className="text-sm font-medium">
                    {decryptedMetadata.performance.latency}ms
                  </div>
                  <div className="text-xs text-gray-500">Latency</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Model Hash: {modelHash.slice(0, 6)}...{modelHash.slice(-4)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto space-x-2">
        <div className="flex-1">
          <span className="text-2xl font-bold">
            {ethers.utils.formatEther(price)} ETH
          </span>
        </div>
        
        {isOwner ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Model Price</DialogTitle>
                <DialogDescription>
                  Enter the new price for your model.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">New Price (ETH)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => onDeactivate?.(id)}
                  disabled={!isActive}
                >
                  {isActive ? "Deactivate" : "Deactivated"}
                </Button>
                <Button onClick={handleUpdatePrice} disabled={isUpdating}>
                  Update Price
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : hasAccess ? (
          <Button variant="default">
            <Download className="h-4 w-4 mr-2" />
            Download Model
          </Button>
        ) : (
          <Button variant="default" onClick={handlePurchase}>
            Purchase Access
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ModelCard;