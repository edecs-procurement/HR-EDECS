"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarPlus, CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  department: string
  type: string
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: string
  appliedOn: Date
}

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true)
      try {
        let leaveQuery

        if (activeTab === "pending") {
          leaveQuery = query(collection(db, "leaves"), where("status", "==", "pending"), orderBy("appliedOn", "desc"))
        } else if (activeTab === "approved") {
          leaveQuery = query(collection(db, "leaves"), where("status", "==", "approved"), orderBy("appliedOn", "desc"))
        } else if (activeTab === "rejected") {
          leaveQuery = query(collection(db, "leaves"), where("status", "==", "rejected"), orderBy("appliedOn", "desc"))
        } else {
          leaveQuery = query(collection(db, "leaves"), orderBy("appliedOn", "desc"))
        }

        const snapshot = await getDocs(leaveQuery)

        // Get all employee IDs from leave requests
        const employeeIds = snapshot.docs.map((doc) => doc.data().employeeId)

        // Fetch employee details
        const employeesQuery = query(collection(db, "employees"))
        const employeesSnapshot = await getDocs(employeesQuery)

        // Create a map of employee IDs to employee details
        const employeeMap = new Map()
        employeesSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          employeeMap.set(doc.id, {
            name: data.name,
            department: data.department,
          })
        })

        // Map leave requests with employee details
        const requests = snapshot.docs.map((doc) => {
          const data = doc.data()
          const employee = employeeMap.get(data.employeeId) || { name: "Unknown", department: "" }

          return {
            id: doc.id,
            employeeId: data.employeeId,
            employeeName: employee.name,
            department: employee.department,
            type: data.type || "Annual Leave",
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            days: data.days || 1,
            reason: data.reason || "",
            status: data.status || "pending",
            appliedOn: data.appliedOn.toDate(),
          }
        })

        setLeaveRequests(requests)
      } catch (error) {
        console.error("Error fetching leave requests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveRequests()
  }, [activeTab])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>
      default:
        return <Badge className="bg-slate-500">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">Manage employee leave requests and balances</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/leave/request">
              <Button className="w-full gap-2">
                <CalendarPlus className="h-4 w-4" />
                Request Leave
              </Button>
            </Link>
            <Link href="/leave/balance">
              <Button variant="outline" className="w-full">
                View Leave Balance
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Leave Summary</CardTitle>
            <CardDescription>Overview of leave requests</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-amber-600 text-2xl font-bold">5</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-red-600 text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>View and manage employee leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>

            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Loading leave requests...
                      </TableCell>
                    </TableRow>
                  ) : leaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.employeeName}</TableCell>
                        <TableCell>{request.department}</TableCell>
                        <TableCell>{request.type}</TableCell>
                        <TableCell>{format(request.startDate, "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(request.endDate, "MMM dd, yyyy")}</TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <Link href={`/leave/${request.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
