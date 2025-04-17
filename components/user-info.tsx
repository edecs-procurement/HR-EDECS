"use client"

import { useAuth } from "@/context/auth-context-optimized"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function UserInfo() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "super admin":
        return "bg-red-500"
      case "admin":
        return "bg-orange-500"
      case "manager":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>User Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback>{getInitials(user.displayName || "User")}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-medium leading-none">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center pt-1">
              <Badge className={getRoleColor(user.role || "user")}>{user.role || "User"}</Badge>
              {user.department && (
                <Badge variant="outline" className="ml-2">
                  {user.department}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
