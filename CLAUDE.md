# Development Guidelines

## Project Structure
- This game is located in the `isaac/` directory of the main repository
- All game files are stored directly in this directory (no subdirectories)

## Running the App
- **Local**: Open `index.html` directly in a browser
- **Live Demo**: https://porterbrough.github.io/porter-pong/isaac/
- For local development with live reload, consider using a tool like `live-server`

## Git Workflow
- Always pull changes before making edits: `git pull origin main`
- After making changes: `git add . && git commit -m "Description of changes" && git push origin main`
- Push to the `main` branch automatically deploys to GitHub Pages

## Deployment
- The site is published at: https://porterbrough.github.io/porter-pong/isaac/

## Code Style
- **JavaScript**: Use ES6+ features, consistent indentation (2 spaces)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error Handling**: Use try/catch for async operations, properly handle Promise rejections
- **Comments**: Include comments for complex logic, but prefer self-documenting code
- **Organization**: Group related functions together, keep files modular and focused
- **Formatting**: Use consistent spacing around operators, semicolons at end of statements
- **DOM Operations**: Cache DOM elements in variables for better performance
- **Event Handling**: Use event delegation where applicable
- **State Management**: Keep game state in clearly defined objects
- **Animations**: Prefer requestAnimationFrame for smooth animations

## Best Practices
- Write defensive code that handles edge cases
- Validate user input when applicable
- Avoid global variables, prefer module patterns
- Use semantic HTML elements
- Follow responsive design principles