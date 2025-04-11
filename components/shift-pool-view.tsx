"use client"

import type React from "react"

import { useState } from "react"
import { Filter, MessageSquare, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useRole } from "@/components/role-toggle"

// Sample data
const employees = [
  { id: 1, name: "Alex Johnson", role: "Server" },
  { id: 2, name: "Sam Smith", role: "Bartender" },
  { id: 3, name: "Jamie Lee", role: "Host" },
  { id: 4, name: "Taylor Wong", role: "Cook" },
  { id: 5, name: "Jordan Rivera", role: "Server" },
]

const roles = ["Server", "Bartender", "Host", "Cook", "Manager"]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const timeSlots = [
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
  "10:00 PM",
  "11:00 PM",
]

interface ShiftPoolItem {
  id: number
  type: "open" | "swap" | "cover"
  day: string
  date: string
  startTime: string
  endTime: string
  role: string
  requestedBy?: number
  requestedFor?: number
  status: "pending" | "approved" | "denied" | "filled"
  notes?: string
  responses?: {
    employeeId: number
    status: "pending" | "approved" | "denied"
    timestamp: Date
  }[]
}

const initialShiftPool: ShiftPoolItem[] = [
  {
    id: 1,
    type: "open",
    day: "Monday",
    date: "March 25, 2024",
    startTime: "11:00 AM",
    endTime: "7:00 PM",
    role: "Server",
    status: "pending",
    notes: "Need coverage for lunch rush",
  },
  {
    id: 2,
    type: "swap",
    day: "Wednesday",
    date: "March 27, 2024",
    startTime: "4:00 PM",
    endTime: "11:00 PM",
    role: "Bartender",
    requestedBy: 2,
    status: "pending",
    notes: "Can trade for Thursday or Friday evening",
  },
  {
    id: 3,
    type: "cover",
    day: "Friday",
    date: "March 29, 2024",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    role: "Host",
    requestedBy: 3,
    status: "filled",
    requestedFor: 5,
    notes: "Doctor appointment",
    responses: [
      {
        employeeId: 5,
        status: "approved",
        timestamp: new Date(2024, 2, 22, 14, 30),
      },
    ],
  },
]

