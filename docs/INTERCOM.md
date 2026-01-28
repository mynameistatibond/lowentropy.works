# Intercom Messenger Setup

This project uses Intercom Messenger for visitor communication.

## Configuration
The Intercom initialization script is located at:
`assets/js/intercom.js`

**App ID**: `ob9tvmfi`

## Installation
The script is included in all HTML pages via a script tag pointing to `assets/js/intercom.js`.

### Adding to new pages
To add Intercom to a new page, include the script reference before the closing `</body>` tag (adjusting the path depth as needed):

```html
<script src="/assets/js/intercom.js"></script>
```

## Features
- **Anonymous Users**: The current setup supports anonymous visitors (no login required).
- **Persistence**: Conversations are saved via browser cookies.
