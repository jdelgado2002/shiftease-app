"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Mail, Trash2, Edit2, Send } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  location: string
  inviteStatus: "pending" | "sent" | "accepted"
}

interface Location {
  id: string
  name: string
}

export default function OnboardingStep4() {
  const [locations, setLocations] = useState<Location[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    location: "",
  })
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [bulkEmails, setBulkEmails] = useState("")
  const [activeTab, setActiveTab] = useState("individual")

  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

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

      // Set default location for new member to the first location if none selected
      if (!newMember.location && data.length > 0) {
        setNewMember(prev => ({ ...prev, location: data[0].id }))
      }
    } catch (error) {
      toast({
        title: "Error fetching locations",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    router.push("/onboarding/5")
  }

  const handleBack = () => {
    router.push("/onboarding/3")
  }

  const addTeamMember = async () => {
    if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.role) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Send invitation first
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': user?.organizationId ?? '',
        },
        body: JSON.stringify({
          email: newMember.email,
          role: newMember.role.toUpperCase(),
          locationIds: [newMember.location],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      // If invitation was successful, add to local state
      const newTeamMemberObj: TeamMember = {
        id: Date.now().toString(),
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        role: newMember.role,
        location: newMember.location,
        inviteStatus: 'sent',
      };

      setTeamMembers([...teamMembers, newTeamMemberObj]);
      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        location: locations.length > 0 ? locations[0].id : '',
      });
      setIsAddingMember(false);

      toast({
        title: 'Team member added',
        description: `${newMember.firstName} ${newMember.lastName} has been added and invited.`,
      });
    } catch (error) {
      toast({
        title: 'Error adding team member',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    }
  };

  const updateTeamMember = () => {
    if (!editingMember?.firstName || !editingMember?.lastName || !editingMember?.email || !editingMember?.role) {
      return
    }

    setTeamMembers(teamMembers.map((member) => (member.id === editingMember.id ? editingMember : member)))

    setEditingMember(null)

    toast({
      title: "Team member updated",
      description: `${editingMember.firstName} ${editingMember.lastName} has been updated.`,
    })
  }

  const deleteTeamMember = (id: string) => {
    const memberToDelete = teamMembers.find((member) => member.id === id)

    setTeamMembers(teamMembers.filter((member) => member.id !== id))

    toast({
      title: "Team member removed",
      description: `${memberToDelete?.firstName} ${memberToDelete?.lastName} has been removed.`,
    })
  }

  const sendInvite = async (id: string) => {
    const member = teamMembers.find((m) => m.id === id);
    if (!member) return;

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': user?.organizationId ?? '',
        },
        body: JSON.stringify({
          email: member.email,
          role: member.role.toUpperCase(),
          locationIds: [member.location],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      setTeamMembers(teamMembers.map((m) => 
        m.id === id ? { ...m, inviteStatus: 'sent' } : m
      ));

      toast({
        title: 'Invitation sent',
        description: `Invitation has been sent to ${member.email}`,
      });
    } catch (error) {
      toast({
        title: 'Error sending invitation',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const processBulkInvites = async () => {
    if (!bulkEmails.trim()) {
      toast({
        title: 'No emails provided',
        description: 'Please enter at least one email address.',
        variant: 'destructive',
      });
      return;
    }

    const emails = bulkEmails
      .split(/[\s,;]+/)
      .filter((email) => email.trim() !== '');

    const defaultLocation = locations.length > 0 ? locations[0].id : '';

    try {
      const invitationPromises = emails.map((email) => 
        fetch('/api/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': user?.organizationId ?? '',
          },
          body: JSON.stringify({
            email: email.trim(),
            role: 'EMPLOYEE',
            locationIds: defaultLocation ? [defaultLocation] : undefined,
          }),
        })
      );

      const responses = await Promise.allSettled(invitationPromises);
      
      const successfulInvites = responses.filter(
        (result): result is PromiseFulfilledResult<Response> => 
        result.status === 'fulfilled' && result.value.ok
      );

      const newMembers: TeamMember[] = emails.map((email, index) => ({
        id: Date.now() + Math.random().toString(),
        firstName: '',
        lastName: '',
        email: email.trim(),
        role: 'EMPLOYEE',
        location: defaultLocation,
        inviteStatus: responses[index].status === 'fulfilled' ? 'sent' : 'pending',
      }));

      setTeamMembers([...teamMembers, ...newMembers]);
      setBulkEmails('');
      setActiveTab('individual');

      toast({
        title: 'Invitations processed',
        description: `Successfully sent ${successfulInvites.length} out of ${emails.length} invitations.`,
      });
    } catch (error) {
      toast({
        title: 'Error processing invitations',
        description: 'Failed to process some invitations. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get invite status style
  const getInviteStatusStyle = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-amber-100 text-amber-800"
    }
  }

  // Helper function to get invite status text
  const getInviteStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Joined"
      case "sent":
        return "Invited"
      default:
        return "Pending Invite"
    }
  }

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={5}
      onNext={handleNext}
      onBack={handleBack}
      showSkip={true}
      onSkip={handleNext}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add Team Members</h1>
          <p className="text-muted-foreground mt-1">Add your team members and invite them to join ShiftEase.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="individual">Add Individually</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">
                          {member.firstName || member.email} {member.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1 inline" />
                          {member.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{member.role}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getInviteStatusStyle(member.inviteStatus)}`}>
                            {getInviteStatusText(member.inviteStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {member.inviteStatus === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => sendInvite(member.id)}>
                            <Send className="h-3 w-3 mr-1" />
                            Send Invite
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingMember(member)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Team Member</DialogTitle>
                              <DialogDescription>Update the details for this team member.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-first-name">First Name</Label>
                                  <Input
                                    id="edit-first-name"
                                    value={editingMember?.firstName ?? ""}
                                    onChange={(e) =>
                                      setEditingMember((prev) => (prev ? { ...prev, firstName: e.target.value } : null))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-last-name">Last Name</Label>
                                  <Input
                                    id="edit-last-name"
                                    value={editingMember?.lastName ?? ""}
                                    onChange={(e) =>
                                      setEditingMember((prev) => (prev ? { ...prev, lastName: e.target.value } : null))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  value={editingMember?.email ?? ""}
                                  onChange={(e) =>
                                    setEditingMember((prev) => (prev ? { ...prev, email: e.target.value } : null))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                  value={editingMember?.role ?? ""}
                                  onValueChange={(value) =>
                                    setEditingMember((prev) => (prev ? { ...prev, role: value } : null))
                                  }
                                >
                                  <SelectTrigger id="edit-role">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="assistant-manager">Assistant Manager</SelectItem>
                                    <SelectItem value="shift-lead">Shift Lead</SelectItem>
                                    <SelectItem value="server">Server</SelectItem>
                                    <SelectItem value="bartender">Bartender</SelectItem>
                                    <SelectItem value="host">Host</SelectItem>
                                    <SelectItem value="cook">Cook</SelectItem>
                                    <SelectItem value="dishwasher">Dishwasher</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-location">Location</Label>
                                <Select
                                  value={editingMember?.location ?? locations[0]?.id ?? ""}
                                  onValueChange={(value) =>
                                    setEditingMember((prev) => (prev ? { ...prev, location: value } : null))
                                  }
                                >
                                  <SelectTrigger id="edit-location">
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
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingMember(null)}>
                                Cancel
                              </Button>
                              <Button onClick={updateTeamMember}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => deleteTeamMember(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Add details for your team member. They'll receive an invitation to join.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name *</Label>
                        <Input
                          id="first-name"
                          value={newMember.firstName}
                          onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name *</Label>
                        <Input
                          id="last-name"
                          value={newMember.lastName}
                          onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
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
                          <SelectItem value="assistant-manager">Assistant Manager</SelectItem>
                          <SelectItem value="shift-lead">Shift Lead</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="bartender">Bartender</SelectItem>
                          <SelectItem value="host">Host</SelectItem>
                          <SelectItem value="cook">Cook</SelectItem>
                          <SelectItem value="dishwasher">Dishwasher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Select
                        value={newMember.location}
                        onValueChange={(value) => setNewMember({ ...newMember, location: value })}
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addTeamMember}>Add Team Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Bulk Import Team Members</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter email addresses separated by commas, spaces, or new lines.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-emails">Email Addresses</Label>
                  <textarea
                    id="bulk-emails"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="john@example.com, jane@example.com, alex@example.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                  />
                </div>
                <Button onClick={processBulkInvites} className="w-full">
                  Add Team Members
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {teamMembers.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                teamMembers.forEach((member) => {
                  if (member.inviteStatus === "pending") {
                    sendInvite(member.id)
                  }
                })
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Send All Pending Invites
            </Button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}
