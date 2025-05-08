# Storybook

This project uses [Storybook](https://storybook.js.org/) for UI component development and documentation.

## Running Storybook

To run Storybook locally:

```bash
npm run storybook
```

This will start Storybook on port 6006. You can access it at [http://localhost:6006](http://localhost:6006).

## Creating Stories

Stories are placed alongside their components with the naming convention `[component-name].stories.tsx`. 

For example:
- `src/components/ui/button.tsx` - Component
- `src/components/ui/button.stories.tsx` - Story for the component

## Deployment

### Chromatic Deployment

This project is configured to automatically deploy Storybook to [Chromatic](https://www.chromatic.com/) when code is pushed to the main branch or when a pull request is created.

#### Required Secrets

For Chromatic deployment to work, the following secret needs to be set in your GitHub repository:

- `CHROMATIC_PROJECT_TOKEN`: Your Chromatic project token

### GitHub Pages Deployment

This project also deploys Storybook to GitHub Pages when code is pushed to the main branch or when the workflow is manually triggered. The deployment includes cross-origin isolation support, which enables advanced features like SharedArrayBuffer.

#### Testing Cross-Origin Isolation

After deployment, you can verify that cross-origin isolation is working by:

1. Navigate to your GitHub Pages URL
2. Append `/coi-check.html` to the URL (e.g., `https://yourusername.github.io/your-repo/coi-check.html`)
3. The diagnostic page will show if:
   - Cross-origin isolation is enabled
   - SharedArrayBuffer is available
   - The service worker is registered correctly

#### How Cross-Origin Isolation Works

This deployment uses a service worker approach for cross-origin isolation:

1. A service worker (`coi-serviceworker.js`) adds the required headers:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`

2. The service worker intercepts responses and adds these headers

3. This ensures SharedArrayBuffer is available for advanced features

## Testing

Storybook is also configured with the Test addon. You can run component tests with:

```bash
npx vitest --project=storybook
```

## Documentation

The Storybook setup includes autodocs for automatic documentation generation. 