# Majra - Real-Time React Smart Drainage Network Monitoring

A modern, responsive web application for monitoring drainage networks in real-time.

## Features

- Real-time monitoring of drainage system status
- Interactive map with sensor nodes and pipe connections
- Dynamic risk assessment visualization
- Automatic optimization suggestions
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Mapbox account and access token

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Mapbox access token:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

- React
- TypeScript
- Vite
- React Map GL
- Framer Motion
- Emotion (styled-components)
- Material-UI

## Project Structure

```
src/
  ├── components/     # React components
  ├── styles/        # Global styles and theme
  ├── types/         # TypeScript type definitions
  ├── utils/         # Utility functions
  └── App.tsx        # Main application component
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
