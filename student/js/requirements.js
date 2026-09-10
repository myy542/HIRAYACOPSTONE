/**
 * Student Requirements - Supabase Integration
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📋 Student Requirements (Supabase) ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Requirement elements
    const requirementsList = document.getElementById('requirementsList');
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const submittedCount = document.getElementById('submittedCount');
    const missingCount = document.getElementById('missingCount');
    const totalCount = document.getElementById('totalCount');

    // Modal elements
    const uploadModal = document.getElementById('uploadModal');
    const requirementKeyInput = document.getElementById('requirement_key');
    const requirementLabel = document.getElementById('requirement_label');
    const fileInput = document.getElementById('requirement_file');
    const selectedFile = document.getElementById('selectedFile');
    const uploadForm = document.getElementById('uploadForm');
    const submitUpload = document.getElementById('submitUpload');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadProgressFill = document.getElementById('uploadProgressFill');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let studentRow = null;
    let requirementsData = [];

    const requirementDefs = [
        {
            key: 'psa_birth',
            title: 'PSA Official Birth Certificate',
            description: 'Original or clear photocopy of Philippine Statistics Authority (PSA) Birth Certificate.',
            required: true,
            dbField: 'psa_birth_url'
        },
        {
            key: 'form_138',
            title: 'Form 138 / Report Card',
            description: 'Original Form 138 (Report Card) from previous grade level signed by the Principal.',
            required: true,
            dbField: 'form_138_url'
        },
        {
            key: 'good_moral',
            title: 'Certificate of Good Moral Character',
            description: 'Official Certificate of Good Moral Character issued by previous school.',
            required: true,
            dbField: 'good_moral_url'
        },
        {
            key: 'id_picture',
            title: '2x2 Recent ID Pictures',
            description: 'Recent 2x2 ID picture in white background with nametag (2 copies).',
            required: false,
            dbField: 'id_picture_url'
        }
    ];

    // ============================================
    // SESSION CHECK (Supabase / localStorage)
    // ============================================

    let sessionUser = null;
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch(e) {}

    if (!sessionUser) {
        console.warn('⚠️ No active user session found, redirecting to login...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (sessionUser.role && sessionUser.role !== 'student') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'teacher': '../teacher/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    function getStudentInitials(name) {
        if (!name || typeof name !== 'string') return 'S';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?)\s+/i, '').trim();
        if (!cleanName || cleanName.toLowerCase() === 'student' || cleanName.toLowerCase().includes('mylene') || cleanName.toLowerCase().includes('raganas')) return 'S';
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return 'S';
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function sanitizeStudentName(name, email) {
        if (!name && email) {
            if (email.toLowerCase().includes('mylene') || email.toLowerCase().includes('student')) return 'Student';
            name = email.split('@')[0];
        }
        if (!name || name.toLowerCase().includes('mylene') || name.toLowerCase().includes('raganas') || name.toLowerCase() === 'admin') {
            return 'Student';
        }
        return name;
    }

    let displayName = sessionUser.firstName ? 
        `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : 
        (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student');
    displayName = sanitizeStudentName(displayName, sessionUser.email);

    if (studentName) studentName.textContent = displayName;
    if (studentInitial) studentInitial.textContent = getStudentInitials(displayName);

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('plsnhs_student_avatar');
            localStorage.removeItem('plsnhs_student_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // LOAD REQUIREMENTS DATA FROM SUPABASE
    // ============================================

    async function loadRequirementsData() {
        try {
            const userEmail = sessionUser.email || '';
            const userUid = sessionUser.uid || '';

            // 1. Fetch student
            try {
                const { data: sRows } = await supabase
                    .from('students')
                    .select('*')
                    .or(`email.eq.${userEmail},id.eq.${userUid}`);

                if (sRows && sRows.length > 0) {
                    studentRow = sRows[0];
                    let fullName = `${studentRow.first_name || ''} ${studentRow.last_name || ''}`.trim();
                    fullName = sanitizeStudentName(fullName, userEmail);
                    if (fullName) {
                        if (studentName) studentName.textContent = fullName;
                        if (studentInitial) studentInitial.textContent = getStudentInitials(fullName);
                    }
                }
            } catch(e) {}

            // 2. Fetch student_documents
            let uploadedDocs = [];
            if (studentRow?.id) {
                try {
                    const { data: docs } = await supabase
                        .from('student_documents')
                        .select('*')
                        .eq('student_id', studentRow.id);
                    if (docs) uploadedDocs = docs;
                } catch(e) {}
            }

            // Assemble requirements status
            requirementsData = requirementDefs.map(def => {
                let fileUrl = studentRow ? studentRow[def.dbField] : null;
                let isSubmitted = !!fileUrl;
                let status = isSubmitted ? 'Verified' : 'Missing';

                const docMatch = uploadedDocs.find(d => d.document_type === def.title || d.document_type === def.key);
                if (docMatch) {
                    fileUrl = docMatch.file_url || fileUrl;
                    isSubmitted = true;
                    status = docMatch.verified ? 'Verified' : 'Under Review';
                }

                return {
                    ...def,
                    fileUrl: fileUrl,
                    isSubmitted: isSubmitted,
                    status: status
                };
            });

            renderRequirements();
            updateProgress();

        } catch (error) {
            console.error('Error loading requirements data:', error);
            showAlert('❌ Error loading requirements: ' + error.message, 'error');
        }
    }

    // ============================================
    // RENDER REQUIREMENTS LIST
    // ============================================

    function renderRequirements() {
        if (!requirementsList) return;
        requirementsList.innerHTML = '';

        requirementsData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `requirement-item ${item.isSubmitted ? 'submitted' : 'missing'}`;

            const statusClass = item.status === 'Verified' ? 'badge-verified' : 
                               item.status === 'Under Review' ? 'badge-review' : 'badge-missing';
            const statusIcon = item.status === 'Verified' ? '<i class="fas fa-check-circle"></i>' : 
                              item.status === 'Under Review' ? '<i class="fas fa-clock"></i>' : '<i class="fas fa-exclamation-circle"></i>';

            itemDiv.innerHTML = `
                <div class="req-icon">
                    <i class="fas ${item.isSubmitted ? 'fa-file-check' : 'fa-file-upload'}"></i>
                </div>
                <div class="req-content">
                    <div class="req-header">
                        <h4>${item.title}</h4>
                        <span class="req-badge ${statusClass}">${statusIcon} ${item.status}</span>
                    </div>
                    <p class="req-desc">${item.description}</p>
                    ${item.fileUrl ? `
                        <div class="req-file-preview">
                            <i class="fas fa-paperclip"></i>
                            <a href="${item.fileUrl}" target="_blank" class="file-link">View Submitted Document</a>
                        </div>
                    ` : ''}
                </div>
                <div class="req-actions">
                    <button type="button" class="btn-upload-req" data-key="${item.key}" data-label="${item.title}">
                        <i class="fas ${item.isSubmitted ? 'fa-redo' : 'fa-upload'}"></i>
                        ${item.isSubmitted ? 'Re-upload' : 'Upload'}
                    </button>
                </div>
            `;

            requirementsList.appendChild(itemDiv);
        });

        // Attach upload button events
        document.querySelectorAll('.btn-upload-req').forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                const label = this.dataset.label;
                openUploadModal(key, label);
            });
        });
    }

    // ============================================
    // PROGRESS UPDATE
    // ============================================

    function updateProgress() {
        const total = requirementsData.length;
        const submitted = requirementsData.filter(r => r.isSubmitted).length;
        const missing = total - submitted;
        const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;

        if (totalCount) totalCount.textContent = total;
        if (submittedCount) submittedCount.textContent = submitted;
        if (missingCount) missingCount.textContent = missing;
        if (progressPercentage) progressPercentage.textContent = `${percent}%`;
        if (progressFill) progressFill.style.width = `${percent}%`;
    }

    // ============================================
    // MODAL HANDLERS
    // ============================================

    function openUploadModal(key, label) {
        if (requirementKeyInput) requirementKeyInput.value = key;
        if (requirementLabel) requirementLabel.textContent = label;
        if (fileInput) fileInput.value = '';
        if (selectedFile) selectedFile.textContent = 'No file selected';
        if (uploadModal) uploadModal.style.display = 'flex';
    }

    function closeUploadModal() {
        if (uploadModal) uploadModal.style.display = 'none';
    }

    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeUploadModal);

    const cancelUploadBtn = document.getElementById('cancelUpload');
    if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                if (selectedFile) selectedFile.textContent = this.files[0].name;
            }
        });
    }

    // Handle Upload Form Submit
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const key = requirementKeyInput?.value;
            const file = fileInput?.files?.[0];

            if (!file) {
                showAlert('⚠️ Please select a file to upload', 'error');
                return;
            }

            if (submitUpload) {
                submitUpload.disabled = true;
                submitUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            }

            try {
                const reader = new FileReader();
                reader.onload = async function(evt) {
                    const dataUrl = evt.target.result;
                    
                    // Match requirement and update in Supabase / state
                    const targetReq = requirementsData.find(r => r.key === key);
                    if (targetReq) {
                        targetReq.isSubmitted = true;
                        targetReq.status = 'Under Review';
                        targetReq.fileUrl = dataUrl;

                        // Update in Supabase student record if available
                        if (studentRow?.id && targetReq.dbField) {
                            try {
                                await supabase
                                    .from('students')
                                    .update({ [targetReq.dbField]: dataUrl })
                                    .eq('id', studentRow.id);
                            } catch(err) {
                                console.warn('Could not update student doc column in Supabase:', err);
                            }
                        }
                    }

                    showAlert(`✅ ${targetReq ? targetReq.title : 'Document'} uploaded successfully!`, 'success');
                    renderRequirements();
                    updateProgress();
                    closeUploadModal();

                    if (submitUpload) {
                        submitUpload.disabled = false;
                        submitUpload.innerHTML = 'Submit Upload';
                    }
                };
                reader.readAsDataURL(file);

            } catch (err) {
                console.error('Upload error:', err);
                showAlert('❌ Error uploading document: ' + err.message, 'error');
                if (submitUpload) {
                    submitUpload.disabled = false;
                    submitUpload.innerHTML = 'Submit Upload';
                }
            }
        });
    }

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        alertContainer.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 4000);
    }

    // Initialize
    loadRequirementsData();

})();