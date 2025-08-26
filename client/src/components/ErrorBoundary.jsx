import React from 'react';
import { Alert, Button, Container, Typography, Box } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
