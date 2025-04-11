"use client"

import { useState } from "react"
import { format, subDays, addDays, parseISO } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Edit2,
  Plus,
  Save,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"

// Sample employees data
const employees = [
  { id: 1, name: "Alex Johnson", role: "Server", hourlyRate: 15 },
  { id: 2, name: "Sam Smith", role: "Bartender", hourlyRate: 18 },
  { id: 3, name: "Jamie Lee", role: "Host", hourlyRate: 14 },
  { id: 4, name: "Taylor Wong", role: "Cook", hourlyRate: 20 },
  { id: 5, name: "Jordan Rivera", role: "Server", hourlyRate: 15 },
]

// Sample data
const initialLaborData = {
  daily: [
    { date: "2024-03-17", sales: 5200, laborHours: 48, laborCost: 720, laborPercentage: 13.8 },
    { date: "2024-03-18", sales: 4800, laborHours: 45, laborCost: 675, laborPercentage: 14.1 },
    { date: "2024-03-19", sales: 5500, laborHours: 52, laborCost: 780, laborPercentage: 14.2 },
    { date: "2024-03-20", sales: 6200, laborHours: 56, laborCost: 840, laborPercentage: 13.5 },
    { date: "2024-03-21", sales: 7800, laborHours: 64, laborCost: 960, laborPercentage: 12.3 },
    { date: "2024-03-22", sales: 8500, laborHours: 72, laborCost: 1080, laborPercentage: 12.7 },
    { date: "2024-03-23", sales: 6800, laborHours: 60, laborCost: 900, laborPercentage: 13.2 },
  ],
  weekly: [
    { week: "Mar 11-17", sales: 32000, laborHours: 320, laborCost: 4800, laborPercentage: 15.0 },
    { week: "Mar 18-24", sales: 44800, laborHours: 397, laborCost: 5955, laborPercentage: 13.3 },
  ],
  monthly: [
    { month: "January", sales: 142000, laborHours: 1280, laborCost: 19200, laborPercentage: 13.5 },
    { month: "February", sales: 128000, laborHours: 1150, laborCost: 17250, laborPercentage: 13.5 },
    { month: "March (MTD)", sales: 98000, laborHours: 860, laborCost: 12900, laborPercentage: 13.2 },
  ],
}

// Sample overtime alerts
const initialOvertimeAlerts = [
  { id: 1, employeeId: 1, name: "Alex Johnson", scheduledHours: 38, actualHours: 42, status: "warning" },
  { id: 2, employeeId: 4, name: "Taylor Wong", scheduledHours: 40, actualHours: 39, status: "ok" },
]

// Sample suggested hours
const initialSuggestedHours = [
  { id: 1, employeeId: 1, name: "Alex Johnson", role: "Server", minHours: 30, maxHours: 38, currentScheduled: 36 },
  { id: 2, employeeId: 2, name: "Sam Smith", role: "Bartender", minHours: 25, maxHours: 35, currentScheduled: 32 },
  { id: 3, employeeId: 3, name: "Jamie Lee", role: "Host", minHours: 20, maxHours: 30, currentScheduled: 28 },
  { id: 4, employeeId: 4, name: "Taylor Wong", role: "Cook", minHours: 35, maxHours: 40, currentScheduled: 40 },
  { id: 5, employeeId: 5, name: "Jordan Rivera", role: "Server", minHours: 25, maxHours: 35, currentScheduled: 30 },
]

