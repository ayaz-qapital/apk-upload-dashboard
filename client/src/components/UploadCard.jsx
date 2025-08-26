import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Card, CardContent, Typography, LinearProgress, Button, Stack, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { uploadApkViaCloudinary } from '../api';

export default function UploadCard({ onUploaded }) {
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setError('');
    setLastResult(null);
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('Only .apk files are supported in this version.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadApkViaCloudinary(file, (progress) => {
        setProgress(progress);
      });
      setLastResult(res.data);
      onUploaded?.(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const copy = async () => {
    if (lastResult?.app_url) {
      await navigator.clipboard.writeText(lastResult.app_url);
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 6,
            textAlign: 'center',
            bgcolor: isDragActive ? 'action.hover' : 'background.default',
            cursor: 'pointer'
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {isDragActive ? 'Drop the APK here...' : 'Drag & drop APK here, or click to browse'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your file will be uploaded to BrowserStack securely via the server.
          </Typography>
        </Box>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Uploading... {progress}%
            </Typography>
          </Box>
        )}

        {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}

        {lastResult?.app_url && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
            <Alert severity="success" sx={{ flex: 1 }}>
              Uploaded! app_url: {lastResult.app_url}
            </Alert>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy}>
              Copy
            </Button>
            <Button variant="contained" endIcon={<OpenInNewIcon />} href={lastResult.app_url} target="_blank">
              Open
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
