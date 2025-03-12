import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Import our components
import ManuscriptBrowser from './components/ManuscriptBrowser';
import ManuscriptDetails from './components/ManuscriptDetails';
import Header from './components/Header';

// Create RTL cache for Arabic text support
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// Create a theme with RTL support
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Amiri, Arial, sans-serif',
    fontSize: 16, // Base font size in pixels (1rem = 16px by default)
    // Increase the size of all typography variants
    h1: { fontSize: '2.5rem' },
    h2: { fontSize: '2.25rem' },
    h3: { fontSize: '2rem' },
    h4: { fontSize: '1.75rem' },
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.35rem' },
    subtitle1: { fontSize: '1.25rem' },
    subtitle2: { fontSize: '1.25rem' },
    body1: { fontSize: '1.25rem' },
    body2: { fontSize: '1.25rem' },
    button: { fontSize: '1.25rem' },
    caption: { fontSize: '1.15rem' },
    overline: { fontSize: '1.15rem' }
  },
  palette: {
    primary: {
      main: '#7B5D38', // Brown color theme appropriate for manuscript collection
    },
    secondary: {
      main: '#A98E53', // Complementary gold color
    },
    background: {
      default: '#F8F5F0', // Light parchment color
    },
  },
  // Add these overrides to increase font size in table cells and chips
  overrides: {
    MuiTableCell: {
      root: {
        fontSize: '1.25rem',
        padding: '16px 24px'
      },
      head: {
        fontSize: '1.25rem',
        fontWeight: 'bold'
      }
    },
    MuiChip: {
      label: {
        fontSize: '1.15rem'
      }
    },
    MuiListItemText: {
      primary: {
        fontSize: '1.25rem'
      },
      secondary: {
        fontSize: '1.15rem'
      }
    }
  }
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App" dir="rtl">
            <Header />
            <Routes>
              <Route path="/" element={<ManuscriptBrowser />} />
              <Route path="/manuscript/:id" element={<ManuscriptDetails />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;