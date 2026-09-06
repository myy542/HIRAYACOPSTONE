/**
 * Student Profile - Firebase Integration
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
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('👤 Profile page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const backBtn = document.getElementById('backBtn');

    // Profile info
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');
    const profileEmail = document.getElementById('profileEmail');
    const studentId = document.getElementById('studentId');
    const memberSince = document.getElementById('memberSince');
    const daysActive = document.getElementById('daysActive');
    const emailVerifiedBadge = document.getElementById('emailVerifiedBadge');
    const emailVerificationSection = document.getElementById('emailVerificationSection');

    // Academic info
    const gradeLevel = document.getElementById('gradeLevel');
    const strandValue = document.getElementById('strandValue');
    const schoolYearValue = document.getElementById('schoolYearValue');
    const subjectsCountValue = document.getElementById('subjectsCountValue');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let enrollmentData = null;

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            
            // Set basic info
            const displayName = user.displayName || user.email || 'Student';
            const firstName = displayName.split('@')[0];
            studentName.textContent = firstName;
            studentInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // REMOVED: Role validation check
            // Any authenticated user can access this page
            
            // Load profile data
            await loadProfileData(user.uid);
            await loadAcademicData(user.uid);
            
            // Update UI with user data
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
                    role: 'student',
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
    // LOAD ACADEMIC DATA
    // ============================================

    async function loadAcademicData(userId) {
        try {
            // Get current enrollment without requiring composite index
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            
            let enrollments = [];
            snapshot.forEach((d) => {
                enrollments.push({ id: d.id, ...d.data() });
            });

            enrollments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0));
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0));
                return timeB - timeA;
            });

            if (enrollments.length > 0) {
                enrollmentData = enrollments[0];
                console.log('📚 Enrollment data loaded:', enrollmentData);
                
                // Get subjects count
                if (enrollmentData.gradeId || enrollmentData.grade) {
                    try {
                        const subjectsRef = collection(db, 'subjects');
                        const sq = query(subjectsRef);
                        const subjectSnapshot = await getDocs(sq);
                        let count = 0;
                        subjectSnapshot.forEach(d => {
                            const data = d.data();
                            if (data.gradeId == enrollmentData.gradeId || data.grade == enrollmentData.grade || data.grade_name == enrollmentData.grade) {
                                count++;
                            }
                        });
                        if (subjectsCountValue) subjectsCountValue.textContent = count > 0 ? count : (enrollmentData.grade?.includes('11') || enrollmentData.grade?.includes('12') ? 7 : 8);
                    } catch {
                        if (subjectsCountValue) subjectsCountValue.textContent = '8';
                    }
                }
            } else {
                enrollmentData = null;
                if (subjectsCountValue) subjectsCountValue.textContent = '0';
            }
        } catch (error) {
            console.error('Error loading academic data:', error);
        }
    }

    // ============================================
    // UPDATE UI
    // ============================================

    function updateUI() {
        if (!currentUser) return;

        // Profile info
        const displayName = userData?.displayName || userData?.fullName || currentUser.displayName || currentUser.email || 'Student';
        if (profileName) profileName.textContent = displayName;
        if (profileInitial) profileInitial.textContent = displayName.charAt(0).toUpperCase();
        if (profileEmail) profileEmail.textContent = currentUser.email;
        if (studentId) studentId.textContent = userData?.idNumber || 'Not Assigned';

        // Profile picture
        if (userData?.profilePicture) {
            const avatarLarge = document.querySelector('.profile-avatar-large');
            if (avatarLarge) {
                const existingImg = avatarLarge.querySelector('img');
                if (existingImg) {
                    existingImg.src = userData.profilePicture;
                } else {
                    const initialEl = avatarLarge.querySelector('.avatar-initial');
                    if (initialEl) initialEl.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = userData.profilePicture;
                    img.alt = 'Profile';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    avatarLarge.prepend(img);
                }
            }

            const sidebarAvatar = document.querySelector('.student-avatar');
            if (sidebarAvatar) {
                const existingImg = sidebarAvatar.querySelector('img');
                if (existingImg) {
                    existingImg.src = userData.profilePicture;
                } else {
                    const initialEl = sidebarAvatar.querySelector('.avatar-initial');
                    if (initialEl) initialEl.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = userData.profilePicture;
                    img.alt = 'Profile';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    sidebarAvatar.prepend(img);
                }
            }
        }

        // Member since
        if (userData?.createdAt) {
            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
            if (memberSince) memberSince.textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            // Days active
            const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (daysActive) daysActive.textContent = diff > 0 ? diff : 0;
        } else {
            if (memberSince) memberSince.textContent = 'N/A';
            if (daysActive) daysActive.textContent = '0';
        }

        // Email verification
        if (currentUser.emailVerified) {
            emailVerifiedBadge.innerHTML = '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>';
            emailVerificationSection.innerHTML = `
                <div class="verification-badge verified">
                    <i class="fas fa-check-circle"></i> Verified Email
                </div>
                <div class="verification-info">
                    <p>Your email address has been verified.</p>
                </div>
            `;
        } else {
            emailVerifiedBadge.innerHTML = '<span class="unverified-badge"><i class="fas fa-times-circle"></i> Unverified</span>';
            emailVerificationSection.innerHTML = `
                <div class="verification-badge unverified">
                    <i class="fas fa-exclamation-triangle"></i> Email Not Verified
                </div>
                <div class="verification-info">
                    <p>Verifying your email helps secure your account.</p>
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

        // Academic info
        if (enrollmentData) {
            gradeLevel.textContent = enrollmentData.grade || 'N/A';
            strandValue.textContent = enrollmentData.strand || 'N/A';
            schoolYearValue.textContent = enrollmentData.schoolYear || 'N/A';
        } else {
            gradeLevel.textContent = 'Not Enrolled';
            strandValue.textContent = 'N/A';
            schoolYearValue.textContent = 'N/A';
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
                pwdFields.style.display = 'block';
                currentPwd.disabled = false;
                newPwd.disabled = false;
                confirmPwd.disabled = false;
                changePwdBtn.disabled = true;
                newPwd.focus();
            } else {
                pwdFields.style.display = 'none';
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
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        const matchText = document.getElementById('passwordMatch');
        if (strengthBar) strengthBar.style.width = '0';
        if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> Enter new password';
        if (matchText) matchText.innerHTML = '<i class="fas fa-info-circle"></i> Re-enter new password';
        ['length','uppercase','lowercase','number','special'].forEach(r => {
            const el = document.getElementById(`req-${r}`);
            if (el) {
                el.classList.remove('valid');
                el.innerHTML = '<i class="fas fa-circle"></i> ' + el.innerText.replace(/[✓✔✅]/g, '').trim();
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
        const pwd = newPwd ? newPwd.value : '';
        const validation = validatePwd(pwd);
        
        ['length','uppercase','lowercase','number','special'].forEach(r => {
            const el = document.getElementById(`req-${r}`);
            if (el) {
                if (validation[r]) {
                    el.classList.add('valid');
                    el.innerHTML = '<i class="fas fa-check-circle"></i> ' + el.innerText.replace(/[✓✔✅]/g, '').trim();
                } else {
                    el.classList.remove('valid');
                    el.innerHTML = '<i class="fas fa-circle"></i> ' + el.innerText.replace(/[✓✔✅]/g, '').trim();
                }
            }
        });
        
        const validCount = Object.values(validation).filter(v => v).length;
        const percent = (validCount / 5) * 100;
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        if (strengthBar) {
            strengthBar.style.width = percent + '%';
            if (percent <= 25) {
                strengthBar.style.backgroundColor = '#ef4444';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color:#ef4444">Weak</span>';
            } else if (percent <= 50) {
                strengthBar.style.backgroundColor = '#f59e0b';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color:#f59e0b">Fair</span>';
            } else if (percent <= 75) {
                strengthBar.style.backgroundColor = '#3b82f6';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color:#3b82f6">Good</span>';
            } else {
                strengthBar.style.backgroundColor = '#10b981';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color:#10b981">Strong</span>';
            }
        }
        
        checkMatch();
        const isStrong = Object.values(validation).every(v => v);
        if (changePwdBtn) changePwdBtn.disabled = !(isStrong && confirmPwd && pwd === confirmPwd.value);
    }

    function checkMatch() {
        const matchText = document.getElementById('passwordMatch');
        if (newPwd && confirmPwd) {
            if (confirmPwd.value.length === 0) {
                matchText.innerHTML = '<i class="fas fa-info-circle"></i> Re-enter new password';
            } else if (newPwd.value === confirmPwd.value) {
                matchText.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> <span style="color:#10b981">Passwords match</span>';
            } else {
                matchText.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#ef4444"></i> <span style="color:#ef4444">Passwords do not match</span>';
            }
        }
    }

    if (newPwd) newPwd.addEventListener('input', updateStrength);
    if (confirmPwd) confirmPwd.addEventListener('input', checkMatch);

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

            // Validate
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
                
                showAlert('✅ Password changed successfully!', 'success');
                
                // Reset form
                document.getElementById('current_password').value = '';
                document.getElementById('new_password').value = '';
                document.getElementById('confirm_password').value = '';
                changePwdCheckbox.checked = false;
                pwdFields.style.display = 'none';
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

    // Handle email change form
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
                // Re-authenticate user first (optional but recommended)
                // For simplicity, we'll just update the email
                await updateEmail(currentUser, newEmail);
                
                // Update in Firestore
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    email: newEmail,
                    updatedAt: serverTimestamp()
                });
                
                showAlert('✅ Email updated successfully! Please verify your new email.', 'success');
                
                // Refresh page to show updated email
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

    // Handle profile picture upload (simplified - we'll use Firestore to store the reference)
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
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (file.size > maxSize) {
                showAlert('⚠️ File is too large. Maximum size is 5MB.', 'error');
                return;
            }

            try {
                // Read file as base64 (for demo - in production use Firebase Storage)
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64Image = e.target.result;
                    
                    // Store base64 image in Firestore (not recommended for production)
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        profilePicture: base64Image,
                        updatedAt: serverTimestamp()
                    });
                    
                    showAlert('✅ Profile picture updated!', 'success');
                    
                    // Update preview
                    const preview = document.querySelector('.profile-avatar-large img');
                    if (preview) {
                        preview.src = base64Image;
                    }
                    
                    // Close modal
                    closeImageModal();
                    
                    // Refresh page after 1.5 seconds
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
    }

    function closeImageModal() {
        document.getElementById('imageModal').classList.remove('active');
    }

    // Expose functions globally
    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;

    // Preview image before upload
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

    // ============================================
    // SET CURRENT DATE
    // ============================================

    const dateBadge = document.querySelector('.date-badge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    console.log('✅ Profile page ready!');

})();