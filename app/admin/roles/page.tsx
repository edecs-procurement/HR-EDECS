"use client"

import { useState, useEffect } from "react"
import { ref, onValue, set } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PagePermission {
  id: string
  path: string
  title: string
  roles: string[]
}

interface Role {
  id: string
  name: string
}

// Default permissions to use when initializing
const DEFAULT_PERMISSIONS = {
  dashboard: { roles: ["user", "manager", "admin", "super admin"], path: "/" },
  users: { roles: ["admin", "super admin"], path: "/users" },
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
  "admin/roles": { roles: ["admin", "super admin"], path: "/admin/roles" },
}

// System pages definition
const SYSTEM_PAGES = [
  { id: "dashboard", path: "/", title: "Dashboard" },
  { id: "users", path: "/users", title: "User Management" },
  { id: "employees", path: "/employees", title: "Employee Management" },
  { id: "attendance", path: "/attendance", title: "Attendance & Time" },
  { id: "payroll", path: "/payroll", title: "Payroll" },
  { id: "leave", path: "/leave", title: "Leave Management" },
  { id: "recruitment", path: "/recruitment", title: "Recruitment" },
  { id: "training", path: "/training", title: "Training & Development" },
  { id: "performance", path: "/performance", title: "Performance Evaluation" },
  { id: "manpower", path: "/manpower", title: "Manpower Management" },
  { id: "projects", path: "/projects", title: "Project Assignment" },
  { id: "reports", path: "/reports", title: "Reports & Analytics" },
  { id: "admin/roles", path: "/admin/roles", title: "Role Management" },
]

// Available roles definition
const AVAILABLE_ROLES = [
  { id: "user", name: "User" },
  { id: "manager", name: "Manager" },
  { id: "admin", name: "Admin" },
  { id: "super admin", name: "Super Admin" },
]

export default function RolesManagementPage() {
  const [pages, setPages] = useState<PagePermission[]>([])
  const [roles, setRoles] = useState<Role[]>(AVAILABLE_ROLES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin" && user.role !== "super admin") {
      router.push("/")
      return
    }

    setLoading(true)

    // Set up real-time listener for page permissions
    const permissionsRef = ref(rtdb, "system/pagePermissions")
    const unsubscribe = onValue(
      permissionsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const permissionsData = snapshot.val()

            // Map the data to our format
            const pagesWithPermissions = SYSTEM_PAGES.map((page) => {
              return {
                ...page,
                roles: permissionsData[page.id]?.roles || ["admin", "super admin"], // Default to admin access
              }
            })

            setPages(pagesWithPermissions)
            setHasUnsavedChanges(false)
          } else {
            // If no permissions document exists, create default permissions
            const defaultPermissions = SYSTEM_PAGES.map((page) => {
              // Set default permissions based on page type
              let defaultRoles = ["admin", "super admin"]
              if (
                page.id === "dashboard" ||
                page.id === "employees" ||
                page.id === "attendance" ||
                page.id === "leave"
              ) {
                defaultRoles = ["user", "manager", "admin", "super admin"]
              } else if (page.id !== "users" && page.id !== "admin/roles") {
                defaultRoles = ["manager", "admin", "super admin"]
              }

              return {
                ...page,
                roles: defaultRoles,
              }
            })

            setPages(defaultPermissions)
            setHasUnsavedChanges(true)
          }
        } catch (error) {
          console.error("Error processing permissions data:", error)
          setError("Failed to load page permissions. Using default permissions.")

          // Use default permissions on error
          const defaultPermissions = SYSTEM_PAGES.map((page) => {
            // Get default roles from our DEFAULT_PERMISSIONS object
            const defaultRoles = DEFAULT_PERMISSIONS[page.id]?.roles || ["admin", "super admin"]

            return {
              ...page,
              roles: defaultRoles,
            }
          })

          setPages(defaultPermissions)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error("Error fetching permissions:", error)
        setError("Failed to load permissions. Please try again.")

        // Use default permissions on error
        const defaultPermissions = SYSTEM_PAGES.map((page) => {
          const defaultRoles = DEFAULT_PERMISSIONS[page.id]?.roles || ["admin", "super admin"]
          return {
            ...page,
            roles: defaultRoles,
          }
        })

        setPages(defaultPermissions)
        setLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [user, router])

  const handleRoleToggle = (pageId: string, roleId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          const hasRole = page.roles.includes(roleId)

          if (hasRole) {
            // Don't allow removing all roles or removing super admin from any page
            if (roleId === "super admin" || (page.roles.length === 1 && page.roles[0] === roleId)) {
              return page
            }
            return { ...page, roles: page.roles.filter((r) => r !== roleId) }
          } else {
            return { ...page, roles: [...page.roles, roleId] }
          }
        }
        return page
      }),
    )
    setHasUnsavedChanges(true)
  }

  const savePermissions = async () => {
    setSaving(true)
    setError("")

    try {
      // Convert pages array to object format for Realtime Database
      const permissionsObject: Record<string, { roles: string[]; path: string }> = {}

      pages.forEach((page) => {
        permissionsObject[page.id] = {
          roles: page.roles,
          path: page.path, // Add path to make lookups easier
        }
      })

      // Save to Realtime Database
      await set(ref(rtdb, "system/pagePermissions"), permissionsObject)

      toast({
        title: "Permissions saved",
        description: "Page permissions have been updated successfully.",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error saving permissions:", error)
      setError("Failed to save permissions.")

      toast({
        title: "Error saving permissions",
        description: "Changes couldn't be saved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading permissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Page Permissions Management</h1>
        <p className="text-muted-foreground">Control which roles can access specific pages in the system</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasUnsavedChanges && (
        <Alert>
          <AlertDescription>You have unsaved changes. Don't forget to save.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Page Permissions</CardTitle>
            <CardDescription>Manage access to system pages by role</CardDescription>
          </div>
          <Button onClick={savePermissions} disabled={saving || !hasUnsavedChanges} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Path</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="text-muted-foreground">{page.path}</TableCell>
                    {roles.map((role) => (
                      <TableCell key={role.id} className="text-center">
                        <Checkbox
                          checked={page.roles.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(page.id, role.id)}
                          // Disable checkbox for super admin role to ensure they always have access
                          disabled={role.id === "super admin"}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Note: Super Admin role always has access to all pages and cannot be removed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
