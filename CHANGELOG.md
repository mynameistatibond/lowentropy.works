# Changelog

All notable changes to the **Low Entropy Works** project will be documented in this file.

## [Unreleased] - 2025-12-30

### Added
- **Global**: Created this `CHANGELOG.md` to track project history.

### Changed
- **Page: Low-Entropy Lab (`/pages/lab.html`)**:
    - **Header**: Updated subheader text to "【DEPLOYED ML SYSTEMS】 『LIVE』 〈INSPECTABLE〉" with simplified instruction line.
    - **Layout**:
        - Scaled down monitor wall composition to **66% viewport width**.
        - Implemented **responsive centering** with a calculated left offset (`5vw`) to maintain visual balance across desktop and mobile.
        - Fixed header overlap issue by enforcing a fixed `9rem` top margin.
    - **Typography**: Restored technical/uppercase styling for "EACH MONITOR IS AN ENTRY POINT".

- **Page: Fraud Detector (`/pages/fraud_detector.html`)**:
    - **Footer**: Enforced a custom "Dark Mode" footer (Solid Blue background, White text) to match the page aesthetic, distinct from the global footer.

- **Global Styles**:
    - **Footer**: Optimized global footer spacing to remove unnecessary gaps (`margin-top: 0`).
