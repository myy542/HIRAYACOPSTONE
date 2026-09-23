/**
 * Edit Student - Supabase Integrated
 * PLS NHS Registrar Portal
 */

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    console.log('📝 Edit Student page initializing with Supabase...');

    // DOM Elements
    const firstname = document.getElementById('firstname');
    const middlename = document.getElementById('middlename');
    const lastname = document.getElementById('lastname');
    const email = document.getElementById('email');
    const birthdate = document.getElementById('birthdate');
    const gender = document.getElementById('gender');
    const idNumber = document.getElementById('id_number');

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

    // Get student ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');

    let currentStudent = null;
    let currentUserId = null;

    // Set Registrar name
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.displayName || (user.email ? user.email.split('@')[0] : 'Registrar'));
            if (adminName) adminName.textContent = name;
            if (adminInitial) adminInitial.textContent = name.charAt(0).toUpperCase();
        }
    } catch(e) {}

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('registrarName');
            localStorage.removeItem('hes_registrar_avatar');
            localStorage.removeItem('hes_registrar_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // Mobile menu toggle
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Show Alert
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

    // Live preview update
    function updatePreview() {
        const first = firstname ? firstname.value.trim() : '';
        const middle = middlename ? middlename.value.trim() : '';
        const last = lastname ? lastname.value.trim() : '';
        const emailVal = email ? email.value.trim() : '';

        let fullName = first;
        if (middle) fullName += ' ' + middle + '.';
        if (last) fullName += ' ' + last;

        if (previewName) previewName.textContent = fullName || 'Student Name';
        if (previewInitial) previewInitial.textContent = (first || fullName) ? (first || fullName).charAt(0).toUpperCase() : 'S';
        if (previewEmail) previewEmail.innerHTML = `<i class="fas fa-envelope"></i> ${emailVal || 'email@example.com'}`;
    }

    if (firstname) firstname.addEventListener('input', updatePreview);
    if (middlename) middlename.addEventListener('input', updatePreview);
    if (lastname) lastname.addEventListener('input', updatePreview);
    if (email) email.addEventListener('input', updatePreview);

    // Load Student Data from Supabase
    async function loadStudentData() {
        if (!studentId) {
            showAlert('No student ID provided in URL.', 'error');
            return;
        }

        try {
            // First search in students table
            let sRow = null;
            let uRow = null;

            const { data: stData } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .maybeSingle();

            if (stData) {
                sRow = stData;
            } else {
                // Search in users table
                const { data: uData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', studentId)
                    .maybeSingle();
                if (uData) uRow = uData;
            }

            if (!sRow && !uRow) {
                showAlert('Student record not found.', 'error');
                return;
            }

            currentStudent = sRow;
            if (uRow) currentUserId = uRow.id;

            const fName = sRow ? (sRow.first_name || '') : (uRow ? (uRow.first_name || '') : '');
            const mName = sRow ? (sRow.middle_name || '') : '';
            const lName = sRow ? (sRow.last_name || '') : (uRow ? (uRow.last_name || '') : '');
            const emailVal = sRow ? (sRow.email || '') : (uRow ? (uRow.email || '') : '');
            const lrn = (sRow && sRow.lrn) || 'N/A';
            const bDate = sRow ? (sRow.date_of_birth || sRow.birth_date || '') : '';
            const gndr = sRow ? (sRow.gender || '') : '';

            if (firstname) firstname.value = fName;
            if (middlename) middlename.value = mName;
            if (lastname) lastname.value = lName;
            if (email) email.value = emailVal;
            if (idNumber) idNumber.value = lrn;
            if (birthdate && bDate) birthdate.value = bDate.split('T')[0];
            if (gender && gndr) gender.value = gndr;

            updatePreview();

        } catch (err) {
            console.error('Error loading student:', err);
            showAlert('Failed to load student data: ' + err.message, 'error');
        }
    }

    // Form Submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const fName = firstname?.value.trim();
            const mName = middlename?.value.trim();
            const lName = lastname?.value.trim();
            const emailVal = email?.value.trim().toLowerCase();
            const bDate = birthdate?.value || null;
            const gndr = gender?.value || null;

            if (!fName || !lName) {
                showAlert('First name and last name are required.', 'error');
                return;
            }

            if (!emailVal) {
                showAlert('Email address is required.', 'error');
                return;
            }

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            try {
                // Update students table
                if (currentStudent && currentStudent.id) {
                    const { error: sErr } = await supabase
                        .from('students')
                        .update({
                            first_name: fName,
                            middle_name: mName || null,
                            last_name: lName,
                            email: emailVal,
                            date_of_birth: bDate,
                            gender: gndr,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentStudent.id);

                    if (sErr) throw sErr;
                }

                // If user table row matches email or user_id, update it
                const { error: uErr } = await supabase
                    .from('users')
                    .update({
                        first_name: fName,
                        last_name: lName,
                        email: emailVal,
                        updated_at: new Date().toISOString()
                    })
                    .or(`email.eq.${emailVal},id.eq.${currentUserId || studentId}`);

                // Also update corresponding enrollment first_name & last_name
                await supabase
                    .from('enrollments')
                    .update({
                        first_name: fName,
                        last_name: lName,
                        email: emailVal,
                        updated_at: new Date().toISOString()
                    })
                    .or(`student_id.eq.${studentId},email.eq.${emailVal}`);

                // Notify other tabs in real-time
                localStorage.setItem('hes_student_updated', JSON.stringify({
                    id: studentId,
                    name: `${fName} ${lName}`.trim(),
                    timestamp: Date.now()
                }));

                showAlert('✅ Student information updated successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'students.html';
                }, 1200);

            } catch(err) {
                console.error('Error saving student:', err);
                showAlert('❌ ' + (err.message || 'Failed to update student.'), 'error');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                }
            }
        });
    }

    await loadStudentData();
});