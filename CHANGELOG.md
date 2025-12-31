# Changelog

All notable changes to the **Low Entropy Works** project will be documented in this file.

## [v1.3.0] - 2025-12-31

### Refactored
- **Clean URLs**: Restructured the entire site to use folder-based URLs (e.g., `/pages/about/` instead of `about.html`).
    - Moved all user-facing pages into dedicated directories with `index.html`.
    - Removed `.html` extensions from all internal links.
    - Updated asset paths to `../../assets/` to accommodate deeper nesting.
- **Templates**: Moved template files to `/templates/` directory for better organization.

### Changed
- **Home (`/index.html`)**:
    - **Alice Image Transition**: Implemented "Phase-Shifted Opacity" to eliminate ghosting outlines during theme switches.
        - **Logic**: Incoming image waits (`1s` delay) for the background (`2s` fade) to settle before appearing. Outgoing image vanishing immediately.
        - **Timing**: Base fade `0.8s`, Incoming Delay `1s`.
- **Bug Fixes**: Corrected broken relative paths in `lab`, `case-studies`, and `conversational-ai` pages that were caused by the directory move.

### Added
- **Page (`/pages/fraud-detection-framing/`)**: Created shell for "Claim Fraud Detection (ML): Framing Report" based on the article template.
- **Documentation**: Added design system notes to `README.md` regarding the role of `article-template`.

### Added
- **Global**: Created this `CHANGELOG.md` to track project history.
- **Content**: Added "Insurance Fraud Detection — End-to-End ML Decision App (Live)" to `pages/case_studies.html`.
- **Assets**: Added theme-aware Alice images to Home page.

### Changed
- **Page: Home (`/index.html`)**:
    - **Theme Transitions**: Implemented seamless 2-second cross-fade for Alice images and synced all button color transitions (`.pill-button`) to match the global theme fade.
    - **Visual Alignment**:
        - Shifted Alice image (`translateX(-12px)`) for optical center.
        - Tuned floating dots position (`73.5%`) and z-index (`100`) to align with the action button and float above images.
    - **Navigation**:
        - Reordered "Now Exploring" list (Newest/2025-12 first).
        - Renamed top item to "⟡ Claim Fraud Detection (ML): End-to-End ML Decision App (Live)".
    - **Action**: Updated "down the rabbit hole →" button style and text.

- **Page: Low-Entropy Lab (`/pages/lab.html`)**:
    - **Header**: Updated subheader text and instruction line.
    - **Layout**: Scaled monitor wall to 66% width with responsive centering (`5vw` offset).
    - **Visuals**: Added deep ambient occlusion shadows and "LIVE" status pulse.
    - **Transitions**: Synced background color transition to `2s`.

- **Page: Fraud Detector (`/pages/fraud_detector.html`)**:
    - **Footer**: Enforced custom "Dark Mode" footer.

- **Global Styles**:
    - **Transitions**: Standardized all theme transitions (Buttons, Backgrounds, Noise Opacity) to `2s ease`.
    - **Header**: Refined padding and link sizes.
