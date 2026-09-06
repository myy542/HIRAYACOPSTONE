// ===== STUDENTS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const filterForm = document.getElementById('filterForm');
    const gradeFilter = document.getElementById('gradeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const enrolleeType = document.getElementById('enrolleeType');
    const tabs = document.querySelectorAll('.tab-btn');

    // ===== DATA =====

    // Sample students data
    let students = [
        { 
            id: 1, 
            fullname: 'Juan Dela Cruz', 
            email: 'juan.dela@plshs.edu.ph', 
            id_number: 'PLSNHS-STU-000001', 
            profile_picture: null,
            total_enrollments: 1,
            current_enrollments: 1,
            previous_enrollments: 0,
            grade_name: 'Grade 11',
            strand: 'STEM',
            enrollment_status: 'Enrolled',
            enrolled_date: '2026-06-15 10:30:00',
            student_type: 'new'
        },
        { 
            id: 2, 
            fullname: 'Maria Santos', 
            email: 'maria.santos@plshs.edu.ph', 
            id_number: 'PLSNHS-STU-000002', 
            profile_picture: null,
            total_enrollments: 2,
            current_enrollments: 1,
            previous_enrollments: 1,
            grade_name: 'Grade 10',
            strand: null,
            enrollment_status: 'Enrolled',
            enrolled_date: '2026-06-14 09:00:00',
            student_type: 'old'
        },
        { 
            id: 3, 
            fullname: 'Carlos Mendoza', 
            email: 'carlos.m@plshs.edu.ph', 
            id_number: null, 
            profile_picture: null,
            total_enrollments: 1,
            current_enrollments: 1,
            previous_enrollments: 0,
            grade_name: 'Grade 12',
            strand: 'ABM',
            enrollment_status: 'Pending',
            enrolled_date: '2026-06-13 14:20:00',
            student_type: 'new'
        },
        { 
            id: 4, 
            fullname: 'Elena Garcia', 
            email: 'elena.g@plshs.edu.ph', 
            id_number: 'PLSNHS-STU-000003', 
            profile_picture: null,
            total_enrollments: 1,
            current_enrollments: 1,
            previous_enrollments: 0,
            grade_name: 'Grade 11',
            strand: 'HUMSS',
            enrollment_status: 'Rejected',
            enrolled_date: '2026-06-12 16:00:00',
            student_type: 'new'
        },
        { 
            id: 5, 
            fullname: 'Ana Reyes', 
            email: 'ana.reyes@plshs.edu.ph', 
            id_number: null, 
            profile_picture: null,
            total_enrollments: 0,
            current_enrollments: 0,
            previous_enrollments: 0,
            grade_name: null,
            strand: null,
            enrollment_status: null,
            enrolled_date: null,
            student_type: 'not_enrolled'
        },
        { 
            id: 6, 
            fullname: 'Ramon Cruz', 
            email: 'ramon.c@plshs.edu.ph', 
            id_number: 'PLSNHS-STU-000004', 
            profile_picture: null,
            total_enrollments: 3,
            current_enrollments: 1,
            previous_enrollments: 2,
            grade_name: 'Grade 12',
            strand: 'GAS',
            enrollment_status: 'Enrolled',
            enrolled_date: '2026-06-11 08:30:00',
            student_type: 'old'
        }
    ];

    // ===== FUNCTIONS =====

    // Update statistics
    function updateStats() {
        const total = students.length;
        const newStudents = students.filter(s => s.student_type === 'new').length;
        const oldStudents = students.filter(s => s.student_type === 'old').length;
        const notEnrolled = students.filter(s => s.student_type === 'not_enrolled').length;

        document.getElementById('totalStudents').textContent = total;
        document.getElementById('newStudents').textContent = newStudents;
        document.getElementById('oldStudents').textContent = oldStudents;
        document.getElementById('notEnrolled').textContent = notEnrolled;
    }

    // Get student type label
    function getStudentTypeLabel(type) {
        const labels = {
            'new': 'New Enrollee',
            'old': 'Old Enrollee',
            'not_enrolled': 'Not Enrolled'
        };
        return labels[type] || 'Unknown';
    }

    // Get student type icon
    function getStudentTypeIcon(type) {
        const icons = {
            'new': 'star-of-life',
            'old': 'history',
            'not_enrolled': 'user-slash'
        };
        return icons[type] || 'user';
    }

    // Get student type class
    function getStudentTypeClass(type) {
        const classes = {
            'new': 'new',
            'old': 'old',
            'not_enrolled': 'not-enrolled'
        };
        return classes[type] || '';
    }

    // Render table
    function renderTable() {
        const grade = gradeFilter.value;
        const status = statusFilter.value;
        const search = searchInput.value.toLowerCase().trim();
        const type = enrolleeType.value;

        let filtered = [...students];

        // Filter by type
        if (type !== 'all') {
            filtered = filtered.filter(s => s.student_type === type);
        }

        // Filter by grade
        if (grade) {
            const gradeNum = parseInt(grade);
            filtered = filtered.filter(s => s.grade_name && s.grade_name.includes(gradeNum));
        }

        // Filter by status
        if (status) {
            filtered = filtered.filter(s => s.enrollment_status === status);
        }

        // Filter by search
        if (search) {
            filtered = filtered.filter(s => 
                s.fullname.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search) ||
                (s.id_number && s.id_number.toLowerCase().includes(search))
            );
        }

        recordCount.textContent = `Total: ${filtered.length} students`;

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="no-data">
                            <i class="fas fa-user-graduate"></i>
                            <h3>No Students Found</h3>
                            <p>Click "Add New Student" to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(student => {
            const initial = student.fullname.charAt(0).toUpperCase();
            const typeClass = getStudentTypeClass(student.student_type);
            const typeIcon = getStudentTypeIcon(student.student_type);
            const typeLabel = getStudentTypeLabel(student.student_type);
            
            const hasEnrollment = student.enrollment_status !== null;
            const statusClass = student.enrollment_status ? student.enrollment_status.toLowerCase() : 'none';
            const statusLabel = student.enrollment_status || 'No record';
            const enrolledDate = student.enrolled_date ? 
                new Date(student.enrolled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                '—';

            html += `
                <tr>
                    <td>
                        <div class="student-info">
                            <div class="student-avatar ${typeClass}">${initial}</div>
                            <div class="student-details">
                                <h4>${student.fullname}</h4>
                                <span><i class="fas fa-envelope"></i> ${student.email}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="id-tag">${student.id_number || 'N/A'}</span></td>
                    <td><span class="type-badge ${typeClass}"><i class="fas fa-${typeIcon}"></i> ${typeLabel}</span></td>
                    <td>
                        ${student.grade_name ? 
                            `<span class="grade-tag">${student.grade_name}</span>` + 
                            (student.strand ? `<span class="strand-tag">${student.strand}</span>` : '') : 
                            `<span class="status-badge none">Not enrolled</span>`
                        }
                    </td>
                    <td>
                        ${hasEnrollment ? 
                            `<span class="status-badge ${statusClass}">${student.enrollment_status}</span>` : 
                            `<span class="status-badge none">No record</span>`
                        }
                    </td>
                    <td>${enrolledDate}</td>
                    <td>
                        <div class="action-btns">
                            <a href="view_student.html?id=${student.id}" class="action-btn view" title="View"><i class="fas fa-eye"></i></a>
                            <a href="edit_student.html?id=${student.id}" class="action-btn edit" title="Edit"><i class="fas fa-edit"></i></a>
                            <button class="action-btn delete" onclick="deleteStudent(${student.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // Delete student
    window.deleteStudent = function(id) {
        const student = students.find(s => s.id === id);
        if (!student) return;

        if (confirm(`Delete student "${student.fullname}"? This will also remove their enrollments.`)) {
            // Remove student
            students = students.filter(s => s.id !== id);
            showAlert('✅ Student deleted successfully!', 'success');
            updateStats();
            renderTable();
        }
    };

    // Reset filters
    window.resetFilters = function() {
        gradeFilter.value = '';
        statusFilter.value = '';
        searchInput.value = '';
        renderTable();
    };

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

    // ===== EVENT LISTENERS =====

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update type filter
            enrolleeType.value = this.dataset.type;
            renderTable();
        });
    });

    // Filter form
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderTable();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderTable();
        });
    }

    // Grade filter
    if (gradeFilter) {
        gradeFilter.addEventListener('change', function() {
            renderTable();
        });
    }

    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            renderTable();
        });
    }

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

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});