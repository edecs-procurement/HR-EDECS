"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ref, push, set, get } from "firebase/database"
import { rtdb, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function NewPerformanceEvaluation() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; position: string }>>([])

  const [formData, setFormData] = useState({
    employeeId: "",
    period: "",
    date: new Date().toISOString().split("T")[0],
    status: "draft",
    ratings: {
      technical: 3,
      communication: 3,
      teamwork: 3,
      initiative: 3,
      overall: 3,
    },
    strengths: [""],
    areasForImprovement: [""],
    goals: [""],
    comments: "",
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
          }))

          setEmployees(employeesList)
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employees data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRatingChange = (category: keyof typeof formData.ratings, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value[0],
        overall: calculateOverallRating({
          ...prev.ratings,
          [category]: value[0],
        }),
      },
    }))
  }

  const calculateOverallRating = (ratings: typeof formData.ratings) => {
    const { technical, communication, teamwork, initiative } = ratings
    return (technical + communication + teamwork + initiative) / 4
  }

  const handleArrayItemChange = (
    arrayName: "strengths" | "areasForImprovement" | "goals",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayName]]
      newArray[index] = value
      return { ...prev, [arrayName]: newArray }
    })
  }

  const addArrayItem = (arrayName: "strengths" | "areasForImprovement" | "goals") => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""],
    }))
  }

  const removeArrayItem = (arrayName: "strengths" | "areasForImprovement" | "goals", index: number) => {
    if (formData[arrayName].length <= 1) return

    setFormData((prev) => {
      const newArray = [...prev[arrayName]]
      newArray.splice(index, 1)
      return { ...prev, [arrayName]: newArray }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Get current user as evaluator
      const evaluatorId = auth.currentUser?.uid

      if (!evaluatorId) {
        throw new Error("You must be logged in to submit an evaluation")
      }

      // Create evaluation object
      const evaluation = {
        ...formData,
        evaluatorId,
        date: formData.date,
        createdAt: new Date().toISOString(),
      }

      // Save to database
      const evaluationsRef = ref(rtdb, "performanceEvaluations")
      const newEvaluationRef = push(evaluationsRef)
      await set(newEvaluationRef, evaluation)

      toast({
        title: "Evaluation created",
        description: "The performance evaluation has been created successfully",
      })

      // Redirect to performance page
      router.push("/performance")
    } catch (error) {
      console.error("Error creating evaluation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create evaluation",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/performance">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Performance Evaluation</h1>
          <p className="text-muted-foreground">Create a new employee performance evaluation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this evaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => handleSelectChange("employeeId", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Evaluation Period</Label>
                <Select value={formData.period} onValueChange={(value) => handleSelectChange("period", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1 2023">Q1 2023</SelectItem>
                    <SelectItem value="Q2 2023">Q2 2023</SelectItem>
                    <SelectItem value="Q3 2023">Q3 2023</SelectItem>
                    <SelectItem value="Q4 2023">Q4 2023</SelectItem>
                    <SelectItem value="H1 2023">H1 2023</SelectItem>
                    <SelectItem value="H2 2023">H2 2023</SelectItem>
                    <SelectItem value="Annual 2023">Annual 2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Evaluation Date</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Ratings</CardTitle>
              <CardDescription>Rate the employee's performance in each category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="technical">Technical Skills</Label>
                  <span className="font-medium">{formData.ratings.technical}</span>
                </div>
                <Slider
                  id="technical"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[formData.ratings.technical]}
                  onValueChange={(value) => handleRatingChange("technical", value)}
                />
                <p className="text-sm text-muted-foreground">
                  Rate the employee's technical knowledge and skills required for the job
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="communication">Communication</Label>
                  <span className="font-medium">{formData.ratings.communication}</span>
                </div>
                <Slider
                  id="communication"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[formData.ratings.communication]}
                  onValueChange={(value) => handleRatingChange("communication", value)}
                />
                <p className="text-sm text-muted-foreground">
                  Rate the employee's ability to communicate effectively with team members and stakeholders
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="teamwork">Teamwork</Label>
                  <span className="font-medium">{formData.ratings.teamwork}</span>
                </div>
                <Slider
                  id="teamwork"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[formData.ratings.teamwork]}
                  onValueChange={(value) => handleRatingChange("teamwork", value)}
                />
                <p className="text-sm text-muted-foreground">
                  Rate the employee's ability to work collaboratively with others
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="initiative">Initiative & Innovation</Label>
                  <span className="font-medium">{formData.ratings.initiative}</span>
                </div>
                <Slider
                  id="initiative"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[formData.ratings.initiative]}
                  onValueChange={(value) => handleRatingChange("initiative", value)}
                />
                <p className="text-sm text-muted-foreground">
                  Rate the employee's ability to take initiative and contribute innovative ideas
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <Label htmlFor="overall">Overall Rating</Label>
                  <span className="font-medium">{formData.ratings.overall.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Average of all ratings above</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback & Development</CardTitle>
              <CardDescription>Provide detailed feedback and development goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Strengths</Label>
                {formData.strengths.map((strength, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={strength}
                      onChange={(e) => handleArrayItemChange("strengths", index, e.target.value)}
                      placeholder="Enter a strength"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("strengths", index)}
                      disabled={formData.strengths.length <= 1}
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addArrayItem("strengths")}>
                  Add Strength
                </Button>
              </div>

              <div className="space-y-4">
                <Label>Areas for Improvement</Label>
                {formData.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={area}
                      onChange={(e) => handleArrayItemChange("areasForImprovement", index, e.target.value)}
                      placeholder="Enter an area for improvement"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("areasForImprovement", index)}
                      disabled={formData.areasForImprovement.length <= 1}
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addArrayItem("areasForImprovement")}>
                  Add Area for Improvement
                </Button>
              </div>

              <div className="space-y-4">
                <Label>Development Goals</Label>
                {formData.goals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={goal}
                      onChange={(e) => handleArrayItemChange("goals", index, e.target.value)}
                      placeholder="Enter a development goal"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("goals", index)}
                      disabled={formData.goals.length <= 1}
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addArrayItem("goals")}>
                  Add Development Goal
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Enter any additional comments or feedback"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Review the evaluation before submitting</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Please review all the information you've entered before submitting the evaluation. Once submitted, you
                can still edit the evaluation until it's acknowledged by the employee.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/performance">
                <Button variant="outline">Cancel</Button>
              </Link>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !formData.employeeId || !formData.period}>
                  {submitting ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
