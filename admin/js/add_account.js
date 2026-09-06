// ===== ADD ACCOUNT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const roleSelect = document.getElementById('role');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const previewName = document.getElementById('previewName');
    const previewEmail = document.getElementById('previewEmail');
    const previewRole = document.getElementById('previewRole');
    const previewInitial = document.getElementById('previewInitial');
    const idPreview = document.getElementById('id_number_preview');
    const previewIDNumber = document.getElementById('previewIDNumber');
    const accountForm = document.getElementById('accountForm');
    const alertContainer = document.getElementById('alertContainer');

    // ===== FUNCTIONS =====

    // Generate preview ID number based on role
    function getPreviewIDNumber(role) {
        if (role === 'Admin') {
            return 'PLSNHS-ADM-XXXXX';
        } else if (role === 'Registrar') {
            return 'PLSNHS-RGR-XXXXX';
        }
        return 'Will be auto-generated';
    }

    // Update ID preview
    function updateIDPreview() {
        const role = roleSelect.value;
        const idValue = getPreviewIDNumber(role);
        if (idPreview) {
            idPreview.value = idValue;
        }
        if (previewIDNumber) {
            previewIDNumber.textContent = idValue;
        }
    }

    // Update live preview
    function updatePreview() {
        const fullname = fullnameInput.value.trim() || 'New User';
        previewName.textContent = fullname;

        const initial = fullname.charAt(0).toUpperCase() || 'U';
        previewInitial.textContent = initial;
        // Add animation
        previewInitial.classList.remove('changed');
        void previewInitial.offsetWidth;
        previewInitial.classList.add('changed');

        const email = emailInput.value.trim() || 'user@plshs.edu.ph';
        previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const role = roleSelect.value;
        if (role) {
            const roleDisplay = role === 'Admin' ? 'Administrator' : 'Registrar';
            previewRole.textContent = roleDisplay;
            previewRole.className = 'preview-role-badge ' + role.toLowerCase();
        } else {
            previewRole.textContent = 'Select Role';
            previewRole.className = 'preview-role-badge';
        }

        updateIDPreview();
    }

    // Check password strength
    function checkPasswordStrength() {
        const password = passwordInput.value;
        let strength = 0;
        let strengthLabel = '';
        let strengthColor = '';

        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]+/)) strength += 1;
        if (password.match(/[A-Z]+/)) strength += 1;
        if (password.match(/[0-9]+/)) strength += 1;
        if (password.match(/[!@#$%^&*(),.?":{}|<>]+/)) strength += 1;

        if (password.length === 0) {
            strengthBar.style.width = '0';
            strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 8 characters with uppercase, lowercase, number & special character</span>';
            return;
        }

        if (strength <= 2) {
            strengthBar.style.width = '25%';
            strengthBar.style.backgroundColor = '#ef4444';
            strengthLabel = 'Weak';
            strengthColor = '#ef4444';
        } else if (strength <= 4) {
            strengthBar.style.width = '60%';
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
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (confirm.length === 0) {
            passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter your password</span>';
            passwordMatch.querySelector('span').className = '';
        } else if (password === confirm) {
            passwordMatch.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>';
        } else {
            passwordMatch.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>';
        }
    }

    // Toggle password visibility (global function)
    window.togglePassword = function() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.querySelector('.toggle-password i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleBtn.className = 'fas fa-eye';
        }
    };

    // Show alert messages
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        // Auto-hide after 5 seconds
        setTimeout(function() {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // ===== EVENT LISTENERS =====

    // Role change
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            updatePreview();
        });
    }

    // Fullname input
    if (fullnameInput) {
        fullnameInput.addEventListener('input', updatePreview);
    }

    // Email input
    if (emailInput) {
        emailInput.addEventListener('input', updatePreview);
    }

    // Password strength
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength();
            checkPasswordMatch();
        });
    }

    // Confirm password
    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }

    // ===== FORM VALIDATION =====

    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Collect values
            const fullname = fullnameInput.value.trim();
            const email = emailInput.value.trim();
            const role = roleSelect.value;
            const password = passwordInput.value;
            const confirm = confirmInput.value;

            // Validation
            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
            if (!role) errors.push('Role is required');

            // Password validation
            if (!password) {
                errors.push('Password is required');
            } else {
                let passwordErrors = [];
                if (password.length < 8) passwordErrors.push('at least 8 characters');
                if (!/[A-Z]/.test(password)) passwordErrors.push('at least one uppercase letter');
                if (!/[a-z]/.test(password)) passwordErrors.push('at least one lowercase letter');
                if (!/[0-9]/.test(password)) passwordErrors.push('at least one number');
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push('at least one special character');

                if (passwordErrors.length > 0) {
                    errors.push('Password must contain: ' + passwordErrors.join(', '));
                }
            }

            if (password !== confirm) {
                errors.push('Passwords do not match');
            }

            // Show errors or success
            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                // Simulate successful submission
                const idNumber = role === 'Admin' ? 'PLSNHS-ADM-00001' : 'PLSNHS-RGR-00001';
                showAlert('✅ Account created successfully! ID Number: ' + idNumber, 'success');
                // Reset form (optional)
                // accountForm.reset();
                // updatePreview();
            }
        });
    }

    // ===== INITIAL PREVIEW =====

    // Set initial ID preview
    updateIDPreview();

    // ===== AUTO-HIDE ALERTS ON LOAD (if any) =====

    // Check for any existing alerts and auto-hide
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);
});