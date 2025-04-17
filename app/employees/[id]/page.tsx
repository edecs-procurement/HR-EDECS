"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ref, get, update, remove } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { rtdb, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, Upload, Trash2, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Employee, EmployeeDocument } from "@/lib/models"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("personal")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [newDocument, setNewDocument] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("resume")
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      try {
        const employeeRef = ref(rtdb, `employees/${id}`)
        const snapshot = await get(employeeRef)

        if (snapshot.exists()) {
          const employeeData = snapshot.val()
          setEmployee(employeeData)
          setPhotoPreview(employeeData.photoURL || null)

          // Fetch documents
          const documentsRef = ref(rtdb, `employeeDocuments/${id}`)
          const documentsSnapshot = await get(documentsRef)

          if (documentsSnapshot.exists()) {
            const documentsData = documentsSnapshot.val()
            const documentsList = Object.keys(documentsData).map((docId) => ({
              id: docId,
              ...documentsData[docId],
            }))
            setDocuments(documentsList)
          }
        } else {
          setError("Employee not found")
          toast({
            title: "Error",
            description: "Employee not found",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching employee:", error)
        setError("Failed to load employee details")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [id, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEmployee((prev) => {
      if (!prev) return null
      return { ...prev, [name]: value }
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setEmployee((prev) => {
      if (!prev) return null
      return { ...prev, [name]: value }
    })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhoto(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target) {
          setPhotoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument(e.target.files[0])
    }
  }

  const uploadDocument = async () => {
    if (!newDocument || !employee) return

    setUploadingDocument(true)
    try {
      const docRef = storageRef(storage, `employees/${employee.id}/documents/${Date.now()}_${newDocument.name}`)
      await uploadBytes(docRef, newDocument)
      const downloadURL = await getDownloadURL(docRef)

      const newDocId = Date.now().toString()
      const newDoc: EmployeeDocument = {
        id: newDocId,
        employeeId: employee.id,
        type: documentType,
        name: newDocument.name,
        url: downloadURL,
        uploadedAt: new Date().toISOString(),
      }

      // Save to database
      await update(ref(rtdb, `employeeDocuments/${employee.id}/${newDocId}`), newDoc)

      // Update local state
      setDocuments((prev) => [...prev, newDoc])
      setNewDocument(null)

      toast({
        title: "Document uploaded",
        description: "Document has been uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploadingDocument(false)
    }
  }

  const deleteDocument = async (docId: string) => {
    try {
      // Delete from database
      await remove(ref(rtdb, `employeeDocuments/${employee?.id}/${docId}`))

      // Update local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId))

      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!employee) return

    setSaving(true)
    try {
      let photoURL = employee.photoURL || ""

      // Upload photo if selected
      if (photo) {
        const photoRef = storageRef(storage, `employees/${employee.id}/photo/${Date.now()}_${photo.name}`)
        await uploadBytes(photoRef, photo)
        photoURL = await getDownloadURL(photoRef)
      }

      // Update employee data
      const updatedEmployee = {
        ...employee,
        photoURL,
        updatedAt: new Date().toISOString(),
      }

      await update(ref(rtdb, `employees/${employee.id}`), updatedEmployee)

      toast({
        title: "Employee updated",
        description: "Employee details have been updated successfully",
      })
    } catch (error) {
      console.error("Error updating employee:", error)
      setError("Failed to update employee")
      toast({
        title: "Update failed",
        description: "Failed to update employee details",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!employee) return

    try {
      // Delete employee
      await remove(ref(rtdb, `employees/${employee.id}`))

      toast({
        title: "Employee deleted",
        description: "Employee has been deleted successfully",
      })

      router.push("/employees")
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading employee details...</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Employee not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">
              {employee.position} • {employee.department}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
            Delete
          </Button>
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
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={photoPreview || "/placeholder.svg"} alt={employee.name} />
                  <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Upload className="h-4 w-4" />
                      Change Photo
                    </div>
                    <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </Label>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{employee.name}</h2>
                  <p className="text-muted-foreground">{employee.position}</p>
                  <div className="mt-2">
                    <Badge>{employee.employmentType || "Full Time"}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Employee ID</h3>
                  <p>{employee.employeeId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                  <p>{employee.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Join Date</h3>
                  <p>{employee.joinDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{employee.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{employee.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Edit the employee's personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" value={employee.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={employee.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" name="phone" value={employee.phone} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={employee.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={employee.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select
                        value={employee.maritalStatus}
                        onValueChange={(value) => handleSelectChange("maritalStatus", value)}
                      >
                        <SelectTrigger id="maritalStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        name="nationality"
                        value={employee.nationality}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={employee.address}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={employee.emergencyContactName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactRelation">Relationship</Label>
                        <Input
                          id="emergencyContactRelation"
                          name="emergencyContactRelation"
                          value={employee.emergencyContactRelation}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          value={employee.emergencyContactPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment">
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                  <CardDescription>Edit the employee's work information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        name="employeeId"
                        value={employee.employeeId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position/Title *</Label>
                      <Input
                        id="position"
                        name="position"
                        value={employee.position}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={employee.department}
                        onValueChange={(value) => handleSelectChange("department", value)}
                        required
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="project_management">Project Management</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="procurement">Procurement</SelectItem>
                          <SelectItem value="quality">Quality Control</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Join Date *</Label>
                      <Input
                        id="joinDate"
                        name="joinDate"
                        type="date"
                        value={employee.joinDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select
                        value={employee.employmentType}
                        onValueChange={(value) => handleSelectChange("employmentType", value)}
                      >
                        <SelectTrigger id="employmentType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workLocation">Work Location</Label>
                      <Input
                        id="workLocation"
                        name="workLocation"
                        value={employee.workLocation}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reportingManager">Reporting Manager</Label>
                      <Input
                        id="reportingManager"
                        name="reportingManager"
                        value={employee.reportingManager}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                  <CardDescription>Edit the employee's financial details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basicSalary">Basic Salary</Label>
                      <Input
                        id="basicSalary"
                        name="basicSalary"
                        type="number"
                        value={employee.basicSalary}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / SSN</Label>
                      <Input id="taxId" name="taxId" value={employee.taxId} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" name="bankName" value={employee.bankName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        value={employee.accountNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Manage employee documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="documentType">Document Type</Label>
                          <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger id="documentType">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="resume">Resume/CV</SelectItem>
                              <SelectItem value="id">ID Proof</SelectItem>
                              <SelectItem value="address">Address Proof</SelectItem>
                              <SelectItem value="contract">Employment Contract</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="document">Upload Document</Label>
                          <Input id="document" type="file" onChange={handleDocumentChange} />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={uploadDocument}
                            disabled={!newDocument || uploadingDocument}
                            className="w-full"
                          >
                            {uploadingDocument ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left font-medium">Type</th>
                            <th className="p-2 text-left font-medium">Name</th>
                            <th className="p-2 text-left font-medium">Uploaded</th>
                            <th className="p-2 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-muted-foreground">
                                No documents uploaded
                              </td>
                            </tr>
                          ) : (
                            documents.map((doc) => (
                              <tr key={doc.id} className="border-b">
                                <td className="p-2">
                                  <Badge variant="outline" className="capitalize">
                                    {doc.type}
                                  </Badge>
                                </td>
                                <td className="p-2">{doc.name}</td>
                                <td className="p-2">
                                  {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM dd, yyyy") : "N/A"}
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" asChild>
                                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Edit additional details about the employee</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      name="education"
                      value={employee.education}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Degrees, institutions, graduation years"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Textarea
                      id="skills"
                      name="skills"
                      value={employee.skills}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Technical skills, soft skills, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Textarea
                      id="certifications"
                      name="certifications"
                      value={employee.certifications}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Professional certifications, licenses, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={employee.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any other relevant information"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this employee?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the employee record and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
