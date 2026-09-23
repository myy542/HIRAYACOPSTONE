/**
 * Faculty QR Attendance System
 * Exclusively handles Teacher Personal QR Attendance (Time In, Time Out, 8:00 AM Cutoff, Camera Scanner, Photo Upload)
 * Strict Weekend Restriction: Attendance is disabled on Saturday and Sunday.
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('🌟 Faculty QR Attendance System ready');

    // ============================================
    // DOM ELEMENTS - GENERAL & HEADER
    // ============================================
    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const phTimeDisplay = document.getElementById('phTimeDisplay');
    const alertContainer = document.getElementById('alertContainer');
    const lateWarning = document.getElementById('lateWarning');
    const dateBadge = document.querySelector('.date-badge');

    // DOM Elements - Stats & Info
    const totalDays = document.getElementById('totalDays');
    const presentDays = document.getElementById('presentDays');
    const lateDays = document.getElementById('lateDays');
    const absentDays = document.getElementById('absentDays');
    const attendanceInfo = document.getElementById('attendanceInfo');
    const timeInDisplay = document.getElementById('timeInDisplay');
    const timeOutDisplay = document.getElementById('timeOutDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const qrContainer = document.getElementById('qrContainer');
    const historyList = document.getElementById('historyList');

    // DOM Elements - Scanner
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const scanResult = document.getElementById('scanResult');

    // ============================================
    // STATE
    // ============================================
    let sessionUser = null;
    let teacherId = null;
    let displayName = 'Teacher';
    let facultyCurrentAttendance = null;
    let facultyAttendanceHistory = [];
    let cameraStream = null;
    let isScanning = false;
    let scanThrottle = false;

    // ============================================
    // SESSION & AUTH
    // ============================================
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch(e) {
        console.error('Error reading currentUser:', e);
    }

    if (!sessionUser) {
        console.warn('⚠️ No active teacher session, redirecting...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (sessionUser.role && sessionUser.role !== 'teacher' && sessionUser.role !== 'admin') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    teacherId = sessionUser.id || sessionUser.uid;
    displayName = sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.displayName || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Teacher'));
    if (teacherName) teacherName.textContent = displayName;
    if (typeof window.syncTeacherAvatarAndName === 'function') {
        window.syncTeacherAvatarAndName();
    } else if (teacherInitial) {
        const words = displayName.split(/\s+/);
        const initials = words.length > 1 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : displayName.substring(0, 2).toUpperCase();
        teacherInitial.textContent = initials;
    }

    // ============================================
    // LOGOUT
    // ============================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚪 Teacher logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('hes_teacher_avatar');
            localStorage.removeItem('hes_teacher_name');
            try {
                if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                }
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // DATE & TIME HELPERS
    // ============================================
    function getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getLocalTimeString() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function formatTime(timeStr) {
        if (!timeStr || timeStr === '—' || timeStr === '--:--') return '—';
        try {
            if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
            const parts = timeStr.split(':');
            const h = parseInt(parts[0], 10);
            const m = parts[1] || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        } catch {
            return timeStr;
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    function isWeekendToday() {
        const day = new Date().getDay();
        return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    }

    function showAlert(message, type = 'info') {
        if (!alertContainer) return;
        const alertId = 'alert_' + Date.now();
        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        const icon = iconMap[type] || 'info-circle';

        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type}`;
        alertEl.id = alertId;
        alertEl.style.animation = 'slideDown 0.3s ease-out';
        alertEl.innerHTML = `
            <div style="display:flex; align-items:center; gap: 10px; width: 100%;">
                <i class="fas fa-${icon}"></i>
                <div style="flex:1;">${message}</div>
                <button type="button" style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.1rem;" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        alertContainer.prepend(alertEl);
        setTimeout(() => {
            if (document.getElementById(alertId)) {
                alertEl.style.opacity = '0';
                setTimeout(() => alertEl.remove(), 300);
            }
        }, 5000);
    }

    function updateLiveClock() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        
        if (dateBadge) {
            dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', dateOptions)}`;
        }
        if (phTimeDisplay) {
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            phTimeDisplay.textContent = now.toLocaleDateString('en-US', dateOptions) + ' • ' + now.toLocaleTimeString('en-US', timeOptions);
        }

        // Cutoff warning (only on weekdays)
        if (lateWarning) {
            if (isWeekendToday()) {
                lateWarning.style.display = 'none';
            } else {
                const isLateTime = now.getHours() > 8 || (now.getHours() === 8 && (now.getMinutes() > 0 || now.getSeconds() > 0));
                lateWarning.style.display = isLateTime ? 'inline-block' : 'none';
            }
        }
    }

    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    // ============================================
    // DATA SYNC & CACHE
    // ============================================
    function getLocalTeacherAttendanceCache() {
        try {
            const raw = localStorage.getItem('hes_teacher_attendance_' + teacherId);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    }

    function saveLocalTeacherAttendanceCache(records) {
        try {
            localStorage.setItem('hes_teacher_attendance_' + teacherId, JSON.stringify(records));
        } catch(e) {}
    }

    function syncToAdminAttendance(record) {
        try {
            const stored = localStorage.getItem('hes_teacher_attendance');
            let records = stored ? JSON.parse(stored) : [];
            const today = getLocalDateString();
            const timeInFmt = (record.time_in || record.timeIn) ? formatTime(record.time_in || record.timeIn) : '—';
            const timeOutFmt = (record.time_out || record.timeOut) ? formatTime(record.time_out || record.timeOut) : '—';

            const existingIdx = records.findIndex(r => r.name === displayName && r.date === today);
            if (existingIdx >= 0) {
                records[existingIdx].timeIn = timeInFmt;
                if (record.time_out || record.timeOut) records[existingIdx].timeOut = timeOutFmt;
                records[existingIdx].status = record.status || 'Present';
            } else {
                records.unshift({
                    id: Date.now(),
                    name: displayName,
                    id_number: sessionUser.employee_id || ('HES-TCH-' + (teacherId ? String(teacherId).substring(0, 6).toUpperCase() : '001')),
                    dept: sessionUser.department || sessionUser.specialization || 'Faculty',
                    date: today,
                    timeIn: timeInFmt,
                    timeOut: timeOutFmt,
                    status: record.status || 'Present',
                    remarks: record.status === 'Late' ? 'Late arrival' : 'On time'
                });
            }
            localStorage.setItem('hes_teacher_attendance', JSON.stringify(records));
        } catch(e) {}
    }

    async function loadFacultyAttendanceData() {
        const today = getLocalDateString();
        let loadedRecords = [];

        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('teacher_id', teacherId)
                .order('date', { ascending: false });

            if (!error && data) {
                loadedRecords = data;
                saveLocalTeacherAttendanceCache(data);
            } else {
                loadedRecords = getLocalTeacherAttendanceCache();
            }
        } catch(err) {
            loadedRecords = getLocalTeacherAttendanceCache();
        }

        facultyAttendanceHistory = loadedRecords;
        facultyCurrentAttendance = loadedRecords.find(r => r.date === today) || null;

        updateFacultyAttendanceUI();
        renderFacultyHistory();
        updateFacultyStats();
    }

    function updateFacultyAttendanceUI() {
        if (!qrContainer) return;

        if (isWeekendToday()) {
            if (attendanceInfo) attendanceInfo.style.display = 'none';
            qrContainer.innerHTML = `
                <div class="qr-container weekend-mode" style="border: 2px dashed #f59e0b; background: #fffbeb; padding: 32px 20px; border-radius: var(--radius); text-align: center;">
                    <div style="font-size: 3.2rem; color: #d97706; margin-bottom: 12px;">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <h3 style="color: #92400e; font-size: 1.35rem; margin-bottom: 8px;">Weekend Notice (No Classes)</h3>
                    <p style="color: #b45309; font-size: 0.95rem; max-width: 480px; margin: 0 auto 16px; line-height: 1.5;">
                        Today is <strong>${new Date().toLocaleDateString('en-US', { weekday: 'long' })}</strong>. School attendance is strictly disabled on weekends. QR code generation and camera scanning are only active during official class days (Monday to Friday).
                    </p>
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #fef3c7; color: #92400e; font-weight: 600; padding: 8px 16px; border-radius: 24px; font-size: 0.88rem; border: 1px solid #fde68a;">
                        <i class="fas fa-info-circle"></i> Attendance resumes on Monday at 7:00 AM
                    </div>
                </div>
            `;
            return;
        }

        if (!facultyCurrentAttendance || (!facultyCurrentAttendance.time_in && !facultyCurrentAttendance.timeIn)) {
            if (attendanceInfo) attendanceInfo.style.display = 'none';
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <h3><i class="fas fa-qrcode"></i> Time In QR Code</h3>
                    <p>Generate a QR code to record your Time In</p>
                    <div class="qr-actions" style="text-align: center; padding: 25px 15px;">
                        <button onclick="window.generateQR('time_in')" class="btn-generate-timein">
                            <i class="fas fa-qrcode"></i> Generate Time In QR Code
                        </button>
                        <p class="info-text" style="margin-top: 15px;">
                            <i class="fas fa-info-circle"></i> Generate a QR code to record your Time In. This will expire in 30 minutes.
                            <br><strong class="text-warning">⚠️ Note: Time In after 8:00 AM will be marked as LATE</strong>
                        </p>
                    </div>
                </div>
            `;
            return;
        }

        const timeIn = facultyCurrentAttendance.time_in || facultyCurrentAttendance.timeIn;
        const timeOut = facultyCurrentAttendance.time_out || facultyCurrentAttendance.timeOut;
        const status = facultyCurrentAttendance.status || 'Present';

        if (attendanceInfo) {
            attendanceInfo.style.display = 'block';
            if (timeInDisplay) timeInDisplay.textContent = timeIn ? formatTime(timeIn) : 'Not yet recorded';
            if (timeOutDisplay) timeOutDisplay.textContent = timeOut ? formatTime(timeOut) : 'Not yet recorded';
            if (statusDisplay) statusDisplay.innerHTML = `<span class="status-badge status-${status}">${status}</span>`;
        }

        const isCompleted = timeIn && timeOut;
        const hasTimeInOnly = timeIn && !timeOut;

        if (isCompleted) {
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <i class="fas fa-check-circle success-icon"></i>
                    <h3 style="color: var(--success); font-size: 1.4rem;">Attendance Completed for Today</h3>
                    <p style="margin: 8px 0;">You have successfully recorded both Time In and Time Out for today.</p>
                    <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 15px; max-width: 320px; margin: 15px auto; text-align: left;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                            <strong>⏰ Time In:</strong> <span>${formatTime(timeIn)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                            <strong>⏰ Time Out:</strong> <span>${formatTime(timeOut)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <strong>📊 Status:</strong> <span class="status-badge status-${status}">${status}</span>
                        </div>
                    </div>
                    <p class="info-text"><i class="fas fa-calendar-check"></i> You can generate a new QR code tomorrow for the next school day.</p>
                </div>
            `;
        } else if (hasTimeInOnly) {
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <h3><i class="fas fa-qrcode"></i> Time Out QR Code</h3>
                    <p>Your Time In was recorded at <strong>${formatTime(timeIn)}</strong>. Generate a QR code for Time Out when leaving.</p>
                    <div class="qr-actions" style="text-align: center; padding: 25px 15px;">
                        <button onclick="window.generateQR('time_out')" class="btn-generate-timeout">
                            <i class="fas fa-qrcode"></i> Generate Time Out QR Code
                        </button>
                        <p class="info-text" style="margin-top: 15px;">
                            <i class="fas fa-info-circle"></i> Generate a QR code to record your Time Out at the end of the day.
                        </p>
                    </div>
                </div>
            `;
        }
    }

    function renderFacultyHistory() {
        if (!historyList) return;

        if (!facultyAttendanceHistory || facultyAttendanceHistory.length === 0) {
            historyList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No attendance records found</p>
                    <p class="info-text">Generate a QR code or scan to start recording your attendance</p>
                </div>
            `;
            return;
        }

        const recent = facultyAttendanceHistory.slice(0, 10);
        let html = `
            <div class="table-container">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--gray-100); text-align: left;">
                            <th style="padding: 12px 16px; border-bottom: 1px solid var(--gray-200);">Date</th>
                            <th style="padding: 12px 16px; border-bottom: 1px solid var(--gray-200);">Time In</th>
                            <th style="padding: 12px 16px; border-bottom: 1px solid var(--gray-200);">Time Out</th>
                            <th style="padding: 12px 16px; border-bottom: 1px solid var(--gray-200);">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        recent.forEach(record => {
            const date = record.date || 'N/A';
            const timeIn = record.time_in || record.timeIn ? formatTime(record.time_in || record.timeIn) : '--:--';
            const timeOut = record.time_out || record.timeOut ? formatTime(record.time_out || record.timeOut) : '--:--';
            const status = record.status || 'Present';

            html += `
                <tr style="border-bottom: 1px solid var(--gray-100);">
                    <td style="padding: 12px 16px; font-weight: 500;">${formatDate(date)}</td>
                    <td style="padding: 12px 16px;">${timeIn}</td>
                    <td style="padding: 12px 16px;">${timeOut}</td>
                    <td style="padding: 12px 16px;"><span class="status-badge status-${status}">${status}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        historyList.innerHTML = html;
    }

    function updateFacultyStats() {
        let total = facultyAttendanceHistory.length;
        let present = 0;
        let late = 0;
        let absent = 0;

        facultyAttendanceHistory.forEach(item => {
            const st = (item.status || '').toLowerCase();
            if (st === 'present') present++;
            else if (st === 'late') late++;
            else if (st === 'absent') absent++;
            else present++;
        });

        if (totalDays) totalDays.textContent = total;
        if (presentDays) presentDays.textContent = present;
        if (lateDays) lateDays.textContent = late;
        if (absentDays) absentDays.textContent = absent;
    }

    // ============================================
    // GENERATE FACULTY QR CODE
    // ============================================
    window.generateQR = function(type) {
        if (!sessionUser) {
            showAlert('⚠️ Please login first', 'error');
            return;
        }

        if (isWeekendToday()) {
            showAlert('📅 School attendance is disabled on weekends (Saturday & Sunday).', 'warning');
            return;
        }

        const today = getLocalDateString();
        const timeIn = facultyCurrentAttendance ? (facultyCurrentAttendance.time_in || facultyCurrentAttendance.timeIn) : null;
        const timeOut = facultyCurrentAttendance ? (facultyCurrentAttendance.time_out || facultyCurrentAttendance.timeOut) : null;

        if (timeIn && timeOut) {
            showAlert('⚠️ Attendance is already completed for today', 'warning');
            return;
        }

        if (type === 'time_in' && timeIn) {
            showAlert('⚠️ Time In is already recorded for today', 'warning');
            return;
        }

        if (type === 'time_out' && !timeIn) {
            showAlert('⚠️ Please record Time In first before generating Time Out QR code', 'warning');
            return;
        }

        const payload = {
            system: 'HES_QR_ATTENDANCE',
            teacher_id: teacherId,
            teacher_name: displayName,
            action: type,
            date: today,
            timestamp: Date.now()
        };

        const qrDataString = JSON.stringify(payload);
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrDataString)}`;
        const actionTitle = type === 'time_in' ? 'Time In' : 'Time Out';
        const now = new Date();
        const isLateTime = now.getHours() > 8 || (now.getHours() === 8 && (now.getMinutes() > 0 || now.getSeconds() > 0));

        qrContainer.innerHTML = `
            <div class="qr-container" style="animation: fadeIn 0.4s ease;">
                <h3><i class="fas fa-qrcode"></i> ${actionTitle} QR Code</h3>
                <p>Scan this QR code using the camera scanner or click "Record ${actionTitle} Now"</p>
                
                <div class="qr-code">
                    <img src="${qrCodeUrl}" alt="${actionTitle} QR Code" style="width: 220px; height: 220px;">
                </div>

                <div class="qr-info">
                    <h4>${displayName} — ${actionTitle}</h4>
                    <p>📱 Use the camera scanner above or another device to scan</p>
                    ${type === 'time_in' && isLateTime ? '<p class="expiry-text" style="color:var(--danger)!important;"><i class="fas fa-exclamation-triangle"></i> Note: Current time is past 8:00 AM, will be marked as LATE</p>' : ''}
                    <p class="expiry-text"><i class="fas fa-clock"></i> Valid for today (${formatDate(today)})</p>
                    
                    <div style="display:flex; justify-content:center; gap: 12px; margin-top: 15px; flex-wrap: wrap;">
                        <button onclick="window.recordAttendance('${type}')" class="btn-scanner" style="background: var(--success); font-size: 0.95rem; padding: 10px 20px;">
                            <i class="fas fa-check-circle"></i> Confirm / Record ${actionTitle} Now
                        </button>
                        <button onclick="window.generateQR('${type}')" class="btn-scanner" style="background: var(--gray-700); font-size: 0.95rem; padding: 10px 18px;">
                            <i class="fas fa-sync-alt"></i> Refresh QR
                        </button>
                    </div>
                </div>
            </div>
        `;

        showAlert(`✅ ${actionTitle} QR code generated! You can scan it or click Confirm to record.`, 'success');
    };

    window.recordAttendance = async function(type) {
        if (isWeekendToday()) {
            showAlert('📅 Cannot record attendance on Saturday/Sunday. School is in weekend recess.', 'warning');
            return;
        }

        const today = getLocalDateString();
        const currentTime = getLocalTimeString();
        const now = new Date();
        const isLate = now.getHours() > 8 || (now.getHours() === 8 && (now.getMinutes() > 0 || now.getSeconds() > 0));
        const status = (type === 'time_in') ? (isLate ? 'Late' : 'Present') : (facultyCurrentAttendance?.status || 'Present');

        try {
            let updatedRecord = null;

            if (facultyCurrentAttendance && facultyCurrentAttendance.id) {
                const updates = {};
                if (type === 'time_in') {
                    updates.time_in = currentTime;
                    updates.status = status;
                } else {
                    updates.time_out = currentTime;
                }

                const { data, error } = await supabase
                    .from('attendance')
                    .update(updates)
                    .eq('id', facultyCurrentAttendance.id)
                    .select();

                if (!error && data && data.length > 0) {
                    updatedRecord = data[0];
                } else {
                    updatedRecord = { ...facultyCurrentAttendance, ...updates };
                }
            } else {
                const newRow = {
                    teacher_id: teacherId,
                    date: today,
                    time_in: type === 'time_in' ? currentTime : null,
                    time_out: type === 'time_out' ? currentTime : null,
                    status: status,
                    created_at: new Date().toISOString()
                };

                const { data, error } = await supabase
                    .from('attendance')
                    .insert([newRow])
                    .select();

                if (!error && data && data.length > 0) {
                    updatedRecord = data[0];
                } else {
                    newRow.id = 'local_' + Date.now();
                    updatedRecord = newRow;
                }
            }

            const existingIdx = facultyAttendanceHistory.findIndex(r => r.date === today);
            if (existingIdx >= 0) {
                facultyAttendanceHistory[existingIdx] = updatedRecord;
            } else {
                facultyAttendanceHistory.unshift(updatedRecord);
            }
            saveLocalTeacherAttendanceCache(facultyAttendanceHistory);
            syncToAdminAttendance(updatedRecord);

            facultyCurrentAttendance = updatedRecord;

            const timeFormatted = formatTime(currentTime);
            const actionTitle = type === 'time_in' ? 'Time In' : 'Time Out';
            showAlert(`🎉 ${actionTitle} recorded at ${timeFormatted} (${status})!`, 'success');

            if (scanResult) {
                scanResult.className = 'scan-result success';
                scanResult.innerHTML = `<strong><i class="fas fa-check-circle"></i> Success!</strong> ${actionTitle} recorded for ${displayName} at ${timeFormatted} (Status: ${status}).`;
            }

            updateFacultyAttendanceUI();
            renderFacultyHistory();
            updateFacultyStats();

        } catch (error) {
            console.error('Error recording faculty attendance:', error);
            showAlert('❌ Failed to record attendance: ' + error.message, 'error');
        }
    };

    // ============================================
    // QR SCANNER (CAMERA & IMAGE)
    // ============================================
    function loadJsQR() {
        return new Promise((resolve, reject) => {
            if (typeof window.jsQR !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    window.startCamera = async function() {
        if (isWeekendToday()) {
            showAlert('📅 Camera scanning is disabled on weekends (Saturday & Sunday).', 'warning');
            return;
        }

        try {
            await loadJsQR();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showAlert('❌ Camera not supported by this browser', 'error');
                return;
            }

            const constraints = {
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            };

            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (video) {
                video.srcObject = cameraStream;
                await video.play();
            }

            if (startCameraBtn) startCameraBtn.style.display = 'none';
            if (stopCameraBtn) stopCameraBtn.style.display = 'inline-block';
            isScanning = true;

            scanQRCode();
            showAlert('📷 Camera started. Point at your QR code.', 'success');

        } catch (error) {
            console.error('Camera error:', error);
            showAlert('❌ Failed to access camera: ' + error.message, 'error');
        }
    };

    window.stopCamera = function() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        if (video) {
            video.srcObject = null;
        }
        if (startCameraBtn) startCameraBtn.style.display = 'inline-block';
        if (stopCameraBtn) stopCameraBtn.style.display = 'none';
        isScanning = false;
    };

    function scanQRCode() {
        if (!isScanning) return;

        if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (typeof window.jsQR === 'function') {
                const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code && code.data && !scanThrottle) {
                    scanThrottle = true;
                    setTimeout(() => { scanThrottle = false; }, 2000);
                    handleScannedData(code.data);
                    window.stopCamera();
                    return;
                }
            }
        }

        if (isScanning) {
            requestAnimationFrame(scanQRCode);
        }
    }

    function handleScannedData(data) {
        console.log('🔍 QR Data scanned:', data);
        try {
            let parsed = null;
            try {
                parsed = JSON.parse(data);
            } catch(e) {
                if (data.includes('token=')) {
                    const url = new URL(data);
                    const token = url.searchParams.get('token');
                    if (token) {
                        const decoded = atob(token);
                        const parts = decoded.split('_');
                        parsed = { action: parts[2] || 'time_in' };
                    }
                }
            }

            if (parsed && (parsed.action === 'time_in' || parsed.action === 'time_out')) {
                showAlert(`✅ QR Code detected! Recording ${parsed.action === 'time_in' ? 'Time In' : 'Time Out'}...`, 'success');
                window.recordAttendance(parsed.action);
            } else if (parsed && parsed.system === 'HES_QR_ATTENDANCE') {
                const action = parsed.action || 'time_in';
                window.recordAttendance(action);
            } else {
                const action = (data.toLowerCase().includes('time_out') || (facultyCurrentAttendance && facultyCurrentAttendance.time_in)) ? 'time_out' : 'time_in';
                showAlert(`✅ QR scanned! Recording ${action === 'time_in' ? 'Time In' : 'Time Out'}...`, 'success');
                window.recordAttendance(action);
            }
        } catch(err) {
            console.error('Error handling scanned data:', err);
            showAlert('⚠️ Scanned QR is not valid for attendance', 'warning');
        }
    }

    window.switchTab = function(tab) {
        const cameraTab = document.getElementById('cameraScannerTab');
        const uploadTab = document.getElementById('uploadScannerTab');
        const tabs = document.querySelectorAll('.scanner-header .tab-btn');

        tabs.forEach(t => t.classList.remove('active'));

        if (tab === 'camera') {
            if (cameraTab) cameraTab.classList.add('active-tab');
            if (uploadTab) uploadTab.classList.remove('active-tab');
            if (tabs[0]) tabs[0].classList.add('active');
        } else {
            if (uploadTab) uploadTab.classList.add('active-tab');
            if (cameraTab) cameraTab.classList.remove('active-tab');
            if (tabs[1]) tabs[1].classList.add('active');
            if (isScanning) window.stopCamera();
        }
    };
    window.switchScannerTab = window.switchTab;

    window.uploadImage = async function(input) {
        if (isWeekendToday()) {
            showAlert('📅 Image upload scanning is disabled on weekends (Saturday & Sunday).', 'warning');
            return;
        }

        const file = input.files[0];
        if (!file) return;

        await loadJsQR();

        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('previewImg');
            const previewImage = document.getElementById('previewImage');
            if (previewImg && previewImage) {
                previewImg.src = e.target.result;
                previewImage.style.display = 'block';
            }

            const img = new Image();
            img.onload = function() {
                const canvas2 = document.createElement('canvas');
                const ctx2 = canvas2.getContext('2d');
                canvas2.width = img.naturalWidth || img.width;
                canvas2.height = img.naturalHeight || img.height;
                ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);

                const imageData = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
                if (typeof window.jsQR === 'function') {
                    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code && code.data) {
                        handleScannedData(code.data);
                    } else {
                        showAlert('⚠️ No QR code recognized in the uploaded image. Please try a clearer picture.', 'warning');
                    }
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    loadFacultyAttendanceData();

    console.log('✅ Faculty QR Attendance fully initialized');

})();