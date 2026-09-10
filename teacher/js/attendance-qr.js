/**
 * Teacher QR Attendance - Supabase Integration
 * Real-time Attendance Generation, Scanning & Logging
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📷 QR Attendance ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Date & Time display
    const dateBadge = document.querySelector('.date-badge');
    const phTimeDisplay = document.getElementById('phTimeDisplay');
    const lateWarning = document.getElementById('lateWarning');

    // Stats
    const totalDays = document.getElementById('totalDays');
    const presentDays = document.getElementById('presentDays');
    const lateDays = document.getElementById('lateDays');
    const absentDays = document.getElementById('absentDays');

    // Today's attendance
    const attendanceInfo = document.getElementById('attendanceInfo');
    const timeInDisplay = document.getElementById('timeInDisplay');
    const timeOutDisplay = document.getElementById('timeOutDisplay');
    const statusDisplay = document.getElementById('statusDisplay');

    // QR Section
    const qrContainer = document.getElementById('qrContainer');

    // Scanner
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const scanResult = document.getElementById('scanResult');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');
    const historyList = document.getElementById('historyList');

    // ============================================
    // STATE
    // ============================================

    let sessionUser = null;
    let teacherId = null;
    let currentAttendance = null;
    let attendanceHistory = [];
    let cameraStream = null;
    let isScanning = false;
    let scanThrottle = false;

    // ============================================
    // SESSION CHECK & AUTH
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
    const displayName = sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.displayName || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Teacher'));
    if (teacherName) teacherName.textContent = displayName;
    if (teacherInitial) teacherInitial.textContent = displayName.charAt(0).toUpperCase();

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚪 Teacher logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('plsnhs_teacher_avatar');
            localStorage.removeItem('plsnhs_teacher_name');
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
        if (!timeStr) return '--:--';
        try {
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
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch {
            return dateStr;
        }
    }

    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (dateBadge) {
            dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
        }
        if (phTimeDisplay) {
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            phTimeDisplay.textContent = now.toLocaleDateString('en-US', options) + ' • ' + now.toLocaleTimeString('en-US', timeOptions);
        }

        // Cutoff warning: after 8:00:00 AM
        if (lateWarning) {
            const isLateTime = now.getHours() > 8 || (now.getHours() === 8 && (now.getMinutes() > 0 || now.getSeconds() > 0));
            lateWarning.style.display = isLateTime ? 'inline-block' : 'none';
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle')}"></i>
            ${message}
        `;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // LOCAL STORAGE CACHE HELPERS
    // ============================================

    function getLocalAttendanceCache() {
        try {
            const raw = localStorage.getItem('plsnhs_teacher_attendance_' + teacherId);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    }

    function saveLocalAttendanceCache(records) {
        try {
            localStorage.setItem('plsnhs_teacher_attendance_' + teacherId, JSON.stringify(records));
        } catch(e) {}
    }

    function syncToAdminAttendance(record) {
        try {
            const stored = localStorage.getItem('plsnhs_teacher_attendance');
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
                    id_number: sessionUser.employee_id || ('PLSNHS-TCH-' + (teacherId ? String(teacherId).substring(0, 6).toUpperCase() : '001')),
                    dept: sessionUser.department || sessionUser.specialization || 'Faculty',
                    date: today,
                    timeIn: timeInFmt,
                    timeOut: timeOutFmt,
                    status: record.status || 'Present',
                    remarks: record.status === 'Late' ? 'Late arrival' : 'On time'
                });
            }
            localStorage.setItem('plsnhs_teacher_attendance', JSON.stringify(records));
        } catch(e) {}
    }

    // ============================================
    // LOAD ATTENDANCE DATA FROM SUPABASE
    // ============================================

    async function loadAttendanceData() {
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
                saveLocalAttendanceCache(data);
            } else {
                console.warn('Using local attendance cache:', error?.message);
                loadedRecords = getLocalAttendanceCache();
            }
        } catch(err) {
            console.warn('Network error, falling back to cache:', err);
            loadedRecords = getLocalAttendanceCache();
        }

        attendanceHistory = loadedRecords;

        // Find today's record
        currentAttendance = loadedRecords.find(r => r.date === today) || null;
        console.log("📋 Today's attendance:", currentAttendance);

        updateAttendanceUI();
        renderHistory();
        updateStats();
    }

    // ============================================
    // UPDATE ATTENDANCE UI
    // ============================================

    function updateAttendanceUI() {
        if (!qrContainer) return;

        if (!currentAttendance || (!currentAttendance.time_in && !currentAttendance.timeIn)) {
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

        const timeIn = currentAttendance.time_in || currentAttendance.timeIn;
        const timeOut = currentAttendance.time_out || currentAttendance.timeOut;
        const status = currentAttendance.status || 'Present';

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

    // ============================================
    // RENDER ATTENDANCE HISTORY
    // ============================================

    function renderHistory() {
        if (!historyList) return;

        if (!attendanceHistory || attendanceHistory.length === 0) {
            historyList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No attendance records found</p>
                    <p class="info-text">Generate a QR code or scan to start recording your attendance</p>
                </div>
            `;
            return;
        }

        const recent = attendanceHistory.slice(0, 10);
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

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        let total = attendanceHistory.length;
        let present = 0;
        let late = 0;
        let absent = 0;

        attendanceHistory.forEach(item => {
            const st = (item.status || '').toLowerCase();
            if (st === 'present') present++;
            else if (st === 'late') late++;
            else if (st === 'absent') absent++;
            else present++; // default to present if completed
        });

        if (totalDays) totalDays.textContent = total;
        if (presentDays) presentDays.textContent = present;
        if (lateDays) lateDays.textContent = late;
        if (absentDays) absentDays.textContent = absent;
    }

    // ============================================
    // GENERATE QR CODE
    // ============================================

    window.generateQR = function(type) {
        if (!sessionUser) {
            showAlert('⚠️ Please login first', 'error');
            return;
        }

        const today = getLocalDateString();
        const timeIn = currentAttendance ? (currentAttendance.time_in || currentAttendance.timeIn) : null;
        const timeOut = currentAttendance ? (currentAttendance.time_out || currentAttendance.timeOut) : null;

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

        // Generate token payload
        const payload = {
            system: 'PLSNHS_QR_ATTENDANCE',
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

    // ============================================
    // RECORD ATTENDANCE FUNCTION
    // ============================================

    window.recordAttendance = async function(type) {
        const today = getLocalDateString();
        const currentTime = getLocalTimeString();
        const now = new Date();
        const isLate = now.getHours() > 8 || (now.getHours() === 8 && (now.getMinutes() > 0 || now.getSeconds() > 0));
        const status = (type === 'time_in') ? (isLate ? 'Late' : 'Present') : (currentAttendance?.status || 'Present');

        try {
            let updatedRecord = null;

            if (currentAttendance && currentAttendance.id) {
                // Update existing record
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
                    .eq('id', currentAttendance.id)
                    .select();

                if (!error && data && data.length > 0) {
                    updatedRecord = data[0];
                } else {
                    // Update locally
                    updatedRecord = {
                        ...currentAttendance,
                        ...updates
                    };
                }
            } else {
                // Insert new record
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
                    // Fallback locally with generated id
                    newRow.id = 'local_' + Date.now();
                    updatedRecord = newRow;
                }
            }

            // Update in-memory history and cache
            const existingIdx = attendanceHistory.findIndex(r => r.date === today);
            if (existingIdx >= 0) {
                attendanceHistory[existingIdx] = updatedRecord;
            } else {
                attendanceHistory.unshift(updatedRecord);
            }
            saveLocalAttendanceCache(attendanceHistory);
            syncToAdminAttendance(updatedRecord);

            currentAttendance = updatedRecord;

            const timeFormatted = formatTime(currentTime);
            const actionTitle = type === 'time_in' ? 'Time In' : 'Time Out';
            showAlert(`🎉 ${actionTitle} recorded at ${timeFormatted} (${status})!`, 'success');

            if (scanResult) {
                scanResult.className = 'scan-result success';
                scanResult.innerHTML = `<strong><i class="fas fa-check-circle"></i> Success!</strong> ${actionTitle} recorded for ${displayName} at ${timeFormatted} (Status: ${status}).`;
            }

            updateAttendanceUI();
            renderHistory();
            updateStats();

        } catch (error) {
            console.error('Error recording attendance:', error);
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
                // Check url params
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
            } else if (parsed && parsed.system === 'PLSNHS_QR_ATTENDANCE') {
                const action = parsed.action || 'time_in';
                window.recordAttendance(action);
            } else {
                // If simple string containing time_in or time_out
                const action = (data.toLowerCase().includes('time_out') || (currentAttendance && currentAttendance.time_in)) ? 'time_out' : 'time_in';
                showAlert(`✅ QR scanned! Recording ${action === 'time_in' ? 'Time In' : 'Time Out'}...`, 'success');
                window.recordAttendance(action);
            }
        } catch(err) {
            console.error('Error handling scanned data:', err);
            showAlert('⚠️ Scanned QR is not valid for attendance', 'warning');
        }
    }

    // ============================================
    // TAB SWITCHING
    // ============================================

    window.switchTab = function(tab) {
        const cameraTab = document.getElementById('cameraScannerTab');
        const uploadTab = document.getElementById('uploadScannerTab');
        const tabs = document.querySelectorAll('.tab-btn');

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

    // ============================================
    // UPLOAD IMAGE SCANNER
    // ============================================

    window.uploadImage = async function(input) {
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
    // INITIAL LOAD
    // ============================================

    loadAttendanceData();

    console.log('✅ Teacher QR Attendance fully loaded with Supabase');

})();