'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useToast } from "../hooks/use-toast"

interface Model {
  id: number;
  name: string;
  price: string;
  status: 'Active' | 'Pending Evaluation' | 'Inactive';
  evaluationScore: number | null;
}

interface Transaction {
  id: number;
  type: 'Sale' | 'Purchase';
  model: string;
  amount: string;
  date: string;
}

// Mock data for demonstration
const mockUploadedModels: Model[] = [
  { id: 1, name: "Sentiment Analyzer", price: "0.05", status: "Active", evaluationScore: 8.5 },
  { id: 2, name: "Image Classifier", price: "0.1", status: "Pending Evaluation", evaluationScore: null },
  { id: 3, name: "Text Summarizer", price: "0.08", status: "Inactive", evaluationScore: 7.2 },
]

const mockTransactions: Transaction[] = [
  { id: 1, type: "Sale", model: "Sentiment Analyzer", amount: "0.05", date: "2023-04-15" },
  { id: 2, type: "Purchase", model: "GPT-4", amount: "0.2", date: "2023-04-10" },
  { id: 3, type: "Sale", model: "Text Summarizer", amount: "0.08", date: "2023-04-05" },
]

type ModelAction = 'activate' | 'deactivate' | 'evaluate' | 'viewEvaluation';

export default function Dashboard() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  const handleModelAction = async (model: Model, action: ModelAction) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to perform this action",
      })
      return
    }

    try {
      setSelectedModel(model)
      
      switch (action) {
        case 'activate':
          // Implement activation logic
          toast({
            title: "Model Activated",
            description: `${model.name} has been activated successfully`
          })
          break

        case 'deactivate':
          // Implement deactivation logic
          toast({
            title: "Model Deactivated",
            description: `${model.name} has been deactivated successfully`
          })
          break

        case 'evaluate':
          // Implement evaluation request logic
          toast({
            title: "Evaluation Requested",
            description: `Evaluation requested for ${model.name}`
          })
          break

        case 'viewEvaluation':
          // Implement evaluation details view logic
          toast({
            title: "Evaluation Details",
            description: `Viewing evaluation details for ${model.name}`
          })
          break
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Something went wrong"
      })
    }
  }

  const formatPrice = (price: string): string => {
    try {
      return `${price} ETH`
    } catch (error) {
      return price
    }
  }

  const getBadgeVariant = (status: Model['status'] | Transaction['type']) => {
    switch (status) {
      case 'Active':
      case 'Sale':
        return 'default'
      case 'Inactive':
      case 'Purchase':
        return 'secondary'
      case 'Pending Evaluation':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">My Models</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Models</CardTitle>
              <CardDescription>Manage your AI models and their statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Evaluation Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUploadedModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{formatPrice(model.price)}</TableCell>
                      <TableCell>
                        <Badge>
                          {model.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {model.evaluationScore ? (
                          <span className="flex items-center">
                            {model.evaluationScore}
                            <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                          </span>
                        ) : (
                          <span className="flex items-center text-muted-foreground">
                            Pending
                            <HelpCircle className="ml-2 h-4 w-4" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>Manage</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage {model.name}</DialogTitle>
                              <DialogDescription>
                                Update the status or request an evaluation for your model.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2">
                              <Button
                                className="outline"
                                onClick={() => handleModelAction(model, 'deactivate')}
                                disabled={model.status !== 'Active'}
                              >
                                Deactivate
                              </Button>
                              <Button
                                onClick={() => handleModelAction(model, 'activate')}
                                disabled={model.status === 'Active'}
                              >
                                Activate
                              </Button>
                              <Button
                                onClick={() => handleModelAction(model, 'evaluate')}
                                disabled={model.status === 'Pending Evaluation'}
                              >
                                Request Evaluation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View your recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.model}</TableCell>
                      <TableCell>{formatPrice(transaction.amount)}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Model Evaluations</CardTitle>
              <CardDescription>View and manage your model evaluation results.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Evaluation Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUploadedModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>
                        {model.evaluationScore ? (
                          <span className="flex items-center">
                            {model.evaluationScore}
                            <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                          </span>
                        ) : (
                          <span className="flex items-center text-muted-foreground">
                            Pending
                            <HelpCircle className="ml-2 h-4 w-4" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {model.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleModelAction(model, 'viewEvaluation')}
                          disabled={!model.evaluationScore}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}