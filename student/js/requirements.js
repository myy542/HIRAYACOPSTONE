/**
 * Student Requirements - Firebase Integration
 */

import { auth, db } from '../../firebase/config.js';
import { 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📋 Requirements page ready');

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
    const allowedTypes = document.getElementById('allowed_types');
    const maxSize = document.getElementById('max_size');
    const fileInput = document.getElementById('requirement_file');
    const selectedFile = document.getElementById('selectedFile');
    const uploadForm = document.getElementById('uploadForm');
    const submitUpload = document.getElementById('submitUpload');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadProgressFill = document.getElementById('uploadProgressFill');

    // Status elements
    const statusAlert = document.getElementById('statusAlert');
    const statusMessage = document.getElementById('statusMessage');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let currentEnrollment = null;
    let requirementsData = [];
    let requirementFields = [];

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Student';
            const firstName = displayName.split('@')[0];
            studentName.textContent = firstName;
            studentInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // REMOVED: Role validation check
            // Any authenticated user can access this page
            
            // Load requirements data
            await loadRequirementsData(user.uid);
        } else {
            console.log('❌ User logged out - redirecting to login');
            window.location.href = '../auth/login.html';
        }
    });

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                showAlert('❌ Error logging out: ' + error.message, 'error');
            });
        });
    }

    // ============================================
    // LOAD REQUIREMENTS DATA
    // ============================================

    async function loadRequirementsData(userId) {
        try {
            // Get current enrollment without requiring composite index
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                // No enrollment found
                const noEnrollCard = document.getElementById('noEnrollmentCard');
                const reqContent = document.getElementById('requirementsContent');
                if (noEnrollCard) noEnrollCard.style.display = 'block';
                if (reqContent) reqContent.style.display = 'none';
                return;
            }

            let enrollments = [];
            snapshot.forEach((doc) => {
                enrollments.push({ id: doc.id, ...doc.data() });
            });

            // Sort in memory by createdAt descending
            enrollments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0));
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0));
                return timeB - timeA;
            });

            currentEnrollment = enrollments[0];
            console.log('📚 Enrollment data loaded:', currentEnrollment);

            // Update Info Card elements
            const gradeEl = document.getElementById('enrollmentGrade');
            if (gradeEl) gradeEl.textContent = currentEnrollment.grade || 'Grade N/A';

            const typeBadge = document.getElementById('studentTypeBadge');
            if (typeBadge) {
                const isNew = (currentEnrollment.studentType || 'new') === 'new' || enrollments.length <= 1;
                typeBadge.textContent = isNew ? 'New Student' : 'Continuing Student';
                typeBadge.className = 'student-type-badge ' + (isNew ? 'student-type-new' : 'student-type-continuing');
            }

            const statusBadge = document.getElementById('enrollmentStatusBadge');
            if (statusBadge) {
                const st = (currentEnrollment.status || 'Pending').toLowerCase();
                statusBadge.textContent = currentEnrollment.status || 'Pending';
                statusBadge.className = 'status-badge status-' + (st === 'approved' || st === 'enrolled' ? 'enrolled' : st);
            }

            const appBadge = document.getElementById('approvedBadge');
            if (appBadge) {
                const isApp = ['enrolled', 'approved'].includes((currentEnrollment.status || '').toLowerCase());
                appBadge.style.display = isApp ? 'inline-flex' : 'none';
            }

            // Get requirements based on grade and student type
            try {
                const requirementsRef = collection(db, 'enrollmentRequirements');
                const reqSnapshot = await getDocs(requirementsRef);
                
                requirementFields = [];
                requirementsData = [];
                
                const targetGrade = currentEnrollment.grade || currentEnrollment.gradeName;
                const targetType = currentEnrollment.studentType || 'new';

                reqSnapshot.forEach((reqDoc) => {
                    const data = reqDoc.data();
                    if ((data.gradeLevel == targetGrade || !data.gradeLevel) && (data.studentType == targetType || !data.studentType)) {
                        const key = data.fieldName || data.requirementName?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') || 'req_' + reqDoc.id;
                        const isSubmitted = currentEnrollment[key] && currentEnrollment[key] !== '';
                        
                        const requirement = {
                            key: key,
                            label: data.requirementName || data.label || 'Requirement',
                            icon: data.icon || 'fa-file-alt',
                            submitted: isSubmitted,
                            required: data.isRequired || false,
                            canBeFollowed: data.canBeFollowed || false,
                            description: data.description || 'Please submit this document',
                            file: isSubmitted ? currentEnrollment[key] : null,
                            allowedTypes: data.allowedTypes || 'pdf,jpg,jpeg,png',
                            maxSize: data.maxSize || 5
                        };
                        
                        requirementsData.push(requirement);
                        requirementFields.push({
                            key: key,
                            label: requirement.label,
                            field: key
                        });
                    }
                });
            } catch (e) {
                console.log('Error fetching requirements from DB, using defaults:', e);
            }

            // If no requirements found, use default ones
            if (requirementsData.length === 0) {
                requirementsData = getDefaultRequirements(currentEnrollment);
            }

            // Check if submitted fields exist in currentEnrollment for default requirements
            requirementsData.forEach(req => {
                if (currentEnrollment[req.key] || currentEnrollment[req.key + '_filename']) {
                    req.submitted = true;
                    req.file = currentEnrollment[req.key] || null;
                }
            });

            // Update UI
            updateRequirementsUI();
            updateProgressUI();
            updateStatusAlert();

            const noEnrollCard = document.getElementById('noEnrollmentCard');
            const reqContent = document.getElementById('requirementsContent');
            if (noEnrollCard) noEnrollCard.style.display = 'none';
            if (reqContent) reqContent.style.display = 'block';

        } catch (error) {
            console.error('Error loading requirements data:', error);
            showAlert('❌ Error loading data: ' + error.message, 'error');
        }
    }

    // ============================================
    // DEFAULT REQUIREMENTS
    // ============================================

    function getDefaultRequirements(enrollment) {
        const grade = enrollment.grade || enrollment.gradeName || 'Grade 7';
        const type = enrollment.studentType || 'new';
        
        const defaults = {
            'Grade 7': {
                'new': [
                    { key: 'form_137', label: 'Form 137 (Permanent Record)', icon: 'fa-file-pdf', required: true, canBeFollowed: false, description: 'Original permanent record from elementary school' },
                    { key: 'certificate_of_completion', label: 'Certificate of Completion', icon: 'fa-certificate', required: true, canBeFollowed: false, description: 'Certificate showing completion of elementary' },
                    { key: 'psa_birth_cert', label: 'PSA Birth Certificate', icon: 'fa-id-card', required: true, canBeFollowed: false, description: 'PSA authenticated birth certificate' },
                    { key: 'id_pictures', label: '2x2 ID Pictures', icon: 'fa-camera', required: true, canBeFollowed: false, description: '2x2 colored ID picture with white background' },
                    { key: 'good_moral_cert', label: 'Good Moral Certificate', icon: 'fa-hand-peace', required: true, canBeFollowed: false, description: 'Certificate of good moral character' }
                ]
            },
            'Grade 11': {
                'same_school': [
                    { key: 'form_138', label: 'Form 138 (Grade 10 Report Card)', icon: 'fa-file-pdf', required: true, canBeFollowed: false, description: 'Report card from Grade 10' },
                    { key: 'certificate_of_completion', label: 'Certificate of Completion (Junior High)', icon: 'fa-certificate', required: true, canBeFollowed: false, description: 'Certificate showing completion of junior high school' },
                    { key: 'psa_birth_cert', label: 'PSA Birth Certificate', icon: 'fa-id-card', required: true, canBeFollowed: false, description: 'PSA authenticated birth certificate' },
                    { key: 'good_moral_cert', label: 'Good Moral Certificate', icon: 'fa-hand-peace', required: true, canBeFollowed: false, description: 'Certificate of good moral character' }
                ]
            }
        };

        // Try to get matching defaults
        if (defaults[grade] && defaults[grade][type]) {
            return defaults[grade][type].map(req => ({
                ...req,
                submitted: false,
                file: null,
                allowedTypes: 'pdf,jpg,jpeg,png',
                maxSize: 5
            }));
        }

        // Fallback defaults
        return [
            { key: 'form_138', label: 'Form 138 (Report Card)', icon: 'fa-file-pdf', required: true, canBeFollowed: false, submitted: false, file: null, description: 'Latest report card', allowedTypes: 'pdf,jpg,jpeg,png', maxSize: 5 },
            { key: 'psa_birth_cert', label: 'PSA Birth Certificate', icon: 'fa-id-card', required: true, canBeFollowed: false, submitted: false, file: null, description: 'PSA authenticated birth certificate', allowedTypes: 'pdf,jpg,jpeg,png', maxSize: 5 },
            { key: 'good_moral_cert', label: 'Good Moral Certificate', icon: 'fa-hand-peace', required: true, canBeFollowed: false, submitted: false, file: null, description: 'Certificate of good moral character', allowedTypes: 'pdf,jpg,jpeg,png', maxSize: 5 }
        ];
    }

    // ============================================
    // UPDATE UI
    // ============================================

    function updateRequirementsUI() {
        if (!requirementsList) return;

        const status = currentEnrollment?.status || 'Pending_Requirements';
        const isLocked = status === 'Enrolled' || status === 'Rejected';

        requirementsList.innerHTML = requirementsData.map(req => {
            const isSubmitted = req.submitted;
            const statusClass = isSubmitted ? 'submitted' : 'missing';
            const iconClass = isSubmitted ? 'submitted' : 'missing';

            return `
                <div class="requirement-item ${statusClass}" data-key="${req.key}">
                    <div class="requirement-icon ${iconClass}">
                        <i class="fas ${req.icon}"></i>
                    </div>
                    <div class="requirement-info">
                        <div class="requirement-name">
                            ${req.label}
                            ${req.required ? '<span class="required-badge">Required</span>' : '<span class="optional-badge">Optional</span>'}
                            ${req.canBeFollowed ? '<span class="follow-up-badge">Can be followed</span>' : ''}
                        </div>
                        <div class="requirement-description">${req.description}</div>
                        <div class="requirement-status">
                            ${isSubmitted 
                                ? '<span class="status-badge submitted-badge"><i class="fas fa-check-circle"></i> Submitted</span>'
                                : '<span class="status-badge missing-badge"><i class="fas fa-clock"></i> Not Submitted</span>'
                            }
                        </div>
                    </div>
                    <div class="requirement-actions">
                        ${isSubmitted && req.file 
                            ? `<a href="${req.file}" target="_blank" class="btn-view"><i class="fas fa-eye"></i> View</a>`
                            : (!isLocked 
                                ? `<button class="btn-upload" onclick="window.openUploadModal('${req.key}', '${req.label}', '${req.allowedTypes}', ${req.maxSize})">
                                    <i class="fas fa-upload"></i> Upload
                                </button>`
                                : `<button class="btn-upload" disabled><i class="fas fa-lock"></i> Upload Disabled</button>`
                            )
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateProgressUI() {
        const total = requirementsData.length;
        const submitted = requirementsData.filter(r => r.submitted).length;
        const missing = total - submitted;
        const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressPercentage) progressPercentage.textContent = percentage + '% Complete';
        if (submittedCount) submittedCount.textContent = submitted;
        if (missingCount) missingCount.textContent = missing;
        if (totalCount) totalCount.textContent = total;
    }

    function updateStatusAlert() {
        if (!statusAlert) return;

        const status = currentEnrollment?.status || 'Pending_Requirements';
        const grade = currentEnrollment?.grade || 'N/A';

        let className = 'info';
        let icon = 'fa-info-circle';
        let title = 'Requirements Incomplete';
        let message = 'Please submit all required documents to complete your enrollment.';

        switch(status) {
            case 'Enrolled':
            case 'Approved':
                className = 'success';
                icon = 'fa-check-circle';
                title = 'Enrollment Approved!';
                message = 'Your enrollment has been APPROVED! You are now officially enrolled in ' + grade + '.';
                break;
            case 'Pending':
                className = 'warning';
                icon = 'fa-clock';
                title = 'Pending Approval';
                message = 'Your requirements are complete and pending admin approval. Please wait for confirmation.';
                break;
            case 'Rejected':
                className = 'danger';
                icon = 'fa-exclamation-triangle';
                title = 'Enrollment Rejected';
                message = 'Your enrollment has been rejected. Please contact the registrar\'s office for assistance.';
                break;
            default:
                className = 'info';
                icon = 'fa-info-circle';
                title = 'Requirements Incomplete';
                message = 'Please submit all required documents to complete your enrollment.';
                break;
        }

        statusAlert.className = 'status-alert ' + className;
        statusAlert.innerHTML = `
            <i class="fas ${icon}"></i>
            <div>
                <strong>${title}</strong><br>
                ${message}
            </div>
        `;
    }

    // ============================================
    // UPLOAD MODAL
    // ============================================

    function openUploadModal(key, label, types, maxSizeMB) {
        if (!uploadModal) return;

        requirementKeyInput.value = key;
        requirementLabel.textContent = label;
        allowedTypes.textContent = types;
        maxSize.textContent = maxSizeMB;
        
        // Reset file input
        fileInput.value = '';
        selectedFile.textContent = '';
        uploadProgress.style.display = 'none';
        submitUpload.disabled = false;

        uploadModal.classList.add('active');
    }

    function closeUploadModal() {
        if (uploadModal) {
            uploadModal.classList.remove('active');
        }
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                selectedFile.textContent = '📎 ' + this.files[0].name;
            } else {
                selectedFile.textContent = '';
            }
        });
    }

    // ============================================
    // UPLOAD FORM SUBMIT
    // ============================================

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const key = requirementKeyInput.value;
            const file = fileInput.files[0];

            if (!file) {
                showAlert('⚠️ Please select a file to upload', 'error');
                return;
            }

            // Validate file size
            const requirement = requirementsData.find(r => r.key === key);
            const maxSizeMB = requirement?.maxSize || 5;
            const maxBytes = maxSizeMB * 1024 * 1024;

            if (file.size > maxBytes) {
                showAlert(`⚠️ File too large. Max size is ${maxSizeMB}MB`, 'error');
                return;
            }

            // Validate file type
            const allowed = requirement?.allowedTypes || 'pdf,jpg,jpeg,png';
            const allowedArray = allowed.split(',').map(t => t.trim());
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (!allowedArray.includes(ext)) {
                showAlert(`⚠️ File type not allowed. Allowed: ${allowed}`, 'error');
                return;
            }

            try {
                // Show progress
                uploadProgress.style.display = 'block';
                submitUpload.disabled = true;

                // Simulate upload progress
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (progress >= 90) {
                        clearInterval(interval);
                    }
                    uploadProgressFill.style.width = progress + '%';
                }, 200);

                // Read file as base64 (for demo - in production use Firebase Storage)
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64Data = e.target.result;
                    
                    // Update enrollment with the file
                    const updateData = {
                        [key]: base64Data,
                        [key + '_filename']: file.name,
                        [key + '_uploadedAt']: serverTimestamp()
                    };

                    await updateDoc(doc(db, 'enrollments', currentEnrollment.id), updateData);

                    // Update local data
                    const req = requirementsData.find(r => r.key === key);
                    if (req) {
                        req.submitted = true;
                        req.file = base64Data;
                    }

                    // Update UI
                    updateRequirementsUI();
                    updateProgressUI();
                    
                    // Check if all requirements are submitted
                    const allSubmitted = requirementsData.every(r => r.submitted);
                    if (allSubmitted) {
                        await updateDoc(doc(db, 'enrollments', currentEnrollment.id), {
                            status: 'Pending',
                            updatedAt: serverTimestamp()
                        });
                        showAlert('✅ All requirements complete! Your enrollment is now pending review.', 'success');
                        updateStatusAlert();
                    } else {
                        showAlert('✅ ' + requirement.label + ' uploaded successfully!', 'success');
                    }

                    // Complete progress
                    uploadProgressFill.style.width = '100%';
                    setTimeout(() => {
                        closeUploadModal();
                        uploadProgress.style.display = 'none';
                        uploadProgressFill.style.width = '0';
                        submitUpload.disabled = false;
                    }, 500);
                };

                reader.readAsDataURL(file);

            } catch (error) {
                console.error('Error uploading file:', error);
                showAlert('❌ Error uploading: ' + error.message, 'error');
                uploadProgress.style.display = 'none';
                submitUpload.disabled = false;
            }
        });
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // EXPOSE FUNCTIONS GLOBALLY
    // ============================================

    window.openUploadModal = openUploadModal;
    window.closeUploadModal = closeUploadModal;

    console.log('✅ Requirements page ready!');

})();