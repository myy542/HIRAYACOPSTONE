// ===== VIEW SECTION JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');

    // ===== SECTION DATA =====

    const sectionData = {
        id: 1,
        section_name: 'Grade 10 - Section A',
        grade_name: 'Grade 10',
        adviser_name: 'Maria Santos'
    };

    // Students data
    const studentsData = [
        { id: 1, id_number: 'PLSNHS-STU-000001', fullname: 'Juan Dela Cruz', student_type: 'New', school_year: '2026-2027', status: 'Enrolled' },
        { id: 2, id_number: 'PLSNHS-STU-000002', fullname: 'Maria Santos', student_type: 'Continuing', school_year: '2026-2027', status: 'Enrolled' },
        { id: 3, id_number: 'PLSNHS-STU-000003', fullname: 'Carlos Mendoza', student_type: 'New', school_year: '2026-2027', status: 'Enrolled' },
        { id: 4, id_number: 'PLSNHS-STU-000004', fullname: 'Elena Garcia', student_type: 'Continuing', school_year: '2026-2027', status: 'Enrolled' }
    ];

    // Schedule data
    const scheduleData = {
        Monday: [
            { subject_name: 'Mathematics', teacher_name: 'Mr. Reyes', room: 'Room 101', start_time: '07:00:00', end_time: '08:00:00', quarter: 1 },
            { subject_name: 'Science', teacher_name: 'Ms. Santos', room: 'Room 102', start_time: '08:00:00', end_time: '09:00:00', quarter: 1 }
        ],
        Tuesday: [
            { subject_name: 'English', teacher_name: 'Mr. Cruz', room: 'Room 103', start_time: '07:00:00', end_time: '08:00:00', quarter: 1 },
            { subject_name: 'Filipino', teacher_name: 'Ms. Garcia', room: 'Room 104', start_time: '08:00:00', end_time: '09:00:00', quarter: 1 }
        ],
        Wednesday: [
            { subject_name: 'Araling Panlipunan', teacher_name: 'Mr. Mendoza', room: 'Room 105', start_time: '07:00:00', end_time: '08:00:00', quarter: 1 },
            { subject_name: 'MAPEH', teacher_name: 'Ms. Reyes', room: 'Room 106', start_time: '08:00:00', end_time: '09:00:00', quarter: 1 }
        ],
        Thursday: [
            { subject_name: 'Mathematics', teacher_name: 'Mr. Reyes', room: 'Room 101', start_time: '10:00:00', end_time: '11:00:00', quarter: 1 }
        ]
    };

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    // Format time
    function formatTime(timeString) {
        if (!timeString) return 'N/A';
        const date = new Date(`2000-01-01T${timeString}`);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Render section header
    function renderSectionHeader() {
        document.getElementById('sectionTitle').textContent = sectionData.section_name;
        document.getElementById('sectionGrade').textContent = sectionData.grade_name;
        document.getElementById('sectionAdviser').textContent = sectionData.adviser_name || 'Not Assigned';
        document.getElementById('totalStudents').textContent = studentsData.length;
        document.getElementById('totalSubjects').textContent = Object.values(scheduleData).reduce((acc, day) => acc + day.length, 0);
        
        // Stats
        document.getElementById('statStudents').textContent = studentsData.length;
        document.getElementById('statSubjects').textContent = Object.values(scheduleData).reduce((acc, day) => acc + day.length, 0);
        
        const activeDays = Object.keys(scheduleData).filter(day => scheduleData[day].length > 0).length;
        document.getElementById('statDays').textContent = activeDays;
    }

    // Render students
    function renderStudents() {
        const container = document.getElementById('studentsContainer');
        document.getElementById('studentCount').textContent = `${studentsData.length} Students`;

        if (studentsData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <h3>No Students Enrolled</h3>
                    <p>This section has no enrolled students yet.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="students-table">
                <thead>
                    <tr>
                        <th>ID Number</th>
                        <th>Full Name</th>
                        <th>Student Type</th>
                        <th>School Year</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        studentsData.forEach(student => {
            const statusClass = student.status.toLowerCase();
            html += `
                <tr>
                    <td>${student.id_number || 'N/A'}</td>
                    <td>${student.fullname}</td>
                    <td><span class="type-badge">${student.student_type || 'New'}</span></td>
                    <td>${student.school_year || 'N/A'}</td>
                    <td><span class="status-badge status-${statusClass}">${student.status}</span></td>
                    <td>
                        <a href="view_student.html?id=${student.id}" class="action-btn view-btn" title="View Student">
                            <i class="fas fa-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    // Render schedule
    function renderSchedule() {
        const container = document.getElementById('scheduleContainer');

        // Check if there's any schedule
        const hasSchedule = Object.values(scheduleData).some(day => day.length > 0);

        if (!hasSchedule) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Class Schedule</h3>
                    <p>No class schedule has been assigned to this section yet.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="schedule-container">`;

        daysOrder.forEach(day => {
            if (scheduleData[day] && scheduleData[day].length > 0) {
                html += `
                    <div class="day-schedule">
                        <h4 class="day-title">
                            <i class="fas fa-calendar-day"></i> ${day}
                        </h4>
                        <div class="schedule-grid">
                `;

                scheduleData[day].forEach(subject => {
                    html += `
                        <div class="schedule-card">
                            <div class="schedule-time">
                                <i class="fas fa-clock"></i>
                                ${formatTime(subject.start_time)} - ${formatTime(subject.end_time)}
                            </div>
                            <h5 class="schedule-subject">
                                <i class="fas fa-book-open"></i> 
                                ${subject.subject_name}
                            </h5>
                            <div class="schedule-details">
                                <span><i class="fas fa-chalkboard-user"></i> ${subject.teacher_name || 'Not assigned'}</span>
                                <span><i class="fas fa-door-open"></i> Room: ${subject.room || 'Not assigned'}</span>
                                <span><i class="fas fa-layer-group"></i> Quarter: ${subject.quarter || 1}</span>
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // ===== TABS =====

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
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

    renderSectionHeader();
    renderStudents();
    renderSchedule();
});