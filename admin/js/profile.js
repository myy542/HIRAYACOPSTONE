// ===== PROFILE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const profileForm = document.getElementById('profileForm');
    const emailChangeForm = document.getElementById('emailChangeForm');
    const passwordForm = document.getElementById('passwordForm');
    const uploadForm = document.getElementById('uploadForm');

    // Verify Email Elements
    const verifyForm = document.getElementById('verifyForm');
    const verifyCodeInput = document.getElementById('verifyCodeInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyAlertContainer = document.getElementById('verifyAlertContainer');
    const resendLink = document.getElementById('resendLink');
    const cancelVerifyLink = document.getElementById('cancelVerifyLink');
    const showVerifyFormBtn = document.getElementById('showVerifyFormBtn');
    const verifyStatus = document.getElementById('verifyStatus');
    const verifyFormContainer = document.getElementById('verifyFormContainer');
    const verifyButtonContainer = document.getElementById('verifyButtonContainer');
    const verifyBadge = document.getElementById('verifyBadge');
    const verifyInfo = document.getElementById('verifyInfo');

    // Password Change Elements
    const changePasswordCheckbox = document.getElementById('changePasswordCheckbox');
    const passwordFields = document.getElementById('passwordFields');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const strengthFill = document.getElementById('passwordStrengthFill');
    const strengthText = document.getElementById('passwordStrengthText');
    const matchText = document.getElementById('passwordMatchText');

    // ===== EMAIL VERIFICATION STATE =====
    let isEmailVerified = false; // Set to true if verified
    let isVerifyFormVisible = false;

    // ===== FUNCTIONS =====

    // Show alert
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // Show verify alert
    function showVerifyAlert(message, type = 'error') {
        // Remove existing alerts
        const existing = verifyAlertContainer.querySelectorAll('.verify-alert');
        existing.forEach(el => el.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `verify-alert verify-alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        verifyAlertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // Calculate days active
    function calculateDaysActive() {
        const createdDate = new Date('2026-01-01');
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('daysActive').textContent = diffDays;
    }

    // ===== EMAIL VERIFICATION FUNCTIONS =====

    // Toggle verify form visibility
    function toggleVerifyForm(show) {
        isVerifyFormVisible = show;
        if (show) {
            verifyFormContainer.style.display = 'block';
            verifyButtonContainer.style.display = 'none';
            verifyStatus.style.display = 'none';
        } else {
            verifyFormContainer.style.display = 'none';
            verifyButtonContainer.style.display = isEmailVerified ? 'none' : 'block';
            verifyStatus.style.display = isEmailVerified ? 'block' : 'none';
        }
    }

    // Update email verification status display
    function updateVerifyStatus(verified) {
        isEmailVerified = verified;
        if (verified) {
            verifyBadge.className = 'verify-badge verified';
            verifyBadge.innerHTML = '<i class="fas fa-check-circle"></i> Verified Email';
            verifyInfo.innerHTML = `
                <p><i class="fas fa-check-circle" style="color: #10b981;"></i> Your email address has been verified.</p>
                <p style="margin-top: 6px;">This adds an extra layer of security to your account.</p>
            `;
            document.getElementById('emailStatusBadge').className = 'verified-badge';
            document.getElementById('emailStatusBadge').innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            verifyButtonContainer.style.display = 'none';
            verifyFormContainer.style.display = 'none';
            verifyStatus.style.display = 'block';
        } else {
            verifyBadge.className = 'verify-badge unverified';
            verifyBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Email Not Verified';
            verifyInfo.innerHTML = `
                <p><i class="fas fa-info-circle"></i> Your email address has not been verified yet.</p>
                <p style="margin-top: 6px;">Verifying your email helps secure your account and ensures you receive important notifications.</p>
            `;
            document.getElementById('emailStatusBadge').className = 'unverified-badge';
            document.getElementById('emailStatusBadge').innerHTML = '<i class="fas fa-times-circle"></i> Unverified';
            verifyButtonContainer.style.display = 'block';
            verifyFormContainer.style.display = 'none';
            verifyStatus.style.display = 'block';
        }
    }

    // Simulate API call for verification
    function verifyCode(code) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = code === '123456';
                resolve({
                    success: success,
                    message: success ? 'Email verified successfully!' : 'Invalid verification code.'
                });
            }, 1000);
        });
    }

    // Simulate resend code
    function resendCode() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'A new verification code has been sent to your email.'
                });
            }, 800);
        });
    }

    // ===== PASSWORD STRENGTH =====

    function validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }

    function updatePasswordStrength() {
        if (!newPassword) return;
        
        const password = newPassword.value;
        const validation = validatePassword(password);
        
        const reqLength = document.getElementById('req-length');
        const reqUpper = document.getElementById('req-upper');
        const reqLower = document.getElementById('req-lower');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');
        
        if (reqLength) {
            reqLength.className = validation.length ? 'valid' : '';
            reqLength.innerHTML = validation.length ? 
                '<i class="fas fa-check-circle"></i> At least 8 characters' : 
                '<i class="fas fa-circle"></i> At least 8 characters';
        }
        if (reqUpper) {
            reqUpper.className = validation.uppercase ? 'valid' : '';
            reqUpper.innerHTML = validation.uppercase ? 
                '<i class="fas fa-check-circle"></i> At least 1 uppercase letter (A-Z)' : 
                '<i class="fas fa-circle"></i> At least 1 uppercase letter (A-Z)';
        }
        if (reqLower) {
            reqLower.className = validation.lowercase ? 'valid' : '';
            reqLower.innerHTML = validation.lowercase ? 
                '<i class="fas fa-check-circle"></i> At least 1 lowercase letter (a-z)' : 
                '<i class="fas fa-circle"></i> At least 1 lowercase letter (a-z)';
        }
        if (reqNumber) {
            reqNumber.className = validation.number ? 'valid' : '';
            reqNumber.innerHTML = validation.number ? 
                '<i class="fas fa-check-circle"></i> At least 1 number (0-9)' : 
                '<i class="fas fa-circle"></i> At least 1 number (0-9)';
        }
        if (reqSpecial) {
            reqSpecial.className = validation.special ? 'valid' : '';
            reqSpecial.innerHTML = validation.special ? 
                '<i class="fas fa-check-circle"></i> At least 1 special character (!@#$%^&*)' : 
                '<i class="fas fa-circle"></i> At least 1 special character (!@#$%^&*)';
        }
        
        const validCount = Object.values(validation).filter(v => v === true).length;
        const strengthPercent = (validCount / 5) * 100;
        
        if (strengthFill) {
            strengthFill.style.width = strengthPercent + '%';
            if (strengthPercent <= 25) {
                strengthFill.style.backgroundColor = '#ef4444';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #ef4444;">Weak password</span>';
            } else if (strengthPercent <= 50) {
                strengthFill.style.backgroundColor = '#f59e0b';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #f59e0b;">Fair password</span>';
            } else if (strengthPercent <= 75) {
                strengthFill.style.backgroundColor = '#3b82f6';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #3b82f6;">Good password</span>';
            } else {
                strengthFill.style.backgroundColor = '#10b981';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #10b981;">Strong password</span>';
            }
        }
        
        checkPasswordMatch();
        
        const isStrong = Object.values(validation).every(v => v === true);
        const confirm = confirmPassword ? confirmPassword.value : '';
        const passwordsMatch = (password === confirm);
        
        if (changePasswordBtn) {
            changePasswordBtn.disabled = !(isStrong && passwordsMatch && password.length > 0);
        }
    }

    function checkPasswordMatch() {
        if (!newPassword || !confirmPassword) return;
        
        const password = newPassword.value;
        const confirm = confirmPassword.value;

        if (confirm.length === 0) {
            matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        } else if (password === confirm) {
            matchText.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>';
        } else {
            matchText.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>';
        }
        
        if (changePasswordBtn && newPassword.value.length > 0) {
            const validation = validatePassword(newPassword.value);
            const isStrong = Object.values(validation).every(v => v === true);
            changePasswordBtn.disabled = !(isStrong && password === confirm);
        }
    }

    function resetPasswordStrength() {
        if (strengthFill) strengthFill.style.width = '0%';
        if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Enter new password</span>';
        if (matchText) matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        
        ['length', 'upper', 'lower', 'number', 'special'].forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                element.className = '';
                const texts = {
                    length: 'At least 8 characters',
                    upper: 'At least 1 uppercase letter (A-Z)',
                    lower: 'At least 1 lowercase letter (a-z)',
                    number: 'At least 1 number (0-9)',
                    special: 'At least 1 special character (!@#$%^&*)'
                };
                element.innerHTML = `<i class="fas fa-circle"></i> ${texts[req]}`;
            }
        });
    }

    // ===== EVENT LISTENERS =====

    // Password change checkbox
    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            passwordFields.classList.toggle('show', isChecked);
            currentPassword.disabled = !isChecked;
            newPassword.disabled = !isChecked;
            confirmPassword.disabled = !isChecked;
            changePasswordBtn.disabled = !isChecked;
            
            if (!isChecked) {
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                resetPasswordStrength();
            } else {
                newPassword.focus();
            }
        });
    }

    if (newPassword) {
        newPassword.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }

    // ===== VERIFY EMAIL EVENTS =====

    // Auto-format code input
    if (verifyCodeInput) {
        verifyCodeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
        });

        // Auto-submit when 6 digits entered
        verifyCodeInput.addEventListener('input', function(e) {
            if (this.value.length === 6) {
                setTimeout(() => {
                    verifyForm.dispatchEvent(new Event('submit'));
                }, 300);
            }
        });
    }

    // Show verify form
    if (showVerifyFormBtn) {
        showVerifyFormBtn.addEventListener('click', function() {
            toggleVerifyForm(true);
            verifyCodeInput.focus();
        });
    }

    // Cancel verify
    if (cancelVerifyLink) {
        cancelVerifyLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleVerifyForm(false);
            verifyCodeInput.value = '';
            // Clear alerts
            verifyAlertContainer.querySelectorAll('.verify-alert').forEach(el => el.remove());
        });
    }

    // Verify form submit
    if (verifyForm) {
        verifyForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const code = verifyCodeInput.value.trim();

            if (code.length !== 6) {
                showVerifyAlert('Please enter a valid 6-digit verification code.', 'error');
                verifyCodeInput.focus();
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            try {
                const result = await verifyCode(code);
                
                if (result.success) {
                    showVerifyAlert('✅ ' + result.message, 'success');
                    updateVerifyStatus(true);
                    toggleVerifyForm(false);
                    verifyCodeInput.value = '';
                    
                    // Show success message in main alert
                    showAlert('✅ ' + result.message, 'success');
                } else {
                    showVerifyAlert('❌ ' + result.message, 'error');
                    verifyCodeInput.value = '';
                    verifyCodeInput.focus();
                }
            } catch (error) {
                showVerifyAlert('❌ Error verifying code. Please try again.', 'error');
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            }
        });
    }

    // Resend code
    if (resendLink) {
        resendLink.addEventListener('click', async function(e) {
            e.preventDefault();

            this.style.pointerEvents = 'none';
            this.style.opacity = '0.6';
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                const result = await resendCode();
                
                if (result.success) {
                    showVerifyAlert('✅ ' + result.message, 'success');
                    verifyCodeInput.value = '';
                    verifyCodeInput.focus();
                    showAlert('✅ ' + result.message, 'success');
                } else {
                    showVerifyAlert('❌ Failed to resend code. Please try again.', 'error');
                }
            } catch (error) {
                showVerifyAlert('❌ Error sending code. Please try again.', 'error');
            } finally {
                this.style.pointerEvents = 'auto';
                this.style.opacity = '1';
                this.innerHTML = '<i class="fas fa-redo"></i> Resend Verification Code';
            }
        });
    }

    // ===== PROFILE INITIALS & AVATAR SYNC =====

    function getAdminInitials(name) {
        if (!name || typeof name !== 'string') return 'A';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|engr\.?|atty\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function renderDefaultAvatar(name) {
        const initials = getAdminInitials(name || 'Admin User');
        
        const largeAvatar = document.querySelector('.profile-avatar-large');
        if (largeAvatar) {
            largeAvatar.innerHTML = `
                <div class="avatar-initial">${initials}</div>
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        const sidebarAvatar = document.querySelector('.admin-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <div class="avatar-initial">${initials}</div>
                <div class="online-dot"></div>
            `;
        }

        const modalPreview = document.getElementById('imagePreview');
        if (modalPreview) {
            modalPreview.innerHTML = `
                <div style="width: 150px; height: 150px; background: #1B2A4A; display: flex; align-items: center; justify-content: center; color: white; font-size: 52px; font-weight: bold; border-radius: 50%;">
                    ${initials}
                </div>
            `;
        }
    }

    function loadSavedAdminProfile() {
        try {
            const savedName = localStorage.getItem('plsnhs_admin_name');
            if (savedName) {
                const fullnameInput = document.getElementById('fullname');
                if (fullnameInput) fullnameInput.value = savedName;
                const profileNameEl = document.getElementById('profileName');
                if (profileNameEl) profileNameEl.textContent = savedName;
                const sidebarName = document.querySelector('.admin-name');
                if (sidebarName) sidebarName.textContent = savedName;
            }
            const savedId = localStorage.getItem('plsnhs_admin_id');
            if (savedId) {
                const idInput = document.getElementById('idNumber');
                if (idInput) idInput.value = savedId;
            }
            const savedPhone = localStorage.getItem('plsnhs_admin_phone');
            if (savedPhone) {
                const phoneInput = document.getElementById('phone');
                if (phoneInput) phoneInput.value = savedPhone;
            }

            const currentName = savedName || (document.getElementById('fullname') ? document.getElementById('fullname').value : 'Admin User');
            const savedAvatar = localStorage.getItem('plsnhs_admin_avatar');
            if (savedAvatar) {
                applyAvatarToDOM(savedAvatar);
            } else {
                renderDefaultAvatar(currentName);
            }
        } catch(e) {}
    }

    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value.trim();
            const idNumber = document.getElementById('idNumber').value.trim();
            const phone = document.getElementById('phone').value.trim();

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (phone && !/^09\d{9}$/.test(phone)) {
                errors.push('Invalid Philippine mobile number. Format: 09XXXXXXXXX (11 digits)');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                try {
                    localStorage.setItem('plsnhs_admin_name', fullname);
                    if (idNumber) localStorage.setItem('plsnhs_admin_id', idNumber);
                    if (phone) localStorage.setItem('plsnhs_admin_phone', phone);
                } catch(e) {}

                document.getElementById('profileName').textContent = fullname;
                const sidebarName = document.querySelector('.admin-name');
                if (sidebarName) sidebarName.textContent = fullname;

                const savedAvatar = localStorage.getItem('plsnhs_admin_avatar');
                if (!savedAvatar) {
                    renderDefaultAvatar(fullname);
                }

                showAlert('✅ Profile information updated successfully!', 'success');
            }
        });
    }

    // Live update initials as admin types name if no custom image is uploaded
    const fullnameInput = document.getElementById('fullname');
    if (fullnameInput) {
        fullnameInput.addEventListener('input', function() {
            const savedAvatar = localStorage.getItem('plsnhs_admin_avatar');
            if (!savedAvatar) {
                renderDefaultAvatar(this.value.trim() || 'Admin User');
            }
        });
    }

    // Email change form
    if (emailChangeForm) {
        emailChangeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newEmail = document.getElementById('newEmail').value.trim();

            if (!newEmail) {
                showAlert('Please enter an email address.', 'error');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                showAlert('Invalid email format.', 'error');
                return;
            }

            showAlert(`✅ A verification code has been sent to: ${newEmail}`, 'success');
            this.reset();
        });
    }

    // Password form
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!changePasswordCheckbox.checked) {
                showAlert('Please check the "I want to change my password" checkbox.', 'error');
                return;
            }

            const current = currentPassword.value;
            const newPass = newPassword.value;
            const confirm = confirmPassword.value;
            let errors = [];

            if (!current) errors.push('Current password is required');
            if (!newPass) errors.push('New password is required');
            if (newPass && newPass.length < 8) errors.push('Password must be at least 8 characters');
            if (newPass !== confirm) errors.push('Passwords do not match');

            if (newPass) {
                const validation = validatePassword(newPass);
                const isStrong = Object.values(validation).every(v => v === true);
                if (!isStrong) errors.push('Password does not meet all requirements');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Password changed successfully!', 'success');
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                resetPasswordStrength();
                changePasswordCheckbox.checked = false;
                passwordFields.classList.remove('show');
                currentPassword.disabled = true;
                newPassword.disabled = true;
                confirmPassword.disabled = true;
                changePasswordBtn.disabled = true;
            }
        });
    }

    // ===== PROFILE PICTURE UPLOAD & PERSISTENCE =====

    function applyAvatarToDOM(base64Image) {
        // Update large profile avatar
        const largeAvatar = document.querySelector('.profile-avatar-large');
        if (largeAvatar) {
            largeAvatar.innerHTML = `
                <img src="${base64Image}" alt="Profile Picture" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        // Update sidebar avatar
        const sidebarAvatar = document.querySelector('.admin-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <img src="${base64Image}" alt="Admin" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="online-dot"></div>
            `;
        }

        // Update modal preview
        const modalPreview = document.getElementById('imagePreview');
        if (modalPreview) {
            modalPreview.innerHTML = `<img src="${base64Image}" alt="Preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;">`;
        }
    }

    // Image upload form submit
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('profilePicture');
            if (!fileInput.files || fileInput.files.length === 0) {
                showAlert('Please select an image file to upload.', 'error');
                return;
            }

            const file = fileInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showAlert('File size exceeds 5MB limit. Please choose a smaller image.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Image = evt.target.result;
                try {
                    localStorage.setItem('plsnhs_admin_avatar', base64Image);
                } catch(err) {
                    console.warn('Avatar could not be saved to localStorage:', err);
                }
                applyAvatarToDOM(base64Image);
                showAlert('✅ Profile picture uploaded and updated successfully!', 'success');
                closeImageModal();
            };
            reader.readAsDataURL(file);
        });
    }

    // ===== IMAGE MODAL =====

    window.openImageModal = function() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    };

    window.closeImageModal = function() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    };

    window.previewImage = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;">`;
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.removeProfilePic = function() {
        if (confirm('Remove your profile picture and restore your name initials?')) {
            try {
                localStorage.removeItem('plsnhs_admin_avatar');
            } catch(e) {}
            const currentName = localStorage.getItem('plsnhs_admin_name') || (document.getElementById('fullname') ? document.getElementById('fullname').value : 'Admin User');
            renderDefaultAvatar(currentName);
            showAlert('✅ Profile picture removed. Initials restored.', 'success');
            closeImageModal();
        }
    };

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('imageModal');
        if (e.target === modal) {
            closeImageModal();
        }
    });

    // ===== ADMIN DOCUMENTS MANAGEMENT =====

    const defaultAdminDocs = [
        {
            id: 'doc_1',
            title: 'DepEd Administrator Appointment Order 2026',
            type: 'Appointment',
            filename: 'DepEd_Order_Admin_2026.pdf',
            size: '1.4 MB',
            date: '2026-01-15',
            format: 'pdf',
            status: 'Verified',
            dataUrl: null
        },
        {
            id: 'doc_2',
            title: 'School Head Professional PRC ID',
            type: 'Valid ID',
            filename: 'PRC_License_Admin.jpg',
            size: '840 KB',
            date: '2026-02-02',
            format: 'img',
            status: 'Verified',
            dataUrl: null
        }
    ];

    let adminDocs = [];
    try {
        const savedDocs = localStorage.getItem('plsnhs_admin_documents');
        if (savedDocs) {
            adminDocs = JSON.parse(savedDocs);
        } else {
            adminDocs = [...defaultAdminDocs];
            localStorage.setItem('plsnhs_admin_documents', JSON.stringify(adminDocs));
        }
    } catch(e) {
        adminDocs = [...defaultAdminDocs];
    }

    function persistAdminDocs() {
        try {
            localStorage.setItem('plsnhs_admin_documents', JSON.stringify(adminDocs));
        } catch(e) {}
    }

    const adminDocDropZone = document.getElementById('adminDocDropZone');
    const adminDocFileInput = document.getElementById('adminDocFileInput');
    const adminDocUploadForm = document.getElementById('adminDocUploadForm');
    const adminDocSelectedName = document.getElementById('adminDocSelectedName');
    const adminDocTypeSelect = document.getElementById('adminDocTypeSelect');
    const adminDocCustomTitle = document.getElementById('adminDocCustomTitle');
    const adminDocCancelBtn = document.getElementById('adminDocCancelBtn');
    const adminDocSaveBtn = document.getElementById('adminDocSaveBtn');
    const adminDocList = document.getElementById('adminDocList');
    const adminDocCount = document.getElementById('adminDocCount');

    // Modal elements for doc preview
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const docPreviewContainer = document.getElementById('docPreviewContainer');
    const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');
    const dismissDocPreviewBtn = document.getElementById('dismissDocPreviewBtn');
    const docDownloadBtn = document.getElementById('docDownloadBtn');

    let currentPendingFile = null;

    if (adminDocDropZone && adminDocFileInput) {
        adminDocDropZone.addEventListener('click', () => adminDocFileInput.click());

        adminDocDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            adminDocDropZone.classList.add('dragover');
        });

        adminDocDropZone.addEventListener('dragleave', () => {
            adminDocDropZone.classList.remove('dragover');
        });

        adminDocDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            adminDocDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleAdminFileSelected(e.dataTransfer.files[0]);
            }
        });

        adminDocFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleAdminFileSelected(this.files[0]);
            }
        });
    }

    function handleAdminFileSelected(file) {
        currentPendingFile = file;
        if (adminDocSelectedName) adminDocSelectedName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        if (adminDocCustomTitle) adminDocCustomTitle.value = file.name.replace(/\.[^/.]+$/, '');
        if (adminDocUploadForm) adminDocUploadForm.style.display = 'block';
    }

    if (adminDocCancelBtn) {
        adminDocCancelBtn.addEventListener('click', () => {
            currentPendingFile = null;
            if (adminDocFileInput) adminDocFileInput.value = '';
            if (adminDocUploadForm) adminDocUploadForm.style.display = 'none';
        });
    }

    if (adminDocSaveBtn) {
        adminDocSaveBtn.addEventListener('click', () => {
            if (!currentPendingFile) {
                showAlert('No file selected.', 'error');
                return;
            }

            const title = (adminDocCustomTitle && adminDocCustomTitle.value.trim()) || currentPendingFile.name;
            const type = (adminDocTypeSelect && adminDocTypeSelect.value) || 'Other';
            const sizeInMb = (currentPendingFile.size / (1024 * 1024)).toFixed(2);
            const sizeStr = currentPendingFile.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(currentPendingFile.size / 1024)} KB`;
            const isPdf = currentPendingFile.name.toLowerCase().endsWith('.pdf') || currentPendingFile.type === 'application/pdf';
            const format = isPdf ? 'pdf' : (currentPendingFile.type.startsWith('image/') ? 'img' : 'doc');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataUrl = evt.target.result;
                const newDoc = {
                    id: 'doc_' + Date.now(),
                    title: title,
                    type: type,
                    filename: currentPendingFile.name,
                    size: sizeStr,
                    date: new Date().toISOString().split('T')[0],
                    format: format,
                    status: 'Uploaded',
                    dataUrl: dataUrl
                };

                adminDocs.unshift(newDoc);
                persistAdminDocs();
                renderAdminDocs();

                currentPendingFile = null;
                if (adminDocFileInput) adminDocFileInput.value = '';
                if (adminDocUploadForm) adminDocUploadForm.style.display = 'none';

                showAlert(`✅ Document "${title}" uploaded to your profile!`, 'success');
            };
            reader.readAsDataURL(currentPendingFile);
        });
    }

    function renderAdminDocs() {
        if (!adminDocList) return;

        if (adminDocCount) {
            adminDocCount.textContent = `${adminDocs.length} ${adminDocs.length === 1 ? 'File' : 'Files'}`;
        }

        if (adminDocs.length === 0) {
            adminDocList.innerHTML = `
                <div class="empty-docs-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No documents uploaded yet. Upload your credentials above.</p>
                </div>
            `;
            return;
        }

        let html = '';
        adminDocs.forEach(doc => {
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
                        <button type="button" class="doc-btn btn-view-doc" data-id="${doc.id}" title="Preview Document">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="doc-btn doc-btn-danger btn-delete-doc" data-id="${doc.id}" title="Delete Document">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        adminDocList.innerHTML = html;

        // Attach listeners
        adminDocList.querySelectorAll('.btn-view-doc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                openDocPreview(id);
            });
        });

        adminDocList.querySelectorAll('.btn-delete-doc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                deleteAdminDoc(id);
            });
        });
    }

    function openDocPreview(id) {
        const doc = adminDocs.find(d => d.id === id);
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
                        <i class="fas fa-file-check" style="font-size:48px;color:#1B2A4A;margin-bottom:12px;"></i>
                        <h4 style="font-size:16px;color:#0f172a;margin-bottom:6px;">${doc.title}</h4>
                        <p style="color:#64748b;font-size:13px;">${doc.filename} &bull; ${doc.type} &bull; ${doc.size}</p>
                        <span style="display:inline-block;margin-top:10px;background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Status: ${doc.status}</span>
                    </div>
                `;
            }
        }

        docPreviewModal.classList.add('show');
        docPreviewModal.style.display = 'flex';
    }

    function closeDocPreview() {
        if (docPreviewModal) {
            docPreviewModal.classList.remove('show');
            docPreviewModal.style.display = 'none';
        }
    }

    if (closeDocPreviewBtn) closeDocPreviewBtn.addEventListener('click', closeDocPreview);
    if (dismissDocPreviewBtn) dismissDocPreviewBtn.addEventListener('click', closeDocPreview);

    window.addEventListener('click', function(e) {
        if (e.target === docPreviewModal) {
            closeDocPreview();
        }
    });

    function deleteAdminDoc(id) {
        const doc = adminDocs.find(d => d.id === id);
        if (!doc) return;
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            adminDocs = adminDocs.filter(d => d.id !== id);
            persistAdminDocs();
            renderAdminDocs();
            showAlert('Document deleted from profile.', 'success');
        }
    }

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== INIT =====

    calculateDaysActive();
    updateVerifyStatus(isEmailVerified);
    loadSavedAdminProfile();
    renderAdminDocs();
});