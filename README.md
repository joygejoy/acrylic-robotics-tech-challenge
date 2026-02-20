# TCW26 Image Transformer

An Electron desktop application for transforming images with color adjustments and resizing capabilities.

## Features

- 🎨 **Color Adjustments**: Hue shift (-180° to +180°) and saturation (0x to 3x)
- 📐 **Image Resizing**: Resize images with aspect ratio locking
- 💾 **Native File Saving**: Save transformed images using native OS dialogs
- 🖥️ **Cross-Platform**: Works on macOS, Windows, and Linux
- ⚡ **Modern UI**: Built with React and Tailwind CSS
- 🔌 **Backend Integration**: Connects to Python backend for image processing

## Architecture

This is a frontend Electron application that communicates with a separate Python backend for image processing.

```
┌─────────────────────────────────────┐
│   Electron App (Frontend)           │
│  ┌──────────────────────────────┐  │
│  │  React UI                     │  │
│  │  - Upload & Configure         │  │
│  │  - Preview & Results          │  │
│  └──────────────────────────────┘  │
│              ▼                       │
│  ┌──────────────────────────────┐  │
│  │  API Client (imageApi.ts)    │  │
│  │  - Validation                 │  │
│  │  - Error Handling             │  │
│  │  - Health Checks              │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ HTTP POST
               ▼
    ┌─────────────────────────┐
    │  Python Backend         │
    │  (localhost:8000)       │
    │  - Image Processing     │
    │  - Color Transforms     │
    │  - Resize Operations    │
    └─────────────────────────┘
```

## Prerequisites

### Frontend (This Repository)
- Node.js 18 or higher
- npm or yarn

### Backend (Separate Repository)
- Python 3.8 or higher
- See [Backend Setup Guide](./docs/BACKEND_SETUP.md)

## Installation

### Frontend Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd TCW26-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development mode:**
```bash
npm run dev
```

### Backend Setup

The application requires a Python backend to function. See the [Backend Setup Guide](./docs/BACKEND_SETUP.md) for detailed instructions.

**Quick Backend Start (if you have it):**
```bash
cd ../backend  # Navigate to your backend directory
python app.py  # Start the backend server
```

The backend should run on `http://localhost:8000`.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Preview the production build
- `npm run dist` - Package the app for distribution
- `npm run dist:mac` - Package for macOS
- `npm run dist:win` - Package for Windows
- `npm run dist:linux` - Package for Linux (AppImage, deb, rpm)
- `npm run dist:all` - Package for Windows and Linux (run `dist:mac` on a Mac for macOS)

### Releases (Download for All OS)

Builds for **Windows**, **macOS**, and **Linux** are produced via GitHub Actions:

1. **Add repository secrets** (Settings → Secrets and variables → Actions):
   - `VITE_API_BASE_URL_LATEST` – your Vercel backend URL
   - `VITE_API_BASE_URL_PINNED` – your pinned backend URL (can match LATEST)

2. **To create a release:** Push a version tag, e.g. `git tag v1.0.0 && git push origin v1.0.0`. The workflow builds for all platforms and publishes to Releases.

3. **Manual build:** Run the "Build and Release" workflow from the Actions tab. Download `build-win`, `build-mac`, and `build-linux` artifacts.

### Project Structure

```
TCW26-frontend/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main process entry point
│   │   └── preload.ts     # Preload scripts (IPC)
│   └── renderer/          # React app (renderer process)
│       ├── api/
│       │   └── imageApi.ts    # API client
│       ├── components/
│       │   ├── UploadTab.tsx  # Upload & configuration UI
│       │   └── ResultTab.tsx  # Results & download UI
│       ├── App.tsx        # Main app component
│       ├── main.tsx       # React entry point
│       └── index.css      # Global styles
├── docs/                  # Documentation
│   ├── API_CONTRACT.md    # Backend API specification
│   └── BACKEND_SETUP.md   # Backend development guide
├── electron-builder.yml   # Electron Builder config
├── electron.vite.config.ts # Vite config
└── package.json
```

## Backend Integration

### API Contract

The frontend expects the backend to implement the following endpoints:

- `GET /health` - Health check endpoint
- `POST /transform` - Image transformation endpoint

See the [API Contract Documentation](./docs/API_CONTRACT.md) for detailed specifications.

### Connection Status

The app displays the backend connection status in the UI:
- 🟢 **Green**: Backend is online and ready
- 🟡 **Yellow**: Backend is not reachable

The health check runs automatically on app startup.

### Error Handling

The frontend includes comprehensive error handling:
- File validation (size, format)
- Network timeout handling
- User-friendly error messages
- Connection retry capability

## Building for Production

### Development Build
```bash
npm run build
npm run start
```

### Distribution Package

**For current platform:**
```bash
npm run dist
```

**For specific platforms:**
```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
```

Built applications will be in the `dist/` directory.

## Features in Detail

### Upload & Configure

- Drag-and-drop or click to upload images
- Supported formats: PNG, JPEG, WebP, GIF
- Maximum file size: 50MB
- Real-time preview

### Color Adjustments

- **Hue Shift**: Rotate colors around the color wheel (-180° to +180°)
- **Saturation**: Adjust color intensity (0x = grayscale, 3x = maximum)

### Resize

- Specify exact dimensions in pixels
- Optional aspect ratio locking
- Maximum dimensions: 10,000 × 10,000 pixels
- High-quality resampling (backend uses Lanczos)

### Save Results

- Native OS save dialog
- Preserves image format
- Original filename suggested

## Troubleshooting

### Cannot Connect to Backend

**Problem:** Yellow status indicator showing "Backend is not reachable"

**Solutions:**
1. Ensure the Python backend is running on `http://localhost:8000`
2. Check backend console for errors
3. Verify CORS is configured correctly in the backend
4. Click "Retry connection" in the UI

### Request Timeout

**Problem:** "Request timed out" error

**Solutions:**
1. Image may be too large - try smaller dimensions
2. Backend may be slow - check backend performance
3. Increase timeout in `imageApi.ts` if needed

### Invalid Image Format

**Problem:** "Unsupported image format" error

**Solutions:**
1. Ensure image is PNG, JPEG, WebP, or GIF
2. Try converting image to supported format
3. Check file is not corrupted

## Technology Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Electron Builder** - Package and distribute

## Documentation

- [API Contract](./docs/API_CONTRACT.md) - Backend API specification
- [Backend Setup](./docs/BACKEND_SETUP.md) - Backend development guide

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including with real backend)
5. Submit a pull request

## Support

For backend-related issues, refer to the backend repository and documentation.

For frontend issues, please create an issue in this repository.

