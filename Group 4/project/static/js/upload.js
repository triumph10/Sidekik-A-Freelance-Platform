document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('projectFiles');
    const fileList = document.getElementById('fileList');
    const uploadForm = document.getElementById('projectUploadForm');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle clicked files
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFiles);

    // Handle form submission
    uploadForm.addEventListener('submit', handleSubmit);

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(e) {
        const files = e.target?.files || e;
        updateFileList(files);
    }

    function updateFileList(files) {
        fileList.innerHTML = '';
        [...files].forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <i class="fas fa-times remove-file"></i>
            `;
            fileList.appendChild(fileItem);

            // Add remove functionality
            fileItem.querySelector('.remove-file').addEventListener('click', () => {
                fileItem.remove();
            });
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', document.getElementById('projectTitle').value);
        formData.append('description', document.getElementById('projectDescription').value);
        formData.append('type', document.getElementById('projectType').value);
        formData.append('techStack', document.getElementById('techStack').value);
        formData.append('price', document.getElementById('projectPrice').value);

        // Append files
        const fileInput = document.getElementById('projectFiles');
        [...fileInput.files].forEach(file => {
            formData.append('files', file);
        });

        try {
            // Here you would typically make an API call to your backend
            console.log('Uploading project:', Object.fromEntries(formData));
            
            // Simulate successful upload
            alert('Project uploaded successfully!');
            uploadForm.reset();
            fileList.innerHTML = '';
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        }
    }
}); 