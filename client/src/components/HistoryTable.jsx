import { useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function HistoryTable({ refreshKey }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchHistory().then(res => setRows(res.data)).catch(() => {});
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
                <TableRow key={r.id} hover>
                  <TableCell>{r.fileName}</TableCell>
                  <TableCell>{(r.size / (1024 * 1024)).toFixed(2)} MB</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.app_url} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Copy app_url">
                      <IconButton onClick={() => navigator.clipboard.writeText(r.app_url)}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open app_url">
                      <IconButton component="a" href={r.app_url} target="_blank" rel="noreferrer">
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
