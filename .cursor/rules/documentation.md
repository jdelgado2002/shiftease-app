# Documentation Rules

## General Guidelines
- Keep documentation clear and concise
- Use proper markdown formatting
- Include code examples
- Update documentation with code changes
- Keep documentation up to date

## README Structure
```markdown
# Project Name

## Description
Clear and concise project description

## Features
- List of key features
- Use emojis for better readability
- Keep it focused and relevant

## Tech Stack
- List of technologies used
- Version numbers
- Key dependencies

## Getting Started
Clear installation and setup instructions

## Project Structure
Directory structure with descriptions

## Available Scripts
List of npm/pnpm scripts

## Contributing
Guidelines for contributors

## License
Project license information
```

## Code Documentation
```typescript
/**
 * Component description
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function Component(props: ComponentProps) {
  // implementation
}
```

## API Documentation
```typescript
/**
 * API endpoint description
 * 
 * @param data - Request data
 * @returns Promise<Response>
 */
export async function apiEndpoint(data: RequestData) {
  // implementation
}
```

## File Pattern
*.md,README.md,docs/**/* 