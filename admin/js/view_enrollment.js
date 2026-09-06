// ===== VIEW ENROLLMENT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');

    // ===== ENROLLMENT DATA =====

    const enrollmentData = {
        id: 1,
        studentName: 'Juan Dela Cruz',
        studentEmail: 'juan.dela@plshs.edu.ph',
        studentId: 1,
        studentIdNumber: 'PLSNHS-STU-000001',
        studentCreatedAt: '2026-06-15 10:30:00',
        studentType: 'New',
        gradeLevel: 'Grade 11',
        strand: 'STEM',
        schoolYear: '2026-2027',
        status: 'Enrolled',
        created_at: '2026-06-20 14:30:00',
        totalEnrollments: 2,
        sinceYear: 2026
    };

    // Requirements data
    const requirementsData = {
        gradeLevel: 'Grade 11',
        studentType: 'New',
        submitted: [
            { id: 1, name: 'Form 138 (Report Card)', is_required: true, can_be_followed: false, file_path: null },
            { id: 2, name: 'PSA Birth Certificate', is_required: true, can_be_followed: false, file_path: null },
            { id: 3, name: '2x2 ID Pictures', is_required: true, can_be_followed: false, file_path: null }
        ],
        missing: [
            { id: 4, name: 'Good Moral Certificate', is_required: true, can_be_followed: false, file_path: null },
            { id: 5, name: 'Medical Certificate', is_required: false, can_be_followed: true, file_path: null }
        ],
        totalRequirements: 5,
        submittedCount: 3,
        missingCount: 2,
        completionPercentage: 60
    };

    // Enrollment history
    const historyData = [
        { school_year: '2025-2026', grade_name: 'Grade 10', strand: null, status: 'Enrolled', created_at: '2025-06-15 10:30:00' },
        { school_year: '2026-2027', grade_name: 'Grade 11', strand: 'STEM', status: 'Enrolled', created_at: '2026-06-20 14:30:00' }
    ];

    // ===== FUNCTIONS =====

    // Format date
    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
        });
    }

    // Show alert
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // Render student info
    function renderStudentInfo() {
        document.getElementById('studentName').textContent = enrollmentData.studentName;
        document.getElementById('studentEmail').textContent = enrollmentData.studentEmail;
        document.getElementById('studentIdNumber').textContent = enrollmentData.studentIdNumber;
        document.getElementById('totalEnrollments').textContent = enrollmentData.totalEnrollments;
        document.getElementById('sinceYear').textContent = enrollmentData.sinceYear;

        // Avatar initial
        const initial = enrollmentData.studentName.charAt(0).toUpperCase();
        const avatarEl = document.querySelector('.student-avatar-large');
        if (avatarEl) {
            avatarEl.textContent = initial;
        }
    }

    // Render enrollment info
    function renderEnrollmentInfo() {
        const grid = document.getElementById('enrollmentInfoGrid');
        if (!grid) return;
        
        const statusClass = enrollmentData.status.toLowerCase();

        grid.innerHTML = `
            <div class="info-item">
                <div class="info-label">Student Type</div>
                <div class="info-value">
                    <i class="fas fa-user-tag"></i>
                    ${enrollmentData.studentType || 'N/A'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Grade Level</div>
                <div class="info-value">
                    <i class="fas fa-layer-group"></i>
                    ${enrollmentData.gradeLevel || 'N/A'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Strand</div>
                <div class="info-value">
                    <i class="fas fa-tag"></i>
                    ${enrollmentData.strand || 'Not Applicable'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">School Year</div>
                <div class="info-value">
                    <i class="fas fa-calendar-alt"></i>
                    ${enrollmentData.schoolYear || 'N/A'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Application Date</div>
                <div class="info-value">
                    <i class="fas fa-clock"></i>
                    ${formatDate(enrollmentData.created_at)}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                    <span class="status-badge-small status-${statusClass}">
                        ${enrollmentData.status || 'Pending'}
                    </span>
                </div>
            </div>
        `;
    }

    // Render requirements
    function renderRequirements() {
        const container = document.getElementById('requirementsContainer');
        if (!container) return;
        
        // Update header info - check if elements exist first
        const reqGradeLevel = document.getElementById('reqGradeLevel');
        const reqStudentType = document.getElementById('reqStudentType');
        const requirementsCount = document.getElementById('requirementsCount');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressFill = document.getElementById('progressFill');
        const summarySubmitted = document.getElementById('summarySubmitted');
        const summaryMissing = document.getElementById('summaryMissing');
        const summaryComplete = document.getElementById('summaryComplete');
        
        if (reqGradeLevel) reqGradeLevel.textContent = requirementsData.gradeLevel || 'N/A';
        if (reqStudentType) reqStudentType.textContent = requirementsData.studentType || 'N/A';
        if (requirementsCount) {
            requirementsCount.textContent = 
                `${requirementsData.submittedCount || 0}/${requirementsData.totalRequirements || 0} Requirements`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${requirementsData.completionPercentage || 0}%`;
        }
        if (progressFill) {
            progressFill.style.width = `${requirementsData.completionPercentage || 0}%`;
        }
        
        // Update summary
        if (summarySubmitted) summarySubmitted.textContent = requirementsData.submittedCount || 0;
        if (summaryMissing) summaryMissing.textContent = requirementsData.missingCount || 0;
        if (summaryComplete) summaryComplete.textContent = `${requirementsData.completionPercentage || 0}%`;

        let html = '';

        // Submitted Requirements
        if (requirementsData.submitted && requirementsData.submitted.length > 0) {
            html += `
                <div class="requirements-grid submitted-grid">
                    <h4><i class="fas fa-check-circle" style="color: #10b981;"></i> Submitted Requirements</h4>
                    <div class="requirements-list">
                        ${requirementsData.submitted.map(req => `
                            <div class="requirement-item submitted">
                                <div class="requirement-icon" style="background: #10b98120;">
                                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                                </div>
                                <div class="requirement-info">
                                    <div class="requirement-name">${req.name || 'Unnamed'}</div>
                                    <div class="requirement-status">
                                        <span class="status-badge-submitted">
                                            <i class="fas fa-check-circle"></i> Submitted
                                        </span>
                                        ${req.is_required ? 
                                            '<span class="requirement-badge badge-required">Required</span>' : 
                                            '<span class="requirement-badge badge-optional">Optional</span>'
                                        }
                                    </div>
                                </div>
                                ${req.file_path ? `
                                    <div class="requirement-actions">
                                        <button class="btn-view-file" onclick="viewFile('${req.file_path}')">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Missing Requirements
        if (requirementsData.missing && requirementsData.missing.length > 0) {
            html += `
                <div class="requirements-grid missing-grid">
                    <h4><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Missing Requirements</h4>
                    <div class="requirements-list">
                        ${requirementsData.missing.map(req => `
                            <div class="requirement-item missing">
                                <div class="requirement-icon" style="background: #fee2e2;">
                                    <i class="fas fa-times-circle" style="color: #dc2626;"></i>
                                </div>
                                <div class="requirement-info">
                                    <div class="requirement-name">${req.name || 'Unnamed'}</div>
                                    <div class="requirement-status">
                                        <span class="status-badge-missing">
                                            <i class="fas fa-times-circle"></i> Not Submitted
                                        </span>
                                        ${req.is_required ? 
                                            '<span class="requirement-badge badge-required">Required</span>' : 
                                            '<span class="requirement-badge badge-optional">Optional</span>'
                                        }
                                        ${req.can_be_followed ? 
                                            '<span class="requirement-badge badge-follow">Can be followed</span>' : ''
                                        }
                                    </div>
                                </div>
                                <div class="requirement-actions">
                                    <button class="btn-notify" onclick="notifyRequirement('${req.name || 'Requirement'}')">
                                        <i class="fas fa-bell"></i> Notify
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // No requirements
        if (!requirementsData.totalRequirements || requirementsData.totalRequirements === 0) {
            html = `
                <div class="no-requirements">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No specific requirements found for ${requirementsData.gradeLevel || 'N/A'} - ${requirementsData.studentType || 'N/A'}</p>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Render history
    function renderHistory() {
        const tbody = document.getElementById('historyBody');
        const historyCount = document.getElementById('historyCount');
        
        if (!tbody) return;
        
        if (historyCount) {
            historyCount.textContent = `${historyData.length} records`;
        }

        if (historyData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="no-data">
                            <i class="fas fa-history"></i>
                            <p>No previous enrollment records found.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        historyData.forEach(record => {
            const statusClass = record.status ? record.status.toLowerCase() : 'pending';
            html += `
                <tr>
                    <td>${record.school_year || 'N/A'}</td>
                    <td>${record.grade_name || 'N/A'}</td>
                    <td>${record.strand || '—'}</td>
                    <td>
                        <span class="badge badge-${statusClass}">
                            ${record.status || 'Pending'}
                        </span>
                    </td>
                    <td>${formatDate(record.created_at)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Notify requirement
    window.notifyRequirement = function(requirementName) {
        if (!requirementName) return;
        
        if (confirm(`Send notification to ${enrollmentData.studentName} about missing requirement: "${requirementName}"?`)) {
            showAlert(`✅ Notification sent to ${enrollmentData.studentName}`, 'success');
        }
    };

    // View file (modal)
    window.viewFile = function(filePath) {
        if (!filePath) {
            showAlert('No file available to view.', 'error');
            return;
        }
        
        const modal = document.getElementById('filePreviewModal');
        const modalBody = document.getElementById('modalBody');
        const downloadBtn = document.getElementById('downloadFileBtn');
        
        if (!modal || !modalBody) {
            showAlert('File preview is not available.', 'error');
            return;
        }
        
        // Show loading
        modalBody.innerHTML = `
            <div class="file-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading file...</p>
            </div>
        `;
        
        modal.classList.add('show');
        
        // Simulate file load
        setTimeout(() => {
            const fileName = filePath.split('/').pop() || 'file';
            const fileNameEl = document.getElementById('modalFileName');
            if (fileNameEl) {
                fileNameEl.textContent = fileName;
            }
            if (downloadBtn) {
                downloadBtn.href = filePath;
            }
            
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-file-alt" style="font-size: 48px; color: #1B2A4A; margin-bottom: 12px;"></i>
                    <p style="color: #64748b; font-size: 14px;">File: <strong>${fileName}</strong></p>
                    <p style="color: #94a3b8; font-size: 13px;">Click "Download" to view or save the file.</p>
                    <div style="margin-top: 16px; background: #f1f5f9; padding: 16px; border-radius: 8px;">
                        <i class="fas fa-info-circle" style="color: #1B2A4A;"></i>
                        <span style="color: #475569; font-size: 13px;">File preview will be available in the full version.</span>
                    </div>
                </div>
            `;
        }, 800);
    };

    // Close file modal
    window.closeFileModal = function() {
        const modal = document.getElementById('filePreviewModal');
        if (modal) {
            modal.classList.remove('show');
        }
    };

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('filePreviewModal');
        if (modal && e.target === modal) {
            closeFileModal();
        }
    });

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (sidebar && menuToggle) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        }
    });

    // ===== INIT =====

    renderStudentInfo();
    renderEnrollmentInfo();
    renderRequirements();
    renderHistory();
});