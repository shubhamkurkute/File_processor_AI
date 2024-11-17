document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const processBtn = document.getElementById('processBtn');
    const summaryBtn = document.getElementById('summaryBtn');

    // Handle File Upload
    uploadBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (file && file.type === 'text/csv') {
            uploadFile(file);
        } else {
            showStatus('file-status', 'Please upload a valid CSV file.', 'danger');
        }
    });

    // Trigger Data Processing
    processBtn.addEventListener('click', () => {
        processUploadedData();
    });

    // Request Summary
    summaryBtn.addEventListener('click', () => {
        requestSummary();
    });
});

function uploadFile(file) {
    const formData = new FormData();
    formData.append('csv', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showStatus('file-status', 'File uploaded successfully!', 'success');
    })
    .catch(err => {
        showStatus('file-status', 'Error uploading file.', 'danger');
    });
}

function processUploadedData() {
    fetch('/process', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        showStatus('processing-status', 'Data processed successfully!', 'success');
    })
    .catch(err => {
        showStatus('processing-status', 'Error processing data.', 'danger');
    });
}

function requestSummary() {
    fetch('/summary', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const resultsSection = document.getElementById('results');
        resultsSection.innerText = JSON.stringify(data, null, 2);
        resultsSection.classList.remove('d-none');
    })
    .catch(err => {
        showStatus('results', 'Error fetching summary.', 'danger');
    });
}

function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    statusElement.classList.remove('alert-info', 'alert-success', 'alert-danger', 'd-none');
    statusElement.classList.add('alert-' + type);
    statusElement.innerText = message;
    statusElement.style.display = 'block';
}
