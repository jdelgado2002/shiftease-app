"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useData } from "@/lib/data-service"
import { MapPin, Edit, Trash2, Plus, Users, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

// Types
interface OperatingHours {
  [day: string]: { open: string; close: string }
}

interface Location {
  id: string
  name: string
  address: string
  isMain: boolean
  phone?: string
  email?: string
  manager?: string
  operatingHours?: OperatingHours
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  locations: string[]
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
}

export function LocationsView() {
  const { toast } = useToast()
  const { user, hasPermission } = useAuth()

  // Data hooks
  const {
    data: locations,
    loading: loadingLocations,
    create: createLocation,
    update: updateLocation,
    delete: deleteLocation,
  } = useData<Location>("locations")

  const { data: employees } = useData<Employee>("users")
  const { data: shifts } = useData<Shift>("shifts")

  // State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: "",
    address: "",
    isMain: false,
    phone: "",
    email: "",
    operatingHours: {
      Monday: { open: "9:00 AM", close: "10:00 PM" },
      Tuesday: { open: "9:00 AM", close: "10:00 PM" },
      Wednesday: { open: "9:00 AM", close: "10:00 PM" },
      Thursday: { open: "9:00 AM", close: "10:00 PM" },
      Friday: { open: "9:00 AM", close: "11:00 PM" },
      Saturday: { open: "10:00 AM", close: "11:00 PM" },
      Sunday: { open: "10:00 AM", close: "9:00 PM" },
    },
  })

  const canManageLocations = hasPermission("manage_locations")

  // Handle creating a new location
  const handleCreateLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      toast({
        title: "Missing information",
        description: "Please provide a name and address for the location.",
        variant: "destructive",
      })
      return
    }

    try {
      await createLocation(newLocation as Location)

      setIsCreateDialogOpen(false)
      setNewLocation({
        name: "",
        address: "",
        isMain: false,
        phone: "",
        email: "",
        operatingHours: {
          Monday: { open: "9:00 AM", close: "10:00 PM" },
          Tuesday: { open: "9:00 AM", close: "10:00 PM" },
          Wednesday: { open: "9:00 AM", close: "10:00 PM" },
          Thursday: { open: "9:00 AM", close: "10:00 PM" },
          Friday: { open: "9:00 AM", close: "11:00 PM" },
          Saturday: { open: "10:00 AM", close: "11:00 PM" },
          Sunday: { open: "10:00 AM", close: "9:00 PM" },
        },
      })

      toast({
        title: "Location created",
        description: `${newLocation.name} has been added.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle updating a location
  const handleUpdateLocation = async () => {
    if (!selectedLocation) return

    try {
      await updateLocation(selectedLocation.id, selectedLocation)

      setIsEditDialogOpen(false)
      setSelectedLocation(null)

      toast({
        title: "Location updated",
        description: `${selectedLocation.name} has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle updating operating hours
  const handleUpdateHours = async () => {
    if (!selectedLocation) return

    try {
      await updateLocation(selectedLocation.id, selectedLocation)

      setIsHoursDialogOpen(false)
      setSelectedLocation(null)

      toast({
        title: "Operating hours updated",
        description: `Operating hours for ${selectedLocation.name} have been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update operating hours. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a location
  const handleDeleteLocation = async () => {
    if (!selectedLocation) return

    try {
      await deleteLocation(selectedLocation.id)

      setIsDeleteDialogOpen(false)
      setSelectedLocation(null)

      toast({
        title: "Location deleted",
        description: `${selectedLocation.name} has been removed.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get employees for a location
  const getLocationEmployees = (locationId: string) => {
    return employees.filter((employee) => employee.locations.includes(locationId))
  }

  // Get shifts for a location
  const getLocationShifts = (locationId: string) => {
    return shifts.filter((shift) => shift.location === locationId)
  }

  // Calculate location metrics
  const calculateLocationMetrics = (locationId: string) => {
    const locationEmployees = getLocationEmployees(locationId)
    const locationShifts = getLocationShifts(locationId)

    return {
      employeeCount: locationEmployees.length,
      shiftCount: locationShifts.length,
      roles: [...new Set(locationEmployees.map((emp) => emp.role))],
    }
  }

  // Format operating hours for display
  const formatOperatingHours = (hours?: OperatingHours) => {
    if (!hours) return "Not set"

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    // Group days with the same hours
    const hourGroups: Record<string, string[]> = {}

    days.forEach((day) => {
      if (!hours[day]) return

      const hourString = `${hours[day].open} - ${hours[day].close}`
      if (!hourGroups[hourString]) {
        hourGroups[hourString] = []
      }
      hourGroups[hourString].push(day)
    })

    // Format the groups
    return Object.entries(hourGroups)
      .map(([hourRange, daysInGroup]) => {
        // If it's all 7 days, just say "Daily"
        if (daysInGroup.length === 7) {
          return `Daily: ${hourRange}`
        }

        // If it's weekdays
        if (
          daysInGroup.length === 5 &&
          daysInGroup.includes("Monday") &&
          daysInGroup.includes("Tuesday") &&
          daysInGroup.includes("Wednesday") &&
          daysInGroup.includes("Thursday") &&
          daysInGroup.includes("Friday")
        ) {
          return `Weekdays: ${hourRange}`
        }

        // If it's weekends
        if (daysInGroup.length === 2 && daysInGroup.includes("Saturday") && daysInGroup.includes("Sunday")) {
          return `Weekends: ${hourRange}`
        }

        // Otherwise, list the days
        return `${daysInGroup.join(", ")}: ${hourRange}`
      })
      .join("; ")
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            <p className="text-muted-foreground">Manage your restaurant locations</p>
          </div>

          {canManageLocations && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>Add a new restaurant location to your organization.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Location Name</Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Downtown Restaurant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newLocation.phone}
                        onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={newLocation.email}
                        onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
                        placeholder="location@restaurant.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Operating Hours</Label>
                    <div className="border rounded-md p-4 space-y-4">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                        <div key={day} className="grid grid-cols-3 gap-4 items-center">
                          <div className="font-medium">{day}</div>
                          <div>
                            <Label htmlFor={`${day}-open`} className="sr-only">
                              Opening Time
                            </Label>
                            <select
                              id={`${day}-open`}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={newLocation.operatingHours?.[day]?.open || "9:00 AM"}
                              onChange={(e) => {
                                const updatedHours = {
                                  ...newLocation.operatingHours,
                                  [day]: {
                                    open: e.target.value,
                                    close: newLocation.operatingHours?.[day]?.close || "10:00 PM",
                                  },
                                }
                                setNewLocation({ ...newLocation, operatingHours: updatedHours })
                              }}
                            >
                              {[
                                "6:00 AM",
                                "7:00 AM",
                                "8:00 AM",
                                "9:00 AM",
                                "10:00 AM",
                                "11:00 AM",
                                "12:00 PM",
                                "1:00 PM",
                                "2:00 PM",
                                "3:00 PM",
                                "4:00 PM",
                                "5:00 PM",
                              ].map((time) => (
                                <option key={`${day}-open-${time}`} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor={`${day}-close`} className="sr-only">
                              Closing Time
                            </Label>
                            <select
                              id={`${day}-close`}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={newLocation.operatingHours?.[day]?.close || "10:00 PM"}
                              onChange={(e) => {
                                const updatedHours = {
                                  ...newLocation.operatingHours,
                                  [day]: {
                                    open: newLocation.operatingHours?.[day]?.open || "9:00 AM",
                                    close: e.target.value,
                                  },
                                }
                                setNewLocation({ ...newLocation, operatingHours: updatedHours })
                              }}
                            >
                              {[
                                "5:00 PM",
                                "6:00 PM",
                                "7:00 PM",
                                "8:00 PM",
                                "9:00 PM",
                                "10:00 PM",
                                "11:00 PM",
                                "12:00 AM",
                                "1:00 AM",
                                "2:00 AM",
                              ].map((time) => (
                                <option key={`${day}-close-${time}`} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLocation}>Create Location</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => {
            const metrics = calculateLocationMetrics(location.id)

            return (
              <Card key={location.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{location.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {location.address}
                      </CardDescription>
                    </div>
                    {location.isMain && <Badge variant="secondary">Main Location</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{metrics.employeeCount}</div>
                        <div className="text-xs text-muted-foreground">Employees</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{metrics.shiftCount}</div>
                        <div className="text-xs text-muted-foreground">Shifts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {location.phone && (
                      <div className="text-sm">
                        <span className="font-medium">Phone:</span> {location.phone}
                      </div>
                    )}
                    {location.email && (
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {location.email}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="font-medium">Hours:</span> {formatOperatingHours(location.operatingHours)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-3">
                  <div className="flex justify-between items-center w-full">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/schedule?location=${location.id}`}>View Schedule</Link>
                    </Button>

                    {canManageLocations && (
                      <div className="flex gap-2">
                        <Dialog
                          open={isHoursDialogOpen && selectedLocation?.id === location.id}
                          onOpenChange={(open) => {
                            setIsHoursDialogOpen(open)
                            if (!open) setSelectedLocation(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLocation(location)}
                              title="Edit Operating Hours"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Operating Hours</DialogTitle>
                              <DialogDescription>Set the operating hours for {location.name}</DialogDescription>
                            </DialogHeader>
                            {selectedLocation && (
                              <div className="space-y-4 py-4">
                                <div className="border rounded-md p-4 space-y-4">
                                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                                    (day) => (
                                      <div key={day} className="grid grid-cols-3 gap-4 items-center">
                                        <div className="font-medium">{day}</div>
                                        <div>
                                          <Label htmlFor={`edit-${day}-open`} className="sr-only">
                                            Opening Time
                                          </Label>
                                          <select
                                            id={`edit-${day}-open`}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedLocation.operatingHours?.[day]?.open || "9:00 AM"}
                                            onChange={(e) => {
                                              const updatedHours = {
                                                ...selectedLocation.operatingHours,
                                                [day]: {
                                                  open: e.target.value,
                                                  close: selectedLocation.operatingHours?.[day]?.close || "10:00 PM",
                                                },
                                              }
                                              setSelectedLocation({ ...selectedLocation, operatingHours: updatedHours })
                                            }}
                                          >
                                            {[
                                              "6:00 AM",
                                              "7:00 AM",
                                              "8:00 AM",
                                              "9:00 AM",
                                              "10:00 AM",
                                              "11:00 AM",
                                              "12:00 PM",
                                              "1:00 PM",
                                              "2:00 PM",
                                              "3:00 PM",
                                              "4:00 PM",
                                              "5:00 PM",
                                            ].map((time) => (
                                              <option key={`edit-${day}-open-${time}`} value={time}>
                                                {time}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <Label htmlFor={`edit-${day}-close`} className="sr-only">
                                            Closing Time
                                          </Label>
                                          <select
                                            id={`edit-${day}-close`}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedLocation.operatingHours?.[day]?.close || "10:00 PM"}
                                            onChange={(e) => {
                                              const updatedHours = {
                                                ...selectedLocation.operatingHours,
                                                [day]: {
                                                  open: selectedLocation.operatingHours?.[day]?.open || "9:00 AM",
                                                  close: e.target.value,
                                                },
                                              }
                                              setSelectedLocation({ ...selectedLocation, operatingHours: updatedHours })
                                            }}
                                          >
                                            {[
                                              "5:00 PM",
                                              "6:00 PM",
                                              "7:00 PM",
                                              "8:00 PM",
                                              "9:00 PM",
                                              "10:00 PM",
                                              "11:00 PM",
                                              "12:00 AM",
                                              "1:00 AM",
                                              "2:00 AM",
                                            ].map((time) => (
                                              <option key={`edit-${day}-close-${time}`} value={time}>
                                                {time}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsHoursDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateHours}>Save Hours</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={isEditDialogOpen && selectedLocation?.id === location.id}
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open)
                            if (!open) setSelectedLocation(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(location)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Location</DialogTitle>
                              <DialogDescription>Make changes to the location details.</DialogDescription>
                            </DialogHeader>
                            {selectedLocation && (
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Location Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={selectedLocation.name}
                                    onChange={(e) => setSelectedLocation({ ...selectedLocation, name: e.target.value })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-address">Address</Label>
                                  <Input
                                    id="edit-address"
                                    value={selectedLocation.address}
                                    onChange={(e) =>
                                      setSelectedLocation({ ...selectedLocation, address: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Phone Number</Label>
                                    <Input
                                      id="edit-phone"
                                      value={selectedLocation.phone || ""}
                                      onChange={(e) =>
                                        setSelectedLocation({ ...selectedLocation, phone: e.target.value })
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      value={selectedLocation.email || ""}
                                      onChange={(e) =>
                                        setSelectedLocation({ ...selectedLocation, email: e.target.value })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateLocation}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={isDeleteDialogOpen && selectedLocation?.id === location.id}
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open)
                            if (!open) setSelectedLocation(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(location)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Location</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this location? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDeleteLocation}>
                                Delete Location
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {locations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <MapPin className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Locations Added</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't added any locations yet. Add your first restaurant location to get started.
              </p>
              {canManageLocations && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Location Details</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
                <CardDescription>Additional details and settings for your locations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">
                  Select a location to view and manage its details
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Assignment</CardTitle>
                <CardDescription>Manage which employees work at each location</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">Select a location to manage staff assignments</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
