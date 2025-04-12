# Server Actions Rules

## General Guidelines
- Keep server actions in app/actions.ts
- Use proper validation
- Use proper typing
- Follow security best practices
- Let errors bubble up
- Use toasts for important events

## Action Structure
```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  email: z.string().email(),
  companyName: z.string().min(1),
  locationCount: z.number().min(1),
})

export async function action(formData: FormData) {
  // Validate input
  const validatedData = schema.parse({
    email: formData.get('email'),
    companyName: formData.get('companyName'),
    locationCount: Number(formData.get('locationCount')),
  })

  // Process data
  const result = await processData(validatedData)

  // Revalidate paths if needed
  revalidatePath('/')

  return { success: true, data: result }
}
```

## Data Mutations
```typescript
'use server'

import { useQuery } from '@tanstack/react-query'

export async function mutateData(data: unknown) {
  // Process data
  const result = await processData(data)

  // Revalidate paths if needed
  revalidatePath('/')

  return result
}
```

## Email Handling
- Use proper email templates
- Implement proper error handling
- Use environment variables
- Follow email best practices
- Implement rate limiting

## Security
- Validate all input
- Sanitize data
- Use proper authentication
- Implement proper authorization
- Follow security best practices

## File Pattern
app/actions.ts 