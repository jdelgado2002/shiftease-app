import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Update a location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 })
    }

    const { name, address, isMain } = await request.json()

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { message: "Name and address are required" },
        { status: 400 }
      )
    }

    // If this is being set as the main location, unset any existing main location
    if (isMain) {
      await prisma.location.updateMany({
        where: { 
          organizationId,
          isMain: true,
          NOT: { id: params.id }
        },
        data: { isMain: false }
      })
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: { name, address, isMain }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { message: "Error updating location" },
      { status: 500 }
    )
  }
}

// Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 })
    }

    // Check if this is the main location
    const location = await prisma.location.findUnique({
      where: { id: params.id }
    })

    if (!location) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 })
    }

    // Don't allow deleting the main location if there are other locations
    if (location.isMain) {
      const otherLocationsCount = await prisma.location.count({
        where: { 
          organizationId,
          NOT: { id: params.id }
        }
      })

      if (otherLocationsCount > 0) {
        return NextResponse.json(
          { message: "Cannot delete main location. Set another location as main first." },
          { status: 400 }
        )
      }
    }

    await prisma.location.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json(
      { message: "Error deleting location" },
      { status: 500 }
    )
  }
}