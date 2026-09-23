/**
 * Reports - Interactive JavaScript (Supabase Integrated)
 * Live data querying and generation
 */

import { supabase } from '../../supabase/config.js';

(async function() {
    'use strict';

    console.log('📊 Reports page initializing with Supabase...');

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
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalEnrollmentsEl = document.getElementById('totalEnrollments');
    const enrolledCountEl = document.getElementById('enrolledCount');
    const monthlyCountEl = document.getElementById('monthlyCount');
    const pendingBadge = document.getElementById('pendingEnrollmentsBadge');

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
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const printBtn = document.getElementById('printBtn');

    // ============================================
    // SESSION & PROFILE
    // ============================================

    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.displayName || (user.email ? user.email.split('@')[0] : 'Registrar'));
            if (adminName) adminName.textContent = name;
            if (adminInitial) adminInitial.textContent = name.charAt(0).toUpperCase();
        } else {
            const storedName = localStorage.getItem('registrarName') || 'Registrar';
            if (adminName) adminName.textContent = storedName;
            if (adminInitial) adminInitial.textContent = storedName.charAt(0).toUpperCase();
        }
    } catch(e) {}

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚪 Registrar logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('registrarName');
            localStorage.removeItem('hes_registrar_avatar');
            localStorage.removeItem('hes_registrar_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // Set Current Date Badge
    const dateBadge = document.getElementById('dateBadge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // Mobile Menu Toggle
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

    function getDefaultDateFrom() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    function getDefaultDateTo() {
        return new Date().toISOString().split('T')[0];
    }

    // ============================================
    // LOAD STATS
    // ============================================

    async function loadStats() {
        try {
            const [
                { count: totalStCount },
                { count: totalEnCount },
                { count: approvedCount },
                { count: pendingCount }
            ] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('status.ilike.enrolled,status.ilike.approved,status.eq.approved,status.eq.enrolled'),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('status.ilike.pending,status.eq.Pending,status.eq.pending')
            ]);

            // Monthly enrollments (this calendar month)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { count: monthlyEnCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth);

            if (totalStudentsEl) totalStudentsEl.textContent = totalStCount || 0;
            if (totalEnrollmentsEl) totalEnrollmentsEl.textContent = totalEnCount || 0;
            if (enrolledCountEl) enrolledCountEl.textContent = approvedCount || 0;
            if (monthlyCountEl) monthlyCountEl.textContent = monthlyEnCount || 0;

            if (pendingBadge) {
                if (pendingCount && pendingCount > 0) {
                    pendingBadge.textContent = pendingCount;
                    pendingBadge.style.display = 'inline-flex';
                } else {
                    pendingBadge.style.display = 'none';
                }
            }
        } catch(err) {
            console.warn('Error loading stats for reports:', err);
        }
    }

    // ============================================
    // POPULATE GRADE FILTER
    // ============================================

    function populateGradeFilter() {
        if (!gradeFilter) return;
        const defaultGrades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
        gradeFilter.innerHTML = '<option value="">All Grades</option>';
        defaultGrades.forEach(g => {
            gradeFilter.innerHTML += `<option value="${g}">${g}</option>`;
        });
    }

    // ============================================
    // GENERATE REPORT (FROM SUPABASE)
    // ============================================

    let currentReportRows = [];
    let currentHeaders = [];

    async function generateReport() {
        const fromVal = (dateFrom && dateFrom.value) ? dateFrom.value : getDefaultDateFrom();
        const toVal = (dateTo && dateTo.value) ? dateTo.value : getDefaultDateTo();
        const type = (reportType && reportType.value) || 'enrollment_summary';
        const gradeVal = (gradeFilter && gradeFilter.value) || '';
        const statusVal = (statusFilter && statusFilter.value) || '';

        // Display date range
        if (dateRange) {
            const fromDate = new Date(fromVal + 'T00:00:00');
            const toDate = new Date(toVal + 'T23:59:59');
            dateRange.innerHTML = `
                <i class="fas fa-calendar-alt"></i>
                Report Period: ${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - 
                ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            `;
        }

        // Set Title
        const typeTitles = {
            'enrollment_summary': 'Enrollment Summary Report',
            'grade_level': 'Grade Level Distribution Report',
            'strand_distribution': 'Senior High Strand Report',
            'monthly_trend': 'Monthly Enrollment Statistics',
            'rejected_applications': 'Rejected Applications Report'
        };
        if (reportTitle) {
            reportTitle.textContent = typeTitles[type] || 'Enrollment Report';
        }

        // Loading UI
        if (reportHead) reportHead.innerHTML = `<tr><th>Loading columns...</th></tr>`;
        if (reportBody) {
            reportBody.innerHTML = `
                <tr>
                    <td>
                        <div class="no-data" style="text-align: center; padding: 30px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #1B2A4A; margin-bottom: 8px;"></i>
                            <p>Querying Supabase database...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (reportFoot) reportFoot.innerHTML = '';

        try {
            // Build Supabase Query
            let query = supabase
                .from('enrollments')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply date filters
            if (fromVal) {
                query = query.gte('created_at', `${fromVal}T00:00:00`);
            }
            if (toVal) {
                query = query.lte('created_at', `${toVal}T23:59:59`);
            }

            // Apply Grade filter
            if (gradeVal) {
                query = query.ilike('grade_level', `%${gradeVal}%`);
            }

            // Apply Status filter
            if (statusVal) {
                if (statusVal.toLowerCase() === 'enrolled' || statusVal.toLowerCase() === 'approved') {
                    query = query.or('status.ilike.enrolled,status.ilike.approved,status.eq.approved,status.eq.enrolled');
                } else if (statusVal.toLowerCase() === 'pending') {
                    query = query.or('status.ilike.pending,status.eq.pending,status.eq.Pending');
                } else if (statusVal.toLowerCase() === 'rejected') {
                    query = query.or('status.ilike.rejected,status.eq.rejected,status.eq.Rejected');
                }
            }

            // If report type is rejected applications
            if (type === 'rejected_applications') {
                query = query.or('status.ilike.rejected,status.eq.rejected,status.eq.Rejected');
            }

            const { data: enrollments, error } = await query;
            if (error) throw error;

            const records = enrollments || [];

            // Define table structure
            currentHeaders = ['#', 'Enrollment ID', 'Student Name', 'Grade Level', 'Strand', 'Previous School', 'Status', 'Date Submitted'];
            currentReportRows = [];

            if (records.length === 0) {
                if (reportHead) reportHead.innerHTML = `<tr><th>No Data</th></tr>`;
                if (reportBody) {
                    reportBody.innerHTML = `
                        <tr>
                            <td>
                                <div class="no-data">
                                    <i class="fas fa-chart-bar"></i>
                                    <h3>No Records Found</h3>
                                    <p>No enrollment records match the selected date and filters.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                }
                return;
            }

            // Populate rows
            let html = '';
            records.forEach((e, index) => {
                const name = (e.first_name || e.firstName)
                    ? `${e.first_name || e.firstName} ${e.last_name || e.lastName || ''}`.trim()
                    : (e.student_name || e.email || 'N/A');
                const grade = e.grade_level || e.grade || 'N/A';
                const strand = e.strand || 'N/A';
                const prevSchool = e.previous_school || 'N/A';
                const rawStatus = (e.status || 'pending').toLowerCase();
                const statusBadgeClass = rawStatus === 'approved' || rawStatus === 'enrolled'
                    ? 'status-enrolled'
                    : (rawStatus === 'rejected' ? 'status-rejected' : 'status-pending');
                const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                const dateStr = e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                const shortId = e.id ? e.id.substring(0, 8).toUpperCase() : `ENR-${index + 1}`;

                currentReportRows.push([
                    index + 1,
                    shortId,
                    name,
                    grade,
                    strand,
                    prevSchool,
                    displayStatus,
                    dateStr
                ]);

                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${shortId}</strong></td>
                        <td>${name}</td>
                        <td>${grade}</td>
                        <td>${strand}</td>
                        <td>${prevSchool}</td>
                        <td><span class="status-badge ${statusBadgeClass}">${displayStatus}</span></td>
                        <td>${dateStr}</td>
                    </tr>
                `;
            });

            // Set headers
            if (reportHead) {
                reportHead.innerHTML = `
                    <tr>
                        ${currentHeaders.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                `;
            }

            // Set body
            if (reportBody) {
                reportBody.innerHTML = html;
            }

            // Set footer
            if (reportFoot) {
                reportFoot.innerHTML = `
                    <tr class="total-records">
                        <td colspan="${currentHeaders.length}">
                            <strong>Total Records Found: ${records.length}</strong>
                        </td>
                    </tr>
                `;
            }

        } catch(err) {
            console.error('Error generating report:', err);
            if (reportBody) {
                reportBody.innerHTML = `
                    <tr>
                        <td>
                            <div class="no-data">
                                <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
                                <h3>Error Generating Report</h3>
                                <p>${err.message || 'Failed to query enrollment data.'}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Report Form Submit
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateReport();
        });
    }

    // Export Excel / CSV
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            if (!currentReportRows || currentReportRows.length === 0) {
                showAlert('❌ No records available to export.', 'error');
                return;
            }

            let csv = currentHeaders.map(h => `"${h}"`).join(',') + '\n';
            currentReportRows.forEach(row => {
                csv += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `enrollment_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            showAlert('✅ Report downloaded as CSV successfully!', 'success');
        });
    }

    // Print Report
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    // Show Alert
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

    // Set Default Form Values
    if (dateFrom) dateFrom.value = getDefaultDateFrom();
    if (dateTo) dateTo.value = getDefaultDateTo();
    populateGradeFilter();

    // Initial load
    await loadStats();
    await generateReport();

    console.log('✅ Reports initialized successfully with live Supabase data.');

})();