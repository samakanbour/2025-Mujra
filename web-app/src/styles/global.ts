import { css } from '@emotion/react';

export const colors = {
  primary: '#2196F3',
  statusGood: '#4CAF50',
  statusWarning: '#FF9800',
  statusCritical: '#F44336',
  background: '#f5f5f7',
  textPrimary: '#333333',
  textSecondary: '#666666'
};

export const GlobalStyle = css`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${colors.background};
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
  }

  .mapboxgl-canvas {
    border-radius: 12px;
    width: 100% !important;
    height: 100% !important;
  }

  .mapboxgl-map {
    width: 100%;
    height: 100%;
  }

  .mapboxgl-control-container {
    position: absolute;
    right: 10px;
    bottom: 10px;
  }
`;