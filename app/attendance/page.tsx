"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context-optimized"
import { db } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock, Filter, Download, Plus } from "lucide-react"

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  status: "present" | "absent" | "late" | "halfDay"
  workHours: number
  notes: string
}

export default function AttendancePage() {
  const { user, isPublicPath } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState<Date>(new Date())
  const [department, setDepartment] = useState<string>("all")
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
  })

  useEffect(() => {
    if (!user || isPublicPath) return

    const attendanceRef = ref(db, "attendance")
    const unsubscribe = onValue(
      attendanceRef,
      (snapshot) => {
        setLoading(true)
        if (snapshot.exists()) {
          const attendanceData = snapshot.val()
          const recordsList = Object.keys(attendanceData).map((key) => ({
            id: key,
            ...attendanceData[key],
          }))

          // All records
          setAttendanceRecords(recordsList)

          // Filter records for the selected date
          filterRecords(recordsList, date, department)
        } else {
          setAttendanceRecords([])
          setFilteredRecords([])
          setStats({
            present: 0,
            absent: 0,
            late: 0,
            onLeave: 0,
          })
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching attendance data:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, isPublicPath])

  const filterRecords = (records: AttendanceRecord[], selectedDate: Date, selectedDepartment: string) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd")

    // Filter by date
    let filtered = records.filter((record) => record.date === formattedDate)

    // Filter by department if not "all"
    if (selectedDepartment !== "all") {
      filtered = filtered.filter((record) => record.department === selectedDepartment)
    }

    setFilteredRecords(filtered)

    // Calculate stats
    const presentCount = filtered.filter((r) => r.status === "present").length
    const absentCount = filtered.filter((r) => r.status === "absent").length
    const lateCount = filtered.filter((r) => r.status === "late").length
    const onLeaveCount = filtered.filter((r) => r.status === "leave").length

    setStats({
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      onLeave: onLeaveCount,
    })
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      filterRecords(attendanceRecords, selectedDate, department)
    }
  }

  const handleDepartmentChange = (value: string) => {
    setDepartment(value)
    filterRecords(attendanceRecords, date, value)
  }

  const handleExport = () => {
    // Implementation for exporting attendance data
    alert("Export functionality will be implemented here")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Attendance & Time Tracking</h1>
        <p className="text-muted-foreground">Monitor employee attendance and working hours</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/attendance/record">
              <Button className="w-full gap-2">
                <Clock className="h-4 w-4" />
                Record Attendance
              </Button>
            </Link>
            <Link href="/attendance/report">
              <Button variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>Overview of today's attendance</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">{stats.present}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-red-600 text-2xl font-bold">{stats.absent}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-amber-600 text-2xl font-bold">{stats.late}</div>
              <div className="text-sm text-muted-foreground">Late</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 text-2xl font-bold">{stats.onLeave}</div>
              <div className="text-sm text-muted-foreground">On Leave</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Daily attendance records for employees</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>

            <Select value={department} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Department</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="project_management">Project Management</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>

            <Link href="/attendance/record">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No attendance records found for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : record.status === "late"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{record.workHours?.toFixed(2) || 0} hrs</TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                      <TableCell>
                        <Link href={`/attendance/edit/${record.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
