"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Calendar,
  Clock,
  MessageSquare,
  Users,
  Menu,
  LogOut,
  User,
  MapPin,
  DollarSign,
  Bell,
  RefreshCw,
  Shield,
  Building,
  BarChart,
  HelpCircle,
  Users2,
} from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { RoleToggle, useRole } from "@/components/role-toggle"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/components/notifications-provider"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Array<"owner" | "manager" | "employee">
  badge?: number
  permissions?: string[]
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const { role } = useRole()
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const { user, logout, hasPermission } = useAuth()

  // Define navigation items with role-based access
  const navItems: NavItem[] = [
    {
      title: "Schedule",
      href: "/",
      icon: Calendar,
      roles: ["owner", "manager", "employee"],
    },
    {
      title: "Team",
      href: "/team",
      icon: Users,
      roles: ["owner", "manager"],
      permissions: ["manage_users", "view_users"],
    },
    {
      title: "Availability",
      href: "/availability",
      icon: Clock,
      roles: ["owner", "manager", "employee"],
    },
    {
      title: "Time Off",
      href: "/time-off",
      icon: Clock,
      roles: ["owner", "manager", "employee"],
      badge: 2,
    },
    {
      title: "Shift Pool",
      href: "/shift-pool",
      icon: RefreshCw,
      roles: ["owner", "manager", "employee"],
      badge: 3,
    },
    {
      title: "Messages",
      href: "/messages",
      icon: MessageSquare,
      roles: ["owner", "manager", "employee"],
      badge: 1,
    },
    {
      title: "Time Clock",
      href: "/time-clock",
      icon: Clock,
      roles: ["owner", "manager", "employee"],
    },
    {
      title: "Labor Tracking",
      href: "/labor-tracking",
      icon: DollarSign,
      roles: ["owner", "manager"],
      permissions: ["view_reports"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart,
      roles: ["owner", "manager"],
      permissions: ["view_reports"],
    },
    {
      title: "Locations",
      href: "/locations",
      icon: MapPin,
      roles: ["owner", "manager"],
      permissions: ["manage_locations", "view_locations"],
    },
  ]

  // Settings navigation items
  const settingsNavItems: NavItem[] = [
    {
      title: "Account Settings",
      href: "/settings/account",
      icon: User,
      roles: ["owner", "manager", "employee"],
    },
    {
      title: "Users & Permissions",
      href: "/settings/users",
      icon: Shield,
      roles: ["owner"],
      permissions: ["manage_users"],
    },
    {
      title: "Organization",
      href: "/settings/organization",
      icon: Building,
      roles: ["owner"],
      permissions: ["manage_settings"],
    },
    {
      title: "Billing",
      href: "/settings/billing",
      icon: DollarSign,
      roles: ["owner"],
      permissions: ["manage_settings"],
    },
    {
      title: "Integrations",
      href: "/settings/integrations",
      icon: RefreshCw,
      roles: ["owner"],
      permissions: ["manage_settings"],
    },
  ]

  // Filter nav items based on user role and permissions
  const filteredNavItems = navItems.filter((item) => {
    // Check if user has the required role
    if (!item.roles.includes(role)) return false

    // Check if user has the required permissions (if specified)
    if (item.permissions && !item.permissions.some((permission) => hasPermission(permission))) {
      return false
    }

    return true
  })

  // Filter settings nav items based on user role and permissions
  const filteredSettingsNavItems = settingsNavItems.filter((item) => {
    // Check if user has the required role
    if (!item.roles.includes(role)) return false

    // Check if user has the required permissions (if specified)
    if (item.permissions && !item.permissions.some((permission) => hasPermission(permission))) {
      return false
    }

    return true
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <Link href="/" className="flex items-center gap-2 px-2">
                  <span className="text-xl font-bold">EasyShiftHQ</span>
                </Link>

                <div className="flex flex-col gap-1">
                  {filteredNavItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1 text-base font-medium",
                        pathname === item.href ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>

                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Settings</div>
                <div className="flex flex-col gap-1">
                  {filteredSettingsNavItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1 text-base font-medium",
                        pathname === item.href ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">EasyShiftHQ</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-5">
          {filteredNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
          <Link
            href="/schedule?tab=requirements"
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              pathname === "/schedule" && searchParams.get("tab") === "requirements"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            <Users2 className="h-4 w-4" />
            <span>Staffing Requirements</span>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      title={notification.title}
                      description={notification.description}
                      time={formatRelativeTime(new Date(notification.timestamp))}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="outline" size="sm" className="w-full">
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <RoleToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user?.profileImage} alt={user?.firstName} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span>
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filteredSettingsNavItems.map((item, index) => (
                <DropdownMenuItem key={index} asChild>
                  <Link href={item.href} className="flex items-center cursor-pointer">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

interface NotificationItemProps {
  title: string
  description: string
  time: string
}

function NotificationItem({ title, description, time }: NotificationItemProps) {
  const { markAsRead } = useNotifications()

  return (
    <div
      className="flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer"
      onClick={() => markAsRead("1")} // In a real app, we'd use the actual notification ID
    >
      <div className="rounded-full bg-primary/10 p-2">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return diffInDays === 1 ? "Yesterday" : `${diffInDays} days ago`
  }

  return format(date, "MMM d, yyyy")
}
