import { useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { SafeText } from './SafeComponent';

export default function HistoryTable({ refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchHistory()
      .then(res => {
        if (Array.isArray(res.data)) {
          setRows(res.data);
        } else {
          console.error('History response is not an array:', res.data);
          setRows([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch history:', err);
        setRows([]);
      });
  }, [refreshKey]);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Upload History</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>app_url</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id || Math.random()} hover>
                  <TableCell><SafeText value={r.fileName} /></TableCell>
                  <TableCell><SafeText value={r.size ? (r.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'} /></TableCell>
                  <TableCell><SafeText value={r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Unknown'} /></TableCell>
                  <TableCell>
                    <Chip size="small" label={<SafeText value={r.app_url} />} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy app_url">
                      <IconButton 
                        onClick={() => r.app_url && navigator.clipboard.writeText(String(r.app_url))}
                        disabled={!r.app_url}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open app_url">
                      <IconButton 
                        component="a" 
                        href={r.app_url ? String(r.app_url) : '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        disabled={!r.app_url}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5}>No uploads yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
