import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus, ClockIcon as ClockCheck, FileText, CalendarPlus } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Add Employee",
      description: "Register a new employee",
      href: "/employees/new",
      icon: UserPlus,
      color: "text-blue-500",
    },
    {
      title: "Record Attendance",
      description: "Mark attendance for today",
      href: "/attendance/record",
      icon: ClockCheck,
      color: "text-green-500",
    },
    {
      title: "Process Payroll",
      description: "Generate monthly payroll",
      href: "/payroll/process",
      icon: FileText,
      color: "text-amber-500",
    },
    {
      title: "Request Leave",
      description: "Submit a leave request",
      href: "/leave/request",
      icon: CalendarPlus,
      color: "text-purple-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button variant="outline" className="w-full justify-start h-auto py-3">
              <div className={`mr-2 ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
