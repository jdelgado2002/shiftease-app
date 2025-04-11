# Styling Rules

## Tailwind CSS Guidelines
- Use Tailwind CSS for all styling
- Use shadcn/ui components as base
- Maintain dark mode compatibility
- Use responsive design patterns
- Keep consistent spacing
- Use container class for layout
- Implement proper hover states
- Use proper focus states

## Color Scheme
```typescript
// Primary color: emerald-600
// Text colors:
// - Light: text-gray-900
// - Dark: text-gray-100
// - Muted: text-gray-500
// - Dark muted: text-gray-400
```

## Responsive Design
```typescript
// Mobile-first approach
<div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
  <div className="w-full md:w-1/2">Content</div>
  <div className="w-full md:w-1/2">Content</div>
</div>
```

## Component Styling
```typescript
import { cn } from '@/lib/utils'

export function Component({ className }: { className?: string }) {
  return (
    <div className={cn(
      'flex flex-col space-y-4',
      'bg-white dark:bg-gray-800',
      'rounded-lg shadow',
      className
    )}>
      {/* component content */}
    </div>
  )
}
```

## File Pattern
*.tsx,*.ts,*.css 