"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleManagement } from "@/components/role-management"
import { useAuth } from "@/contexts/auth-context"
import { Shield, UserCog, Users } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function UsersPage() {
  const { hasPermission } = useAuth()

  // Check if user has permission to manage users
  const canManageUsers = hasPermission("manage_users")

  return (
    <ProtectedRoute requiredPermissions={["manage_users"]}>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              User Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            {canManageUsers ? (
              <RoleManagement />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Access Restricted</CardTitle>
                  <CardDescription>
                    You don't have permission to manage users. Please contact an administrator.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Configure roles and their associated permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Default Roles</h3>

                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium">Owner</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Full access to all features and settings. Can manage users, locations, and billing.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Manage Users
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Manage Locations
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Manage Schedules
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Manage Settings
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            View Reports
                          </span>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <h4 className="font-medium">Manager</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Can manage schedules, view reports, and manage employees at assigned locations.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Manage Schedules
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            View Reports
                          </span>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <h4 className="font-medium">Employee</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Can view their schedule, update availability, and request time off.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            View Schedule
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Update Availability
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>Configure global user settings and policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      These settings apply to all users in your organization.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">Multi-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Require all users to set up MFA</p>
                      </div>
                      <div className="text-sm font-medium text-green-600">Enabled</div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">Password Requirements</h4>
                        <p className="text-sm text-muted-foreground">
                          Minimum 8 characters, including uppercase, lowercase, and numbers
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">Enabled</div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">Session Timeout</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out inactive users after 2 hours
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">Enabled</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Single Sign-On (SSO)</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Google or Microsoft accounts
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">Enabled</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