export function ShiftPoolView() {
  const [shiftPool, setShiftPool] = useState<ShiftPoolItem[]>(initialShiftPool)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { toast } = useToast()
  const { role } = useRole()

  const handleCreateShiftPoolItem = (newItem: Omit<ShiftPoolItem, "id" | "status" | "responses">) => {
    const item: ShiftPoolItem = {
      ...newItem,
      id: shiftPool.length + 1,
      status: "pending",
    }

    setShiftPool([...shiftPool, item])
    setIsCreateOpen(false)
    toast({
      title: "Request created",
      description: `Your ${item.type} request has been added to the shift pool`,
    })
  }

  const handleRespondToShift = (id: number, response: "approve" | "deny") => {
    setShiftPool(
      shiftPool.map((item) => {
        if (item.id === id) {
          // In a real app, we'd use the current user's ID
          const currentEmployeeId = 1

          const newResponses = [
            ...(item.responses || []),
            {
              employeeId: currentEmployeeId,
              status: response === "approve" ? "approved" : "denied",
              timestamp: new Date(),
            },
          ]

          return {
            ...item,
            status: response === "approve" ? "filled" : item.status,
            requestedFor: response === "approve" ? currentEmployeeId : item.requestedFor,
            responses: newResponses,
          }
        }
        return item
      }),
    )

    toast({
      title: response === "approve" ? "Shift accepted" : "Shift declined",
      description:
        response === "approve" ? "You have been assigned to this shift" : "You have declined this shift request",
    })
  }

  const filteredShiftPool = shiftPool.filter((item) => {
    if (filterType && item.type !== filterType) return false
    if (filterRole && item.role !== filterRole) return false
    return true
  })

  const getEmployeeName = (id?: number) => {
    if (!id) return "Unknown"
    return employees.find((emp) => emp.id === id)?.name || "Unknown"
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Shift Pool</h1>
            <p className="text-muted-foreground">
              {role === "manager"
                ? "Manage open shifts, swaps, and coverage requests"
                : "Find open shifts, request swaps, or get coverage"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Shift Request</DialogTitle>
                  <DialogDescription>
                    Add a new shift request to the pool. Select the type of request you want to make.
                  </DialogDescription>
                </DialogHeader>
                <ShiftPoolForm onSubmit={handleCreateShiftPoolItem} onCancel={() => setIsCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Card className="md:w-64 shrink-0">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Request Type</Label>
                <Select onValueChange={(value) => setFilterType(value === "all" ? null : value)} defaultValue="all">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="open">Open Shifts</SelectItem>
                    <SelectItem value="swap">Swap Requests</SelectItem>
                    <SelectItem value="cover">Coverage Requests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => setFilterRole(value === "all" ? null : value)} defaultValue="all">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilterType(null)
                  setFilterRole(null)
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          <div className="flex-1">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Requests</TabsTrigger>
                <TabsTrigger value="open">Open Shifts</TabsTrigger>
                <TabsTrigger value="swap">Swap Requests</TabsTrigger>
                <TabsTrigger value="cover">Coverage Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ShiftPoolList
                  items={filteredShiftPool}
                  onRespond={handleRespondToShift}
                  getEmployeeName={getEmployeeName}
                />
              </TabsContent>

              <TabsContent value="open">
                <ShiftPoolList
                  items={filteredShiftPool.filter((item) => item.type === "open")}
                  onRespond={handleRespondToShift}
                  getEmployeeName={getEmployeeName}
                />
              </TabsContent>

              <TabsContent value="swap">
                <ShiftPoolList
                  items={filteredShiftPool.filter((item) => item.type === "swap")}
                  onRespond={handleRespondToShift}
                  getEmployeeName={getEmployeeName}
                />
              </TabsContent>

              <TabsContent value="cover">
                <ShiftPoolList
                  items={filteredShiftPool.filter((item) => item.type === "cover")}
                  onRespond={handleRespondToShift}
                  getEmployeeName={getEmployeeName}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ShiftPoolListProps {
  items: ShiftPoolItem[]
  onRespond: (id: number, response: "approve" | "deny") => void
  getEmployeeName: (id?: number) => string
}

function ShiftPoolList({ items, onRespond, getEmployeeName }: ShiftPoolListProps) {
  const { role } = useRole()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No shift requests found</p>
          <Button variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {item.day}, {item.date}
                  </CardTitle>
                  <Badge
                    variant={
                      item.status === "filled"
                        ? "outline"
                        : item.status === "approved"
                          ? "default"
                          : item.status === "denied"
                            ? "destructive"
                            : "secondary"
                    }
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  {item.startTime} - {item.endTime} • {item.role}
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {item.type === "open" ? "Open Shift" : item.type === "swap" ? "Swap Request" : "Coverage Request"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              {(item.type === "swap" || item.type === "cover") && item.requestedBy && (
                <div className="text-sm">
                  <span className="font-medium">Requested by:</span> {getEmployeeName(item.requestedBy)}
                </div>
              )}
              {item.requestedFor && (
                <div className="text-sm">
                  <span className="font-medium">Covered by:</span> {getEmployeeName(item.requestedFor)}
                </div>
              )}
              {item.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notes:</span> {item.notes}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="flex gap-2 w-full justify-end">
              {role === "manager" ? (
                <>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Button size="sm">Assign</Button>
                </>
              ) : (
                <>
                  {item.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onRespond(item.id, "deny")}>
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => onRespond(item.id, "approve")}>
                        {item.type === "open" ? "Take Shift" : item.type === "swap" ? "Offer Swap" : "Cover Shift"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

interface ShiftPoolFormProps {
  onSubmit: (item: Omit<ShiftPoolItem, "id" | "status" | "responses">) => void
  onCancel: () => void
}

function ShiftPoolForm({ onSubmit, onCancel }: ShiftPoolFormProps) {
  const [type, setType] = useState<"open" | "swap" | "cover">("open")
  const [day, setDay] = useState("Monday")
  const [date, setDate] = useState("March 25, 2024")
  const [startTime, setStartTime] = useState("9:00 AM")
  const [endTime, setEndTime] = useState("5:00 PM")
  const [role, setRole] = useState("Server")
  const [notes, setNotes] = useState("")
  const { role: userRole } = useRole()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const item = {
      type,
      day,
      date,
      startTime,
      endTime,
      role,
      notes,
      // In a real app, we'd use the current user's ID
      requestedBy: userRole === "employee" ? 1 : undefined,
    }
    onSubmit(item)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="type">Request Type</Label>
          <Select value={type} onValueChange={(value: "open" | "swap" | "cover") => setType(value)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select request type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open Shift</SelectItem>
              <SelectItem value="swap">Swap Request</SelectItem>
              <SelectItem value="cover">Coverage Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger id="day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger id="startTime">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger id="endTime">
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any details about this request"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Request</Button>
      </DialogFooter>
    </form>
  )
}
