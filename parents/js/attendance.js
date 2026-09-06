// ===== ATTENDANCE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const studentSelect = document.getElementById('studentSelect');
    const monthSelect = document.getElementById('monthSelect');
    const attendanceBody = document.getElementById('attendanceBody');
    const recordCount = document.getElementById('recordCount');
    const attendanceStats = document.getElementById('attendanceStats');
    const chartContainer = document.getElementById('chartContainer');
    const absencesContent = document.getElementById('absencesContent');

    // ===== DATA =====

    // Sample attendance data
    const attendanceData = [
        // Juan Dela Cruz (student_id: 1)
        { id: 1, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-01', time_in: '07:15 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 2, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-02', time_in: '07:20 AM', time_out: '04:25 PM', status: 'Present', remarks: '' },
        { id: 3, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-03', time_in: '08:10 AM', time_out: '04:30 PM', status: 'Late', remarks: 'Traffic' },
        { id: 4, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-04', time_in: '07:10 AM', time_out: '04:20 PM', status: 'Present', remarks: '' },
        { id: 5, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-05', time_in: '07:30 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 6, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-06', time_in: '', time_out: '', status: 'Absent', remarks: 'Sick' },
        { id: 7, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-07', time_in: '07:05 AM', time_out: '04:35 PM', status: 'Present', remarks: '' },
        { id: 8, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-08', time_in: '07:15 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 9, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-09', time_in: '08:30 AM', time_out: '04:30 PM', status: 'Late', remarks: 'Woke up late' },
        { id: 10, student_id: 1, student_name: 'Juan Dela Cruz', date: '2026-06-10', time_in: '', time_out: '', status: 'Absent', remarks: 'Family event' },
        // Maria Dela Cruz (student_id: 2)
        { id: 11, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-01', time_in: '07:10 AM', time_out: '04:25 PM', status: 'Present', remarks: '' },
        { id: 12, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-02', time_in: '07:25 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 13, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-03', time_in: '07:00 AM', time_out: '04:20 PM', status: 'Present', remarks: '' },
        { id: 14, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-04', time_in: '08:15 AM', time_out: '04:30 PM', status: 'Late', remarks: 'Bus delay' },
        { id: 15, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-05', time_in: '07:20 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 16, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-06', time_in: '07:15 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 17, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-07', time_in: '', time_out: '', status: 'Absent', remarks: 'Fever' },
        { id: 18, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-08', time_in: '07:10 AM', time_out: '04:25 PM', status: 'Present', remarks: '' },
        { id: 19, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-09', time_in: '07:30 AM', time_out: '04:30 PM', status: 'Present', remarks: '' },
        { id: 20, student_id: 2, student_name: 'Maria Dela Cruz', date: '2026-06-10', time_in: '07:05 AM', time_out: '04:30 PM', status: 'Present', remarks: '' }
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

    // Get selected student
    function getSelectedStudent() {
        const value = studentSelect.value;
        if (value === 'all') return null;
        return parseInt(value);
    }

    // Get selected month
    function getSelectedMonth() {
        return parseInt(monthSelect.value);
    }

    // Get filtered data
    function getFilteredData() {
        const studentId = getSelectedStudent();
        let data = attendanceData;
        if (studentId) {
            data = data.filter(a => a.student_id === studentId);
        }
        return data;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Render stats
    function renderStats() {
        const data = getFilteredData();
        
        if (data.length === 0) {
            attendanceStats.innerHTML = `
                <div class="no-data" style="grid-column: 1 / -1;">
                    <i class="fas fa-calendar-check"></i>
                    <p>No attendance data available.</p>
                </div>
            `;
            return;
        }

        const present = data.filter(a => a.status === 'Present').length;
        const absent = data.filter(a => a.status === 'Absent').length;
        const late = data.filter(a => a.status === 'Late').length;
        const total = data.length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        attendanceStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon present"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number">${present}</div>
                <div class="stat-label">Present Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon absent"><i class="fas fa-times-circle"></i></div>
                <div class="stat-number">${absent}</div>
                <div class="stat-label">Absent Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon late"><i class="fas fa-clock"></i></div>
                <div class="stat-number">${late}</div>
                <div class="stat-label">Late Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon rate"><i class="fas fa-chart-line"></i></div>
                <div class="stat-number">${rate}%</div>
                <div class="stat-label">Attendance Rate</div>
            </div>
        `;
    }

    // Render chart
    function renderChart() {
        const data = getFilteredData();
        const month = getSelectedMonth();
        
        // Filter by month
        const monthData = data.filter(a => {
            const date = new Date(a.date);
            return date.getMonth() + 1 === month;
        });

        if (monthData.length === 0) {
            chartContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-bar"></i>
                    <p>No attendance data for this month.</p>
                </div>
            `;
            return;
        }

        // Group by day
        const dayMap = {};
        monthData.forEach(a => {
            const day = new Date(a.date).getDate();
            if (!dayMap[day]) {
                dayMap[day] = { present: 0, absent: 0, late: 0, total: 0 };
            }
            dayMap[day][a.status.toLowerCase()] = (dayMap[day][a.status.toLowerCase()] || 0) + 1;
            dayMap[day].total++;
        });

        // Sort days
        const days = Object.keys(dayMap).sort((a, b) => a - b);

        let maxValue = 0;
        days.forEach(day => {
            const d = dayMap[day];
            if (d.total > maxValue) maxValue = d.total;
        });

        let html = `<div class="chart-bars">`;
        days.forEach(day => {
            const d = dayMap[day];
            const presentHeight = maxValue > 0 ? (d.present / maxValue) * 150 : 0;
            const absentHeight = maxValue > 0 ? (d.absent / maxValue) * 150 : 0;
            const lateHeight = maxValue > 0 ? (d.late / maxValue) * 150 : 0;

            html += `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-value">${d.total}</div>
                    <div style="display: flex; flex-direction: column-reverse; align-items: center; gap: 2px; height: 160px;">
                        ${d.late > 0 ? `<div class="chart-bar late" style="height: ${lateHeight}px;" title="Late: ${d.late}"></div>` : ''}
                        ${d.absent > 0 ? `<div class="chart-bar absent" style="height: ${absentHeight}px;" title="Absent: ${d.absent}"></div>` : ''}
                        ${d.present > 0 ? `<div class="chart-bar present" style="height: ${presentHeight}px;" title="Present: ${d.present}"></div>` : ''}
                    </div>
                    <div class="chart-bar-label">Day ${day}</div>
                </div>
            `;
        });
        html += `</div>`;

        // Add legend
        html += `
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 16px; flex-wrap: wrap;">
                <span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569;">
                    <span style="display: inline-block; width: 16px; height: 16px; background: #10b981; border-radius: 4px;"></span> Present
                </span>
                <span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569;">
                    <span style="display: inline-block; width: 16px; height: 16px; background: #ef4444; border-radius: 4px;"></span> Absent
                </span>
                <span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569;">
                    <span style="display: inline-block; width: 16px; height: 16px; background: #f59e0b; border-radius: 4px;"></span> Late
                </span>
            </div>
        `;

        chartContainer.innerHTML = html;
    }

    // Render attendance table
    function renderAttendance() {
        const data = getFilteredData();
        
        if (data.length === 0) {
            attendanceBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-data">
                            <i class="fas fa-calendar-check"></i>
                            <p>No attendance records available.</p>
                        </div>
                    </td>
                </tr>
            `;
            recordCount.textContent = '0 records';
            return;
        }

        // Sort by date descending
        const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '';
        sorted.forEach(record => {
            const statusClass = record.status.toLowerCase();
            const timeIn = record.time_in || '—';
            const timeOut = record.time_out || '—';

            html += `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td><strong>${record.student_name}</strong></td>
                    <td>${timeIn}</td>
                    <td>${timeOut}</td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${record.status}
                        </span>
                    </td>
                    <td>${record.remarks || '—'}</td>
                </tr>
            `;
        });

        attendanceBody.innerHTML = html;
        recordCount.textContent = `${sorted.length} records`;
    }

    // Render absences summary
    function renderAbsences() {
        const data = getFilteredData();
        const absences = data.filter(a => a.status === 'Absent');

        if (absences.length === 0) {
            absencesContent.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <p>No absences recorded. Great attendance!</p>
                </div>
            `;
            return;
        }

        // Group by student
        const studentMap = {};
        absences.forEach(a => {
            if (!studentMap[a.student_name]) {
                studentMap[a.student_name] = { count: 0, remarks: [] };
            }
            studentMap[a.student_name].count++;
            if (a.remarks) {
                studentMap[a.student_name].remarks.push(a.remarks);
            }
        });

        let html = `<div class="absences-grid">`;
        Object.keys(studentMap).forEach(name => {
            const data = studentMap[name];
            const remarksText = data.remarks.length > 0 ? `Reasons: ${data.remarks.join(', ')}` : 'No reason provided';
            html += `
                <div class="absence-item">
                    <div>
                        <div class="student-name">${name}</div>
                        <div class="absence-days">${remarksText}</div>
                    </div>
                    <div class="absence-count">${data.count} day${data.count > 1 ? 's' : ''}</div>
                </div>
            `;
        });
        html += `</div>`;

        absencesContent.innerHTML = html;
    }

    // Render all
    function renderAll() {
        renderStats();
        renderChart();
        renderAttendance();
        renderAbsences();
    }

    // ===== EVENT LISTENERS =====

    // Student select change
    if (studentSelect) {
        studentSelect.addEventListener('change', renderAll);
    }

    // Month select change
    if (monthSelect) {
        monthSelect.addEventListener('change', renderAll);
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

    renderAll();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});