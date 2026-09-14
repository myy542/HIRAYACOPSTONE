// ===== ADD TEACHER JAVASCRIPT (Supabase Integration) =====

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

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
        const fullname = (fullnameInput?.value.trim()) || 'New Teacher';
        if (previewName) previewName.textContent = fullname;
        
        const initial = fullname.charAt(0).toUpperCase() || 'T';
        if (previewInitial) previewInitial.textContent = initial;

        const email = (emailInput?.value.trim()) || 'teacher@hiraya.edu.ph';
        if (previewEmail) previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const specialization = (specializationInput?.value.trim()) || 'Specialization not set';
        if (previewSpecialization) previewSpecialization.innerHTML = `<i class="fas fa-book"></i> ${specialization}`;
    }

    // Toggle password visibility
    window.togglePassword = function() {
        const passInput = document.getElementById('password');
        const toggleBtn = document.querySelector('.toggle-password i');
        
        if (passInput && toggleBtn) {
            if (passInput.type === 'password') {
                passInput.type = 'text';
                toggleBtn.className = 'fas fa-eye-slash';
            } else {
                passInput.type = 'password';
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
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(function() {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // ===== EVENT LISTENERS =====

    if (fullnameInput) fullnameInput.addEventListener('input', updatePreview);
    if (emailInput) emailInput.addEventListener('input', updatePreview);
    if (specializationInput) specializationInput.addEventListener('input', updatePreview);

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength();
            checkPasswordMatch();
        });
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }

    // ===== FORM SUBMIT =====

    if (teacherForm) {
        teacherForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const fullname = fullnameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            const phone = document.getElementById('phone')?.value.trim() || '';
            const specialization = specializationInput?.value.trim() || 'General';

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }

            if (!password) {
                errors.push('Password is required');
            } else if (password.length < 6) {
                errors.push('Password must be at least 6 characters');
            }

            if (password !== confirm) {
                errors.push('Passwords do not match');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
                return;
            }

            const submitBtn = teacherForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Teacher...';
            }

            try {
                // Check if user already exists
                const { data: existingUsers, error: checkErr } = await supabase
                    .from('users')
                    .select('id, email')
                    .ilike('email', email);

                if (checkErr) throw checkErr;

                if (existingUsers && existingUsers.length > 0) {
                    throw new Error('An account with this email address already exists.');
                }

                // Split name
                const nameParts = fullname.split(' ');
                const firstName = nameParts[0] || fullname;
                const lastName = nameParts.slice(1).join(' ') || '';

                // Insert into users table
                const { data: newUser, error: userErr } = await supabase
                    .from('users')
                    .insert([{
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        password: password,
                        role: 'teacher'
                    }])
                    .select()
                    .single();

                if (userErr) throw userErr;

                // Generate random unique employee ID
                const randomNum = Math.floor(100000 + Math.random() * 900000);
                const employeeId = `PLSNHS-TCH-${randomNum}`;

                // Insert into teachers table
                const { error: teacherErr } = await supabase
                    .from('teachers')
                    .insert([{
                        user_id: newUser.id,
                        employee_id: employeeId,
                        specialization: specialization,
                        phone: phone,
                        address: null
                    }]);

                if (teacherErr) throw teacherErr;

                showAlert(`✅ Teacher "${fullname}" added successfully!<br><strong>Assigned ID:</strong> ${employeeId}<br>Redirecting to Teachers list...`, 'success');

                setTimeout(() => {
                    window.location.href = 'teachers.html';
                }, 1500);

            } catch (err) {
                console.error('Error adding teacher:', err);
                showAlert('❌ ' + (err.message || 'Failed to add teacher.'), 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Teacher';
                }
            }
        });
    }

    updatePreview();
});