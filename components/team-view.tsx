"use client"

import { useState, useCallback } from "react"
import { Search, Plus, Filter, Mail, Phone, Calendar, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { format, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRole } from "@/components/role-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/lib/data-service"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Types
interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  hireDate: string
  status: string
  profileImage?: string
  locations: string[]
  permissions: string[]
}

interface Location {
  id: string
  name: string
  address: string
  isMain: boolean
}

interface Availability {
  id: number
  employeeId: number
  availability: {
    [day: string]: {
      morning: boolean
      afternoon: boolean
      evening: boolean
      night: boolean
    }
  }
}

interface TimeOffRequest {
  id: number
  employeeId: number
  employeeName: string
  startDate: string
  endDate: string
  reason: string
  status: string
}

export function TeamView() {
  const { role } = useRole()
  const { user } = useAuth()
  const { toast } = useToast()

  // Data hooks
  const {
    data: teamMembers,
    loading: loadingTeam,
    create: createTeamMember,
    update: updateTeamMember,
    delete: deleteTeamMember,
  } = useData<TeamMember>("users")

  const { data: locations } = useData<Location>("locations")
  const { data: availabilityData } = useData<Availability>("availability")
  const { data: timeOffRequests } = useData<TimeOffRequest>("timeoff")

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isEditingMember, setIsEditingMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")

  // New member form state
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "employee",
    locations: [] as string[],
    permissions: [] as string[],
  })

  // Filter team members - memoize to prevent recalculation on every render
  const filteredTeamMembers = useCallback(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        searchQuery === "" ||
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === null || member.role === roleFilter

      const matchesLocation = locationFilter === null || (member.locations && member.locations.includes(locationFilter))

      const matchesStatus = statusFilter === null || member.status === statusFilter

      return matchesSearch && matchesRole && matchesLocation && matchesStatus
    })
  }, [teamMembers, searchQuery, roleFilter, locationFilter, statusFilter])

  // Handle adding a new team member
  const handleAddTeamMember = async () => {
    if (!newMember.firstName || !newMember.lastName || !newMember.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // Set default permissions based on role
      let permissions: string[] = []
      if (newMember.role === "manager") {
        permissions = ["manage_schedules", "view_reports"]
      } else if (newMember.role === "employee") {
        permissions = ["view_schedule", "update_availability"]
      }

      const memberData = {
        ...newMember,
        permissions,
        hireDate: new Date().toISOString().split("T")[0],
        status: "active",
      }

      await createTeamMember(memberData)

      setIsAddingMember(false)
      setNewMember({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "employee",
        locations: [],
        permissions: [],
      })

      toast({
        title: "Team member added",
        description: `${newMember.firstName} ${newMember.lastName} has been added to your team.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle updating a team member
  const handleUpdateTeamMember = async () => {
    if (!selectedMember) return

    try {
      await updateTeamMember(selectedMember.id, selectedMember)

      setIsEditingMember(false)
      setSelectedMember(null)

      toast({
        title: "Team member updated",
        description: `${selectedMember.firstName} ${selectedMember.lastName}'s information has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a team member
  const handleDeleteTeamMember = async (id: string) => {
    try {
      await deleteTeamMember(id)

      toast({
        title: "Team member removed",
        description: "The team member has been removed from your team.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Toggle location selection
  const toggleLocation = (locationId: string, target: "new" | "edit") => {
    if (target === "new") {
      setNewMember((prev) => {
        const locations = prev.locations.includes(locationId)
          ? prev.locations.filter((id) => id !== locationId)
          : [...prev.locations, locationId]

        return { ...prev, locations }
      })
    } else {
      setSelectedMember((prev) => {
        if (!prev) return prev

        const locations = prev.locations.includes(locationId)
          ? prev.locations.filter((id) => id !== locationId)
          : [...prev.locations, locationId]

        return { ...prev, locations }
      })
    }
  }

  // Toggle permission selection
  const togglePermission = (permissionId: string, target: "new" | "edit") => {
    if (target === "new") {
      setNewMember((prev) => {
        const permissions = prev.permissions.includes(permissionId)
          ? prev.permissions.filter((id) => id !== permissionId)
          : [...prev.permissions, permissionId]

        return { ...prev, permissions }
      })
    } else {
      setSelectedMember((prev) => {
        if (!prev) return prev

        const permissions = prev.permissions.includes(permissionId)
          ? prev.permissions.filter((id) => id !== permissionId)
          : [...prev.permissions, permissionId]

        return { ...prev, permissions }
      })
    }
  }

  // Get employee availability
  const getEmployeeAvailability = (employeeId: number) => {
    return availabilityData.find((a) => a.employeeId === employeeId)?.availability || null
  }

  // Get employee time off requests
  const getEmployeeTimeOffRequests = (employeeId: number) => {
    return timeOffRequests.filter((r) => r.employeeId === employeeId) || []
  }

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return ""

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "")

    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    return phone
  }

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === "all" ? null : value)
  }

  // Handle location filter change
  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value === "all" ? null : value)
  }

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? null : value)
  }

  // Check if user can manage team members
  const canManageTeam = role === "owner" || role === "manager"

  // Get current filtered team members
  const currentFilteredTeamMembers = filteredTeamMembers()

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              {canManageTeam
                ? "Manage your team members, view their availability, and track time off requests"
                : "View your team members and their contact information"}
            </p>
          </div>

          {canManageTeam && (
            <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new team member to your restaurant. They'll receive an email invitation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="border rounded-md p-4 space-y-2">
                      {locations.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location.id}`}
                            checked={newMember.locations.includes(location.id)}
                            onCheckedChange={() => toggleLocation(location.id, "new")}
                          />
                          <Label htmlFor={`location-${location.id}`} className="flex-1 cursor-pointer">
                            {location.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeamMember}>Add Team Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-64 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-filter">Role</Label>
                  <Select onValueChange={handleRoleFilterChange}>
                    <SelectTrigger id="role-filter">
                      <SelectValue placeholder={roleFilter || "All roles"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Select onValueChange={handleLocationFilterChange}>
                    <SelectTrigger id="location-filter">
                      <SelectValue
                        placeholder={
                          locationFilter ? locations.find((l) => l.id === locationFilter)?.name : "All locations"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select onValueChange={handleStatusFilterChange}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder={statusFilter || "All statuses"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("")
                    setRoleFilter(null)
                    setLocationFilter(null)
                    setStatusFilter(null)
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Team Members</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="timeoff">Time Off Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-4">
                  {loadingTeam ? (
                    <div className="text-center py-8">Loading team members...</div>
                  ) : currentFilteredTeamMembers.length > 0 ? (
                    currentFilteredTeamMembers.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.profileImage} alt={`${member.firstName} ${member.lastName}`} />
                                <AvatarFallback>
                                  {member.firstName.charAt(0)}
                                  {member.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium text-lg">
                                  {member.firstName} {member.lastName}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Badge
                                    variant={
                                      member.role === "owner"
                                        ? "default"
                                        : member.role === "manager"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                  </Badge>
                                  <Badge
                                    variant={
                                      member.status === "active"
                                        ? "default"
                                        : member.status === "invited"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatPhoneNumber(member.phone)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Hired: {member.hireDate ? format(parseISO(member.hireDate), "MMM d, yyyy") : "N/A"}
                                </span>
                              </div>
                            </div>

                            {canManageTeam && (
                              <div className="flex items-center gap-2">
                                <Dialog
                                  open={isEditingMember && selectedMember?.id === member.id}
                                  onOpenChange={(open) => {
                                    setIsEditingMember(open)
                                    if (open) {
                                      setSelectedMember(member)
                                    } else {
                                      setSelectedMember(null)
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                      <DialogTitle>Edit Team Member</DialogTitle>
                                      <DialogDescription>
                                        Update information for {member.firstName} {member.lastName}
                                      </DialogDescription>
                                    </DialogHeader>
                                    {selectedMember && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-firstName">First Name</Label>
                                            <Input
                                              id="edit-firstName"
                                              value={selectedMember.firstName}
                                              onChange={(e) =>
                                                setSelectedMember({
                                                  ...selectedMember,
                                                  firstName: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-lastName">Last Name</Label>
                                            <Input
                                              id="edit-lastName"
                                              value={selectedMember.lastName}
                                              onChange={(e) =>
                                                setSelectedMember({
                                                  ...selectedMember,
                                                  lastName: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="edit-email">Email</Label>
                                          <Input
                                            id="edit-email"
                                            type="email"
                                            value={selectedMember.email}
                                            onChange={(e) =>
                                              setSelectedMember({
                                                ...selectedMember,
                                                email: e.target.value,
                                              })
                                            }
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="edit-phone">Phone Number</Label>
                                          <Input
                                            id="edit-phone"
                                            type="tel"
                                            value={selectedMember.phone}
                                            onChange={(e) =>
                                              setSelectedMember({
                                                ...selectedMember,
                                                phone: e.target.value,
                                              })
                                            }
                                            placeholder="(123) 456-7890"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="edit-role">Role</Label>
                                          <Select
                                            value={selectedMember.role}
                                            onValueChange={(value) =>
                                              setSelectedMember({
                                                ...selectedMember,
                                                role: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger id="edit-role">
                                              <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="owner">Owner</SelectItem>
                                              <SelectItem value="manager">Manager</SelectItem>
                                              <SelectItem value="employee">Employee</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="edit-status">Status</Label>
                                          <Select
                                            value={selectedMember.status}
                                            onValueChange={(value) =>
                                              setSelectedMember({
                                                ...selectedMember,
                                                status: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger id="edit-status">
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">Active</SelectItem>
                                              <SelectItem value="invited">Invited</SelectItem>
                                              <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Locations</Label>
                                          <div className="border rounded-md p-4 space-y-2">
                                            {locations.map((location) => (
                                              <div key={location.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`edit-location-${location.id}`}
                                                  checked={selectedMember.locations.includes(location.id)}
                                                  onCheckedChange={() => toggleLocation(location.id, "edit")}
                                                />
                                                <Label
                                                  htmlFor={`edit-location-${location.id}`}
                                                  className="flex-1 cursor-pointer"
                                                >
                                                  {location.name}
                                                </Label>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsEditingMember(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleUpdateTeamMember}>Save Changes</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to remove ${member.firstName} ${member.lastName} from your team?`,
                                      )
                                    ) {
                                      handleDeleteTeamMember(member.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No team members found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Availability</CardTitle>
                    <CardDescription>View your team's weekly availability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-left font-medium">Employee</th>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                              (day) => (
                                <th key={day} className="p-2 text-center font-medium">
                                  {day.substring(0, 3)}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {currentFilteredTeamMembers
                            .filter((member) => member.role === "employee" || member.role === "manager")
                            .map((member) => {
                              const availability = getEmployeeAvailability(Number.parseInt(member.id))

                              return (
                                <tr key={member.id} className="border-t">
                                  <td className="p-2">
                                    <div className="font-medium">
                                      {member.firstName} {member.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{member.role}</div>
                                  </td>
                                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                                    (day) => (
                                      <td key={day} className="p-2">
                                        {availability ? (
                                          <div className="flex flex-col gap-1">
                                            {["morning", "afternoon", "evening", "night"].map((block) => (
                                              <div
                                                key={block}
                                                className={`text-xs px-2 py-1 rounded-sm text-center ${
                                                  availability[day]?.[block as keyof (typeof availability)[typeof day]]
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-400"
                                                }`}
                                              >
                                                {block.charAt(0).toUpperCase()}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-center text-muted-foreground">No data</div>
                                        )}
                                      </td>
                                    ),
                                  )}
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-green-100"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-sm bg-gray-100"></div>
                        <span>Unavailable</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">M = Morning, A = Afternoon, E = Evening, N = Night</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeoff">
                <Card>
                  <CardHeader>
                    <CardTitle>Time Off Requests</CardTitle>
                    <CardDescription>View and manage time off requests from your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timeOffRequests.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            {canManageTeam && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timeOffRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>
                                {teamMembers.find((m) => m.id === request.employeeId.toString())?.firstName || ""}{" "}
                                {teamMembers.find((m) => m.id === request.employeeId.toString())?.lastName || ""}
                              </TableCell>
                              <TableCell>
                                {format(parseISO(request.startDate), "MMM d, yyyy")}
                                {request.startDate !== request.endDate &&
                                  ` - ${format(parseISO(request.endDate), "MMM d, yyyy")}`}
                              </TableCell>
                              <TableCell>{request.reason}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    request.status === "approved"
                                      ? "default"
                                      : request.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </TableCell>
                              {canManageTeam && (
                                <TableCell>
                                  {request.status === "pending" && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1"
                                        onClick={() => {
                                          // In a real app, this would call an API
                                          toast({
                                            title: "Request approved",
                                            description: "The time off request has been approved.",
                                          })
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1"
                                        onClick={() => {
                                          // In a real app, this would call an API
                                          toast({
                                            title: "Request denied",
                                            description: "The time off request has been denied.",
                                          })
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        Deny
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No time off requests found</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
