"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRole } from "@/components/role-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample team members with availability
const teamMembers = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Server",
    availability: {
      Monday: { morning: true, afternoon: true, evening: false, night: false },
      Tuesday: { morning: true, afternoon: true, evening: false, night: false },
      Wednesday: { morning: false, afternoon: false, evening: true, night: false },
      Thursday: { morning: false, afternoon: true, evening: true, night: false },
      Friday: { morning: true, afternoon: false, evening: false, night: false },
      Saturday: { morning: false, afternoon: false, evening: false, night: false },
      Sunday: { morning: false, afternoon: true, evening: true, night: false },
    },
  },
  {
    id: 2,
    name: "Sam Smith",
    role: "Bartender",
    availability: {
      Monday: { morning: false, afternoon: false, evening: true, night: true },
      Tuesday: { morning: false, afternoon: false, evening: true, night: true },
      Wednesday: { morning: false, afternoon: false, evening: true, night: true },
      Thursday: { morning: false, afternoon: false, evening: true, night: true },
      Friday: { morning: false, afternoon: false, evening: true, night: true },
      Saturday: { morning: false, afternoon: false, evening: true, night: true },
      Sunday: { morning: false, afternoon: false, evening: false, night: false },
    },
  },
  {
    id: 3,
    name: "Jamie Lee",
    role: "Host",
    availability: {
      Monday: { morning: true, afternoon: true, evening: false, night: false },
      Tuesday: { morning: true, afternoon: true, evening: false, night: false },
      Wednesday: { morning: true, afternoon: true, evening: false, night: false },
      Thursday: { morning: false, afternoon: false, evening: false, night: false },
      Friday: { morning: true, afternoon: true, evening: false, night: false },
      Saturday: { morning: true, afternoon: true, evening: false, night: false },
      Sunday: { morning: false, afternoon: false, evening: false, night: false },
    },
  },
  {
    id: 4,
    name: "Taylor Wong",
    role: "Cook",
    availability: {
      Monday: { morning: true, afternoon: true, evening: false, night: false },
      Tuesday: { morning: true, afternoon: true, evening: false, night: false },
      Wednesday: { morning: true, afternoon: true, evening: false, night: false },
      Thursday: { morning: true, afternoon: true, evening: false, night: false },
      Friday: { morning: false, afternoon: false, evening: false, night: false },
      Saturday: { morning: true, afternoon: true, evening: true, night: false },
      Sunday: { morning: true, afternoon: true, evening: true, night: false },
    },
  },
  {
    id: 5,
    name: "Jordan Rivera",
    role: "Server",
    availability: {
      Monday: { morning: false, afternoon: true, evening: true, night: false },
      Tuesday: { morning: false, afternoon: true, evening: true, night: false },
      Wednesday: { morning: false, afternoon: true, evening: true, night: false },
      Thursday: { morning: false, afternoon: true, evening: true, night: false },
      Friday: { morning: false, afternoon: false, evening: true, night: true },
      Saturday: { morning: false, afternoon: false, evening: true, night: true },
      Sunday: { morning: false, afternoon: false, evening: false, night: false },
    },
  },
]

