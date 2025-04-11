# ShiftEase Copilot Instructions

## 🎯 Project Overview
ShiftEase is an AI-powered scheduling solution for multi-unit restaurants. The project is built with Next.js 15, TypeScript, and Tailwind CSS, featuring a modern, responsive landing page with a waitlist signup form.

## 🛠️ Tech Stack Guidelines

### Next.js & React
- Use Next.js 15 App Router conventions
- Implement server components by default
- Use client components only when necessary (interactivity, browser APIs)
- Follow React 19 best practices
- Use TypeScript for all components and utilities

### Styling
- Use Tailwind CSS for all styling
- Follow the existing color scheme (emerald-600 as primary color)
- Maintain dark mode compatibility
- Use responsive design patterns (mobile-first approach)
- Keep consistent spacing using the container class

### Components
- Use Radix UI components as the base
- Follow the existing component structure in `/components/ui`
- Maintain consistent component naming (PascalCase)
- Keep components focused and single-responsibility
- Document complex components with JSDoc comments

### Form Handling
- Use React Hook Form for form management
- Implement Zod for form validation
- Follow the existing form patterns in `WaitlistForm`
- Ensure proper error handling and user feedback

### Server Actions
- Keep server actions in the `app/actions.ts` file
- Use proper error handling and validation
- Implement proper type safety
- Follow the existing pattern for email notifications

## 📝 Code Style Guidelines

### TypeScript
```typescript
// Use interfaces for object types
interface User {
  id: string;
  name: string;
}

// Use type aliases for union types
type Status = 'pending' | 'completed' | 'failed';

// Use enums for constants
enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
}
```

### Component Structure
```typescript
// Use proper component organization
import { type FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  // other props
}

export const Component: FC<ComponentProps> = ({ className, ...props }) => {
  return (
    <div className={cn('base-classes', className)}>
      {/* component content */}
    </div>
  )
}
```

### Styling Conventions
```typescript
// Use Tailwind classes consistently
<div className="flex flex-col space-y-4">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
    Title
  </h2>
  <p className="text-gray-500 dark:text-gray-400">
    Content
  </p>
</div>
```

## 🔒 Security Guidelines

### Environment Variables
- Use proper environment variable naming
- Never commit sensitive data
- Use NEXT_PUBLIC_ prefix only for client-side variables
- Validate environment variables at startup

### API Security
- Implement proper rate limiting
- Validate all user input
- Use proper authentication where needed
- Follow security best practices for email handling

## 🧪 Testing Guidelines

### Component Testing
- Write unit tests for complex components
- Test both light and dark mode
- Test responsive behavior
- Test form validation and submission

### Integration Testing
- Test server actions
- Test email functionality
- Test form submissions
- Test error handling

## 📦 Project Structure

```
shiftease-landing/
├── app/                # Next.js app directory
│   ├── actions.ts      # Server actions
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   ├── ui/            # Radix UI based components
│   └── waitlist-form.tsx # Waitlist form component
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── public/            # Static assets
└── styles/            # Global styles
```

## 🚀 Best Practices

1. **Performance**
   - Optimize images and assets
   - Use proper loading states
   - Implement proper caching
   - Minimize client-side JavaScript

2. **Accessibility**
   - Use semantic HTML
   - Implement proper ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

3. **SEO**
   - Use proper meta tags
   - Implement structured data
   - Optimize page titles
   - Use semantic headings

4. **Maintainability**
   - Write clear documentation
   - Use consistent naming
   - Follow DRY principles
   - Keep components modular

## 🤝 Contributing Guidelines

1. **Code Review**
   - Review for security issues
   - Check for performance impacts
   - Ensure accessibility compliance
   - Verify responsive design

2. **Pull Requests**
   - Include clear descriptions
   - Reference related issues
   - Include screenshots for UI changes
   - Update documentation

3. **Commit Messages**
   - Use conventional commits
   - Be clear and descriptive
   - Reference issue numbers
   - Keep commits focused

## 📞 Support

For any questions or issues:
1. Check the documentation first
2. Search existing issues
3. Create a new issue if needed
4. Contact the maintainers 

# Copilot Instructions

## Code Generation
- Generate code that follows the project's existing patterns and conventions
- Use TypeScript for type safety
- Implement proper error handling and validation
- Follow the project's file structure
- Use existing utility functions and components when available
- Keep functions focused and single-purpose

## Code Completion
- Suggest completions that match the project's style
- Use proper TypeScript types
- Include JSDoc comments for complex functions
- Suggest appropriate error handling
- Use existing patterns from the codebase
- Consider performance implications

## Code Review
- Suggest improvements while maintaining existing patterns
- Point out potential security issues
- Identify performance bottlenecks
- Suggest better TypeScript types
- Recommend proper error handling
- Consider edge cases

## Documentation
- Generate clear and concise comments
- Use JSDoc format for function documentation
- Include examples for complex functions
- Document edge cases and limitations
- Keep documentation up to date
- Use proper markdown formatting

## Testing
- Suggest appropriate test cases
- Include edge cases in test suggestions
- Consider performance testing
- Suggest proper test structure
- Include error case testing
- Consider integration testing

## Refactoring
- Suggest refactoring that improves maintainability
- Keep existing functionality intact
- Improve type safety
- Enhance error handling
- Optimize performance
- Follow SOLID principles

## Debugging
- Suggest appropriate logging
- Help identify root causes
- Suggest proper error messages
- Consider performance impact
- Help with TypeScript errors
- Suggest proper error boundaries

## Performance Optimization
- Suggest code splitting opportunities
- Recommend proper memoization
- Identify unnecessary re-renders
- Suggest proper caching strategies
- Optimize bundle size
- Improve loading performance

## Security
- Identify potential security issues
- Suggest proper authentication
- Recommend proper authorization
- Handle sensitive data properly
- Implement proper CORS
- Use secure coding practices

## Accessibility
- Suggest proper ARIA attributes
- Improve keyboard navigation
- Enhance screen reader support
- Ensure proper color contrast
- Implement proper focus management
- Follow WCAG guidelines

## File Patterns
*.ts,*.tsx,*.js,*.jsx,*.md,*.css,*.json,*.env,*.gitignore

## Best Practices
- Follow DRY (Don't Repeat Yourself) principle
- Implement proper error handling
- Use proper TypeScript types
- Follow existing code patterns
- Consider performance implications
- Maintain code readability

## Integration
- Suggest proper API integration
- Handle API errors properly
- Implement proper data fetching
- Use proper caching strategies
- Consider rate limiting
- Handle network errors

## State Management
- Suggest appropriate state management
- Use proper context patterns
- Implement proper data flow
- Consider performance impact
- Handle state updates properly
- Use proper memoization

## Component Design
- Follow component composition
- Use proper prop types
- Implement proper error boundaries
- Consider reusability
- Follow single responsibility
- Use proper hooks 