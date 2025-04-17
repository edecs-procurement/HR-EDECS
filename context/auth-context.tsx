"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { ref, onValue, get } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: (User & { role?: string }) | null
  loading: boolean
  checkPageAccess: (path: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  checkPageAccess: async () => false,
})

export const useAuth = () => useContext(AuthContext)

// Default permissions for the system
const DEFAULT_PERMISSIONS: Record<string, { roles: string[]; path: string }> = {
  dashboard: { roles: ["user", "manager", "admin", "super admin"], path: "/" },
  employees: { roles: ["user", "manager", "admin", "super admin"], path: "/employees" },
  attendance: { roles: ["user", "manager", "admin", "super admin"], path: "/attendance" },
  payroll: { roles: ["manager", "admin", "super admin"], path: "/payroll" },
  leave: { roles: ["user", "manager", "admin", "super admin"], path: "/leave" },
  recruitment: { roles: ["manager", "admin", "super admin"], path: "/recruitment" },
  training: { roles: ["manager", "admin", "super admin"], path: "/training" },
  performance: { roles: ["manager", "admin", "super admin"], path: "/performance" },
  manpower: { roles: ["manager", "admin", "super admin"], path: "/manpower" },
  projects: { roles: ["manager", "admin", "super admin"], path: "/projects" },
  reports: { roles: ["manager", "admin", "super admin"], path: "/reports" },
  users: { roles: ["admin", "super admin"], path: "/users" },
  "admin/roles": { roles: ["admin", "super admin"], path: "/admin/roles" },
}

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/register", "/unauthorized", "/first-signup"]

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<(User & { role?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagePermissions, setPagePermissions] =
    useState<Record<string, { roles: string[]; path: string }>>(DEFAULT_PERMISSIONS)
  const router = useRouter()
  const pathname = usePathname()

  // Function to check if a user has access to a specific page
  const checkPageAccess = async (path: string): Promise<boolean> => {
    if (!user) return false

    // Super admin always has access to everything
    if (user.role === "super admin") return true

    // Public paths that don't require permissions
    if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return true

    // Find the matching page permission
    // First try exact path match
    let pageId = Object.keys(pagePermissions).find((key) => {
      return pagePermissions[key].path === path
    })

    // If no exact match, try prefix match
    if (!pageId) {
      pageId = Object.keys(pagePermissions).find((key) => {
        // Handle root path specially
        if (path === "/" && pagePermissions[key].path === "/") return true
        // For other paths, check if the current path starts with the permission path
        return path.startsWith(pagePermissions[key].path) && pagePermissions[key].path !== "/"
      })
    }

    // If still no match, default to allowing dashboard access
    if (!pageId && path === "/") {
      return true
    }

    // Check if user's role has access to this page
    return !!(pageId && user.role && pagePermissions[pageId].roles.includes(user.role))
  }

  // Load permissions when user is authenticated
  useEffect(() => {
    let permissionsListener: (() => void) | null = null

    // Only try to load permissions if user is authenticated
    if (user) {
      const permissionsRef = ref(rtdb, "system/pagePermissions")

      // Set up listener for permissions
      permissionsListener = onValue(
        permissionsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setPagePermissions(snapshot.val())
          } else {
            // If no permissions exist, use defaults
            setPagePermissions(DEFAULT_PERMISSIONS)
          }
        },
        (error) => {
          console.error("Error loading permissions:", error)
          // Use default permissions on error
          setPagePermissions(DEFAULT_PERMISSIONS)
        },
      )
    }

    // Clean up listener when component unmounts or user changes
    return () => {
      if (permissionsListener) {
        permissionsListener()
      }
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Set up a real-time listener for user data
          const userRef = ref(rtdb, `users/${authUser.uid}`)

          // One-time initial fetch to avoid delay
          const snapshot = await get(userRef)
          if (snapshot.exists()) {
            const userData = snapshot.val()
            setUser({
              ...authUser,
              role: userData.role || "user",
            })
          } else {
            setUser({
              ...authUser,
              role: "user", // Default role
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser({
            ...authUser,
            role: "user", // Default role on error
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)

      // Redirect logic - only redirect to login if not on a public path
      if (!authUser && !PUBLIC_PATHS.some((path) => pathname?.includes(path))) {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [pathname, router])

  // Check page access when path or user changes
  useEffect(() => {
    const checkAccess = async () => {
      // Skip access check for public paths
      if (PUBLIC_PATHS.some((path) => pathname?.includes(path))) {
        return
      }

      if (user && pathname) {
        try {
          const hasAccess = await checkPageAccess(pathname)

          if (!hasAccess) {
            // Redirect to unauthorized page
            router.push("/unauthorized")
          }
        } catch (error) {
          console.error("Error checking page access:", error)
        }
      }
    }

    if (!loading) {
      checkAccess()
    }
  }, [pathname, user, loading, router])

  return <AuthContext.Provider value={{ user, loading, checkPageAccess }}>{!loading && children}</AuthContext.Provider>
}
