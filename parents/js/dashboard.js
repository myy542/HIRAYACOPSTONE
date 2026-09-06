// ===== PARENTS DASHBOARD JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const childrenGrid = document.getElementById('childrenGrid');
    const gradesBody = document.getElementById('gradesBody');
    const enrollmentList = document.getElementById('enrollmentList');

    // ===== DATA (Sample) =====

    // Parent's children
    const childrenData = [
        {
            id: 1,
            name: 'Juan Dela Cruz',
            grade_level: 'Grade 11 - STEM A',
            status: 'Enrolled',
            student_id: 'PLSNHS-STU-000001',
            school_year: '2026-2027',
            attendance: 95,
            average_grade: 92.5
        },
        {
            id: 2,
            name: 'Maria Dela Cruz',
            grade_level: 'Grade 9 - Section B',
            status: 'Enrolled',
            student_id: 'PLSNHS-STU-000002',
            school_year: '2026-2027',
            attendance: 88,
            average_grade: 88.75
        }
    ];

    // Grades data
    const gradesData = [
        { student: 'Juan Dela Cruz', subject: 'Mathematics', quarter: 1, grade: 94, remarks: 'Passed', date: '2026-06-15' },
        { student: 'Juan Dela Cruz', subject: 'Science', quarter: 1, grade: 91, remarks: 'Passed', date: '2026-06-15' },
        { student: 'Juan Dela Cruz', subject: 'English', quarter: 1, grade: 88, remarks: 'Passed', date: '2026-06-15' },
        { student: 'Maria Dela Cruz', subject: 'Mathematics', quarter: 1, grade: 86, remarks: 'Passed', date: '2026-06-15' },
        { student: 'Maria Dela Cruz', subject: 'Science', quarter: 1, grade: 90, remarks: 'Passed', date: '2026-06-15' },
        { student: 'Maria Dela Cruz', subject: 'English', quarter: 1, grade: 84, remarks: 'Passed', date: '2026-06-15' }
    ];

    // Enrollment status data
    const enrollmentData = [
        { student: 'Juan Dela Cruz', status: 'Enrolled', grade: 'Grade 11 - STEM A', school_year: '2026-2027', date_enrolled: '2026-06-10' },
        { student: 'Maria Dela Cruz', status: 'Enrolled', grade: 'Grade 9 - Section B', school_year: '2026-2027', date_enrolled: '2026-06-12' }
    ];

    // ===== FUNCTIONS =====

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

    // Update stats
    function updateStats() {
        const total = childrenData.length;
        const enrolled = childrenData.filter(c => c.status === 'Enrolled').length;
        const avgGrade = childrenData.reduce((sum, c) => sum + c.average_grade, 0) / total || 0;
        const avgAttendance = childrenData.reduce((sum, c) => sum + c.attendance, 0) / total || 0;

        document.getElementById('childrenCount').textContent = total;
        document.getElementById('enrolledCount').textContent = enrolled;
        document.getElementById('avgGrade').textContent = avgGrade.toFixed(2);
        document.getElementById('attendanceRate').textContent = Math.round(avgAttendance) + '%';
    }

    // Render children
    function renderChildren() {
        if (childrenData.length === 0) {
            childrenGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-child"></i>
                    <p>No children registered yet.</p>
                </div>
            `;
            return;
        }

        let html = '';
        childrenData.forEach(child => {
            const initial = child.name.charAt(0).toUpperCase();
            const statusClass = child.status.toLowerCase().replace(' ', '-');
            
            html += `
                <div class="child-card">
                    <div class="child-card-header">
                        <div class="child-avatar">${initial}</div>
                        <div class="child-info">
                            <h4>${child.name}</h4>
                            <div class="child-grade">${child.grade_level}</div>
                        </div>
                    </div>
                    <div class="child-details">
                        <div class="child-detail-item">
                            <i class="fas fa-id-card"></i>
                            ${child.student_id}
                        </div>
                        <div class="child-detail-item">
                            <i class="fas fa-calendar"></i>
                            ${child.school_year}
                        </div>
                        <div class="child-detail-item">
                            <i class="fas fa-star"></i>
                            Average: ${child.average_grade}%
                        </div>
                        <div class="child-detail-item">
                            <i class="fas fa-user-check"></i>
                            Attendance: ${child.attendance}%
                        </div>
                        <div class="child-detail-item">
                            <span class="status-badge status-${statusClass}">
                                ${child.status}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        childrenGrid.innerHTML = html;
    }

    // Render grades
    function renderGrades() {
        if (gradesData.length === 0) {
            gradesBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-data">
                            <i class="fas fa-star"></i>
                            <p>No grades available yet.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        gradesData.forEach(grade => {
            const gradeClass = grade.remarks === 'Passed' ? 'grade-passed' : 'grade-failed';
            const date = new Date(grade.date);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            html += `
                <tr>
                    <td><strong>${grade.student}</strong></td>
                    <td>${grade.subject}</td>
                    <td>${grade.quarter}</td>
                    <td class="${gradeClass}">${grade.grade}%</td>
                    <td>${grade.remarks}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });

        gradesBody.innerHTML = html;
    }

    // Render enrollment status
    function renderEnrollment() {
        if (enrollmentData.length === 0) {
            enrollmentList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-file-signature"></i>
                    <p>No enrollment records found.</p>
                </div>
            `;
            return;
        }

        let html = '';
        enrollmentData.forEach(enrollment => {
            const initial = enrollment.student.charAt(0).toUpperCase();
            const statusClass = enrollment.status.toLowerCase().replace(' ', '-');
            const date = new Date(enrollment.date_enrolled);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            html += `
                <div class="enrollment-item">
                    <div class="enrollment-item-left">
                        <div class="child-avatar-small">${initial}</div>
                        <div class="enrollment-info">
                            <h4>${enrollment.student}</h4>
                            <span>${enrollment.grade} • ${enrollment.school_year}</span>
                        </div>
                    </div>
                    <div>
                        <span class="status-badge status-${statusClass}">
                            ${enrollment.status}
                        </span>
                        <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">
                            <i class="far fa-calendar-alt"></i> ${formattedDate}
                        </span>
                    </div>
                </div>
            `;
        });

        enrollmentList.innerHTML = html;
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
    renderChildren();
    renderGrades();
    renderEnrollment();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});