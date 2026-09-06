// ===== PROFILE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const uploadForm = document.getElementById('uploadForm');

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
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    const twoFactorStatus = document.getElementById('twoFactorStatus');

    // ===== DATA =====

    const profileData = {
        name: 'Mr. & Mrs. Dela Cruz',
        email: 'parent@plshs.edu.ph',
        phone: '09123456789',
        address: '123 Main St., Brgy. San Juan, City of Naga, Cebu',
        since: '2026-01-01',
        children: [
            { name: 'Juan Dela Cruz', grade: 'Grade 11 - STEM A', status: 'Enrolled' },
            { name: 'Maria Dela Cruz', grade: 'Grade 9 - Section B', status: 'Pending' }
        ],
        lastLogin: 'June 23, 2026 10:30 AM'
    };

    const linkedChildren = [
        { id: 1, name: 'Juan Dela Cruz', grade: 'Grade 11 - STEM A', status: 'Enrolled' },
        { id: 2, name: 'Maria Dela Cruz', grade: 'Grade 9 - Section B', status: 'Pending' }
    ];

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

    // Calculate days active
    function calculateDaysActive(sinceDate) {
        const since = new Date(sinceDate);
        const today = new Date();
        const diffTime = Math.abs(today - since);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Update profile info
    function renderProfile() {
        const daysActive = calculateDaysActive(profileData.since);
        
        document.getElementById('profileName').textContent = profileData.name;
        document.getElementById('profileEmail').innerHTML = `
            ${profileData.email}
            <span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>
        `;
        document.getElementById('profilePhone').textContent = profileData.phone;
        document.getElementById('profileAddress').textContent = profileData.address;
        document.getElementById('profileSince').textContent = new Date(profileData.since).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
        document.getElementById('daysActive').textContent = daysActive;
        document.getElementById('childrenCount').textContent = profileData.children.length;
        document.getElementById('lastLogin').textContent = profileData.lastLogin;

        // Form values
        document.getElementById('fullname').value = profileData.name;
        document.getElementById('email').value = profileData.email;
        document.getElementById('phone').value = profileData.phone;
        document.getElementById('address').value = profileData.address;
    }

    // Render children summary
    function renderChildrenSummary() {
        const container = document.getElementById('childrenSummary');
        
        if (profileData.children.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px;">
                    <i class="fas fa-child"></i>
                    <p>No children linked to your account.</p>
                </div>
            `;
            return;
        }

        let html = '';
        profileData.children.forEach(child => {
            const statusClass = child.status.toLowerCase();
            html += `
                <div class="child-summary-item">
                    <span class="child-name">${child.name}</span>
                    <span class="child-status ${statusClass}">${child.status}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Render linked children
    function renderLinkedChildren() {
        const container = document.getElementById('linkedChildren');
        
        if (linkedChildren.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px;">
                    <i class="fas fa-users"></i>
                    <p>No children linked to your account.</p>
                </div>
            `;
            return;
        }

        let html = '';
        linkedChildren.forEach(child => {
            const initial = child.name.charAt(0).toUpperCase();
            const statusClass = child.status.toLowerCase();
            html += `
                <div class="linked-child-item">
                    <div class="child-info">
                        <div class="child-avatar-sm">${initial}</div>
                        <div>
                            <div class="child-name">${child.name}</div>
                            <div class="child-grade">${child.grade}</div>
                        </div>
                    </div>
                    <div class="child-actions">
                        <span class="child-status ${statusClass}" style="font-size: 11px; padding: 2px 10px; border-radius: 12px; background: ${child.status === 'Enrolled' ? '#d1fae5' : '#fef3c7'}; color: ${child.status === 'Enrolled' ? '#065f46' : '#92400e'};">
                            ${child.status}
                        </span>
                        <button class="btn-unlink" onclick="showAlert('Unlink child feature will be available soon.', 'success')">
                            <i class="fas fa-unlink"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
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

    // ===== IMAGE MODAL =====

    window.openImageModal = function() {
        document.getElementById('imageModal').classList.add('show');
    };

    window.closeImageModal = function() {
        document.getElementById('imageModal').classList.remove('show');
    };

    window.previewImage = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;">`;
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.removeProfilePic = function() {
        if (confirm('Remove your profile picture?')) {
            showAlert('✅ Profile picture removed successfully!', 'success');
            closeImageModal();
        }
    };

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

    // Two Factor Toggle
    if (twoFactorToggle) {
        twoFactorToggle.addEventListener('change', function() {
            if (this.checked) {
                twoFactorStatus.textContent = 'Enabled';
                twoFactorStatus.className = 'security-status verified';
                showAlert('Two-Factor Authentication enabled successfully!', 'success');
            } else {
                twoFactorStatus.textContent = 'Disabled';
                twoFactorStatus.className = 'security-status unverified';
                showAlert('Two-Factor Authentication disabled.', 'error');
            }
        });
    }

    // ===== FORM SUBMITS =====

    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }
            if (phone && !/^09\d{9}$/.test(phone)) {
                errors.push('Invalid Philippine mobile number. Format: 09XXXXXXXXX (11 digits)');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Profile updated successfully!', 'success');
            }
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

    // Image upload form
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('profilePicture');
            if (fileInput.files.length === 0) {
                showAlert('Please select an image file.', 'error');
                return;
            }
            showAlert('✅ Profile picture updated successfully!', 'success');
            closeImageModal();
        });
    }

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('imageModal');
        if (e.target === modal) {
            closeImageModal();
        }
    });

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

    renderProfile();
    renderChildrenSummary();
    renderLinkedChildren();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});