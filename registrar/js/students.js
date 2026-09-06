/**
 * Students Management - Interactive JavaScript
 * No hardcoded data - all data comes from PHP via window.studentsData
 */

(function() {
    'use strict';

    console.log('📚 Students Management ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Stats
    const totalStudents = document.getElementById('totalStudents');
    const enrolledStudents = document.getElementById('enrolledStudents');
    const pendingStudents = document.getElementById('pendingStudents');
    const rejectedStudents = document.getElementById('rejectedStudents');
    const noEnrollment = document.getElementById('noEnrollment');

    // Filters
    const gradeFilter = document.getElementById('gradeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const filterForm = document.getElementById('filterForm');

    // Table
    const tableBody = document.getElementById('tableBody');
    const badgeOld = document.getElementById('badgeOld');
    const badgeNew = document.getElementById('badgeNew');
    const badgeCount = document.getElementById('badgeCount');

    // Export
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const printBtn = document.getElementById('printBtn');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.studentsData || {
        students: [],
        grade_levels: [],
        stats: {
            total: 0,
            enrolled: 0,
            pending: 0,
            rejected: 0,
            no_enrollment: 0
        },
        student_stats: {
            old: 0,
            new: 0
        },
        filters: {
            grade: '',
            status: '',
            search: ''
        }
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
    // LOAD DATA
    // ============================================

    function loadData() {
        // Stats
        if (totalStudents) totalStudents.textContent = data.stats.total;
        if (enrolledStudents) enrolledStudents.textContent = data.stats.enrolled;
        if (pendingStudents) pendingStudents.textContent = data.stats.pending;
        if (rejectedStudents) rejectedStudents.textContent = data.stats.rejected;
        if (noEnrollment) noEnrollment.textContent = data.stats.no_enrollment;

        // Badges
        if (badgeOld) badgeOld.textContent = `Old: ${data.student_stats.old}`;
        if (badgeNew) badgeNew.textContent = `New: ${data.student_stats.new}`;
        if (badgeCount) badgeCount.textContent = `Total: ${data.students.length} students`;

        // Populate grade filter
        populateGradeFilter();

        // Set filter values
        if (gradeFilter) gradeFilter.value = data.filters.grade || '';
        if (statusFilter) statusFilter.value = data.filters.status || '';
        if (searchInput) searchInput.value = data.filters.search || '';

        // Render students
        renderStudents();
    }

    // ============================================
    // POPULATE GRADE FILTER
    // ============================================

    function populateGradeFilter() {
        if (!gradeFilter) return;
        const grades = data.grade_levels || [];
        gradeFilter.innerHTML = '<option value="">All Grades</option>';
        grades.forEach(grade => {
            gradeFilter.innerHTML += `
                <option value="${grade.id}">${grade.grade_name}</option>
            `;
        });
    }

    // ============================================
    // RENDER STUDENTS
    // ============================================

    function renderStudents(filteredStudents) {
        const students = filteredStudents || data.students || [];

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="no-data">
                            <i class="fas fa-user-graduate"></i>
                            <h3>No Students Found</h3>
                            <p>No student records match your search criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        students.forEach(student => {
            const isOld = (student.total_enrollments > 1 && student.enrollment_id);
            const studentBadge = isOld ? '<span class="student-badge old">Old Student</span>' :
                                 (student.enrollment_id ? '<span class="student-badge new">New Student</span>' :
                                 '<span class="student-badge none">No Enrollment</span>');
            const studentColor = isOld ? '#28a745' : (student.enrollment_id ? '#007bff' : '#6c757d');
            const hasProfilePic = student.profile_picture && student.profile_picture !== '';
            const profilePicUrl = hasProfilePic ? `../${student.profile_picture}?t=${Date.now()}` : '';
            const initial = student.fullname ? student.fullname.charAt(0) : 'S';
            const rowClass = isOld ? 'old-student-row' : (student.enrollment_id ? 'new-student-row' : '');

            // Build grade and strand display
            let gradeDisplay = '';
            if (student.grade_name) {
                gradeDisplay = `<span class="grade-tag">${student.grade_name}</span>`;
                if (student.strand) {
                    gradeDisplay += ` <span class="strand-tag">${student.strand}</span>`;
                }
            } else {
                gradeDisplay = `<span class="badge-none">Not enrolled</span>`;
            }

            // Build status display
            let statusDisplay = '';
            if (student.enrollment_status) {
                statusDisplay = `<span class="status-badge status-${student.enrollment_status.toLowerCase()}">${student.enrollment_status}</span>`;
            } else {
                statusDisplay = `<span class="status-badge status-none">No record</span>`;
            }

            // Build school year display
            const schoolYearDisplay = student.school_year ? 
                `<span class="school-year">${student.school_year}</span>` : 
                `<span class="school-year">—</span>`;

            html += `
                <tr class="${rowClass}">
                    <td data-label="Student" class="student-cell">
                        <div class="student-info">
                            ${hasProfilePic ? `
                                <div class="student-avatar-img">
                                    <img src="${profilePicUrl}" alt="Profile">
                                </div>
                            ` : `
                                <div class="student-avatar" style="background: ${studentColor};">${initial}</div>
                            `}
                            <div class="student-details">
                                <h4>${student.fullname || 'Unknown'}</h4>
                                <span><i class="fas fa-envelope"></i> ${student.email || 'N/A'}</span>
                                ${student.total_enrollments > 1 ? `
                                    <span class="enrollment-count">
                                        <i class="fas fa-history"></i> ${student.total_enrollments} enrollments
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </td>
                    <td data-label="ID Number" class="id-cell">
                        <span class="id-badge">${student.id_number || 'N/A'}</span>
                    </td>
                    <td data-label="Grade & Strand" class="grade-cell">
                        ${gradeDisplay}
                    </td>
                    <td data-label="Status" class="status-cell">
                        ${statusDisplay}
                    </td>
                    <td data-label="Student Type" class="type-cell">
                        ${studentBadge}
                    </td>
                    <td data-label="School Year" class="year-cell">
                        ${schoolYearDisplay}
                    </td>
                    <td data-label="Actions" class="actions-cell">
                        <div class="action-btns">
                            <a href="view_student.html?id=${student.id}" class="action-btn view" title="View Details">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="edit_student.html?id=${student.id}" class="action-btn edit" title="Edit">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button class="action-btn delete" onclick="deleteStudent(${student.id}, '${student.fullname}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // ============================================
    // FILTER STUDENTS
    // ============================================

    function filterStudents() {
        const grade = gradeFilter ? gradeFilter.value : '';
        const status = statusFilter ? statusFilter.value : '';
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = data.students || [];

        if (grade) {
            filtered = filtered.filter(s => s.grade_id && s.grade_id == grade);
        }

        if (status) {
            if (status === 'none') {
                filtered = filtered.filter(s => !s.enrollment_status);
            } else {
                filtered = filtered.filter(s => s.enrollment_status === status);
            }
        }

        if (search) {
            filtered = filtered.filter(s => 
                (s.fullname && s.fullname.toLowerCase().includes(search)) ||
                (s.email && s.email.toLowerCase().includes(search)) ||
                (s.id_number && s.id_number.toLowerCase().includes(search))
            );
        }

        renderStudents(filtered);

        // Update count
        if (badgeCount) badgeCount.textContent = `Total: ${filtered.length} students`;
    }

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterStudents();
        });
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterStudents, 300);
        });
    }

    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterStudents);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterStudents);
    }

    // ============================================
    // DELETE STUDENT
    // ============================================

    window.deleteStudent = function(id, name) {
        if (confirm(`Are you sure you want to delete student "${name}"? This will also delete all associated records.`)) {
            // Simulate AJAX request
            const index = data.students.findIndex(s => s.id === id);
            if (index !== -1) {
                data.students.splice(index, 1);
                data.stats.total--;
                updateStats();
                filterStudents();
                showAlert(`🗑️ Student "${name}" deleted successfully!`, 'success');
            }
        }
    };

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        if (totalStudents) totalStudents.textContent = data.stats.total;
        
        let enrolled = 0, pending = 0, rejected = 0, noEnroll = 0;
        data.students.forEach(s => {
            if (s.enrollment_status === 'Enrolled') enrolled++;
            else if (s.enrollment_status === 'Pending') pending++;
            else if (s.enrollment_status === 'Rejected') rejected++;
            else noEnroll++;
        });

        if (enrolledStudents) enrolledStudents.textContent = enrolled;
        if (pendingStudents) pendingStudents.textContent = pending;
        if (rejectedStudents) rejectedStudents.textContent = rejected;
        if (noEnrollment) noEnrollment.textContent = noEnroll;
    }

    // ============================================
    // EXPORT EXCEL
    // ============================================

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            const visibleStudents = document.querySelectorAll('#tableBody tr:not([style*="display: none"])');
            if (visibleStudents.length === 0) {
                showAlert('❌ No data to export.', 'error');
                return;
            }

            // Build CSV
            let csv = 'Student Name,ID Number,Email,Grade,Strand,Status,Student Type,School Year\n';
            
            data.students.forEach(s => {
                // Check if visible (filtered)
                const row = document.querySelector(`tr[data-student-id="${s.id}"]`);
                if (row && row.style.display === 'none') return;

                const studentType = (s.total_enrollments > 1 && s.enrollment_id) ? 'Old' :
                                   (s.enrollment_id ? 'New' : 'No Enrollment');
                
                csv += `"${s.fullname || ''}","${s.id_number || ''}","${s.email || ''}","${s.grade_name || ''}","${s.strand || ''}","${s.enrollment_status || 'No Record'}","${studentType}","${s.school_year || ''}"\n`;
            });

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            showAlert('✅ Students exported successfully!', 'success');
        });
    }

    // ============================================
    // PRINT REPORT
    // ============================================

    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const printContents = document.querySelector('.table-card').innerHTML;
            const originalContents = document.body.innerHTML;

            document.body.innerHTML = `
                <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h1 style="text-align: center; color: #0b2b4a;">Placido L. Señor NHS</h1>
                    <h2 style="text-align: center; color: #555;">Student Records</h2>
                    <div style="text-align: center; color: #666; margin-bottom: 20px;">
                        Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    ${printContents}
                </div>
            `;

            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        });
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
    // AUTO-HIDE ALERTS
    // ============================================

    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);

    // ============================================
    // INITIALIZE
    // ============================================

    loadData();

    console.log('✅ Students Management ready!');
    console.log(`👥 ${data.students.length} students loaded`);

})();