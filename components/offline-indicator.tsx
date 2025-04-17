"use client"
import { WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"

export function OfflineIndicator() {
  const { isOffline } = useAuth()

  if (!isOffline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 shadow-lg">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-600">
          You are currently offline. Some features may be limited.
        </AlertDescription>
      </Alert>
    </div>
  )
}
