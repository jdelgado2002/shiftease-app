"use client"

// Enhanced data service with persistent storage
import { useState, useEffect } from "react"

// Generic type for our data models
type Entity = {
  id: string | number
  [key: string]: any
}

// Cache for our data
const dataCache: Record<string, Entity[]> = {}

// Local storage keys
const STORAGE_PREFIX = "restaurant-scheduling-"

// Function to load data from API or local storage
export async function loadData<T extends Entity>(entityName: string): Promise<T[]> {
  // Check if data is already in cache
  if (dataCache[entityName]) {
    return dataCache[entityName] as T[]
  }

  try {
    // Try to fetch from API first
    const response = await fetch(`/api/${entityName}`, {
      headers: {
        "x-organization-id": localStorage.getItem("organizationId") || "",
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      dataCache[entityName] = data
      return data
    }

    // If API fails, try to load from local storage
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`)
      if (storedData) {
        const parsedData = JSON.parse(storedData) as T[]
        dataCache[entityName] = parsedData
        return parsedData
      }
    }

    // If no data is found, return empty array
    return []

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
      const response = await fetch(`/api/${entityName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": localStorage.getItem("organizationId") || "",
        },
        body: JSON.stringify(entityData),
      })
      if (!response.ok) throw new Error(`Failed to create ${entityName}`)
      const newEntity = await response.json()
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
      const response = await fetch(`/api/${entityName}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": localStorage.getItem("organizationId") || "",
        },
        body: JSON.stringify(entityData),
      })
      if (!response.ok) throw new Error(`Failed to update ${entityName}`)
      const updatedEntity = await response.json()
      setData((prev) => prev.map((item) => (item.id === id ? updatedEntity : item)))
      return updatedEntity
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update entity"))
      throw err
    }
  }

  // Delete entity
  const deleteEntity = async (id: string | number) => {
    try {
      const response = await fetch(`/api/${entityName}/${id}`, {
        method: "DELETE",
        headers: {
          "x-organization-id": localStorage.getItem("organizationId") || "",
        },
      })
      if (!response.ok) throw new Error(`Failed to delete ${entityName}`)
      setData((prev) => prev.filter((item) => item.id !== id))
      return true
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
