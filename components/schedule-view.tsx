"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Filter, Plus, AlertCircle } from "lucide-react"
import { format, addDays, subDays, parseISO, isSameDay, isWithinInterval } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRole } from "@/components/role-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/lib/data-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Types
interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profileImage?: string
}

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

interface Availability {
  id: number
  employeeId: number
  availability: {
    [day: string]: {
      morning: boolean
      afternoon: boolean
      evening: boolean
      night: boolean
    }
  }
}

interface TimeOffRequest {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  reason: string
  status: string
}

interface StaffingRequirement {
  id: number
  day: string
  timeSlot: string
  role: string
  count: number
  locationId: string
}

export function ScheduleView() {
  const { role } = useRole()
  const { user } = useAuth()
  const { toast } = useToast()

  // Data hooks
  const {
    data: shifts,
    loading: loadingShifts,
    create: createShift,
    update: updateShift,
    delete: deleteShift,
  } = useData<Shift>("shifts")

  const { data: employees } = useData<Employee>("users")
  const { data: availabilityData } = useData<Availability>("availability")
  const { data: timeOffRequests } = useData<TimeOffRequest>("timeoff")
  const { data: staffingRequirements } = useData<StaffingRequirement>("staffingRequirements")

  // State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false)
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // New shift form state
  const [newShift, setNewShift] = useState({
    employeeId: "",
    day: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    role: "",
    notes: "",
    location: "1",
  })

  // Generate week days - memoize to prevent recalculation on every render
  const weekDays = useCallback(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i)
      return {
        date,
        day: format(date, "EEEE"),
        dateString: format(date, "yyyy-MM-dd"),
      }
    })
  }, [currentWeekStart])

  // Format week display
  const weekDisplay = `${format(currentWeekStart, "MMMM d")} - ${format(addDays(currentWeekStart, 6), "MMMM d, yyyy")}`

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subDays(currentWeekStart, 7))
  }

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  // Filter shifts - memoize to prevent recalculation on every render
  const filteredShifts = useCallback(() => {
    return shifts.filter((shift) => {
      // Check if shift is in current week
      const shiftDate = parseISO(shift.date)
      const isInCurrentWeek = weekDays().some((day) => isSameDay(day.date, shiftDate))

      if (!isInCurrentWeek) return false

      // Apply role filter
      if (filterRole && shift.role !== filterRole) return false

      // Apply employee filter
      if (filterEmployee && shift.employeeId.toString() !== filterEmployee) return false

      return true
    })
  }, [shifts, filterRole, filterEmployee, weekDays])

  // Group shifts by day - memoize to prevent recalculation on every render
  const shiftsByDay = useCallback(() => {
    return weekDays().reduce(
      (acc, { day, dateString }) => {
        acc[day] = filteredShifts().filter((shift) => shift.date === dateString)
        return acc
      },
      {} as Record<string, Shift[]>,
    )
  }, [filteredShifts, weekDays])

  // Group shifts by employee - memoize to prevent recalculation on every render
  const shiftsByEmployee = useCallback(() => {
    return employees.reduce(
      (acc, employee) => {
        acc[employee.id] = filteredShifts().filter((shift) => shift.employeeId.toString() === employee.id)
        return acc
      },
      {} as Record<string, Shift[]>,
    )
  }, [employees, filteredShifts])

  // Handle creating a new shift
  const handleCreateShift = async () => {
    if (!newShift.employeeId || !newShift.day || !newShift.startTime || !newShift.endTime || !newShift.role) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const shiftData = {
        ...newShift,
        employeeId: Number.parseInt(newShift.employeeId),
        status: "scheduled",
      }

      await createShift(shiftData)

      setIsCreateShiftOpen(false)
      setNewShift({
        employeeId: "",
        day: "",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "9:00 AM",
        endTime: "5:00 PM",
        role: "",
        notes: "",
        location: "1",
      })

      toast({
        title: "Shift created",
        description: `A new shift has been added to the schedule.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create shift. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle updating a shift
  const handleUpdateShift = async () => {
    if (!selectedShift) return

    try {
      await updateShift(selectedShift.id, selectedShift)

      setIsEditShiftOpen(false)
      setSelectedShift(null)

      toast({
        title: "Shift updated",
        description: `The shift has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shift. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a shift
  const handleDeleteShift = async (id: number) => {
    try {
      await deleteShift(id)

      setIsEditShiftOpen(false)
      setSelectedShift(null)

      toast({
        title: "Shift deleted",
        description: "The shift has been removed from the schedule.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shift. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if employee is available for a shift
  const checkEmployeeAvailability = (employeeId: number, day: string, startTime: string, endTime: string) => {
    // Get employee availability
    const employeeAvailability = availabilityData.find((a) => a.employeeId === employeeId)?.availability

    if (!employeeAvailability) {
      return { available: false, reason: "No availability data found" }
    }

    // Determine time blocks based on start and end times
    const timeBlocks = getTimeBlocksForShift(startTime, endTime)

    // Check if employee is available for all required time blocks
    const dayAvailability = employeeAvailability[day]

    if (!dayAvailability) {
      return { available: false, reason: "No availability data for this day" }
    }

    const unavailableBlocks = timeBlocks.filter((block) => !dayAvailability[block])

    if (unavailableBlocks.length > 0) {
      return {
        available: false,
        reason: `Employee is not available during ${unavailableBlocks.join(", ")} on ${day}`,
      }
    }

    // Check for time off requests
    const hasTimeOff = checkForTimeOffConflict(employeeId, day)
    if (hasTimeOff) {
      return { available: false, reason: "Employee has approved time off on this day" }
    }

    // Check for existing shifts (to prevent double booking)
    const hasConflict = checkForShiftConflict(employeeId, day, startTime, endTime)
    if (hasConflict) {
      return { available: false, reason: "Employee already has a shift during this time" }
    }

    return { available: true, reason: "" }
  }

  // Get time blocks for a shift
  const getTimeBlocksForShift = (startTime: string, endTime: string) => {
    const blocks: string[] = []

    // Simple mapping of time ranges to blocks
    // In a real app, this would be more sophisticated
    if (startTime.includes("AM") || (startTime.includes("PM") && Number.parseInt(startTime) < 12)) {
      if (Number.parseInt(startTime) < 12) blocks.push("morning")
    }

    if (
      (startTime.includes("PM") && Number.parseInt(startTime) < 5) ||
      (endTime.includes("PM") && Number.parseInt(endTime) <= 5)
    ) {
      blocks.push("afternoon")
    }

    if (
      (startTime.includes("PM") && Number.parseInt(startTime) >= 5 && Number.parseInt(startTime) < 10) ||
      (endTime.includes("PM") && Number.parseInt(endTime) > 5)
    ) {
      blocks.push("evening")
    }

    if (
      (startTime.includes("PM") && Number.parseInt(startTime) >= 10) ||
      (endTime.includes("AM") && Number.parseInt(endTime) < 6)
    ) {
      blocks.push("night")
    }

    return blocks
  }

  // Check for time off conflict
  const checkForTimeOffConflict = (employeeId: number, day: string) => {
    const dayDate = weekDays().find((d) => d.day === day)?.dateString

    if (!dayDate) return false

    return timeOffRequests.some((request) => {
      if (request.employeeId !== employeeId || request.status !== "approved") return false

      const startDate = parseISO(request.startDate)
      const endDate = parseISO(request.endDate)
      const shiftDate = parseISO(dayDate)

      return isWithinInterval(shiftDate, { start: startDate, end: endDate })
    })
  }

  // Check for shift conflict
  const checkForShiftConflict = (employeeId: number, day: string, startTime: string, endTime: string) => {
    const dayDate = weekDays().find((d) => d.day === day)?.dateString

    if (!dayDate) return false

    return shifts.some((shift) => {
      if (shift.employeeId !== employeeId || shift.date !== dayDate) return false

      // Simple time overlap check
      // In a real app, this would use proper time comparison
      const shiftStart = timeToMinutes(shift.startTime)
      const shiftEnd = timeToMinutes(shift.endTime)
      const newStart = timeToMinutes(startTime)
      const newEnd = timeToMinutes(endTime)

      return newStart < shiftEnd && newEnd > shiftStart
    })
  }

  // Convert time string to minutes for comparison
  const timeToMinutes = (timeStr: string) => {
    const [hourStr, minuteStr] = timeStr.split(":")
    let [hour, minute] = [Number.parseInt(hourStr), 0]

    if (minuteStr) {
      minute = Number.parseInt(minuteStr.split(" ")[0])
    }

    if (timeStr.includes("PM") && hour < 12) {
      hour += 12
    } else if (timeStr.includes("AM") && hour === 12) {
      hour = 0
    }

    return hour * 60 + minute
  }

  // Check staffing requirements
  const checkStaffingRequirements = (day: string, role: string, startTime: string, endTime: string) => {
    // Find matching staffing requirements
    const matchingRequirements = staffingRequirements.filter(
      (req) => req.day === day && req.role === role && req.timeSlot.includes(startTime),
    )

    if (matchingRequirements.length === 0) {
      return { met: true, required: 0, scheduled: 0 }
    }

    // Count scheduled shifts for this requirement
    const requirement = matchingRequirements[0]
    const scheduledCount = shifts.filter(
      (shift) => shift.day === day && shift.role === role && shift.startTime === startTime,
    ).length

    return {
      met: scheduledCount >= requirement.count,
      required: requirement.count,
      scheduled: scheduledCount,
    }
  }

  // Get employee name
  const getEmployeeName = (id: number) => {
    const employee = employees.find((emp) => emp.id === id.toString())
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown"
  }

  // Initialize new shift when day is selected
  useEffect(() => {
    if (selectedDay) {
      const selectedDate = weekDays().find((d) => d.day === selectedDay)?.dateString || ""
      setNewShift((prev) => ({
        ...prev,
        day: selectedDay,
        date: selectedDate,
      }))
    }
  }, [selectedDay, weekDays])

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setFilterRole(value === "all" ? null : value)
  }

  // Handle employee filter change
  const handleEmployeeFilterChange = (value: string) => {
    setFilterEmployee(value === "all" ? null : value)
  }

  // Check if user can manage schedule
  const canManageSchedule = role === "owner" || role === "manager"

  // Get current filtered shifts
  const currentFilteredShifts = filteredShifts()
  const currentShiftsByDay = shiftsByDay()

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Weekly Schedule</h1>
            <div className="flex items-center mt-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{weekDisplay}</span>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {canManageSchedule && (
              <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Shift
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Shift</DialogTitle>
                    <DialogDescription>Add a new shift to the schedule. Click save when you're done.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Employee</Label>
                      <Select
                        value={newShift.employeeId}
                        onValueChange={(value) => setNewShift({ ...newShift, employeeId: value })}
                      >
                        <SelectTrigger id="employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees
                            .filter((emp) => emp.role === "employee" || emp.role === "manager")
                            .map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newShift.role}
                        onValueChange={(value) => setNewShift({ ...newShift, role: value })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Bartender">Bartender</SelectItem>
                          <SelectItem value="Host">Host</SelectItem>
                          <SelectItem value="Cook">Cook</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select
                        value={newShift.day}
                        onValueChange={(value) => {
                          const selectedDate = weekDays().find((d) => d.day === value)?.dateString || ""
                          setNewShift({
                            ...newShift,
                            day: value,
                            date: selectedDate,
                          })
                        }}
                      >
                        <SelectTrigger id="day">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays().map(({ day }) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Select
                          value={newShift.startTime}
                          onValueChange={(value) => setNewShift({ ...newShift, startTime: value })}
                        >
                          <SelectTrigger id="startTime">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                            <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                            <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                            <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                            <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                            <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                            <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                            <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                            <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                            <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                            <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                            <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                            <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                            <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Select
                          value={newShift.endTime}
                          onValueChange={(value) => setNewShift({ ...newShift, endTime: value })}
                        >
                          <SelectTrigger id="endTime">
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                            <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                            <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                            <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                            <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                            <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                            <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                            <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                            <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                            <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                            <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                            <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                            <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                            <SelectItem value="11:00 PM">11:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Availability Check */}
                    {newShift.employeeId && newShift.day && newShift.startTime && newShift.endTime && (
                      <div className="mt-2">
                        {(() => {
                          const availabilityCheck = checkEmployeeAvailability(
                            Number.parseInt(newShift.employeeId),
                            newShift.day,
                            newShift.startTime,
                            newShift.endTime,
                          )

                          if (!availabilityCheck.available) {
                            return (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Availability Conflict</AlertTitle>
                                <AlertDescription>{availabilityCheck.reason}</AlertDescription>
                              </Alert>
                            )
                          }

                          return (
                            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <AlertTitle>Employee is Available</AlertTitle>
                              <AlertDescription>This time slot matches the employee's availability</AlertDescription>
                            </Alert>
                          )
                        })()}
                      </div>
                    )}

                    {/* Staffing Requirements Check */}
                    {newShift.day && newShift.role && newShift.startTime && newShift.endTime && (
                      <div className="mt-2">
                        {(() => {
                          const requirementsCheck = checkStaffingRequirements(
                            newShift.day,
                            newShift.role,
                            newShift.startTime,
                            newShift.endTime,
                          )

                          if (!requirementsCheck.met) {
                            return (
                              <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <AlertTitle>Staffing Requirement</AlertTitle>
                                <AlertDescription>
                                  {requirementsCheck.scheduled}/{requirementsCheck.required} {newShift.role}(s)
                                  scheduled for this time slot
                                </AlertDescription>
                              </Alert>
                            )
                          }

                          return (
                            <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                              <InfoIcon className="h-4 w-4 text-blue-500" />
                              <AlertTitle>Staffing Information</AlertTitle>
                              <AlertDescription>
                                {requirementsCheck.required > 0
                                  ? `${requirementsCheck.scheduled}/${requirementsCheck.required} ${newShift.role}(s) scheduled for this time slot`
                                  : `No specific staffing requirement for this time slot`}
                              </AlertDescription>
                            </Alert>
                          )
                        })()}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newShift.notes}
                        onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                        placeholder="Add any special instructions or notes about this shift"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateShift}
                      disabled={
                        !newShift.employeeId ||
                        !newShift.day ||
                        !newShift.startTime ||
                        !newShift.endTime ||
                        !newShift.role ||
                        (newShift.employeeId &&
                          newShift.day &&
                          newShift.startTime &&
                          newShift.endTime &&
                          !checkEmployeeAvailability(
                            Number.parseInt(newShift.employeeId),
                            newShift.day,
                            newShift.startTime,
                            newShift.endTime,
                          ).available)
                      }
                    >
                      Create Shift
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: "Schedule published",
                  description: "All employees have been notified of their shifts",
                })
              }}
            >
              Publish Schedule
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Card className="md:w-64 shrink-0">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-filter">Role</Label>
                <Select onValueChange={handleRoleFilterChange}>
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder={filterRole || "All Roles"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Server">Server</SelectItem>
                    <SelectItem value="Bartender">Bartender</SelectItem>
                    <SelectItem value="Host">Host</SelectItem>
                    <SelectItem value="Cook">Cook</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee-filter">Employee</Label>
                <Select onValueChange={handleEmployeeFilterChange}>
                  <SelectTrigger id="employee-filter">
                    <SelectValue
                      placeholder={
                        filterEmployee
                          ? employees.find((e) => e.id === filterEmployee)?.firstName +
                            " " +
                            employees.find((e) => e.id === filterEmployee)?.lastName
                          : "All Employees"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees
                      .filter((emp) => emp.role === "employee" || emp.role === "manager")
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilterRole(null)
                  setFilterEmployee(null)
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-auto">
            <Tabs
              defaultValue="grid"
              className="w-full"
              onValueChange={(value) => setViewMode(value as "grid" | "list")}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>

              <TabsContent value="grid" className="space-y-4">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 gap-2">
                      <div className="font-medium text-center p-2 bg-muted rounded-md">Employees</div>
                      {weekDays().map(({ day }) => (
                        <div key={day} className="font-medium text-center p-2 bg-muted rounded-md">
                          {day}
                        </div>
                      ))}
                    </div>

                    {employees
                      .filter((emp) => emp.role === "employee" || emp.role === "manager")
                      .filter((emp) => !filterEmployee || emp.id === filterEmployee)
                      .map((employee) => (
                        <div key={employee.id} className="grid grid-cols-8 gap-2 mt-2">
                          <div className="flex flex-col justify-center p-2 bg-muted/50 rounded-md">
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{employee.role}</div>
                          </div>

                          {weekDays().map(({ day, dateString }) => {
                            const dayShifts = currentFilteredShifts.filter(
                              (shift) => shift.date === dateString && shift.employeeId.toString() === employee.id,
                            )

                            return (
                              <div key={day} className="relative min-h-[80px] border rounded-md p-1">
                                {dayShifts.map((shift) => (
                                  <Dialog
                                    key={shift.id}
                                    open={isEditShiftOpen && selectedShift?.id === shift.id}
                                    onOpenChange={(open) => {
                                      setIsEditShiftOpen(open)
                                      if (!open) setSelectedShift(null)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <div
                                        className={`cursor-pointer text-xs p-1 mb-1 rounded ${
                                          shift.role === "Server"
                                            ? "bg-blue-100 border border-blue-200"
                                            : shift.role === "Bartender"
                                              ? "bg-purple-100 border border-purple-200"
                                              : shift.role === "Host"
                                                ? "bg-green-100 border border-green-200"
                                                : shift.role === "Cook"
                                                  ? "bg-orange-100 border border-orange-200"
                                                  : "bg-gray-100 border border-gray-200"
                                        } hover:bg-primary/20`}
                                        onClick={() => setSelectedShift(shift)}
                                      >
                                        <div className="font-medium">
                                          {shift.startTime} - {shift.endTime}
                                        </div>
                                        <div>{shift.role}</div>
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Shift</DialogTitle>
                                        <DialogDescription>Make changes to this shift or delete it.</DialogDescription>
                                      </DialogHeader>
                                      {selectedShift && (
                                        <div className="grid gap-4 py-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-employee">Employee</Label>
                                            <Select
                                              value={selectedShift.employeeId.toString()}
                                              onValueChange={(value) =>
                                                setSelectedShift({
                                                  ...selectedShift,
                                                  employeeId: Number.parseInt(value),
                                                })
                                              }
                                            >
                                              <SelectTrigger id="edit-employee">
                                                <SelectValue placeholder="Select employee" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {employees
                                                  .filter((emp) => emp.role === "employee" || emp.role === "manager")
                                                  .map((employee) => (
                                                    <SelectItem key={employee.id} value={employee.id}>
                                                      {employee.firstName} {employee.lastName}
                                                    </SelectItem>
                                                  ))}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="edit-role">Role</Label>
                                            <Select
                                              value={selectedShift.role}
                                              onValueChange={(value) =>
                                                setSelectedShift({
                                                  ...selectedShift,
                                                  role: value,
                                                })
                                              }
                                            >
                                              <SelectTrigger id="edit-role">
                                                <SelectValue placeholder="Select role" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Server">Server</SelectItem>
                                                <SelectItem value="Bartender">Bartender</SelectItem>
                                                <SelectItem value="Host">Host</SelectItem>
                                                <SelectItem value="Cook">Cook</SelectItem>
                                                <SelectItem value="Manager">Manager</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-startTime">Start Time</Label>
                                              <Select
                                                value={selectedShift.startTime}
                                                onValueChange={(value) =>
                                                  setSelectedShift({
                                                    ...selectedShift,
                                                    startTime: value,
                                                  })
                                                }
                                              >
                                                <SelectTrigger id="edit-startTime">
                                                  <SelectValue placeholder="Select start time" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                                                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                                  <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                                  <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                                                  <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                                                  <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                                                  <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                                                  <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                                                  <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="space-y-2">
                                              <Label htmlFor="edit-endTime">End Time</Label>
                                              <Select
                                                value={selectedShift.endTime}
                                                onValueChange={(value) =>
                                                  setSelectedShift({
                                                    ...selectedShift,
                                                    endTime: value,
                                                  })
                                                }
                                              >
                                                <SelectTrigger id="edit-endTime">
                                                  <SelectValue placeholder="Select end time" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                                  <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                                  <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                                                  <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                                                  <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                                                  <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                                                  <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                                                  <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                                                  <SelectItem value="11:00 PM">11:00 PM</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="edit-notes">Notes (Optional)</Label>
                                            <Textarea
                                              id="edit-notes"
                                              value={selectedShift.notes || ""}
                                              onChange={(e) =>
                                                setSelectedShift({
                                                  ...selectedShift,
                                                  notes: e.target.value,
                                                })
                                              }
                                              placeholder="Add any special instructions or notes about this shift"
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleDeleteShift(selectedShift.id)}
                                        >
                                          Delete Shift
                                        </Button>
                                        <div className="flex gap-2 ml-auto">
                                          <Button variant="outline" onClick={() => setIsEditShiftOpen(false)}>
                                            Cancel
                                          </Button>
                                          <Button onClick={handleUpdateShift}>Save Changes</Button>
                                        </div>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                ))}

                                {dayShifts.length === 0 && canManageSchedule && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full h-full absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100"
                                          onClick={() => {
                                            setSelectedDay(day)
                                            setNewShift((prev) => ({
                                              ...prev,
                                              employeeId: employee.id,
                                              day: day,
                                              date: dateString,
                                              role: employee.role === "manager" ? "Manager" : "Server", // Default role
                                            }))
                                            setIsCreateShiftOpen(true)
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Add shift</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle>All Shifts</CardTitle>
                    <CardDescription>View all scheduled shifts for the week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {weekDays().map(({ day, dateString }) => {
                        const dayShifts = currentFilteredShifts.filter((shift) => shift.date === dateString)

                        return (
                          <div key={day}>
                            <h3 className="font-medium mb-2">
                              {day} ({format(parseISO(dateString), "MMM d")})
                            </h3>
                            <div className="space-y-2">
                              {dayShifts.length > 0 ? (
                                dayShifts
                                  .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                                  .map((shift) => (
                                    <Dialog
                                      key={shift.id}
                                      open={isEditShiftOpen && selectedShift?.id === shift.id}
                                      onOpenChange={(open) => {
                                        setIsEditShiftOpen(open)
                                        if (!open) setSelectedShift(null)
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <div
                                          className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                                          onClick={() => setSelectedShift(shift)}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage
                                                src={
                                                  employees.find((e) => e.id === shift.employeeId.toString())
                                                    ?.profileImage
                                                }
                                                alt={getEmployeeName(shift.employeeId)}
                                              />
                                              <AvatarFallback>
                                                {getEmployeeName(shift.employeeId)
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="font-medium">{getEmployeeName(shift.employeeId)}</div>
                                              <div className="text-sm text-muted-foreground">{shift.role}</div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div>
                                              {shift.startTime} - {shift.endTime}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{shift.day}</div>
                                          </div>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Shift</DialogTitle>
                                          <DialogDescription>
                                            Make changes to this shift or delete it.
                                          </DialogDescription>
                                        </DialogHeader>
                                        {selectedShift && (
                                          <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="edit-employee">Employee</Label>
                                              <Select
                                                value={selectedShift.employeeId.toString()}
                                                onValueChange={(value) =>
                                                  setSelectedShift({
                                                    ...selectedShift,
                                                    employeeId: Number.parseInt(value),
                                                  })
                                                }
                                              >
                                                <SelectTrigger id="edit-employee">
                                                  <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {employees
                                                    .filter((emp) => emp.role === "employee" || emp.role === "manager")
                                                    .map((employee) => (
                                                      <SelectItem key={employee.id} value={employee.id}>
                                                        {employee.firstName} {employee.lastName}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="space-y-2">
                                              <Label htmlFor="edit-role">Role</Label>
                                              <Select
                                                value={selectedShift.role}
                                                onValueChange={(value) =>
                                                  setSelectedShift({
                                                    ...selectedShift,
                                                    role: value,
                                                  })
                                                }
                                              >
                                                <SelectTrigger id="edit-role">
                                                  <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="Server">Server</SelectItem>
                                                  <SelectItem value="Bartender">Bartender</SelectItem>
                                                  <SelectItem value="Host">Host</SelectItem>
                                                  <SelectItem value="Cook">Cook</SelectItem>
                                                  <SelectItem value="Manager">Manager</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="edit-startTime">Start Time</Label>
                                                <Select
                                                  value={selectedShift.startTime}
                                                  onValueChange={(value) =>
                                                    setSelectedShift({
                                                      ...selectedShift,
                                                      startTime: value,
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger id="edit-startTime">
                                                    <SelectValue placeholder="Select start time" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                                                    <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                                    <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                                    <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                                    <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                                    <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                                    <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                                    <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                                    <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                                                    <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                                                    <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                                                    <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                                                    <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                                                    <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              <div className="space-y-2">
                                                <Label htmlFor="edit-endTime">End Time</Label>
                                                <Select
                                                  value={selectedShift.endTime}
                                                  onValueChange={(value) =>
                                                    setSelectedShift({
                                                      ...selectedShift,
                                                      endTime: value,
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger id="edit-endTime">
                                                    <SelectValue placeholder="Select end time" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                                    <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                                    <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                                    <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                                    <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                                    <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                                    <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                                    <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                                                    <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                                                    <SelectItem value="7:00 PM">7:00 PM</SelectItem>
                                                    <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                                                    <SelectItem value="9:00 PM">9:00 PM</SelectItem>
                                                    <SelectItem value="10:00 PM">10:00 PM</SelectItem>
                                                    <SelectItem value="11:00 PM">11:00 PM</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              <Label htmlFor="edit-notes">Notes (Optional)</Label>
                                              <Textarea
                                                id="edit-notes"
                                                value={selectedShift.notes || ""}
                                                onChange={(e) =>
                                                  setSelectedShift({
                                                    ...selectedShift,
                                                    notes: e.target.value,
                                                  })
                                                }
                                                placeholder="Add any special instructions or notes about this shift"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <DialogFooter>
                                          <Button
                                            variant="destructive"
                                            onClick={() => handleDeleteShift(selectedShift.id)}
                                          >
                                            Delete Shift
                                          </Button>
                                          <div className="flex gap-2 ml-auto">
                                            <Button variant="outline" onClick={() => setIsEditShiftOpen(false)}>
                                              Cancel
                                            </Button>
                                            <Button onClick={handleUpdateShift}>Save Changes</Button>
                                          </div>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  ))
                              ) : (
                                <div className="text-center p-4 text-muted-foreground">No shifts scheduled</div>
                              )}

                              {canManageSchedule && (
                                <Button
                                  variant="outline"
                                  className="w-full mt-2"
                                  onClick={() => {
                                    setSelectedDay(day)
                                    setNewShift((prev) => ({
                                      ...prev,
                                      day: day,
                                      date: dateString,
                                    }))
                                    setIsCreateShiftOpen(true)
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Shift for {day}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing components
function CheckCircle(props: any) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function InfoIcon(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
