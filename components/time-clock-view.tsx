"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Clock, ClockIcon as ClockCheck, MapPin, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TimeEntry {
  id: number
  type: "in" | "out"
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
    isWithinRadius: boolean
  }
}

interface Coordinates {
  latitude: number
  longitude: number
}

export function TimeClockView() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Restaurant location (would come from settings in a real app)
  const restaurantLocation = {
    latitude: 40.7128,
    longitude: -74.006,
    radius: 0.5, // miles
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Get current location
  const getCurrentLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by your browser")
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          reject(`Error getting location: ${error.message}`)
        },
      )
    })
  }

  // Calculate distance between two coordinates in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Check if user is within the allowed radius
  const isWithinAllowedRadius = (userLocation: Coordinates): boolean => {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      restaurantLocation.latitude,
      restaurantLocation.longitude,
    )

    return distance <= restaurantLocation.radius
  }

  const handleClockAction = async (type: "in" | "out") => {
    setIsLoading(true)
    setLocationError(null)

    try {
      const location = await getCurrentLocation()
      setCurrentLocation(location)

      const isWithinRadius = isWithinAllowedRadius(location)

      const entry: TimeEntry = {
        id: timeEntries.length + 1,
        type,
        timestamp: new Date(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          isWithinRadius,
        },
      }

      setTimeEntries([...timeEntries, entry])

      if (type === "in") {
        setIsClockedIn(true)
        if (isWithinRadius) {
          toast({
            title: "Clocked in",
            description: `You clocked in at ${format(entry.timestamp, "h:mm a")}`,
          })
        } else {
          toast({
            title: "Warning: Location outside radius",
            description: `You're not at the restaurant location. This will be flagged for review.`,
            variant: "destructive",
          })
        }
      } else {
        setIsClockedIn(false)
        if (isWithinRadius) {
          toast({
            title: "Clocked out",
            description: `You clocked out at ${format(entry.timestamp, "h:mm a")}`,
          })
        } else {
          toast({
            title: "Warning: Location outside radius",
            description: `You're not at the restaurant location. This will be flagged for review.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      setLocationError(error as string)
      toast({
        title: "Location error",
        description: error as string,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockIn = () => handleClockAction("in")
  const handleClockOut = () => handleClockAction("out")

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Time Clock</h1>
          <p className="text-muted-foreground">Track your work hours</p>
        </div>

        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Clock In/Out</CardTitle>
              <CardDescription>Record your shift start and end times</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="text-4xl font-bold mb-6">{format(currentTime, "h:mm:ss a")}</div>

              {currentLocation && (
                <div className="mb-4 flex items-center text-sm">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>
                    {isWithinAllowedRadius(currentLocation)
                      ? "You are at the restaurant location"
                      : "Warning: You are not at the restaurant location"}
                  </span>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={handleClockIn}
                  disabled={isClockedIn || isLoading}
                  className={!isClockedIn ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {isLoading ? "Getting location..." : "Clock In"}
                </Button>
                <Button size="lg" onClick={handleClockOut} disabled={!isClockedIn || isLoading} variant="destructive">
                  <ClockCheck className="mr-2 h-4 w-4" />
                  {isLoading ? "Getting location..." : "Clock Out"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {isClockedIn ? "You are currently clocked in" : "You are not clocked in"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
              <CardDescription>View your clock in/out history for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntries.length > 0 ? (
                  timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center">
                        {entry.type === "in" ? (
                          <Clock className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                          <ClockCheck className="mr-2 h-4 w-4 text-red-500" />
                        )}
                        <span>{entry.type === "in" ? "Clock In" : "Clock Out"}</span>
                        {entry.location && !entry.location.isWithinRadius && (
                          <span className="ml-2 text-xs text-amber-600 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Outside location
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{format(entry.timestamp, "h:mm a")}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No time entries for today</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">{format(currentTime, "EEEE, MMMM d, yyyy")}</div>
              {timeEntries.length > 0 && (
                <Button variant="outline" size="sm">
                  Export Timesheet
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
