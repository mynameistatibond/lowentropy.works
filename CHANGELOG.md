# Changelog

All notable changes to the **Low Entropy Works** project will be documented in this file.

## [v1.2.0] - 2025-12-30

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
