/**
 * PLSNHS Login - Custom Login using 'users' table
 * Wala nag-gamit og Supabase Authentication
 * Nag-query sa 'users' table para sa email + password + role
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('🔐 Login page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheck = document.getElementById('remember');
    const loginBtn = document.getElementById('loginBtn');
    const alertContainer = document.getElementById('alertContainer');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const togglePasswordBtn = document.getElementById('togglePassword');

    let isRedirecting = false;

    // ============================================
    // PASSWORD TOGGLE (Mata)
    // ============================================

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
                console.log('👁️ Password visible');
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
                console.log('🔒 Password hidden');
            }
        });
        console.log('✅ Password toggle attached');
    } else {
        console.error('❌ Toggle password button not found!');
    }

    // ============================================
    // REDIRECT BASED ON ROLE
    // ============================================

    function redirectToDashboard(role) {
        if (isRedirecting) {
            console.log('⏭️ Already redirecting, skipping...');
            return;
        }
        isRedirecting = true;

        console.log('🔄 Redirecting with role:', role);

        const roleRoutes = {
            'admin': '../admin/dashboard.html',
            'teacher': '../teacher/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html',
            'principal': '../principal/dashboard.html',
            'guidance': '../guidance/dashboard.html'
        };

        const route = roleRoutes[role] || '../student/dashboard.html';

        console.log(`📍 Redirecting to: ${route} (role: ${role})`);

        window.location.replace(route);
    }

    // ============================================
    // AUTO-REDIRECT KUNG NAA NAY SESSION
    // ============================================

    const existingUser = localStorage.getItem('currentUser');
    if (existingUser) {
        try {
            const user = JSON.parse(existingUser);
            if (user && user.role) {
                console.log('✅ Existing session found:', user.email);
                redirectToDashboard(user.role);
                return;
            }
        } catch (e) {
            console.warn('⚠️ Invalid session, clearing...');
            localStorage.removeItem('currentUser');
        }
    }

    // ============================================
    // REMEMBER ME - GET COOKIE
    // ============================================

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    const savedEmail = getCookie('user_email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheck.checked = true;
    }

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </div>
        `;

        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    // ============================================
    // SHOW TOAST
    // ============================================

    function showToast(message, type = 'success') {
        const icon = toast.querySelector('i');
        toastMessage.textContent = message;

        if (type === 'error') {
            toast.style.background = '#e74c3c';
            icon.className = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            toast.style.background = '#f59e0b';
            icon.className = 'fas fa-exclamation-triangle';
        } else {
            toast.style.background = '#1a2a6c';
            icon.className = 'fas fa-check-circle';
        }

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // ============================================
    // LOGIN FORM SUBMIT - CUSTOM LOGIN
    // ============================================

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheck.checked;

        console.log('📝 Login attempt for:', email);

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            // ============================================
            // QUERY SA 'users' TABLE
            // ============================================

            console.log('🔍 Querying users table...');

            const { data, error } = await supabase
                .from('users')
                .select('id, email, password, role, first_name, last_name')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();

            if (error) {
                console.error('❌ Query error:', error);
                throw new Error('Database error: ' + error.message);
            }

            if (!data) {
                console.log('❌ No matching user found');
                throw new Error('Invalid email or password');
            }

            console.log('✅ User found:', data.email, '| Role:', data.role);

            // ============================================
            // STORE SESSION
            // ============================================

            const userRole = (data.role || 'student').toLowerCase();
            let firstName = data.first_name || '';
            let lastName = data.last_name || '';
            let fullName = `${firstName} ${lastName}`.trim() || data.email.split('@')[0];

            if (userRole === 'student') {
                if (!firstName || firstName.toLowerCase().includes('mylene') || data.email.toLowerCase().includes('mylene')) {
                    firstName = 'Student';
                    lastName = '';
                    fullName = 'Student';
                }
            }

            localStorage.setItem('currentUser', JSON.stringify({
                uid: data.id,
                email: data.email,
                role: userRole,
                firstName: firstName,
                lastName: lastName
            }));

            // Store portal-specific display names
            if (userRole === 'student') {
                localStorage.setItem('plsnhs_student_name', fullName);
            } else if (userRole === 'admin') {
                localStorage.setItem('plsnhs_admin_name', fullName);
            } else if (userRole === 'teacher') {
                localStorage.setItem('plsnhs_teacher_name', fullName);
            } else if (userRole === 'registrar') {
                localStorage.setItem('plsnhs_registrar_name', fullName);
            } else if (userRole === 'parent') {
                localStorage.setItem('plsnhs_parent_name', fullName);
            }

            showToast('✅ Login successful! Welcome back!', 'success');

            // ============================================
            // REMEMBER ME
            // ============================================

            if (remember) {
                document.cookie = `user_email=${email}; path=/; max-age=${60 * 60 * 24 * 30}`;
            } else {
                document.cookie = 'user_email=; path=/; max-age=0';
            }

            // ============================================
            // REDIRECT BASED ON ROLE
            // ============================================

            setTimeout(() => {
                redirectToDashboard(userRole);
            }, 800);

        } catch (error) {
            console.error('❌ Login error:', error);

            let errorMessage = 'Login failed. Please try again.';
            if (error.message.includes('Invalid email or password')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Database')) {
                errorMessage = 'Database error. Please try again later.';
            }

            showAlert('❌ ' + errorMessage, 'error');
            showToast('❌ ' + errorMessage, 'error');

            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
        }
    });

    // ============================================
    // FORGOT PASSWORD
    // ============================================

    const forgotLink = document.querySelector('.forgot-password a');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAlert('⚠️ Please contact the administrator to reset your password.', 'error');
        });
    }

    console.log('✅ Login ready');

})();