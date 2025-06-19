import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Globe from './components/Globe';
import LocationModal from './components/LocationModal';
import SearchBar from './components/SearchBar';

const theme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#1A73E8',
    },
    secondary: {
      main: '#34A853',
    },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
});

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gray-900 text-white">
        <SearchBar />
        <Globe onLocationSelect={setSelectedLocation} />
        {selectedLocation && (
          <LocationModal 
            location={selectedLocation} 
            onClose={() => setSelectedLocation(null)} 
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
