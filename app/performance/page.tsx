"use client"

import { useState, useEffect } from "react"
import { ref, onValue, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context-optimized"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Award, Plus, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Evaluation {
  id: string
  employeeId: string
  employeeName: string
  evaluatorId: string
  evaluatorName: string
  date: string
  period: string
  overallRating: number
  status: string
  categories: {
    [key: string]: {
      rating: number
      comments: string
    }
  }
}

export default function PerformancePage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [evaluationToDelete, setEvaluationToDelete] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const evaluationsRef = ref(rtdb, "evaluations")
    const unsubscribe = onValue(
      evaluationsRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const evaluationsList = Object.entries(data).map(([id, evaluation]) => ({
            id,
            ...(evaluation as Omit<Evaluation, "id">),
          }))
          setEvaluations(evaluationsList)
        } else {
          setEvaluations([])
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching evaluations:", error)
        toast({
          title: "Error",
          description: "Failed to load performance evaluations",
          variant: "destructive",
        })
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [toast])

  const handleDeleteClick = (id: string) => {
    setEvaluationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!evaluationToDelete) return

    try {
      await remove(ref(rtdb, `evaluations/${evaluationToDelete}`))
      toast({
        title: "Success",
        description: "Performance evaluation deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting evaluation:", error)
      toast({
        title: "Error",
        description: "Failed to delete performance evaluation",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setEvaluationToDelete(null)
    }
  }

  const viewEvaluation = (id: string) => {
    router.push(`/performance/${id}`)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-blue-600"
    if (rating >= 2) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Evaluation</h1>
          <p className="text-muted-foreground">Manage employee performance evaluations and reviews</p>
        </div>
        <Link href="/performance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Evaluation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Evaluations</CardTitle>
          <CardDescription>View and manage all employee performance evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No evaluations found</h3>
              <p className="text-muted-foreground mt-2">Get started by creating a new performance evaluation</p>
              <Link href="/performance/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Evaluation
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.employeeName}</TableCell>
                    <TableCell>{evaluation.evaluatorName}</TableCell>
                    <TableCell>{evaluation.period}</TableCell>
                    <TableCell>{new Date(evaluation.date).toLocaleDateString()}</TableCell>
                    <TableCell className={getRatingColor(evaluation.overallRating)}>
                      {evaluation.overallRating.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          evaluation.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : evaluation.status === "In Progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {evaluation.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => viewEvaluation(evaluation.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteClick(evaluation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this performance evaluation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
