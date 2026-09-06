// ===== EDIT TEACHER JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const idNumberInput = document.getElementById('id_number');
    const phoneInput = document.getElementById('phone');
    const specializationInput = document.getElementById('specialization');
    const addressInput = document.getElementById('address');
    
    const previewName = document.getElementById('previewName');
    const previewEmail = document.getElementById('previewEmail');
    const previewInitial = document.getElementById('previewInitial');
    const previewId = document.getElementById('previewId');
    const previewSpecialization = document.getElementById('previewSpecialization');
    const previewPhone = document.getElementById('previewPhone');
    
    const teacherForm = document.getElementById('teacherForm');
    const alertContainer = document.getElementById('alertContainer');
    
    const changePasswordCheckbox = document.getElementById('changePassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const passwordFields = document.getElementById('passwordFields');

    // Teacher data (from PHP)
    const teacherData = {
        id: 1,
        name: 'Maria Santos',
        email: 'maria.santos@plshs.edu.ph'
    };

    // ===== FUNCTIONS =====

    // Update preview
    function updatePreview() {
        const fullname = fullnameInput.value.trim() || 'Teacher Name';
        previewName.textContent = fullname;
        
        const initial = fullname.charAt(0).toUpperCase() || 'T';
        previewInitial.textContent = initial;

        const email = emailInput.value.trim() || 'teacher@plshs.edu.ph';
        previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const idNumber = idNumberInput.value.trim() || 'N/A';
        previewId.textContent = idNumber;

        const specialization = specializationInput.value.trim() || 'Not set';
        previewSpecialization.textContent = specialization;

        const phone = phoneInput.value.trim() || 'N/A';
        previewPhone.textContent = phone;
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
    if (idNumberInput) idNumberInput.addEventListener('input', updatePreview);
    if (phoneInput) phoneInput.addEventListener('input', updatePreview);
    if (specializationInput) specializationInput.addEventListener('input', updatePreview);
    if (addressInput) addressInput.addEventListener('input', updatePreview);

    // Password change checkbox
    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            newPassword.disabled = !isChecked;
            confirmPassword.disabled = !isChecked;
            passwordFields.classList.toggle('show', isChecked);
            
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
            if (changePasswordCheckbox.checked) {
                checkPasswordStrength();
                checkPasswordMatch();
            }
        });
    }

    // Confirm password
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            if (changePasswordCheckbox.checked) {
                checkPasswordMatch();
            }
        });
    }

    // ===== FORM SUBMIT =====

    if (teacherForm) {
        teacherForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullname = fullnameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const specialization = specializationInput.value.trim();
            const address = addressInput.value.trim();

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }

            // Password validation if changing
            if (changePasswordCheckbox.checked) {
                const password = newPassword.value;
                const confirm = confirmPassword.value;

                if (!password) errors.push('New password is required');
                if (password && password.length < 6) errors.push('Password must be at least 6 characters');
                if (password !== confirm) errors.push('Passwords do not match');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Teacher information updated successfully!', 'success');
                updatePreview();
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