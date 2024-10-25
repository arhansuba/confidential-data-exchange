'use client'

import { SetStateAction, useState } from 'react'
import { ethers } from 'ethers'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, DollarSign, User } from 'lucide-react'

// Mock data for demonstration purposes
const mockModels = [
  { id: 1, name: "GPT-4", price: "0.1 ETH", description: "Advanced language model" },
  { id: 2, name: "DALL-E 3", price: "0.2 ETH", description: "Image generation model" },
  { id: 3, name: "Whisper", price: "0.05 ETH", description: "Speech recognition model" },
]

export default function ConfidentialAIExchange() {
  const [modelName, setModelName] = useState('')
  const [modelDescription, setModelDescription] = useState('')
  const [modelPrice, setModelPrice] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [selectedModel, setSelectedModel] = useState<{ id: number; name: string; price: string; description: string } | null>(null)

  const handleModelUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    // Simulating upload process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsUploading(false)
    // Reset form
    setModelName('')
    setModelDescription('')
    setModelPrice('')
    alert('Model uploaded successfully!')
  }

  const handleModelPurchase = async (model: { id: number; name: string; price: string; description: string }) => {
    setSelectedModel(model)
    setIsPurchasing(true)
    // Simulating purchase process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsPurchasing(false)
    if (model) {
      alert(`${model.name} purchased successfully!`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Confidential AI Exchange</h1>
      
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="upload">Upload Model</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle>{model.name}</CardTitle>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{model.price}</p>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">Purchase</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Purchase {model.name}</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to purchase this model for {model.price}?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button onClick={() => handleModelPurchase(model)} disabled={isPurchasing}>
                          {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your AI Model</CardTitle>
              <CardDescription>Provide details about your AI model to list it on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleModelUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    placeholder="Enter model name"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelDescription">Model Description</Label>
                  <Input
                    id="modelDescription"
                    placeholder="Describe your model"
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelPrice">Price (ETH)</Label>
                  <Input
                    id="modelPrice"
                    type="number"
                    step="0.01"
                    placeholder="Set your price in ETH"
                    value={modelPrice}
                    onChange={(e) => setModelPrice(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload Model'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>User Dashboard</CardTitle>
              <CardDescription>Manage your models and view transaction history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Your Uploaded Models</h3>
                  <p className="text-sm text-gray-500">You haven't uploaded any models yet.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Transaction History</h3>
                  <p className="text-sm text-gray-500">No transactions to display.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}