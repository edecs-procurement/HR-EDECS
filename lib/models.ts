// Employee Management
export interface Employee {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  nationality: string
  employeeId: string
  joinDate: string
  employmentType: string
  workLocation: string
  reportingManager: string
  bankName: string
  accountNumber: string
  basicSalary: number
  taxId: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
  education: string
  skills: string
  certifications: string
  notes: string
  photoURL: string
  documents: EmployeeDocument[]
  createdAt: string
  updatedAt: string
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  type: string // resume, id, contract, etc.
  name: string
  url: string
  uploadedAt: string
}

// Attendance & Time Tracking
export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  status: "present" | "absent" | "late" | "leave"
  workHours: number
  overtime: number
  late: boolean
  notes: string
}

// Payroll
export interface Payroll {
  id: string
  employeeId: string
  month: string
  year: string
  basicSalary: number
  allowances: number
  deductions: number
  overtimePay: number
  bonus: number
  taxDeduction: number
  socialInsurance: number
  pension: number
  netSalary: number
  paymentDate: string
  paymentStatus: "pending" | "paid"
  notes: string
}

export interface TemporaryLabor {
  id: string
  name: string
  type: string
  projectId: string
  days: number
  ratePerDay: number
  totalAmount: number
  paymentDate: string
  paymentStatus: "pending" | "paid"
  notes: string
}

// Leave Management
export interface LeaveRequest {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected"
  approvedBy: string
  approvedAt: string
  appliedOn: string
  notes: string
}

export interface LeaveBalance {
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

// Recruitment
export interface JobOpening {
  id: string
  title: string
  department: string
  location: string
  type: string
  description: string
  requirements: string
  salary: string
  status: "open" | "closed"
  postedDate: string
  closingDate: string
}

export interface Applicant {
  id: string
  jobId: string
  name: string
  email: string
  phone: string
  resumeUrl: string
  coverLetterUrl: string
  status: "new" | "screening" | "interview" | "offered" | "hired" | "rejected"
  notes: string
  appliedDate: string
}

// Training & Development
export interface TrainingCourse {
  id: string
  title: string
  description: string
  instructor: string
  startDate: string
  endDate: string
  location: string
  capacity: number
  status: "upcoming" | "ongoing" | "completed"
}

export interface TrainingEnrollment {
  id: string
  courseId: string
  employeeId: string
  status: "enrolled" | "completed" | "cancelled"
  enrollmentDate: string
  completionDate: string
  feedback: string
  rating: number
}

// Performance Evaluation
export interface PerformanceEvaluation {
  id: string
  employeeId: string
  evaluatorId: string
  period: string
  date: string
  ratings: {
    productivity: number
    quality: number
    jobKnowledge: number
    reliability: number
    attendance: number
    communication: number
    teamwork: number
    initiative: number
    overall: number
  }
  strengths: string
  areasForImprovement: string
  goals: string
  comments: string
  status: "draft" | "submitted" | "acknowledged"
}

// Project Assignment
export interface Project {
  id: string
  name: string
  client: string
  location: string
  startDate: string
  endDate: string
  budget: number
  status: "planning" | "ongoing" | "completed" | "on-hold"
  description: string
}

export interface ProjectAssignment {
  id: string
  projectId: string
  employeeId: string
  role: string
  startDate: string
  endDate: string
  hoursPerDay: number
  status: "active" | "completed" | "cancelled"
}

export interface ProjectTimesheet {
  id: string
  projectId: string
  employeeId: string
  date: string
  hours: number
  description: string
  status: "pending" | "approved" | "rejected"
}
