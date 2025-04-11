# AI Assistant Rules

## General Guidelines
- Always stay up-to-date with the latest technologies and best practices
- Use MDX format for responses when appropriate
- Default to Next.js App Router unless specified otherwise
- Implement accessibility best practices
- Use semantic HTML elements and correct ARIA roles/attributes
- Use "sr-only" Tailwind class for screen reader only text

## Code Project Structure
- Use <CodeProject> to group related files
- Keep components under 50 lines
- Create new files for each component
- Use kebab-case for file names
- Follow existing directory structure
- Refactor large files when needed

## Styling Guidelines
- Use shadcn/ui components by default
- Use Tailwind CSS for styling
- Use built-in Tailwind CSS variable-based colors
- Avoid indigo/blue colors unless specified
- Generate responsive designs
- Set dark mode class manually when needed
- Use proper className handling

## Image and Media
- Use `/placeholder.svg?height={height}&width={width}` for placeholder images
- Use icons from "lucide-react" package
- Set crossOrigin to "anonymous" for `new Image()` on canvas
- Add alt text for all images unless decorative
- Use proper image optimization techniques

## Code Formatting
- Use `import type` for type imports
- Provide default props for React Components
- Use proper TypeScript types
- Follow consistent code style
- Use proper error handling
- Implement proper data fetching patterns

## Server Actions
- Use 'use server' directive
- Implement proper error handling
- Use proper revalidation patterns
- Follow data mutation patterns
- Use proper form handling
- Implement proper validation

## Documentation
- Keep documentation clear and concise
- Use proper markdown formatting
- Include code examples
- Update documentation with code changes
- Follow README structure guidelines
- Include proper code comments

## GitHub Practices
- Use conventional commits
- Create small, focused PRs
- Include clear descriptions
- Reference related issues
- Include screenshots for UI changes
- Follow branch naming conventions

## File Pattern
*.ts,*.tsx,*.js,*.jsx,*.md,*.css,*.json,*.env,*.gitignore

## Accessibility
- Use semantic HTML elements
- Implement proper ARIA roles/attributes
- Use "sr-only" for screen reader text
- Ensure proper color contrast
- Implement keyboard navigation
- Use proper focus management

## Error Handling
- Implement proper error boundaries
- Use toast notifications for important events
- Provide clear error messages
- Handle edge cases gracefully
- Implement proper validation
- Use proper logging

## Performance
- Optimize images and assets
- Implement proper caching
- Use proper code splitting
- Optimize bundle size
- Implement proper lazy loading
- Use proper memoization

## Security
- Implement proper authentication
- Use proper authorization
- Handle sensitive data properly
- Use proper encryption
- Implement proper CORS
- Use proper environment variables 