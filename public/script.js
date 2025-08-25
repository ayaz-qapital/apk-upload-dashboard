// Global variables
let uploadHistory = [];

// DOM elements
const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('apkFile');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const uploadBtn = document.getElementById('uploadBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsContainer = document.getElementById('resultsContainer');
const totalUploads = document.getElementById('totalUploads');
const successfulUploads = document.getElementById('successfulUploads');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!isAuthenticated()) {
        // Redirect to login page if not authenticated
        window.location.replace('/login');
        return;
    }
    
    setupEventListeners();
    loadHistory();
    setupPasswordChangeModal();
    
    // Set current username in the header
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        document.getElementById('currentUsername').textContent = storedUsername;
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        
        if (!userMenu.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    uploadForm.addEventListener('submit', handleUpload);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    // dropZone.addEventListener('click', () => fileInput.click());
    
    // Initial form validation
    validateForm();
}

function openFilePicker(event) {
    event.stopPropagation();
    fileInput.click();
}


// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.apk')) {
            fileInput.files = files;
            displayFileInfo(file);
        } else {
            showToast('Please select a valid APK file', 'error');
        }
    }
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        displayFileInfo(file);
    }
}

// Display file information
function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
    dropZone.style.display = 'none';
    validateForm();
}

// Remove selected file
function removeFile() {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    dropZone.style.display = 'block';
    validateForm();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate form
function validateForm() {
    const hasFile = fileInput.files.length > 0;
    uploadBtn.disabled = !hasFile;
}

// Handle form submission
async function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('apk', fileInput.files[0]);
    
    // Show progress
    showProgress();
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 401) {
            // User is not authenticated, redirect to login
            clearAuth();
            window.location.href = '/login';
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Store upload record in localStorage for serverless environment
            const storedHistory = localStorage.getItem('uploadHistory');
            let history = storedHistory ? JSON.parse(storedHistory) : [];
            history.unshift(result.data);
            localStorage.setItem('uploadHistory', JSON.stringify(history));
            
            showToast('APK uploaded successfully to BrowserStack!', 'success');
            resetForm();
            loadHistory();
        } else {
            // Store error record as well
            const errorRecord = result.data || {
                id: Date.now(),
                fileName: fileInput.files[0]?.name || 'Unknown',
                fileSize: fileInput.files[0]?.size || 0,
                uploadTime: new Date().toISOString(),
                appUrl: null,
                customId: null,
                status: 'error',
                error: result.error
            };
            
            const storedHistory = localStorage.getItem('uploadHistory');
            let history = storedHistory ? JSON.parse(storedHistory) : [];
            history.unshift(errorRecord);
            localStorage.setItem('uploadHistory', JSON.stringify(history));
            
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        showToast(`Upload failed: ${error.message}`, 'error');
        loadHistory(); // Reload history to show the failed attempt
    } finally {
        hideProgress();
    }
}

// Show upload progress
function showProgress() {
    progressSection.style.display = 'block';
    uploadBtn.disabled = true;
    
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
    }, 200);
    
    // Store interval ID for cleanup
    progressSection.dataset.intervalId = interval;
}

// Hide upload progress
function hideProgress() {
    const intervalId = progressSection.dataset.intervalId;
    if (intervalId) {
        clearInterval(parseInt(intervalId));
    }
    
    progressFill.style.width = '100%';
    progressText.textContent = 'Upload complete!';
    
    setTimeout(() => {
        progressSection.style.display = 'none';
        progressFill.style.width = '0%';
        validateForm();
    }, 1500);
}

// Reset form
function resetForm() {
    uploadForm.reset();
    removeFile();
}

// Load upload history (using localStorage for serverless)
async function loadHistory() {
    try {
        // In serverless environment, we'll store history in localStorage
        const storedHistory = localStorage.getItem('uploadHistory');
        if (storedHistory) {
            uploadHistory = JSON.parse(storedHistory);
        } else {
            uploadHistory = [];
        }
        displayHistory();
        updateStats();
    } catch (error) {
        console.error('Failed to load history:', error);
        showToast('Failed to load upload history', 'error');
        uploadHistory = [];
        displayHistory();
        updateStats();
    }
}

// Display upload history
function displayHistory() {
    if (uploadHistory.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No uploads yet</p>
                <small>Upload your first APK file to see results here</small>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = uploadHistory.map(record => `
        <div class="result-card">
            <div class="result-header">
                <div class="result-info">
                    <h3>${record.fileName}</h3>
                    <div class="result-meta">
                        ${formatFileSize(record.fileSize)} • ${formatDate(record.uploadTime)}
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="status-badge status-${record.status}">
                        ${record.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                    <button class="delete-btn" onclick="deleteRecord(${record.id})" title="Delete record">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${record.status === 'success' && record.appUrl ? `
                <div class="app-url">
                    <strong>App URL:</strong><br>
                    ${record.appUrl}
                    <button class="copy-btn" onclick="copyToClipboard('${record.appUrl}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                ${record.customId ? `
                    <div style="margin-top: 8px; font-size: 14px; color: #718096;">
                        <strong>Custom ID:</strong> ${record.customId}
                    </div>
                ` : ''}
            ` : ''}
            
            ${record.status === 'error' && record.error ? `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${record.error}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    totalUploads.textContent = uploadHistory.length;
    successfulUploads.textContent = uploadHistory.filter(r => r.status === 'success').length;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('App URL copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('App URL copied to clipboard!', 'success');
    }
}

// Delete record (from localStorage in serverless environment)
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        const storedHistory = localStorage.getItem('uploadHistory');
        if (storedHistory) {
            let history = JSON.parse(storedHistory);
            history = history.filter(record => record.id !== id);
            localStorage.setItem('uploadHistory', JSON.stringify(history));
            showToast('Record deleted successfully', 'success');
            loadHistory();
        }
    } catch (error) {
        showToast('Failed to delete record', 'error');
    }
}

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Open password change modal
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.add('show');
    
    // Close dropdown
    document.getElementById('userDropdown').classList.remove('show');
    
    // Clear form
    document.getElementById('passwordChangeForm').reset();
}

// Close password change modal
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.remove('show');
}

// Setup password change modal
function setupPasswordChangeModal() {
    const form = document.getElementById('passwordChangeForm');
    const modal = document.getElementById('passwordModal');
    
    // Handle form submission
    form.addEventListener('submit', handlePasswordChange);
    
    // Close modal when clicking overlay
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePasswordModal();
        }
    });
    
    // Real-time password confirmation validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    function validatePasswordMatch() {
        if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
    
    newPassword.addEventListener('input', validatePasswordMatch);
    confirmPassword.addEventListener('input', validatePasswordMatch);
}

// Handle password change form submission
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    const submitBtn = document.getElementById('changePasswordBtn');
    const originalText = submitBtn.innerHTML;
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch('/api/password?action=change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                userId: userId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Password changed successfully!', 'success');
            closePasswordModal();
        } else {
            showToast(result.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Check if user is authenticated (client-side for serverless)
function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

// Clear authentication data
function clearAuth() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth?action=logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            clearAuth();
            localStorage.clear(); // Clear all stored data
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            showToast('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Even if API call fails, clear local auth
        clearAuth();
        localStorage.clear();
        showToast('Logged out', 'success');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}


// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Remove on click
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}
