/**
 * View Enrollment - Interactive JavaScript
 */

(function() {
    'use strict';

    console.log('📋 View Enrollment page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Student info
    const studentName = document.getElementById('studentName');
    const studentEmail = document.getElementById('studentEmail');
    const studentId = document.getElementById('studentId');
    const registeredDate = document.getElementById('registeredDate');
    const studentAvatar = document.getElementById('studentAvatar');
    const statusBadge = document.getElementById('statusBadge');
    const infoGrid = document.getElementById('infoGrid');
    const reqBadge = document.getElementById('reqBadge');

    // Requirements
    const requirementsGrid = document.getElementById('requirementsGrid');
    const documentsGrid = document.getElementById('documentsGrid');

    // Status
    const statusSelect = document.getElementById('statusSelect');
    const statusForm = document.getElementById('statusForm');
    const rejectionReasonGroup = document.getElementById('rejectionReasonGroup');
    const rejectionReason = document.getElementById('rejectionReason');
    const notifyStudentBtn = document.getElementById('notifyStudentBtn');

    // History
    const historyBody = document.getElementById('historyBody');
    const historyCount = document.getElementById('historyCount');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.enrollmentData || {
        id: 0,
        student_id: 0,
        fullname: 'Student Name',
        email: 'student@email.com',
        id_number: null,
        student_profile_pic: null,
        student_created_at: null,
        grade_name: 'N/A',
        grade_id: null,
        strand: null,
        school_year: 'N/A',
        status: 'Pending',
        student_type: 'new',
        created_at: null,
        requirements: [],
        history: [],
        documents: {}
    };

    // ============================================
    // SET ADMIN NAME
    // ============================================

    if (adminName) adminName.textContent = 'Registrar';
    if (adminInitial) adminInitial.textContent = 'R';

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../auth/login.html';
        });
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // ============================================
    // LOAD DATA
    // ============================================

    function loadData() {
        // Student info
        if (studentName) studentName.textContent = data.fullname;
        if (studentEmail) studentEmail.textContent = data.email;
        if (studentId) studentId.textContent = data.id_number || 'Not assigned';

        if (registeredDate && data.student_created_at) {
            const date = new Date(data.student_created_at);
            registeredDate.textContent = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }

        // Avatar
        if (studentAvatar) {
            if (data.student_profile_pic) {
                const imgUrl = `../${data.student_profile_pic}?t=${Date.now()}`;
                studentAvatar.innerHTML = `<img src="${imgUrl}" alt="Profile">`;
                studentAvatar.className = 'student-avatar-large-img';
            } else {
                studentAvatar.textContent = data.fullname ? data.fullname.charAt(0).toUpperCase() : 'S';
                studentAvatar.className = 'student-avatar-large';
            }
        }

        // Status badge
        if (statusBadge) {
            statusBadge.textContent = data.status || 'Pending';
            statusBadge.className = `status-badge ${data.status || 'Pending'}`;
        }

        // Info grid
        renderInfoGrid();

        // Requirements badge
        if (reqBadge) {
            reqBadge.textContent = `${data.grade_name || 'N/A'} - ${ucfirst(data.student_type || 'New')}`;
        }

        // Requirements
        renderRequirements();

        // Documents
        renderDocuments();

        // Status select
        if (statusSelect) {
            statusSelect.value = data.status || 'Pending';
            if (statusSelect.value === 'Rejected') {
                rejectionReasonGroup.style.display = 'block';
            }
        }

        // History
        renderHistory();

        // Show alert if from session
        showAlertFromSession();
    }

    // ============================================
    // RENDER INFO GRID
    // ============================================

    function renderInfoGrid() {
        if (!infoGrid) return;

        const fields = [
            { label: 'Student Type', value: ucfirst(data.student_type || 'New'), icon: 'fa-user-tag' },
            { label: 'Grade Level', value: data.grade_name || 'N/A', icon: 'fa-layer-group' },
            { label: 'Strand', value: data.strand || 'Not Applicable', icon: 'fa-tag' },
            { label: 'School Year', value: data.school_year || 'N/A', icon: 'fa-calendar' },
            { label: 'Application Date', value: formatDate(data.created_at), icon: 'fa-clock' }
        ];

        infoGrid.innerHTML = fields.map(field => `
            <div class="info-item">
                <div class="info-label">${field.label}</div>
                <div class="info-value">
                    <i class="fas ${field.icon}"></i>
                    ${field.value}
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // RENDER REQUIREMENTS
    // ============================================

    function renderRequirements() {
        if (!requirementsGrid) return;

        const requirements = data.requirements || [];

        if (requirements.length === 0) {
            requirementsGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No specific requirements found.</p>
                </div>
            `;
            return;
        }

        // Column mapping for checking submitted status
        const columnMap = {
            'Form 138': 'form_138',
            'Form 137': 'form_137',
            'PSA Birth Certificate': 'psa_birth_cert',
            'PSA Birth': 'psa_birth_cert',
            'Good Moral Certificate': 'good_moral_cert',
            'Good Moral': 'good_moral_cert',
            'Certificate of Completion': 'certificate_of_completion',
            '2x2 ID Pictures': 'id_pictures',
            'ID Pictures': 'id_pictures',
            'Medical Certificate': 'medical_cert',
            'Medical/Dental Certificate': 'medical_cert',
            'Entrance Exam Result': 'entrance_exam_result',
            'Entrance Exam': 'entrance_exam_result',
            'Interview Result': 'entrance_exam_result',
            'SHS Enrollment Form': 'other_documents',
            'ESC Slip': 'other_documents',
            'Transfer Credentials': 'other_documents',
            'Report Card': 'form_138'
        };

        requirementsGrid.innerHTML = requirements.map(req => {
            const isSubmitted = checkRequirementSubmitted(req.requirement_name, columnMap);
            const submittedFile = getSubmittedFile(req.requirement_name, columnMap);
            const statusClass = isSubmitted ? 'submitted' : 'missing';
            const icon = isSubmitted ? 'fa-check-circle' : 'file-alt';
            const statusText = isSubmitted ? 'Submitted' : 'Missing';
            const statusIcon = isSubmitted ? 'fa-check-circle' : 'fa-times-circle';
            const badgeClass = req.is_required ? 'badge-required' : 'badge-optional';
            const badgeText = req.is_required ? 'Required' : 'Optional';

            return `
                <div class="requirement-item ${statusClass}">
                    <div class="requirement-info">
                        <i class="fas ${icon}"></i>
                        <span class="requirement-name">${req.requirement_name}</span>
                        <span class="requirement-badge ${badgeClass}">${badgeText}</span>
                        ${req.can_be_followed ? `<span class="requirement-badge badge-follow">Can be followed</span>` : ''}
                    </div>
                    <div class="requirement-status">
                        <span class="status-${statusText.toLowerCase()}">
                            <i class="fas ${statusIcon}"></i> ${statusText}
                        </span>
                        ${isSubmitted && submittedFile ? `
                            <a href="#" data-file-url="../${submittedFile}" class="view-doc-link modal-trigger">
                                <i class="fas fa-eye"></i> View
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for modal triggers
        document.querySelectorAll('.modal-trigger').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const fileUrl = this.dataset.fileUrl;
                if (window.openFileModal) {
                    window.openFileModal(fileUrl);
                }
            });
        });
    }

    function checkRequirementSubmitted(reqName, columnMap) {
        for (const [key, column] of Object.entries(columnMap)) {
            if (reqName.toLowerCase().includes(key.toLowerCase())) {
                return !!(data.documents[column]);
            }
        }
        return false;
    }

    function getSubmittedFile(reqName, columnMap) {
        for (const [key, column] of Object.entries(columnMap)) {
            if (reqName.toLowerCase().includes(key.toLowerCase())) {
                return data.documents[column] || null;
            }
        }
        return null;
    }

    // ============================================
    // RENDER DOCUMENTS
    // ============================================

    function renderDocuments() {
        if (!documentsGrid) return;

        const docDisplay = {
            form_138: { label: 'Form 138 (Report Card)', icon: 'fa-file-pdf' },
            form_137: { label: 'Form 137 (Permanent Record)', icon: 'fa-file-pdf' },
            psa_birth_cert: { label: 'PSA Birth Certificate', icon: 'fa-file-pdf' },
            good_moral_cert: { label: 'Good Moral Certificate', icon: 'fa-file-pdf' },
            certificate_of_completion: { label: 'Certificate of Completion', icon: 'fa-file-pdf' },
            id_pictures: { label: '2x2 ID Pictures', icon: 'fa-file-image' },
            medical_cert: { label: 'Medical Certificate', icon: 'fa-file-pdf' },
            entrance_exam_result: { label: 'Entrance Exam Result', icon: 'fa-file-pdf' }
        };

        let hasDocuments = false;
        let html = '';

        for (const [field, info] of Object.entries(docDisplay)) {
            if (data.documents[field]) {
                hasDocuments = true;
                html += `
                    <div class="info-item">
                        <div class="info-label">${info.label}</div>
                        <div class="info-value">
                            <a href="#" data-file-url="../${data.documents[field]}" class="document-link modal-trigger">
                                <i class="fas ${info.icon}"></i> View Document
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        if (!hasDocuments) {
            html = `
                <div class="no-data" style="grid-column: span 2;">
                    <i class="fas fa-file-upload"></i>
                    <p>No documents have been submitted yet.</p>
                </div>
            `;
        }

        documentsGrid.innerHTML = html;

        // Add event listeners for modal triggers
        document.querySelectorAll('.modal-trigger').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const fileUrl = this.dataset.fileUrl;
                if (window.openFileModal) {
                    window.openFileModal(fileUrl);
                }
            });
        });
    }

    // ============================================
    // RENDER HISTORY
    // ============================================

    function renderHistory() {
        if (!historyBody) return;

        const history = data.history || [];

        if (historyCount) {
            historyCount.textContent = `${history.length} records`;
        }

        if (history.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-data">
                            <i class="fas fa-history"></i>
                            <p>No enrollment records found.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        historyBody.innerHTML = history.map(row => {
            const isCurrent = row.id === data.id;
            const statusBadge = isCurrent 
                ? `<span class="current-badge">Current</span>`
                : `<span class="status-badge ${row.status}" style="padding: 4px 12px; font-size: 11px;">${row.status}</span>`;

            return `
                <tr class="${isCurrent ? 'current-enrollment' : ''}">
                    <td>${statusBadge}</td>
                    <td>${row.school_year || 'N/A'}</td>
                    <td>${row.grade_name || 'N/A'}</td>
                    <td>${row.strand || '—'}</td>
                    <td><span class="student-type-badge student-type-${(row.student_type || 'new').toLowerCase()}">${ucfirst(row.student_type || 'New')}</span></td>
                    <td>${formatDate(row.created_at)}</td>
                </tr>
            `;
        }).join('');
    }

    // ============================================
    // STATUS UPDATE FORM
    // ============================================

    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            if (this.value === 'Rejected') {
                rejectionReasonGroup.style.display = 'block';
            } else {
                rejectionReasonGroup.style.display = 'none';
            }
        });
    }

    if (statusForm) {
        statusForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const status = statusSelect.value;
            const reason = rejectionReason.value.trim();

            if (status === 'Rejected' && !reason) {
                showAlert('❌ Please provide a reason for rejection.', 'error');
                return;
            }

            const btn = this.querySelector('.btn-update');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            // Simulate AJAX request
            setTimeout(() => {
                data.status = status;
                if (statusBadge) {
                    statusBadge.textContent = status;
                    statusBadge.className = `status-badge ${status}`;
                }

                showAlert('✅ Enrollment status updated successfully!', 'success');

                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Update Status';
            }, 1000);
        });
    }

    // ============================================
    // NOTIFY STUDENT
    // ============================================

    if (notifyStudentBtn) {
        notifyStudentBtn.addEventListener('click', function() {
            showAlert(`📧 Notification sent to ${data.fullname}`, 'success');
        });
    }

    // ============================================
    // SHOW ALERT FROM SESSION
    // ============================================

    function showAlertFromSession() {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (success) {
            showAlert(success, 'success');
        }
        if (error) {
            showAlert(error, 'error');
        }
    }

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;

        alertContainer.innerHTML = '';

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
    // UTILITY FUNCTIONS
    // ============================================

    function ucfirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================

    loadData();

    console.log('✅ View Enrollment ready!');
    console.log(`📋 Enrollment ID: ${data.id} - ${data.fullname}`);

})();