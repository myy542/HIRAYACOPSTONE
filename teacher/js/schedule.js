/**
 * Teacher Schedule Script
 * Dynamic Supabase Integration
 * Matches the mobile app teacher schedule fetching & rendering architecture
 */

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    console.log('📅 Teacher Schedule (Supabase) ready');

    // DOM Elements - Header & Profile
    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const dateBadge = document.getElementById('dateBadge');
    const alertContainer = document.getElementById('alertContainer');
    const btnRefresh = document.getElementById('btnRefresh');

    // DOM Elements - Stats
    const totalClassesStat = document.getElementById('totalClasses');
    const totalSectionsStat = document.getElementById('totalSections');
    const totalSubjectsStat = document.getElementById('totalSubjects');
    const freePeriodsStat = document.getElementById('freePeriods');

    // DOM Elements - Views & Controls
    const scheduleContainer = document.getElementById('scheduleContainer');
    const timetableContainer = document.getElementById('timetableContainer');
    const searchInput = document.getElementById('searchScheduleInput');
    const dayFilterChips = document.querySelectorAll('.day-chip');
    const viewToggleBtns = document.querySelectorAll('.btn-view-toggle');

    // State
    let sessionUser = null;
    let teacherRecord = null;
    let schedules = [];
    let activeDayFilter = 'all';
    let currentViewMode = 'cards'; // 'cards' or 'grid'

    // ============================================
    // 1. AUTH & SESSION CHECK
    // ============================================
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) sessionUser = JSON.parse(stored);
    } catch(e) {
        console.error('Error reading currentUser:', e);
    }

    if (!sessionUser) {
        console.warn('⚠️ No active teacher session, redirecting...');
        window.location.replace('../auth/login.html');
        return;
    }

    const currentUserId = sessionUser.id || sessionUser.uid;
    const userEmail = sessionUser.email || '';
    const userFullName = sessionUser.firstName 
        ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim()
        : (sessionUser.displayName || sessionUser.name || 'Faculty Teacher');

    if (teacherName) teacherName.textContent = userFullName;
    if (typeof window.syncTeacherAvatarAndName === 'function') {
        window.syncTeacherAvatarAndName();
    } else if (teacherInitial) {
        teacherInitial.textContent = (userFullName || 'T').charAt(0).toUpperCase();
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            try { await supabase.auth.signOut(); } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // Set Live Header Date
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // Toast Alert Helper
    function showAlert(type, message, duration = 4000) {
        if (!alertContainer) return;
        const icon = type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 16px;
            font-size: 13.5px;
            font-weight: 500;
            background: ${type === 'success' ? '#dcfce7' : type === 'warning' ? '#fef3c7' : '#fee2e2'};
            color: ${type === 'success' ? '#166534' : type === 'warning' ? '#92400e' : '#991b1b'};
            border: 1px solid ${type === 'success' ? '#bbf7d0' : type === 'warning' ? '#fde68a' : '#fecaca'};
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            animation: fadeIn 0.2s ease-out;
        `;
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <div style="flex:1;">${message}</div>`;
        alertContainer.prepend(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }

    // ============================================
    // 2. TIME FORMATTER (Matches mobile formatTime)
    // ============================================
    const formatTime = (t) => {
        if (!t) return 'N/A';
        if (t.includes('AM') || t.includes('PM')) return t;
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    // Calculate duration in hours/minutes
    const getDurationText = (startStr, endStr) => {
        if (!startStr || !endStr) return '';
        try {
            const [sh, sm] = startStr.split(':').map(Number);
            const [eh, em] = endStr.split(':').map(Number);
            const totalMins = (eh * 60 + em) - (sh * 60 + sm);
            if (totalMins > 0) {
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
                if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
                return `${mins} mins`;
            }
        } catch(e) {}
        return '';
    };

    // ============================================
    // 3. LOAD SCHEDULE DATA (Matching Mobile App Flow)
    // ============================================
    async function loadSchedule() {
        if (scheduleContainer) {
            scheduleContainer.innerHTML = `
                <div style="text-align: center; padding: 48px 20px; color: #64748b;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #1B2A4A; margin-bottom: 12px;"></i>
                    <p style="font-size: 14px; margin: 0;">Loading your assigned schedule from database...</p>
                </div>
            `;
        }

        try {
            // 1. Fetch user & teacher record
            let targetUserId = currentUserId;
            if (userEmail) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', userEmail)
                    .maybeSingle();

                if (userData) targetUserId = userData.id;
            }

            // 2. Fetch teacher data
            const { data: teacherData, error: tErr } = await supabase
                .from('teachers')
                .select('*')
                .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
                .maybeSingle();

            if (!teacherData) {
                console.warn('Teacher record not found in database.');
                renderEmptyState('No teacher record found. Please ensure your teacher profile is registered.');
                return;
            }

            teacherRecord = teacherData;
            console.log('👨‍🏫 Teacher found:', teacherRecord.id);

            // 3. Fetch schedules for this teacher
            const { data: scheduleRows, error: sErr } = await supabase
                .from('schedules')
                .select('*')
                .eq('teacher_id', teacherRecord.id);

            if (sErr) throw sErr;

            if (!scheduleRows || scheduleRows.length === 0) {
                schedules = [];
                updateStats();
                renderScheduleCards();
                renderTimetableGrid();
                return;
            }

            // 4. Fetch related subjects & sections in parallel
            const subjectIds = [...new Set(scheduleRows.map(s => s.subject_id).filter(Boolean))];
            const sectionIds = [...new Set(scheduleRows.map(s => s.section_id).filter(Boolean))];

            const subjectMap = {};
            const sectionMap = {};

            const promises = [];

            if (subjectIds.length > 0) {
                promises.push(
                    supabase.from('subjects').select('id, name, code, grade_level').in('id', subjectIds)
                        .then(({ data: subs }) => {
                            (subs || []).forEach(s => { subjectMap[s.id] = s; });
                        })
                );
            }

            if (sectionIds.length > 0) {
                promises.push(
                    supabase.from('sections').select('id, name, grade_level, strand, room').in('id', sectionIds)
                        .then(({ data: secs }) => {
                            (secs || []).forEach(s => { sectionMap[s.id] = s; });
                        })
                );
            }

            await Promise.all(promises);

            // 5. Map & format schedules exactly like the mobile app
            schedules = scheduleRows.map(s => {
                const sub = subjectMap[s.subject_id] || {};
                const sec = sectionMap[s.section_id] || {};

                return {
                    id: s.id,
                    day: s.day || 'Monday',
                    time_start: formatTime(s.start_time),
                    time_end: formatTime(s.end_time),
                    start_raw: s.start_time || '00:00:00',
                    end_raw: s.end_time || '00:00:00',
                    duration: getDurationText(s.start_time, s.end_time),
                    subject_name: sub.name || 'Unknown Subject',
                    subject_code: sub.code || '',
                    section_name: sec.name || 'No Section',
                    grade_level: sec.grade_level || sub.grade_level || '',
                    room: s.room || sec.room || 'N/A'
                };
            });

            console.log(`✅ Loaded ${schedules.length} schedule classes`);

            updateStats();
            renderScheduleCards();
            renderTimetableGrid();

        } catch (err) {
            console.error('❌ Error loading schedule:', err);
            showAlert('error', `Failed to load schedule: ${err.message || 'Unknown error'}`);
            renderEmptyState('Failed to load schedule from database.');
        }
    }

    // ============================================
    // 4. GROUP & RENDER SCHEDULE CARDS (App Layout)
    // ============================================
    const groupByDay = (items) => {
        const grouped = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(d => { grouped[d] = []; });
        
        items.forEach(s => {
            if (!grouped[s.day]) grouped[s.day] = [];
            grouped[s.day].push(s);
        });
        return grouped;
    };

    function renderScheduleCards() {
        if (!scheduleContainer) return;

        const search = (searchInput ? searchInput.value : '').toLowerCase().trim();

        let filtered = schedules.filter(s => {
            if (activeDayFilter !== 'all' && s.day.toLowerCase() !== activeDayFilter.toLowerCase()) {
                return false;
            }
            if (search) {
                const mSub = (s.subject_name || '').toLowerCase().includes(search);
                const mCode = (s.subject_code || '').toLowerCase().includes(search);
                const mSec = (s.section_name || '').toLowerCase().includes(search);
                const mRoom = (s.room || '').toLowerCase().includes(search);
                const mDay = (s.day || '').toLowerCase().includes(search);
                return mSub || mCode || mSec || mRoom || mDay;
            }
            return true;
        });

        if (filtered.length === 0) {
            renderEmptyState(search ? 'No classes matched your search filter.' : 'No schedule assigned yet.');
            return;
        }

        const grouped = groupByDay(filtered);
        const daysWithClasses = Object.keys(grouped).filter(d => grouped[d].length > 0);

        if (daysWithClasses.length === 0) {
            renderEmptyState('No classes scheduled for the selected day.');
            return;
        }

        let html = '';

        daysWithClasses.forEach(day => {
            const classesForDay = grouped[day].sort((a, b) => (a.start_raw || '').localeCompare(b.start_raw || ''));
            const count = classesForDay.length;

            html += `
                <div class="day-section">
                    <div class="day-section-header">
                        <div class="day-section-title">
                            <i class="fas fa-calendar-day" style="color: #1B2A4A;"></i> ${day}
                        </div>
                        <span class="day-badge-count">
                            ${count} class${count !== 1 ? 'es' : ''}
                        </span>
                    </div>

                    <div class="schedule-cards-grid">
                        ${classesForDay.map(s => `
                            <div class="schedule-item-card">
                                <!-- Time block on left -->
                                <div class="time-container">
                                    <div class="time-start">${s.time_start}</div>
                                    <div class="time-end">${s.time_end}</div>
                                    ${s.duration ? `<span class="duration-pill">${s.duration}</span>` : ''}
                                </div>

                                <!-- Schedule info on right -->
                                <div class="schedule-info">
                                    <div class="subject-header-row">
                                        <h4 class="subject-name" title="${s.subject_name}">${s.subject_name}</h4>
                                        ${s.subject_code ? `<span class="subject-code-badge">${s.subject_code}</span>` : ''}
                                    </div>
                                    <div class="section-text">
                                        <i class="fas fa-graduation-cap"></i>
                                        <span>${s.section_name}${s.grade_level ? ` • ${s.grade_level}` : ''}</span>
                                    </div>
                                    ${s.room && s.room !== 'N/A' ? `
                                        <div class="room-text">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span>Room ${s.room}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        scheduleContainer.innerHTML = html;
    }

    // ============================================
    // 5. TIMETABLE GRID VIEW (Web View Mode)
    // ============================================
    function renderTimetableGrid() {
        if (!timetableContainer) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const grouped = groupByDay(schedules);

        let html = `
            <table class="timetable-table">
                <thead>
                    <tr>
                        ${days.map(d => `<th><i class="fas fa-calendar-day"></i> ${d}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${days.map(d => {
                            const dayClasses = grouped[d].sort((a, b) => (a.start_raw || '').localeCompare(b.start_raw || ''));
                            if (dayClasses.length === 0) {
                                return `
                                    <td>
                                        <div style="text-align: center; color: #cbd5e1; padding: 20px 0; font-size: 11px;">
                                            <i class="fas fa-coffee" style="font-size: 16px; margin-bottom: 4px;"></i>
                                            <div>No classes</div>
                                        </div>
                                    </td>
                                `;
                            }
                            return `
                                <td>
                                    ${dayClasses.map(c => `
                                        <div class="cell-class-block">
                                            <strong>${c.subject_name}</strong>
                                            <div style="font-size:10.5px; color:#475569;">${c.section_name} • Rm ${c.room}</div>
                                            <span class="cell-time-span"><i class="fas fa-clock"></i> ${c.time_start} - ${c.time_end}</span>
                                        </div>
                                    `).join('')}
                                </td>
                            `;
                        }).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        timetableContainer.innerHTML = html;
    }

    function renderEmptyState(message = 'No schedule assigned yet.') {
        if (!scheduleContainer) return;
        scheduleContainer.innerHTML = `
            <div class="empty-schedule-card">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <h3>No Schedule Assigned</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // ============================================
    // 6. STATISTICS CALCULATOR
    // ============================================
    function updateStats() {
        const total = schedules.length;
        const uniqueSecs = new Set(schedules.map(s => s.section_name).filter(Boolean)).size;
        const uniqueSubs = new Set(schedules.map(s => s.subject_name).filter(Boolean)).size;
        
        // Approximate available free periods out of standard 30 slots/week (6 periods/day * 5 days)
        const freeSlots = Math.max(0, 30 - total);

        if (totalClassesStat) totalClassesStat.textContent = total;
        if (totalSectionsStat) totalSectionsStat.textContent = uniqueSecs;
        if (totalSubjectsStat) totalSubjectsStat.textContent = uniqueSubs;
        if (freePeriodsStat) freePeriodsStat.textContent = freeSlots;
    }

    // ============================================
    // 7. EVENT HANDLERS & FILTERS
    // ============================================

    // Day Filter Chips
    dayFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            dayFilterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeDayFilter = chip.dataset.day || 'all';
            renderScheduleCards();
        });
    });

    // View Mode Toggle (Cards vs Grid)
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentViewMode = btn.dataset.view;

            if (currentViewMode === 'cards') {
                if (scheduleContainer) scheduleContainer.style.display = 'block';
                if (timetableContainer) timetableContainer.style.display = 'none';
            } else {
                if (scheduleContainer) scheduleContainer.style.display = 'none';
                if (timetableContainer) timetableContainer.style.display = 'block';
            }
        });
    });

    // Search Box
    if (searchInput) {
        searchInput.addEventListener('input', renderScheduleCards);
    }

    // Refresh Button
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            const icon = btnRefresh.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            await loadSchedule();
            setTimeout(() => {
                if (icon) icon.classList.remove('fa-spin');
                showAlert('success', 'Schedule updated successfully.');
            }, 500);
        });
    }

    // Initialize
    await loadSchedule();
});