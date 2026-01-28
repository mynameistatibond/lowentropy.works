# CI/CD Strategy Proposal

## Context
**Project Type**: Static Website (HTML/CSS/JS/Python Assets)
**Current Workflow**: Local testing via `python -m http.server` → Git Commit → Manual Push to Main.
**Volume**: ~700 files, ~66MB (likely media-heavy).

## Recommended Approach: GitHub Actions + GitHub Pages

Since the site is purely static (no build engine like React/Next.js/Webpack), the most robust and "low entropy" approach is **GitHub Pages** served via **GitHub Actions**.

### Why this approach?
1.  **Zero Maintenance**: No servers to patch (unlike AWS EC2 or DigitalOcean Droplets).
2.  **Free Tier**: Generous limits for public/private repos.
3.  **Atomic Deploys**: Deployment only happens if all checks pass.
4.  **Version Control**: Your `main` branch is always the source of truth.

---

## Proposed Pipeline Steps

### 1. Continuous Integration (CI) - On Pull Request
*Checks that run when you try to merge changes.*

-   **Link Checker (HTMLProofer)**: Scans all HTML files to ensure no internal links are broken (404s).
    -   *Why*: Critical for static sites where file moves (like the recent URL refactor) commonly break links.
-   **HTML/CSS Validation (Optional)**: Basic syntax checking to catch unclosed tags or invalid CSS.

### 2. Continuous Deployment (CD) - On Push to Main
*Actions that run when code lands in the main branch.*

-   **Deploy to GitHub Pages**: Automatically uploads the repository content to the `gh-pages` environment.
-   **Slack/Email Notification (Optional)**: "Deployment Successful" alert.

---

## Implementation Outline (Draft)

To implement this, we would add a workflow file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Reliability Check
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      # Example: Check for broken links
      # - name: Check Links
      #   uses: chabad360/htmlproofer@master
      #   with:
      #     directory: "./"
      #     arguments: --assume-extension --disable-external

  # Deployment
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Next Steps
1.  **Enable GitHub Pages**: Go to Repo Settings > Pages > Build and deployment > Source: GitHub Actions.
2.  **Add Workflow**: Commit the file above to `.github/workflows/deploy.yml`.
3.  **Fix Links**: The first run will likely fail if we enable the Link Checker immediately (strict mode). We can tune this gradually.
