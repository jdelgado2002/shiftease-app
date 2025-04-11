# Next.js Rules

## App Router Conventions
- Use server components by default
- Use client components only when necessary
- Follow the app directory structure
- Use proper file naming conventions
- Implement proper metadata
- Create new files for each component
- Keep components under 50 lines
- Refactor large files when needed

## Server Components
```typescript
// Use async components for data fetching
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

## Client Components
```typescript
'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function ClientComponent() {
  const { toast } = useToast()
  const [state, setState] = useState()

  const handleAction = () => {
    toast({
      title: "Action completed",
      description: "The action was successful",
    })
  }

  return <div>{state}</div>
}
```

## Data Fetching
- Use @tanstack/react-query for client-side data
- Use fetch with proper caching for server components
- Implement proper loading states
- Use toasts for important events
- Let errors bubble up

## Routing
- Use proper route groups
- Implement dynamic routes correctly
- Use proper route handlers
- Follow Next.js 15 conventions

## File Pattern
app/**/*.tsx,app/**/*.ts 