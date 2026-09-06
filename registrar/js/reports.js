/**
 * Reports - Interactive JavaScript
 * No hardcoded data - all data comes from PHP via window.reportData
 */

(function() {
    'use strict';

    console.log('📊 Reports page ready');

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
    const totalEnrollments = document.getElementById('totalEnrollments');
    const enrolledCount = document.getElementById('enrolledCount');
    const monthlyCount = document.getElementById('monthlyCount');

    // Report elements
    const reportForm = document.getElementById('reportForm');
    const reportType = document.getElementById('reportType');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const gradeFilter = document.getElementById('gradeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const reportTitle = document.getElementById('reportTitle');
    const dateRange = document.getElementById('dateRange');
    const reportHead = document.getElementById('reportHead');
    const reportBody = document.getElementById('reportBody');
    const reportFoot = document.getElementById('reportFoot');
    const reportCard = document.getElementById('reportCard');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const printBtn = document.getElementById('printBtn');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.reportData || {
        stats: {
            total_students: 0,
            total_enrollments: 0,
            enrolled_count: 0,
            monthly_count: 0
        },
        grade_levels: [],
        report: {
            type: 'enrollment_summary',
            title: 'Enrollment Summary Report',
            headers: [],
            rows: [],
            date_from: '',
            date_to: '',
            grade_filter: '',
            status_filter: ''
        }
    };

    // ============================================
    // SET ADMIN NAME (from data)
    // ============================================

    const firstName = 'Registrar';
    if (adminName) adminName.textContent = firstName;
    if (adminInitial) adminInitial.textContent = firstName.charAt(0).toUpperCase();

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
        if (totalStudents) totalStudents.textContent = data.stats.total_students;
        if (totalEnrollments) totalEnrollments.textContent = data.stats.total_enrollments;
        if (enrolledCount) enrolledCount.textContent = data.stats.enrolled_count;
        if (monthlyCount) monthlyCount.textContent = data.stats.monthly_count;

        // Grade levels dropdown
        populateGradeFilter();

        // Set form values
        if (dateFrom) dateFrom.value = data.report.date_from || getDefaultDateFrom();
        if (dateTo) dateTo.value = data.report.date_to || getDefaultDateTo();
        if (reportType) reportType.value = data.report.type || 'enrollment_summary';
        if (gradeFilter) gradeFilter.value = data.report.grade_filter || '';
        if (statusFilter) statusFilter.value = data.report.status_filter || '';

        // Render report
        renderReport();
    }

    function getDefaultDateFrom() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    function getDefaultDateTo() {
        return new Date().toISOString().split('T')[0];
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
    // RENDER REPORT
    // ============================================

    function renderReport() {
        const headers = data.report.headers || [];
        const rows = data.report.rows || [];
        const title = data.report.title || 'Enrollment Summary Report';

        // Set title
        if (reportTitle) reportTitle.textContent = title;

        // Set date range
        if (dateRange) {
            const from = data.report.date_from || getDefaultDateFrom();
            const to = data.report.date_to || getDefaultDateTo();
            const fromDate = new Date(from + 'T00:00:00');
            const toDate = new Date(to + 'T00:00:00');
            dateRange.innerHTML = `
                <i class="fas fa-calendar-alt"></i>
                Report Period: ${fromDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - 
                ${toDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            `;
        }

        // Render table
        if (headers.length === 0 || rows.length === 0) {
            reportHead.innerHTML = `<tr><th>No Data</th></tr>`;
            reportBody.innerHTML = `
                <tr>
                    <td>
                        <div class="no-data">
                            <i class="fas fa-chart-bar"></i>
                            <h3>No Data Available</h3>
                            <p>No records found for the selected criteria. Try adjusting your filters.</p>
                        </div>
                    </td>
                </tr>
            `;
            reportFoot.innerHTML = '';
            return;
        }

        // Headers
        reportHead.innerHTML = `
            <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        `;

        // Body
        reportBody.innerHTML = rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
        `).join('');

        // Footer
        reportFoot.innerHTML = `
            <tr class="total-records">
                <td colspan="${headers.length}">
                    <strong>Total Records: ${rows.length}</strong>
                </td>
            </tr>
        `;
    }

    // ============================================
    // REPORT FORM SUBMIT
    // ============================================

    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const params = new URLSearchParams();

            for (let [key, value] of formData.entries()) {
                if (value) params.append(key, value);
            }

            // Simulate loading
            reportBody.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="no-data">
                            <i class="fas fa-spinner fa-spin"></i>
                            <h3>Generating Report...</h3>
                            <p>Please wait while we generate your report.</p>
                        </div>
                    </td>
                </tr>
            `;

            // Simulate AJAX request
            setTimeout(() => {
                // Update URL with params
                const url = new URL(window.location.href);
                url.search = params.toString();
                window.history.pushState({}, '', url);

                // Reload page to get new data from PHP
                window.location.reload();
            }, 800);
        });
    }

    // ============================================
    // EXPORT EXCEL
    // ============================================

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            const table = document.getElementById('reportTable');
            if (!table) return;

            // Get headers
            const headers = [];
            const headRows = table.querySelectorAll('thead th');
            headRows.forEach(th => headers.push(th.textContent.trim()));

            // Get rows
            const rows = [];
            const bodyRows = table.querySelectorAll('tbody tr');
            bodyRows.forEach(tr => {
                const row = [];
                const cells = tr.querySelectorAll('td');
                cells.forEach(td => {
                    // Skip no-data rows
                    if (td.querySelector('.no-data')) return;
                    row.push(td.textContent.trim());
                });
                if (row.length > 0) rows.push(row);
            });

            if (rows.length === 0) {
                showAlert('❌ No data to export.', 'error');
                return;
            }

            // Build CSV
            let csv = headers.join(',') + '\n';
            rows.forEach(row => {
                csv += row.join(',') + '\n';
            });

            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            showAlert('✅ Report exported successfully!', 'success');
        });
    }

    // ============================================
    // PRINT REPORT
    // ============================================

    if (printBtn) {
        printBtn.addEventListener('click', function() {
            const printContents = document.getElementById('reportCard').innerHTML;
            const originalContents = document.body.innerHTML;

            document.body.innerHTML = `
                <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h1 style="text-align: center; color: #0b2b4a;">Placido L. Señor NHS</h1>
                    <h2 style="text-align: center; color: #555;">${reportTitle ? reportTitle.textContent : 'Enrollment Report'}</h2>
                    <div style="text-align: center; color: #666; margin-bottom: 20px;">
                        ${dateRange ? dateRange.textContent : ''}
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

    console.log('✅ Reports ready!');

})();