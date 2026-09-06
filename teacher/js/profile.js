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
            
            // Load profile data
            await loadProfileData(user.uid);
            await loadTeacherStats(user.uid);
            
            // Update UI
            updateUI();
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
        profileName.textContent = displayName;
        profileInitial.textContent = displayName.charAt(0).toUpperCase();
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
    // PROFILE PICTURE UPLOAD
    // ============================================

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
                reader.onload = async function(e) {
                    const base64Image = e.target.result;
                    
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        profilePicture: base64Image,
                        updatedAt: serverTimestamp()
                    });
                    
                    showAlert('✅ Profile picture updated!', 'success');
                    
                    const preview = document.querySelector('.profile-avatar-large img');
                    if (preview) {
                        preview.src = base64Image;
                    }
                    
                    closeImageModal();
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                };
                reader.readAsDataURL(file);
                
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                showAlert('❌ Error uploading: ' + error.message, 'error');
            }
        });
    }

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