"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  status: "active" | "inactive" | "onLeave"
  joinDate: string
}

export default function EmployeesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const employeesRef = ref(db, "employees")
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      setLoading(true)
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
    })

    return () => unsubscribe()
  }, [user])

  const handleExport = () => {
    // Implementation for exporting employee data
    alert("Export functionality will be implemented here")
  }

  const handleDelete = (id: string) => {
    // Implementation for deleting an employee
    alert(`Delete employee with ID: ${id}`)
  }

  const columns = [
    { key: "employeeId", header: "ID" },
    {
      key: "name",
      header: "Name",
      render: (employee: Employee) => `${employee.firstName} ${employee.lastName}`,
    },
    { key: "department", header: "Department" },
    { key: "position", header: "Position" },
    {
      key: "status",
      header: "Status",
      render: (employee: Employee) => {
        const statusColors = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-red-100 text-red-800",
          onLeave: "bg-yellow-100 text-yellow-800",
        }

        return (
          <Badge className={statusColors[employee.status]}>
            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
          </Badge>
        )
      },
    },
    { key: "joinDate", header: "Join Date" },
    {
      key: "actions",
      header: "Actions",
      render: (employee: Employee) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/employees/${employee.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/employees/${employee.id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the employee record and remove the data
                  from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(employee.id)} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (loading) {
    return <div className="flex justify-center p-8">Loading employees...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <DataTable data={employees} columns={columns} createUrl="/employees/new" onExport={handleExport} />
    </div>
  )
}
