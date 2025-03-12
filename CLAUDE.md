# Development Guidelines

## Project Structure
- This game is stored in its own dedicated repository
- All game files are stored directly in the root directory (no subdirectories)

## Running the App
- **Local**: Open `index.html` directly in a browser
- **Live Demo**: https://porterbrough.github.io/isaacpong/
- For local development with live reload, consider using a tool like `live-server`

## Git Workflow
- Always pull changes before making edits: `git pull origin master`
- Do not commit and push changes by default
- Ask when it would be a good time to publish changes
- When publishing: `git add . && git commit -m "Description of changes" && git push origin master`
- Push to the `master` branch automatically deploys to GitHub Pages

## Deployment
- The site is published at: https://porterbrough.github.io/isaacpong/

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