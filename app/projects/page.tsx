"use client"

import { useState, useEffect } from "react"
import { ref, get, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Plus, Search, Trash2, Edit, Users, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { Project, ProjectAssignment } from "@/lib/models"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function ProjectsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [employees, setEmployees] = useState<Record<string, { name: string; position: string }>>({})
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true)
      try {
        // Fetch projects
        const projectsRef = ref(rtdb, "projects")
        const projectsSnapshot = await get(projectsRef)

        if (projectsSnapshot.exists()) {
          const projectsData = projectsSnapshot.val()
          const projectsList = Object.keys(projectsData).map((id) => ({
            id,
            ...projectsData[id],
          }))
          setProjects(projectsList)
        } else {
          setProjects([])
        }

        // Fetch assignments
        const assignmentsRef = ref(rtdb, "projectAssignments")
        const assignmentsSnapshot = await get(assignmentsRef)

        if (assignmentsSnapshot.exists()) {
          const assignmentsData = assignmentsSnapshot.val()
          const assignmentsList = Object.keys(assignmentsData).map((id) => ({
            id,
            ...assignmentsData[id],
          }))
          setAssignments(assignmentsList)
        } else {
          setAssignments([])
        }

        // Fetch employees for reference
        const employeesRef = ref(rtdb, "employees")
        const employeesSnapshot = await get(employeesRef)

        if (employeesSnapshot.exists()) {
          const employeesData = employeesSnapshot.val()
          const employeesMap: Record<string, { name: string; position: string }> = {}

          Object.keys(employeesData).forEach((id) => {
            employeesMap[id] = {
              name: employeesData[id].name,
              position: employeesData[id].position,
            }
          })

          setEmployees(employeesMap)
        }
      } catch (error) {
        console.error("Error fetching project data:", error)
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [toast])

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return

    try {
      await remove(ref(rtdb, `projects/${deleteProjectId}`))

      // Also delete related assignments
      const relatedAssignments = assignments.filter((a) => a.projectId === deleteProjectId)

      for (const assignment of relatedAssignments) {
        await remove(ref(rtdb, `projectAssignments/${assignment.id}`))
      }

      setProjects((prev) => prev.filter((project) => project.id !== deleteProjectId))
      setAssignments((prev) => prev.filter((assignment) => assignment.projectId !== deleteProjectId))

      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setDeleteProjectId(null)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteAssignmentId) return

    try {
      await remove(ref(rtdb, `projectAssignments/${deleteAssignmentId}`))

      setAssignments((prev) => prev.filter((assignment) => assignment.id !== deleteAssignmentId))

      toast({
        title: "Assignment deleted",
        description: "The project assignment has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      })
    } finally {
      setDeleteAssignmentId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-blue-500">Planning</Badge>
      case "ongoing":
        return <Badge className="bg-green-500">Ongoing</Badge>
      case "completed":
        return <Badge className="bg-purple-500">Completed</Badge>
      case "on-hold":
        return <Badge className="bg-amber-500">On Hold</Badge>
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const calculateProjectProgress = (projectId: string) => {
    const today = new Date()
    const project = projects.find((p) => p.id === projectId)

    if (!project) return 0

    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)

    if (today < startDate) return 0
    if (today > endDate) return 100

    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedDuration = today.getTime() - startDate.getTime()

    return Math.round((elapsedDuration / totalDuration) * 100)
  }

  const getAssignmentCountByProject = (projectId: string) => {
    return assignments.filter((a) => a.projectId === projectId).length
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredAssignments = assignments.filter((assignment) => {
    const project = projects.find((p) => p.id === assignment.projectId)
    const employee = employees[assignment.employeeId]

    return (
      (project && project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee && employee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (assignment.role && assignment.role.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <p className="text-muted-foreground">Manage projects and employee assignments</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/projects/new">
              <Button className="w-full gap-2">
                <FolderKanban className="h-4 w-4" />
                Create New Project
              </Button>
            </Link>
            <Link href="/projects/assign">
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                Assign Employees
              </Button>
            </Link>
            <Link href="/projects/timesheet">
              <Button variant="outline" className="w-full gap-2">
                <Clock className="h-4 w-4" />
                Record Timesheet
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Overview of project status</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 text-2xl font-bold">
                {projects.filter((p) => p.status === "planning").length}
              </div>
              <div className="text-sm text-muted-foreground">Planning</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">
                {projects.filter((p) => p.status === "ongoing").length}
              </div>
              <div className="text-sm text-muted-foreground">Ongoing</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-amber-600 text-2xl font-bold">
                {projects.filter((p) => p.status === "on-hold").length}
              </div>
              <div className="text-sm text-muted-foreground">On Hold</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-purple-600 text-2xl font-bold">
                {projects.filter((p) => p.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>Manage projects and assignments</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignments
              </TabsTrigger>
            </TabsList>

            <div className="mb-4 mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === "projects" ? "Search projects..." : "Search assignments..."}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="projects">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading projects...
                        </TableCell>
                      </TableRow>
                    ) : filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No projects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.client}</TableCell>
                          <TableCell>
                            {format(new Date(project.startDate), "MMM dd, yyyy")} -
                            {format(new Date(project.endDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Progress value={calculateProjectProgress(project.id)} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {calculateProjectProgress(project.id)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getAssignmentCountByProject(project.id)} members</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteProjectId(project.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="assignments">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Hours/Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading assignments...
                        </TableCell>
                      </TableRow>
                    ) : filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {employees[assignment.employeeId]?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {projects.find((p) => p.id === assignment.projectId)?.name || "Unknown Project"}
                          </TableCell>
                          <TableCell>{assignment.role}</TableCell>
                          <TableCell>
                            {format(new Date(assignment.startDate), "MMM dd, yyyy")} -
                            {format(new Date(assignment.endDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{assignment.hoursPerDay}</TableCell>
                          <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/projects/assignment/${assignment.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteAssignmentId(assignment.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
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

      {/* Delete Project Dialog */}
      <Dialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this project?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog */}
      <Dialog open={!!deleteAssignmentId} onOpenChange={(open) => !open && setDeleteAssignmentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this assignment?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove the employee from this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAssignmentId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
