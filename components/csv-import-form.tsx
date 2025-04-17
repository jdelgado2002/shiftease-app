import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Upload } from "lucide-react"

const csvImportSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "text/csv", {
    message: "Only CSV files are allowed",
  }),
  defaultRole: z.enum(["MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
})

type CSVImportFormValues = z.infer<typeof csvImportSchema>

export function CSVImportForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { processCSVInvites } = useAuth()

  const form = useForm<CSVImportFormValues>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      defaultRole: "EMPLOYEE",
    },
  })

  async function onSubmit(data: CSVImportFormValues) {
    setIsLoading(true)
    try {
      const result = await processCSVInvites(data.file, data.defaultRole)
      
      toast({
        title: "CSV Import Complete",
        description: `Successfully imported ${result.successful.length} users. ${
          result.failed.length > 0
            ? `${result.failed.length} failed.`
            : ""
        }`,
      })

      if (result.failed.length > 0) {
        console.error("Failed imports:", result.failed)
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">CSV File</Label>
        <Input
          id="file"
          type="file"
          accept=".csv"
          {...form.register("file")}
        />
        {form.formState.errors.file && (
          <p className="text-sm text-red-500">
            {form.formState.errors.file.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultRole">Default Role</Label>
        <select
          id="defaultRole"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("defaultRole")}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>

      <Button type="submit" disabled={isLoading}>
        <Upload className="mr-2 h-4 w-4" />
        {isLoading ? "Importing..." : "Import CSV"}
      </Button>
    </form>
  )
} 