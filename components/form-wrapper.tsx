"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

interface FormWrapperProps {
  title: string
  description: string
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  isSubmitting?: boolean
  backUrl?: string
  submitLabel?: string
}

export function FormWrapper({
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  backUrl = "/",
  submitLabel = "Submit",
}: FormWrapperProps) {
  const router = useRouter()

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push(backUrl)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
