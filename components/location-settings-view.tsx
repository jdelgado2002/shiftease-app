"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const timeSlots = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM",
  "10:00 PM - 11:00 PM",
]

interface StaffingRequirement {
  id: number
  day: string
  timeSlot: string
  role: string
  count: number
}

interface Location {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number // in miles
}

export function LocationSettingsView() {
  const [locations, setLocations] = useState<Location[]>([
    {
      id: 1,
      name: "Downtown Restaurant",
      address: "123 Main St, Anytown, USA",
      latitude: 40.7128,
      longitude: -74.006,
      radius: 0.5,
    },
  ])

  const [staffingRequirements, setStaffingRequirements] = useState<StaffingRequirement[]>([
    { id: 1, day: "Monday", timeSlot: "11:00 AM - 12:00 PM", role: "Server", count: 2 },
    { id: 2, day: "Monday", timeSlot: "12:00 PM - 1:00 PM", role: "Server", count: 3 },
    { id: 3, day: "Monday", timeSlot: "12:00 PM - 1:00 PM", role: "Cook", count: 2 },
    { id: 4, day: "Friday", timeSlot: "6:00 PM - 7:00 PM", role: "Server", count: 4 },
    { id: 5, day: "Friday", timeSlot: "6:00 PM - 7:00 PM", role: "Bartender", count: 2 },
  ])

  const [newRequirement, setNewRequirement] = useState({
    day: "Monday",
    timeSlot: "9:00 AM - 10:00 AM",
    role: "Server",
    count: 1,
  })

  const [selectedLocation, setSelectedLocation] = useState<Location>(locations[0])
  const { toast } = useToast()

  const handleAddRequirement = () => {
    const requirement: StaffingRequirement = {
      id: staffingRequirements.length + 1,
      ...newRequirement,
    }

    setStaffingRequirements([...staffingRequirements, requirement])
    toast({
      title: "Requirement added",
      description: `Added ${requirement.count} ${requirement.role}(s) for ${requirement.day} ${requirement.timeSlot}`,
    })
  }

  const handleDeleteRequirement = (id: number) => {
    setStaffingRequirements(staffingRequirements.filter((req) => req.id !== id))
    toast({
      title: "Requirement removed",
      description: "Staffing requirement has been removed",
    })
  }

  const handleUpdateLocation = () => {
    setLocations(locations.map((loc) => (loc.id === selectedLocation.id ? selectedLocation : loc)))

    toast({
      title: "Location updated",
      description: "Location settings have been saved",
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Location Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant location and staffing requirements</p>
        </div>

        <Tabs defaultValue="staffing">
          <TabsList className="mb-4">
            <TabsTrigger value="staffing">Staffing Requirements</TabsTrigger>
            <TabsTrigger value="location">Location Details</TabsTrigger>
          </TabsList>

          <TabsContent value="staffing">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Staffing Requirement</CardTitle>
                  <CardDescription>Set the number of staff needed for each role, day, and time slot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select
                        value={newRequirement.day}
                        onValueChange={(value) => setNewRequirement({ ...newRequirement, day: value })}
                      >
                        <SelectTrigger id="day">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeSlot">Time Slot</Label>
                      <Select
                        value={newRequirement.timeSlot}
                        onValueChange={(value) => setNewRequirement({ ...newRequirement, timeSlot: value })}
                      >
                        <SelectTrigger id="timeSlot">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newRequirement.role}
                        onValueChange={(value) => setNewRequirement({ ...newRequirement, role: value })}
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
                      <Label htmlFor="count">Staff Count</Label>
                      <div className="flex items-center">
                        <Input
                          id="count"
                          type="number"
                          min="1"
                          value={newRequirement.count}
                          onChange={(e) =>
                            setNewRequirement({
                              ...newRequirement,
                              count: Number.parseInt(e.target.value) || 1,
                            })
                          }
                          className="flex-1"
                        />
                        <Button onClick={handleAddRequirement} className="ml-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Staffing Requirements</CardTitle>
                  <CardDescription>View and manage your staffing requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map((day) => {
                      const dayRequirements = staffingRequirements.filter((req) => req.day === day)
                      if (dayRequirements.length === 0) return null

                      return (
                        <div key={day}>
                          <h3 className="font-medium mb-2">{day}</h3>
                          <div className="space-y-2">
                            {dayRequirements.map((req) => (
                              <div key={req.id} className="flex justify-between items-center p-3 rounded-md border">
                                <div>
                                  <div className="font-medium">{req.timeSlot}</div>
                                  <div className="text-sm text-muted-foreground">{req.role}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{req.count} staff needed</div>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRequirement(req.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {staffingRequirements.length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">No staffing requirements set</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Set your restaurant location for time clock geofencing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Location Name</Label>
                    <Input
                      id="name"
                      value={selectedLocation.name}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={selectedLocation.address}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={selectedLocation.latitude}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          latitude: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={selectedLocation.longitude}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          longitude: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="radius">Geofencing Radius (miles)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="radius"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5"
                        value={selectedLocation.radius}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            radius: Number.parseFloat(e.target.value) || 0.5,
                          })
                        }
                      />
                      <div className="text-sm text-muted-foreground w-48">
                        Staff must be within this distance to clock in/out
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateLocation} className="ml-auto">
                  Save Location
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
