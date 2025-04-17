"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Download, FileText, Filter, Plus } from "lucide-react"

export default function PayrollPage() {
  const [month, setMonth] = useState("current")
  const [department, setDepartment] = useState("all")
  const [activeTab, setActiveTab] = useState("regular")

  // Sample data for demonstration
  const regularEmployees = [
    {
      id: 1,
      name: "John Doe",
      position: "Project Manager",
      department: "Project Management",
      basicSalary: 5000,
      allowances: 800,
      deductions: 600,
      netSalary: 5200,
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "Civil Engineer",
      department: "Engineering",
      basicSalary: 4500,
      allowances: 600,
      deductions: 500,
      netSalary: 4600,
    },
    {
      id: 3,
      name: "Robert Johnson",
      position: "Safety Officer",
      department: "Safety",
      basicSalary: 3800,
      allowances: 500,
      deductions: 400,
      netSalary: 3900,
    },
    {
      id: 4,
      name: "Emily Davis",
      position: "HR Manager",
      department: "HR",
      basicSalary: 4200,
      allowances: 550,
      deductions: 450,
      netSalary: 4300,
    },
    {
      id: 5,
      name: "Michael Wilson",
      position: "Procurement Specialist",
      department: "Procurement",
      basicSalary: 3500,
      allowances: 450,
      deductions: 350,
      netSalary: 3600,
    },
  ]

  const temporaryLabor = [
    { id: 1, name: "Alex Brown", type: "Daily Labor", days: 22, ratePerDay: 80, totalAmount: 1760 },
    { id: 2, name: "Sarah Miller", type: "Contract Worker", days: 15, ratePerDay: 100, totalAmount: 1500 },
    { id: 3, name: "David Clark", type: "Daily Labor", days: 18, ratePerDay: 85, totalAmount: 1530 },
    { id: 4, name: "Lisa Taylor", type: "Contract Worker", days: 20, ratePerDay: 95, totalAmount: 1900 },
  ]

  const filteredRegularEmployees =
    department === "all"
      ? regularEmployees
      : regularEmployees.filter((emp) => emp.department.toLowerCase() === department)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-muted-foreground">Manage employee salaries, deductions, and payments</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/payroll/process">
              <Button className="w-full gap-2">
                <DollarSign className="h-4 w-4" />
                Process Payroll
              </Button>
            </Link>
            <Link href="/payroll/temporary">
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Temporary Labor
              </Button>
            </Link>
            <Link href="/payroll/report">
              <Button variant="outline" className="w-full gap-2">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
            <CardDescription>Current month payroll overview</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">$45,200</div>
              <div className="text-sm text-muted-foreground">Total Salaries</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 text-2xl font-bold">$6,800</div>
              <div className="text-sm text-muted-foreground">Temporary Labor</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-purple-600 text-2xl font-bold">$52,000</div>
              <div className="text-sm text-muted-foreground">Total Payroll</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>View and manage payroll records</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[180px]">
                <span>Select Month</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="previous">Previous Month</SelectItem>
                <SelectItem value="jan">January 2023</SelectItem>
                <SelectItem value="feb">February 2023</SelectItem>
                <SelectItem value="mar">March 2023</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Department</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="project management">Project Management</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regular">Regular Employees</TabsTrigger>
              <TabsTrigger value="temporary">Temporary Labor</TabsTrigger>
            </TabsList>

            <TabsContent value="regular">
              <div className="rounded-md border mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegularEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No payroll records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegularEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell className="text-right">${employee.basicSalary}</TableCell>
                          <TableCell className="text-right">${employee.allowances}</TableCell>
                          <TableCell className="text-right">${employee.deductions}</TableCell>
                          <TableCell className="text-right font-medium">${employee.netSalary}</TableCell>
                          <TableCell>
                            <Link href={`/payroll/details/${employee.id}`}>
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
            </TabsContent>

            <TabsContent value="temporary">
              <div className="rounded-md border mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Days Worked</TableHead>
                      <TableHead className="text-right">Rate per Day</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temporaryLabor.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No temporary labor records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      temporaryLabor.map((labor) => (
                        <TableRow key={labor.id}>
                          <TableCell className="font-medium">{labor.name}</TableCell>
                          <TableCell>{labor.type}</TableCell>
                          <TableCell className="text-right">{labor.days}</TableCell>
                          <TableCell className="text-right">${labor.ratePerDay}</TableCell>
                          <TableCell className="text-right font-medium">${labor.totalAmount}</TableCell>
                          <TableCell>
                            <Link href={`/payroll/temporary/${labor.id}`}>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
