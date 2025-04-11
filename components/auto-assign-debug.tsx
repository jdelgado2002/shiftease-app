"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

interface DebugData {
  employees: any[]
  availability: any[]
  staffingRequirements: any[]
  shifts: any[]
  settings: any
}

interface AutoAssignDebugProps {
  data: DebugData
  onClose: () => void
}

export function AutoAssignDebug({ data, onClose }: AutoAssignDebugProps) {
  const [activeTab, setActiveTab] = useState("employees")

  const { employees, availability, staffingRequirements, shifts, settings } = data

  // Calculate some statistics
  const employeeCount = employees.length
  const employeesWithAvailability = availability.length
  const requirementsCount = staffingRequirements.length
  const existingShiftsCount = shifts.length

  // Check for potential issues
  const issues = []

  if (employeesWithAvailability < employeeCount) {
    issues.push({
      severity: "high",
      message: `${employeeCount - employeesWithAvailability} employees don't have availability data`,
    })
  }

  if (requirementsCount === 0) {
    issues.push({
      severity: "high",
      message: "No staffing requirements found. Auto-assign needs requirements to generate shifts.",
    })
  }

  // Check if availability data is properly formatted
  const malformedAvailability = availability.filter((a) => !a.availability || Object.keys(a.availability).length === 0)

  if (malformedAvailability.length > 0) {
    issues.push({
      severity: "high",
      message: `${malformedAvailability.length} employees have malformed availability data`,
    })
  }

  // Check if any employees are available for the requirements
  let matchingEmployees = 0

  staffingRequirements.forEach((req) => {
    const day = req.day
    const role = req.role

    employees.forEach((emp) => {
      const empAvail = availability.find((a) => a.employeeId === Number(emp.id))
      if (empAvail && empAvail.availability && empAvail.availability[day]) {
        // This employee has availability for this day
        matchingEmployees++
      }
    })
  })

  if (matchingEmployees === 0 && requirementsCount > 0) {
    issues.push({
      severity: "high",
      message: "No employees match the availability needed for any requirements",
    })
  }

  return (
    <div className="space-y-6">
      <Alert variant={issues.length > 0 ? "destructive" : "default"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Auto-Assign Diagnostic</AlertTitle>
        <AlertDescription>
          {issues.length > 0
            ? "Issues were found that may prevent auto-assign from working properly."
            : "No major issues detected. Auto-assign should be able to generate shifts."}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeeCount}</div>
            <p className="text-sm text-muted-foreground">Total employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeesWithAvailability}</div>
            <p className="text-sm text-muted-foreground">Employees with availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requirementsCount}</div>
            <p className="text-sm text-muted-foreground">Staffing requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Existing Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{existingShiftsCount}</div>
            <p className="text-sm text-muted-foreground">Current shifts</p>
          </CardContent>
        </Card>
      </div>

      {issues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Issues Detected</CardTitle>
            <CardDescription>The following issues may prevent auto-assign from working properly</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant={issue.severity === "high" ? "destructive" : "outline"}>
                    {issue.severity === "high" ? "Critical" : "Warning"}
                  </Badge>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Data</CardTitle>
              <CardDescription>Employees that can be scheduled</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                {JSON.stringify(employees, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Data</CardTitle>
              <CardDescription>When employees are available to work</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                {JSON.stringify(availability, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Staffing Requirements</CardTitle>
              <CardDescription>Required staff for each day and time slot</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              {staffingRequirements.length > 0 ? (
                <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {JSON.stringify(staffingRequirements, null, 2)}
                </pre>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Requirements Found</AlertTitle>
                  <AlertDescription>
                    Auto-assign needs staffing requirements to generate shifts. Add requirements in the Staffing
                    Requirements section.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Assign Settings</CardTitle>
              <CardDescription>Current configuration for auto-assign</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
