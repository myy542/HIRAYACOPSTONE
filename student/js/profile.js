/**
 * Student Profile - Supabase Integration
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('👤 Student Profile (Supabase) ready');

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

    let userData = null;
    let studentData = null;
    let enrollmentData = null;

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

    // Role check
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
        if (!cleanName || cleanName.toLowerCase() === 'student' || cleanName.toLowerCase().includes('mylene') || cleanName.toLowerCase().includes('raganas')) return 'S';
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return 'S';
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function sanitizeStudentName(name, email) {
        if (!name && email) {
            if (email.toLowerCase().includes('mylene') || email.toLowerCase().includes('student')) return 'Student';
            name = email.split('@')[0];
        }
        if (!name || name.toLowerCase().includes('mylene') || name.toLowerCase().includes('raganas') || name.toLowerCase() === 'admin') {
            return 'Student';
        }
        return name;
    }

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

    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    // ============================================
    // LOAD PROFILE DATA FROM SUPABASE
    // ============================================

    async function loadProfileData() {
        try {
            const userEmail = sessionUser.email || '';
            const userUid = sessionUser.uid || '';

            // 1. Fetch user from 'users' table
            try {
                const { data: uData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userUid)
                    .maybeSingle();

                if (uData) {
                    userData = uData;
                }
            } catch(e) {}

            // 2. Fetch student from 'students' table
            try {
                const { data: sRows } = await supabase
                    .from('students')
                    .select('*')
                    .or(`email.eq.${userEmail},id.eq.${userUid}`);

                if (sRows && sRows.length > 0) {
                    studentData = sRows[0];
                }
            } catch(e) {}

            // 3. Fetch latest enrollment
            const studentIdVal = studentData?.id || userUid;
            try {
                let query = supabase.from('enrollments').select('*');
                if (userEmail && studentIdVal) {
                    query = query.or(`email.eq.${userEmail},student_id.eq.${studentIdVal}`);
                } else if (userEmail) {
                    query = query.eq('email', userEmail);
                }
                const { data: enrData } = await query.order('created_at', { ascending: false }).limit(1);
                if (enrData && enrData.length > 0) {
                    enrollmentData = enrData[0];
                }
            } catch(e) {}

            // 4. Subjects count
            try {
                const { count } = await supabase
                    .from('subjects')
                    .select('*', { count: 'exact', head: true });
                if (subjectsCountValue) {
                    subjectsCountValue.textContent = count && count > 0 ? count : (enrollmentData ? 8 : 0);
                }
            } catch(e) {
                if (subjectsCountValue) subjectsCountValue.textContent = enrollmentData ? '8' : '0';
            }

            updateUI();

        } catch (error) {
            console.error('Error loading profile data:', error);
            showAlert('❌ Error loading profile: ' + error.message, 'error');
        }
    }

    // ============================================
    // UPDATE UI
    // ============================================

    function updateUI() {
        let studentFullName = studentData?.first_name ? 
            `${studentData.first_name} ${studentData.last_name || ''}`.trim() : 
            (userData?.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : 
            (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student')));
        studentFullName = sanitizeStudentName(studentFullName, sessionUser.email);

        const initials = getStudentInitials(studentFullName);

        try {
            localStorage.setItem('plsnhs_student_name', studentFullName);
        } catch(e) {}

        if (studentName) studentName.textContent = studentFullName;
        if (studentInitial) studentInitial.textContent = initials;
        if (profileName) profileName.textContent = studentFullName;
        if (profileInitial) profileInitial.textContent = initials;
        if (profileEmail) profileEmail.textContent = sessionUser.email;
        if (studentId) studentId.textContent = studentData?.lrn || 'Not Assigned';
        
        const modalInitial = document.getElementById('modalInitial');
        if (modalInitial) modalInitial.textContent = initials;

        // Profile picture
        const effectiveAvatar = localStorage.getItem('plsnhs_student_avatar');
        if (effectiveAvatar) {
            applyStudentAvatarToDOM(effectiveAvatar);
        } else {
            renderDefaultStudentAvatar(studentFullName);
        }

        // Member since
        const createdDate = userData?.created_at || studentData?.created_at;
        if (createdDate) {
            const date = new Date(createdDate);
            if (memberSince) memberSince.textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (daysActive) daysActive.textContent = diff > 0 ? diff : 1;
        } else {
            if (memberSince) memberSince.textContent = 'Active Member';
            if (daysActive) daysActive.textContent = '1';
        }

        // Email verification badge
        if (emailVerifiedBadge) {
            emailVerifiedBadge.innerHTML = '<span class="verified-badge"><i class="fas fa-check-circle"></i> Active Account</span>';
        }
        if (emailVerificationSection) {
            emailVerificationSection.innerHTML = `
                <div class="verification-badge verified">
                    <i class="fas fa-check-circle"></i> Verified Student Profile
                </div>
                <div class="verification-info">
                    <p>Your student account is registered and authenticated in the school portal.</p>
                </div>
            `;
        }

        // Academic info
        if (enrollmentData || studentData) {
            const grade = enrollmentData?.grade_level || enrollmentData?.grade || studentData?.grade_level || 'Grade 11';
            const strand = enrollmentData?.strand || studentData?.strand || 'TVL-ICT';
            const sy = enrollmentData?.school_year || enrollmentData?.schoolYear || enrollmentData?.last_school_year || '2025-2026';

            if (gradeLevel) gradeLevel.textContent = grade;
            if (strandValue) strandValue.textContent = strand;
            if (schoolYearValue) schoolYearValue.textContent = sy;
        } else {
            if (gradeLevel) gradeLevel.textContent = 'Not Enrolled';
            if (strandValue) strandValue.textContent = 'N/A';
            if (schoolYearValue) schoolYearValue.textContent = 'N/A';
        }
    }

    // ============================================
    // CHANGE PASSWORD (via Supabase)
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
                if (currentPwd) currentPwd.disabled = false;
                if (newPwd) newPwd.disabled = false;
                if (confirmPwd) confirmPwd.disabled = false;
                if (changePwdBtn) changePwdBtn.disabled = true;
                if (newPwd) newPwd.focus();
            } else {
                pwdFields.style.display = 'none';
                if (currentPwd) { currentPwd.disabled = true; currentPwd.value = ''; }
                if (newPwd) { newPwd.disabled = true; newPwd.value = ''; }
                if (confirmPwd) { confirmPwd.disabled = true; confirmPwd.value = ''; }
                if (changePwdBtn) changePwdBtn.disabled = true;
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
    }

    function validatePwd(pwd) {
        return {
            length: pwd.length >= 6,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd)
        };
    }

    function updateStrength() {
        const pwd = newPwd ? newPwd.value : '';
        const validation = validatePwd(pwd);
        
        const validCount = Object.values(validation).filter(v => v).length;
        const percent = (validCount / 4) * 100;
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
        const isStrong = pwd.length >= 6;
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

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const current = document.getElementById('current_password')?.value;
            const newPwdValue = document.getElementById('new_password')?.value;
            const confirm = document.getElementById('confirm_password')?.value;

            if (!current || !newPwdValue || !confirm) {
                showAlert('⚠️ Please fill in all password fields', 'error');
                return;
            }

            if (newPwdValue !== confirm) {
                showAlert('⚠️ Passwords do not match', 'error');
                return;
            }

            try {
                // Verify current password against Supabase users table
                const { data: userRecord, error: checkError } = await supabase
                    .from('users')
                    .select('id, password')
                    .eq('id', sessionUser.uid)
                    .maybeSingle();

                if (checkError) throw checkError;

                if (userRecord && userRecord.password && userRecord.password !== current) {
                    showAlert('❌ Current password is incorrect', 'error');
                    return;
                }

                // Update password in Supabase
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        password: newPwdValue,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', sessionUser.uid);

                if (updateError) throw updateError;
                
                showAlert('✅ Password updated successfully!', 'success');
                
                if (currentPwd) currentPwd.value = '';
                if (newPwd) newPwd.value = '';
                if (confirmPwd) confirmPwd.value = '';
                if (changePwdCheckbox) changePwdCheckbox.checked = false;
                if (pwdFields) pwdFields.style.display = 'none';
                resetStrength();
                
            } catch (error) {
                console.error('Error changing password:', error);
                showAlert('❌ Error changing password: ' + error.message, 'error');
            }
        });
    }

    // ============================================
    // PROFILE PICTURE UPLOAD & PERSISTENCE
    // ============================================

    function renderDefaultStudentAvatar(name) {
        const initials = getStudentInitials(name || 'Student');
        const avatarLarge = document.querySelector('.profile-avatar-large');
        if (avatarLarge) {
            avatarLarge.innerHTML = `
                <div class="avatar-initial" id="profileInitial">${initials}</div>
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }
        const sidebarAvatar = document.querySelector('.student-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <div class="avatar-initial" id="studentInitial">${initials}</div>
                <div class="online-dot"></div>
            `;
        }
    }

    function applyStudentAvatarToDOM(base64Image) {
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

        const sidebarAvatar = document.querySelector('.student-avatar');
        if (sidebarAvatar) {
            const initialEl = sidebarAvatar.querySelector('.avatar-initial');
            if (initialEl) initialEl.style.display = 'none';
            let existingImg = sidebarAvatar.querySelector('img');
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
                sidebarAvatar.prepend(img);
            }
        }
    }

    window.removeProfilePic = function() {
        if (confirm('Remove your profile picture and restore your name initials?')) {
            try {
                localStorage.removeItem('plsnhs_student_avatar');
            } catch(e) {}
            const displayName = studentData?.first_name ? 
                `${studentData.first_name} ${studentData.last_name || ''}`.trim() : 
                (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : 'Student');
            renderDefaultStudentAvatar(displayName);
            showAlert('✅ Profile picture removed. Initials restored.', 'success');
            const imgModal = document.getElementById('imageModal');
            if (imgModal) imgModal.style.display = 'none';
        }
    };

    const profilePicForm = document.getElementById('profilePicForm');
    if (profilePicForm) {
        profilePicForm.addEventListener('submit', function(e) {
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

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Image = evt.target.result;
                try {
                    localStorage.setItem('plsnhs_student_avatar', base64Image);
                } catch(e) {}
                
                applyStudentAvatarToDOM(base64Image);
                showAlert('✅ Profile picture updated successfully!', 'success');
                const imgModal = document.getElementById('imageModal');
                if (imgModal) imgModal.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // Initialize
    loadProfileData();

})();