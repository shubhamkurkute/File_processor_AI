const API_GATEWAY_URL = "https://roo7yy16kl.execute-api.ap-south-1.amazonaws.com/prod";

document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const processBtn = document.getElementById('processBtn');
    const summaryBtn = document.getElementById('summaryBtn');

    // Handle File Upload
    uploadBtn.addEventListener('click', () => {

        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (file && file.type === 'text/csv') {
            encodeFileToBase64(file)
                .then(base64File => {
                    uploadFile(base64File, file.name);
                })
                .catch(err => {
                    showStatus('file-status', 'Error encoding file.', 'danger');
                });
        } else {
            showStatus('file-status', 'Please upload a valid CSV file.', 'danger');
        }
    });

    // Trigger Data Processing
    processBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('csvFile');
        const fileName = fileInput.files[0]?.name;
        if (fileName) {
            processUploadedData(fileName);
        } else {
            showStatus('processing-status', 'Please upload a file first.', 'danger');
        }
    });

    // Request Summary
    summaryBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('csvFile');
        const fileName = fileInput.files[0]?.name;
        if (fileName) {
            requestSummary(fileName);
        } else {
            showStatus('results', 'Please upload a file first.', 'danger');
        }
    });
});

// Convert file to base64
function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Get the base64 part
        reader.onerror = reject;
        reader.readAsDataURL(file); // Converts file to base64
    });
}

// Upload File
function uploadFile(fileContent, fileName) {
    const payload = {
        action: 'upload',
        "file-name": fileName,
        file_content: fileContent
    };

    console.log("Payload for upload:", payload);  // Debugging line

    fetch(`${API_GATEWAY_URL}/upload`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Upload response:", data);  // Debugging line
            if (data.message) {
                showStatus('file-status', 'File uploaded successfully!', 'success');
            } else {
                showStatus('file-status', data.error || 'Error uploading file.', 'danger');
            }
        })
        .catch(err => {
            console.error('Upload error:', err);  // Debugging line
            showStatus('file-status', 'Error uploading file.', 'danger');
        });
}

// Process Uploaded Data
function processUploadedData(fileName) {
    const payload = {
        action: 'process',
        "file-name": fileName
    };

    fetch(`${API_GATEWAY_URL}/process`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                showStatus('processing-status', 'Data processed successfully!', 'success');
            } else {
                showStatus('processing-status', data.error || 'Error processing data.', 'danger');
            }
        })
        .catch(err => {
            console.log("Error:", err)
            showStatus('processing-status', 'Error processing data.', 'danger');
        });
}

// Request Summary
function requestSummary(fileName) {
    const payload = {
        action: 'llm_summarize',
        "file-name": fileName
    };

    fetch(`${API_GATEWAY_URL}/llm_summarize`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            const resultsSection = document.getElementById('results');
            if (data.summary) {
                resultsSection.innerText = data.summary; // Update content with summary
                resultsSection.classList.remove('d-none'); // Ensure it's visible
                resultsSection.style.display = 'block';

            } else {
                showStatus('results', data.error || 'Error fetching summary.', 'danger');
            }
        })
        .catch(err => {
            showStatus('results', 'Error fetching summary.', 'danger');
        });
}

// Show status message
function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    statusElement.classList.remove('alert-info', 'alert-success', 'alert-danger', 'd-none');
    statusElement.classList.add('alert-' + type);
    statusElement.innerText = message;
    statusElement.style.display = 'block';
}
