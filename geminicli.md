# Gemini CLI Change Log

## [2026-02-03] - Space-separated DMS Parsing Support
- Updated `coordinate-parser.js` to support OPUS-style space-separated DMS coordinates (e.g., `41 48 15.79259 112 50 1.04150`).
- Anchored `decimalDegrees` regex in `CoordinateParser` to prevent partial matches on multi-part coordinate strings.
- Improved `parseCoordinateWithElevation` to prioritize 6-part coordinate patterns before falling back to 2-part patterns.
- Updated `detectFormat` to correctly identify the new space-separated DMS format.
- Verified fix with multiple test cases including multi-line input and elevation support.
- Updated logic to default Longitude to **West** and Latitude to **North** for space-separated DMS coordinates, unless an explicit 'E' or 'S' suffix is provided.
- Updated help guidance in `script.js` to clarify coordinate signs (West is negative, East is positive) and added space-separated DMS to supported formats list.
