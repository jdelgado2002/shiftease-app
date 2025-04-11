"use client"

import { useState } from "react"
import { Bug } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AutoAssignDebug } from "./auto-assign-debug"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertCircle, Info, Settings, Users, DollarSign, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AutoAssignProps {
  onApply: (settings: AutoAssignSettings) => void
  onCancel: () => void
}

export interface AutoAssignSettings {
  prioritizeAvailability: boolean
  prioritizeFairDistribution: boolean
  prioritizeBudget: boolean
  maxHoursPerEmployee: number
  maxShiftsPerWeek: number
  considerPreferences: boolean
  budgetLimit: number
  allowOvertime: boolean
}

export function AutoAssignAlgorithm({ onApply, onCancel }: AutoAssignProps) {
  const [settings, setSettings] = useState<AutoAssignSettings>({
    prioritizeAvailability: true,
    prioritizeFairDistribution: true,
    prioritizeBudget: false,
    maxHoursPerEmployee: 40,
    maxShiftsPerWeek: 5,
    considerPreferences: true,
    budgetLimit: 2000,
    allowOvertime: false,
  })

  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const [debugData, setDebugData] = useState(null)

  const handleSettingChange = (key: keyof AutoAssignSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Auto-Assign Explanation</AlertTitle>
        <AlertDescription>
          The auto-assign feature creates a draft schedule based on your settings below. It considers staff
          availability, role requirements, and budget constraints. You'll be able to review and modify the schedule
          before publishing.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="priorities">
        <TabsList className="mb-4">
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Priorities</CardTitle>
              <CardDescription>Set what matters most when creating your schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="prioritize-availability" className="font-medium">
                      Prioritize Staff Availability
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When enabled, the algorithm will prioritize scheduling employees during their preferred
                            availability windows.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Schedule employees based on their availability preferences
                  </p>
                </div>
                <Switch
                  id="prioritize-availability"
                  checked={settings.prioritizeAvailability}
                  onCheckedChange={(checked) => handleSettingChange("prioritizeAvailability", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="prioritize-fair" className="font-medium">
                      Fair Distribution of Hours
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When enabled, the algorithm will try to distribute hours evenly among eligible employees.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">Distribute shifts evenly among staff members</p>
                </div>
                <Switch
                  id="prioritize-fair"
                  checked={settings.prioritizeFairDistribution}
                  onCheckedChange={(checked) => handleSettingChange("prioritizeFairDistribution", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="prioritize-budget" className="font-medium">
                      Budget Optimization
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When enabled, the algorithm will try to optimize labor costs while meeting staffing
                            requirements.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">Optimize schedule to reduce labor costs</p>
                </div>
                <Switch
                  id="prioritize-budget"
                  checked={settings.prioritizeBudget}
                  onCheckedChange={(checked) => handleSettingChange("prioritizeBudget", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Constraints</CardTitle>
              <CardDescription>Set limits for your auto-generated schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-hours" className="font-medium">
                    Maximum Hours Per Employee
                  </Label>
                  <span className="text-sm font-medium">{settings.maxHoursPerEmployee} hours</span>
                </div>
                <Slider
                  id="max-hours"
                  min={10}
                  max={60}
                  step={1}
                  value={[settings.maxHoursPerEmployee]}
                  onValueChange={(value) => handleSettingChange("maxHoursPerEmployee", value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Limit the maximum hours an employee can be scheduled per week
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-shifts" className="font-medium">
                    Maximum Shifts Per Week
                  </Label>
                  <span className="text-sm font-medium">{settings.maxShiftsPerWeek} shifts</span>
                </div>
                <Slider
                  id="max-shifts"
                  min={1}
                  max={7}
                  step={1}
                  value={[settings.maxShiftsPerWeek]}
                  onValueChange={(value) => handleSettingChange("maxShiftsPerWeek", value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Limit the maximum number of shifts an employee can work per week
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="budget-limit" className="font-medium">
                    Weekly Budget Limit
                  </Label>
                  <span className="text-sm font-medium">${settings.budgetLimit}</span>
                </div>
                <Slider
                  id="budget-limit"
                  min={500}
                  max={5000}
                  step={100}
                  value={[settings.budgetLimit]}
                  onValueChange={(value) => handleSettingChange("budgetLimit", value[0])}
                />
                <p className="text-xs text-muted-foreground">Set a maximum budget for labor costs per week</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune the auto-assign algorithm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="consider-preferences" className="font-medium">
                    Consider Employee Preferences
                  </Label>
                  <p className="text-sm text-muted-foreground">Take into account preferred shifts and days</p>
                </div>
                <Switch
                  id="consider-preferences"
                  checked={settings.considerPreferences}
                  onCheckedChange={(checked) => handleSettingChange("considerPreferences", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-overtime" className="font-medium">
                    Allow Overtime
                  </Label>
                  <p className="text-sm text-muted-foreground">Allow scheduling beyond regular hours when necessary</p>
                </div>
                <Switch
                  id="allow-overtime"
                  checked={settings.allowOvertime}
                  onCheckedChange={(checked) => handleSettingChange("allowOvertime", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Settings className="h-4 w-4 mr-1" />
          <span>Algorithm will optimize based on your priorities</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onApply(settings)}>Apply Settings</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Auto-Assign Works</CardTitle>
          <CardDescription>Understanding the scheduling algorithm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-blue-500" />
            <div>
              <h4 className="font-medium">Staff Availability Analysis</h4>
              <p className="text-sm text-muted-foreground">
                The algorithm first analyzes all staff availability patterns and time-off requests to determine who is
                available for each shift.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 text-green-500" />
            <div>
              <h4 className="font-medium">Shift Requirements Matching</h4>
              <p className="text-sm text-muted-foreground">
                Next, it matches available staff with shift requirements based on roles, skills, and certifications
                needed for each position.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 mt-0.5 text-amber-500" />
            <div>
              <h4 className="font-medium">Budget Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Finally, it optimizes the schedule to meet your budget constraints while ensuring fair distribution of
                hours among staff.
              </p>
            </div>
          </div>

          <Alert variant="outline" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
              Auto-assign creates a draft schedule that you can review and modify before publishing. The algorithm makes
              its best effort based on your settings, but you should always review the results.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Collect debug data
            const debugData = {
              employees: [], // This would be populated from props
              availability: [],
              staffingRequirements: [],
              shifts: [],
              settings,
            }
            setDebugData(debugData)
            setIsDebugOpen(true)
          }}
        >
          <Bug className="mr-2 h-4 w-4" />
          Debug Auto-Assign
        </Button>
      </div>

      {/* Debug Dialog */}
      <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Assign Debug</DialogTitle>
          </DialogHeader>
          {debugData && <AutoAssignDebug data={debugData} onClose={() => setIsDebugOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
