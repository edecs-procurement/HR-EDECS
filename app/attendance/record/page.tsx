"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context-optimized"
import { db } from "@/lib/firebase"
import { ref, push, set, onValue } from "firebase/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Employee {
  id: string
  name: string
  department: string
  position: string
}

export default function RecordAttendancePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [status, setStatus] = useState("present")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!user) return

    const employeesRef = ref(db, "employees")
    const unsubscribe = onValue(
      employeesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const employeesData = snapshot.val()
          const employeesList = Object.keys(employeesData).map((key) => ({
            id: key,
            ...employeesData[key],
          }))
          setEmployees(employeesList)
        } else {
          setEmployees([])
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching employees:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  const calculateWorkHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0

    const [inHours, inMinutes] = checkIn.split(":").map(Number)
    const [outHours, outMinutes] = checkOut.split(":").map(Number)

    const inTime = inHours * 60 + inMinutes
    const outTime = outHours * 60 + outMinutes

    // If checkout is earlier than checkin, assume next day
    const diffMinutes = outTime >= inTime ? outTime - inTime : 24 * 60 - inTime + outTime

    return Number.parseFloat((diffMinutes / 60).toFixed(2))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee || !date) {
      toast({
        title: "Error",
        description: "Please select an employee and date",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const selectedEmployeeData = employees.find((emp) => emp.id === selectedEmployee)
      const workHours = calculateWorkHours(checkIn, checkOut)

      const attendanceData = {
        employeeId: selectedEmployee,
        employeeName: selectedEmployeeData?.name || "Unknown",
        department: selectedEmployeeData?.department || "Unknown",
        date: format(date, "yyyy-MM-dd"),
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status,
        workHours,
        notes,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
      }

      const newAttendanceRef = push(ref(db, "attendance"))
      await set(newAttendanceRef, attendanceData)

      toast({
        title: "Success",
        description: "Attendance record created successfully",
      })

      router.push("/attendance")
    } catch (error) {
      console.error("Error creating attendance record:", error)
      toast({
        title: "Error",
        description: "Failed to create attendance record",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Record Attendance</CardTitle>
          <CardDescription>Create a new attendance record for an employee</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading employees...
                    </SelectItem>
                  ) : employees.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No employees found
                    </SelectItem>
                  ) : (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check In Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input id="checkIn" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOut">Check Out Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input id="checkOut" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="halfDay">Half Day</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes here"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/attendance")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Record"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
