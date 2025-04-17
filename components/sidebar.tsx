"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  UserPlus,
  Briefcase,
  Award,
  Users2,
  FolderKanban,
  BarChart3,
  GraduationCap,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context-optimized"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  requiredPermission?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: <Users className="h-5 w-5" />,
    requiredPermission: "employees.view",
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: <Clock className="h-5 w-5" />,
    requiredPermission: "attendance.view",
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: <DollarSign className="h-5 w-5" />,
    requiredPermission: "payroll.view",
  },
  {
    title: "Leave Management",
    href: "/leave",
    icon: <Calendar className="h-5 w-5" />,
    requiredPermission: "leave.view",
  },
  {
    title: "Recruitment",
    href: "/recruitment",
    icon: <UserPlus className="h-5 w-5" />,
    requiredPermission: "recruitment.view",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: <Briefcase className="h-5 w-5" />,
    requiredPermission: "projects.view",
  },
  {
    title: "Performance",
    href: "/performance",
    icon: <Award className="h-5 w-5" />,
    requiredPermission: "performance.view",
  },
  {
    title: "Training",
    href: "/training",
    icon: <GraduationCap className="h-5 w-5" />,
    requiredPermission: "training.view",
  },
  {
    title: "Manpower",
    href: "/manpower",
    icon: <Users2 className="h-5 w-5" />,
    requiredPermission: "manpower.view",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <FolderKanban className="h-5 w-5" />,
    requiredPermission: "reports.view",
  },
  {
    title: "Users",
    href: "/users",
    icon: <Users className="h-5 w-5" />,
    requiredPermission: "users.view",
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: <Settings className="h-5 w-5" />,
    requiredPermission: "roles.view",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, permissions, isPublicPath, logout } = useAuth()

  // Don't render sidebar on public paths
  if (isPublicPath) {
    return null
  }

  // Don't try to check permissions on public paths
  const isAuthenticated = !!user

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter((item) => {
    // If no permission required, show the item
    if (!item.requiredPermission) return true

    // If user has super admin role, show all items
    if (user?.role === "super admin") return true

    // If authenticated and has permission, show the item
    if (isAuthenticated && permissions && permissions[item.requiredPermission]) {
      return true
    }

    // Otherwise, don't show the item
    return false
  })

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-6 w-6" />
          <span>Construction HR</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      {isAuthenticated && (
        <div className="mt-auto border-t p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role || "User"}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      )}
    </div>
  )
}
