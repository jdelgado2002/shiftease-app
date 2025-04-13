import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Get all locations for the organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 })
    }

    const locations = await prisma.location.findMany({
      where: { organizationId }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { message: "Error fetching locations" },
      { status: 500 }
    )
  }
}

// Create a new location
export async function POST(request: NextRequest) {
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

    // If this is the main location, unset any existing main location
    if (isMain) {
      await prisma.location.updateMany({
        where: { organizationId, isMain: true },
        data: { isMain: false }
      })
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        isMain,
        organizationId
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json(
      { message: "Error creating location" },
      { status: 500 }
    )
  }
}