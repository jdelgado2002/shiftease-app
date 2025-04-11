"use client"

import { useState, createContext, useContext, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChefHat, User } from "lucide-react"

type Role = "manager" | "employee"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("manager")

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export function RoleToggle() {
  const { role, setRole } = useRole()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          {role === "manager" ? <ChefHat className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <span className="hidden sm:inline-block">{role === "manager" ? "Manager" : "Employee"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setRole("manager")}>
          <ChefHat className="mr-2 h-4 w-4" />
          <span>Manager View</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRole("employee")}>
          <User className="mr-2 h-4 w-4" />
          <span>Employee View</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
