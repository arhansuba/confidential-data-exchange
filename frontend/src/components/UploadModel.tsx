'use client'

import React, { useState } from 'react'
import { ethers } from 'ethers'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2 } from 'lucide-react'

// Define the form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Model name must be at least 3 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  category: z.string().min(1, { message: "Please select a category" }),
  file: z.instanceof(File).refine((file) => file.size <= 100 * 1024 * 1024, {
    message: "File size must be less than 100MB",
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function UploadModel() {
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsUploading(true)
    try {
      // Simulating blockchain interaction and file upload
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Here you would typically:
      // 1. Upload the file to IPFS or your preferred storage solution
      // 2. Get the CID or file hash
      // 3. Interact with your smart contract to mint the NFT representing the model

      // For demonstration, we're just logging the data
      console.log("Model data:", data)

      toast({
        title: "Model Uploaded Successfully",
        description: `Your model "${data.name}" has been uploaded and is pending review.`,
      })

      form.reset()
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your model. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload AI Model</CardTitle>
        <CardDescription>Share your AI model with the community. Please provide accurate information to help others discover and use your model.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your model name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a unique and descriptive name for your model.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your model's capabilities, use cases, and any other relevant information"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (ETH)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" min="0" placeholder="0.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set the price in ETH for using your model.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category for your model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nlp">Natural Language Processing</SelectItem>
                      <SelectItem value="cv">Computer Vision</SelectItem>
                      <SelectItem value="rl">Reinforcement Learning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Model File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".h5,.pkl,.onnx,.pt,.pb"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onChange(file)
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload your model file (max 100MB). Supported formats: .h5, .pkl, .onnx, .pt, .pb
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Model'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          Your model will be reviewed before being listed on the marketplace.
        </p>
      </CardFooter>
    </Card>
  )
}