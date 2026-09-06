/**
 * PLSNHS Login - Firebase Integration
 */

import { auth, db } from '../../firebase/config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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

    // ============================================
    // PASSWORD TOGGLE
    // ============================================

    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // ============================================
    // CHECK IF ALREADY LOGGED IN
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('✅ User already logged in:', user.email);
            window.location.href = '../student/dashboard.html';
        }
    });

    // ============================================
    // CHECK REMEMBER ME COOKIE
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
    // LOGIN FORM SUBMIT - WALAY VALIDATION
    // ============================================

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheck.checked;

        // Disable button
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            // Diretso login sa Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            showToast('✅ Login successful! Welcome back!', 'success');
            
            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email
            }));

            // Set remember me cookie
            if (remember) {
                document.cookie = `user_email=${email}; path=/; max-age=${60 * 60 * 24 * 30}`;
            } else {
                document.cookie = 'user_email=; path=/; max-age=0';
            }

            // Redirect to student dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = '../student/dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            showAlert('❌ Login failed: ' + error.message, 'error');
            showToast('❌ Login failed. Please try again.', 'error');
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
        }
    });

    // ============================================
    // FORGOT PASSWORD
    // ============================================

    const forgotLink = document.querySelector('.forgot-password a');
    if (forgotLink) {
        forgotLink.addEventListener('click', async function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            
            if (!email) {
                showAlert('⚠️ Please enter your email address first.', 'error');
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                showToast('📧 Password reset email sent! Check your inbox.', 'success');
                showAlert('✅ Password reset email sent to ' + email, 'success');
            } catch (error) {
                console.error('Password reset error:', error);
                showAlert('❌ Error sending password reset: ' + error.message, 'error');
            }
        });
    }

    console.log('✅ Login ready!');

})();