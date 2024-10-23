'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import ModelCard from './ModelCard'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Search } from 'lucide-react'

// Mock data for demonstration
const mockModels = [
  { id: '1', name: 'GPT-4', description: 'Advanced language model', price: '0.1', rating: 4.8, totalRatings: 120, creator: '0x1234...5678' },
  { id: '2', name: 'DALL-E 3', description: 'Image generation model', price: '0.2', rating: 4.6, totalRatings: 85, creator: '0x2345...6789' },
  { id: '3', name: 'Whisper', description: 'Speech recognition model', price: '0.05', rating: 4.5, totalRatings: 60, creator: '0x3456...7890' },
  { id: '4', name: 'Stable Diffusion', description: 'Text-to-image model', price: '0.15', rating: 4.7, totalRatings: 95, creator: '0x4567...8901' },
  { id: '5', name: 'AlphaFold', description: 'Protein structure prediction', price: '0.25', rating: 4.9, totalRatings: 110, creator: '0x5678...9012' },
  { id: '6', name: 'BERT', description: 'NLP model for various tasks', price: '0.08', rating: 4.4, totalRatings: 75, creator: '0x6789...0123' },
]

interface Model {
  id: string
  name: string
  description: string
  price: string
  rating: number
  totalRatings: number
  creator: string
}

export default function Marketplace() {
  const [models, setModels] = useState<Model[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [currentPage, setCurrentPage] = useState(1)
  const modelsPerPage = 6

  const { toast } = useToast()

  useEffect(() => {
    // Simulating API call to fetch models
    const fetchModels = async () => {
      try {
        // In a real application, you would fetch data from your API or smart contract here
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulating network delay
        setModels(mockModels)
        setFilteredModels(mockModels)
      } catch (error) {
        console.error('Error fetching models:', error)
        toast({
          title: "Error",
          description: "Failed to load models. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [toast])

  useEffect(() => {
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'price') return parseFloat(a.price) - parseFloat(b.price)
      return 0
    })
    setFilteredModels(sorted)
    setCurrentPage(1)
  }, [searchTerm, sortBy, models])

  const handlePurchase = async (id: string) => {
    setIsLoading(true)
    try {
      // Simulating blockchain interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would typically:
      // 1. Connect to the user's wallet (e.g., MetaMask)
      // 2. Call your smart contract's purchase function
      // 3. Wait for the transaction to be mined
      // 4. Update the UI based on the transaction result

      toast({
        title: "Purchase Successful",
        description: `You have successfully purchased the model with ID: ${id}`,
      })
    } catch (error) {
      console.error('Purchase failed:', error)
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const indexOfLastModel = currentPage * modelsPerPage
  const indexOfFirstModel = indexOfLastModel - modelsPerPage
  const currentModels = filteredModels.slice(indexOfFirstModel, indexOfLastModel)
  const totalPages = Math.ceil(filteredModels.length / modelsPerPage)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Model Marketplace</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
          <CardDescription>Find the perfect AI model for your needs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search models..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentModels.map((model) => (
              <ModelCard
                key={model.id}
                id={model.id}
                name={model.name}
                description={model.description}
                price={model.price}
                rating={model.rating}
                totalRatings={model.totalRatings}
                creator={model.creator}
                onPurchase={handlePurchase}
              />
            ))}
          </div>

          {filteredModels.length > modelsPerPage && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setCurrentPage(index + 1)}
                      isActive={currentPage === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}