// Sample availability conflicts
const availabilityConflicts = [
  {
    severity: "high",
    title: "Friday evening server shortage",
    description: "Only 1 server available on Friday evening, but staffing requirement is 3",
  },
  {
    severity: "medium",
    title: "Saturday morning host coverage",
    description: "Only Jamie is available to host on Saturday morning",
  },
  {
    severity: "high",
    title: "Sunday coverage issues",
    description: "Limited staff availability on Sunday across all roles",
  },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const timeBlocks = [
  { id: "morning", label: "Morning (9AM-12PM)" },
  { id: "afternoon", label: "Afternoon (12PM-5PM)" },
  { id: "evening", label: "Evening (5PM-10PM)" },
  { id: "night", label: "Night (10PM-2AM)" },
]

type Availability = Record<string, Record<string, boolean>>

export function AvailabilityView() {
  const [availability, setAvailability] = useState<Availability>(() => {
    const initial: Availability = {}
    days.forEach((day) => {
      initial[day] = {}
      timeBlocks.forEach((block) => {
        initial[day][block.id] = false
      })
    })
    return initial
  })

  const { toast } = useToast()
  const { role } = useRole()

  const toggleAvailability = (day: string, blockId: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [blockId]: !prev[day][blockId],
      },
    }))
  }

  const saveAvailability = () => {
    toast({
      title: "Availability saved",
      description: "Your availability has been updated successfully",
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Availability</h1>
          <p className="text-muted-foreground">Set your regular weekly availability for scheduling</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>Toggle the time blocks when you're available to work</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click on time blocks to toggle your availability</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header row with time blocks */}
                <div className="grid grid-cols-[180px_1fr] gap-4">
                  <div className="font-medium text-center p-2"></div>
                  <div className="grid grid-cols-4 gap-2">
                    {timeBlocks.map((block) => (
                      <div key={block.id} className="text-center text-sm font-medium p-2">
                        {block.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day rows */}
                {days.map((day) => (
                  <div key={day} className="grid grid-cols-[180px_1fr] gap-4 mt-2">
                    <div className="font-medium p-2 flex items-center">{day}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {timeBlocks.map((block) => (
                        <Button
                          key={block.id}
                          variant={availability[day][block.id] ? "default" : "outline"}
                          className="h-12 w-full"
                          onClick={() => toggleAvailability(day, block.id)}
                        >
                          {availability[day][block.id] ? "Available" : "Unavailable"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={saveAvailability}>Save Availability</Button>
          </CardFooter>
        </Card>

        {role === "manager" && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Availability Overview</CardTitle>
                    <CardDescription>View and manage your team's availability</CardDescription>
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="server">Servers</SelectItem>
                      <SelectItem value="bartender">Bartenders</SelectItem>
                      <SelectItem value="host">Hosts</SelectItem>
                      <SelectItem value="cook">Cooks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left font-medium">Employee</th>
                        {days.map((day) => (
                          <th key={day} className="p-2 text-center font-medium">
                            {day.substring(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.role}</div>
                          </td>
                          {days.map((day) => (
                            <td key={day} className="p-2">
                              <div className="flex flex-col gap-1">
                                {timeBlocks.map((block) => (
                                  <div
                                    key={block.id}
                                    className={`text-xs px-2 py-1 rounded-sm text-center ${
                                      member.availability[day]?.[block.id]
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {block.id.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-green-100"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-gray-100"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>View Detailed Report</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Team Availability Detailed Report</DialogTitle>
                      <DialogDescription>
                        Comprehensive view of your team's availability for scheduling
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto py-4">
                      <Tabs defaultValue="heatmap">
                        <TabsList className="mb-4">
                          <TabsTrigger value="heatmap">Availability Heatmap</TabsTrigger>
                          <TabsTrigger value="individual">Individual Availability</TabsTrigger>
                        </TabsList>
                        <TabsContent value="heatmap">
                          <div className="space-y-6">
                            {timeBlocks.map((block) => (
                              <div key={block.id} className="space-y-2">
                                <h3 className="font-medium">{block.label}</h3>
                                <div className="grid grid-cols-7 gap-2">
                                  {days.map((day) => (
                                    <div key={day} className="space-y-2">
                                      <div className="text-sm font-medium text-center">{day.substring(0, 3)}</div>
                                      <div className="rounded-md border p-2">
                                        <div className="text-lg font-bold text-center">
                                          {teamMembers.filter((m) => m.availability[day]?.[block.id]).length}
                                        </div>
                                        <div className="text-xs text-center text-muted-foreground">Available</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="individual">
                          <div className="space-y-6">
                            {teamMembers.map((member) => (
                              <Card key={member.id}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">{member.name}</CardTitle>
                                  <CardDescription>{member.role}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-7 gap-2">
                                    {days.map((day) => (
                                      <div key={day} className="space-y-1">
                                        <div className="text-sm font-medium">{day.substring(0, 3)}</div>
                                        <div className="space-y-1">
                                          {timeBlocks.map((block) => (
                                            <div
                                              key={block.id}
                                              className={`text-xs px-2 py-1 rounded-sm ${
                                                member.availability[day]?.[block.id]
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-gray-100 text-gray-400"
                                              }`}
                                            >
                                              {block.id.charAt(0).toUpperCase()}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability Conflicts</CardTitle>
                <CardDescription>Potential scheduling issues based on team availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availabilityConflicts.map((conflict, index) => (
                    <div key={index} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div
                        className={`mt-0.5 rounded-full p-1 ${
                          conflict.severity === "high" ? "bg-red-100" : "bg-amber-100"
                        }`}
                      >
                        <AlertCircle
                          className={`h-4 w-4 ${conflict.severity === "high" ? "text-red-600" : "text-amber-600"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{conflict.title}</p>
                        <p className="text-sm text-muted-foreground">{conflict.description}</p>
                        <div className="mt-2">
                          <Button variant="outline" size="sm">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {availabilityConflicts.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No availability conflicts detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
