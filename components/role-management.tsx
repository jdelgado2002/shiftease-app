"use client"

import { useState } from "react"
import { Check, ChevronDown, Edit2, Search, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"

interface UserWithRole {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "owner" | "manager" | "employee"
  locations: string[]
  permissions: string[]
  profileImage?: string
  status: "active" | "invited" | "inactive"
}

interface Location {
  id: string
  name: string
  address: string
}

// Sample data
const sampleUsers: UserWithRole[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Owner",
    email: "owner@example.com",
    role: "owner",
    locations: ["1", "2", "3"],
    permissions: ["manage_users", "manage_locations", "manage_schedules", "manage_settings", "view_reports"],
    profileImage: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Manager",
    email: "manager@example.com",
    role: "manager",
    locations: ["1"],
    permissions: ["manage_schedules", "view_reports"],
    profileImage: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "3",
    firstName: "Alex",
    lastName: "Employee",
    email: "employee@example.com",
    role: "employee",
    locations: ["1"],
    permissions: ["view_schedule", "update_availability"],
    profileImage: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Manager",
    email: "sarah@example.com",
    role: "manager",
    locations: ["2"],
    permissions: ["manage_schedules", "view_reports"],
    profileImage: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    id: "5",
    firstName: "Mike",
    lastName: "Employee",
    email: "mike@example.com",
    role: "employee",
    locations: ["1", "2"],
    permissions: ["view_schedule", "update_availability"],
    status: "invited",
  },
]

const sampleLocations: Location[] = [
  { id: "1", name: "Downtown Location", address: "123 Main St, Anytown, USA" },
  { id: "2", name: "Uptown Location", address: "456 High St, Anytown, USA" },
  { id: "3", name: "Westside Location", address: "789 West Ave, Anytown, USA" },
]

const permissionGroups = [
  {
    name: "Schedule Management",
    permissions: [
      { id: "manage_schedules", label: "Manage Schedules" },
      { id: "publish_schedules", label: "Publish Schedules" },
      { id: "view_schedules", label: "View Schedules" },
    ],
  },
  {
    name: "User Management",
    permissions: [
      { id: "manage_users", label: "Manage Users" },
      { id: "invite_users", label: "Invite Users" },
    ],
  },
  {
    name: "Location Management",
    permissions: [
      { id: "manage_locations", label: "Manage Locations" },
      { id: "view_locations", label: "View Locations" },
    ],
  },
  {
    name: "Reports",
    permissions: [
      { id: "view_reports", label: "View Reports" },
      { id: "export_reports", label: "Export Reports" },
    ],
  },
  {
    name: "Settings",
    permissions: [{ id: "manage_settings", label: "Manage Settings" }],
  },
]

