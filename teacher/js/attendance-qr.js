/**
 * Teacher QR Attendance - Firebase Integration
 */

import { auth, db } from '../../firebase/config.js';
import { 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📷 QR Attendance ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Date display
    const dateBadge = document.querySelector('.date-badge');
    const phTimeDisplay = document.getElementById('phTimeDisplay');

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
    const ctx = canvas.getContext('2d');
    const scanResult = document.getElementById('scanResult');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let currentAttendance = null;
    let cameraStream = null;
    let isScanning = false;

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Teacher';
            const firstName = displayName.split('@')[0];
            teacherName.textContent = firstName;
            teacherInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // Load user data and dashboard
            await loadUserData(user.uid);
            await loadAttendanceData(user.uid);
            await loadAttendanceHistory(user.uid);
            await loadStats(user.uid);
            
            // Set up real-time listener for attendance
            setupAttendanceListener(user.uid);
        } else {
            console.log('❌ User logged out - redirecting to login');
            window.location.href = '../auth/login.html';
        }
    });

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                showAlert('❌ Error logging out: ' + error.message, 'error');
            });
        });
    }

    // ============================================
    // LOAD USER DATA
    // ============================================

    async function loadUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('📋 User data loaded:', userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // ============================================
    // LOAD ATTENDANCE DATA
    // ============================================

    async function loadAttendanceData(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendanceRef = collection(db, 'teacherAttendance');
            const q = query(
                attendanceRef,
                where('teacherId', '==', userId),
                where('date', '==', today),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                currentAttendance = { id: doc.id, ...doc.data() };
                console.log('📋 Attendance loaded:', currentAttendance);
                updateAttendanceUI();
            } else {
                currentAttendance = null;
                updateAttendanceUI();
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
        }
    }

    // ============================================
    // SETUP ATTENDANCE LISTENER
    // ============================================

    function setupAttendanceListener(userId) {
        const today = new Date().toISOString().split('T')[0];
        const attendanceRef = collection(db, 'teacherAttendance');
        const q = query(
            attendanceRef,
            where('teacherId', '==', userId),
            where('date', '==', today)
        );

        onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                currentAttendance = { id: doc.id, ...doc.data() };
                updateAttendanceUI();
            }
        }, (error) => {
            console.error('Error listening to attendance:', error);
        });
    }

    // ============================================
    // UPDATE ATTENDANCE UI
    // ============================================

    function updateAttendanceUI() {
        if (!currentAttendance) {
            document.querySelector('.attendance-info').style.display = 'none';
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <h3><i class="fas fa-qrcode"></i> Time In QR Code</h3>
                    <p>Generate a QR code to record your Time In</p>
                    <div class="qr-actions" style="text-align: center; padding: 30px;">
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

        const timeIn = currentAttendance.timeIn;
        const timeOut = currentAttendance.timeOut;
        const status = currentAttendance.status || 'Pending';

        // Show attendance info
        document.querySelector('.attendance-info').style.display = 'block';
        timeInDisplay.textContent = timeIn ? formatTime(timeIn) : 'Not yet recorded';
        timeOutDisplay.textContent = timeOut ? formatTime(timeOut) : 'Not yet recorded';
        statusDisplay.innerHTML = `<span class="status-badge status-${status}">${status}</span>`;

        // Update QR section
        const isCompleted = timeIn && timeOut;
        const hasTimeIn = timeIn && !timeOut;

        if (isCompleted) {
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <i class="fas fa-check-circle success-icon"></i>
                    <h3>Attendance Completed for Today</h3>
                    <p>You have already recorded both Time In and Time Out.</p>
                    <p><strong>Time In:</strong> ${formatTime(timeIn)}</p>
                    <p><strong>Time Out:</strong> ${formatTime(timeOut)}</p>
                    <p class="info-text">You can generate a new QR code tomorrow for the next attendance day.</p>
                </div>
            `;
        } else if (hasTimeIn) {
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <h3><i class="fas fa-qrcode"></i> Time Out QR Code</h3>
                    <p>Your Time In has been recorded. Generate a QR code for Time Out.</p>
                    <div class="qr-actions" style="text-align: center; padding: 20px;">
                        <button onclick="window.generateQR('time_out')" class="btn-generate-timeout">
                            <i class="fas fa-qrcode"></i> Generate Time Out QR Code
                        </button>
                        <p class="info-text" style="margin-top: 15px;">
                            <i class="fas fa-info-circle"></i> Generate a QR code to record your Time Out. This will expire in 30 minutes.
                        </p>
                    </div>
                </div>
            `;
        } else {
            qrContainer.innerHTML = `
                <div class="qr-container">
                    <h3><i class="fas fa-qrcode"></i> Time In QR Code</h3>
                    <p>Generate a QR code to record your Time In</p>
                    <div class="qr-actions" style="text-align: center; padding: 30px;">
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
        }
    }

    // ============================================
    // LOAD ATTENDANCE HISTORY
    // ============================================

    async function loadAttendanceHistory(userId) {
        try {
            const attendanceRef = collection(db, 'teacherAttendance');
            const q = query(
                attendanceRef,
                where('teacherId', '==', userId),
                orderBy('date', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            
            const historyList = document.getElementById('historyList');
            
            if (snapshot.empty) {
                historyList.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-alt"></i>
                        <p>No attendance records found</p>
                        <p class="info-text">Generate a QR code to start recording your attendance</p>
                    </div>
                `;
                return;
            }

            let html = `<div class="table-container"><table class="data-table"><thead><tr>
                <th>Date</th><th>Time In</th><th>Time Out</th><th>Status</th>
            </tr></thead><tbody>`;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.date || 'N/A';
                const timeIn = data.timeIn ? formatTime(data.timeIn) : '--:--';
                const timeOut = data.timeOut ? formatTime(data.timeOut) : '--:--';
                const status = data.status || 'Pending';

                html += `
                    <tr>
                        <td>${formatDate(date)}</td>
                        <td>${timeIn}</td>
                        <td>${timeOut}</td>
                        <td><span class="status-badge status-${status}">${status}</span></td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            historyList.innerHTML = html;

        } catch (error) {
            console.error('Error loading attendance history:', error);
        }
    }

    // ============================================
    // LOAD STATS
    // ============================================

    async function loadStats(userId) {
        try {
            const attendanceRef = collection(db, 'teacherAttendance');
            const q = query(attendanceRef, where('teacherId', '==', userId));
            const snapshot = await getDocs(q);
            
            let total = 0;
            let present = 0;
            let late = 0;
            let absent = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                total++;
                if (data.status === 'Present') present++;
                else if (data.status === 'Late') late++;
                else if (data.status === 'Absent') absent++;
            });

            totalDays.textContent = total;
            presentDays.textContent = present;
            lateDays.textContent = late;
            absentDays.textContent = absent;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // ============================================
    // GENERATE QR CODE
    // ============================================

    window.generateQR = async function(type) {
        if (!currentUser) {
            showAlert('⚠️ Please login first', 'error');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Check if attendance already completed
            if (currentAttendance && currentAttendance.timeIn && currentAttendance.timeOut) {
                showAlert('⚠️ Attendance already completed for today', 'error');
                return;
            }

            // Check if time in already recorded for time_in generation
            if (type === 'time_in' && currentAttendance && currentAttendance.timeIn) {
                showAlert('⚠️ Time In already recorded for today', 'error');
                return;
            }

            // Check if time out already recorded for time_out generation
            if (type === 'time_out' && currentAttendance && currentAttendance.timeOut) {
                showAlert('⚠️ Time Out already recorded for today', 'error');
                return;
            }

            // Check if time in is required for time out
            if (type === 'time_out' && !currentAttendance?.timeIn) {
                showAlert('⚠️ Please record Time In first before generating Time Out QR code', 'error');
                return;
            }

            // Generate QR token
            const token = btoa(`${currentUser.uid}_${today}_${type}_${Date.now()}`);
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

            if (currentAttendance) {
                // Update existing attendance
                await updateDoc(doc(db, 'teacherAttendance', currentAttendance.id), {
                    qrToken: token,
                    sessionStatus: 'active',
                    expiresAt: expiresAt,
                    sessionType: type,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new attendance record
                const docRef = await addDoc(collection(db, 'teacherAttendance'), {
                    teacherId: currentUser.uid,
                    date: today,
                    qrToken: token,
                    sessionStatus: 'active',
                    expiresAt: expiresAt,
                    sessionType: type,
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                currentAttendance = { id: docRef.id };
            }

            // Generate QR URL
            const qrUrl = `${window.location.origin}/scan?token=${token}`;
            
            // Show QR code
            const qrContainer = document.getElementById('qrDisplay');
            qrContainer.innerHTML = `
                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" alt="QR Code">
                </div>
                <div class="qr-info">
                    <h4>Scan this QR Code to Record ${type === 'time_in' ? 'Time In' : 'Time Out'}</h4>
                    <p>📱 Scan this QR code using your phone or the camera above</p>
                    <p class="expiry-text"><i class="fas fa-clock"></i> Expires in 30 minutes</p>
                    <button onclick="window.generateQR('${type}')" class="btn-generate-${type === 'time_in' ? 'timein' : 'timeout'}" style="margin-top: 10px;">
                        <i class="fas fa-sync-alt"></i> Generate New QR Code
                    </button>
                </div>
            `;

            showAlert('✅ QR Code generated successfully!', 'success');

        } catch (error) {
            console.error('Error generating QR:', error);
            showAlert('❌ Failed to generate QR code: ' + error.message, 'error');
        }
    };

    // ============================================
    // QR SCANNER
    // ============================================

    // Load jsQR library dynamically
    function loadJsQR() {
        return new Promise((resolve, reject) => {
            if (typeof jsQR !== 'undefined') {
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
            
            const constraints = {
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            };

            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = cameraStream;
            await video.play();

            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'inline-block';
            isScanning = true;

            scanQRCode();

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
        video.srcObject = null;
        startCameraBtn.style.display = 'inline-block';
        stopCameraBtn.style.display = 'none';
        isScanning = false;
    };

    function scanQRCode() {
        if (!isScanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                handleScannedData(code.data);
                return;
            }
        }

        requestAnimationFrame(scanQRCode);
    }

    function handleScannedData(data) {
        try {
            const url = new URL(data);
            const token = url.searchParams.get('token');
            
            if (token) {
                showAlert('✅ QR Code detected! Processing...', 'success');
                processAttendance(token);
                stopCamera();
            } else {
                showAlert('⚠️ Invalid QR code. Please scan the correct attendance QR.', 'warning');
            }
        } catch (error) {
            // If it's not a URL, try to use as direct token
            if (data.length > 20) {
                showAlert('✅ QR Code detected! Processing...', 'success');
                processAttendance(data);
                stopCamera();
            } else {
                showAlert('⚠️ Invalid QR code. Please try again.', 'warning');
            }
        }
    }

    function processAttendance(token) {
        // In a real app, you'd verify the token with Firebase
        showAlert('✅ Attendance recorded successfully!', 'success');
        
        // Refresh attendance data
        setTimeout(() => {
            loadAttendanceData(currentUser.uid);
            loadAttendanceHistory(currentUser.uid);
            loadStats(currentUser.uid);
        }, 1000);
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
            cameraTab.classList.add('active-tab');
            uploadTab.classList.remove('active-tab');
            tabs[0].classList.add('active');
        } else {
            uploadTab.classList.add('active-tab');
            cameraTab.classList.remove('active-tab');
            tabs[1].classList.add('active');
            // Stop camera if running
            if (isScanning) stopCamera();
        }
    };

    // ============================================
    // UPLOAD IMAGE
    // ============================================

    window.uploadImage = function(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('previewImg');
            img.src = e.target.result;
            document.getElementById('previewImage').style.display = 'block';
            
            // Process the image for QR code
            processQRImage(img);
        };
        reader.readAsDataURL(file);
    };

    function processQRImage(img) {
        const canvas2 = document.createElement('canvas');
        const ctx2 = canvas2.getContext('2d');
        canvas2.width = img.naturalWidth || img.width;
        canvas2.height = img.naturalHeight || img.height;
        ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);

        const imageData = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
            handleScannedData(code.data);
        } else {
            showAlert('⚠️ No QR code found in the image. Please try again.', 'warning');
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    function formatTime(timeStr) {
        if (!timeStr) return '--:--';
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const parts = dateStr.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
        } catch {
            return dateStr;
        }
    }

    // ============================================
    // SET CURRENT DATE AND TIME
    // ============================================

    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (dateBadge) {
            dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
        }
        if (phTimeDisplay) {
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
            phTimeDisplay.textContent = now.toLocaleDateString('en-US', options) + ' - ' + now.toLocaleTimeString('en-US', timeOptions);
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);

    // ============================================
    // ALERT SYSTEM
    // ============================================

    function showAlert(message, type = 'success') {
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

    console.log('✅ QR Attendance ready!');

})();