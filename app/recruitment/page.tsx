"use client"

import { useState, useEffect } from "react"
import { ref, get, set, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Plus, Search, Trash2, Edit, Users, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { JobOpening, Applicant } from "@/lib/models"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RecruitmentPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("openings")
  const [searchQuery, setSearchQuery] = useState("")
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null)
  const [deleteApplicantId, setDeleteApplicantId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecruitmentData = async () => {
      setLoading(true)
      try {
        // Fetch job openings
        const jobsRef = ref(rtdb, "jobOpenings")
        const jobsSnapshot = await get(jobsRef)

        if (jobsSnapshot.exists()) {
          const jobsData = jobsSnapshot.val()
          const jobsList = Object.keys(jobsData).map((id) => ({
            id,
            ...jobsData[id],
          }))
          setJobOpenings(jobsList)
        } else {
          setJobOpenings([])
        }

        // Fetch applicants
        const applicantsRef = ref(rtdb, "applicants")
        const applicantsSnapshot = await get(applicantsRef)

        if (applicantsSnapshot.exists()) {
          const applicantsData = applicantsSnapshot.val()
          const applicantsList = Object.keys(applicantsData).map((id) => ({
            id,
            ...applicantsData[id],
          }))
          setApplicants(applicantsList)
        } else {
          setApplicants([])
        }
      } catch (error) {
        console.error("Error fetching recruitment data:", error)
        toast({
          title: "Error",
          description: "Failed to load recruitment data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecruitmentData()
  }, [toast])

  const handleDeleteJob = async () => {
    if (!deleteJobId) return

    try {
      await remove(ref(rtdb, `jobOpenings/${deleteJobId}`))

      setJobOpenings((prev) => prev.filter((job) => job.id !== deleteJobId))

      toast({
        title: "Job deleted",
        description: "The job opening has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting job:", error)
      toast({
        title: "Error",
        description: "Failed to delete job opening",
        variant: "destructive",
      })
    } finally {
      setDeleteJobId(null)
    }
  }

  const handleDeleteApplicant = async () => {
    if (!deleteApplicantId) return

    try {
      await remove(ref(rtdb, `applicants/${deleteApplicantId}`))

      setApplicants((prev) => prev.filter((applicant) => applicant.id !== deleteApplicantId))

      toast({
        title: "Applicant deleted",
        description: "The applicant has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting applicant:", error)
      toast({
        title: "Error",
        description: "Failed to delete applicant",
        variant: "destructive",
      })
    } finally {
      setDeleteApplicantId(null)
    }
  }

  const updateApplicantStatus = async (applicantId: string, status: string) => {
    try {
      await set(ref(rtdb, `applicants/${applicantId}/status`), status)

      setApplicants((prev) =>
        prev.map((applicant) => (applicant.id === applicantId ? { ...applicant, status } : applicant)),
      )

      toast({
        title: "Status updated",
        description: `Applicant status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating applicant status:", error)
      toast({
        title: "Error",
        description: "Failed to update applicant status",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>
      case "closed":
        return <Badge className="bg-red-500">Closed</Badge>
      case "new":
        return <Badge className="bg-blue-500">New</Badge>
      case "screening":
        return <Badge className="bg-purple-500">Screening</Badge>
      case "interview":
        return <Badge className="bg-amber-500">Interview</Badge>
      case "offered":
        return <Badge className="bg-emerald-500">Offered</Badge>
      case "hired":
        return <Badge className="bg-green-500">Hired</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredJobs = jobOpenings.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredApplicants = applicants.filter(
    (applicant) =>
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobOpenings
        .find((job) => job.id === applicant.jobId)
        ?.title.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Recruitment</h1>
        <p className="text-muted-foreground">Manage job openings and applicants</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/recruitment/job/new">
              <Button className="w-full gap-2">
                <Briefcase className="h-4 w-4" />
                Post New Job
              </Button>
            </Link>
            <Link href="/recruitment/applicants">
              <Button variant="outline" className="w-full gap-2">
                <Users className="h-4 w-4" />
                View All Applicants
              </Button>
            </Link>
            <Link href="/recruitment/report">
              <Button variant="outline" className="w-full gap-2">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>Recruitment Summary</CardTitle>
            <CardDescription>Overview of recruitment activities</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 text-2xl font-bold">
                {jobOpenings.filter((job) => job.status === "open").length}
              </div>
              <div className="text-sm text-muted-foreground">Open Positions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-purple-600 text-2xl font-bold">{applicants.length}</div>
              <div className="text-sm text-muted-foreground">Total Applicants</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-amber-600 text-2xl font-bold">
                {applicants.filter((app) => app.status === "interview").length}
              </div>
              <div className="text-sm text-muted-foreground">Interviews</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 text-2xl font-bold">
                {applicants.filter((app) => app.status === "hired").length}
              </div>
              <div className="text-sm text-muted-foreground">Hired</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recruitment Management</CardTitle>
            <CardDescription>Manage job openings and applicants</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/recruitment/job/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Job
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openings" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Openings
              </TabsTrigger>
              <TabsTrigger value="applicants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Applicants
              </TabsTrigger>
            </TabsList>

            <div className="mb-4 mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === "openings" ? "Search job openings..." : "Search applicants..."}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="openings">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Posted Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading job openings...
                        </TableCell>
                      </TableRow>
                    ) : filteredJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No job openings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.department}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>{job.type}</TableCell>
                          <TableCell>{format(new Date(job.postedDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/recruitment/job/${job.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteJobId(job.id)}>
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

            <TabsContent value="applicants">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Loading applicants...
                        </TableCell>
                      </TableRow>
                    ) : filteredApplicants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No applicants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplicants.map((applicant) => (
                        <TableRow key={applicant.id}>
                          <TableCell className="font-medium">{applicant.name}</TableCell>
                          <TableCell>{applicant.email}</TableCell>
                          <TableCell>
                            {jobOpenings.find((job) => job.id === applicant.jobId)?.title || "Unknown Position"}
                          </TableCell>
                          <TableCell>{format(new Date(applicant.appliedDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <Select
                              value={applicant.status}
                              onValueChange={(value) => updateApplicantStatus(applicant.id, value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="screening">Screening</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="offered">Offered</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/recruitment/applicant/${applicant.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteApplicantId(applicant.id)}>
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

      {/* Delete Job Dialog */}
      <Dialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this job opening?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the job opening and may affect linked
              applicants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteJobId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Applicant Dialog */}
      <Dialog open={!!deleteApplicantId} onOpenChange={(open) => !open && setDeleteApplicantId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this applicant?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the applicant record and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteApplicantId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteApplicant}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
