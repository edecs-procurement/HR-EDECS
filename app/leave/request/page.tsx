"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ref, get, set, push } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, ArrowLeft, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { format, differenceInDays, addDays } from "date-fns"
import { useAuth } from "@/context/auth-context"

interface LeaveBalance {
  id: string
  employeeId: string
  year: string
  annualLeave: number
  sickLeave: number
  casualLeave: number
  unpaidLeave: number
  usedAnnualLeave: number
  usedSickLeave: number
  usedCasualLeave: number
  usedUnpaidLeave: number
}

export default function RequestLeavePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [employeeId, setEmployeeId] = useState("")
  const [employeeName, setEmployeeName] = useState("")

  const [leaveForm, setLeaveForm] = useState({
    type: "annual",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    days: 1,
    reason: "",
    contactInfo: "",
  })

  useEffect(() => {
    if (user) {
      // Fetch employee details
      const fetchEmployeeDetails = async () => {
        try {
          const employeesRef = ref(rtdb, "employees")
          const snapshot = await get(employeesRef)

          if (snapshot.exists()) {
            const employeesData = snapshot.val()

            // Find employee by email
            const employeeEntry = Object.entries(employeesData).find(
              ([_, empData]: [string, any]) => empData.email === user.email,
            )

            if (employeeEntry) {
              const [id, empData]: [string, any] = employeeEntry
              setEmployeeId(id)
              setEmployeeName(empData.name)

              // Fetch leave balance
              await fetchLeaveBalance(id)
            } else {
              setError("Employee record not found")
            }
          }
        } catch (error) {
          console.error("Error fetching employee details:", error)
          setError("Failed to load employee details")
        } finally {
          setLoading(false)
        }
      }

      fetchEmployeeDetails()
    }
  }, [user])

  const fetchLeaveBalance = async (empId: string) => {
    try {
      const currentYear = new Date().getFullYear().toString()
      const balanceRef = ref(rtdb, `leaveBalance/${empId}/${currentYear}`)
      const snapshot = await get(balanceRef)

      if (snapshot.exists()) {
        setLeaveBalance(snapshot.val())
      } else {
        // Create default leave balance
        const defaultBalance: LeaveBalance = {
          id: push(ref(rtdb, "leaveBalance")).key || "",
          employeeId: empId,
          year: currentYear,
          annualLeave: 21,
          sickLeave: 10,
          casualLeave: 5,
          unpaidLeave: 0,
          usedAnnualLeave: 0,
          usedSickLeave: 0,
          usedCasualLeave: 0,
          usedUnpaidLeave: 0,
        }

        await set(ref(rtdb, `leaveBalance/${empId}/${currentYear}`), defaultBalance)
        setLeaveBalance(defaultBalance)
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error)
      setError("Failed to load leave balance")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLeaveForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Recalculate days if dates change
    if (name === "startDate" || name === "endDate") {
      calculateDays(name === "startDate" ? value : leaveForm.startDate, name === "endDate" ? value : leaveForm.endDate)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setLeaveForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateDays = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (end >= start) {
        // Add 1 to include both start and end days
        const days = differenceInDays(end, start) + 1

        // Count only weekdays (Monday to Friday)
        let weekdaysCount = 0
        let currentDate = new Date(start)

        for (let i = 0; i < days; i++) {
          const dayOfWeek = currentDate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // 0 is Sunday, 6 is Saturday
            weekdaysCount++
          }
          currentDate = addDays(currentDate, 1)
        }

        setLeaveForm((prev) => ({
          ...prev,
          days: weekdaysCount,
        }))
      }
    }
  }

  const getRemainingLeave = (type: string): number => {
    if (!leaveBalance) return 0

    switch (type) {
      case "annual":
        return leaveBalance.annualLeave - leaveBalance.usedAnnualLeave
      case "sick":
        return leaveBalance.sickLeave - leaveBalance.usedSickLeave
      case "casual":
        return leaveBalance.casualLeave - leaveBalance.usedCasualLeave
      case "unpaid":
        return 999 // Unlimited unpaid leave
      default:
        return 0
    }
  }

  const submitLeaveRequest = async () => {
    if (!employeeId) {
      setError("Employee information not found")
      return
    }

    if (leaveForm.days <= 0) {
      setError("Leave duration must be at least 1 day")
      return
    }

    const remainingDays = getRemainingLeave(leaveForm.type)
    if (leaveForm.type !== "unpaid" && leaveForm.days > remainingDays) {
      setError(`You only have ${remainingDays} days of ${leaveForm.type} leave remaining`)
      return
    }

    setSubmitting(true)
    try {
      const leaveId = push(ref(rtdb, "leaves")).key

      const leaveRequest = {
        id: leaveId,
        employeeId,
        employeeName,
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        days: leaveForm.days,
        reason: leaveForm.reason,
        contactInfo: leaveForm.contactInfo,
        status: "pending",
        appliedOn: new Date().toISOString(),
      }

      // Save leave request
      await set(ref(rtdb, `leaves/${leaveId}`), leaveRequest)

      // Update leave balance
      if (leaveBalance && leaveForm.type !== "unpaid") {
        const updatedBalance = { ...leaveBalance }

        switch (leaveForm.type) {
          case "annual":
            updatedBalance.usedAnnualLeave += leaveForm.days
            break
          case "sick":
            updatedBalance.usedSickLeave += leaveForm.days
            break
          case "casual":
            updatedBalance.usedCasualLeave += leaveForm.days
            break
        }

        await set(ref(rtdb, `leaveBalance/${employeeId}/${leaveBalance.year}`), updatedBalance)
      }

      toast({
        title: "Leave request submitted",
        description: "Your leave request has been submitted successfully",
      })

      router.push("/leave")
    } catch (error) {
      console.error("Error submitting leave request:", error)
      setError("Failed to submit leave request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leave">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Request Leave</h1>
          <p className="text-muted-foreground">Submit a new leave request</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Your available leave days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading leave balance...</p>
              ) : leaveBalance ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Annual Leave</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leaveBalance.annualLeave - leaveBalance.usedAnnualLeave}</span>
                      <span className="text-sm text-muted-foreground">/ {leaveBalance.annualLeave}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sick Leave</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leaveBalance.sickLeave - leaveBalance.usedSickLeave}</span>
                      <span className="text-sm text-muted-foreground">/ {leaveBalance.sickLeave}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Casual Leave</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{leaveBalance.casualLeave - leaveBalance.usedCasualLeave}</span>
                      <span className="text-sm text-muted-foreground">/ {leaveBalance.casualLeave}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unpaid Leave</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Unlimited</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No leave balance found</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request Form</CardTitle>
              <CardDescription>Fill in the details for your leave request</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type</Label>
                  <Select value={leaveForm.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={leaveForm.startDate}
                      onChange={handleInputChange}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={leaveForm.endDate}
                      onChange={handleInputChange}
                      min={leaveForm.startDate}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days (Weekdays only)</Label>
                  <Input
                    id="days"
                    name="days"
                    type="number"
                    value={leaveForm.days}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    value={leaveForm.reason}
                    onChange={handleInputChange}
                    placeholder="Please provide a reason for your leave request"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Contact Information During Leave</Label>
                  <Input
                    id="contactInfo"
                    name="contactInfo"
                    value={leaveForm.contactInfo}
                    onChange={handleInputChange}
                    placeholder="Phone number or email where you can be reached if needed"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/leave")}>
                Cancel
              </Button>
              <Button onClick={submitLeaveRequest} disabled={submitting || loading} className="gap-2">
                <Calendar className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
