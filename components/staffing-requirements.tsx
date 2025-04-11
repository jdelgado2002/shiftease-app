"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, Save } from "lucide-react"
import { useData } from "@/lib/data-service"

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
}

export function StaffingRequirementsManager() {
  const { toast } = useToast()
  const {
    data: requirements,
    create: createRequirement,
    update: updateRequirement,
    delete: deleteRequirement,
  } = useData<StaffingRequirement>("staffingRequirements")
  const { data: locations } = useData<Location>("locations")

  const [newRequirement, setNewRequirement] = useState({
    day: "",
    timeSlot: "",
    role: "",
    count: 1,
    locationId: "",
  })

  const [editingRequirement, setEditingRequirement] = useState<StaffingRequirement | null>(null)

  // Initialize with first location if available
  useEffect(() => {
    if (locations.length > 0 && !newRequirement.locationId) {
      setNewRequirement((prev) => ({
        ...prev,
        locationId: locations[0].id,
      }))
    }
  }, [locations, newRequirement.locationId])

  const handleCreateRequirement = async () => {
    if (!newRequirement.day || !newRequirement.timeSlot || !newRequirement.role || !newRequirement.locationId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createRequirement(newRequirement)

      setNewRequirement({
        day: "",
        timeSlot: "",
        role: "",
        count: 1,
        locationId: locations[0]?.id || "",
      })

      toast({
        title: "Requirement created",
        description: "A new staffing requirement has been added.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRequirement = async () => {
    if (!editingRequirement) return

    try {
      await updateRequirement(editingRequirement.id, editingRequirement)

      setEditingRequirement(null)

      toast({
        title: "Requirement updated",
        description: "The staffing requirement has been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRequirement = async (id: number) => {
    try {
      await deleteRequirement(id)

      toast({
        title: "Requirement deleted",
        description: "The staffing requirement has been removed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddDefaultRequirements = async () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const roles = ["Server", "Cook", "Host", "Bartender"]
    const timeSlots = ["11:00 AM - 3:00 PM", "5:00 PM - 10:00 PM"]
    const locationId = locations[0]?.id || "1"

    try {
      const promises = []

      for (const day of days) {
        for (const role of roles) {
          for (const timeSlot of timeSlots) {
            // Skip bartender for lunch shift
            if (role === "Bartender" && timeSlot === "11:00 AM - 3:00 PM") continue

            // Determine count based on role and time
            let count = 1
            if (role === "Server") {
              count = timeSlot === "5:00 PM - 10:00 PM" ? 3 : 2
            } else if (role === "Cook") {
              count = timeSlot === "5:00 PM - 10:00 PM" ? 2 : 1
            }

            const requirement = {
              day,
              timeSlot,
              role,
              count,
              locationId,
            }

            promises.push(createRequirement(requirement))
          }
        }
      }

      await Promise.all(promises)

      toast({
        title: "Default requirements added",
        description: "Default staffing requirements have been added for all days.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add default requirements. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staffing Requirements</CardTitle>
          <CardDescription>Define how many staff members you need for each role, day, and time slot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="day">Day</Label>
                <Select
                  value={newRequirement.day}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, day: value })}
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Select
                  value={newRequirement.timeSlot}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, timeSlot: value })}
                >
                  <SelectTrigger id="timeSlot">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</SelectItem>
                    <SelectItem value="11:00 AM - 3:00 PM">11:00 AM - 3:00 PM</SelectItem>
                    <SelectItem value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</SelectItem>
                    <SelectItem value="5:00 PM - 10:00 PM">5:00 PM - 10:00 PM</SelectItem>
                    <SelectItem value="10:00 PM - 2:00 AM">10:00 PM - 2:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
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

              <div>
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={newRequirement.count}
                  onChange={(e) =>
                    setNewRequirement({ ...newRequirement, count: Number.parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={newRequirement.locationId}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, locationId: value })}
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
            </div>

            <Button onClick={handleCreateRequirement} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Requirement
            </Button>

            {requirements.length === 0 && (
              <Button onClick={handleAddDefaultRequirements} variant="outline" className="w-full mt-2">
                Add Default Requirements
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.map((requirement) => (
          <Card key={requirement.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{requirement.day}</CardTitle>
              <CardDescription>{requirement.timeSlot}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{requirement.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {requirement.count} {requirement.count === 1 ? "person" : "people"} needed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locations.find((l) => l.id === requirement.locationId)?.name || "Unknown location"}
                  </p>
                </div>

                {editingRequirement?.id === requirement.id ? (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-count-${requirement.id}`}>Count</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`edit-count-${requirement.id}`}
                        type="number"
                        min="1"
                        value={editingRequirement.count}
                        onChange={(e) =>
                          setEditingRequirement({
                            ...editingRequirement,
                            count: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                      />
                      <Button size="icon" onClick={handleUpdateRequirement}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingRequirement(requirement)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteRequirement(requirement.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
