"use client"

// Enhanced data service with persistent storage
import { useState, useEffect } from "react"

// Generic type for our data models
type Entity = {
  id: string | number
  [key: string]: any
}

// Cache for our mock data
const dataCache: Record<string, Entity[]> = {}

// Local storage keys
const STORAGE_PREFIX = "restaurant-scheduling-"

// Function to load data from local storage or mock data
export async function loadData<T extends Entity>(entityName: string): Promise<T[]> {
  // Check if data is already in cache
  if (dataCache[entityName]) {
    return dataCache[entityName] as T[]
  }

  try {
    // Try to load from local storage first
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`)
      if (storedData) {
        const parsedData = JSON.parse(storedData) as T[]
        dataCache[entityName] = parsedData
        return parsedData
      }
    }

    // If not in local storage, load mock data
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return mock data based on entity name
    let data: T[] = []

    switch (entityName) {
      case "users":
        data = [
          {
            id: "1",
            email: "owner@example.com",
            firstName: "John",
            lastName: "Owner",
            role: "owner",
            locations: ["1", "2", "3"],
            permissions: ["manage_users", "manage_locations", "manage_schedules", "manage_settings", "view_reports"],
            profileImage: "/placeholder.svg?height=40&width=40",
            phone: "555-123-4567",
            hireDate: "2022-01-15",
            status: "active",
          },
          {
            id: "2",
            email: "manager@example.com",
            firstName: "Jane",
            lastName: "Manager",
            role: "manager",
            locations: ["1"],
            permissions: ["manage_schedules", "view_reports"],
            profileImage: "/placeholder.svg?height=40&width=40",
            phone: "555-234-5678",
            hireDate: "2022-03-10",
            status: "active",
          },
          {
            id: "3",
            email: "employee@example.com",
            firstName: "Alex",
            lastName: "Employee",
            role: "employee",
            locations: ["1"],
            permissions: ["view_schedule", "update_availability"],
            profileImage: "/placeholder.svg?height=40&width=40",
            phone: "555-345-6789",
            hireDate: "2022-05-20",
            status: "active",
          },
          {
            id: "4",
            email: "sarah@example.com",
            firstName: "Sarah",
            lastName: "Cook",
            role: "employee",
            locations: ["1"],
            permissions: ["view_schedule", "update_availability"],
            profileImage: "/placeholder.svg?height=40&width=40",
            phone: "555-456-7890",
            hireDate: "2022-07-15",
            status: "active",
          },
          {
            id: "5",
            email: "mike@example.com",
            firstName: "Mike",
            lastName: "Server",
            role: "employee",
            locations: ["1"],
            permissions: ["view_schedule", "update_availability"],
            profileImage: "/placeholder.svg?height=40&width=40",
            phone: "555-567-8901",
            hireDate: "2022-09-05",
            status: "active",
          },
        ] as unknown as T[]
        break

      case "locations":
        data = [
          {
            id: "1",
            name: "Downtown Location",
            address: "123 Main St, Anytown, USA",
            isMain: true,
            phone: "555-123-4567",
            email: "downtown@restaurant.com",
            operatingHours: {
              Monday: { open: "9:00 AM", close: "10:00 PM" },
              Tuesday: { open: "9:00 AM", close: "10:00 PM" },
              Wednesday: { open: "9:00 AM", close: "10:00 PM" },
              Thursday: { open: "9:00 AM", close: "10:00 PM" },
              Friday: { open: "9:00 AM", close: "11:00 PM" },
              Saturday: { open: "10:00 AM", close: "11:00 PM" },
              Sunday: { open: "10:00 AM", close: "9:00 PM" },
            },
          },
          {
            id: "2",
            name: "Uptown Location",
            address: "456 High St, Anytown, USA",
            isMain: false,
            phone: "555-234-5678",
            email: "uptown@restaurant.com",
            operatingHours: {
              Monday: { open: "11:00 AM", close: "9:00 PM" },
              Tuesday: { open: "11:00 AM", close: "9:00 PM" },
              Wednesday: { open: "11:00 AM", close: "9:00 PM" },
              Thursday: { open: "11:00 AM", close: "9:00 PM" },
              Friday: { open: "11:00 AM", close: "10:00 PM" },
              Saturday: { open: "10:00 AM", close: "10:00 PM" },
              Sunday: { open: "10:00 AM", close: "8:00 PM" },
            },
          },
          {
            id: "3",
            name: "Westside Location",
            address: "789 West Ave, Anytown, USA",
            isMain: false,
            phone: "555-345-6789",
            email: "westside@restaurant.com",
            operatingHours: {
              Monday: { open: "10:00 AM", close: "9:00 PM" },
              Tuesday: { open: "10:00 AM", close: "9:00 PM" },
              Wednesday: { open: "10:00 AM", close: "9:00 PM" },
              Thursday: { open: "10:00 AM", close: "9:00 PM" },
              Friday: { open: "10:00 AM", close: "10:00 PM" },
              Saturday: { open: "9:00 AM", close: "10:00 PM" },
              Sunday: { open: "9:00 AM", close: "8:00 PM" },
            },
          },
        ] as unknown as T[]
        break

      case "shifts":
        data = [
          {
            id: 1,
            employeeId: 3,
            day: "Monday",
            date: "2024-03-25",
            startTime: "11:00 AM",
            endTime: "7:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
          {
            id: 2,
            employeeId: 4,
            day: "Monday",
            date: "2024-03-25",
            startTime: "4:00 PM",
            endTime: "11:00 PM",
            role: "Cook",
            status: "scheduled",
            location: "1",
          },
          {
            id: 3,
            employeeId: 5,
            day: "Monday",
            date: "2024-03-25",
            startTime: "9:00 AM",
            endTime: "5:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
          {
            id: 4,
            employeeId: 3,
            day: "Tuesday",
            date: "2024-03-26",
            startTime: "10:00 AM",
            endTime: "6:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
          {
            id: 5,
            employeeId: 4,
            day: "Wednesday",
            date: "2024-03-27",
            startTime: "11:00 AM",
            endTime: "7:00 PM",
            role: "Cook",
            status: "scheduled",
            location: "1",
          },
          {
            id: 6,
            employeeId: 5,
            day: "Thursday",
            date: "2024-03-28",
            startTime: "4:00 PM",
            endTime: "11:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
          {
            id: 7,
            employeeId: 3,
            day: "Friday",
            date: "2024-03-29",
            startTime: "9:00 AM",
            endTime: "5:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
          {
            id: 8,
            employeeId: 4,
            day: "Saturday",
            date: "2024-03-30",
            startTime: "10:00 AM",
            endTime: "6:00 PM",
            role: "Cook",
            status: "scheduled",
            location: "1",
          },
          {
            id: 9,
            employeeId: 5,
            day: "Sunday",
            date: "2024-03-31",
            startTime: "11:00 AM",
            endTime: "7:00 PM",
            role: "Server",
            status: "scheduled",
            location: "1",
          },
        ] as unknown as T[]
        break

      case "availability":
        data = [
          {
            id: 1,
            employeeId: 3,
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
            employeeId: 4,
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
            employeeId: 5,
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
        ] as unknown as T[]
        break

      case "timeoff":
        data = [
          {
            id: 1,
            employeeId: 3,
            employeeName: "Alex Employee",
            startDate: "2024-03-25",
            endDate: "2024-03-26",
            reason: "Family event",
            status: "approved",
          },
          {
            id: 2,
            employeeId: 3,
            employeeName: "Alex Employee",
            startDate: "2024-04-10",
            endDate: "2024-04-15",
            reason: "Vacation",
            status: "pending",
          },
          {
            id: 3,
            employeeId: 4,
            employeeName: "Sarah Cook",
            startDate: "2024-04-05",
            endDate: "2024-04-07",
            reason: "Personal",
            status: "pending",
          },
          {
            id: 4,
            employeeId: 5,
            employeeName: "Mike Server",
            startDate: "2024-04-20",
            endDate: "2024-04-22",
            reason: "Sick Leave",
            status: "pending",
          },
        ] as unknown as T[]
        break

      case "staffingRequirements":
        data = [
          { id: 1, day: "Monday", timeSlot: "11:00 AM - 12:00 PM", role: "Server", count: 2, locationId: "1" },
          { id: 2, day: "Monday", timeSlot: "12:00 PM - 1:00 PM", role: "Server", count: 3, locationId: "1" },
          { id: 3, day: "Monday", timeSlot: "12:00 PM - 1:00 PM", role: "Cook", count: 2, locationId: "1" },
          { id: 4, day: "Friday", timeSlot: "6:00 PM - 7:00 PM", role: "Server", count: 4, locationId: "1" },
          { id: 5, day: "Friday", timeSlot: "6:00 PM - 7:00 PM", role: "Cook", count: 2, locationId: "1" },
        ] as unknown as T[]
        break

      default:
        data = [] as T[]
    }

    // Store in cache and local storage
    dataCache[entityName] = data
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(data))
    }

    return data
  } catch (error) {
    console.error(`Error loading data for ${entityName}:`, error)
    return []
  }
}

// Function to save data to local storage
function saveToStorage<T extends Entity>(entityName: string, data: T[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(data))
  }
}

// Function to get all entities
export async function getAll<T extends Entity>(entityName: string): Promise<T[]> {
  return await loadData<T>(entityName)
}

// Function to get entity by ID
export async function getById<T extends Entity>(entityName: string, id: string | number): Promise<T | null> {
  const entities = await loadData<T>(entityName)
  return entities.find((entity) => entity.id === id) || null
}

// Function to create a new entity
export async function create<T extends Entity>(entityName: string, data: Omit<T, "id">): Promise<T> {
  const entities = await loadData<T>(entityName)

  // Generate a new ID (in a real app, this would be done by the server)
  const newId =
    entities.length > 0
      ? Math.max(...entities.map((e) => (typeof e.id === "number" ? e.id : Number.parseInt(e.id.toString())))) + 1
      : 1

  const newEntity = { ...data, id: newId } as T

  // Add to cache and storage
  const updatedEntities = [...entities, newEntity]
  dataCache[entityName] = updatedEntities
  saveToStorage(entityName, updatedEntities)

  return newEntity
}

// Function to update an entity
export async function update<T extends Entity>(
  entityName: string,
  id: string | number,
  data: Partial<T>,
): Promise<T | null> {
  const entities = await loadData<T>(entityName)
  const index = entities.findIndex((entity) => entity.id === id)

  if (index === -1) {
    return null
  }

  const updatedEntity = { ...entities[index], ...data } as T
  entities[index] = updatedEntity

  // Update cache and storage
  dataCache[entityName] = entities
  saveToStorage(entityName, entities)

  return updatedEntity
}

// Function to delete an entity
export async function remove(entityName: string, id: string | number): Promise<boolean> {
  const entities = await loadData(entityName)
  const index = entities.findIndex((entity) => entity.id === id)

  if (index === -1) {
    return false
  }

  entities.splice(index, 1)

  // Update cache and storage
  dataCache[entityName] = entities
  saveToStorage(entityName, entities)

  return true
}

// Custom hook for using data with CRUD operations
export function useData<T extends Entity>(entityName: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getAll<T>(entityName)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setLoading(false)
    }
  }

  // Create entity
  const createEntity = async (entityData: Omit<T, "id">) => {
    try {
      const newEntity = await create<T>(entityName, entityData)
      setData((prev) => [...prev, newEntity])
      return newEntity
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create entity"))
      throw err
    }
  }

  // Update entity
  const updateEntity = async (id: string | number, entityData: Partial<T>) => {
    try {
      const updatedEntity = await update<T>(entityName, id, entityData)
      if (updatedEntity) {
        setData((prev) => prev.map((item) => (item.id === id ? updatedEntity : item)))
      }
      return updatedEntity
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update entity"))
      throw err
    }
  }

  // Delete entity
  const deleteEntity = async (id: string | number) => {
    try {
      const success = await remove(entityName, id)
      if (success) {
        setData((prev) => prev.filter((item) => item.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete entity"))
      throw err
    }
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [entityName])

  return {
    data,
    loading,
    error,
    refresh: loadData,
    create: createEntity,
    update: updateEntity,
    delete: deleteEntity,
  }
}

// Export a function to clear all data (useful for testing)
export function clearAllData() {
  if (typeof window !== "undefined") {
    // Clear all data from local storage that starts with our prefix
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })

    // Clear the cache
    Object.keys(dataCache).forEach((key) => {
      delete dataCache[key]
    })
  }
}
