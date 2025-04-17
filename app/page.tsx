"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import { DashboardStats } from "@/components/dashboard-stats"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { ModuleCard } from "@/components/module-card"
import {
  Users,
  Clock,
  DollarSign,
  CalendarDays,
  UserPlus,
  Briefcase,
  Award,
  Users2,
  FolderKanban,
  BarChart3,
  GraduationCap,
} from "lucide-react"

export default function Dashboard() {
  const { user, userRoles } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    employees: 0,
    attendance: 0,
    payroll: 0,
    leave: 0,
    recruitment: 0,
    projects: 0,
  })

  useEffect(() => {
    if (!user) return

    // Fetch dashboard stats
    const statsRef = ref(db, "stats")
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [user])

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">HR Management Dashboard</h1>

      <DashboardStats />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ModuleCard
          title="Employees"
          description="Manage employee information"
          icon={Users}
          count={stats.employees}
          path="/employees"
        />

        <ModuleCard
          title="Attendance"
          description="Track time and attendance"
          icon={Clock}
          count={stats.attendance}
          path="/attendance"
        />

        <ModuleCard
          title="Payroll"
          description="Process and manage payroll"
          icon={DollarSign}
          count={stats.payroll}
          path="/payroll"
        />

        <ModuleCard
          title="Leave Management"
          description="Handle leave requests"
          icon={CalendarDays}
          count={stats.leave}
          path="/leave"
        />

        <ModuleCard
          title="Recruitment"
          description="Manage hiring process"
          icon={UserPlus}
          count={stats.recruitment}
          path="/recruitment"
        />

        <ModuleCard title="Training" description="Manage training programs" icon={GraduationCap} path="/training" />

        <ModuleCard title="Performance" description="Evaluate employee performance" icon={Award} path="/performance" />

        <ModuleCard title="Manpower" description="Plan workforce requirements" icon={Users2} path="/manpower" />

        <ModuleCard
          title="Projects"
          description="Assign employees to projects"
          icon={FolderKanban}
          count={stats.projects}
          path="/projects"
        />

        <ModuleCard title="Reports" description="View analytics and reports" icon={BarChart3} path="/reports" />

        {userRoles?.admin && (
          <ModuleCard
            title="User Management"
            description="Manage system users"
            icon={Briefcase}
            path="/users"
            color="text-blue-500"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
