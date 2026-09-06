/**
 * Forgot Password - Interactive JavaScript
 */

(function() {
    'use strict';

    console.log('🔑 Forgot Password page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const form = document.getElementById('forgotForm');
    const submitBtn = document.getElementById('submitBtn');
    const emailInput = document.getElementById('emailInput');
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.forgotData || {
        error: '',
        success: ''
    };

    // ============================================
    // SHOW ALERT FROM PHP
    // ============================================

    if (data.error) {
        showAlert(data.error, 'error');
    }

    if (data.success) {
        showAlert(data.success, 'success');
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const emailPattern = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

        // Validate email
        if (email === '') {
            showFieldError(emailInput, 'Please enter your email address');
            return;
        }

        if (!emailPattern.test(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            return;
        }

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.querySelector('i').className = 'fas fa-spinner';
        submitBtn.querySelector('span').textContent = 'Sending...';

        // Simulate AJAX request
        setTimeout(function() {
            // In real app, this would send to server
            showAlert('✅ If your email is registered and verified, you will receive a reset code.', 'success');

            // Reset button
            submitBtn.classList.remove('loading');
            submitBtn.querySelector('i').className = 'fas fa-paper-plane';
            submitBtn.querySelector('span').textContent = 'Send Reset Code';

            // Clear input
            emailInput.value = '';
            emailInput.className = '';

        }, 2000);
    });

    // ============================================
    // REAL-TIME EMAIL VALIDATION
    // ============================================

    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        const emailPattern = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

        // Remove existing error message
        const existingError = this.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        if (email !== '' && emailPattern.test(email)) {
            this.className = 'success';
        } else if (email !== '') {
            this.className = 'error';
        } else {
            this.className = '';
        }
    });

    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        const emailPattern = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

        if (email !== '' && !emailPattern.test(email)) {
            showFieldError(this, 'Please enter a valid email address');
        }
    });

    // ============================================
    // SHOW FIELD ERROR
    // ============================================

    function showFieldError(field, message) {
        field.className = 'error';

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'field-error';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message;
        field.parentElement.appendChild(errorMsg);

        setTimeout(() => {
            field.className = '';
            if (errorMsg) errorMsg.remove();
        }, 3000);
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
            <span>${message}</span>
        `;
        alertContainer.appendChild(alertDiv);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertDiv.style.transition = 'opacity 0.3s';
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    document.addEventListener('keydown', function(e) {
        // Escape key to clear form
        if (e.key === 'Escape') {
            emailInput.value = '';
            emailInput.className = '';
            const error = emailInput.parentElement.querySelector('.field-error');
            if (error) error.remove();
            emailInput.focus();
        }
    });

    console.log('✅ Forgot Password ready!');

})();