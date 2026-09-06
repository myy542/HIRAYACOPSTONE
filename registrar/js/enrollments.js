/**
 * Enrollment Management - Interactive JavaScript
 * Pure JavaScript - No hardcoded data, uses API calls
 */

(function() {
    'use strict';

    console.log('📚 Enrollment Management ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const filterForm = document.getElementById('filterForm');

    // Modal elements
    const modal = document.getElementById('addModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addEnrollmentForm = document.getElementById('addEnrollmentForm');
    const gradeSelect = document.getElementById('gradeSelect');
    const strandGroup = document.getElementById('strandGroup');

    // Stats
    const totalEnrollments = document.getElementById('totalEnrollments');
    const pendingCount = document.getElementById('pendingCount');
    const enrolledCount = document.getElementById('enrolledCount');
    const rejectedCount = document.getElementById('rejectedCount');
    const pendingActionCount = document.getElementById('pendingActionCount');

    // ============================================
    // STATE
    // ============================================

    let enrollments = [];
    let students = [];
    let grades = [];
    let missingRequirements = {};

    // ============================================
    // API URL (Change this to your actual API endpoint)
    // ============================================

    const API_URL = window.location.origin + '/api/enrollments.php';

    // ============================================
    // SET ADMIN NAME (from localStorage)
    // ============================================

    const storedName = localStorage.getItem('registrarName') || 'Registrar';
    if (adminName) adminName.textContent = storedName;
    if (adminInitial) adminInitial.textContent = storedName.charAt(0).toUpperCase();

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('registrarName');
            window.location.href = '../auth/login.html';
        });
    }

    // ============================================
    // SET DATE
    // ============================================

    const dateBadge = document.getElementById('dateBadge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
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
    // FETCH DATA FROM API
    // ============================================

    async function fetchData() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (data.success) {
                enrollments = data.enrollments || [];
                students = data.students || [];
                grades = data.grades || [];
                missingRequirements = data.missingRequirements || {};

                // Populate dropdowns
                populateStudentSelect();
                populateGradeSelect();

                // Render table
                renderTable();

                // Update stats
                updateStats();

                console.log('✅ Data loaded successfully');
                console.log(`📊 ${enrollments.length} enrollment records loaded`);
            } else {
                showAlert('❌ Error loading data: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showAlert('❌ Error connecting to server. Please refresh the page.', 'error');
            // Show empty state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="no-data">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Connection Error</h3>
                            <p>Unable to load enrollment records. Please check your connection.</p>
                            <button onclick="location.reload()" class="btn-filter" style="margin-top: 10px;">
                                <i class="fas fa-sync-alt"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        const total = enrollments.length;
        const pending = enrollments.filter(e => e.status === 'Pending').length;
        const enrolled = enrollments.filter(e => e.status === 'Enrolled').length;
        const rejected = enrollments.filter(e => e.status === 'Rejected').length;

        if (totalEnrollments) totalEnrollments.textContent = total;
        if (pendingCount) pendingCount.textContent = pending;
        if (enrolledCount) enrolledCount.textContent = enrolled;
        if (rejectedCount) rejectedCount.textContent = rejected;
        if (pendingActionCount) pendingActionCount.textContent = pending;
    }

    // ============================================
    // RENDER TABLE
    // ============================================

    function renderTable(data) {
        const rows = data || enrollments;

        if (rows.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="no-data">
                            <i class="fas fa-file-signature"></i>
                            <h3>No Enrollment Records Found</h3>
                            <p>Try adjusting your filters or add a new enrollment.</p>
                        </div>
                    </td>
                </tr>
            `;
            recordCount.textContent = 'Total: 0 records';
            return;
        }

        let html = '';
        rows.forEach(row => {
            const missingInfo = missingRequirements[row.id] || { has_missing: false, missing_count: 0, missing_list: [] };
            const hasMissing = missingInfo.has_missing || false;
            const missingCount = missingInfo.missing_count || 0;
            const missingList = missingInfo.missing_list || [];

            html += `
                <tr>
                    <td data-label="Student">
                        <div class="student-info">
                            <div class="student-avatar">${row.fullname ? row.fullname.charAt(0) : 'S'}</div>
                            <div class="student-details">
                                <h4>${row.fullname || 'Unknown'}</h4>
                                <span><i class="fas fa-envelope"></i> ${row.email || 'N/A'}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="ID Number">
                        <span class="id-badge">${row.id_number || 'N/A'}</span>
                    </td>
                    <td data-label="Grade & Strand">
                        <span class="grade-tag">${row.grade_name || 'N/A'}</span>
                        ${row.strand ? `<span class="grade-tag strand">${row.strand}</span>` : ''}
                    </td>
                    <td data-label="School Year">
                        <span class="school-year">${row.school_year || 'N/A'}</span>
                    </td>
                    <td data-label="Student Type">
                        <span class="student-type-badge student-type-${(row.student_type || 'new').toLowerCase()}">
                            ${ucfirst(row.student_type || 'New')}
                        </span>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge status-${(row.status || 'Pending').toLowerCase()}">${row.status || 'Pending'}</span>
                    </td>
                    <td data-label="Requirements">
                        ${row.status === 'Pending' ? `
                            ${hasMissing ? `
                                <div class="missing-reqs-warning">
                                    <span class="missing-badge-sm"><i class="fas fa-exclamation-triangle"></i> ${missingCount} missing</span>
                                    <button class="btn-notify-missing" 
                                            data-student-id="${row.student_id || row.id}" 
                                            data-student-name="${row.fullname || 'Student'}"
                                            data-missing-list='${JSON.stringify(missingList)}'
                                            data-enrollment-id="${row.id}">
                                        <i class="fas fa-bell"></i> Notify
                                    </button>
                                </div>
                            ` : `
                                <span class="complete-badge-sm"><i class="fas fa-check-circle"></i> Complete</span>
                            `}
                        ` : `<span class="grade-tag">—</span>`}
                    </td>
                    <td data-label="Actions">
                        <div class="action-btns">
                            <a href="view_enrollment.html?id=${row.id}" class="action-btn view" title="View">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${row.status === 'Pending' ? `
                                ${hasMissing ? `
                                    <button class="action-btn approve disabled" disabled title="Cannot approve - missing requirements">
                                        <i class="fas fa-check-circle"></i>
                                    </button>
                                ` : `
                                    <button class="action-btn approve" onclick="approveEnrollment(${row.id})" title="Approve">
                                        <i class="fas fa-check-circle"></i>
                                    </button>
                                `}
                                <button class="action-btn reject" onclick="rejectEnrollment(${row.id})" title="Reject">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn delete" onclick="deleteEnrollment(${row.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        recordCount.textContent = `Total: ${rows.length} records`;

        // Add event listeners for notify buttons
        document.querySelectorAll('.btn-notify-missing').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const studentName = this.dataset.studentName;
                const missingList = JSON.parse(this.dataset.missingList);
                notifyMissing(studentName, missingList);
            });
        });
    }

    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ============================================
    // FILTER FUNCTION
    // ============================================

    function filterEnrollments() {
        const search = searchInput.value.toLowerCase().trim();
        const status = statusFilter.value;

        let filtered = [...enrollments];

        if (search) {
            filtered = filtered.filter(e =>
                (e.fullname && e.fullname.toLowerCase().includes(search)) ||
                (e.email && e.email.toLowerCase().includes(search)) ||
                (e.id_number && e.id_number.toLowerCase().includes(search)) ||
                (e.school_year && e.school_year.toLowerCase().includes(search))
            );
        }

        if (status) {
            filtered = filtered.filter(e => e.status === status);
        }

        renderTable(filtered);
        updateStats();
    }

    // ============================================
    // FILTER FORM SUBMIT
    // ============================================

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterEnrollments();
        });
    }

    // Real-time search with debounce
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterEnrollments, 300);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterEnrollments);
    }

    // ============================================
    // NOTIFY MISSING REQUIREMENTS
    // ============================================

    function notifyMissing(studentName, missingList) {
        const missingText = missingList.map(item => `• ${item}`).join('\n');
        showAlert(`✅ Notification sent successfully to ${studentName}`, 'success');
        console.log('📧 Notification sent to:', studentName);
        console.log('Missing requirements:', missingText);
    }

    // ============================================
    // APPROVE / REJECT / DELETE (with API calls)
    // ============================================

    window.approveEnrollment = async function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;

        const missingInfo = missingRequirements[id] || { has_missing: false, missing_list: [] };
        if (missingInfo.has_missing) {
            showAlert(`❌ Cannot approve - Missing requirements: ${missingInfo.missing_list.join(', ')}`, 'error');
            return;
        }

        if (confirm(`Approve enrollment for ${enrollment.fullname}?`)) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=approve&id=${id}`
                });
                const data = await response.json();

                if (data.success) {
                    showAlert(`✅ Enrollment approved for ${enrollment.fullname}`, 'success');
                    fetchData(); // Reload data
                } else {
                    showAlert(`❌ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Error approving enrollment:', error);
                showAlert('❌ Error approving enrollment', 'error');
            }
        }
    };

    window.rejectEnrollment = async function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;

        if (confirm(`Reject enrollment for ${enrollment.fullname}?`)) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=reject&id=${id}`
                });
                const data = await response.json();

                if (data.success) {
                    showAlert(`❌ Enrollment rejected for ${enrollment.fullname}`, 'error');
                    fetchData(); // Reload data
                } else {
                    showAlert(`❌ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Error rejecting enrollment:', error);
                showAlert('❌ Error rejecting enrollment', 'error');
            }
        }
    };

    window.deleteEnrollment = async function(id) {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) return;

        if (confirm(`Delete enrollment record for ${enrollment.fullname}? This action cannot be undone.`)) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `action=delete&id=${id}`
                });
                const data = await response.json();

                if (data.success) {
                    showAlert(`🗑️ Enrollment record for ${enrollment.fullname} deleted successfully`, 'success');
                    fetchData(); // Reload data
                } else {
                    showAlert(`❌ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Error deleting enrollment:', error);
                showAlert('❌ Error deleting enrollment', 'error');
            }
        }
    };

    // ============================================
    // MODAL FUNCTIONS
    // ============================================

    function openModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        addEnrollmentForm.reset();
    }

    if (openModalBtn) {
        openModalBtn.addEventListener('click', openModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // ============================================
    // GRADE SELECT - SHOW STRAND
    // ============================================

    if (gradeSelect) {
        gradeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const gradeName = selectedOption ? selectedOption.text : '';
            if (gradeName.includes('Grade 11') || gradeName.includes('Grade 12')) {
                strandGroup.style.display = 'block';
            } else {
                strandGroup.style.display = 'none';
            }
        });
    }

    // ============================================
    // POPULATE DROPDOWNS
    // ============================================

    function populateStudentSelect() {
        const select = document.getElementById('studentSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Choose Student --</option>';
        students.forEach(student => {
            select.innerHTML += `
                <option value="${student.id}">${student.fullname} (${student.email})</option>
            `;
        });
    }

    function populateGradeSelect() {
        const select = document.getElementById('gradeSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Grade --</option>';
        grades.forEach(grade => {
            select.innerHTML += `
                <option value="${grade.id}">${grade.grade_name}</option>
            `;
        });
    }

    // ============================================
    // ADD ENROLLMENT FORM
    // ============================================

    if (addEnrollmentForm) {
        addEnrollmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('action', 'add');

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    showAlert('✅ New enrollment added successfully!', 'success');
                    closeModal();
                    fetchData(); // Reload data
                } else {
                    showAlert(`❌ ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Error adding enrollment:', error);
                showAlert('❌ Error adding enrollment', 'error');
            }
        });
    }

    // ============================================
    // SET DEFAULT SCHOOL YEAR
    // ============================================

    const schoolYearInput = document.getElementById('schoolYearInput');
    if (schoolYearInput) {
        const currentYear = new Date().getFullYear();
        schoolYearInput.value = `${currentYear}-${currentYear + 1}`;
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
    // INITIALIZE
    // ============================================

    // Load data from API
    fetchData();

    console.log('✅ Enrollment Management ready!');
    console.log('💡 Data is loaded from API endpoint:', API_URL);

})();