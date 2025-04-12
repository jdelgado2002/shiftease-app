# Component Rules

## General Guidelines
- Create new files for each component
- Keep components under 50 lines
- Use shadcn/ui components as base
- Implement proper accessibility
- Use proper component variants
- Maintain consistent props
- Use toasts for important events
- Let errors bubble up

## Component Structure
```typescript
import { type FC } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface ComponentProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Component: FC<ComponentProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const { toast } = useToast()

  const handleAction = () => {
    toast({
      title: "Action completed",
      description: "The action was successful",
    })
  }

  return (
    <div
      className={cn(
        'base-classes',
        {
          'variant-classes': variant === 'variant',
          'size-classes': size === 'size',
        },
        className
      )}
      {...props}
    />
  )
}
```

## Form Components
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export function FormComponent() {
  const { toast } = useToast()
  const form = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await submitData(data)
      toast({
        title: "Success",
        description: "Form submitted successfully",
      })
    } catch (error) {
      // Let error bubble up
      throw error
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

## Accessibility
- Use proper ARIA labels
- Implement keyboard navigation
- Use proper focus management
- Follow WCAG guidelines
- Test with screen readers

## File Pattern
components/**/*.tsx 