export function RoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>(sampleUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<"manager" | "employee">("employee")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const { toast } = useToast()
  const { user: authUser } = useAuth()

  // Filter users based on search query, role, and location
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === null || user.role === roleFilter

    const matchesLocation = locationFilter === null || user.locations.includes(locationFilter)

    return matchesSearch && matchesRole && matchesLocation
  })

  const handleAddUser = () => {
    if (!newUserEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      })
      return
    }

    // Check if email already exists
    if (users.some((user) => user.email === newUserEmail)) {
      toast({
        title: "User already exists",
        description: "A user with this email already exists.",
        variant: "destructive",
      })
      return
    }

    const newUser: UserWithRole = {
      id: (users.length + 1).toString(),
      firstName: "",
      lastName: "",
      email: newUserEmail,
      role: newUserRole,
      locations: selectedLocations,
      permissions: selectedPermissions,
      status: "invited",
    }

    setUsers([...users, newUser])
    setIsAddingUser(false)
    setNewUserEmail("")
    setNewUserRole("employee")
    setSelectedLocations([])
    setSelectedPermissions([])

    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${newUserEmail}.`,
    })
  }

  const handleEditUser = () => {
    if (!currentUser) return

    setUsers(
      users.map((user) =>
        user.id === currentUser.id
          ? {
              ...currentUser,
              locations: selectedLocations,
              permissions: selectedPermissions,
            }
          : user,
      ),
    )

    setIsEditingUser(false)
    setCurrentUser(null)
    setSelectedLocations([])
    setSelectedPermissions([])

    toast({
      title: "User updated",
      description: `${currentUser.firstName} ${currentUser.lastName}'s role and permissions have been updated.`,
    })
  }

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find((user) => user.id === userId)

    if (!userToDelete) return

    // Don't allow deleting yourself
    if (authUser?.id === userId) {
      toast({
        title: "Cannot delete yourself",
        description: "You cannot delete your own account.",
        variant: "destructive",
      })
      return
    }

    setUsers(users.filter((user) => user.id !== userId))

    toast({
      title: "User removed",
      description: `${userToDelete.firstName} ${userToDelete.lastName} has been removed.`,
    })
  }

  const handleChangeRole = (userId: string, newRole: "owner" | "manager" | "employee") => {
    // Don't allow changing your own role from owner
    if (authUser?.id === userId && authUser.role === "owner" && newRole !== "owner") {
      toast({
        title: "Cannot change role",
        description: "You cannot change your own owner role.",
        variant: "destructive",
      })
      return
    }

    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              role: newRole,
              // Update permissions based on role
              permissions:
                newRole === "owner"
                  ? ["manage_users", "manage_locations", "manage_schedules", "manage_settings", "view_reports"]
                  : newRole === "manager"
                    ? ["manage_schedules", "view_reports"]
                    : ["view_schedule", "update_availability"],
            }
          : user,
      ),
    )

    const userToUpdate = users.find((user) => user.id === userId)

    toast({
      title: "Role updated",
      description: `${userToUpdate?.firstName} ${userToUpdate?.lastName}'s role has been updated to ${newRole}.`,
    })
  }

  const openEditDialog = (user: UserWithRole) => {
    setCurrentUser(user)
    setSelectedLocations(user.locations)
    setSelectedPermissions(user.permissions)
    setIsEditingUser(true)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId],
    )
  }

  const toggleLocation = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId) ? prev.filter((l) => l !== locationId) : [...prev, locationId],
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter || ""} onValueChange={(value) => setRoleFilter(value || null)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter || ""} onValueChange={(value) => setLocationFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {sampleLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Invite a new user to your organization. They'll receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: "manager" | "employee") => setNewUserRole(value)}>
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
                    {sampleLocations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={selectedLocations.includes(location.id)}
                          onCheckedChange={() => toggleLocation(location.id)}
                        />
                        <Label htmlFor={`location-${location.id}`} className="flex-1 cursor-pointer">
                          {location.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {newUserRole === "manager" && (
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="border rounded-md p-4 space-y-4">
                      {permissionGroups.map((group) => (
                        <div key={group.name} className="space-y-2">
                          <h4 className="text-sm font-medium">{group.name}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <Label htmlFor={`permission-${permission.id}`} className="cursor-pointer">
                                  {permission.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-12 p-4 bg-muted/50 text-sm font-medium">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Locations</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filteredUsers.map((user) => (
          <div key={user.id} className="grid grid-cols-12 p-4 border-t items-center">
            <div className="col-span-4 flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback>
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>

            <div className="col-span-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 justify-start px-2 font-normal">
                    <Badge
                      variant={user.role === "owner" ? "default" : user.role === "manager" ? "secondary" : "outline"}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleChangeRole(user.id, "owner")}>
                    <div className="flex items-center">
                      Owner
                      {user.role === "owner" && <Check className="ml-2 h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleChangeRole(user.id, "manager")}>
                    <div className="flex items-center">
                      Manager
                      {user.role === "manager" && <Check className="ml-2 h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleChangeRole(user.id, "employee")}>
                    <div className="flex items-center">
                      Employee
                      {user.role === "employee" && <Check className="ml-2 h-4 w-4" />}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="col-span-3">
              <div className="flex flex-wrap gap-1">
                {user.locations.map((locationId) => {
                  const location = sampleLocations.find((loc) => loc.id === locationId)
                  return location ? (
                    <Badge key={locationId} variant="outline" className="text-xs">
                      {location.name}
                    </Badge>
                  ) : null
                })}
                {user.locations.length === 0 && <span className="text-sm text-muted-foreground">No locations</span>}
              </div>
            </div>

            <div className="col-span-2">
              <Badge
                variant={user.status === "active" ? "default" : user.status === "invited" ? "secondary" : "outline"}
              >
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>

            <div className="col-span-1 flex justify-end gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No users found. Try adjusting your filters or search query.
          </div>
        )}
      </div>

      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update {currentUser?.firstName} {currentUser?.lastName}'s role, locations, and permissions.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={currentUser.profileImage}
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                  />
                  <AvatarFallback>
                    {currentUser.firstName.charAt(0)}
                    {currentUser.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={currentUser.role}
                  onValueChange={(value: "owner" | "manager" | "employee") => {
                    setCurrentUser({ ...currentUser, role: value })
                    // Update permissions based on role
                    if (value === "owner") {
                      setSelectedPermissions([
                        "manage_users",
                        "manage_locations",
                        "manage_schedules",
                        "manage_settings",
                        "view_reports",
                      ])
                    } else if (value === "manager") {
                      setSelectedPermissions(["manage_schedules", "view_reports"])
                    } else {
                      setSelectedPermissions(["view_schedule", "update_availability"])
                    }
                  }}
                >
                  <SelectTrigger>
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
                <Label>Locations</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {sampleLocations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-location-${location.id}`}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => toggleLocation(location.id)}
                      />
                      <Label htmlFor={`edit-location-${location.id}`} className="flex-1 cursor-pointer">
                        {location.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {(currentUser.role === "owner" || currentUser.role === "manager") && (
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="border rounded-md p-4 space-y-4">
                    {permissionGroups.map((group) => (
                      <div key={group.name} className="space-y-2">
                        <h4 className="text-sm font-medium">{group.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {group.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-permission-${permission.id}`}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <Label htmlFor={`edit-permission-${permission.id}`} className="cursor-pointer">
                                {permission.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
