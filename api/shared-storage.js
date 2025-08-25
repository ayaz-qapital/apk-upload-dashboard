const fs = require('fs');
const path = require('path');

// Shared upload history storage using temporary file
const historyFile = '/tmp/upload-history.json';
let uploadHistory = [];

// Load history from file on module initialization
function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      uploadHistory = JSON.parse(data);
    }
  } catch (error) {
    console.log('No existing history file found, starting fresh');
    uploadHistory = [];
  }
}

// Save history to file
function saveHistory() {
  try {
    fs.writeFileSync(historyFile, JSON.stringify(uploadHistory));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

// Get all upload history
function getHistory() {
  loadHistory(); // Refresh from file
  return uploadHistory;
}

// Add new upload record
function addRecord(record) {
  loadHistory(); // Refresh from file
  uploadHistory.unshift(record);
  saveHistory();
}

// Delete record by ID
function deleteRecord(id) {
  loadHistory(); // Refresh from file
  const recordId = parseInt(id);
  uploadHistory = uploadHistory.filter(record => record.id !== recordId);
  saveHistory();
  return true;
}

module.exports = {
  getHistory,
  addRecord,
  deleteRecord
};
