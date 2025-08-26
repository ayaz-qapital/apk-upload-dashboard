import { CssBaseline, Container, Typography, Box, createTheme, ThemeProvider } from '@mui/material';
import UploadCard from './components/UploadCard';
import HistoryTable from './components/HistoryTable';
import ErrorBoundary from './components/ErrorBoundary';
import { useState, useMemo } from 'react';

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#4fd1c5' } },
  shape: { borderRadius: 12 }
});

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const onUploaded = () => setRefreshKey(k => k + 1);

  const header = useMemo(() => (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
        APK Upload Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Upload APKs to BrowserStack and get an app_url.
      </Typography>
    </Box>
  ), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Container maxWidth="md" sx={{ py: 6 }}>
          {header}
          <UploadCard onUploaded={onUploaded} />
          <HistoryTable refreshKey={refreshKey} />
        </Container>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