export function LaborTrackingView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState("daily")
  const [targetLaborPercentage, setTargetLaborPercentage] = useState(14)
  const [laborData, setLaborData] = useState(initialLaborData)
  const [overtimeAlerts, setOvertimeAlerts] = useState(initialOvertimeAlerts)
  const [suggestedHours, setSuggestedHours] = useState(initialSuggestedHours)
  const [isEditingSales, setIsEditingSales] = useState(false)
  const [editingSalesValue, setEditingSalesValue] = useState("")
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [newRecord, setNewRecord] = useState({ date: format(new Date(), "yyyy-MM-dd"), sales: 0, laborHours: 0 })
  const [isAdjustingHours, setIsAdjustingHours] = useState(false)
  const [editedSuggestedHours, setEditedSuggestedHours] = useState([...initialSuggestedHours])
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handlePreviousPeriod = () => {
    setCurrentDate(subDays(currentDate, 7))
  }

  const handleNextPeriod = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const getCurrentPeriodData = () => {
    // In a real app, this would filter based on the current date
    return selectedPeriod === "daily"
      ? laborData.daily
      : selectedPeriod === "weekly"
        ? laborData.weekly
        : laborData.monthly
  }

  const currentPeriodData = getCurrentPeriodData()

  const calculateTotals = () => {
    const totalSales = currentPeriodData.reduce((sum, day) => sum + day.sales, 0)
    const totalLaborHours = currentPeriodData.reduce((sum, day) => sum + day.laborHours, 0)
    const totalLaborCost = currentPeriodData.reduce((sum, day) => sum + day.laborCost, 0)
    const averageLaborPercentage = (totalLaborCost / totalSales) * 100

    return {
      totalSales,
      totalLaborHours,
      totalLaborCost,
      averageLaborPercentage,
    }
  }

  const totals = calculateTotals()
  const isOverTarget = totals.averageLaborPercentage > targetLaborPercentage

  const handleSaveSales = () => {
    const newSales = Number.parseFloat(editingSalesValue.replace(/[^0-9.]/g, ""))

    if (isNaN(newSales)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid sales amount",
        variant: "destructive",
      })
      return
    }

    // Update the most recent day's sales
    if (selectedPeriod === "daily" && laborData.daily.length > 0) {
      const updatedDaily = [...laborData.daily]
      const lastIndex = updatedDaily.length - 1
      const lastDay = updatedDaily[lastIndex]

      // Recalculate labor percentage
      const newLaborPercentage = (lastDay.laborCost / newSales) * 100

      updatedDaily[lastIndex] = {
        ...lastDay,
        sales: newSales,
        laborPercentage: Number.parseFloat(newLaborPercentage.toFixed(1)),
      }

      setLaborData({
        ...laborData,
        daily: updatedDaily,
      })

      toast({
        title: "Sales updated",
        description: `Sales for ${format(parseISO(lastDay.date), "EEEE, MMMM d")} have been updated`,
      })
    }

    setIsEditingSales(false)
  }

  const handleAddRecord = () => {
    if (newRecord.sales <= 0 || newRecord.laborHours <= 0) {
      toast({
        title: "Invalid values",
        description: "Please enter valid sales and labor hours",
        variant: "destructive",
      })
      return
    }

    // Calculate labor cost based on average hourly rate
    const averageHourlyRate = employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length
    const laborCost = newRecord.laborHours * averageHourlyRate
    const laborPercentage = (laborCost / newRecord.sales) * 100

    const newDailyRecord = {
      date: newRecord.date,
      sales: newRecord.sales,
      laborHours: newRecord.laborHours,
      laborCost: Number.parseFloat(laborCost.toFixed(2)),
      laborPercentage: Number.parseFloat(laborPercentage.toFixed(1)),
    }

    setLaborData({
      ...laborData,
      daily: [...laborData.daily, newDailyRecord],
    })

    setIsAddingRecord(false)
    setNewRecord({ date: format(new Date(), "yyyy-MM-dd"), sales: 0, laborHours: 0 })

    toast({
      title: "Record added",
      description: `New record for ${format(parseISO(newRecord.date), "EEEE, MMMM d")} has been added`,
    })
  }

  const handleSaveSuggestedHours = () => {
    setSuggestedHours(editedSuggestedHours)
    setIsAdjustingHours(false)

    toast({
      title: "Suggested hours updated",
      description: "Employee suggested hours have been updated",
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Labor Tracking</h1>
            <p className="text-muted-foreground">Monitor labor costs and optimize staffing</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousPeriod}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{format(currentDate, "MMMM d, yyyy")}</span>
            <Button variant="outline" size="icon" onClick={handleNextPeriod}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Record</DialogTitle>
                  <DialogDescription>Add a new sales and labor hours record</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="record-date">Date</Label>
                    <Input
                      id="record-date"
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="record-sales">Sales Amount</Label>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <Input
                        id="record-sales"
                        type="number"
                        min="0"
                        step="100"
                        value={newRecord.sales}
                        onChange={(e) => setNewRecord({ ...newRecord, sales: Number.parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="record-hours">Labor Hours</Label>
                    <Input
                      id="record-hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={newRecord.laborHours}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, laborHours: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRecord}>Add Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingSales ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      value={editingSalesValue}
                      onChange={(e) => setEditingSalesValue(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={handleSaveSales}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingSales(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingSalesValue(totals.totalSales.toString())
                      setIsEditingSales(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                For current {selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "month" : "quarter"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Labor Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalLaborHours}</div>
              <p className="text-xs text-muted-foreground">
                For current {selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "month" : "quarter"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalLaborCost)}</div>
              <p className="text-xs text-muted-foreground">
                For current {selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "month" : "quarter"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Labor %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{totals.averageLaborPercentage.toFixed(1)}%</div>
                {isOverTarget ? (
                  <TrendingUp className="ml-2 h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="ml-2 h-4 w-4 text-green-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Target: {targetLaborPercentage}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Labor Analysis</CardTitle>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>Track labor costs against sales to optimize staffing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <div className="space-y-4">
                  {currentPeriodData.map((period, index) => {
                    const periodLabel =
                      selectedPeriod === "daily"
                        ? format(parseISO(period.date), "EEE, MMM d")
                        : selectedPeriod === "weekly"
                          ? period.week
                          : period.month

                    return (
                      <div key={index} className="flex flex-col space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{periodLabel}</span>
                          <span className="font-medium">{period.laborPercentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${
                                period.laborPercentage > targetLaborPercentage ? "bg-destructive" : "bg-green-500"
                              }`}
                              style={{ width: `${(period.laborPercentage / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-24">
                            {formatCurrency(period.laborCost)} / {formatCurrency(period.sales)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overtime Alerts</CardTitle>
              <CardDescription>Employees approaching or exceeding overtime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overtimeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-4">
                    <div
                      className={`mt-0.5 rounded-full p-1 ${
                        alert.status === "warning" ? "bg-amber-100" : "bg-green-100"
                      }`}
                    >
                      <AlertCircle
                        className={`h-4 w-4 ${alert.status === "warning" ? "text-amber-600" : "text-green-600"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {alert.scheduledHours}h | Actual: {alert.actualHours}h
                      </p>
                    </div>
                  </div>
                ))}
                {overtimeAlerts.length === 0 && <p className="text-sm text-muted-foreground">No overtime alerts</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="suggested-hours">
          <TabsList>
            <TabsTrigger value="suggested-hours">Suggested Hours</TabsTrigger>
            <TabsTrigger value="labor-targets">Labor Targets</TabsTrigger>
            <TabsTrigger value="employee-rates">Employee Rates</TabsTrigger>
          </TabsList>
          <TabsContent value="suggested-hours">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Employee Suggested Hours</CardTitle>
                    <CardDescription>Recommended working hours for each employee</CardDescription>
                  </div>
                  <Dialog open={isAdjustingHours} onOpenChange={setIsAdjustingHours}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Adjust Suggested Hours</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Adjust Suggested Hours</DialogTitle>
                        <DialogDescription>
                          Set the minimum and maximum recommended hours for each employee
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {editedSuggestedHours.map((employee, index) => (
                          <div key={employee.id} className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{employee.name}</h4>
                                <p className="text-sm text-muted-foreground">{employee.role}</p>
                              </div>
                              <div className="text-sm">
                                Current: <span className="font-medium">{employee.currentScheduled} hours</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Min: {editedSuggestedHours[index].minHours}h</span>
                                <span>Max: {editedSuggestedHours[index].maxHours}h</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Input
                                  type="number"
                                  min="10"
                                  max="40"
                                  value={editedSuggestedHours[index].minHours}
                                  onChange={(e) => {
                                    const newHours = [...editedSuggestedHours]
                                    newHours[index].minHours = Number.parseInt(e.target.value)
                                    setEditedSuggestedHours(newHours)
                                  }}
                                  className="w-20"
                                />
                                <div className="flex-1">
                                  <Slider
                                    min={10}
                                    max={40}
                                    step={1}
                                    value={[editedSuggestedHours[index].minHours, editedSuggestedHours[index].maxHours]}
                                    onValueChange={(value) => {
                                      const newHours = [...editedSuggestedHours]
                                      newHours[index].minHours = value[0]
                                      newHours[index].maxHours = value[1]
                                      setEditedSuggestedHours(newHours)
                                    }}
                                  />
                                </div>
                                <Input
                                  type="number"
                                  min="10"
                                  max="40"
                                  value={editedSuggestedHours[index].maxHours}
                                  onChange={(e) => {
                                    const newHours = [...editedSuggestedHours]
                                    newHours[index].maxHours = Number.parseInt(e.target.value)
                                    setEditedSuggestedHours(newHours)
                                  }}
                                  className="w-20"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustingHours(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSuggestedHours}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestedHours.map((employee) => (
                    <div key={employee.id} className="flex flex-col space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{employee.currentScheduled} hours</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {employee.minHours}-{employee.maxHours}h
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${
                            employee.currentScheduled > employee.maxHours
                              ? "bg-destructive"
                              : employee.currentScheduled < employee.minHours
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${(employee.currentScheduled / 50) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="labor-targets">
            <Card>
              <CardHeader>
                <CardTitle>Labor Targets</CardTitle>
                <CardDescription>Set target labor percentages based on projected sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="target-percentage">Target Labor Percentage</Label>
                      <Select
                        value={targetLaborPercentage.toString()}
                        onValueChange={(value) => setTargetLaborPercentage(Number.parseInt(value))}
                      >
                        <SelectTrigger id="target-percentage">
                          <SelectValue placeholder="Select target %" />
                        </SelectTrigger>
                        <SelectContent>
                          {[12, 13, 14, 15, 16, 17, 18].map((percentage) => (
                            <SelectItem key={percentage} value={percentage.toString()}>
                              {percentage}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projected-sales">Projected Weekly Sales</Label>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <input
                          id="projected-sales"
                          type="text"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="45,000"
                        />
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>Recommended Staffing</AlertTitle>
                    <AlertDescription>
                      Based on your projected sales and target labor percentage, you should schedule approximately
                      <span className="font-bold"> 420 </span>
                      labor hours for the week.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Update Labor Targets</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="employee-rates">
            <Card>
              <CardHeader>
                <CardTitle>Employee Hourly Rates</CardTitle>
                <CardDescription>Set hourly pay rates for employees to calculate labor costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <EmployeeRateItem
                      key={employee.id}
                      employee={employee}
                      onRateChange={(id, newRate) => {
                        // In a real app, this would update the employee's rate in the database
                        toast({
                          title: "Rate updated",
                          description: `${employee.name}'s hourly rate has been updated to $${newRate}`,
                        })
                      }}
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full justify-between">
                  <div>
                    <p className="text-sm font-medium">Average Hourly Rate</p>
                    <p className="text-lg font-bold">
                      ${(employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length).toFixed(2)}
                    </p>
                  </div>
                  <Button>Save All Rates</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface EmployeeRateItemProps {
  employee: {
    id: number
    name: string
    role: string
    hourlyRate: number
  }
  onRateChange: (id: number, newRate: number) => void
}

function EmployeeRateItem({ employee, onRateChange }: EmployeeRateItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [rate, setRate] = useState(employee.hourlyRate.toString())

  const handleSave = () => {
    const newRate = Number.parseFloat(rate)
    if (isNaN(newRate) || newRate <= 0) {
      return
    }

    onRateChange(employee.id, newRate)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between border-b pb-3">
      <div>
        <p className="font-medium">{employee.name}</p>
        <p className="text-sm text-muted-foreground">{employee.role}</p>
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-24 pl-8" value={rate} onChange={(e) => setRate(e.target.value)} autoFocus />
          </div>
          <Button size="icon" variant="ghost" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="font-medium">${employee.hourlyRate.toFixed(2)}/hr</p>
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
