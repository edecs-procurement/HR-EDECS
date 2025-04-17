"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { ref, onValue, get } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: (User & { role?: string }) | null
  loading: boolean
  isPublicPath: boolean
  permissions: Record<string, boolean> | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPublicPath: false,
  permissions: null,
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/register", "/unauthorized", "/first-signup"]

// Helper function to check if a path is public
const isPathPublic = (path: string | null): boolean => {
  if (!path) return false
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<(User & { role?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Check if current path is public
  const isPublicPath = useMemo(() => isPathPublic(pathname), [pathname])

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // On public paths, just set the basic user without fetching additional data
        setUser(authUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch user data and permissions only when needed (not on public paths)
  useEffect(() => {
    // Skip fetching user data on public paths
    if (isPublicPath || !user) {
      return () => {}
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userRef = ref(rtdb, `users/${user.uid}`)
        const snapshot = await get(userRef)

        if (snapshot.exists()) {
          const userData = snapshot.val()
          setUser((prevUser) => ({
            ...prevUser!,
            role: userData.role || "user",
          }))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()

    // Fetch permissions
    const permissionsRef = ref(rtdb, "system/pagePermissions")
    const permissionsUnsubscribe = onValue(
      permissionsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const pagePermissions = snapshot.val()
            const userPermissions: Record<string, boolean> = {}

            for (const pageId in pagePermissions) {
              const page = pagePermissions[pageId]
              if (user.role) {
                userPermissions[pageId + ".view"] = page.roles.includes(user.role)
              }
            }

            setPermissions(userPermissions)
          } else {
            setPermissions({})
          }
        } catch (error) {
          console.error("Error processing permissions:", error)
          setPermissions({})
        }
      },
      (error) => {
        console.error("Error loading permissions:", error)
        setPermissions({})
      },
    )

    return () => {
      permissionsUnsubscribe()
    }
  }, [user, isPublicPath])

  // Handle redirects
  useEffect(() => {
    if (!loading && !isPublicPath && !user) {
      router.push("/login")
    }
  }, [loading, user, router, isPublicPath])

  return (
    <AuthContext.Provider value={{ user, loading, isPublicPath, permissions, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
