/**
 * Profile - Interactive JavaScript
 * No hardcoded data - all data comes from PHP via window.profileData
 */

(function() {
    'use strict';

    console.log('👤 Profile page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Profile elements
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileId = document.getElementById('profileId');
    const memberSince = document.getElementById('memberSince');
    const daysActive = document.getElementById('daysActive');
    const processedCount = document.getElementById('processedCount');
    const avatarInitial = document.getElementById('avatarInitial');

    // Performance
    const perfProcessed = document.getElementById('perfProcessed');
    const perfPending = document.getElementById('perfPending');
    const perfStudents = document.getElementById('perfStudents');
    const processingRateText = document.getElementById('processingRateText');
    const processingRateFill = document.getElementById('processingRateFill');

    // Edit form
    const editFullname = document.getElementById('editFullname');
    const editProfileForm = document.getElementById('editProfileForm');

    // Password form
    const changePasswordCheckbox = document.getElementById('changePasswordCheckbox');
    const passwordFields = document.getElementById('passwordFields');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordForm = document.getElementById('passwordForm');

    // Password strength elements
    const passwordStrengthFill = document.getElementById('passwordStrengthFill');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const passwordMatch = document.getElementById('passwordMatch');

    // Modal
    const imageModal = document.getElementById('imageModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const removePicBtn = document.getElementById('removePicBtn');
    const profilePicture = document.getElementById('profilePicture');
    const imagePreview = document.getElementById('imagePreview');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const uploadForm = document.getElementById('uploadForm');
    const profileAvatar = document.getElementById('profileAvatar');

    // Email verification
    const emailVerificationStatus = document.getElementById('emailVerificationStatus');
    const emailChangeSection = document.getElementById('emailChangeSection');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.profileData || {
        id: 0,
        fullname: 'Registrar',
        email: 'registrar@plsnhs.edu.ph',
        id_number: '',
        role: 'Registrar',
        email_verified: 0,
        created_at: new Date().toISOString(),
        profile_picture: '',
        pending_email: '',
        has_pending_email: false,
        stats: {
            days_active: 0,
            processed: 0,
            pending: 0,
            total_students: 0,
            processing_rate: 0
        }
    };

    // ============================================
    // SET REGISTRAR NAME (from session/localStorage)
    // ============================================

    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.displayName || (user.email ? user.email.split('@')[0] : 'Registrar'));
            if (adminName) adminName.textContent = name;
            if (adminInitial) adminInitial.textContent = name.charAt(0).toUpperCase();
        } else {
            const firstName = data.fullname ? data.fullname.split(' ')[0] : (localStorage.getItem('registrarName') || 'Registrar');
            if (adminName) adminName.textContent = firstName;
            if (adminInitial) adminInitial.textContent = firstName.charAt(0).toUpperCase();
        }
    } catch(e) {}

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Registrar logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('registrarName');
            localStorage.removeItem('plsnhs_registrar_avatar');
            localStorage.removeItem('plsnhs_registrar_name');
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // SET DATE
    // ============================================

    const dateBadge = document.getElementById('dateBadge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
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
    // LOAD PROFILE DATA
    // ============================================

    function loadProfileData() {
        // Profile info
        if (profileName) profileName.textContent = data.fullname;
        if (avatarInitial) avatarInitial.textContent = data.fullname.charAt(0);
        if (profileId) profileId.textContent = data.id_number || 'Not assigned';

        // Profile picture
        if (data.profile_picture) {
            const imgUrl = '../' + data.profile_picture + '?t=' + Date.now();
            if (avatarInitial) {
                avatarInitial.textContent = '';
                avatarInitial.style.backgroundImage = `url(${imgUrl})`;
                avatarInitial.style.backgroundSize = 'cover';
                avatarInitial.style.backgroundPosition = 'center';
            }
        }

        // Email
        if (profileEmail) {
            const verifiedBadge = data.email_verified == 1
                ? `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>`
                : `<span class="unverified-badge"><i class="fas fa-times-circle"></i> Unverified</span>`;
            profileEmail.innerHTML = `${data.email} ${verifiedBadge}`;
        }

        // Member since
        if (memberSince) {
            const date = new Date(data.created_at);
            memberSince.textContent = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }

        // Stats
        if (daysActive) daysActive.textContent = data.stats.days_active;
        if (processedCount) processedCount.textContent = data.stats.processed;

        // Edit form
        if (editFullname) editFullname.value = data.fullname;

        // Performance
        if (perfProcessed) perfProcessed.textContent = data.stats.processed;
        if (perfPending) perfPending.textContent = data.stats.pending;
        if (perfStudents) perfStudents.textContent = data.stats.total_students;
        if (processingRateText) processingRateText.textContent = data.stats.processing_rate + '%';
        if (processingRateFill) processingRateFill.style.width = data.stats.processing_rate + '%';

        // Email verification
        renderEmailVerification();
        renderEmailChange();
    }

    // ============================================
    // RENDER EMAIL VERIFICATION
    // ============================================

    function renderEmailVerification() {
        if (!emailVerificationStatus) return;

        if (data.email_verified == 1) {
            emailVerificationStatus.innerHTML = `
                <div class="verification-badge verified">
                    <i class="fas fa-check-circle"></i> Verified Email
                </div>
                <div class="verification-info">
                    <p><i class="fas fa-check-circle" style="color: #28a745;"></i> Your email address has been verified.</p>
                    <p style="margin-top: 10px;">This adds an extra layer of security to your account.</p>
                </div>
            `;
        } else {
            emailVerificationStatus.innerHTML = `
                <div class="verification-badge unverified">
                    <i class="fas fa-exclamation-triangle"></i> Email Not Verified
                </div>
                <div class="verification-info">
                    <p><i class="fas fa-info-circle"></i> Your email address has not been verified yet.</p>
                    <p style="margin-top: 10px;">Verifying your email helps secure your account and ensures you receive important notifications.</p>
                    <form method="POST" style="margin-top: 15px;">
                        <button type="submit" name="send_verification" class="btn-verify">
                            <i class="fas fa-paper-plane"></i> Verify Email Now
                        </button>
                    </form>
                </div>
            `;
        }
    }

    // ============================================
    // RENDER EMAIL CHANGE
    // ============================================

    function renderEmailChange() {
        if (!emailChangeSection) return;

        if (data.has_pending_email) {
            emailChangeSection.innerHTML = `
                <div class="pending-email-alert">
                    <i class="fas fa-clock"></i> 
                    <strong>Pending Email Change:</strong> Verification sent to <strong>${data.pending_email}</strong>
                    <p style="margin-top: 10px; font-size: 13px;">Please check your inbox and enter the verification code below to complete the email change.</p>
                </div>
                
                <form method="POST" class="email-change-form">
                    <div class="form-group">
                        <label>Verification Code</label>
                        <input type="text" name="verification_code" class="verify-code-input" placeholder="000000" maxlength="6" pattern="[0-9]{6}" required>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="submit" name="verify_new_email" class="btn-verify" style="background: #28a745;">
                            <i class="fas fa-check"></i> Verify & Change Email
                        </button>
                        <button type="submit" name="cancel_email_change" class="btn-verify" style="background: #dc3545;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            `;

            // Auto-format code input
            document.querySelectorAll('.verify-code-input').forEach(input => {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
                });
            });

        } else {
            emailChangeSection.innerHTML = `
                <form method="POST" class="email-change-form">
                    <div class="form-group">
                        <label>New Email Address</label>
                        <input type="email" name="new_email" placeholder="Enter your new email address" required>
                        <small style="color: #666; display: block; margin-top: 5px;">
                            <i class="fas fa-info-circle"></i> A verification code will be sent to the new email address for confirmation.
                        </small>
                    </div>
                    <button type="submit" name="send_email_verification" class="btn-verify">
                        <i class="fas fa-paper-plane"></i> Send Verification Code
                    </button>
                </form>
            `;
        }
    }

    // ============================================
    // EDIT PROFILE FORM
    // ============================================

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullname = editFullname.value.trim();

            if (!fullname) {
                showAlert('❌ Full name is required.', 'error');
                return;
            }

            // Submit form
            this.submit();
        });
    }

    // ============================================
    // PASSWORD CHANGE
    // ============================================

    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener('change', function() {
            if (this.checked) {
                passwordFields.classList.add('show');
                currentPassword.disabled = false;
                newPassword.disabled = false;
                confirmPassword.disabled = false;
                changePasswordBtn.disabled = false;
                newPassword.focus();
            } else {
                passwordFields.classList.remove('show');
                currentPassword.disabled = true;
                newPassword.disabled = true;
                confirmPassword.disabled = true;
                changePasswordBtn.disabled = true;
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                resetPasswordStrength();
            }
        });
    }

    function resetPasswordStrength() {
        if (passwordStrengthFill) passwordStrengthFill.style.width = '0%';
        if (passwordStrengthText) {
            passwordStrengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Enter new password</span>';
        }
        if (passwordMatch) {
            passwordMatch.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        }

        const requirements = ['length', 'upper', 'lower', 'number', 'special'];
        requirements.forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                element.classList.remove('valid');
                const text = element.innerText.replace(/[✓✔✅]/g, '').trim();
                element.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
            }
        });
    }

    function validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }

    function updatePasswordStrength() {
        const password = newPassword.value;
        const validation = validatePassword(password);

        // Update requirement list
        const reqMap = {
            length: 'At least 8 characters',
            upper: 'At least 1 uppercase letter (A-Z)',
            lower: 'At least 1 lowercase letter (a-z)',
            number: 'At least 1 number (0-9)',
            special: 'At least 1 special character (!@#$%^&*)'
        };

        Object.keys(reqMap).forEach(key => {
            const element = document.getElementById(`req-${key}`);
            if (element) {
                if (validation[key]) {
                    element.classList.add('valid');
                    element.innerHTML = `<i class="fas fa-check-circle"></i> ${reqMap[key]}`;
                } else {
                    element.classList.remove('valid');
                    element.innerHTML = `<i class="fas fa-circle"></i> ${reqMap[key]}`;
                }
            }
        });

        // Calculate strength
        const validCount = Object.values(validation).filter(v => v === true).length;
        const strengthPercent = (validCount / 5) * 100;

        if (passwordStrengthFill) {
            passwordStrengthFill.style.width = strengthPercent + '%';
            if (strengthPercent <= 25) {
                passwordStrengthFill.style.backgroundColor = '#ef4444';
                if (passwordStrengthText) {
                    passwordStrengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #ef4444;">Weak password</span>';
                }
            } else if (strengthPercent <= 50) {
                passwordStrengthFill.style.backgroundColor = '#f59e0b';
                if (passwordStrengthText) {
                    passwordStrengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #f59e0b;">Fair password</span>';
                }
            } else if (strengthPercent <= 75) {
                passwordStrengthFill.style.backgroundColor = '#3b82f6';
                if (passwordStrengthText) {
                    passwordStrengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #3b82f6;">Good password</span>';
                }
            } else {
                passwordStrengthFill.style.backgroundColor = '#10b981';
                if (passwordStrengthText) {
                    passwordStrengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #10b981;">Strong password</span>';
                }
            }
        }

        // Check match and update button
        checkPasswordMatch();
    }

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

        // Update button state
        if (changePasswordBtn && newPassword.value.length > 0) {
            const validation = validatePassword(newPassword.value);
            const isStrong = Object.values(validation).every(v => v === true);
            changePasswordBtn.disabled = !(isStrong && password === confirm && password.length > 0);
        }
    }

    if (newPassword) {
        newPassword.addEventListener('input', updatePasswordStrength);
    }

    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!changePasswordCheckbox.checked) {
                showAlert('❌ Please check "I want to change my password" first.', 'error');
                return;
            }

            const current = currentPassword.value.trim();
            const newPass = newPassword.value.trim();
            const confirm = confirmPassword.value.trim();

            if (!current) {
                showAlert('❌ Current password is required.', 'error');
                return;
            }

            if (!newPass || !confirm) {
                showAlert('❌ Please fill in all password fields.', 'error');
                return;
            }

            if (newPass !== confirm) {
                showAlert('❌ Passwords do not match.', 'error');
                return;
            }

            const validation = validatePassword(newPass);
            const isStrong = Object.values(validation).every(v => v === true);
            if (!isStrong) {
                showAlert('❌ Password does not meet requirements.', 'error');
                return;
            }

            // Submit form
            this.submit();
        });
    }

    // ============================================
    // IMAGE MODAL
    // ============================================

    function openImageModal() {
        if (imageModal) {
            imageModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeImageModal() {
        if (imageModal) {
            imageModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (profileAvatar) {
        profileAvatar.addEventListener('click', openImageModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeImageModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeImageModal);
    }

    // Close modal on outside click
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeImageModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal && imageModal.classList.contains('active')) {
            closeImageModal();
        }
    });

    // ============================================
    // PROFILE PICTURE UPLOAD & PERSISTENCE
    // ============================================

    function getRegistrarInitials(name) {
        if (!name || typeof name !== 'string') return 'R';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|engr\.?|atty\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function renderDefaultRegistrarAvatar(name) {
        const initials = getRegistrarInitials(name || 'Registrar');
        if (profileAvatar) {
            profileAvatar.innerHTML = `
                <div class="avatar-initial" id="avatarInitial">${initials}</div>
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        const sidebarAvatar = document.querySelector('.admin-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <div class="avatar-initial" id="adminInitial">${initials}</div>
                <div class="online-dot"></div>
            `;
        }

        if (imagePreview) {
            imagePreview.innerHTML = `<div class="preview-placeholder" id="previewPlaceholder">${initials}</div>`;
        }
    }

    function applyRegistrarAvatarToDOM(base64Image) {
        if (profileAvatar) {
            profileAvatar.innerHTML = `
                <img src="${base64Image}" alt="Profile Picture" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        const sidebarAvatar = document.querySelector('.admin-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <img src="${base64Image}" alt="Registrar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="online-dot"></div>
            `;
        }

        if (imagePreview) {
            imagePreview.innerHTML = `<img src="${base64Image}" alt="Profile Preview">`;
        }
    }

    function loadSavedRegistrarProfile() {
        try {
            const savedName = localStorage.getItem('plsnhs_registrar_name');
            if (savedName) {
                if (editFullname) editFullname.value = savedName;
                if (profileName) profileName.textContent = savedName;
                if (adminName) adminName.textContent = savedName.split(' ')[0];
            } else if (editFullname && data.fullname) {
                editFullname.value = data.fullname;
            }

            const currentName = savedName || data.fullname || 'Registrar';
            const savedAvatar = localStorage.getItem('plsnhs_registrar_avatar');
            if (savedAvatar) {
                applyRegistrarAvatarToDOM(savedAvatar);
            } else {
                renderDefaultRegistrarAvatar(currentName);
            }
        } catch(e) {}
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullnameInput = document.getElementById('editFullname');
            const fullname = fullnameInput ? fullnameInput.value.trim() : '';

            if (!fullname) {
                showAlert('Full name is required.', 'error');
                return;
            }

            try {
                localStorage.setItem('plsnhs_registrar_name', fullname);
            } catch(err) {}

            if (profileName) profileName.textContent = fullname;
            if (adminName) adminName.textContent = fullname.split(' ')[0];

            const savedAvatar = localStorage.getItem('plsnhs_registrar_avatar');
            if (!savedAvatar) {
                renderDefaultRegistrarAvatar(fullname);
            }

            showAlert('✅ Profile information updated successfully!', 'success');
        });
    }

    if (editFullname) {
        editFullname.addEventListener('input', function() {
            const savedAvatar = localStorage.getItem('plsnhs_registrar_avatar');
            if (!savedAvatar) {
                renderDefaultRegistrarAvatar(this.value.trim() || 'Registrar');
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!profilePicture || !profilePicture.files || profilePicture.files.length === 0) {
                showAlert('Please select an image file to upload.', 'error');
                return;
            }

            const file = profilePicture.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showAlert('File size exceeds 5MB limit.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Image = evt.target.result;
                try {
                    localStorage.setItem('plsnhs_registrar_avatar', base64Image);
                } catch(e) {}
                applyRegistrarAvatarToDOM(base64Image);
                showAlert('✅ Profile picture updated successfully!', 'success');
                closeImageModal();
            };
            reader.readAsDataURL(file);
        });
    }

    if (removePicBtn) {
        removePicBtn.addEventListener('click', function() {
            if (confirm('Remove your profile picture and restore your name initials?')) {
                try {
                    localStorage.removeItem('plsnhs_registrar_avatar');
                } catch(e) {}
                const currentName = localStorage.getItem('plsnhs_registrar_name') || (editFullname ? editFullname.value : 'Registrar');
                renderDefaultRegistrarAvatar(currentName);
                showAlert('✅ Profile picture removed. Initials restored.', 'success');
                closeImageModal();
            }
        });
    }

    // ============================================
    // REGISTRAR DOCUMENTS MANAGEMENT
    // ============================================

    const defaultRegistrarDocs = [
        {
            id: 'rdoc_1',
            title: 'DepEd Official Registrar Appointment Papers',
            type: 'Appointment',
            filename: 'DepEd_Registrar_Appointment_2026.pdf',
            size: '1.3 MB',
            date: '2026-06-01',
            format: 'pdf',
            status: 'Verified',
            dataUrl: null
        },
        {
            id: 'rdoc_2',
            title: 'Official Registrar E-Signature Specimen',
            type: 'E-Signature Specimen',
            filename: 'Registrar_Signature_Specimen.png',
            size: '420 KB',
            date: '2026-06-05',
            format: 'img',
            status: 'Verified',
            dataUrl: null
        }
    ];

    let registrarDocs = [];
    try {
        const savedRDocs = localStorage.getItem('plsnhs_registrar_documents');
        if (savedRDocs) {
            registrarDocs = JSON.parse(savedRDocs);
        } else {
            registrarDocs = [...defaultRegistrarDocs];
            localStorage.setItem('plsnhs_registrar_documents', JSON.stringify(registrarDocs));
        }
    } catch(e) {
        registrarDocs = [...defaultRegistrarDocs];
    }

    function persistRegistrarDocs() {
        try {
            localStorage.setItem('plsnhs_registrar_documents', JSON.stringify(registrarDocs));
        } catch(e) {}
    }

    const registrarDocDropZone = document.getElementById('registrarDocDropZone');
    const registrarDocFileInput = document.getElementById('registrarDocFileInput');
    const registrarDocUploadForm = document.getElementById('registrarDocUploadForm');
    const registrarDocSelectedName = document.getElementById('registrarDocSelectedName');
    const registrarDocTypeSelect = document.getElementById('registrarDocTypeSelect');
    const registrarDocCustomTitle = document.getElementById('registrarDocCustomTitle');
    const registrarDocCancelBtn = document.getElementById('registrarDocCancelBtn');
    const registrarDocSaveBtn = document.getElementById('registrarDocSaveBtn');
    const registrarDocList = document.getElementById('registrarDocList');
    const registrarDocCount = document.getElementById('registrarDocCount');

    // Modal
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const docPreviewContainer = document.getElementById('docPreviewContainer');
    const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');
    const dismissDocPreviewBtn = document.getElementById('dismissDocPreviewBtn');
    const docDownloadBtn = document.getElementById('docDownloadBtn');

    let currentPendingRegistrarFile = null;

    if (registrarDocDropZone && registrarDocFileInput) {
        registrarDocDropZone.addEventListener('click', () => registrarDocFileInput.click());

        registrarDocDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            registrarDocDropZone.classList.add('dragover');
        });

        registrarDocDropZone.addEventListener('dragleave', () => {
            registrarDocDropZone.classList.remove('dragover');
        });

        registrarDocDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            registrarDocDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleRegistrarFileSelected(e.dataTransfer.files[0]);
            }
        });

        registrarDocFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleRegistrarFileSelected(this.files[0]);
            }
        });
    }

    function handleRegistrarFileSelected(file) {
        currentPendingRegistrarFile = file;
        if (registrarDocSelectedName) registrarDocSelectedName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        if (registrarDocCustomTitle) registrarDocCustomTitle.value = file.name.replace(/\.[^/.]+$/, '');
        if (registrarDocUploadForm) registrarDocUploadForm.style.display = 'block';
    }

    if (registrarDocCancelBtn) {
        registrarDocCancelBtn.addEventListener('click', () => {
            currentPendingRegistrarFile = null;
            if (registrarDocFileInput) registrarDocFileInput.value = '';
            if (registrarDocUploadForm) registrarDocUploadForm.style.display = 'none';
        });
    }

    if (registrarDocSaveBtn) {
        registrarDocSaveBtn.addEventListener('click', () => {
            if (!currentPendingRegistrarFile) {
                showAlert('No document selected.', 'error');
                return;
            }

            const title = (registrarDocCustomTitle && registrarDocCustomTitle.value.trim()) || currentPendingRegistrarFile.name;
            const type = (registrarDocTypeSelect && registrarDocTypeSelect.value) || 'Other Document';
            const sizeInMb = (currentPendingRegistrarFile.size / (1024 * 1024)).toFixed(2);
            const sizeStr = currentPendingRegistrarFile.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(currentPendingRegistrarFile.size / 1024)} KB`;
            const isPdf = currentPendingRegistrarFile.name.toLowerCase().endsWith('.pdf') || currentPendingRegistrarFile.type === 'application/pdf';
            const format = isPdf ? 'pdf' : (currentPendingRegistrarFile.type.startsWith('image/') ? 'img' : 'doc');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataUrl = evt.target.result;
                const newDoc = {
                    id: 'rdoc_' + Date.now(),
                    title: title,
                    type: type,
                    filename: currentPendingRegistrarFile.name,
                    size: sizeStr,
                    date: new Date().toISOString().split('T')[0],
                    format: format,
                    status: 'Verified',
                    dataUrl: dataUrl
                };

                registrarDocs.unshift(newDoc);
                persistRegistrarDocs();
                renderRegistrarDocs();

                currentPendingRegistrarFile = null;
                if (registrarDocFileInput) registrarDocFileInput.value = '';
                if (registrarDocUploadForm) registrarDocUploadForm.style.display = 'none';

                showAlert(`✅ Official File "${title}" uploaded to your profile!`, 'success');
            };
            reader.readAsDataURL(currentPendingRegistrarFile);
        });
    }

    function renderRegistrarDocs() {
        if (!registrarDocList) return;

        if (registrarDocCount) {
            registrarDocCount.textContent = `${registrarDocs.length} ${registrarDocs.length === 1 ? 'File' : 'Files'}`;
        }

        if (registrarDocs.length === 0) {
            registrarDocList.innerHTML = `
                <div class="empty-docs-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No official files uploaded yet. Upload your credentials above.</p>
                </div>
            `;
            return;
        }

        let html = '';
        registrarDocs.forEach(doc => {
            const iconClass = doc.format === 'pdf' ? 'doc-icon-pdf fa-file-pdf' : (doc.format === 'img' ? 'doc-icon-img fa-file-image' : 'doc-icon-doc fa-file-alt');
            html += `
                <div class="doc-item" data-id="${doc.id}">
                    <div class="doc-item-left">
                        <div class="doc-item-icon ${doc.format === 'pdf' ? 'doc-icon-pdf' : (doc.format === 'img' ? 'doc-icon-img' : 'doc-icon-doc')}">
                            <i class="fas ${iconClass.split(' ')[1]}"></i>
                        </div>
                        <div class="doc-item-info">
                            <div class="doc-item-title" title="${doc.title}">${doc.title}</div>
                            <div class="doc-item-meta">
                                <span class="doc-category-pill">${doc.type}</span>
                                <span>${doc.size}</span>
                                <span>&bull;</span>
                                <span>${doc.date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="doc-item-actions">
                        <button type="button" class="doc-btn btn-view-rdoc" data-id="${doc.id}" title="Preview Document">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="doc-btn doc-btn-danger btn-delete-rdoc" data-id="${doc.id}" title="Delete Document">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        registrarDocList.innerHTML = html;

        registrarDocList.querySelectorAll('.btn-view-rdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                openRegistrarDocPreview(id);
            });
        });

        registrarDocList.querySelectorAll('.btn-delete-rdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                deleteRegistrarDoc(id);
            });
        });
    }

    function openRegistrarDocPreview(id) {
        const doc = registrarDocs.find(d => d.id === id);
        if (!doc || !docPreviewModal) return;

        if (docPreviewTitle) {
            docPreviewTitle.innerHTML = `<i class="fas fa-file-alt"></i> ${doc.title}`;
        }

        if (docDownloadBtn) {
            if (doc.dataUrl) {
                docDownloadBtn.href = doc.dataUrl;
                docDownloadBtn.download = doc.filename;
                docDownloadBtn.style.display = 'inline-flex';
            } else {
                docDownloadBtn.style.display = 'none';
            }
        }

        if (docPreviewContainer) {
            if (doc.format === 'img' && doc.dataUrl) {
                docPreviewContainer.innerHTML = `<img src="${doc.dataUrl}" alt="${doc.title}">`;
            } else if (doc.format === 'pdf' && doc.dataUrl) {
                docPreviewContainer.innerHTML = `
                    <iframe src="${doc.dataUrl}" style="width:100%;height:450px;border:none;border-radius:8px;"></iframe>
                `;
            } else {
                docPreviewContainer.innerHTML = `
                    <div style="padding:40px;text-align:center;">
                        <i class="fas fa-stamp" style="font-size:48px;color:var(--primary);margin-bottom:12px;"></i>
                        <h4 style="font-size:16px;color:#0f172a;margin-bottom:6px;">${doc.title}</h4>
                        <p style="color:#64748b;font-size:13px;">${doc.filename} &bull; ${doc.type} &bull; ${doc.size}</p>
                        <span style="display:inline-block;margin-top:10px;background:#e0e7ff;color:var(--primary);padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Status: ${doc.status}</span>
                    </div>
                `;
            }
        }

        docPreviewModal.classList.add('active');
        docPreviewModal.style.display = 'flex';
    }

    function closeRegistrarDocPreview() {
        if (docPreviewModal) {
            docPreviewModal.classList.remove('active');
            docPreviewModal.style.display = 'none';
        }
    }

    if (closeDocPreviewBtn) closeDocPreviewBtn.addEventListener('click', closeRegistrarDocPreview);
    if (dismissDocPreviewBtn) dismissDocPreviewBtn.addEventListener('click', closeRegistrarDocPreview);

    window.addEventListener('click', function(e) {
        if (e.target === docPreviewModal) {
            closeRegistrarDocPreview();
        }
    });

    function deleteRegistrarDoc(id) {
        const doc = registrarDocs.find(d => d.id === id);
        if (!doc) return;
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            registrarDocs = registrarDocs.filter(d => d.id !== id);
            persistRegistrarDocs();
            renderRegistrarDocs();
            showAlert('Document removed from profile.', 'success');
        }
    }

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;

        alertContainer.innerHTML = '';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // INITIALIZE
    // ============================================

    loadSavedRegistrarProfile();
    renderRegistrarDocs();

    console.log('✅ Profile ready!');
    console.log('👤 User:', data.fullname);

})();