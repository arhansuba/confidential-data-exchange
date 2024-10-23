'use client'

import React from 'react'
import { ethers } from 'ethers'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, HelpCircle, Star } from 'lucide-react'

interface ModelCardProps {
  id: string
  name: string
  description: string
  price: string
  rating?: number
  totalRatings?: number
  creator: string
  onPurchase: (id: string) => void
}

export function ModelCardComponent({ 
  id, 
  name, 
  description, 
  price, 
  rating, 
  totalRatings, 
  creator, 
  onPurchase 
}: ModelCardProps) {
  const [isPurchasing, setIsPurchasing] = React.useState(false)

  const handlePurchase = async () => {
    setIsPurchasing(true)
    try {
      await onPurchase(id)
      // Simulating purchase process
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`${name} purchased successfully!`)
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          {rating !== undefined && totalRatings !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2">
                    <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                    {rating.toFixed(1)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average rating based on {totalRatings} reviews</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">{price} ETH</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Price in Ethereum</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Created by: {creator}</p>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">Purchase</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase {name}</DialogTitle>
              <DialogDescription>
                Are you sure you want to purchase this model for {price} ETH?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">
                Please ensure you have sufficient ETH in your wallet before confirming the purchase.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handlePurchase} disabled={isPurchasing}>
                {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}