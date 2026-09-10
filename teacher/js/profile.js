/**
 * Teacher Profile - Firebase Integration
 */

import { auth, db } from '../../firebase/config.js';
import { 
    onAuthStateChanged,
    signOut,
    sendEmailVerification,
    updatePassword,
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('👤 Teacher Profile ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const backBtn = document.getElementById('backBtn');

    // Profile info
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');
    const profileEmail = document.getElementById('profileEmail');
    const teacherId = document.getElementById('teacherId');
    const memberSince = document.getElementById('memberSince');
    const daysActive = document.getElementById('daysActive');
    const emailVerifiedBadge = document.getElementById('emailVerifiedBadge');

    // Stats
    const sectionsCount = document.getElementById('sectionsCount');
    const subjectsCount = document.getElementById('subjectsCount');
    const studentsCount = document.getElementById('studentsCount');

    // Email verification
    const emailVerificationSection = document.getElementById('emailVerificationSection');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;

    // ============================================
    // SESSION CHECK & AUTH
    // ============================================

    let sessionUser = null;
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch(e) {}

    if (!sessionUser) {
        console.warn('⚠️ No active teacher session, redirecting...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (sessionUser.role && sessionUser.role !== 'teacher') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    currentUser = { uid: sessionUser.uid, email: sessionUser.email };
    const displayName = (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.email ? sessionUser.email.split('@')[0] : 'Teacher'));
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
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // BACK BUTTON
    // ============================================

    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    // ============================================
    // LOAD PROFILE DATA
    // ============================================

    async function loadProfileData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('📋 User data loaded:', userData);
            } else {
                // Create user document if not exists
                userData = {
                    email: currentUser.email,
                    displayName: currentUser.displayName || currentUser.email,
                    role: 'Teacher',
                    createdAt: serverTimestamp()
                };
                await setDoc(doc(db, 'users', userId), userData);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            showAlert('❌ Error loading profile: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD TEACHER STATS
    // ============================================

    async function loadTeacherStats(userId) {
        try {
            // Get sections count
            const sectionsRef = collection(db, 'sections');
            const sq = query(sectionsRef, where('adviserId', '==', userId));
            const sectionsSnap = await getDocs(sq);
            sectionsCount.textContent = sectionsSnap.size || 0;

            // Get subjects count
            const classSchedulesRef = collection(db, 'classSchedules');
            const csq = query(classSchedulesRef, where('teacherId', '==', userId), where('status', '==', 'active'));
            const csSnap = await getDocs(csq);
            
            // Get unique subjects
            const subjectIds = new Set();
            csSnap.forEach(doc => {
                const data = doc.data();
                if (data.subjectId) subjectIds.add(data.subjectId);
            });
            subjectsCount.textContent = subjectIds.size || 0;

            // Get students count (from enrollments)
            // This is a simplified count - in a real app, you'd query enrollments
            const enrollmentsRef = collection(db, 'enrollments');
            const eq = query(enrollmentsRef, where('status', '==', 'Enrolled'));
            const enrollSnap = await getDocs(eq);
            
            // Count unique students (simplified)
            const studentIds = new Set();
            enrollSnap.forEach(doc => {
                const data = doc.data();
                if (data.userId) studentIds.add(data.userId);
            });
            studentsCount.textContent = studentIds.size || 0;

        } catch (error) {
            console.error('Error loading teacher stats:', error);
            sectionsCount.textContent = '0';
            subjectsCount.textContent = '0';
            studentsCount.textContent = '0';
        }
    }

    // ============================================
    // UPDATE UI
    // ============================================

    function updateUI() {
        if (!currentUser || !userData) return;

        // Profile info
        const displayName = userData.displayName || currentUser.displayName || currentUser.email || 'Teacher';
        const cleanName = displayName.split('@')[0];
        const initials = getTeacherInitials(cleanName);

        try {
            localStorage.setItem('plsnhs_teacher_name', cleanName);
        } catch(e) {}

        if (profileName) profileName.textContent = cleanName;
        if (profileInitial) profileInitial.textContent = initials;
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) teacherNameEl.textContent = cleanName;
        const teacherInitialEl = document.getElementById('teacherInitial');
        if (teacherInitialEl) teacherInitialEl.textContent = initials;
        const modalInitial = document.getElementById('modalInitial');
        if (modalInitial) modalInitial.textContent = initials;

        const effectiveAvatar = userData?.profilePicture || localStorage.getItem('plsnhs_teacher_avatar');
        if (effectiveAvatar) {
            applyTeacherAvatarToDOM(effectiveAvatar);
        } else {
            renderDefaultTeacherAvatar(cleanName);
        }

        profileEmail.textContent = currentUser.email;
        teacherId.textContent = userData.idNumber || 'Not Assigned';

        // Member since
        if (userData.createdAt) {
            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
            memberSince.textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            daysActive.textContent = diff > 0 ? diff : 0;
        } else {
            memberSince.textContent = 'N/A';
            daysActive.textContent = '0';
        }

        // Email verification
        if (currentUser.emailVerified || userData.emailVerified) {
            emailVerifiedBadge.innerHTML = '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>';
            emailVerificationSection.innerHTML = `
                <div class="verification-badge verified">
                    <i class="fas fa-check-circle"></i> Verified Email
                </div>
                <div class="verification-info">
                    <p><i class="fas fa-check-circle" style="color: #28a745;"></i> Your email address has been verified.</p>
                    <p style="margin-top: 10px;">This adds an extra layer of security to your account.</p>
                </div>
            `;
        } else {
            emailVerifiedBadge.innerHTML = '<span class="unverified-badge"><i class="fas fa-times-circle"></i> Unverified</span>';
            emailVerificationSection.innerHTML = `
                <div class="verification-badge unverified">
                    <i class="fas fa-exclamation-triangle"></i> Email Not Verified
                </div>
                <div class="verification-info">
                    <p><i class="fas fa-info-circle"></i> Your email address has not been verified yet.</p>
                    <p style="margin-top: 10px;">Verifying your email helps secure your account and ensures you receive important notifications.</p>
                    <button id="verifyEmailBtn" class="btn-verify">
                        <i class="fas fa-paper-plane"></i> Verify Email Now
                    </button>
                </div>
            `;
            
            // Add verify email listener
            const verifyBtn = document.getElementById('verifyEmailBtn');
            if (verifyBtn) {
                verifyBtn.addEventListener('click', async function() {
                    try {
                        await sendEmailVerification(currentUser);
                        showAlert('✅ Verification email sent! Please check your inbox.', 'success');
                    } catch (error) {
                        console.error('Error sending verification:', error);
                        showAlert('❌ Error sending verification: ' + error.message, 'error');
                    }
                });
            }
        }
    }

    // ============================================
    // CHANGE PASSWORD
    // ============================================

    const changePwdCheckbox = document.getElementById('change_password_checkbox');
    const pwdFields = document.getElementById('passwordFields');
    const currentPwd = document.getElementById('current_password');
    const newPwd = document.getElementById('new_password');
    const confirmPwd = document.getElementById('confirm_password');
    const changePwdBtn = document.getElementById('changePasswordBtn');

    if (changePwdCheckbox) {
        changePwdCheckbox.addEventListener('change', function() {
            if (this.checked) {
                pwdFields.classList.add('show');
                currentPwd.disabled = false;
                newPwd.disabled = false;
                confirmPwd.disabled = false;
                changePwdBtn.disabled = true;
                newPwd.focus();
            } else {
                pwdFields.classList.remove('show');
                currentPwd.disabled = true;
                currentPwd.value = '';
                newPwd.disabled = true;
                newPwd.value = '';
                confirmPwd.disabled = true;
                confirmPwd.value = '';
                changePwdBtn.disabled = true;
                resetStrength();
            }
        });
    }

    function resetStrength() {
        const strengthFill = document.getElementById('passwordStrengthFill');
        const strengthText = document.getElementById('passwordStrengthText');
        const matchText = document.getElementById('passwordMatchText');
        
        if (strengthFill) {
            strengthFill.style.width = '0%';
            strengthFill.className = 'password-strength-fill';
        }
        if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Enter new password</span>';
        if (matchText) matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        
        ['length','upper','lower','number','special'].forEach(r => {
            const el = document.getElementById(`req-${r}`);
            if (el) {
                el.classList.remove('valid');
                const text = el.innerText.replace(/[✓✔✅]/g, '').trim();
                el.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
            }
        });
    }

    function validatePwd(pwd) {
        return {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
        };
    }

    function updateStrength() {
        const pwd = newPwd.value;
        const validation = validatePwd(pwd);
        
        // Update requirements
        ['length','uppercase','lowercase','number','special'].forEach(r => {
            const el = document.getElementById(`req-${r}`);
            if (el) {
                const text = el.innerText.replace(/[✓✔✅]/g, '').trim();
                if (validation[r]) {
                    el.classList.add('valid');
                    el.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
                } else {
                    el.classList.remove('valid');
                    el.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
                }
            }
        });
        
        // Update strength meter
        const validCount = Object.values(validation).filter(v => v).length;
        const percent = (validCount / 5) * 100;
        const strengthFill = document.getElementById('passwordStrengthFill');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthFill) {
            strengthFill.style.width = percent + '%';
            strengthFill.className = 'password-strength-fill';
            if (percent <= 25) {
                strengthFill.classList.add('weak');
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #ef4444;">Weak password</span>';
            } else if (percent <= 50) {
                strengthFill.classList.add('fair');
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #f59e0b;">Fair password</span>';
            } else if (percent <= 75) {
                strengthFill.classList.add('good');
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #3b82f6;">Good password</span>';
            } else {
                strengthFill.classList.add('strong');
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #10b981;">Strong password</span>';
            }
        }
        
        checkMatch();
        const isStrong = Object.values(validation).every(v => v === true);
        const confirm = confirmPwd.value;
        changePwdBtn.disabled = !(isStrong && pwd === confirm && pwd.length > 0);
    }

    function checkMatch() {
        const matchText = document.getElementById('passwordMatchText');
        if (newPwd && confirmPwd) {
            if (confirmPwd.value.length === 0) {
                matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
            } else if (newPwd.value === confirmPwd.value) {
                matchText.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>';
            } else {
                matchText.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>';
            }
        }
        // Re-check button state
        if (changePwdBtn && newPwd.value.length > 0) {
            const validation = validatePwd(newPwd.value);
            const isStrong = Object.values(validation).every(v => v === true);
            changePwdBtn.disabled = !(isStrong && newPwd.value === confirmPwd.value);
        }
    }

    if (newPwd) {
        newPwd.addEventListener('input', updateStrength);
    }
    if (confirmPwd) {
        confirmPwd.addEventListener('input', checkMatch);
    }

    // ============================================
    // CHANGE PASSWORD FORM SUBMIT
    // ============================================

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const current = document.getElementById('current_password').value;
            const newPwdValue = document.getElementById('new_password').value;
            const confirm = document.getElementById('confirm_password').value;

            if (!current || !newPwdValue || !confirm) {
                showAlert('⚠️ Please fill in all password fields', 'error');
                return;
            }

            if (newPwdValue !== confirm) {
                showAlert('⚠️ Passwords do not match', 'error');
                return;
            }

            try {
                // Re-authenticate user
                const credential = EmailAuthProvider.credential(currentUser.email, current);
                await reauthenticateWithCredential(currentUser, credential);
                
                // Update password
                await updatePassword(currentUser, newPwdValue);
                
                // Update in Firestore
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    updatedAt: serverTimestamp()
                });
                
                showAlert('✅ Password changed successfully!', 'success');
                
                // Reset form
                currentPwd.value = '';
                newPwd.value = '';
                confirmPwd.value = '';
                changePwdCheckbox.checked = false;
                pwdFields.classList.remove('show');
                resetStrength();
                
            } catch (error) {
                console.error('Error changing password:', error);
                if (error.code === 'auth/wrong-password') {
                    showAlert('❌ Current password is incorrect', 'error');
                } else if (error.code === 'auth/too-many-requests') {
                    showAlert('❌ Too many failed attempts. Please try again later.', 'error');
                } else {
                    showAlert('❌ Error changing password: ' + error.message, 'error');
                }
            }
        });
    }

    // ============================================
    // CHANGE EMAIL
    // ============================================

    const emailChangeForm = document.getElementById('emailChangeForm');
    if (emailChangeForm) {
        emailChangeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const newEmail = document.getElementById('new_email').value.trim();
            
            if (!newEmail || !newEmail.includes('@')) {
                showAlert('⚠️ Please enter a valid email address', 'error');
                return;
            }

            try {
                await updateEmail(currentUser, newEmail);
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    email: newEmail,
                    emailVerified: false,
                    updatedAt: serverTimestamp()
                });
                
                showAlert('✅ Email updated successfully! Please verify your new email.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
            } catch (error) {
                console.error('Error changing email:', error);
                if (error.code === 'auth/email-already-in-use') {
                    showAlert('❌ Email already in use by another account', 'error');
                } else if (error.code === 'auth/requires-recent-login') {
                    showAlert('❌ Please log out and log in again to change email', 'error');
                } else {
                    showAlert('❌ Error changing email: ' + error.message, 'error');
                }
            }
        });
    }

    // ============================================
    // PROFILE PICTURE UPLOAD & PERSISTENCE
    // ============================================

    function getTeacherInitials(name) {
        if (!name || typeof name !== 'string') return 'T';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|engr\.?|atty\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function renderDefaultTeacherAvatar(name) {
        const initials = getTeacherInitials(name || 'Teacher');
        const avatarLarge = document.querySelector('.profile-avatar-large');
        if (avatarLarge) {
            avatarLarge.innerHTML = `
                <div class="avatar-initial" id="profileInitial">${initials}</div>
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }
        const sidebarAvatar = document.querySelector('.teacher-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <div class="avatar-initial" id="teacherInitial">${initials}</div>
                <div class="online-dot"></div>
            `;
        }
        const modalInitial = document.getElementById('modalInitial');
        if (modalInitial) {
            modalInitial.textContent = initials;
        }
    }

    function applyTeacherAvatarToDOM(base64Image) {
        const avatarLarge = document.querySelector('.profile-avatar-large');
        if (avatarLarge) {
            const initialEl = avatarLarge.querySelector('.avatar-initial');
            if (initialEl) initialEl.style.display = 'none';
            let existingImg = avatarLarge.querySelector('img');
            if (existingImg) {
                existingImg.src = base64Image;
            } else {
                const img = document.createElement('img');
                img.src = base64Image;
                img.alt = 'Profile';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                avatarLarge.prepend(img);
            }
        }

        const sidebarAvatar = document.querySelector('.teacher-avatar');
        if (sidebarAvatar) {
            const initialEl = sidebarAvatar.querySelector('.avatar-initial');
            if (initialEl) initialEl.style.display = 'none';
            let existingImg = sidebarAvatar.querySelector('img');
            if (existingImg) {
                existingImg.src = base64Image;
            } else {
                const img = document.createElement('img');
                img.src = base64Image;
                img.alt = 'Teacher';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                sidebarAvatar.prepend(img);
            }
        }
    }

    window.removeProfilePic = async function() {
        if (confirm('Remove your profile picture and restore your name initials?')) {
            try {
                localStorage.removeItem('plsnhs_teacher_avatar');
            } catch(e) {}
            if (currentUser && typeof updateDoc === 'function') {
                try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        profilePicture: null,
                        updatedAt: serverTimestamp()
                    });
                } catch(e) {}
            }
            const displayName = userData?.displayName || currentUser?.displayName || currentUser?.email || 'Teacher';
            renderDefaultTeacherAvatar(displayName.split('@')[0]);
            showAlert('✅ Profile picture removed. Initials restored.', 'success');
            closeImageModal();
        }
    };

    const profilePicForm = document.getElementById('profilePicForm');
    if (profilePicForm) {
        profilePicForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('profile_picture');
            if (!fileInput.files || fileInput.files.length === 0) {
                showAlert('⚠️ Please select an image', 'error');
                return;
            }

            const file = fileInput.files[0];
            const maxSize = 5 * 1024 * 1024;
            
            if (file.size > maxSize) {
                showAlert('⚠️ File is too large. Maximum size is 5MB.', 'error');
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = async function(evt) {
                    const base64Image = evt.target.result;
                    
                    try {
                        localStorage.setItem('plsnhs_teacher_avatar', base64Image);
                    } catch(e) {}

                    if (currentUser && typeof updateDoc === 'function') {
                        try {
                            await updateDoc(doc(db, 'users', currentUser.uid), {
                                profilePicture: base64Image,
                                updatedAt: serverTimestamp()
                            });
                        } catch(err) {
                            console.warn('Firestore update skipped, saved to localStorage:', err);
                        }
                    }
                    
                    applyTeacherAvatarToDOM(base64Image);
                    showAlert('✅ Profile picture updated successfully!', 'success');
                    closeImageModal();
                };
                reader.readAsDataURL(file);
                
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                showAlert('❌ Error uploading: ' + error.message, 'error');
            }
        });
    }

    // ============================================
    // TEACHER DOCUMENTS MANAGEMENT
    // ============================================

    const defaultTeacherDocs = [
        {
            id: 'tdoc_1',
            title: 'PRC Professional Teacher License',
            type: 'PRC License ID',
            filename: 'PRC_License_MariaSantos.pdf',
            size: '1.1 MB',
            date: '2026-06-10',
            format: 'pdf',
            status: 'Verified',
            dataUrl: null
        },
        {
            id: 'tdoc_2',
            title: 'Bachelor of Secondary Education Diploma',
            type: 'Diploma / Transcript',
            filename: 'BSED_Diploma_Transcript.jpg',
            size: '1.4 MB',
            date: '2026-06-12',
            format: 'img',
            status: 'Verified',
            dataUrl: null
        }
    ];

    let teacherDocs = [];
    try {
        const savedTDocs = localStorage.getItem('plsnhs_teacher_documents');
        if (savedTDocs) {
            teacherDocs = JSON.parse(savedTDocs);
        } else {
            teacherDocs = [...defaultTeacherDocs];
            localStorage.setItem('plsnhs_teacher_documents', JSON.stringify(teacherDocs));
        }
    } catch(e) {
        teacherDocs = [...defaultTeacherDocs];
    }

    function persistTeacherDocs() {
        try {
            localStorage.setItem('plsnhs_teacher_documents', JSON.stringify(teacherDocs));
        } catch(e) {}
    }

    const teacherDocDropZone = document.getElementById('teacherDocDropZone');
    const teacherDocFileInput = document.getElementById('teacherDocFileInput');
    const teacherDocUploadForm = document.getElementById('teacherDocUploadForm');
    const teacherDocSelectedName = document.getElementById('teacherDocSelectedName');
    const teacherDocTypeSelect = document.getElementById('teacherDocTypeSelect');
    const teacherDocCustomTitle = document.getElementById('teacherDocCustomTitle');
    const teacherDocCancelBtn = document.getElementById('teacherDocCancelBtn');
    const teacherDocSaveBtn = document.getElementById('teacherDocSaveBtn');
    const teacherDocList = document.getElementById('teacherDocList');
    const teacherDocCount = document.getElementById('teacherDocCount');

    // Preview Modal
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const docPreviewContainer = document.getElementById('docPreviewContainer');
    const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');
    const dismissDocPreviewBtn = document.getElementById('dismissDocPreviewBtn');
    const docDownloadBtn = document.getElementById('docDownloadBtn');

    let currentPendingTeacherFile = null;

    if (teacherDocDropZone && teacherDocFileInput) {
        teacherDocDropZone.addEventListener('click', () => teacherDocFileInput.click());

        teacherDocDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            teacherDocDropZone.classList.add('dragover');
        });

        teacherDocDropZone.addEventListener('dragleave', () => {
            teacherDocDropZone.classList.remove('dragover');
        });

        teacherDocDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            teacherDocDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleTeacherFileSelected(e.dataTransfer.files[0]);
            }
        });

        teacherDocFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleTeacherFileSelected(this.files[0]);
            }
        });
    }

    function handleTeacherFileSelected(file) {
        currentPendingTeacherFile = file;
        if (teacherDocSelectedName) teacherDocSelectedName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        if (teacherDocCustomTitle) teacherDocCustomTitle.value = file.name.replace(/\.[^/.]+$/, '');
        if (teacherDocUploadForm) teacherDocUploadForm.style.display = 'block';
    }

    if (teacherDocCancelBtn) {
        teacherDocCancelBtn.addEventListener('click', () => {
            currentPendingTeacherFile = null;
            if (teacherDocFileInput) teacherDocFileInput.value = '';
            if (teacherDocUploadForm) teacherDocUploadForm.style.display = 'none';
        });
    }

    if (teacherDocSaveBtn) {
        teacherDocSaveBtn.addEventListener('click', () => {
            if (!currentPendingTeacherFile) {
                showAlert('No document selected.', 'error');
                return;
            }

            const title = (teacherDocCustomTitle && teacherDocCustomTitle.value.trim()) || currentPendingTeacherFile.name;
            const type = (teacherDocTypeSelect && teacherDocTypeSelect.value) || 'Other Document';
            const sizeInMb = (currentPendingTeacherFile.size / (1024 * 1024)).toFixed(2);
            const sizeStr = currentPendingTeacherFile.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(currentPendingTeacherFile.size / 1024)} KB`;
            const isPdf = currentPendingTeacherFile.name.toLowerCase().endsWith('.pdf') || currentPendingTeacherFile.type === 'application/pdf';
            const format = isPdf ? 'pdf' : (currentPendingTeacherFile.type.startsWith('image/') ? 'img' : 'doc');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataUrl = evt.target.result;
                const newDoc = {
                    id: 'tdoc_' + Date.now(),
                    title: title,
                    type: type,
                    filename: currentPendingTeacherFile.name,
                    size: sizeStr,
                    date: new Date().toISOString().split('T')[0],
                    format: format,
                    status: 'Verified',
                    dataUrl: dataUrl
                };

                teacherDocs.unshift(newDoc);
                persistTeacherDocs();
                renderTeacherDocs();

                currentPendingTeacherFile = null;
                if (teacherDocFileInput) teacherDocFileInput.value = '';
                if (teacherDocUploadForm) teacherDocUploadForm.style.display = 'none';

                showAlert(`✅ Credential "${title}" uploaded to your profile!`, 'success');
            };
            reader.readAsDataURL(currentPendingTeacherFile);
        });
    }

    function renderTeacherDocs() {
        if (!teacherDocList) return;

        if (teacherDocCount) {
            teacherDocCount.textContent = `${teacherDocs.length} ${teacherDocs.length === 1 ? 'File' : 'Files'}`;
        }

        if (teacherDocs.length === 0) {
            teacherDocList.innerHTML = `
                <div class="empty-docs-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No credentials uploaded yet. Upload your PRC, CSC, or Diplomas above.</p>
                </div>
            `;
            return;
        }

        let html = '';
        teacherDocs.forEach(doc => {
            const iconClass = doc.format === 'pdf' ? 'doc-icon-pdf fa-file-pdf' : (doc.format === 'img' ? 'doc-icon-img fa-file-image' : 'doc-icon-doc fa-file-alt');
            html += `
                <div class="doc-item" data-id="${doc.id}">
                    <div class="doc-item-left">
                        <div class="doc-item-icon ${doc.format === 'pdf' ? 'doc-icon-pdf' : (doc.format === 'img' ? 'doc-icon-img' : 'doc-icon-doc')}">
                            <i class="fas ${iconClass.split(' ')[1]}"></i>
                        </div>
                        <div class="doc-item-info">
                            <div class="doc-item-title" title="${doc.title}">${doc.title}</div>
                            <div class="doc-item-meta">
                                <span class="doc-category-pill">${doc.type}</span>
                                <span>${doc.size}</span>
                                <span>&bull;</span>
                                <span>${doc.date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="doc-item-actions">
                        <button type="button" class="doc-btn btn-view-tdoc" data-id="${doc.id}" title="Preview Document">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="doc-btn doc-btn-danger btn-delete-tdoc" data-id="${doc.id}" title="Delete Document">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        teacherDocList.innerHTML = html;

        teacherDocList.querySelectorAll('.btn-view-tdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                openTeacherDocPreview(id);
            });
        });

        teacherDocList.querySelectorAll('.btn-delete-tdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                deleteTeacherDoc(id);
            });
        });
    }

    function openTeacherDocPreview(id) {
        const doc = teacherDocs.find(d => d.id === id);
        if (!doc || !docPreviewModal) return;

        if (docPreviewTitle) {
            docPreviewTitle.innerHTML = `<i class="fas fa-file-alt"></i> ${doc.title}`;
        }

        if (docDownloadBtn) {
            if (doc.dataUrl) {
                docDownloadBtn.href = doc.dataUrl;
                docDownloadBtn.download = doc.filename;
                docDownloadBtn.style.display = 'inline-flex';
            } else {
                docDownloadBtn.style.display = 'none';
            }
        }

        if (docPreviewContainer) {
            if (doc.format === 'img' && doc.dataUrl) {
                docPreviewContainer.innerHTML = `<img src="${doc.dataUrl}" alt="${doc.title}">`;
            } else if (doc.format === 'pdf' && doc.dataUrl) {
                docPreviewContainer.innerHTML = `
                    <iframe src="${doc.dataUrl}" style="width:100%;height:450px;border:none;border-radius:8px;"></iframe>
                `;
            } else {
                docPreviewContainer.innerHTML = `
                    <div style="padding:40px;text-align:center;">
                        <i class="fas fa-certificate" style="font-size:48px;color:var(--primary);margin-bottom:12px;"></i>
                        <h4 style="font-size:16px;color:#0f172a;margin-bottom:6px;">${doc.title}</h4>
                        <p style="color:#64748b;font-size:13px;">${doc.filename} &bull; ${doc.type} &bull; ${doc.size}</p>
                        <span style="display:inline-block;margin-top:10px;background:#e0e7ff;color:var(--primary);padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Status: ${doc.status}</span>
                    </div>
                `;
            }
        }

        docPreviewModal.classList.add('active');
        docPreviewModal.style.display = 'flex';
    }

    function closeTeacherDocPreview() {
        if (docPreviewModal) {
            docPreviewModal.classList.remove('active');
            docPreviewModal.style.display = 'none';
        }
    }

    if (closeDocPreviewBtn) closeDocPreviewBtn.addEventListener('click', closeTeacherDocPreview);
    if (dismissDocPreviewBtn) dismissDocPreviewBtn.addEventListener('click', closeTeacherDocPreview);

    window.addEventListener('click', function(e) {
        if (e.target === docPreviewModal) {
            closeTeacherDocPreview();
        }
    });

    function deleteTeacherDoc(id) {
        const doc = teacherDocs.find(d => d.id === id);
        if (!doc) return;
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            teacherDocs = teacherDocs.filter(d => d.id !== id);
            persistTeacherDocs();
            renderTeacherDocs();
            showAlert('Credential removed from profile.', 'success');
        }
    }

    // Auto-load saved teacher avatar if present
    try {
        const savedTeacherAvatar = localStorage.getItem('plsnhs_teacher_avatar');
        if (savedTeacherAvatar) {
            applyTeacherAvatarToDOM(savedTeacherAvatar);
        }
    } catch(e) {}

    renderTeacherDocs();

    // ============================================
    // IMAGE MODAL
    // ============================================

    function openImageModal() {
        document.getElementById('imageModal').classList.add('active');
        document.getElementById('imageModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        document.getElementById('imageModal').classList.remove('active');
        document.getElementById('imageModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;

    function previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }
    window.previewImage = previewImage;

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

    console.log('✅ Teacher Profile ready!');

})();