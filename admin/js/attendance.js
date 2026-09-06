// ===== ATTENDANCE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const dateFilter = document.getElementById('dateFilter');
    const teacherFilter = document.getElementById('teacherFilter');
    const statusFilter = document.getElementById('statusFilter');
    const hiddenDateFilter = document.getElementById('hiddenDateFilter');
    const tableContainer = document.getElementById('tableContainer');
    const recordCount = document.getElementById('recordCount');
    const totalRecords = document.getElementById('totalRecords');
    const totalTeachers = document.getElementById('totalTeachers');
    const totalToday = document.getElementById('totalToday');
    const presentToday = document.getElementById('presentToday');
    const absentToday = document.getElementById('absentToday');
    const lateToday = document.getElementById('lateToday');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    // ===== DATA =====

    // Sample attendance records (in real app, this comes from PHP)
    let attendanceRecords = [];
    let teachers = [];
    let availableDates = [];

    // ===== FUNCTIONS =====

    // Load sample data
    function loadSampleData() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const teachersList = [
            { id: 1, fullname: 'Maria Santos', id_number: 'TCH-000001', email: 'maria.santos@plshs.edu.ph' },
            { id: 2, fullname: 'Juan Dela Cruz', id_number: 'TCH-000002', email: 'juan.dela@plshs.edu.ph' },
            { id: 3, fullname: 'Ana Reyes', id_number: 'TCH-000003', email: 'ana.reyes@plshs.edu.ph' },
            { id: 4, fullname: 'Carlos Mendoza', id_number: 'TCH-000004', email: 'carlos.m@plshs.edu.ph' },
            { id: 5, fullname: 'Elena Garcia', id_number: 'TCH-000005', email: 'elena.g@plshs.edu.ph' }
        ];
        teachers = teachersList;

        const statuses = ['Present', 'Present', 'Present', 'Absent', 'Late'];
        const remarks = ['', '', 'On time', 'Sick', 'Traffic'];

        attendanceRecords = [];
        for (let i = 1; i <= 20; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - Math.floor(Math.random() * 14));
            
            const teacher = teachersList[Math.floor(Math.random() * teachersList.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const timeIn = new Date();
            timeIn.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
            
            const timeOut = new Date();
            timeOut.setHours(16 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
            
            attendanceRecords.push({
                id: i,
                teacher_id: teacher.id,
                teacher_name: teacher.fullname,
                teacher_id_number: teacher.id_number,
                teacher_email: teacher.email,
                date: date.toISOString().split('T')[0],
                time_in: timeIn.toTimeString().split(' ')[0],
                time_out: timeOut.toTimeString().split(' ')[0],
                status: status,
                remarks: remarks[Math.floor(Math.random() * remarks.length)]
            });
        }

        // Sort by date descending
        attendanceRecords.sort((a, b) => b.date.localeCompare(a.date));

        // Get available dates
        const dates = new Set();
        attendanceRecords.forEach(r => dates.add(r.date));
        availableDates = Array.from(dates).sort().reverse();

        // Update statistics
        updateStats();
        updateDateFilter();
        updateTeacherFilter();
        renderTable();
    }

    // Update statistics
    function updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRecords.filter(r => r.date === today);
        
        totalToday.textContent = todayRecords.length;
        presentToday.textContent = todayRecords.filter(r => r.status === 'Present').length;
        absentToday.textContent = todayRecords.filter(r => r.status === 'Absent').length;
        lateToday.textContent = todayRecords.filter(r => r.status === 'Late').length;

        const uniqueTeachers = new Set(attendanceRecords.map(r => r.teacher_id));
        totalRecords.textContent = attendanceRecords.length;
        totalTeachers.textContent = uniqueTeachers.size;
    }

    // Update date filter dropdown
    function updateDateFilter() {
        dateFilter.innerHTML = '<option value="all">All Dates</option>';
        availableDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            const d = new Date(date + 'T00:00:00');
            option.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            dateFilter.appendChild(option);
        });
    }

    // Update teacher filter dropdown
    function updateTeacherFilter() {
        teacherFilter.innerHTML = '<option value="">All Teachers</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.fullname} (${teacher.id_number || 'No ID'})`;
            teacherFilter.appendChild(option);
        });

        // Also update modal dropdown
        const modalSelect = document.getElementById('modalTeacherSelect');
        modalSelect.innerHTML = '<option value="">Select Teacher</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.fullname} (${teacher.id_number || 'No ID'})`;
            modalSelect.appendChild(option);
        });
    }

    // Render table
    function renderTable() {
        const dateVal = dateFilter.value;
        const teacherVal = teacherFilter.value;
        const statusVal = statusFilter.value;

        let filtered = [...attendanceRecords];

        if (dateVal !== 'all') {
            filtered = filtered.filter(r => r.date === dateVal);
        }
        if (teacherVal) {
            filtered = filtered.filter(r => r.teacher_id == teacherVal);
        }
        if (statusVal) {
            filtered = filtered.filter(r => r.status === statusVal);
        }

        recordCount.textContent = filtered.length;

        if (filtered.length === 0) {
            tableContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Teacher Attendance Records Found</h3>
                    <p>Teachers can generate QR codes and scan to record their attendance, or you can manually add records using the "Add Record" button above.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Teacher</th>
                        <th>ID Number</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filtered.forEach(record => {
            const date = new Date(record.date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            const timeIn = record.time_in && record.time_in !== '00:00:00' 
                ? new Date(`2000-01-01T${record.time_in}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : '—';
            
            const timeOut = record.time_out && record.time_out !== '00:00:00'
                ? new Date(`2000-01-01T${record.time_out}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : '—';

            const initial = record.teacher_name.charAt(0).toUpperCase();

            html += `
                <tr>
                    <td>
                        <span class="grade-tag">
                            <i class="far fa-calendar"></i>
                            ${formattedDate}
                        </span>
                    </td>
                    <td>
                        <div class="teacher-info">
                            <div class="teacher-avatar">${initial}</div>
                            <div class="teacher-details">
                                <h4>${record.teacher_name}</h4>
                                <span><i class="fas fa-envelope"></i> ${record.teacher_email}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="grade-tag">${record.teacher_id_number || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="grade-tag"><i class="fas fa-clock"></i> ${timeIn}</span>
                    </td>
                    <td>
                        <span class="grade-tag"><i class="fas fa-clock"></i> ${timeOut}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn delete" onclick="deleteRecord(${record.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }

    // Delete record
    window.deleteRecord = function(id) {
        if (confirm('Delete this attendance record?')) {
            attendanceRecords = attendanceRecords.filter(r => r.id !== id);
            updateStats();
            renderTable();
            showAlert('Teacher attendance record deleted successfully!', 'success');
        }
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

    // Reset filters
    window.resetFilters = function() {
        dateFilter.value = 'all';
        teacherFilter.value = '';
        statusFilter.value = '';
        hiddenDateFilter.value = 'all';
        renderTable();
    };

    // ===== MODAL FUNCTIONS =====

    window.openAddTeacherModal = function() {
        const modal = document.getElementById('addTeacherModal');
        modal.classList.add('show');
        document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    };

    window.closeAddTeacherModal = function() {
        const modal = document.getElementById('addTeacherModal');
        modal.classList.remove('show');
    };

    // ===== FORM HANDLERS =====

    // Date filter form
    document.getElementById('dateFilterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        hiddenDateFilter.value = dateFilter.value;
        renderTable();
    });

    // Filter form
    document.getElementById('filterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        renderTable();
    });

    // Add attendance form
    document.getElementById('addAttendanceForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const teacherId = document.getElementById('modalTeacherSelect').value;
        const date = document.getElementById('modalDate').value;
        const timeIn = document.getElementById('modalTimeIn').value;
        const timeOut = document.getElementById('modalTimeOut').value;
        const status = document.getElementById('modalStatus').value;
        const remarks = document.getElementById('modalRemarks').value;

        if (!teacherId || !date) {
            showAlert('Please fill in all required fields.', 'error');
            return;
        }

        // Check if record already exists
        const exists = attendanceRecords.some(r => r.teacher_id == teacherId && r.date === date);
        if (exists) {
            showAlert('Attendance record already exists for this teacher on this date.', 'error');
            return;
        }

        const teacher = teachers.find(t => t.id == teacherId);
        
        const newRecord = {
            id: attendanceRecords.length + 1,
            teacher_id: parseInt(teacherId),
            teacher_name: teacher.fullname,
            teacher_id_number: teacher.id_number,
            teacher_email: teacher.email,
            date: date,
            time_in: timeIn || '00:00:00',
            time_out: timeOut || '00:00:00',
            status: status,
            remarks: remarks || ''
        };

        attendanceRecords.unshift(newRecord);
        updateStats();
        updateDateFilter();
        renderTable();
        closeAddTeacherModal();
        showAlert('Teacher attendance record added successfully!', 'success');
    });

    // ===== MOBILE MENU =====

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== INIT =====

    loadSampleData();
});