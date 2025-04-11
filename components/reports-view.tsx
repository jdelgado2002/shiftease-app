"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Users, DollarSign, Clock, BarChart3 } from "lucide-react"
import { useData } from "@/lib/data-service"
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"

// Types
interface Shift {
  id: number
  employeeId: number
  day: string
  date: string
  startTime: string
  endTime: string
  role: string
  status: string
  location: string
  notes?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profileImage?: string
  hourlyRate?: number
}

interface Location {
  id: string
  name: string
  address: string
  isMain: boolean
}

export function ReportsView() {
  const [reportType, setReportType] = useState("labor")
  const [timeframe, setTimeframe] = useState("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const { data: shifts } = useData<Shift>("shifts")
  const { data: employees } = useData<Employee>("users")
  const { data: locations } = useData<Location>("locations")

  // Calculate date ranges
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
  const dateRange = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`

  // Navigate between time periods
  const goToPrevious = () => {
    if (timeframe === "week") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else if (timeframe === "month") {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() - 1)
      setCurrentDate(newDate)
    }
  }

  const goToNext = () => {
    if (timeframe === "week") {
      setCurrentDate(addWeeks(currentDate, 1))
    } else if (timeframe === "month") {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() + 1)
      setCurrentDate(newDate)
    }
  }

  // Filter shifts based on selected date range and location
  const filteredShifts = shifts.filter((shift) => {
    const shiftDate = parseISO(shift.date)
    const isInRange = shiftDate >= startDate && shiftDate <= endDate
    const matchesLocation = selectedLocation ? shift.location === selectedLocation : true
    return isInRange && matchesLocation
  })

  // Calculate labor metrics
  const calculateLaborMetrics = () => {
    const totalHours = filteredShifts.reduce((total, shift) => {
      const startHour = Number.parseInt(shift.startTime.split(":")[0])
      const endHour = Number.parseInt(shift.endTime.split(":")[0])
      const hours = endHour - startHour
      return total + hours
    }, 0)

    const totalCost = filteredShifts.reduce((total, shift) => {
      const employee = employees.find((e) => e.id === shift.employeeId.toString())
      const hourlyRate = employee?.hourlyRate || 15 // Default rate if not specified
      const startHour = Number.parseInt(shift.startTime.split(":")[0])
      const endHour = Number.parseInt(shift.endTime.split(":")[0])
      const hours = endHour - startHour
      return total + hours * hourlyRate
    }, 0)

    const laborByRole = filteredShifts.reduce(
      (acc, shift) => {
        const role = shift.role
        const startHour = Number.parseInt(shift.startTime.split(":")[0])
        const endHour = Number.parseInt(shift.endTime.split(":")[0])
        const hours = endHour - startHour

        if (!acc[role]) {
          acc[role] = { hours: 0, cost: 0 }
        }

        const employee = employees.find((e) => e.id === shift.employeeId.toString())
        const hourlyRate = employee?.hourlyRate || 15

        acc[role].hours += hours
        acc[role].cost += hours * hourlyRate

        return acc
      },
      {} as Record<string, { hours: number; cost: number }>,
    )

    return {
      totalHours,
      totalCost,
      laborByRole,
      averageHourlyRate: totalHours > 0 ? totalCost / totalHours : 0,
    }
  }

  // Calculate staff metrics
  const calculateStaffMetrics = () => {
    const employeeShifts = filteredShifts.reduce(
      (acc, shift) => {
        const employeeId = shift.employeeId.toString()
        if (!acc[employeeId]) {
          acc[employeeId] = []
        }
        acc[employeeId].push(shift)
        return acc
      },
      {} as Record<string, Shift[]>,
    )

    const employeeMetrics = Object.entries(employeeShifts)
      .map(([employeeId, shifts]) => {
        const employee = employees.find((e) => e.id === employeeId)
        const totalHours = shifts.reduce((total, shift) => {
          const startHour = Number.parseInt(shift.startTime.split(":")[0])
          const endHour = Number.parseInt(shift.endTime.split(":")[0])
          const hours = endHour - startHour
          return total + hours
        }, 0)

        const hourlyRate = employee?.hourlyRate || 15
        const totalCost = totalHours * hourlyRate

        return {
          employeeId,
          name: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          role: employee?.role || "Unknown",
          totalHours,
          totalCost,
          shiftsCount: shifts.length,
        }
      })
      .sort((a, b) => b.totalHours - a.totalHours)

    return {
      employeeMetrics,
      totalEmployees: Object.keys(employeeShifts).length,
      averageHoursPerEmployee: employeeMetrics.reduce((sum, e) => sum + e.totalHours, 0) / employeeMetrics.length || 0,
    }
  }

  const laborMetrics = calculateLaborMetrics()
  const staffMetrics = calculateStaffMetrics()

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Analyze your restaurant's performance and labor costs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor Cost</SelectItem>
                  <SelectItem value="staff">Staff Analysis</SelectItem>
                  <SelectItem value="schedule">Schedule Coverage</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Timeframe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={goToPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{dateRange}</span>
                  <Button variant="ghost" size="icon" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedLocation || "all"}
                onValueChange={(value) => setSelectedLocation(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Labor Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="text-2xl font-bold">{laborMetrics.totalHours}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Labor Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="text-2xl font-bold">${laborMetrics.totalCost.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Staff Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="text-2xl font-bold">{staffMetrics.totalEmployees}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Avg. Hours/Employee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="text-2xl font-bold">{staffMetrics.averageHoursPerEmployee.toFixed(1)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {reportType === "labor" && (
              <Card>
                <CardHeader>
                  <CardTitle>Labor Cost by Role</CardTitle>
                  <CardDescription>Breakdown of labor hours and costs by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(laborMetrics.laborByRole).map(([role, data]) => (
                      <div key={role} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">{role}</div>
                          <div className="text-sm text-muted-foreground">{data.hours} hours</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${data.cost.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {((data.cost / laborMetrics.totalCost) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "staff" && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Staff by Hours</CardTitle>
                  <CardDescription>Employees with the most scheduled hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffMetrics.employeeMetrics.slice(0, 5).map((employee) => (
                      <div key={employee.employeeId} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{employee.totalHours} hours</div>
                          <div className="text-sm text-muted-foreground">{employee.shiftsCount} shifts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "schedule" && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Coverage</CardTitle>
                  <CardDescription>Analysis of shift coverage by day and role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                      const dayShifts = filteredShifts.filter((shift) => shift.day === day)
                      const totalShifts = dayShifts.length

                      return (
                        <div key={day} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <div className="font-medium">{day}</div>
                            <div className="text-sm text-muted-foreground">{totalShifts} shifts</div>
                          </div>
                          <div className="flex gap-2">
                            {["Server", "Bartender", "Host", "Cook", "Manager"].map((role) => {
                              const roleCount = dayShifts.filter((shift) => shift.role === role).length
                              if (roleCount === 0) return null

                              return (
                                <div key={role} className="text-xs px-2 py-1 rounded-full bg-muted">
                                  {role}: {roleCount}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details">
            {reportType === "labor" && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Labor Analysis</CardTitle>
                  <CardDescription>Complete breakdown of labor costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Employee</th>
                          <th className="text-left py-2">Role</th>
                          <th className="text-left py-2">Hours</th>
                          <th className="text-left py-2">Cost</th>
                          <th className="text-left py-2">Shifts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMetrics.employeeMetrics.map((employee) => (
                          <tr key={employee.employeeId} className="border-b">
                            <td className="py-2">{employee.name}</td>
                            <td className="py-2">{employee.role}</td>
                            <td className="py-2">{employee.totalHours}</td>
                            <td className="py-2">${employee.totalCost.toFixed(2)}</td>
                            <td className="py-2">{employee.shiftsCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "staff" && (
              <Card>
                <CardHeader>
                  <CardTitle>Staff Utilization</CardTitle>
                  <CardDescription>Detailed analysis of staff scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Employee</th>
                          <th className="text-left py-2">Role</th>
                          <th className="text-left py-2">Hours</th>
                          <th className="text-left py-2">Shifts</th>
                          <th className="text-left py-2">Avg Hours/Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMetrics.employeeMetrics.map((employee) => (
                          <tr key={employee.employeeId} className="border-b">
                            <td className="py-2">{employee.name}</td>
                            <td className="py-2">{employee.role}</td>
                            <td className="py-2">{employee.totalHours}</td>
                            <td className="py-2">{employee.shiftsCount}</td>
                            <td className="py-2">
                              {employee.shiftsCount > 0 ? (employee.totalHours / employee.shiftsCount).toFixed(1) : 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "schedule" && (
              <Card>
                <CardHeader>
                  <CardTitle>Shift Distribution</CardTitle>
                  <CardDescription>Detailed breakdown of shifts by day and time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Day</th>
                          <th className="text-left py-2">Morning (9AM-12PM)</th>
                          <th className="text-left py-2">Afternoon (12PM-5PM)</th>
                          <th className="text-left py-2">Evening (5PM-10PM)</th>
                          <th className="text-left py-2">Night (10PM-2AM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                          const dayShifts = filteredShifts.filter((shift) => shift.day === day)

                          const morningShifts = dayShifts.filter((shift) => {
                            const hour = Number.parseInt(shift.startTime.split(":")[0])
                            return shift.startTime.includes("AM") && hour >= 9
                          }).length

                          const afternoonShifts = dayShifts.filter((shift) => {
                            const hour = Number.parseInt(shift.startTime.split(":")[0])
                            return (
                              (shift.startTime.includes("PM") && hour <= 5) ||
                              (shift.startTime.includes("AM") && hour === 12)
                            )
                          }).length

                          const eveningShifts = dayShifts.filter((shift) => {
                            const hour = Number.parseInt(shift.startTime.split(":")[0])
                            return shift.startTime.includes("PM") && hour > 5 && hour < 10
                          }).length

                          const nightShifts = dayShifts.filter((shift) => {
                            const hour = Number.parseInt(shift.startTime.split(":")[0])
                            return (
                              (shift.startTime.includes("PM") && hour >= 10) ||
                              (shift.startTime.includes("AM") && hour < 6)
                            )
                          }).length

                          return (
                            <tr key={day} className="border-b">
                              <td className="py-2">{day}</td>
                              <td className="py-2">{morningShifts}</td>
                              <td className="py-2">{afternoonShifts}</td>
                              <td className="py-2">{eveningShifts}</td>
                              <td className="py-2">{nightShifts}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  {reportType === "labor"
                    ? "Labor cost trends over time"
                    : reportType === "staff"
                      ? "Staff utilization trends"
                      : "Schedule coverage trends"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">Historical data will be displayed here</p>
                    <p className="text-sm">Select a longer timeframe to view trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Missing components
function ChevronLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
