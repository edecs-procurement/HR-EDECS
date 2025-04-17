"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ref, get, set, push } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Calculator, Download, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Employee {
  id: string
  name: string
  position: string
  department: string
  employeeId: string
  basicSalary: number
  bankName: string
  accountNumber: string
}

interface PayrollItem {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  basicSalary: number
  allowances: number
  deductions: number
  overtimePay: number
  bonus: number
  taxDeduction: number
  socialInsurance: number
  pension: number
  netSalary: number
  bankName: string
  accountNumber: string
  paymentStatus: "pending" | "paid"
  notes: string
}

export default function ProcessPayrollPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("regular")

  // Payroll settings
  const [settings, setSettings] = useState({
    taxRate: 10, // 10%
    socialInsuranceRate: 5, // 5%
    pensionRate: 3, // 3%
    overtimeRate: 1.5, // 1.5x regular rate
  })

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const employeesRef = ref(rtdb, "employees")
        const snapshot = await get(employeesRef)

        if (snapshot.exists()) {
          const employeesData = snapshot.val()
          const employeesList = Object.keys(employeesData).map((id) => ({
            id,
            name: employeesData[id].name,
            position: employeesData[id].position,
            department: employeesData[id].department,
            employeeId: employeesData[id].employeeId,
            basicSalary: employeesData[id].basicSalary || 0,
            bankName: employeesData[id].bankName || "",
            accountNumber: employeesData[id].accountNumber || "",
          }))

          setEmployees(employeesList)

          // Initialize selected employees
          const selected: Record<string, boolean> = {}
          employeesList.forEach((emp) => {
            selected[emp.id] = true
          })
          setSelectedEmployees(selected)

          // Check if payroll already exists for this month
          await checkExistingPayroll(selectedMonth)
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("Failed to load employees")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  useEffect(() => {
    checkExistingPayroll(selectedMonth)
  }, [selectedMonth])

  const checkExistingPayroll = async (month: string) => {
    try {
      const monthFormatted = month.replace(/-/g, "")
      const payrollRef = ref(rtdb, `payroll/${monthFormatted}`)
      const snapshot = await get(payrollRef)

      if (snapshot.exists()) {
        const payrollData = snapshot.val()
        const payrollList = Object.keys(payrollData).map((id) => ({
          id,
          ...payrollData[id],
        }))

        setPayrollItems(payrollList)

        // Update selected employees based on existing payroll
        const selected: Record<string, boolean> = {}
        employees.forEach((emp) => {
          const existingPayroll = payrollList.find((p) => p.employeeId === emp.id)
          selected[emp.id] = existingPayroll ? true : false
        })
        setSelectedEmployees(selected)

        toast({
          title: "Payroll exists",
          description: `Payroll for ${format(new Date(month + "-01"), "MMMM yyyy")} already exists`,
        })
      } else {
        // Initialize payroll items
        initializePayrollItems()
      }
    } catch (error) {
      console.error("Error checking existing payroll:", error)
    }
  }

  const initializePayrollItems = () => {
    const items: PayrollItem[] = employees.map((emp) => {
      const basicSalary = emp.basicSalary || 0
      const taxDeduction = (basicSalary * settings.taxRate) / 100
      const socialInsurance = (basicSalary * settings.socialInsuranceRate) / 100
      const pension = (basicSalary * settings.pensionRate) / 100
      const netSalary = basicSalary - taxDeduction - socialInsurance - pension

      return {
        id: "",
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        department: emp.department,
        basicSalary,
        allowances: 0,
        deductions: 0,
        overtimePay: 0,
        bonus: 0,
        taxDeduction,
        socialInsurance,
        pension,
        netSalary,
        bankName: emp.bankName || "",
        accountNumber: emp.accountNumber || "",
        paymentStatus: "pending",
        notes: "",
      }
    })

    setPayrollItems(items)
  }

  const handlePayrollItemChange = (index: number, field: keyof PayrollItem, value: any) => {
    setPayrollItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }

      // Recalculate net salary
      const item = updated[index]
      const netSalary =
        item.basicSalary +
        item.allowances +
        item.overtimePay +
        item.bonus -
        item.deductions -
        item.taxDeduction -
        item.socialInsurance -
        item.pension

      updated[index].netSalary = netSalary

      return updated
    })
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }))
  }

  const calculatePayroll = () => {
    // Get attendance data for the month
    const fetchAttendanceData = async () => {
      try {
        setProcessing(true)

        const [year, month] = selectedMonth.split("-")
        const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()

        // Create an array of all days in the month
        const days = Array.from({ length: daysInMonth }, (_, i) => `${year}${month}${String(i + 1).padStart(2, "0")}`)

        // Initialize overtime hours for each employee
        const overtimeHours: Record<string, number> = {}
        employees.forEach((emp) => {
          overtimeHours[emp.id] = 0
        })

        // Fetch attendance for each day
        for (const day of days) {
          const attendanceRef = ref(rtdb, `attendance/${day}`)
          const snapshot = await get(attendanceRef)

          if (snapshot.exists()) {
            const attendanceData = snapshot.val()

            // Sum up overtime hours
            Object.keys(attendanceData).forEach((empId) => {
              const record = attendanceData[empId]
              if (record.overtime) {
                overtimeHours[empId] = (overtimeHours[empId] || 0) + record.overtime
              }
            })
          }
        }

        // Update payroll items with overtime pay
        setPayrollItems((prev) => {
          return prev.map((item) => {
            const hours = overtimeHours[item.employeeId] || 0
            const hourlyRate = item.basicSalary / (22 * 8) // Assuming 22 working days per month, 8 hours per day
            const overtimePay = hours * hourlyRate * settings.overtimeRate

            const netSalary =
              item.basicSalary +
              item.allowances +
              overtimePay +
              item.bonus -
              item.deductions -
              item.taxDeduction -
              item.socialInsurance -
              item.pension

            return {
              ...item,
              overtimePay,
              netSalary,
            }
          })
        })

        toast({
          title: "Payroll calculated",
          description: "Overtime hours have been calculated based on attendance records",
        })
      } catch (error) {
        console.error("Error calculating payroll:", error)
        setError("Failed to calculate payroll")
      } finally {
        setProcessing(false)
      }
    }

    fetchAttendanceData()
  }

  const processPayroll = async () => {
    if (!selectedMonth) {
      setError("Please select a month")
      return
    }

    setProcessing(true)
    try {
      const monthFormatted = selectedMonth.replace(/-/g, "")
      const payrollRef = ref(rtdb, `payroll/${monthFormatted}`)

      // Filter only selected employees
      const selectedItems = payrollItems.filter((item) => selectedEmployees[item.employeeId])

      // Create payroll object
      const payrollData: Record<string, any> = {}

      selectedItems.forEach((item) => {
        const id = item.id || push(ref(rtdb, "payroll")).key
        payrollData[id] = {
          ...item,
          id,
          month: selectedMonth.split("-")[1],
          year: selectedMonth.split("-")[0],
          processedDate: new Date().toISOString(),
        }
      })

      await set(payrollRef, payrollData)

      toast({
        title: "Payroll processed",
        description: `Payroll for ${format(new Date(selectedMonth + "-01"), "MMMM yyyy")} has been processed successfully`,
      })

      router.push("/payroll")
    } catch (error) {
      console.error("Error processing payroll:", error)
      setError("Failed to process payroll")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Process Payroll</h1>
          <p className="text-muted-foreground">Generate monthly payroll for employees</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Payroll Settings</CardTitle>
            <CardDescription>Configure payroll parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="month">Payroll Month</Label>
              <Input id="month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number.parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialInsuranceRate">Social Insurance Rate (%)</Label>
              <Input
                id="socialInsuranceRate"
                type="number"
                value={settings.socialInsuranceRate}
                onChange={(e) => setSettings({ ...settings, socialInsuranceRate: Number.parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pensionRate">Pension Rate (%)</Label>
              <Input
                id="pensionRate"
                type="number"
                value={settings.pensionRate}
                onChange={(e) => setSettings({ ...settings, pensionRate: Number.parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Rate (x)</Label>
              <Input
                id="overtimeRate"
                type="number"
                step="0.1"
                value={settings.overtimeRate}
                onChange={(e) => setSettings({ ...settings, overtimeRate: Number.parseFloat(e.target.value) })}
              />
            </div>

            <Button onClick={calculatePayroll} className="w-full gap-2" disabled={processing}>
              <Calculator className="h-4 w-4" />
              {processing ? "Calculating..." : "Calculate Payroll"}
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
            <CardDescription>{format(new Date(selectedMonth + "-01"), "MMMM yyyy")} payroll overview</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">
                ${payrollItems.reduce((sum, item) => sum + item.basicSalary, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Basic Salaries</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 text-2xl font-bold">
                ${payrollItems.reduce((sum, item) => sum + item.overtimePay, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Overtime</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-purple-600 text-2xl font-bold">
                ${payrollItems.reduce((sum, item) => sum + item.netSalary, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Net Payroll</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employee Payroll</CardTitle>
            <CardDescription>Review and adjust employee payroll details</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={processPayroll} disabled={processing || payrollItems.length === 0} className="gap-2">
              <FileText className="h-4 w-4" />
              {processing ? "Processing..." : "Process Payroll"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regular">Regular Employees</TabsTrigger>
              <TabsTrigger value="temporary">Temporary Labor</TabsTrigger>
            </TabsList>

            <TabsContent value="regular" className="space-y-4 pt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={Object.values(selectedEmployees).every(Boolean)}
                          onCheckedChange={(checked) => {
                            const newSelected: Record<string, boolean> = {}
                            employees.forEach((emp) => {
                              newSelected[emp.id] = checked === true
                            })
                            setSelectedEmployees(newSelected)
                          }}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Overtime</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Loading payroll data...
                        </TableCell>
                      </TableRow>
                    ) : payrollItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No payroll data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrollItems.map((item, index) => (
                        <TableRow key={item.employeeId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees[item.employeeId]}
                              onCheckedChange={() => toggleEmployeeSelection(item.employeeId)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{item.employeeName}</TableCell>
                          <TableCell>{item.department}</TableCell>
                          <TableCell className="text-right">${item.basicSalary.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.allowances}
                              onChange={(e) =>
                                handlePayrollItemChange(index, "allowances", Number.parseFloat(e.target.value))
                              }
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">${item.overtimePay.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.deductions}
                              onChange={(e) =>
                                handlePayrollItemChange(index, "deductions", Number.parseFloat(e.target.value))
                              }
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">${item.netSalary.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="temporary" className="space-y-4 pt-4">
              <div className="flex justify-end mb-4">
                <Button variant="outline" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Add Temporary Labor
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Days Worked</TableHead>
                      <TableHead className="text-right">Rate per Day</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No temporary labor records for this month
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
