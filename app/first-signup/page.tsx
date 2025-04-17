"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { ref, set } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function FirstSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const router = useRouter()

  // Instead of checking for existing users, we'll assume this is the first signup
  // and handle errors appropriately if users already exist

  const handleFirstSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, { displayName: name })

      // Create user document in Realtime Database with super admin role
      await set(ref(rtdb, `users/${user.uid}`), {
        name,
        email,
        role: "super admin", // First user is always super admin
        createdAt: new Date().toISOString(),
      })

      // Create default page permissions
      await set(ref(rtdb, "system/pagePermissions"), getDefaultPermissions())

      // Set system initialization flag
      await set(ref(rtdb, "system/initialized"), {
        initialized: true,
        initializedAt: new Date().toISOString(),
        initializedBy: user.uid,
      })

      // Redirect to dashboard
      router.push("/")
    } catch (error: any) {
      console.error("Error creating first user:", error)

      // Handle specific error cases
      if (error.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please use the login page.")
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(error.message || "Failed to create account")
      }
    } finally {
      setLoading(false)
    }
  }

  // Default permissions for the system
  const getDefaultPermissions = () => {
    return {
      dashboard: {
        path: "/",
        roles: ["user", "manager", "admin", "super admin"],
      },
      users: {
        path: "/users",
        roles: ["admin", "super admin"],
      },
      employees: {
        path: "/employees",
        roles: ["user", "manager", "admin", "super admin"],
      },
      attendance: {
        path: "/attendance",
        roles: ["user", "manager", "admin", "super admin"],
      },
      payroll: {
        path: "/payroll",
        roles: ["manager", "admin", "super admin"],
      },
      leave: {
        path: "/leave",
        roles: ["user", "manager", "admin", "super admin"],
      },
      recruitment: {
        path: "/recruitment",
        roles: ["manager", "admin", "super admin"],
      },
      training: {
        path: "/training",
        roles: ["manager", "admin", "super admin"],
      },
      performance: {
        path: "/performance",
        roles: ["manager", "admin", "super admin"],
      },
      manpower: {
        path: "/manpower",
        roles: ["manager", "admin", "super admin"],
      },
      projects: {
        path: "/projects",
        roles: ["manager", "admin", "super admin"],
      },
      reports: {
        path: "/reports",
        roles: ["manager", "admin", "super admin"],
      },
      "admin/roles": {
        path: "/admin/roles",
        roles: ["admin", "super admin"],
      },
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">System Initialization</CardTitle>
          <CardDescription>Create the first admin account to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleFirstSignup}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription>
                You are creating the first user account. This account will have full administrative privileges.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating admin account..." : "Create Admin Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
