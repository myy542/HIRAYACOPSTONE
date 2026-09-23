/**
 * Teacher Face Registration Script
 * HES - Hiraya Enrollment System
 * Admin Portal Face Registration
 */

import { supabase } from '../../supabase/config.js';
import { getFaceTokenFromBase64, getFacePlusPlusConfig, saveFacePlusPlusConfig } from './face_fingerprint.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    // State
    let teachers = [];
    let selectedTeacher = null;
    let cameraStream = null;
    let currentFacingMode = 'user';
    let isProcessing = false;
    let activeFilter = 'all';

    // DOM Elements - Camera & UI
    const cameraVideo = document.getElementById('cameraVideo');
    const captureCanvas = document.getElementById('captureCanvas');
    const cameraStandby = document.getElementById('cameraStandby');
    const btnGrantPermission = document.getElementById('btnGrantPermission');
    const btnCapture = document.getElementById('btnCapture');
    const btnCaptureText = document.getElementById('btnCaptureText');
    const captureSpinner = document.getElementById('captureSpinner');
    const btnToggleCam = document.getElementById('btnToggleCam');
    const btnRemoveFace = document.getElementById('btnRemoveFace');
    const faceFrame = document.getElementById('faceFrame');
    const alertContainer = document.getElementById('alertContainer');

    // DOM Elements - Teacher Selection & Info
    const teacherSelectorTrigger = document.getElementById('teacherSelectorTrigger');
    const selectorAvatar = document.getElementById('selectorAvatar');
    const selectorTitle = document.getElementById('selectorTitle');
    const selectorSubtitle = document.getElementById('selectorSubtitle');
    const statusBanner = document.getElementById('statusBanner');
    const statusBannerIcon = document.getElementById('statusBannerIcon');
    const statusBannerText = document.getElementById('statusBannerText');

    // DOM Elements - Stats
    const totalTeachersStat = document.getElementById('totalTeachersStat');
    const registeredTeachersStat = document.getElementById('registeredTeachersStat');
    const pendingTeachersStat = document.getElementById('pendingTeachersStat');
    const registrationRateStat = document.getElementById('registrationRateStat');

    // DOM Elements - Directory List & Search
    const teacherList = document.getElementById('teacherList');
    const searchTeacherInput = document.getElementById('searchTeacherInput');
    const filterTabs = document.querySelectorAll('.tab-pill');

    // DOM Elements - Modals
    const teacherSelectModal = document.getElementById('teacherSelectModal');
    const modalTeacherList = document.getElementById('modalTeacherList');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const closeTeacherModalBtn = document.getElementById('closeTeacherModalBtn');

    const successModal = document.getElementById('successModal');
    const successPreviewImg = document.getElementById('successPreviewImg');
    const successTeacherName = document.getElementById('successTeacherName');
    const successEmployeeId = document.getElementById('successEmployeeId');
    const successTimestamp = document.getElementById('successTimestamp');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

    const settingsModal = document.getElementById('settingsModal');
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    const formFaceppSettings = document.getElementById('formFaceppSettings');
    const inputFaceppKey = document.getElementById('inputFaceppKey');
    const inputFaceppSecret = document.getElementById('inputFaceppSecret');
    const inputFaceppEndpoint = document.getElementById('inputFaceppEndpoint');

    const deleteModal = document.getElementById('deleteModal');
    const deleteTeacherName = document.getElementById('deleteTeacherName');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    const btnRefreshData = document.getElementById('btnRefreshData');

    // Toast Alert Helper
    function showAlert(type, message, duration = 4500) {
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
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        alertContainer.prepend(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }

    // ============================================
    // 1. WEBRTC CAMERA CONTROLS
    // ============================================

    async function initCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showCameraError('Your browser does not support camera access. Please use modern Chrome, Edge, or Firefox.');
            return;
        }

        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };

            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraVideo.srcObject = cameraStream;
            await cameraVideo.play();

            if (cameraStandby) cameraStandby.style.display = 'none';
            console.log('📷 [Webcam] Camera stream initialized successfully');
        } catch (err) {
            console.error('❌ [Webcam Error]:', err);
            let message = 'Unable to access camera. Please allow camera permissions in your browser.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = 'Camera permission was denied. Please click the camera icon in your address bar to grant access.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = 'No camera device found on this system.';
            }
            showCameraError(message);
        }
    }

    function showCameraError(message) {
        if (cameraStandby) {
            cameraStandby.style.display = 'flex';
            const textEl = cameraStandby.querySelector('p');
            if (textEl) textEl.textContent = message;
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    // Toggle Camera (Front / Back)
    if (btnToggleCam) {
        btnToggleCam.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            initCamera();
        });
    }

    if (btnGrantPermission) {
        btnGrantPermission.addEventListener('click', () => initCamera());
    }

    // ============================================
    // 2. DATA LOADING & STATE SYNC
    // ============================================

    async function loadTeachersData() {
        try {
            const [
                { data: teachersData, error: tErr },
                { data: usersData, error: uErr },
                { data: facesData, error: fErr }
            ] = await Promise.all([
                supabase.from('teachers').select('*'),
                supabase.from('users').select('*').eq('role', 'teacher'),
                supabase.from('teacher_faces').select('*')
            ]);

            if (tErr) throw tErr;

            const users = usersData || [];
            const teacherFaces = facesData || [];
            const faceMap = new Map();
            teacherFaces.forEach(f => {
                if (f.teacher_id) faceMap.set(f.teacher_id, f);
            });

            teachers = (teachersData || []).map(t => {
                const matchedUser = users.find(u => u.id === t.user_id);
                const fullName = matchedUser 
                    ? `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || 'Unknown Teacher'
                    : (t.fullname || 'Faculty Teacher');
                const email = matchedUser ? matchedUser.email : (t.email || '');
                const faceRecord = faceMap.get(t.id);

                return {
                    id: t.id,
                    user_id: t.user_id,
                    full_name: fullName,
                    email: email,
                    employee_id: t.employee_id || 'N/A',
                    specialization: t.specialization || 'General',
                    phone: t.phone || '',
                    hasFace: Boolean(faceRecord),
                    faceData: faceRecord || null
                };
            });

            // Sort alphabetically by full name
            teachers.sort((a, b) => a.full_name.localeCompare(b.full_name));

            updateStats();
            renderTeacherDirectory();
            renderModalTeacherList();

            // Auto-select teacher if query param ?id=... exists
            const urlParams = new URLSearchParams(window.location.search);
            const targetTeacherId = urlParams.get('id');
            if (targetTeacherId) {
                const found = teachers.find(t => t.id === targetTeacherId || t.user_id === targetTeacherId);
                if (found) selectTeacher(found);
            } else if (!selectedTeacher && teachers.length > 0) {
                // Default select first teacher if not selected
                selectTeacher(teachers[0]);
            } else if (selectedTeacher) {
                // Refresh currently selected teacher
                const updated = teachers.find(t => t.id === selectedTeacher.id);
                if (updated) selectTeacher(updated);
            }

        } catch (err) {
            console.error('❌ Failed to load teachers:', err);
            showAlert('error', 'Failed to load faculty list from Supabase.');
        }
    }

    function updateStats() {
        const total = teachers.length;
        const registered = teachers.filter(t => t.hasFace).length;
        const pending = total - registered;
        const rate = total > 0 ? Math.round((registered / total) * 100) : 0;

        if (totalTeachersStat) totalTeachersStat.textContent = total;
        if (registeredTeachersStat) registeredTeachersStat.textContent = registered;
        if (pendingTeachersStat) pendingTeachersStat.textContent = pending;
        if (registrationRateStat) registrationRateStat.textContent = `${rate}%`;
    }

    // ============================================
    // 3. TEACHER SELECTION & VIEW UPDATES
    // ============================================

    function selectTeacher(teacher) {
        if (!teacher) return;
        selectedTeacher = teacher;

        const initial = (teacher.full_name || 'T').charAt(0).toUpperCase();

        // Update selector trigger
        if (selectorAvatar) {
            if (teacher.faceData && teacher.faceData.face_preview) {
                selectorAvatar.innerHTML = `<img src="${teacher.faceData.face_preview}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                selectorAvatar.textContent = initial;
            }
        }
        if (selectorTitle) selectorTitle.textContent = teacher.full_name;
        if (selectorSubtitle) selectorSubtitle.textContent = `${teacher.employee_id} • ${teacher.specialization}`;

        // Update Status Banner
        if (statusBanner && statusBannerIcon && statusBannerText) {
            statusBanner.className = `status-banner ${teacher.hasFace ? 'registered' : 'unregistered'}`;
            if (teacher.hasFace) {
                const regDate = teacher.faceData && teacher.faceData.registered_at 
                    ? new Date(teacher.faceData.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Registered';
                statusBannerIcon.className = 'fas fa-check-circle';
                statusBannerText.innerHTML = `<strong>Face registered</strong> on ${regDate}. You can re-scan anytime to update biometrics.`;
            } else {
                statusBannerIcon.className = 'fas fa-exclamation-triangle';
                statusBannerText.innerHTML = `<strong>Not registered yet.</strong> Position face inside the frame and click Register Face.`;
            }
        }

        // Update capture button text & removal button
        if (btnCaptureText) {
            btnCaptureText.textContent = teacher.hasFace ? 'Re-scan & Update Face' : 'Register Face Biometrics';
        }

        if (btnRemoveFace) {
            btnRemoveFace.style.display = teacher.hasFace ? 'inline-flex' : 'none';
        }

        // Highlight active item in directory
        document.querySelectorAll('.teacher-item-card').forEach(card => {
            if (card.dataset.id === teacher.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    // ============================================
    // 4. DIRECTORY & MODAL RENDERING
    // ============================================

    function renderTeacherDirectory() {
        if (!teacherList) return;

        const search = (searchTeacherInput ? searchTeacherInput.value : '').toLowerCase().trim();
        let filtered = teachers.filter(t => {
            if (activeFilter === 'registered' && !t.hasFace) return false;
            if (activeFilter === 'unregistered' && t.hasFace) return false;
            if (search) {
                const matchName = t.full_name.toLowerCase().includes(search);
                const matchId = t.employee_id.toLowerCase().includes(search);
                const matchSpec = t.specialization.toLowerCase().includes(search);
                const matchEmail = (t.email || '').toLowerCase().includes(search);
                return matchName || matchId || matchSpec || matchEmail;
            }
            return true;
        });

        if (filtered.length === 0) {
            teacherList.innerHTML = `
                <div style="text-align: center; padding: 32px 16px; color: #94a3b8;">
                    <i class="fas fa-search" style="font-size: 28px; margin-bottom: 8px; color: #cbd5e1;"></i>
                    <p style="font-size: 13px; margin: 0;">No teachers found</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(t => {
            const isSelected = selectedTeacher && selectedTeacher.id === t.id;
            const initial = (t.full_name || 'T').charAt(0).toUpperCase();
            const avatarContent = (t.faceData && t.faceData.face_preview)
                ? `<img src="${t.faceData.face_preview}" alt="${t.full_name}">`
                : initial;

            html += `
                <div class="teacher-item-card ${isSelected ? 'selected' : ''}" data-id="${t.id}">
                    <div class="teacher-item-left">
                        <div class="teacher-mini-avatar">
                            ${avatarContent}
                            <div class="avatar-badge-dot ${t.hasFace ? 'registered' : 'unregistered'}"></div>
                        </div>
                        <div class="teacher-item-details">
                            <h4>${t.full_name}</h4>
                            <p>${t.employee_id} • ${t.specialization}</p>
                        </div>
                    </div>
                    <div class="teacher-item-right">
                        <span class="status-pill ${t.hasFace ? 'registered' : 'unregistered'}">
                            <i class="fas ${t.hasFace ? 'fa-check' : 'fa-clock'}"></i>
                            ${t.hasFace ? 'Registered' : 'Not yet'}
                        </span>
                        <button type="button" class="btn-select-scan">
                            ${isSelected ? 'Selected' : 'Select'}
                        </button>
                    </div>
                </div>
            `;
        });

        teacherList.innerHTML = html;

        teacherList.querySelectorAll('.teacher-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const found = teachers.find(t => t.id === id);
                if (found) selectTeacher(found);
            });
        });
    }

    function renderModalTeacherList() {
        if (!modalTeacherList) return;

        const search = (modalSearchInput ? modalSearchInput.value : '').toLowerCase().trim();
        let filtered = teachers.filter(t => {
            if (!search) return true;
            return t.full_name.toLowerCase().includes(search) ||
                   t.employee_id.toLowerCase().includes(search) ||
                   t.specialization.toLowerCase().includes(search);
        });

        if (filtered.length === 0) {
            modalTeacherList.innerHTML = `
                <div style="text-align: center; padding: 24px; color: #94a3b8;">
                    <p style="margin: 0; font-size: 13px;">No teachers matching "${search}"</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(t => {
            const isSelected = selectedTeacher && selectedTeacher.id === t.id;
            const initial = (t.full_name || 'T').charAt(0).toUpperCase();

            html += `
                <div class="teacher-item-card ${isSelected ? 'selected' : ''}" data-id="${t.id}" style="margin-bottom: 8px;">
                    <div class="teacher-item-left">
                        <div class="teacher-mini-avatar">
                            ${t.faceData && t.faceData.face_preview ? `<img src="${t.faceData.face_preview}">` : initial}
                        </div>
                        <div class="teacher-item-details">
                            <h4>${t.full_name}</h4>
                            <p>${t.employee_id} • ${t.specialization}</p>
                        </div>
                    </div>
                    <span class="status-pill ${t.hasFace ? 'registered' : 'unregistered'}">
                        <i class="fas ${t.hasFace ? 'fa-check' : 'fa-clock'}"></i>
                        ${t.hasFace ? 'Registered' : 'Not yet'}
                    </span>
                </div>
            `;
        });

        modalTeacherList.innerHTML = html;

        modalTeacherList.querySelectorAll('.teacher-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const found = teachers.find(t => t.id === id);
                if (found) {
                    selectTeacher(found);
                    if (teacherSelectModal) teacherSelectModal.classList.remove('active');
                }
            });
        });
    }

    // ============================================
    // 5. FACE CAPTURE & REGISTRATION ACTION
    // ============================================

    async function captureAndRegisterFace() {
        if (!selectedTeacher) {
            showAlert('warning', 'Please select a faculty member first.');
            return;
        }

        if (!cameraVideo || cameraVideo.videoWidth === 0) {
            showAlert('warning', 'Camera is not active. Please ensure webcam permissions are enabled.');
            return;
        }

        if (isProcessing) return;
        isProcessing = true;

        // UI Loading State
        if (btnCapture) btnCapture.disabled = true;
        if (captureSpinner) captureSpinner.style.display = 'inline-block';
        if (btnCaptureText) btnCaptureText.textContent = 'Processing Face Biometrics...';
        if (faceFrame) faceFrame.classList.add('detected');

        try {
            // 1. Draw video frame onto canvas (optimal 480px width)
            const targetWidth = 480;
            const targetHeight = Math.round((cameraVideo.videoHeight / cameraVideo.videoWidth) * targetWidth) || 360;
            
            captureCanvas.width = targetWidth;
            captureCanvas.height = targetHeight;

            const ctx = captureCanvas.getContext('2d');
            // Un-mirror image onto canvas for true storage
            ctx.save();
            ctx.translate(targetWidth, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(cameraVideo, 0, 0, targetWidth, targetHeight);
            ctx.restore();

            // 2. Export JPEG Base64
            const base64Data = captureCanvas.toDataURL('image/jpeg', 0.82);

            // 3. Extract Face Token via Face++ / Biometric Descriptor
            const faceToken = await getFaceTokenFromBase64(base64Data, captureCanvas);

            if (!faceToken) {
                showAlert('warning', 'No clear face detected. Please ensure good lighting, look straight into the lens, and remove glasses or hats.');
                return;
            }

            console.log('💾 [Supabase] Upserting face data for teacher:', selectedTeacher.id);

            // 4. Save/Upsert to Supabase 'teacher_faces' table
            const registeredAt = new Date().toISOString();
            const { data: upsertData, error: upsertErr } = await supabase
                .from('teacher_faces')
                .upsert({
                    teacher_id: selectedTeacher.id,
                    face_fingerprint: faceToken,
                    face_preview: base64Data,
                    registered_at: registeredAt
                }, { onConflict: 'teacher_id' })
                .select();

            if (upsertErr) throw upsertErr;

            // 5. Optional Activity Log
            try {
                await supabase.from('activity_logs').insert({
                    role: 'admin',
                    action: 'Face Biometrics Registered',
                    details: `Registered face recognition profile for ${selectedTeacher.full_name} (${selectedTeacher.employee_id})`
                });
            } catch (logErr) {
                // Ignore non-critical log errors
            }

            // 6. Update local state
            selectedTeacher.hasFace = true;
            selectedTeacher.faceData = {
                teacher_id: selectedTeacher.id,
                face_fingerprint: faceToken,
                face_preview: base64Data,
                registered_at: registeredAt
            };

            updateStats();
            renderTeacherDirectory();
            selectTeacher(selectedTeacher);

            // 7. Show Celebration / Success Modal
            if (successPreviewImg) successPreviewImg.src = base64Data;
            if (successTeacherName) successTeacherName.textContent = selectedTeacher.full_name;
            if (successEmployeeId) successEmployeeId.textContent = selectedTeacher.employee_id;
            if (successTimestamp) {
                successTimestamp.textContent = new Date(registeredAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            }
            if (successModal) successModal.classList.add('active');

            showAlert('success', `Face biometrics for ${selectedTeacher.full_name} successfully registered!`);

        } catch (err) {
            console.error('❌ Face registration failed:', err);
            showAlert('error', `Face registration failed: ${err.message || 'Unknown error'}`);
        } finally {
            isProcessing = false;
            if (btnCapture) btnCapture.disabled = false;
            if (captureSpinner) captureSpinner.style.display = 'none';
            if (btnCaptureText) {
                btnCaptureText.textContent = selectedTeacher && selectedTeacher.hasFace ? 'Re-scan & Update Face' : 'Register Face Biometrics';
            }
            if (faceFrame) faceFrame.classList.remove('detected');
        }
    }

    // ============================================
    // 6. FACE REMOVAL / RESET
    // ============================================

    if (btnRemoveFace) {
        btnRemoveFace.addEventListener('click', () => {
            if (!selectedTeacher) return;
            if (deleteTeacherName) deleteTeacherName.textContent = selectedTeacher.full_name;
            if (deleteModal) deleteModal.classList.add('active');
        });
    }

    if (btnCancelDelete && deleteModal) {
        btnCancelDelete.addEventListener('click', () => deleteModal.classList.remove('active'));
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!selectedTeacher) return;
            try {
                const { error } = await supabase
                    .from('teacher_faces')
                    .delete()
                    .eq('teacher_id', selectedTeacher.id);

                if (error) throw error;

                showAlert('success', `Face profile for ${selectedTeacher.full_name} has been removed.`);
                selectedTeacher.hasFace = false;
                selectedTeacher.faceData = null;

                if (deleteModal) deleteModal.classList.remove('active');
                updateStats();
                renderTeacherDirectory();
                selectTeacher(selectedTeacher);

            } catch (err) {
                console.error('❌ Delete face error:', err);
                showAlert('error', `Failed to remove face profile: ${err.message}`);
            }
        });
    }

    // ============================================
    // 7. FACE++ SETTINGS MODAL
    // ============================================

    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
            const config = getFacePlusPlusConfig();
            if (inputFaceppKey) inputFaceppKey.value = config.apiKey || '';
            if (inputFaceppSecret) inputFaceppSecret.value = config.apiSecret || '';
            if (inputFaceppEndpoint) inputFaceppEndpoint.value = config.endpoint || '';
            if (settingsModal) settingsModal.classList.add('active');
        });
    }

    if (closeSettingsModalBtn && settingsModal) {
        closeSettingsModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    }

    if (formFaceppSettings) {
        formFaceppSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            const key = inputFaceppKey ? inputFaceppKey.value : '';
            const secret = inputFaceppSecret ? inputFaceppSecret.value : '';
            const endpoint = inputFaceppEndpoint ? inputFaceppEndpoint.value : '';

            saveFacePlusPlusConfig(key, secret, endpoint);
            showAlert('success', 'Face++ API settings saved successfully!');
            if (settingsModal) settingsModal.classList.remove('active');
        });
    }

    // ============================================
    // 8. EVENT LISTENERS & LIFECYCLE
    // ============================================

    if (btnCapture) {
        btnCapture.addEventListener('click', captureAndRegisterFace);
    }

    if (teacherSelectorTrigger && teacherSelectModal) {
        teacherSelectorTrigger.addEventListener('click', () => {
            if (modalSearchInput) modalSearchInput.value = '';
            renderModalTeacherList();
            teacherSelectModal.classList.add('active');
        });
    }

    if (closeTeacherModalBtn && teacherSelectModal) {
        closeTeacherModalBtn.addEventListener('click', () => teacherSelectModal.classList.remove('active'));
    }

    if (closeSuccessModalBtn && successModal) {
        closeSuccessModalBtn.addEventListener('click', () => successModal.classList.remove('active'));
    }

    // Filter Pills
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.dataset.filter || 'all';
            renderTeacherDirectory();
        });
    });

    if (searchTeacherInput) {
        searchTeacherInput.addEventListener('input', renderTeacherDirectory);
    }

    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', renderModalTeacherList);
    }

    if (btnRefreshData) {
        btnRefreshData.addEventListener('click', async () => {
            btnRefreshData.querySelector('i')?.classList.add('fa-spin');
            await loadTeachersData();
            setTimeout(() => {
                btnRefreshData.querySelector('i')?.classList.remove('fa-spin');
                showAlert('success', 'Faculty face records updated.');
            }, 600);
        });
    }

    // Close modals on overlay click
    [teacherSelectModal, successModal, settingsModal, deleteModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Cleanup camera stream on page unload
    window.addEventListener('beforeunload', stopCamera);

    // Initialize Everything
    await Promise.all([
        initCamera(),
        loadTeachersData()
    ]);
});
