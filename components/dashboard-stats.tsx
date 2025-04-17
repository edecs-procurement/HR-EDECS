"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar, Briefcase } from "lucide-react"

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    attendanceToday: 0,
    pendingLeaves: 0,
    openPositions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total employees
        const employeesSnapshot = await getDocs(collection(db, "employees"))
        const totalEmployees = employeesSnapshot.size

        // Get today's attendance
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const attendanceQuery = query(collection(db, "attendance"), where("date", ">=", today))
        const attendanceSnapshot = await getDocs(attendanceQuery)
        const attendanceToday = attendanceSnapshot.size

        // Get pending leaves
        const leavesQuery = query(collection(db, "leaves"), where("status", "==", "pending"))
        const leavesSnapshot = await getDocs(leavesQuery)
        const pendingLeaves = leavesSnapshot.size

        // Get open positions
        const positionsQuery = query(collection(db, "jobs"), where("status", "==", "open"))
        const positionsSnapshot = await getDocs(positionsQuery)
        const openPositions = positionsSnapshot.size

        setStats({
          totalEmployees,
          attendanceToday,
          pendingLeaves,
          openPositions,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Today's Attendance",
      value: stats.attendanceToday,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: Calendar,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
    {
      title: "Open Positions",
      value: stats.openPositions,
      icon: Briefcase,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`${stat.bgColor} p-2 rounded-full ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "Loading..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
