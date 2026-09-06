// ===== ADD TEACHER JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const specializationInput = document.getElementById('specialization');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const previewName = document.getElementById('previewName');
    const previewEmail = document.getElementById('previewEmail');
    const previewSpecialization = document.getElementById('previewSpecialization');
    const previewInitial = document.getElementById('previewInitial');
    const teacherForm = document.getElementById('teacherForm');
    const alertContainer = document.getElementById('alertContainer');

    // ===== FUNCTIONS =====

    // Update live preview
    function updatePreview() {
        const fullname = fullnameInput.value.trim() || 'New Teacher';
        previewName.textContent = fullname;
        
        const initial = fullname.charAt(0).toUpperCase() || 'T';
        previewInitial.textContent = initial;

        const email = emailInput.value.trim() || 'teacher@plshs.edu.ph';
        previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const specialization = specializationInput.value.trim() || 'Specialization not set';
        previewSpecialization.innerHTML = `<i class="fas fa-book"></i> ${specialization}`;
    }

    // Toggle password visibility
    window.togglePassword = function() {
        const passwordInput = document.getElementById('password');
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
        if (!passwordInput) return;
        
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
            if (strengthBar) strengthBar.style.width = '0';
            if (strengthText) {
                strengthText.innerHTML = `<i class="fas fa-info-circle"></i> <span>Minimum 8 characters with uppercase, lowercase, number & special character</span>`;
            }
            return;
        }

        if (strength <= 2) {
            if (strengthBar) {
                strengthBar.style.width = '25%';
                strengthBar.style.backgroundColor = '#ef4444';
            }
            strengthLabel = 'Weak';
            strengthColor = '#ef4444';
        } else if (strength <= 4) {
            if (strengthBar) {
                strengthBar.style.width = '60%';
                strengthBar.style.backgroundColor = '#f59e0b';
            }
            strengthLabel = 'Medium';
            strengthColor = '#f59e0b';
        } else {
            if (strengthBar) {
                strengthBar.style.width = '100%';
                strengthBar.style.backgroundColor = '#10b981';
            }
            strengthLabel = 'Strong';
            strengthColor = '#10b981';
        }

        if (strengthText) {
            strengthText.innerHTML = `<i class="fas fa-shield-alt"></i> <span style="color: ${strengthColor};">Password strength: ${strengthLabel}</span>`;
        }
    }

    // Check password match
    function checkPasswordMatch() {
        if (!passwordInput || !confirmInput || !passwordMatch) return;
        
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (confirm.length > 0) {
            if (password === confirm) {
                passwordMatch.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>`;
            } else {
                passwordMatch.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>`;
            }
        } else {
            passwordMatch.innerHTML = `<i class="fas fa-info-circle"></i> <span>Re-enter your password</span>`;
        }
    }

    // Show alert messages
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(function() {
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
    if (specializationInput) specializationInput.addEventListener('input', updatePreview);

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

    // ===== FORM SUBMIT =====

    if (teacherForm) {
        teacherForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullname = fullnameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            const phone = document.getElementById('phone').value.trim();
            const specialization = specializationInput.value.trim();

            let errors = [];

            // Validate fullname
            if (!fullname) errors.push('Full name is required');

            // Validate email
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }

            // Validate password strength
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

            // Check password match
            if (password !== confirm) {
                errors.push('Passwords do not match');
            }

            // Show errors or success
            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                const idNumber = 'PLSNHS-TCH-000001';
                showAlert('✅ Teacher added successfully! ID Number: ' + idNumber, 'success');
                
                // Reset form after success
                setTimeout(() => {
                    teacherForm.reset();
                    previewName.textContent = 'New Teacher';
                    previewInitial.textContent = 'T';
                    previewEmail.innerHTML = `<i class="fas fa-envelope"></i> teacher@plshs.edu.ph`;
                    previewSpecialization.innerHTML = `<i class="fas fa-book"></i> Specialization not set`;
                    if (strengthBar) strengthBar.style.width = '0';
                    if (strengthText) {
                        strengthText.innerHTML = `<i class="fas fa-info-circle"></i> <span>Minimum 8 characters with uppercase, lowercase, number & special character</span>`;
                    }
                    if (passwordMatch) {
                        passwordMatch.innerHTML = `<i class="fas fa-info-circle"></i> <span>Re-enter your password</span>`;
                    }
                }, 1500);
            }
        });
    }

    // ===== INITIAL PREVIEW =====

    updatePreview();

    // Auto-hide alerts after 5 seconds
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