"use client"

import type React from "react"

import { useState } from "react"
import { CalendarIcon, Check, Clock, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useRole } from "@/components/role-toggle"

interface TimeOffRequest {
  id: number
  employeeId: number
  employeeName: string
  startDate: Date
  endDate: Date
  reason: string
  status: "pending" | "approved" | "rejected"
  notes?: string
}

const initialRequests: TimeOffRequest[] = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "Alex Johnson",
    startDate: new Date(2024, 2, 25),
    endDate: new Date(2024, 2, 26),
    reason: "Family event",
    status: "approved",
  },
  {
    id: 2,
    employeeId: 1,
    employeeName: "Alex Johnson",
    startDate: new Date(2024, 3, 10),
    endDate: new Date(2024, 3, 15),
    reason: "Vacation",
    status: "pending",
  },
  {
    id: 3,
    employeeId: 2,
    employeeName: "Sam Smith",
    startDate: new Date(2024, 3, 5),
    endDate: new Date(2024, 3, 7),
    reason: "Personal",
    status: "pending",
  },
  {
    id: 4,
    employeeId: 3,
    employeeName: "Jamie Lee",
    startDate: new Date(2024, 3, 20),
    endDate: new Date(2024, 3, 22),
    reason: "Sick Leave",
    status: "pending",
  },
]

export function TimeOffView() {
  const [requests, setRequests] = useState<TimeOffRequest[]>(initialRequests)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const { toast } = useToast()
  const { role } = useRole()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate || !reason) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newRequest: TimeOffRequest = {
      id: requests.length + 1,
      employeeId: 1, // Current user in a real app
      employeeName: "Alex Johnson", // Current user in a real app
      startDate,
      endDate,
      reason,
      status: "pending",
    }

    setRequests([...requests, newRequest])
    setStartDate(undefined)
    setEndDate(undefined)
    setReason("")

    toast({
      title: "Request submitted",
      description: "Your time off request has been submitted for approval",
    })
  }

  const handleApproveRequest = (id: number) => {
    setRequests(requests.map((request) => (request.id === id ? { ...request, status: "approved" } : request)))
    toast({
      title: "Request approved",
      description: "The time off request has been approved",
    })
  }

  const handleRejectRequest = (id: number) => {
    setRequests(requests.map((request) => (request.id === id ? { ...request, status: "rejected" } : request)))
    toast({
      title: "Request rejected",
      description: "The time off request has been rejected",
    })
  }

  const filteredRequests = requests.filter((request) => {
    if (role === "employee") {
      // For employees, only show their own requests (ID 1 in this example)
      return request.employeeId === 1
    }

    // For managers, filter by status if selected
    if (filterStatus && request.status !== filterStatus) {
      return false
    }

    return true
  })

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Time Off Requests</h1>
          <p className="text-muted-foreground">
            {role === "manager"
              ? "Review and manage time off requests from your team"
              : "Request time off and view your request history"}
          </p>
        </div>

        {role === "manager" ? (
          <ManagerTimeOffView
            requests={filteredRequests}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Time Off</CardTitle>
                <CardDescription>Submit a new time off request for approval</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="end-date" variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Select onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vacation">Vacation</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Family event">Family event</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="details">Details (Optional)</Label>
                    <Textarea id="details" placeholder="Provide any additional details about your request" />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSubmit} className="ml-auto">
                  Submit Request
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>View your time off request history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <div className="font-medium">
                            {format(request.startDate, "MMM d")} - {format(request.endDate, "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">{request.reason}</div>
                        </div>
                        <div>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">No time off requests found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

interface ManagerTimeOffViewProps {
  requests: TimeOffRequest[]
  filterStatus: string | null
  setFilterStatus: (status: string | null) => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

function ManagerTimeOffView({ requests, filterStatus, setFilterStatus, onApprove, onReject }: ManagerTimeOffViewProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <Tabs defaultValue="all" onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.employeeName}</CardTitle>
                    <CardDescription>
                      {format(request.startDate, "MMM d")} - {format(request.endDate, "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      request.status === "approved"
                        ? "default"
                        : request.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </div>
                  {request.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span> {request.notes}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <Clock className="inline-block mr-1 h-3 w-3" />
                    {request.endDate.getTime() - request.startDate.getTime() > 86400000
                      ? `${Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / 86400000)} days`
                      : "1 day"}
                  </div>
                </div>
              </CardContent>
              {request.status === "pending" && (
                <CardFooter className="pt-2">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onReject(request.id)}>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => onApprove(request.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No time off requests found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
