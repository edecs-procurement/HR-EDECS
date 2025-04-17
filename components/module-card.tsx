"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface ModuleCardProps {
  title: string
  description: string
  icon: LucideIcon
  count?: number
  path: string
  color?: string
}

export function ModuleCard({ title, description, icon: Icon, count, path, color = "text-primary" }: ModuleCardProps) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{count !== undefined && <div className="text-2xl font-bold">{count}</div>}</CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(path)}>
          Manage
        </Button>
      </CardFooter>
    </Card>
  )
}
