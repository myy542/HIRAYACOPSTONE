/**
 * Students Management - Supabase Integrated (Realtime Updates)
 * PLS NHS Registrar Portal
 */

import { supabase } from '../../supabase/config.js';

(async function() {
    'use strict';

    console.log('📚 Students Management initialized with Supabase');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');
    const dateBadge = document.getElementById('dateBadge');

    // Notification elements
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notifCount = document.getElementById('notifCount');
    const pendingEnrollmentsBadge = document.getElementById('pendingEnrollmentsBadge');

    // Stats
    const totalStudentsEl = document.getElementById('totalStudents');
    const enrolledStudentsEl = document.getElementById('enrolledStudents');
    const pendingStudentsEl = document.getElementById('pendingStudents');
    const rejectedStudentsEl = document.getElementById('rejectedStudents');
    const noEnrollmentEl = document.getElementById('noEnrollment');

    // Filters & Search
    const gradeFilter = document.getElementById('gradeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const filterForm = document.getElementById('filterForm');

    // Table
    const tableBody = document.getElementById('tableBody');
    const badgeOld = document.getElementById('badgeOld');
    const badgeNew = document.getElementById('badgeNew');
    const badgeCount = document.getElementById('badgeCount');

    // Export & Print
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const printBtn = document.getElementById('printBtn');

    let currentUser = null;
    let allStudents = [];
    let notifications = [];

    // ============================================
    // SESSION VERIFICATION & HEADER
    // ============================================

    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            currentUser = JSON.parse(stored);
        }
    } catch(e) {
        console.error('Error reading currentUser:', e);
    }

    if (!currentUser) {
        window.location.replace('../auth/login.html');
        return;
    }

    if (currentUser.role && currentUser.role !== 'registrar' && currentUser.role !== 'admin') {
        const routes = {
            'teacher': '../teacher/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'admin': '../admin/dashboard.html'
        };
        window.location.replace(routes[currentUser.role] || '../auth/login.html');
        return;
    }

    const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Registrar'));
    if (adminName) adminName.textContent = displayName;
    if (adminInitial) adminInitial.textContent = displayName.charAt(0).toUpperCase();

    // Set Date Badge
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
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

    // Mobile Sidebar Toggle
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

    // Show Alert
    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // Play chime sound
    function playNotificationChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    // Show floating toast
    function showNotificationToast(notif) {
        let toastContainer = document.querySelector('.floating-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'floating-toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'floating-toast';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-bell"></i></div>
            <div class="toast-body">
                <div class="toast-title">${notif.title || 'New Student Update'}</div>
                <div class="toast-msg">${notif.message || 'A student submitted a new update.'}</div>
            </div>
            <button type="button" class="toast-close"><i class="fas fa-times"></i></button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        });

        toast.addEventListener('click', (e) => {
            if (e.target.closest('.toast-close')) return;
            loadStudentsData();
        });

        toastContainer.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 250);
            }
        }, 6000);
    }

    // ============================================
    // LOAD NOTIFICATIONS
    // ============================================

    async function loadNotifications() {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or('role.eq.registrar,role.is.null')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.warn('Could not load notifications:', error);
                return;
            }

            notifications = data || [];
            renderNotifications();
        } catch (err) {
            console.warn('Notifications error:', err);
        }
    }

    function renderNotifications() {
        if (!notificationList) return;
        const unread = notifications.filter(n => !(n.is_read || n.read));
        const unreadCount = unread.length;

        if (notifCount) {
            notifCount.textContent = unreadCount;
            notifCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = notifications.map(n => {
            const isUnread = !(n.is_read || n.read);
            const type = n.type || 'enrollment';
            const iconMap = {
                'new_enrollment': 'fa-user-plus',
                'enrollment': 'fa-file-signature',
                'student_update': 'fa-user-edit',
                'update': 'fa-bell',
                'document': 'fa-file-upload'
            };
            const icon = iconMap[type] || 'fa-bell';
            const timeAgo = formatTime(n.created_at);

            return `
                <div class="notif-item ${isUnread ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notif-icon notif-${type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${n.title || 'Student Update'}</div>
                        <div class="notif-message">${n.message || ''}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

        notificationList.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                await supabase.from('notifications').update({ read: true, is_read: true }).eq('id', id);
                item.classList.remove('unread');
                loadNotifications();
            });
        });
    }

    function formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Just now';
        const diff = new Date() - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Toggle notification dropdown
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            try {
                await supabase.from('notifications').update({ read: true, is_read: true }).or('role.eq.registrar,role.is.null');
                loadNotifications();
            } catch(e) {}
        });
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
    // LOAD STUDENTS & ENROLLMENTS DATA (SUPABASE)
    // ============================================

    async function loadStudentsData() {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 26px; color: #1B2A4A; margin-bottom: 10px;"></i>
                        <p style="color: #64748b; margin: 0;">Loading student records and enrollment information...</p>
                    </td>
                </tr>
            `;
        }

        try {
            // Fetch students, enrollments, and student users in parallel
            const [
                { data: studentsRows, error: sErr },
                { data: enrollmentsRows, error: eErr },
                { data: userRows, error: uErr }
            ] = await Promise.all([
                supabase.from('students').select('*').order('created_at', { ascending: false }),
                supabase.from('enrollments').select('*').order('created_at', { ascending: false }),
                supabase.from('users').select('*').eq('role', 'student')
            ]);

            if (sErr) throw sErr;

            const sList = studentsRows || [];
            const eList = enrollmentsRows || [];
            const uList = userRows || [];

            // Combine students into unique student profiles
            const combinedStudents = [];
            const processedEmails = new Set();
            const processedStudentIds = new Set();

            // 1. Process from students table
            sList.forEach(st => {
                processedStudentIds.add(st.id);
                if (st.email) processedEmails.add(st.email.toLowerCase().trim());

                // Find corresponding enrollment(s)
                const matchedEnrollments = eList.filter(e => 
                    (e.student_id && e.student_id === st.id) ||
                    (e.email && st.email && e.email.toLowerCase().trim() === st.email.toLowerCase().trim()) ||
                    (st.enrollment_id && e.id === st.enrollment_id)
                );

                const latestEnrollment = matchedEnrollments.length > 0 ? matchedEnrollments[0] : null;

                // Match user if any
                const matchedUser = uList.find(u => 
                    (st.email && u.email && u.email.toLowerCase().trim() === st.email.toLowerCase().trim()) ||
                    (st.id === u.id)
                );

                const fName = (st.first_name || (matchedUser ? matchedUser.first_name : '') || '').trim();
                const lName = (st.last_name || (matchedUser ? matchedUser.last_name : '') || '').trim();
                const mName = (st.middle_name || '').trim();
                const fullName = fName ? `${fName} ${mName ? mName + ' ' : ''}${lName}`.trim() : (st.email || 'Student');

                const rawStatus = latestEnrollment ? (latestEnrollment.status || 'pending').toLowerCase() : 'none';
                const gradeLevel = (latestEnrollment ? latestEnrollment.grade_level : '') || st.grade_level || 'Grade 11';
                const strand = (latestEnrollment ? latestEnrollment.strand : '') || st.strand || '';
                const schoolYear = (latestEnrollment ? latestEnrollment.last_school_year : '') || '2025-2026';
                const prevSchool = (latestEnrollment ? latestEnrollment.previous_school : '') || '';

                // Determine student type
                let studentType = 'New';
                if (prevSchool && (prevSchool.toLowerCase().includes('hes') || prevSchool.toLowerCase().includes('hiraya'))) {
                    studentType = 'Old';
                } else if (prevSchool && !prevSchool.toLowerCase().includes('n/a')) {
                    studentType = 'Transferee';
                } else {
                    studentType = 'New';
                }

                combinedStudents.push({
                    id: st.id,
                    student_id: st.id,
                    enrollment_id: latestEnrollment ? latestEnrollment.id : null,
                    lrn: st.lrn || 'N/A',
                    fullname: fullName,
                    first_name: fName,
                    last_name: lName,
                    email: st.email || (matchedUser ? matchedUser.email : 'N/A'),
                    contact_number: st.contact_number || 'N/A',
                    grade_level: gradeLevel,
                    strand: strand,
                    status: rawStatus,
                    student_type: studentType,
                    school_year: schoolYear,
                    previous_school: prevSchool,
                    created_at: st.created_at || (latestEnrollment ? latestEnrollment.created_at : new Date().toISOString())
                });
            });

            // 2. Process any enrollment that wasn't matched to a student record yet
            eList.forEach(e => {
                const alreadyIncluded = combinedStudents.some(cs => 
                    (e.student_id && cs.student_id === e.student_id) ||
                    (e.email && cs.email && cs.email.toLowerCase().trim() === e.email.toLowerCase().trim()) ||
                    (cs.enrollment_id && cs.enrollment_id === e.id)
                );

                if (!alreadyIncluded) {
                    const fName = (e.first_name || '').trim();
                    const lName = (e.last_name || '').trim();
                    const fullName = (fName || lName) ? `${fName} ${lName}`.trim() : (e.email || 'Applicant Student');
                    const rawStatus = (e.status || 'pending').toLowerCase();
                    const prevSchool = e.previous_school || '';
                    let studentType = 'New';
                    if (prevSchool && (prevSchool.toLowerCase().includes('hes') || prevSchool.toLowerCase().includes('hiraya'))) {
                        studentType = 'Old';
                    } else if (prevSchool && !prevSchool.toLowerCase().includes('n/a')) {
                        studentType = 'Transferee';
                    }

                    combinedStudents.push({
                        id: e.id,
                        student_id: e.student_id || e.id,
                        enrollment_id: e.id,
                        lrn: e.student_id ? e.student_id.substring(0, 11) : 'PENDING-LRN',
                        fullname: fullName,
                        first_name: fName,
                        last_name: lName,
                        email: e.email || 'N/A',
                        contact_number: 'N/A',
                        grade_level: e.grade_level || 'Grade 11',
                        strand: e.strand || '',
                        status: rawStatus,
                        student_type: studentType,
                        school_year: e.last_school_year || '2026-2027',
                        previous_school: prevSchool,
                        created_at: e.created_at || new Date().toISOString()
                    });
                }
            });

            allStudents = combinedStudents;

            // Update stats counters
            updateStats();

            // Populate table with filters
            renderStudentsTable();

        } catch(err) {
            console.error('Error loading students:', err);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="no-data">
                                <i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>
                                <h3>Failed to load students</h3>
                                <p>${err.message || 'Please check your connection and try again.'}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // ============================================
    // UPDATE STATS COUNTERS
    // ============================================

    function updateStats() {
        const total = allStudents.length;
        const enrolled = allStudents.filter(s => s.status === 'enrolled' || s.status === 'approved').length;
        const pending = allStudents.filter(s => s.status === 'pending').length;
        const rejected = allStudents.filter(s => s.status === 'rejected').length;
        const noEnroll = allStudents.filter(s => s.status === 'none' || !s.enrollment_id).length;

        const oldSt = allStudents.filter(s => s.student_type === 'Old').length;
        const newSt = allStudents.filter(s => s.student_type === 'New' || s.student_type === 'Transferee').length;

        if (totalStudentsEl) totalStudentsEl.textContent = total;
        if (enrolledStudentsEl) enrolledStudentsEl.textContent = enrolled;
        if (pendingStudentsEl) pendingStudentsEl.textContent = pending;
        if (rejectedStudentsEl) rejectedStudentsEl.textContent = rejected;
        if (noEnrollmentEl) noEnrollmentEl.textContent = noEnroll;

        if (badgeOld) badgeOld.textContent = `Old: ${oldSt}`;
        if (badgeNew) badgeNew.textContent = `New: ${newSt}`;

        if (pendingEnrollmentsBadge) {
            if (pending > 0) {
                pendingEnrollmentsBadge.textContent = pending;
                pendingEnrollmentsBadge.style.display = 'inline-flex';
            } else {
                pendingEnrollmentsBadge.style.display = 'none';
            }
        }
    }

    // ============================================
    // RENDER STUDENTS TABLE WITH FILTERS
    // ============================================

    function renderStudentsTable() {
        if (!tableBody) return;

        const selectedGrade = gradeFilter ? gradeFilter.value.trim() : '';
        const selectedStatus = statusFilter ? statusFilter.value.trim().toLowerCase() : '';
        const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = [...allStudents];

        // Status Filter
        if (selectedStatus) {
            if (selectedStatus === 'enrolled') {
                filtered = filtered.filter(s => s.status === 'enrolled' || s.status === 'approved');
            } else if (selectedStatus === 'pending') {
                filtered = filtered.filter(s => s.status === 'pending');
            } else if (selectedStatus === 'rejected') {
                filtered = filtered.filter(s => s.status === 'rejected');
            } else if (selectedStatus === 'none') {
                filtered = filtered.filter(s => s.status === 'none' || !s.enrollment_id);
            }
        }

        // Grade Filter
        if (selectedGrade) {
            filtered = filtered.filter(s => (s.grade_level || '').toLowerCase().includes(selectedGrade.toLowerCase()));
        }

        // Search Keyword Filter
        if (searchVal) {
            filtered = filtered.filter(s => 
                (s.fullname || '').toLowerCase().includes(searchVal) ||
                (s.email || '').toLowerCase().includes(searchVal) ||
                (s.lrn || '').toLowerCase().includes(searchVal) ||
                (s.strand || '').toLowerCase().includes(searchVal) ||
                (s.grade_level || '').toLowerCase().includes(searchVal) ||
                (s.school_year || '').toLowerCase().includes(searchVal)
            );
        }

        if (badgeCount) {
            badgeCount.textContent = `Total: ${filtered.length} students`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="no-data">
                            <i class="fas fa-user-graduate"></i>
                            <h3>No Students Found</h3>
                            <p>${searchVal || selectedGrade || selectedStatus ? 'No student records match your filter criteria.' : 'No students registered in the database yet.'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(s => {
            const initial = (s.fullname || 'S').charAt(0).toUpperCase();
            const rowClass = s.student_type === 'Old' ? 'old-student-row' : 'new-student-row';

            // Status Badge Formatting
            let statusBadgeHtml = '';
            if (s.status === 'approved' || s.status === 'enrolled') {
                statusBadgeHtml = `<span class="status-badge status-enrolled"><i class="fas fa-check-circle"></i> Enrolled</span>`;
            } else if (s.status === 'pending') {
                statusBadgeHtml = `<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>`;
            } else if (s.status === 'rejected') {
                statusBadgeHtml = `<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Rejected</span>`;
            } else {
                statusBadgeHtml = `<span class="status-badge status-none">No Enrollment</span>`;
            }

            // Student Type Badge
            const typeBadgeClass = s.student_type === 'Old' ? 'old' : 'new';
            const studentTypeBadge = `<span class="student-badge ${typeBadgeClass}">${s.student_type}</span>`;

            // Action links
            const viewLink = s.enrollment_id 
                ? `view_enrollment.html?id=${s.enrollment_id}`
                : `edit_student.html?id=${s.student_id}`;

            html += `
                <tr class="${rowClass}">
                    <td class="student-cell" data-label="Student">
                        <div class="student-info">
                            <div class="student-avatar">${initial}</div>
                            <div class="student-details">
                                <h4>${s.fullname}</h4>
                                <span><i class="fas fa-envelope"></i> ${s.email}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="ID Number">
                        <span class="id-badge">${s.lrn}</span>
                    </td>
                    <td data-label="Grade & Strand">
                        <span class="grade-tag">${s.grade_level}</span>
                        ${s.strand ? `<span class="strand-tag">${s.strand}</span>` : ''}
                    </td>
                    <td data-label="Status">
                        ${statusBadgeHtml}
                    </td>
                    <td data-label="Student Type">
                        ${studentTypeBadge}
                    </td>
                    <td data-label="School Year">
                        <span class="school-year">${s.school_year}</span>
                    </td>
                    <td data-label="Actions">
                        <div class="action-btns">
                            <a href="${viewLink}" class="action-btn view" title="View Details">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="edit_student.html?id=${s.student_id}" class="action-btn edit" title="Edit Student">
                                <i class="fas fa-edit"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // ============================================
    // FILTERS & SEARCH EVENT HANDLERS
    // ============================================

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderStudentsTable();
        });
    }

    if (gradeFilter) {
        gradeFilter.addEventListener('change', renderStudentsTable);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', renderStudentsTable);
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderStudentsTable);
    }

    // Read URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const gradeParam = urlParams.get('grade');

    if (statusParam && statusFilter) {
        statusFilter.value = statusParam;
    }
    if (gradeParam && gradeFilter) {
        gradeFilter.value = gradeParam;
    }

    // ============================================
    // EXPORT TO CSV & PRINT
    // ============================================

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            if (!allStudents || allStudents.length === 0) {
                showAlert('No student records available to export.', 'error');
                return;
            }

            const headers = ['#', 'Student Name', 'Email', 'ID / LRN', 'Grade Level', 'Strand', 'Status', 'Student Type', 'School Year'];
            let csv = headers.join(',') + '\n';

            allStudents.forEach((s, idx) => {
                const row = [
                    idx + 1,
                    `"${s.fullname}"`,
                    `"${s.email}"`,
                    `"${s.lrn}"`,
                    `"${s.grade_level}"`,
                    `"${s.strand || 'N/A'}"`,
                    `"${s.status}"`,
                    `"${s.student_type}"`,
                    `"${s.school_year}"`
                ];
                csv += row.join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `students_list_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            showAlert('✅ Student records exported to CSV successfully!', 'success');
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    // ============================================
    // REALTIME SUBSCRIPTIONS (RECEIVE UPDATES FROM STUDENTS)
    // ============================================

    function setupRealtimeStudentUpdates() {
        try {
            supabase
                .channel('students-management-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'students'
                }, (payload) => {
                    console.log('🔄 Realtime student record updated:', payload);
                    playNotificationChime();
                    showNotificationToast({
                        title: 'Student Information Updated',
                        message: `Student record was modified or added.`
                    });
                    loadStudentsData();
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'enrollments'
                }, (payload) => {
                    console.log('🔄 Realtime enrollment change:', payload);
                    playNotificationChime();
                    const eventType = payload.eventType;
                    const stName = payload.new ? `${payload.new.first_name || ''} ${payload.new.last_name || ''}`.trim() : '';
                    showNotificationToast({
                        title: eventType === 'INSERT' ? 'New Enrollment Application' : 'Enrollment Updated',
                        message: stName ? `${stName} submitted/updated an application.` : 'An enrollment record was updated.'
                    });
                    loadStudentsData();
                    loadNotifications();
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, (payload) => {
                    const notif = payload.new;
                    if (!notif.role || notif.role === 'registrar') {
                        playNotificationChime();
                        showNotificationToast(notif);
                        loadNotifications();
                        loadStudentsData();
                    }
                })
                .subscribe();
        } catch(err) {
            console.warn('Realtime subscription error on students page:', err);
        }

        // Cross-tab / same browser storage synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === 'hes_latest_notification' || e.key === 'hes_student_updated' || e.key === 'hes_enrollment_updated') {
                try {
                    let data = null;
                    if (e.newValue) data = JSON.parse(e.newValue);
                    if (!data || !data.role || data.role === 'registrar') {
                        playNotificationChime();
                        if (data && data.title) showNotificationToast(data);
                        loadNotifications();
                        loadStudentsData();
                    }
                } catch(err) {
                    loadStudentsData();
                }
            }
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    populateGradeFilter();
    await loadNotifications();
    await loadStudentsData();
    setupRealtimeStudentUpdates();

    console.log('✅ Student Management ready and actively listening for student updates in realtime.');

})();