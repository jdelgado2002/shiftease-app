"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Info } from "lucide-react"
import { format, addDays, subDays, parseISO, isSameDay, isWithinInterval } from "date-fns"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/components/ui/use-toast"
import { useRole } from "@/components/role-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/lib/data-service"
import { AutoAssignAlgorithm, type AutoAssignSettings } from "./auto-assign-algorithm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaffingRequirementsManager } from "./staffing-requirements-manager"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface OperatingHours {
  [day: string]: { open: string; close: string }
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

interface Location {
  id: string
  name: string
  address: string
  isMain: boolean
  operatingHours?: OperatingHours
}

interface ScheduleViewEnhancedProps {
  initialLocation?: string
  initialTab?: string
}

export const ScheduleViewEnhanced = ({ initialLocation, initialTab }: ScheduleViewEnhancedProps) => {
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
  const { data: locations } = useData<Location>("locations")

  // State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false)
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null)
  const [filterLocation, setFilterLocation] = useState<string | null>(initialLocation || null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false)
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showAvailabilityOverlay, setShowAvailabilityOverlay] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(initialTab || "grid")

  // New shift form state
  const [newShift, setNewShift] = useState({
    employeeId: "",
    day: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    role: "",
    notes: "",
    location: filterLocation || "1",
  })

  // Generate week days - memoize to prevent recalculation on every render
  const weekDays = useMemo(() => {
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
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // Check if shift is in current week
      const shiftDate = parseISO(shift.date)
      const isInCurrentWeek = weekDays.some((day) => isSameDay(day.date, shiftDate))

      if (!isInCurrentWeek) return false

      // Apply role filter
      if (filterRole && shift.role !== filterRole) return false

      // Apply employee filter
      if (filterEmployee && shift.employeeId.toString() !== filterEmployee) return false

      // Apply location filter
      if (filterLocation && shift.location !== filterLocation) return false

      return true
    })
  }, [shifts, filterRole, filterEmployee, filterLocation, weekDays])

  // Group shifts by day - memoize to prevent recalculation on every render
  const shiftsByDay = useMemo(() => {
    return weekDays.reduce(
      (acc, { day, dateString }) => {
        acc[day] = filteredShifts.filter((shift) => shift.date === dateString)
        return acc
      },
      {} as Record<string, Shift[]>,
    )
  }, [filteredShifts, weekDays])

  // Group shifts by employee - memoize to prevent recalculation on every render
  const shiftsByEmployee = useMemo(() => {
    return employees.reduce(
      (acc, employee) => {
        acc[employee.id] = filteredShifts.filter((shift) => shift.employeeId.toString() === employee.id)
        return acc
      },
      {} as Record<string, Shift[]>,
    )
  }, [employees, filteredShifts])

  // Get available time slots based on location operating hours
  const getAvailableTimeSlots = (day: string, locationId: string, type: "start" | "end") => {
    const location = locations.find((loc) => loc.id === locationId)
    if (!location || !location.operatingHours || !location.operatingHours[day]) {
      // Default time slots if no operating hours are set
      return type === "start"
        ? [
            "9:00 AM",
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "1:00 PM",
            "2:00 PM",
            "3:00 PM",
            "4:00 PM",
            "5:00 PM",
            "6:00 PM",
            "7:00 PM",
            "8:00 PM",
            "9:00 PM",
          ]
        : [
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "1:00 PM",
            "2:00 PM",
            "3:00 PM",
            "4:00 PM",
            "5:00 PM",
            "6:00 PM",
            "7:00 PM",
            "8:00 PM",
            "9:00 PM",
            "10:00 PM",
            "11:00 PM",
          ]
    }

    const hours = location.operatingHours[day]
    const openHour = extractHour(hours.open)
    const closeHour = extractHour(hours.close)

    // Generate time slots within operating hours
    const timeSlots: string[] = []

    // For start times, we go from opening to 1 hour before closing
    if (type === "start") {
      for (let hour = openHour; hour < closeHour; hour++) {
        const ampm = hour < 12 ? "AM" : "PM"
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        timeSlots.push(`${displayHour}:00 ${ampm}`)
      }
    }
    // For end times, we go from 1 hour after opening to closing
    else {
      for (let hour = openHour + 1; hour <= closeHour; hour++) {
        const ampm = hour < 12 ? "AM" : "PM"
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        timeSlots.push(`${displayHour}:00 ${ampm}`)
      }
    }

    return timeSlots
  }

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

    // Validate shift times against location operating hours
    const location = locations.find((loc) => loc.id === newShift.location)
    if (location?.operatingHours && location.operatingHours[newShift.day]) {
      const hours = location.operatingHours[newShift.day]
      const openHour = extractHour(hours.open)
      const closeHour = extractHour(hours.close)
      const startHour = extractHour(newShift.startTime)
      const endHour = extractHour(newShift.endTime)

      if (startHour < openHour || endHour > closeHour) {
        toast({
          title: "Invalid shift times",
          description: `This location is only open from ${hours.open} to ${hours.close} on ${newShift.day}.`,
          variant: "destructive",
        })
        return
      }
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
        location: filterLocation || "1",
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

    // Validate shift times against location operating hours
    const location = locations.find((loc) => loc.id === selectedShift.location)
    if (location?.operatingHours && location.operatingHours[selectedShift.day]) {
      const hours = location.operatingHours[selectedShift.day]
      const openHour = extractHour(hours.open)
      const closeHour = extractHour(hours.close)
      const startHour = extractHour(selectedShift.startTime)
      const endHour = extractHour(selectedShift.endTime)

      if (startHour < openHour || endHour > closeHour) {
        toast({
          title: "Invalid shift times",
          description: `This location is only open from ${hours.open} to ${hours.close} on ${selectedShift.day}.`,
          variant: "destructive",
        })
        return
      }
    }

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

    // Handle cases where the time format might be inconsistent
    const normalizedStartTime = startTime.trim()
    const normalizedEndTime = endTime.trim()

    // Extract hour values for easier comparison
    const startHour = extractHour(normalizedStartTime)
    const endHour = extractHour(normalizedEndTime)

    // Morning: 6 AM - 12 PM
    if ((startHour >= 6 && startHour < 12) || (startHour < endHour && endHour <= 12)) {
      blocks.push("morning")
    }

    // Afternoon: 12 PM - 5 PM
    if ((startHour >= 12 && startHour < 17) || (startHour < 17 && endHour > 12)) {
      blocks.push("afternoon")
    }

    // Evening: 5 PM - 10 PM
    if ((startHour >= 17 && startHour < 22) || (startHour < 22 && endHour > 17)) {
      blocks.push("evening")
    }

    // Night: 10 PM - 6 AM
    if (startHour >= 22 || endHour <= 6 || (startHour < 6 && endHour > 22)) {
      blocks.push("night")
    }

    // If no blocks were assigned, default to all blocks
    if (blocks.length === 0) {
      console.warn(`Could not determine time blocks for ${startTime} - ${endTime}, defaulting to all blocks`)
      blocks.push("morning", "afternoon", "evening", "night")
    }

    return blocks
  }

  // Helper function to extract hour from time string
  const extractHour = (timeStr: string) => {
    // Handle various time formats
    let hour = 0

    // Extract the hour part
    const match = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i)
    if (match) {
      hour = Number.parseInt(match[1], 10)
      const ampm = match[3]?.toLowerCase()

      // Convert to 24-hour format
      if (ampm === "pm" && hour < 12) {
        hour += 12
      } else if (ampm === "am" && hour === 12) {
        hour = 0
      }
    }

    return hour
  }

  // Check for time off conflict
  const checkForTimeOffConflict = (employeeId: number, day: string) => {
    const dayDate = weekDays.find((d) => d.day === day)?.dateString

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
    const dayDate = weekDays.find((d) => d.day === day)?.dateString

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

  // Get location name
  const getLocationName = (id: string) => {
    const location = locations.find((loc) => loc.id === id)
    return location ? location.name : "Unknown"
  }

  // Initialize new shift when day is selected
  useEffect(() => {
    if (selectedDay) {
      const selectedDate = weekDays.find((d) => d.day === selectedDay)?.dateString || ""
      setNewShift((prev) => ({
        ...prev,
        day: selectedDay,
        date: selectedDate,
      }))
    }
  }, [selectedDay, weekDays])

  // Update location when filter changes
  useEffect(() => {
    if (filterLocation) {
      setNewShift((prev) => ({
        ...prev,
        location: filterLocation,
      }))
    }
  }, [filterLocation])

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setFilterRole(value === "all" ? null : value)
  }

  // Handle employee filter change
  const handleEmployeeFilterChange = (value: string) => {
    setFilterEmployee(value === "all" ? null : value)
  }

  // Handle location filter change
  const handleLocationFilterChange = (value: string) => {
    setFilterLocation(value === "all" ? null : value)
  }

  // Auto-assign shifts
  const handleAutoAssign = (settings: AutoAssignSettings) => {
    setIsAutoAssignOpen(false)
    setIsGeneratingSchedule(true)
    setGenerationProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate auto-assign algorithm
    setTimeout(() => {
      clearInterval(interval)
      setIsGeneratingSchedule(false)
      setGenerationProgress(100)

      // Generate shifts based on availability and requirements
      const newShifts: Omit<Shift, "id">[] = []

      // Debug information
      console.log("Starting auto-assign with settings:", settings)
      console.log("Available staffing requirements:", staffingRequirements)
      console.log("Available employees:", employees)
      console.log("Available availability data:", availabilityData)

      const debugData = {
        employees,
        availability: availabilityData,
        staffingRequirements,
        shifts,
        settings,
      }

      // For each day in the week
      weekDays.forEach(({ day, dateString }) => {
        console.log(`Processing day: ${day}, date: ${dateString}`)

        // If no staffing requirements exist, create some default ones for testing
        const dayRequirements = staffingRequirements.filter((req) => req.day === day)

        if (dayRequirements.length === 0 && settings.prioritizeFairDistribution) {
          // Create default requirements for common roles if none exist
          const defaultRoles = ["Server", "Cook", "Host", "Bartender"]
          const defaultTimeSlots = ["11:00 AM - 3:00 PM", "5:00 PM - 10:00 PM"]

          defaultRoles.forEach((role) => {
            defaultTimeSlots.forEach((timeSlot) => {
              console.log(`Creating default requirement for ${role} at ${timeSlot}`)

              // Find available employees for this role
              const availableEmployees = employees.filter((emp) => {
                // For testing, consider all employees eligible for all roles
                const hasRole = emp.role === "employee" || emp.role === "manager"

                // Check if employee is available
                const availability = availabilityData.find((a) => a.employeeId === Number(emp.id))
                if (!availability) return false

                const timeBlocks = getTimeBlocksForShift(timeSlot.split(" - ")[0], timeSlot.split(" - ")[1])

                const isAvailable = timeBlocks.every(
                  (block) => availability.availability[day] && availability.availability[day][block],
                )

                // Check if employee doesn't have a conflicting shift
                const hasNoConflict = !shifts.some(
                  (shift) => shift.employeeId === Number(emp.id) && shift.date === dateString,
                )

                return hasRole && isAvailable && hasNoConflict
              })

              if (availableEmployees.length > 0) {
                // Determine how many employees to schedule based on settings
                const count = Math.min(
                  Math.ceil(availableEmployees.length / 2), // At most half of available employees
                  settings.prioritizeBudget ? 1 : 2, // Fewer if budget is a priority
                )

                // Assign shifts to meet requirements
                for (let i = 0; i < count; i++) {
                  if (i < availableEmployees.length) {
                    const employee = availableEmployees[i]

                    console.log(`Assigning ${employee.firstName} ${employee.lastName} to ${role} at ${timeSlot}`)

                    newShifts.push({
                      employeeId: Number(employee.id),
                      day,
                      date: dateString,
                      startTime: timeSlot.split(" - ")[0],
                      endTime: timeSlot.split(" - ")[1],
                      role: role,
                      status: "scheduled",
                      location: locations[0]?.id || "1", // Default to first location
                      notes: "Auto-assigned (default requirement)",
                    })
                  }
                }
              }
            })
          })
        } else {
          // Process actual staffing requirements
          dayRequirements.forEach((req) => {
            console.log(`Processing requirement: ${req.role} at ${req.timeSlot} (need ${req.count})`)

            // Find available employees for this role
            const availableEmployees = employees.filter((emp) => {
              // Check if employee has the right role (more flexible matching)
              const hasRole = emp.role === "employee" || emp.role === "manager"

              // Check if employee is available
              const availability = availabilityData.find((a) => a.employeeId === Number(emp.id))
              if (!availability) {
                console.log(`No availability data for employee ${emp.firstName} ${emp.lastName}`)
                return false
              }

              const startTime = req.timeSlot.split(" - ")[0].trim()
              const endTime =
                req.timeSlot.split(" - ")[1]?.trim() || (startTime.includes("AM") ? "5:00 PM" : "11:00 PM")

              const timeBlocks = getTimeBlocksForShift(startTime, endTime)

              // More lenient availability check - if they're available for any of the blocks
              const dayAvail = availability.availability[day]
              if (!dayAvail) {
                console.log(`No ${day} availability for employee ${emp.firstName} ${emp.lastName}`)
                return false
              }

              // If prioritizing availability, require all blocks to be available
              // Otherwise, require at least one block to be available
              let isAvailable
              if (settings.prioritizeAvailability) {
                isAvailable = timeBlocks.every((block) => dayAvail[block])
              } else {
                isAvailable = timeBlocks.some((block) => dayAvail[block])
              }

              if (!isAvailable) {
                console.log(`Employee ${emp.firstName} ${emp.lastName} not available during required blocks`)
                return false
              }

              // Check if employee doesn't have a conflicting shift
              const hasConflict = shifts.some(
                (shift) =>
                  shift.employeeId === Number(emp.id) &&
                  shift.date === dateString &&
                  timeToMinutes(shift.startTime) < timeToMinutes(endTime) &&
                  timeToMinutes(shift.endTime) > timeToMinutes(startTime),
              )

              if (hasConflict) {
                console.log(`Employee ${emp.firstName} ${emp.lastName} has a conflicting shift`)
                return false
              }

              return hasRole && isAvailable && !hasConflict
            })

            console.log(`Found ${availableEmployees.length} available employees for this requirement`)

            // Assign shifts to meet requirements
            for (let i = 0; i < Math.min(req.count, availableEmployees.length); i++) {
              const employee = availableEmployees[i]

              console.log(`Assigning ${employee.firstName} ${employee.lastName} to ${req.role} at ${req.timeSlot}`)

              const startTime = req.timeSlot.split(" - ")[0].trim()
              const endTime =
                req.timeSlot.split(" - ")[1]?.trim() || (startTime.includes("AM") ? "5:00 PM" : "11:00 PM")

              newShifts.push({
                employeeId: Number(employee.id),
                day,
                date: dateString,
                startTime: startTime,
                endTime: endTime,
                role: req.role,
                status: "scheduled",
                location: req.locationId,
                notes: "Auto-assigned",
              })
            }
          })
        }
      })

      console.log(`Generated ${newShifts.length} new shifts`)

      if (newShifts.length === 0) {
        toast({
          title: "No shifts generated",
          description:
            "Could not generate any shifts based on current availability and requirements. Try adjusting your settings or adding more staffing requirements.",
          variant: "destructive",
        })
        return
      }

      // Create all new shifts
      Promise.all(newShifts.map((shift) => createShift(shift)))
        .then(() => {
          toast({
            title: "Schedule generated",
            description: `${newShifts.length} shifts have been auto-assigned based on your settings.`,
          })
        })
        .catch((error) => {
          console.error("Error creating shifts:", error)
          toast({
            title: "Error",
            description: "Failed to generate schedule. Please try again.",
            variant: "destructive",
          })
        })
    }, 3000)
  }

  // Check if user can manage schedule
  const canManageSchedule = role === "owner" || role === "manager"

  // Handle location changes from URL
  useEffect(() => {
    if (initialLocation) {
      setFilterLocation(initialLocation)
    }
  }, [initialLocation])

  // Handle tab changes from URL
  useEffect(() => {
    if (initialTab && (initialTab === "grid" || initialTab === "list" || initialTab === "requirements")) {
      setActiveTab(initialTab)
      if (initialTab === "grid" || initialTab === "list") {
        setViewMode(initialTab as "grid" | "list")
      }
    }
  }, [initialTab])

  // Get selected location's operating hours for the selected day
  const getSelectedLocationHours = () => {
    if (!filterLocation || !selectedDay) return null

    const location = locations.find((loc) => loc.id === filterLocation)
    if (!location || !location.operatingHours || !location.operatingHours[selectedDay]) return null

    return location.operatingHours[selectedDay]
  }

  const selectedLocationHours = getSelectedLocationHours()

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
              <>
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
                      <DialogDescription>
                        Add a new shift to the schedule. Click save when you're done.
                      </DialogDescription>
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
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={newShift.location}
                          onValueChange={(value) => setNewShift({ ...newShift, location: value })}
                        >
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="day">Day</Label>
                        <Select
                          value={newShift.day}
                          onValueChange={(value) => {
                            const selectedDate = weekDays.find((d) => d.day === value)?.dateString || ""
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
                            {weekDays.map(({ day }) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="startTime">Start Time</Label>
                            {selectedLocationHours && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Info className="h-3 w-3 mr-1" />
                                      Location Hours
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      This location is open from {selectedLocationHours.open} to{" "}
                                      {selectedLocationHours.close} on {newShift.day}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Select
                            value={newShift.startTime}
                            onValueChange={(value) => setNewShift({ ...newShift, startTime: value })}
                          >
                            <SelectTrigger id="startTime">
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {newShift.day && newShift.location ? (
                                getAvailableTimeSlots(newShift.day, newShift.location, "start").map((time) => (
                                  <SelectItem key={`start-${time}`} value={time}>
                                    {time}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                              )}
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
                              {newShift.day && newShift.location ? (
                                getAvailableTimeSlots(newShift.day, newShift.location, "end").map((time) => (
                                  <SelectItem key={`end-${time}`} value={time}>
                                    {time}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                          id="notes"
                          className="flex h-20 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Add any notes about this shift."
                          value={newShift.notes}
                          onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateShift}>Create Shift</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  {weekDays.map(({ day }) => (
                    <th
                      key={day}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Example time slots */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">9:00 AM - 10:00 AM</td>
                  {weekDays.map(({ day }) => (
                    <td key={day} className="px-6 py-4 whitespace-nowrap" onClick={() => setSelectedDay(day)}>
                      {shiftsByDay[day]?.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 rounded-md mb-1"
                        >
                          {getEmployeeName(shift.employeeId)} ({shift.role})
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
                {/* More time slots */}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="role-filter">Filter by Role</Label>
            <Select value={filterRole || "all"} onValueChange={handleRoleFilterChange}>
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="All Roles" />
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

          <div>
            <Label htmlFor="employee-filter">Filter by Employee</Label>
            <Select value={filterEmployee || "all"} onValueChange={handleEmployeeFilterChange}>
              <SelectTrigger id="employee-filter">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location-filter">Filter by Location</Label>
            <Select value={filterLocation || "all"} onValueChange={handleLocationFilterChange}>
              <SelectTrigger id="location-filter">
                <SelectValue placeholder="All Locations" />
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
          </div>
        </div>

        {canManageSchedule && (
          <Dialog open={isAutoAssignOpen} onOpenChange={setIsAutoAssignOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Auto-Assign Shifts</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Auto-Assign Shifts</DialogTitle>
                <DialogDescription>
                  Configure settings for automatically assigning shifts based on staffing requirements and employee
                  availability.
                </DialogDescription>
              </DialogHeader>
              <AutoAssignAlgorithm onApply={handleAutoAssign} onCancel={() => setIsAutoAssignOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

        {isGeneratingSchedule && (
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Generating Schedule
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">{generationProgress}%</span>
              </div>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            {canManageSchedule && <TabsTrigger value="requirements">Staffing Requirements</TabsTrigger>}
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            {/* Grid view content */}
          </TabsContent>

          <TabsContent value="list">{/* List view content */}</TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Staffing Requirements</CardTitle>
                <CardDescription>
                  Define how many staff members you need for each role, day, and time slot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffingRequirementsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
