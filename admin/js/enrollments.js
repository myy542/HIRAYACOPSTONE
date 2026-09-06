// ===== ENROLLMENTS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const alertContainer = document.getElementById('alertContainer');
    const filterForm = document.getElementById('filterForm');
    const statusFilter = document.getElementById('statusFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    const strandFilter = document.getElementById('strandFilter');
    const searchInput = document.getElementById('searchInput');

    // Modal Elements
    const rejectModal = document.getElementById('rejectModal');
    const rejectForm = document.getElementById('rejectForm');
    const rejectEnrollmentId = document.getElementById('rejectEnrollmentId');
    const rejectStudentName = document.getElementById('rejectStudentName');
    const rejectionReason = document.getElementById('rejectionReason');

    // ===== DATA =====

    let enrollments = [
        {
            id: 1,
            student_id: 1,
            fullname: 'Juan Dela Cruz',
            email: 'juan.dela@plshs.edu.ph',
            id_number: 'PLSNHS-2026-0000001',
            grade_name: 'Grade 11',
            strand: 'STEM',
            school_year: '2026-2027',
            status: 'Enrolled',
            created_at: '2026-06-23 10:30:00',
            student_profile_pic: null,
            has_missing: false,
            missing_count: 0,
            missing_list: []
        },
        {
            id: 2,
            student_id: 2,
            fullname: 'Maria Santos',
            email: 'maria.santos@plshs.edu.ph',
            id_number: 'PLSNHS-2026-0000002',
            grade_name: 'Grade 10',
            strand: null,
            school_year: '2026-2027',
            status: 'Enrolled',
            created_at: '2026-06-22 14:20:00',
            student_profile_pic: null,
            has_missing: false,
            missing_count: 0,
            missing_list: []
        },
        {
            id: 3,
            student_id: 3,
            fullname: 'Carlos Mendoza',
            email: 'carlos.m@plshs.edu.ph',
            id_number: null,
            grade_name: 'Grade 12',
            strand: 'ABM',
            school_year: '2026-2027',
            status: 'Pending',
            created_at: '2026-06-21 09:00:00',
            student_profile_pic: null,
            has_missing: true,
            missing_count: 1,
            missing_list: ['Good Moral Certificate']
        },
        {
            id: 4,
            student_id: 4,
            fullname: 'Elena Garcia',
            email: 'elena.g@plshs.edu.ph',
            id_number: 'PLSNHS-2026-0000003',
            grade_name: 'Grade 11',
            strand: 'HUMSS',
            school_year: '2026-2027',
            status: 'Rejected',
            created_at: '2026-06-20 16:00:00',
            student_profile_pic: null,
            has_missing: false,
            missing_count: 0,
            missing_list: []
        },
        {
            id: 5,
            student_id: 5,
            fullname: 'Ana Reyes',
            email: 'ana.reyes@plshs.edu.ph',
            id_number: 'PLSNHS-2026-0000004',
            grade_name: 'Grade 9',
            strand: null,
            school_year: '2026-2027',
            status: 'Pending',
            created_at: '2026-06-19 11:00:00',
            student_profile_pic: null,
            has_missing: false,
            missing_count: 0,
            missing_list: []
        }
    ];

    // ===== FUNCTIONS =====

    function updateStats() {
        const total = enrollments.length;
        const pending = enrollments.filter(e => e.status === 'Pending').length;
        const enrolled = enrollments.filter(e => e.status === 'Enrolled').length;
        const rejected = enrollments.filter(e => e.status === 'Rejected').length;

        document.getElementById('totalEnrollments').textContent = total;
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('enrolledCount').textContent = enrolled;
        document.getElementById('rejectedCount').textContent = rejected;
    }

    function renderTable() {
        const status = statusFilter.value;
        const grade = gradeFilter.value;
        const strand = strandFilter.value;
        const search = searchInput.value.toLowerCase().trim();

        let filtered = [...enrollments];

        if (status) {
            filtered = filtered.filter(e => e.status === status);
        }
        if (grade) {
            filtered = filtered.filter(e => e.grade_name.includes(grade));
        }
        if (strand) {
            filtered = filtered.filter(e => e.strand === strand);
        }
        if (search) {
            filtered = filtered.filter(e => 
                e.fullname.toLowerCase().includes(search) || 
                e.email.toLowerCase().includes(search) ||
                (e.id_number && e.id_number.toLowerCase().includes(search))
            );
        }

        recordCount.textContent = `Total: ${filtered.length} records`;

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="no-data">
                            <i class="fas fa-file-signature"></i>
                            <h3>No Enrollments Found</h3>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(enrollment => {
            const date = new Date(enrollment.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const initial = enrollment.fullname.charAt(0).toUpperCase();

            // Requirements
            let requirementsHtml = '';
            if (enrollment.has_missing && enrollment.status === 'Pending') {
                requirementsHtml = `
                    <div class="requirements-warning">
                        <span class="missing-badge"><i class="fas fa-exclamation-triangle"></i> ${enrollment.missing_count} missing</span>
                        <button class="btn-notify-missing" 
                                data-student-name="${enrollment.fullname}"
                                data-missing-list='${JSON.stringify(enrollment.missing_list)}'>
                            <i class="fas fa-bell"></i> Notify
                        </button>
                    </div>
                `;
            } else if (enrollment.status === 'Pending') {
                requirementsHtml = `<span class="complete-badge"><i class="fas fa-check-circle"></i> Complete</span>`;
            } else {
                requirementsHtml = `<span class="grade-tag">—</span>`;
            }

            // Status badge
            const statusClass = `badge-${enrollment.status.toLowerCase()}`;

            // ===== ACTION BUTTONS - 4 BUTTONS PER ROW =====
            let actionsHtml = '';
            
            // For Pending status: Approve, Reject, View, Delete
            if (enrollment.status === 'Pending') {
                // Approve button
                if (enrollment.has_missing) {
                    actionsHtml += `<button class="action-btn approve disabled" disabled title="Cannot approve - missing requirements"><i class="fas fa-check"></i></button>`;
                } else {
                    actionsHtml += `<button class="action-btn approve" onclick="window.approveEnrollment(${enrollment.id})" title="Approve"><i class="fas fa-check"></i></button>`;
                }
                
                // Reject button
                actionsHtml += `<button class="action-btn reject" onclick="window.openRejectModal(${enrollment.id}, '${enrollment.fullname}')" title="Reject"><i class="fas fa-times"></i></button>`;
                
                // View button
                actionsHtml += `<button class="action-btn view" onclick="window.viewEnrollment(${enrollment.id})" title="View Details"><i class="fas fa-eye"></i></button>`;
                
                // Delete button
                actionsHtml += `<button class="action-btn delete" onclick="window.deleteEnrollment(${enrollment.id})" title="Delete"><i class="fas fa-trash"></i></button>`;
            }
            
            // For Enrolled or Rejected status: Pending, View, Delete (3 buttons)
            // But we want 4 buttons, so we add a spacer or make them wider
            else {
                // Pending button (move back to pending)
                actionsHtml += `<button class="action-btn pending" onclick="window.pendingEnrollment(${enrollment.id})" title="Move to Pending"><i class="fas fa-undo-alt"></i></button>`;
                
                // View button
                actionsHtml += `<button class="action-btn view" onclick="window.viewEnrollment(${enrollment.id})" title="View Details"><i class="fas fa-eye"></i></button>`;
                
                // Delete button
                actionsHtml += `<button class="action-btn delete" onclick="window.deleteEnrollment(${enrollment.id})" title="Delete"><i class="fas fa-trash"></i></button>`;
                
                // Add a spacer to make it 4 buttons (empty button with same width)
                actionsHtml += `<span class="action-spacer"></span>`;
            }

            html += `
                <tr>
                    <td>
                        <div class="student-info">
                            <div class="student-avatar">${initial}</div>
                            <div class="student-details">
                                <h4>${enrollment.fullname}</h4>
                                <span><i class="fas fa-envelope"></i> ${enrollment.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${enrollment.id_number ? `<span class="id-badge">${enrollment.id_number}</span>` : `<span class="grade-tag">Not assigned</span>`}
                    </td>
                    <td>
                        <span class="grade-tag">${enrollment.grade_name}</span>
                        ${enrollment.strand ? `<span class="strand-tag">${enrollment.strand}</span>` : ''}
                    </td>
                    <td><span class="grade-tag">${enrollment.school_year}</span></td>
                    <td><span class="badge ${statusClass}">${enrollment.status}</span></td>
                    <td>${requirementsHtml}</td>
                    <td><span class="grade-tag">${formattedDate}</span></td>
                    <td>
                        <div class="action-btns">
                            ${actionsHtml}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;

        // Add event listeners for notify buttons
        document.querySelectorAll('.btn-notify-missing').forEach(btn => {
            btn.addEventListener('click', function() {
                const studentName = this.dataset.studentName;
                const missingList = JSON.parse(this.dataset.missingList);
                notifyMissing(studentName, missingList);
            });
        });
    }

    // ===== ACTION FUNCTIONS =====

    window.approveEnrollment = function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;
        
        if (enrollment.has_missing) {
            showAlert('Cannot approve - missing required requirements.', 'error');
            return;
        }

        if (confirm(`Approve enrollment for ${enrollment.fullname}?`)) {
            enrollment.status = 'Enrolled';
            if (!enrollment.id_number) {
                enrollment.id_number = `PLSNHS-2026-${String(enrollments.length + 1).padStart(7, '0')}`;
            }
            showAlert(`✅ Enrollment approved successfully! Student ID: ${enrollment.id_number}`, 'success');
            updateStats();
            renderTable();
        }
    };

    window.openRejectModal = function(id, name) {
        rejectEnrollmentId.value = id;
        rejectStudentName.value = name;
        rejectionReason.value = '';
        rejectModal.classList.add('show');
    };

    window.closeRejectModal = function() {
        rejectModal.classList.remove('show');
    };

    if (rejectForm) {
        rejectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(rejectEnrollmentId.value);
            const reason = rejectionReason.value.trim();

            if (!reason) {
                showAlert('Please provide a reason for rejection.', 'error');
                return;
            }

            const enrollment = enrollments.find(e => e.id === id);
            if (enrollment) {
                enrollment.status = 'Rejected';
                showAlert(`✅ Enrollment rejected. Notification sent to ${enrollment.fullname}.`, 'success');
                closeRejectModal();
                updateStats();
                renderTable();
            }
        });
    }

    window.pendingEnrollment = function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;

        if (confirm(`Change status to pending for ${enrollment.fullname}?`)) {
            enrollment.status = 'Pending';
            showAlert(`🔄 Enrollment status updated to pending.`, 'success');
            updateStats();
            renderTable();
        }
    };

    window.viewEnrollment = function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (enrollment) {
            window.location.href = `view_enrollment.html?id=${enrollment.id}`;
        }
    };

    window.deleteEnrollment = function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;

        if (confirm(`Delete enrollment record for ${enrollment.fullname}?`)) {
            enrollments = enrollments.filter(e => e.id !== id);
            showAlert('✅ Enrollment record deleted successfully!', 'success');
            updateStats();
            renderTable();
        }
    };

    // ===== NOTIFY =====

    function notifyMissing(studentName, missingList) {
        const missingText = missingList.map(req => `• ${req}`).join('\n');
        
        if (confirm(`Send notification to ${studentName} about missing requirements?\n\nMissing:\n${missingText}`)) {
            showAlert(`✅ Notification sent successfully to ${studentName}`, 'success');
        }
    }

    // ===== FILTERS =====

    window.resetFilters = function() {
        statusFilter.value = '';
        gradeFilter.value = '';
        strandFilter.value = '';
        searchInput.value = '';
        renderTable();
    };

    // ===== ALERT =====

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

    // ===== EVENT LISTENERS =====

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderTable();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderTable();
        });
    }

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        if (e.target === rejectModal) {
            closeRejectModal();
        }
    });

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== INIT =====

    updateStats();
    renderTable();
});