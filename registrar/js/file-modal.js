/**
 * File Preview Modal - Interactive JavaScript
 */

(function() {
    'use strict';

    console.log('📁 File Modal ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const modal = document.getElementById('filePreviewModal');
    const modalBody = document.getElementById('modalBody');
    const modalFileName = document.getElementById('modalFileName');
    const downloadBtn = document.getElementById('downloadFileBtn');

    // ============================================
    // OPEN FILE MODAL
    // ============================================

    function openFileModal(fileUrl) {
        if (!modal) return;

        // Get file name from URL
        const fileName = fileUrl.split('/').pop();
        if (modalFileName) {
            modalFileName.textContent = fileName || 'File Preview';
        }

        // Set download link
        if (downloadBtn) {
            downloadBtn.href = fileUrl;
        }

        // Show loading
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="file-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading file...</p>
                </div>
            `;
        }

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load file
        loadFile(fileUrl);
    }

    // Expose to window for use in other scripts
    window.openFileModal = openFileModal;

    // ============================================
    // LOAD FILE
    // ============================================

    function loadFile(fileUrl) {
        const extension = fileUrl.split('.').pop().toLowerCase();

        // Check if it's an image
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        if (imageExtensions.includes(extension)) {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.alt = 'File Preview';
            img.onload = function() {
                if (modalBody) {
                    modalBody.innerHTML = '';
                    modalBody.appendChild(img);
                }
            };
            img.onerror = function() {
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="file-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Failed to load image.</p>
                            <a href="${fileUrl}" target="_blank" class="file-download-btn" style="margin-top: 1rem;">
                                <i class="fas fa-external-link-alt"></i> Open in new tab
                            </a>
                        </div>
                    `;
                }
            };
            return;
        }

        // Check if it's a PDF
        if (extension === 'pdf') {
            // Use iframe for PDF
            const iframe = document.createElement('iframe');
            iframe.src = fileUrl;
            iframe.title = 'PDF Preview';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.minHeight = '400px';
            iframe.style.border = 'none';

            iframe.onerror = function() {
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="file-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Failed to load PDF.</p>
                            <a href="${fileUrl}" target="_blank" class="file-download-btn" style="margin-top: 1rem;">
                                <i class="fas fa-external-link-alt"></i> Open in new tab
                            </a>
                        </div>
                    `;
                }
            };

            if (modalBody) {
                modalBody.innerHTML = '';
                modalBody.appendChild(iframe);
            }
            return;
        }

        // Other files - show download option
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="file-error">
                    <i class="fas fa-file"></i>
                    <p>This file type (${extension.toUpperCase()}) cannot be previewed directly.</p>
                    <a href="${fileUrl}" target="_blank" class="file-download-btn" style="margin-top: 1rem;">
                        <i class="fas fa-external-link-alt"></i> Open file
                    </a>
                </div>
            `;
        }
    }

    // ============================================
    // CLOSE MODAL
    // ============================================

    function closeFileModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="file-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading file...</p>
                    </div>
                `;
            }
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Close button (X)
    const closeBtn = modal ? modal.querySelector('.file-modal-close') : null;
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFileModal);
    }

    // Close footer button
    const closeFooterBtn = modal ? modal.querySelector('.file-modal-close-footer') : null;
    if (closeFooterBtn) {
        closeFooterBtn.addEventListener('click', closeFileModal);
    }

    // Close on outside click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeFileModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeFileModal();
        }
    });

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    document.addEventListener('keydown', function(e) {
        // Ctrl+O to open file (for demo)
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            // For demo purposes
            if (window.openFileModal) {
                const demoFile = document.querySelector('.modal-trigger');
                if (demoFile && demoFile.dataset.fileUrl) {
                    window.openFileModal(demoFile.dataset.fileUrl);
                }
            }
        }
    });

    console.log('✅ File Modal ready!');

})();