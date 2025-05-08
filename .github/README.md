# GitHub Workflows

This directory contains GitHub Actions workflows for automated deployments.

## Chromatic Deployment

The `chromatic.yml` workflow automatically deploys Storybook to Chromatic when code is pushed to the main branch or when a pull request is created.

### Required Secrets

For Chromatic deployment to work, the following secret needs to be set in your GitHub repository:

- `CHROMATIC_PROJECT_TOKEN`: Your Chromatic project token

## Vercel Deployment

The `vercel-deploy.yml` workflow automatically deploys the application to Vercel after running tests. It creates preview deployments for pull requests and production deployments for pushes to the main branch.

### Required Secrets

For Vercel deployment to work, the following secrets need to be set in your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Setup Instructions

1. Create the secrets in your GitHub repository settings.
2. For Vercel, make sure your project is set up in the Vercel dashboard.
3. For Chromatic, create a project and obtain your project token. 