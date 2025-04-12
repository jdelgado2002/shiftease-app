# TypeScript Rules

## General Guidelines
- Use TypeScript for all files
- Prefer interfaces for object types
- Use type aliases for union types
- Use enums for constants
- Always provide type annotations
- Use strict null checks
- DO NOT catch errors unless specifically requested
- Let errors bubble up for proper handling

## Component Types
```typescript
import { type FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  // other props
}

export const Component: FC<ComponentProps> = ({ className, ...props }) => {
  return (
    <div className={className}>
      {/* component content */}
    </div>
  )
}
```

## Data Fetching
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
  meta: {
    onError: (error) => {
      console.error('Query error:', error)
    }
  }
})
```

## File Pattern
*.ts,*.tsx 