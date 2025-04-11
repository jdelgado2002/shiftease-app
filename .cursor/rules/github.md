# GitHub Rules

## Repository Structure
- Keep the repository organized and clean
- Follow the existing directory structure
- Create new files for each component
- Keep components under 50 lines
- Refactor large files when needed

## Branch Management
```bash
# Create feature branch
git checkout -b feature/feature-name

# Create bugfix branch
git checkout -b fix/bug-name

# Create documentation branch
git checkout -b docs/topic-name
```

## Commit Messages
```bash
# Use conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
git commit -m "style: format code"
git commit -m "refactor: improve code structure"
git commit -m "test: add tests"
git commit -m "chore: update dependencies"
```

## Pull Requests
- Create small, focused PRs
- Include clear descriptions
- Reference related issues
- Include screenshots for UI changes
- Update documentation
- Follow the existing code style
- Keep components under 50 lines
- Create new files for each component

## Code Review
- Review for security issues
- Check for performance impacts
- Ensure accessibility compliance
- Verify responsive design
- Check component size limits
- Verify proper error handling
- Check for proper toast usage
- Verify proper data fetching

## File Pattern
.gitignore,.github/**/*,*.md 