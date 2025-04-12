"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, MapPin, Trash2, Edit2 } from "lucide-react"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface Location {
  id: string
  name: string
  address: string
  isMain: boolean
}

export default function OnboardingStep3() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({ name: "", address: "" })
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations", {
        headers: {
          "x-organization-id": user?.organizationId ?? "",
        },
      })
      if (!response.ok) throw new Error("Failed to fetch locations")
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      toast({
        title: "Error fetching locations",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (locations.length === 0) {
      toast({
        title: "No locations added",
        description: "Please add at least one location.",
        variant: "destructive",
      })
      return
    }

    router.push("/onboarding/4")
  }

  const handleBack = () => {
    router.push("/onboarding/2")
  }

  const addLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": user?.organizationId ?? "",
        },
        body: JSON.stringify({
          name: newLocation.name,
          address: newLocation.address,
          isMain: locations.length === 0,
        }),
      })

      if (!response.ok) throw new Error("Failed to add location")

      const newLocationData = await response.json()
      setLocations([...locations, newLocationData])
      setNewLocation({ name: "", address: "" })
      setIsAddingLocation(false)

      toast({
        title: "Location added",
        description: `${newLocation.name} has been added.`,
      })
    } catch (error) {
      toast({
        title: "Error adding location",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const updateLocation = async () => {
    if (!editingLocation?.name || !editingLocation?.address) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${editingLocation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": user?.organizationId ?? "",
        },
        body: JSON.stringify(editingLocation),
      })

      if (!response.ok) throw new Error("Failed to update location")

      const updatedLocation = await response.json()
      setLocations(locations.map((loc) => (loc.id === updatedLocation.id ? updatedLocation : loc)))
      setEditingLocation(null)

      toast({
        title: "Location updated",
        description: `${updatedLocation.name} has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error updating location",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const deleteLocation = async (id: string) => {
    const locationToDelete = locations.find((loc) => loc.id === id)

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
        headers: {
          "x-organization-id": user?.organizationId ?? "",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete location")
      }

      setLocations(locations.filter((loc) => loc.id !== id))

      toast({
        title: "Location deleted",
        description: `${locationToDelete?.name} has been removed.`,
      })
    } catch (error) {
      toast({
        title: "Error deleting location",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const setAsMainLocation = async (id: string) => {
    try {
      const locationToUpdate = locations.find((loc) => loc.id === id)
      if (!locationToUpdate) return

      const response = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": user?.organizationId ?? "",
        },
        body: JSON.stringify({
          ...locationToUpdate,
          isMain: true,
        }),
      })

      if (!response.ok) throw new Error("Failed to update main location")

      const updatedLocation = await response.json()
      setLocations(
        locations.map((loc) => ({
          ...loc,
          isMain: loc.id === id,
        }))
      )

      toast({
        title: "Main location updated",
        description: `${updatedLocation.name} is now your main location.`,
      })
    } catch (error) {
      toast({
        title: "Error updating main location",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      nextDisabled={locations.length === 0}
      showSkip={locations.length > 0}
      onSkip={handleNext}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add Locations</h1>
          <p className="text-muted-foreground mt-1">Add all your restaurant locations. You can add more later.</p>
        </div>

        <div className="space-y-4">
          {locations.map((location) => (
            <Card key={location.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{location.name}</h3>
                      {location.isMain && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Main Location
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1 inline" />
                      {location.address}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingLocation(location)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Location</DialogTitle>
                          <DialogDescription>Update the details for this location.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-location-name">Location Name</Label>
                            <Input
                              id="edit-location-name"
                              value={editingLocation?.name ?? ""}
                              onChange={(e) =>
                                setEditingLocation((prev) => (prev ? { ...prev, name: e.target.value } : null))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-location-address">Address</Label>
                            <Textarea
                              id="edit-location-address"
                              value={editingLocation?.address ?? ""}
                              onChange={(e) =>
                                setEditingLocation((prev) => (prev ? { ...prev, address: e.target.value } : null))
                              }
                            />
                          </div>
                          {!editingLocation?.isMain && locations.length > 1 && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                if (editingLocation) {
                                  setAsMainLocation(editingLocation.id)
                                  setEditingLocation(null)
                                }
                              }}
                            >
                              Set as Main Location
                            </Button>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingLocation(null)}>
                            Cancel
                          </Button>
                          <Button onClick={updateLocation}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLocation(location.id)}
                      disabled={location.isMain && locations.length > 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>Add details for your new restaurant location.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    placeholder="Downtown Location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-address">Address</Label>
                  <Textarea
                    id="location-address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    placeholder="123 Main St, Anytown, USA"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingLocation(false)}>
                  Cancel
                </Button>
                <Button onClick={addLocation}>Add Location</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </OnboardingLayout>
  )
}
