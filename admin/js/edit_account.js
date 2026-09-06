// ===== EDIT ACCOUNT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const roleSelect = document.getElementById('role');
    const idNumberInput = document.getElementById('id_number');
    const previewName = document.getElementById('previewName');
    const previewEmail = document.getElementById('previewEmail');
    const previewRole = document.getElementById('previewRole');
    const previewInitial = document.getElementById('previewInitial');
    const editForm = document.getElementById('editAccountForm');
    const passwordForm = document.getElementById('passwordForm');
    const alertContainer = document.getElementById('alertContainer');
    
    const resetCheckbox = document.getElementById('resetPasswordCheckbox');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const resetBtn = document.getElementById('resetPasswordBtn');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const passwordFields = document.getElementById('passwordFields');

    // Account data from PHP
    const accountData = {
        id: 1,
        name: 'Maria Santos',
        email: 'maria.santos@plshs.edu.ph',
        role: 'Teacher',
        initial: 'M'
    };

    // ===== FUNCTIONS =====

    // Update preview
    function updatePreview() {
        const fullname = fullnameInput.value.trim() || 'User Name';
        previewName.textContent = fullname;
        
        const initial = fullname.charAt(0).toUpperCase() || 'U';
        previewInitial.textContent = initial;

        const email = emailInput.value.trim() || 'user@plshs.edu.ph';
        previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const role = roleSelect.value || 'Student';
        const roleDisplay = role;
        previewRole.textContent = roleDisplay;
        previewRole.className = `preview-role role-${role.toLowerCase()}`;
    }

    // Toggle password visibility
    window.togglePassword = function() {
        const passwordInput = document.getElementById('newPassword');
        const toggleBtn = document.querySelector('.toggle-password i');
        
        if (passwordInput && toggleBtn) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                toggleBtn.className = 'fas fa-eye';
            }
        }
    };

    // Check password strength
    function checkPasswordStrength() {
        const password = newPassword.value;
        let strength = 0;
        let strengthLabel = '';
        let strengthColor = '';

        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]+/)) strength += 1;
        if (password.match(/[A-Z]+/)) strength += 1;
        if (password.match(/[0-9]+/)) strength += 1;
        if (password.match(/[!@#$%^&*(),.?":{}|<>]+/)) strength += 1;

        if (password.length === 0) {
            strengthBar.style.width = '0';
            strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 6 characters</span>';
            return;
        }

        if (strength <= 2) {
            strengthBar.style.width = '30%';
            strengthBar.style.backgroundColor = '#ef4444';
            strengthLabel = 'Weak';
            strengthColor = '#ef4444';
        } else if (strength <= 4) {
            strengthBar.style.width = '65%';
            strengthBar.style.backgroundColor = '#f59e0b';
            strengthLabel = 'Medium';
            strengthColor = '#f59e0b';
        } else {
            strengthBar.style.width = '100%';
            strengthBar.style.backgroundColor = '#10b981';
            strengthLabel = 'Strong';
            strengthColor = '#10b981';
        }

        strengthText.innerHTML = `<i class="fas fa-shield-alt"></i> <span style="color: ${strengthColor};">Password strength: ${strengthLabel}</span>`;
    }

    // Check password match
    function checkPasswordMatch() {
        const password = newPassword.value;
        const confirm = confirmPassword.value;

        if (confirm.length === 0) {
            passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        } else if (password === confirm) {
            passwordMatch.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>';
        } else {
            passwordMatch.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>';
        }
    }

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

    // ===== EVENT LISTENERS =====

    // Live preview
    if (fullnameInput) fullnameInput.addEventListener('input', updatePreview);
    if (emailInput) emailInput.addEventListener('input', updatePreview);
    if (roleSelect) roleSelect.addEventListener('change', updatePreview);

    // Password reset checkbox
    if (resetCheckbox) {
        resetCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            newPassword.disabled = !isChecked;
            confirmPassword.disabled = !isChecked;
            resetBtn.disabled = !isChecked;
            passwordFields.classList.toggle('active', isChecked);
            
            if (!isChecked) {
                newPassword.value = '';
                confirmPassword.value = '';
                strengthBar.style.width = '0';
                strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 6 characters</span>';
                passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
            }
        });
    }

    // Password strength
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            if (resetCheckbox.checked) {
                checkPasswordStrength();
                checkPasswordMatch();
            }
        });
    }

    // Confirm password
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            if (resetCheckbox.checked) {
                checkPasswordMatch();
            }
        });
    }

    // ===== FORM SUBMITS =====

    // Edit account form
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullname = fullnameInput.value.trim();
            const email = emailInput.value.trim();
            const role = roleSelect.value;
            const idNumber = idNumberInput.value.trim();

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }
            if (!role) errors.push('Role is required');

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Account updated successfully!', 'success');
                
                // Update preview with new values
                updatePreview();
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Password reset form
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!resetCheckbox.checked) {
                showAlert('Please check the "Reset user password" checkbox first.', 'error');
                return;
            }

            const password = newPassword.value;
            const confirm = confirmPassword.value;
            let errors = [];

            if (!password) errors.push('New password is required');
            if (password && password.length < 6) errors.push('Password must be at least 6 characters');
            if (password !== confirm) errors.push('Passwords do not match');

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Password reset successfully!', 'success');
                
                // Reset fields
                newPassword.value = '';
                confirmPassword.value = '';
                strengthBar.style.width = '0';
                strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 6 characters</span>';
                passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
                resetCheckbox.checked = false;
                newPassword.disabled = true;
                confirmPassword.disabled = true;
                resetBtn.disabled = true;
                passwordFields.classList.remove('active');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ===== INITIAL PREVIEW =====

    updatePreview();

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
});