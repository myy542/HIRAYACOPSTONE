/**
 * Student Dashboard - Supabase Integration
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📊 Student Dashboard (Supabase) ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    // Header & Date Badge
    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const studentNameHeader = document.getElementById('studentNameHeader');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentDateDisplay = document.getElementById('currentDateDisplay');

    // Banner elements
    const bannerInitial = document.getElementById('bannerInitial');
    const bannerStudentName = document.getElementById('bannerStudentName');
    const bannerLRN = document.getElementById('bannerLRN');
    const bannerGradeSection = document.getElementById('bannerGradeSection');
    const bannerStrand = document.getElementById('bannerStrand');
    const bannerSchoolYear = document.getElementById('bannerSchoolYear');

    // Stats
    const enrollmentDisplay = document.getElementById('enrollmentDisplay');
    const enrollmentStatus = document.getElementById('enrollmentStatus');
    const subjectsCount = document.getElementById('subjectsCount');
    const averageGrade = document.getElementById('averageGrade');
    const attendanceRate = document.getElementById('attendanceRate');
    const rateProgressFill = document.getElementById('rateProgressFill');
    const attendanceRateLabel = document.getElementById('attendanceRateLabel');

    // Notifications
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const notifList = document.getElementById('notificationList');
    const notifCount = document.getElementById('notifCount');
    const markAllBtn = document.getElementById('markAllReadBtn');

    // Student Type
    const studentTypeBadge = document.getElementById('studentTypeBadge');
    const studentTypeIcon = document.getElementById('studentTypeIcon');
    const studentTypeTitle = document.getElementById('studentTypeTitle');
    const studentTypeDesc = document.getElementById('studentTypeDesc');

    // Activities
    const recentActivities = document.getElementById('recentActivities');

    // Set today date
    const today = new Date();
    if (currentDateDisplay) {
        currentDateDisplay.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function getStudentInitials(name) {
        if (!name || typeof name !== 'string') return 'S';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0);
        if (words.length === 0) return 'S';
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function sanitizeStudentName(name, email) {
        if (!name && email) {
            return email.split('@')[0];
        }
        return (name || '').trim();
    }

    // ============================================
    // SESSION CHECK (Supabase / localStorage)
    // ============================================

    let sessionUser = null;
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch(e) {}

    if (!sessionUser) {
        console.warn('⚠️ No active student session, redirecting...');
        window.location.replace('../auth/login.html');
        return;
    }

    // Check if another role is accessing student dashboard
    if (sessionUser && sessionUser.role && sessionUser.role !== 'student') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'teacher': '../teacher/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    // Pre-populate student name from session immediately
    let studentDisplayName = sessionUser.displayName || 
        (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student'));

    if (studentName) studentName.textContent = studentDisplayName;
    if (studentNameHeader) studentNameHeader.textContent = studentDisplayName;
    if (studentInitial) studentInitial.textContent = getStudentInitials(studentDisplayName);
    if (bannerStudentName) bannerStudentName.textContent = studentDisplayName;
    if (bannerInitial) bannerInitial.textContent = getStudentInitials(studentDisplayName);

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('plsnhs_student_avatar');
            localStorage.removeItem('plsnhs_student_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // LOAD DASHBOARD DATA FROM SUPABASE
    // ============================================

    async function loadDashboardData() {
        try {
            const userEmail = sessionUser.email || '';
            const userUid = sessionUser.uid || '';

            // 1. Fetch student info
            let studentRow = null;
            try {
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('*')
                    .or(`email.eq.${userEmail},id.eq.${userUid}`);

                if (studentsData && studentsData.length > 0) {
                    studentRow = studentsData[0];
                    let fullName = `${studentRow.first_name || ''} ${studentRow.last_name || ''}`.trim();
                    fullName = sanitizeStudentName(fullName, userEmail);
                    if (fullName) {
                        studentDisplayName = fullName;
                        try {
                            localStorage.setItem('plsnhs_student_name', fullName);
                        } catch(e) {}
                        if (studentName) studentName.textContent = fullName;
                        if (studentNameHeader) studentNameHeader.textContent = fullName;
                        if (studentInitial) studentInitial.textContent = getStudentInitials(fullName);
                        if (bannerStudentName) bannerStudentName.textContent = fullName;
                        if (bannerInitial) bannerInitial.textContent = getStudentInitials(fullName);
                    }
                }
            } catch(e) {
                console.warn('Student query error:', e);
            }

            // 2. Fetch enrollments
            let enrollments = [];
            const studentId = studentRow?.id || userUid;

            try {
                let query = supabase
                    .from('enrollments')
                    .select('*');

                if (userEmail && studentId) {
                    query = query.or(`email.eq.${userEmail},student_id.eq.${studentId}`);
                } else if (userEmail) {
                    query = query.eq('email', userEmail);
                } else if (studentId) {
                    query = query.eq('student_id', studentId);
                }

                const { data, error } = await query.order('created_at', { ascending: false });

                if (!error && data) {
                    enrollments = data;
                }
            } catch (err) {
                console.warn('Enrollment query error:', err);
            }

            // 3. Fallback to localStorage dummy data if empty
            if (enrollments.length === 0) {
                try {
                    const localSaved = localStorage.getItem('plsnhs_enrollments');
                    if (localSaved) {
                        const parsed = JSON.parse(localSaved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            enrollments = parsed;
                        }
                    }
                } catch(e) {}
            }

            // Latest enrollment
            const latest = enrollments[0] || null;
            
            // Update enrollment display
            if (latest) {
                const rawSt = (latest.status || 'pending').toLowerCase();
                const displayStatus = (rawSt === 'enrolled' || rawSt === 'approved') ? 'Enrolled' : (rawSt === 'rejected' ? 'Rejected' : 'Pending');
                const grade = latest.grade_level || latest.grade || studentRow?.grade_level || 'Not Enrolled';
                if (enrollmentDisplay) enrollmentDisplay.textContent = grade;
                if (enrollmentStatus) {
                    enrollmentStatus.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 5px;"></i> ${displayStatus}`;
                    if (displayStatus === 'Enrolled') {
                        enrollmentStatus.style.color = '#10b981';
                    } else if (displayStatus === 'Pending') {
                        enrollmentStatus.style.color = '#f59e0b';
                    } else {
                        enrollmentStatus.style.color = '#ef4444';
                    }
                }
                sessionUser.status = displayStatus;
                try {
                    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
                } catch(e) {}
            } else {
                if (enrollmentDisplay) enrollmentDisplay.textContent = studentRow?.grade_level || 'Not Enrolled';
                if (enrollmentStatus) {
                    enrollmentStatus.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 5px;"></i> No Record`;
                    enrollmentStatus.style.color = '#6c757d';
                }
            }

            // Update Banner details
            const lrnVal = studentRow?.lrn || sessionUser.lrn || latest?.lrn || '109876543201';
            const gradeVal = latest?.grade_level || latest?.grade || studentRow?.grade_level || 'Grade 11';
            const sectionVal = latest?.section || studentRow?.section || '11-STEM A';
            const strandVal = latest?.strand || studentRow?.strand || (gradeVal.includes('11') || gradeVal.includes('12') ? 'STEM' : 'N/A');
            const syVal = latest?.school_year || latest?.schoolYear || '2025-2026';

            if (bannerLRN) bannerLRN.innerHTML = `<i class="fas fa-id-card"></i> LRN: ${lrnVal}`;
            if (bannerGradeSection) bannerGradeSection.textContent = `${gradeVal} - ${sectionVal}`;
            if (bannerStrand) bannerStrand.textContent = strandVal;
            if (bannerSchoolYear) bannerSchoolYear.textContent = syVal;

            // Fetch subjects count
            try {
                const { count } = await supabase
                    .from('subjects')
                    .select('*', { count: 'exact', head: true });
                if (subjectsCount) {
                    subjectsCount.textContent = count && count > 0 ? count : (latest ? 8 : 0);
                }
            } catch(e) {
                if (subjectsCount) subjectsCount.textContent = latest ? 8 : 0;
            }

            // Average grade
            const avg = latest?.general_average ? `${latest.general_average}%` : (latest ? '88.50%' : '--');
            if (averageGrade) averageGrade.textContent = avg;

            // 4. Fetch Student Attendance
            let attendanceRecords = [];

            try {
                let attQuery = supabase.from('attendance').select('*');
                if (studentId) {
                    attQuery = attQuery.eq('student_id', studentId);
                } else if (userEmail) {
                    attQuery = attQuery.eq('email', userEmail);
                }
                const { data: attData, error: attErr } = await attQuery.order('date', { ascending: false });
                if (!attErr && attData && attData.length > 0) {
                    attendanceRecords = attData;
                }
            } catch (e) {}

            // Check local synced attendance
            if (attendanceRecords.length === 0) {
                try {
                    const storedAdminAtt = localStorage.getItem('plsnhs_student_attendance');
                    if (storedAdminAtt) {
                        const parsed = JSON.parse(storedAdminAtt);
                        if (Array.isArray(parsed)) {
                            const myMatches = parsed.filter(item => {
                                const matchLRN = item.lrn && String(item.lrn) === String(lrnVal);
                                const matchName = item.name && item.name.toLowerCase() === studentDisplayName.toLowerCase();
                                const matchId = item.student_id && String(item.student_id) === String(studentId);
                                return matchLRN || matchName || matchId;
                            });
                            if (myMatches.length > 0) {
                                attendanceRecords = myMatches;
                            }
                        }
                    }
                } catch(e) {}
            }

            // Fallback generation if no records yet
            if (attendanceRecords.length === 0) {
                attendanceRecords = generateStudentAttendanceSnippet(studentDisplayName, lrnVal);
            }

            // Calculate attendance rate
            if (attendanceRecords.length > 0) {
                const totalDays = attendanceRecords.length;
                let attended = 0;
                attendanceRecords.forEach(r => {
                    const st = (r.status || '').toLowerCase();
                    if (st === 'present' || st === 'late' || st === 'excused') attended++;
                });
                const rate = ((attended / totalDays) * 100).toFixed(0);
                if (attendanceRate) attendanceRate.textContent = `${rate}%`;
                if (rateProgressFill) rateProgressFill.style.width = `${Math.min(100, Math.max(0, rate))}%`;
                if (attendanceRateLabel) {
                    attendanceRateLabel.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${attended}/${totalDays} Days Present`;
                }
            } else {
                if (attendanceRate) attendanceRate.textContent = '100%';
                if (rateProgressFill) rateProgressFill.style.width = '100%';
                if (attendanceRateLabel) {
                    attendanceRateLabel.innerHTML = `<i class="fas fa-check-circle text-success"></i> Perfect Standing`;
                }
            }

            // Student Type
            determineStudentType(enrollments, studentRow);

            // Recent attendance activities
            renderRecentActivities(attendanceRecords.slice(0, 5));

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // ============================================
    // GENERATE ATTENDANCE SNIPPET HELPER
    // ============================================

    function generateStudentAttendanceSnippet(studentName, lrn) {
        const logs = [];
        const todayObj = new Date();
        let dayOffset = 0;
        let count = 0;

        while (count < 10 && dayOffset < 20) {
            const d = new Date(todayObj);
            d.setDate(todayObj.getDate() - dayOffset);
            dayOffset++;

            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            const dateStr = d.toISOString().split('T')[0];
            const hash = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + (lrn.charCodeAt(lrn.length - 1) || 7));
            const roll = hash % 100;

            let status = 'Present';
            let timeIn = '07:20 AM';
            let timeOut = '04:30 PM';
            let remarks = 'On time';

            if (dayOffset === 1) {
                timeIn = '07:18 AM';
                timeOut = '04:30 PM';
                status = 'Present';
                remarks = 'On time';
            } else if (roll < 10) {
                status = 'Late';
                timeIn = '08:15 AM';
                timeOut = '04:30 PM';
                remarks = 'Traffic';
            } else if (roll === 12) {
                status = 'Excused';
                timeIn = '—';
                timeOut = '—';
                remarks = 'Official reason';
            } else {
                status = 'Present';
                timeIn = '07:25 AM';
                timeOut = '04:30 PM';
                remarks = 'On time';
            }

            logs.push({
                date: dateStr,
                time_in: timeIn,
                time_out: timeOut,
                timeIn: timeIn,
                timeOut: timeOut,
                status: status,
                remarks: remarks
            });
            count++;
        }
        return logs;
    }

    // ============================================
    // DETERMINE STUDENT TYPE
    // ============================================

    function determineStudentType(enrollments, studentRow) {
        const count = enrollments.length;
        let icon = 'fa-star';
        let color = '#0b2b4a';
        let display = 'New Student';
        let description = 'First time enrollee';

        if (count > 1) {
            icon = 'fa-undo-alt';
            display = 'Continuing Student';
            description = 'Continuing student - progressing to next grade level';
        }

        const hasOldSchool = enrollments.some(e => e.previous_school || e.previousSchool);
        if (hasOldSchool && count <= 1) {
            icon = 'fa-exchange-alt';
            display = 'Transferee Student';
            description = 'Transferred from another school - requirements verified';
        }

        if (studentTypeBadge) {
            studentTypeBadge.style.background = color;
            studentTypeBadge.innerHTML = `<i class="fas ${icon}"></i> ${display}`;
        }

        if (studentTypeIcon) {
            studentTypeIcon.style.background = color;
            studentTypeIcon.innerHTML = `<i class="fas ${icon}"></i>`;
        }

        if (studentTypeTitle) {
            studentTypeTitle.textContent = display;
        }

        if (studentTypeDesc) {
            studentTypeDesc.textContent = description;
        }
    }

    // ============================================
    // RENDER RECENT ATTENDANCE ACTIVITIES
    // ============================================

    function renderRecentActivities(attendanceLogs) {
        if (!recentActivities) return;

        if (!attendanceLogs || attendanceLogs.length === 0) {
            recentActivities.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content" style="text-align: center; padding: 30px;">
                        <i class="fas fa-calendar-times" style="font-size: 40px; color: #999; opacity: 0.3; margin-bottom: 10px;"></i>
                        <p style="color: #999;">No attendance records found yet.</p>
                        <a href="attendance.html" style="color: #0b2b4a; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 10px;">
                            View Attendance Page <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        recentActivities.innerHTML = attendanceLogs.map((item, index) => {
            const st = item.status || 'Present';
            const stLower = st.toLowerCase();
            const statusClass = stLower === 'present' ? 'dot-approved' : 
                               (stLower === 'late' ? 'dot-pending' : 'dot-completed');
            const statusTextClass = stLower === 'present' ? 'status-approved' : 
                                   (stLower === 'late' ? 'status-pending' : 'status-rejected');
            
            let dateStr = item.date || 'N/A';
            try {
                const d = new Date(item.date + 'T00:00:00');
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                }
            } catch(e) {}

            const timeInStr = item.time_in || item.timeIn || '—';
            const timeOutStr = item.time_out || item.timeOut || '—';

            return `
                <div class="activity-item">
                    <div class="activity-dot ${statusClass}"></div>
                    <div class="activity-content">
                        <div class="activity-title">
                            Daily Attendance - ${dateStr}
                            ${index === 0 ? '<span style="margin-left: 10px; font-size: 11px; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-weight: 600;">Latest</span>' : ''}
                        </div>
                        <div class="activity-time">
                            <i class="far fa-clock"></i> In: <strong>${timeInStr}</strong> | Out: <strong>${timeOutStr}</strong> • ${item.remarks || 'On time'}
                        </div>
                    </div>
                    <div class="activity-status ${statusTextClass}">
                        ${st}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // LOAD NOTIFICATIONS (from Supabase or Local)
    // ============================================

    async function loadNotifications() {
        let notifications = [];
        try {
            const uid = sessionUser?.uid || sessionUser?.id;
            let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            if (uid) {
                query = query.or(`user_id.eq.${uid},role.eq.student`);
            } else {
                query = query.eq('role', 'student');
            }

            const { data } = await query;
            
            if (data && data.length > 0) {
                notifications = data.map(n => ({
                    id: n.id,
                    type: n.type || 'action',
                    title: n.title,
                    message: n.message,
                    time: new Date(n.created_at).toLocaleDateString(),
                    read: n.read || n.is_read || false
                }));
            }
        } catch(e) {
            console.warn('Notifications fetch warning:', e);
        }

        if (notifications.length === 0) {
            notifications = [
                { id: 1, type: 'update', title: '📢 Enrollment Period Open', message: 'The enrollment period for SY 2026-2027 is now open.', time: 'Today', read: false },
                { id: 2, type: 'reminder', title: '⏰ Requirements Submission', message: 'Please submit your enrollment requirements before the deadline.', time: 'Yesterday', read: false },
                { id: 3, type: 'action', title: '✅ Enrollment Approved', message: 'Your enrollment has been successfully recorded in the system.', time: '3 days ago', read: true }
            ];
        }
        
        renderNotifications(notifications);
        updateNotificationCount(notifications.filter(n => !n.read).length);
    }

    function renderNotifications(notifications) {
        if (!notifList) return;

        if (notifications.length === 0) {
            notifList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        const icons = {
            update: 'fa-bullhorn',
            action: 'fa-check-circle',
            reminder: 'fa-clock',
            alert: 'fa-exclamation-triangle',
            message: 'fa-envelope'
        };
        
        notifList.innerHTML = notifications.map(notif => `
            <div class="notif-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notif-icon notif-${notif.type}">
                    <i class="fas ${icons[notif.type] || 'fa-bell'}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-message">${notif.message}</div>
                    <div class="notif-time">${notif.time}</div>
                </div>
                ${!notif.read ? `<button type="button" class="mark-read-btn" data-id="${notif.id}"><i class="fas fa-check"></i></button>` : ''}
            </div>
        `).join('');
        
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const item = this.closest('.notif-item');
                item.classList.remove('unread');
                item.classList.add('read');
                this.remove();
                const unread = document.querySelectorAll('.notif-item.unread').length;
                updateNotificationCount(unread);
            });
        });
    }

    function updateNotificationCount(count) {
        if (!notifCount) return;
        if (count > 0) {
            notifCount.textContent = count;
            notifCount.style.display = 'flex';
        } else {
            notifCount.style.display = 'none';
        }
    }

    // ============================================
    // NOTIFICATION DROPDOWN
    // ============================================

    if (notifBtn) {
        notifBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (notifDropdown) {
                notifDropdown.classList.toggle('show');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (notifDropdown && notifBtn) {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        }
    });

    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            document.querySelectorAll('.notif-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.classList.add('read');
                const btn = item.querySelector('.mark-read-btn');
                if (btn) btn.remove();
            });
            updateNotificationCount(0);
        });
    }

    // Initialize
    loadDashboardData();
    loadNotifications();

})();