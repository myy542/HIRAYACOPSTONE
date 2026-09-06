/**
 * Edit Student - Interactive JavaScript
 */

(function() {
    'use strict';

    console.log('📝 Edit Student page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const firstname = document.getElementById('firstname');
    const middlename = document.getElementById('middlename');
    const lastname = document.getElementById('lastname');
    const email = document.getElementById('email');
    const birthdate = document.getElementById('birthdate');
    const gender = document.getElementById('gender');
    const previewName = document.getElementById('previewName');
    const previewInitial = document.getElementById('previewInitial');
    const previewEmail = document.getElementById('previewEmail');
    const alertContainer = document.getElementById('alertContainer');
    const form = document.getElementById('editStudentForm');
    const saveBtn = document.getElementById('saveBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // ============================================
    // SET ADMIN NAME
    // ============================================

    const storedName = localStorage.getItem('registrarName') || 'Registrar';
    if (adminName) adminName.textContent = storedName;
    if (adminInitial) adminInitial.textContent = storedName.charAt(0).toUpperCase();

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('registrarName');
            window.location.href = '../auth/login.html';
        });
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // ============================================
    // LIVE PREVIEW UPDATE
    // ============================================

    function updatePreview() {
        const first = firstname ? firstname.value.trim() : '';
        const middle = middlename ? middlename.value.trim() : '';
        const last = lastname ? lastname.value.trim() : '';
        const emailVal = email ? email.value.trim() : '';

        let fullName = first;
        if (middle) fullName += ' ' + middle + '.';
        if (last) fullName += ' ' + last;

        // Update preview name
        if (previewName) {
            previewName.textContent = fullName || 'Student Name';
        }

        // Update preview initial
        if (previewInitial) {
            previewInitial.textContent = fullName ? fullName.charAt(0).toUpperCase() : 'S';
        }

        // Update preview email
        if (previewEmail) {
            previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${emailVal || 'email@example.com'}`;
        }
    }

    // Add event listeners for live preview
    if (firstname) firstname.addEventListener('input', updatePreview);
    if (middlename) middlename.addEventListener('input', updatePreview);
    if (lastname) lastname.addEventListener('input', updatePreview);
    if (email) email.addEventListener('input', updatePreview);

    // ============================================
    // VALIDATION
    // ============================================

    function validateForm() {
        const errors = [];
        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // First name validation
        if (!firstname.value.trim()) {
            errors.push('First name is required');
            firstname.classList.add('error');
            isValid = false;
        }

        // Last name validation
        if (!lastname.value.trim()) {
            errors.push('Last name is required');
            lastname.classList.add('error');
            isValid = false;
        }

        // Birthdate validation
        if (!birthdate.value) {
            errors.push('Birthdate is required');
            birthdate.classList.add('error');
            isValid = false;
        } else {
            const birthDateObj = new Date(birthdate.value);
            const today = new Date();
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const m = today.getMonth() - birthDateObj.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }

            if (age < 15 || age > 30) {
                errors.push('Student must be between 15-30 years old');
                birthdate.classList.add('error');
                isValid = false;
            }
        }

        // Gender validation
        if (!gender.value) {
            errors.push('Gender is required');
            gender.classList.add('error');
            isValid = false;
        }

        // Email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            errors.push('Email address is required');
            email.classList.add('error');
            isValid = false;
        } else if (!emailPattern.test(email.value.trim())) {
            errors.push('Invalid email format');
            email.classList.add('error');
            isValid = false;
        }

        return { isValid, errors };
    }

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        alertContainer.appendChild(alertDiv);

        // Remove existing alerts
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const { isValid, errors } = validateForm();

            if (!isValid) {
                showAlert(errors.join('<br>'), 'error');
                return;
            }

            // Simulate loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Simulate AJAX request
            setTimeout(() => {
                // Get form data
                const formData = new FormData(form);
                const data = {
                    firstname: formData.get('firstname'),
                    middlename: formData.get('middlename'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    birthdate: formData.get('birthdate'),
                    gender: formData.get('gender')
                };

                console.log('📝 Student data saved:', data);

                // Reset button state
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';

                // Show success message
                showAlert('✅ Student information updated successfully!', 'success');

                // Redirect after a moment (simulated)
                setTimeout(() => {
                    // window.location.href = 'view_student.html?id=' + studentId;
                    // For demo, just stay on page
                }, 2000);

            }, 1500);
        });
    }

    // ============================================
    // STUDENT DATA (Sample - would come from URL param)
    // ============================================

    // Sample student data - in real app, this would come from URL
    const studentData = {
        id: 1,
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@plsnhs.edu.ph',
        initial: 'J',
        firstname: 'Juan',
        middlename: 'D',
        lastname: 'Dela Cruz',
        birthdate: '2008-05-15',
        gender: 'Male',
        id_number: '2024-0001'
    };

    // Populate form with student data
    function populateForm() {
        if (firstname) firstname.value = studentData.firstname || '';
        if (middlename) middlename.value = studentData.middlename || '';
        if (lastname) lastname.value = studentData.lastname || '';
        if (email) email.value = studentData.email || '';
        if (birthdate) birthdate.value = studentData.birthdate || '';
        if (gender) gender.value = studentData.gender || '';
        if (document.getElementById('id_number')) {
            document.getElementById('id_number').value = studentData.id_number || '';
        }

        // Update preview
        updatePreview();
    }

    populateForm();

    // ============================================
    // URL PARAMETER HANDLING
    // ============================================

    function getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    const studentId = getUrlParam('id');
    if (studentId) {
        console.log('📝 Editing student ID:', studentId);
        // In real app, fetch student data from server using this ID
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (form) form.dispatchEvent(new Event('submit'));
        }
    });

    console.log('✅ Edit Student ready!');
    console.log('💡 Press Ctrl+S to save changes');

})();