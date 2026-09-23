/**
 * Student Schedule - Supabase Integration
 * HES - HES, Hiraya Enrollment System
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📅 Student Schedule (Supabase) ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Section info
    const sectionName = document.getElementById('sectionName');
    const gradeDisplay = document.getElementById('gradeDisplay');
    const schoolYearDisplay = document.getElementById('schoolYearDisplay');

    // Stats
    const totalClasses = document.getElementById('totalClasses');
    const totalSubjects = document.getElementById('totalSubjects');
    const totalTeachers = document.getElementById('totalTeachers');
    const freePeriods = document.getElementById('freePeriods');

    // Today's classes
    const todayClasses = document.getElementById('todayClasses');
    const todayName = document.getElementById('todayName');

    // Schedule table
    const scheduleBody = document.getElementById('scheduleBody');

    // Summary
    const subjectsList = document.getElementById('subjectsList');
    const teachersList = document.getElementById('teachersList');
    const sectionInfo = document.getElementById('sectionInfo');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentEnrollment = null;
    let studentRow = null;
    let schedules = [];
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
        console.warn('⚠️ No active user session found, redirecting to login...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (sessionUser.role && sessionUser.role !== 'student') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'teacher': '../teacher/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
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

    let displayName = sessionUser.displayName || 
        (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : 
        (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student'));
    displayName = sanitizeStudentName(displayName, sessionUser.email);

    if (studentName) studentName.textContent = displayName;
    if (studentInitial) studentInitial.textContent = getStudentInitials(displayName);

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('hes_student_avatar');
            localStorage.removeItem('hes_student_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        if (/am|pm/i.test(timeStr)) return timeStr.trim();
        const parts = String(timeStr).split(':');
        if (parts.length >= 2) {
            let hour = parseInt(parts[0], 10);
            const minute = parts[1].padStart(2, '0');
            if (isNaN(hour)) return timeStr;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            if (hour === 0) hour = 12;
            return `${hour}:${minute} ${ampm}`;
        }
        return timeStr;
    }

    // ============================================
    // LOAD SCHEDULE DATA
    // ============================================

    async function loadScheduleData() {
        try {
            const userEmail = sessionUser.email || '';
            const userUid = sessionUser.uid || '';

            // 1. Fetch student
            try {
                const { data: sRows } = await supabase
                    .from('students')
                    .select('*')
                    .or(`email.eq.${userEmail},id.eq.${userUid}`);

                if (sRows && sRows.length > 0) {
                    studentRow = sRows[0];
                    let fullName = `${studentRow.first_name || ''} ${studentRow.last_name || ''}`.trim();
                    fullName = sanitizeStudentName(fullName, userEmail);
                    if (fullName) {
                        if (studentName) studentName.textContent = fullName;
                        if (studentInitial) studentInitial.textContent = getStudentInitials(fullName);
                    }
                }
            } catch(e) {}

            // 2. Fetch latest enrollment
            const studentId = studentRow?.id || userUid;
            try {
                let query = supabase.from('enrollments').select('*');
                if (userEmail && studentId) {
                    query = query.or(`email.eq.${userEmail},student_id.eq.${studentId}`);
                } else if (userEmail) {
                    query = query.eq('email', userEmail);
                }
                const { data: enrRows } = await query.order('created_at', { ascending: false }).limit(1);
                if (enrRows && enrRows.length > 0) {
                    currentEnrollment = enrRows[0];
                }
            } catch(e) {}

            // 3. Section resolution
            let secName = studentRow?.section_name || currentEnrollment?.section || '';
            let sectionId = studentRow?.section_id;

            if (sectionId) {
                try {
                    const { data: secData } = await supabase
                        .from('sections')
                        .select('*')
                        .eq('id', sectionId)
                        .maybeSingle();
                    if (secData && secData.name) {
                        secName = secData.name;
                    }
                } catch(e) {}
            }

            if (sectionName) sectionName.textContent = secName || 'Section 11 - C';
            if (gradeDisplay) gradeDisplay.textContent = currentEnrollment?.grade_level || studentRow?.grade_level || 'Grade 11';
            if (schoolYearDisplay) schoolYearDisplay.textContent = currentEnrollment?.school_year || currentEnrollment?.last_school_year || '2025-2026';

            // 4. Load schedules, subjects, and users from Supabase
            try {
                const [{ data: schedData }, { data: subjectsData }, { data: usersData }] = await Promise.all([
                    supabase.from('schedules').select('*'),
                    supabase.from('subjects').select('*'),
                    supabase.from('users').select('id, first_name, last_name, email, role')
                ]);

                if (schedData && schedData.length > 0) {
                    let filtered = schedData;
                    if (sectionId) {
                        const secFiltered = schedData.filter(s => s.section_id === sectionId);
                        if (secFiltered.length > 0) filtered = secFiltered;
                    }

                    schedules = filtered.map(s => {
                        // 1. Resolve Subject Name
                        let subName = s.subject || s.subject_name || s.subject_title || s.name || s.title || s.subject_code;
                        if (!subName && s.subject_id) {
                            const foundSub = subjectsData?.find(sub => sub.id === s.subject_id || sub.code === s.subject_id);
                            if (foundSub) {
                                subName = foundSub.name || foundSub.title || foundSub.description;
                            }
                        }
                        if (!subName || subName === 'undefined' || subName === 'null') {
                            subName = 'General Subject';
                        }

                        // 2. Resolve Teacher Name
                        let teacherName = s.teacher || s.teacher_name;
                        if (!teacherName && s.teacher_id) {
                            const foundUser = usersData?.find(u => u.id === s.teacher_id);
                            if (foundUser) {
                                teacherName = `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim() || foundUser.email;
                            }
                        }
                        if (!teacherName || teacherName === 'undefined' || teacherName === 'null') {
                            teacherName = '';
                        }

                        return {
                            id: s.id,
                            day: s.day || 'Monday',
                            subject: subName,
                            teacher: teacherName,
                            room: s.room || s.room_name || 'Room 101',
                            start_time: s.start_time || '07:30',
                            end_time: s.end_time || '08:30',
                            section_id: s.section_id
                        };
                    });
                }
            } catch(e) {
                console.warn('Error loading schedule rows:', e);
            }

            // If empty, generate standard Grade 11 / 12 TVL-ICT schedule template
            if (schedules.length === 0) {
                schedules = getDefaultSchedule(gradeDisplay?.textContent || 'Grade 11');
            }

            renderScheduleUI(secName);

        } catch (error) {
            console.error('Error loading schedule data:', error);
            showAlert('❌ Error loading schedule: ' + error.message, 'error');
        }
    }

    function getDefaultSchedule(grade) {
        return [
            { day: 'Monday', subject: 'Oral Communication in Context', start_time: '07:30', end_time: '08:30', room: 'Room 201', teacher: 'Mrs. Santos' },
            { day: 'Monday', subject: 'General Mathematics', start_time: '08:30', end_time: '09:30', room: 'Room 201', teacher: 'Mr. Cruz' },
            { day: 'Monday', subject: 'Computer Systems Servicing', start_time: '10:00', end_time: '12:00', room: 'ICT Lab 1', teacher: 'Engr. Reyes' },
            { day: 'Tuesday', subject: 'Earth and Life Science', start_time: '07:30', end_time: '08:30', room: 'Science Lab', teacher: 'Ms. Garcia' },
            { day: 'Tuesday', subject: 'Komunikasyon at Pananaliksik', start_time: '08:30', end_time: '09:30', room: 'Room 201', teacher: 'G. Ramos' },
            { day: 'Tuesday', subject: 'Programming (Java/Web)', start_time: '10:00', end_time: '12:00', room: 'ICT Lab 2', teacher: 'Mr. Destinado' },
            { day: 'Wednesday', subject: 'Oral Communication in Context', start_time: '07:30', end_time: '08:30', room: 'Room 201', teacher: 'Mrs. Santos' },
            { day: 'Wednesday', subject: 'General Mathematics', start_time: '08:30', end_time: '09:30', room: 'Room 201', teacher: 'Mr. Cruz' },
            { day: 'Wednesday', subject: 'Physical Education 1', start_time: '10:00', end_time: '11:00', room: 'Gymnasium', teacher: 'Coach Perez' },
            { day: 'Thursday', subject: 'Earth and Life Science', start_time: '07:30', end_time: '08:30', room: 'Science Lab', teacher: 'Ms. Garcia' },
            { day: 'Thursday', subject: 'Komunikasyon at Pananaliksik', start_time: '08:30', end_time: '09:30', room: 'Room 201', teacher: 'G. Ramos' },
            { day: 'Thursday', subject: 'Empowerment Technologies', start_time: '10:00', end_time: '12:00', room: 'ICT Lab 1', teacher: 'Ms. Sellar' },
            { day: 'Friday', subject: 'Homeroom Guidance', start_time: '07:30', end_time: '08:30', room: 'Room 201', teacher: 'Mrs. Santos' },
            { day: 'Friday', subject: 'Computer Systems Servicing', start_time: '08:30', end_time: '10:30', room: 'ICT Lab 1', teacher: 'Engr. Reyes' }
        ];
    }

    function renderScheduleUI(secName) {
        // Stats
        const uniqueSubjs = [...new Set(schedules.map(s => s.subject).filter(Boolean))];
        const uniqueTchs = [...new Set(schedules.map(s => s.teacher).filter(Boolean))];

        if (totalClasses) totalClasses.textContent = schedules.length;
        if (totalSubjects) totalSubjects.textContent = uniqueSubjs.length || 7;
        if (totalTeachers) totalTeachers.textContent = uniqueTchs.length || 6;
        if (freePeriods) freePeriods.textContent = '2 Periods';

        // Today's classes
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = new Date().getDay();
        const currentDayName = (currentDayIndex >= 1 && currentDayIndex <= 5) ? dayNames[currentDayIndex] : 'Monday';

        if (todayName) todayName.textContent = currentDayName;

        const todaysList = schedules.filter(s => (s.day || '').toLowerCase() === currentDayName.toLowerCase());

        if (todayClasses) {
            if (todaysList.length === 0) {
                todayClasses.innerHTML = `
                    <div class="empty-classes" style="padding: 12px; color: #64748b; font-size: 0.9rem;">
                        <i class="fas fa-calendar-day"></i> No classes scheduled for today.
                    </div>
                `;
            } else {
                todayClasses.innerHTML = todaysList.map(c => `
                    <div class="today-class-card">
                        <div class="class-time"><i class="far fa-clock"></i> ${formatTime(c.start_time)} - ${formatTime(c.end_time)}</div>
                        <div class="class-subject">${c.subject}</div>
                        <div class="class-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${c.room || 'Room 101'}</span>
                            ${c.teacher ? `<span><i class="fas fa-chalkboard-teacher"></i> ${c.teacher}</span>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }

        // Weekly schedule table
        if (scheduleBody) {
            const timeMap = [
                '07:00 - 08:00',
                '08:00 - 09:00',
                '09:00 - 10:00',
                '10:00 - 10:30 (Recess)',
                '10:30 - 11:30',
                '11:30 - 12:30'
            ];

            scheduleBody.innerHTML = timeMap.map(slot => {
                const isRecess = slot.includes('Recess');
                if (isRecess) {
                    return `
                        <tr class="recess-row">
                            <td class="time-col"><strong>${slot}</strong></td>
                            <td colspan="5" style="text-align: center; background: #fef3c7; color: #92400e; font-weight: 700;">
                                <i class="fas fa-coffee"></i> BREAK / RECESS
                            </td>
                        </tr>
                    `;
                }

                const startTimeRaw = slot.split(' - ')[0].trim();
                const startHour = parseInt(startTimeRaw.split(':')[0], 10);

                const dayCells = daysOrder.map(day => {
                    const match = schedules.find(s => {
                        if ((s.day || '').toLowerCase() !== day.toLowerCase()) return false;
                        const sHour = parseInt(String(s.start_time).split(':')[0], 10);
                        return sHour === startHour;
                    });

                    if (match) {
                        return `
                            <td class="schedule-cell active">
                                <div class="subj-name">${match.subject}</div>
                                <div class="subj-room"><i class="fas fa-door-open"></i> ${match.room || 'Room 101'}</div>
                                ${match.teacher ? `<div class="subj-teacher" style="font-size: 0.75rem; color: #64748b; margin-top: 2px;"><i class="fas fa-user"></i> ${match.teacher}</div>` : ''}
                            </td>
                        `;
                    }
                    return `<td class="schedule-cell empty">--</td>`;
                }).join('');

                const formattedSlot = `${formatTime(slot.split(' - ')[0])} - ${formatTime(slot.split(' - ')[1])}`;

                return `
                    <tr>
                        <td class="time-col"><strong>${formattedSlot}</strong></td>
                        ${dayCells}
                    </tr>
                `;
            }).join('');
        }

        // Summary lists & badges
        const subjectCountBadge = document.getElementById('subjectCountBadge');
        const teacherCountBadge = document.getElementById('teacherCountBadge');

        if (subjectCountBadge) subjectCountBadge.textContent = uniqueSubjs.length;
        if (teacherCountBadge) teacherCountBadge.textContent = uniqueTchs.length;

        if (subjectsList) {
            subjectsList.innerHTML = uniqueSubjs.map(s => `<li><i class="fas fa-book"></i> ${s}</li>`).join('');
        }

        if (teachersList) {
            if (uniqueTchs.length === 0) {
                teachersList.innerHTML = `<li><i class="fas fa-chalkboard-teacher"></i> Faculty Teachers</li>`;
            } else {
                teachersList.innerHTML = uniqueTchs.map(t => `<li><i class="fas fa-chalkboard-teacher"></i> ${t}</li>`).join('');
            }
        }

        if (sectionInfo) {
            sectionInfo.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.9rem; color: #334155;">
                    <div><strong>Section:</strong> ${secName || 'Section 11 - C'}</div>
                    <div><strong>Grade Level:</strong> ${gradeDisplay?.textContent || 'Grade 11'}</div>
                    <div><strong>School Year:</strong> ${schoolYearDisplay?.textContent || '2025-2026'}</div>
                    <div><strong>Total Classes:</strong> ${schedules.length} scheduled</div>
                </div>
            `;
        }
    }

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        alertContainer.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 4000);
    }

    // Initialize
    loadScheduleData();

})();