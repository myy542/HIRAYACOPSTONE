// ===== EDIT TEACHER JAVASCRIPT (Supabase Dynamic Integration) =====

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

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

    // Get teacher ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    let currentTeacher = null;
    let currentUserId = null;

    // ===== FUNCTIONS =====

    // Update preview
    function updatePreview() {
        const fullname = (fullnameInput?.value.trim()) || 'Teacher Name';
        if (previewName) previewName.textContent = fullname;
        
        const initial = fullname.charAt(0).toUpperCase() || 'T';
        if (previewInitial) previewInitial.textContent = initial;

        const email = (emailInput?.value.trim()) || 'teacher@hiraya.edu.ph';
        if (previewEmail) previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${email}`;

        const idNumber = (idNumberInput?.value.trim()) || 'N/A';
        if (previewId) previewId.textContent = idNumber;

        const specialization = (specializationInput?.value.trim()) || 'Not set';
        if (previewSpecialization) previewSpecialization.innerHTML = `<i class="fas fa-book"></i> ${specialization}`;

        const phone = (phoneInput?.value.trim()) || 'N/A';
        if (previewPhone) previewPhone.innerHTML = `<i class="fas fa-phone"></i> ${phone}`;
    }

    // Toggle password visibility
    window.togglePassword = function() {
        const passInput = document.getElementById('newPassword');
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
        if (!newPassword) return;
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
            if (strengthBar) strengthBar.style.width = '0';
            if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 6 characters</span>';
            return;
        }

        if (strength <= 2) {
            if (strengthBar) {
                strengthBar.style.width = '30%';
                strengthBar.style.backgroundColor = '#ef4444';
            }
            strengthLabel = 'Weak';
            strengthColor = '#ef4444';
        } else if (strength <= 4) {
            if (strengthBar) {
                strengthBar.style.width = '65%';
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
        if (!newPassword || !confirmPassword || !passwordMatch) return;
        const password = newPassword.value;
        const confirm = confirmPassword.value;

        if (confirm.length > 0) {
            if (password === confirm) {
                passwordMatch.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>`;
            } else {
                passwordMatch.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>`;
            }
        } else {
            passwordMatch.innerHTML = `<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>`;
        }
    }

    // Show alert
    function showAlert(message, type = 'error') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // Load teacher data from Supabase
    async function loadTeacherData() {
        if (!teacherId) {
            showAlert('No teacher ID provided. Please select a teacher from the list.', 'error');
            return;
        }

        try {
            let tRow = null;
            let uRow = null;

            // Search in teachers table by id, user_id, or employee_id
            const { data: tById } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', teacherId)
                .maybeSingle();

            if (tById) {
                tRow = tById;
            } else {
                const { data: tByUserId } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('user_id', teacherId)
                    .maybeSingle();
                if (tByUserId) tRow = tByUserId;
            }

            if (tRow) {
                currentTeacher = tRow;
                currentUserId = tRow.user_id;

                if (tRow.user_id) {
                    const { data: userRecord } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', tRow.user_id)
                        .maybeSingle();
                    uRow = userRecord;
                }
            } else {
                // Check users table directly
                const { data: userRecord } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', teacherId)
                    .maybeSingle();
                if (userRecord) {
                    uRow = userRecord;
                    currentUserId = userRecord.id;
                }
            }

            if (!tRow && !uRow) {
                showAlert('Teacher record not found in database.', 'error');
                return;
            }

            // Populate form fields
            const fName = uRow 
                ? `${uRow.first_name || ''} ${uRow.last_name || ''}`.trim() || (uRow.full_name || uRow.name || '')
                : (tRow ? (tRow.fullname || tRow.name || '') : '');
            const email = uRow ? (uRow.email || '') : (tRow ? (tRow.email || '') : '');
            const idNum = (tRow && (tRow.employee_id || tRow.id_number)) || 'HES-TCH-000001';
            const phone = (tRow && tRow.phone) || (uRow && uRow.phone) || '';
            const spec = (tRow && (tRow.specialization || tRow.subject)) || '';
            const addr = (tRow && tRow.address) || (uRow && uRow.address) || '';

            if (fullnameInput) fullnameInput.value = fName;
            if (emailInput) emailInput.value = email;
            if (idNumberInput) idNumberInput.value = idNum;
            if (phoneInput) phoneInput.value = phone;
            if (specializationInput) specializationInput.value = spec;
            if (addressInput) addressInput.value = addr;

            updatePreview();
        } catch (err) {
            console.error('Error fetching teacher:', err);
            showAlert('Failed to load teacher information: ' + err.message, 'error');
        }
    }

    // Event listeners
    if (fullnameInput) fullnameInput.addEventListener('input', updatePreview);
    if (emailInput) emailInput.addEventListener('input', updatePreview);
    if (idNumberInput) idNumberInput.addEventListener('input', updatePreview);
    if (phoneInput) phoneInput.addEventListener('input', updatePreview);
    if (specializationInput) specializationInput.addEventListener('input', updatePreview);

    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            if (passwordFields) passwordFields.style.display = isChecked ? 'block' : 'none';
            if (newPassword) newPassword.disabled = !isChecked;
            if (confirmPassword) confirmPassword.disabled = !isChecked;
            if (!isChecked) {
                if (newPassword) newPassword.value = '';
                if (confirmPassword) confirmPassword.value = '';
                if (strengthBar) strengthBar.style.width = '0';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Minimum 6 characters</span>';
                if (passwordMatch) passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
            }
        });
    }

    if (newPassword) {
        newPassword.addEventListener('input', function() {
            checkPasswordStrength();
            checkPasswordMatch();
        });
    }

    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }

    // Form submission
    if (teacherForm) {
        teacherForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const fullname = fullnameInput?.value.trim();
            const email = emailInput?.value.trim().toLowerCase();
            const phone = phoneInput?.value.trim() || '';
            const specialization = specializationInput?.value.trim() || '';
            const address = addressInput?.value.trim() || '';
            const employeeId = idNumberInput?.value.trim() || '';

            if (!fullname) {
                showAlert('Full name is required.', 'error');
                return;
            }

            if (!email) {
                showAlert('Email address is required.', 'error');
                return;
            }

            const isChangePass = changePasswordCheckbox?.checked;
            const passVal = newPassword?.value;
            const confirmVal = confirmPassword?.value;

            if (isChangePass) {
                if (!passVal || passVal.length < 6) {
                    showAlert('New password must be at least 6 characters.', 'error');
                    return;
                }
                if (passVal !== confirmVal) {
                    showAlert('Passwords do not match.', 'error');
                    return;
                }
            }

            const submitBtn = teacherForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            try {
                const nameParts = fullname.split(' ');
                const firstName = nameParts[0] || fullname;
                const lastName = nameParts.slice(1).join(' ') || '';

                // Update users table
                if (currentUserId) {
                    const userPayload = {
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        updated_at: new Date().toISOString()
                    };
                    if (isChangePass && passVal) {
                        userPayload.password = passVal;
                    }

                    const { error: uErr } = await supabase
                        .from('users')
                        .update(userPayload)
                        .eq('id', currentUserId);

                    if (uErr) throw uErr;
                }

                // Update or insert teachers table
                if (currentTeacher && currentTeacher.id) {
                    const { error: tErr } = await supabase
                        .from('teachers')
                        .update({
                            employee_id: employeeId || currentTeacher.employee_id,
                            specialization: specialization,
                            phone: phone,
                            address: address,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentTeacher.id);

                    if (tErr) throw tErr;
                } else if (currentUserId) {
                    const { error: tInsErr } = await supabase
                        .from('teachers')
                        .insert([{
                            user_id: currentUserId,
                            employee_id: employeeId || `HES-TCH-${Math.floor(100000 + Math.random() * 900000)}`,
                            specialization: specialization,
                            phone: phone,
                            address: address
                        }]);

                    if (tInsErr) throw tInsErr;
                }

                showAlert(`✅ Teacher "${fullname}" updated successfully! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'teachers.html';
                }, 1400);

            } catch (err) {
                console.error('Error updating teacher:', err);
                showAlert('❌ ' + (err.message || 'Failed to update teacher.'), 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Teacher';
                }
            }
        });
    }

    // Initial load
    await loadTeacherData();
});