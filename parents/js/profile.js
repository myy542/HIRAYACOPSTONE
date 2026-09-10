// ===== PROFILE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const uploadForm = document.getElementById('uploadForm');

    // Password Change Elements
    const changePasswordCheckbox = document.getElementById('changePasswordCheckbox');
    const passwordFields = document.getElementById('passwordFields');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const strengthFill = document.getElementById('passwordStrengthFill');
    const strengthText = document.getElementById('passwordStrengthText');
    const matchText = document.getElementById('passwordMatchText');
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    const twoFactorStatus = document.getElementById('twoFactorStatus');

    // ===== DATA =====

    const profileData = {
        name: 'Mr. & Mrs. Dela Cruz',
        email: 'parent@plshs.edu.ph',
        phone: '09123456789',
        address: '123 Main St., Brgy. San Juan, City of Naga, Cebu',
        since: '2026-01-01',
        children: [
            { name: 'Juan Dela Cruz', grade: 'Grade 11 - STEM A', status: 'Enrolled' },
            { name: 'Maria Dela Cruz', grade: 'Grade 9 - Section B', status: 'Pending' }
        ],
        lastLogin: 'June 23, 2026 10:30 AM'
    };

    const linkedChildren = [
        { id: 1, name: 'Juan Dela Cruz', grade: 'Grade 11 - STEM A', status: 'Enrolled' },
        { id: 2, name: 'Maria Dela Cruz', grade: 'Grade 9 - Section B', status: 'Pending' }
    ];

    // ===== FUNCTIONS =====

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

    // Calculate days active
    function calculateDaysActive(sinceDate) {
        const since = new Date(sinceDate);
        const today = new Date();
        const diffTime = Math.abs(today - since);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Update profile info
    function renderProfile() {
        const daysActive = calculateDaysActive(profileData.since);
        
        document.getElementById('profileName').textContent = profileData.name;
        document.getElementById('profileEmail').innerHTML = `
            ${profileData.email}
            <span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>
        `;
        document.getElementById('profilePhone').textContent = profileData.phone;
        document.getElementById('profileAddress').textContent = profileData.address;
        document.getElementById('profileSince').textContent = new Date(profileData.since).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
        document.getElementById('daysActive').textContent = daysActive;
        document.getElementById('childrenCount').textContent = profileData.children.length;
        document.getElementById('lastLogin').textContent = profileData.lastLogin;

        // Form values
        document.getElementById('fullname').value = profileData.name;
        document.getElementById('email').value = profileData.email;
        document.getElementById('phone').value = profileData.phone;
        document.getElementById('address').value = profileData.address;
    }

    // Render children summary
    function renderChildrenSummary() {
        const container = document.getElementById('childrenSummary');
        
        if (profileData.children.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px;">
                    <i class="fas fa-child"></i>
                    <p>No children linked to your account.</p>
                </div>
            `;
            return;
        }

        let html = '';
        profileData.children.forEach(child => {
            const statusClass = child.status.toLowerCase();
            html += `
                <div class="child-summary-item">
                    <span class="child-name">${child.name}</span>
                    <span class="child-status ${statusClass}">${child.status}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Render linked children
    function renderLinkedChildren() {
        const container = document.getElementById('linkedChildren');
        
        if (linkedChildren.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px;">
                    <i class="fas fa-users"></i>
                    <p>No children linked to your account.</p>
                </div>
            `;
            return;
        }

        let html = '';
        linkedChildren.forEach(child => {
            const initial = child.name.charAt(0).toUpperCase();
            const statusClass = child.status.toLowerCase();
            html += `
                <div class="linked-child-item">
                    <div class="child-info">
                        <div class="child-avatar-sm">${initial}</div>
                        <div>
                            <div class="child-name">${child.name}</div>
                            <div class="child-grade">${child.grade}</div>
                        </div>
                    </div>
                    <div class="child-actions">
                        <span class="child-status ${statusClass}" style="font-size: 11px; padding: 2px 10px; border-radius: 12px; background: ${child.status === 'Enrolled' ? '#d1fae5' : '#fef3c7'}; color: ${child.status === 'Enrolled' ? '#065f46' : '#92400e'};">
                            ${child.status}
                        </span>
                        <button class="btn-unlink" onclick="showAlert('Unlink child feature will be available soon.', 'success')">
                            <i class="fas fa-unlink"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ===== PASSWORD STRENGTH =====

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
        if (!newPassword) return;
        
        const password = newPassword.value;
        const validation = validatePassword(password);
        
        const reqLength = document.getElementById('req-length');
        const reqUpper = document.getElementById('req-upper');
        const reqLower = document.getElementById('req-lower');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');
        
        if (reqLength) {
            reqLength.className = validation.length ? 'valid' : '';
            reqLength.innerHTML = validation.length ? 
                '<i class="fas fa-check-circle"></i> At least 8 characters' : 
                '<i class="fas fa-circle"></i> At least 8 characters';
        }
        if (reqUpper) {
            reqUpper.className = validation.uppercase ? 'valid' : '';
            reqUpper.innerHTML = validation.uppercase ? 
                '<i class="fas fa-check-circle"></i> At least 1 uppercase letter (A-Z)' : 
                '<i class="fas fa-circle"></i> At least 1 uppercase letter (A-Z)';
        }
        if (reqLower) {
            reqLower.className = validation.lowercase ? 'valid' : '';
            reqLower.innerHTML = validation.lowercase ? 
                '<i class="fas fa-check-circle"></i> At least 1 lowercase letter (a-z)' : 
                '<i class="fas fa-circle"></i> At least 1 lowercase letter (a-z)';
        }
        if (reqNumber) {
            reqNumber.className = validation.number ? 'valid' : '';
            reqNumber.innerHTML = validation.number ? 
                '<i class="fas fa-check-circle"></i> At least 1 number (0-9)' : 
                '<i class="fas fa-circle"></i> At least 1 number (0-9)';
        }
        if (reqSpecial) {
            reqSpecial.className = validation.special ? 'valid' : '';
            reqSpecial.innerHTML = validation.special ? 
                '<i class="fas fa-check-circle"></i> At least 1 special character (!@#$%^&*)' : 
                '<i class="fas fa-circle"></i> At least 1 special character (!@#$%^&*)';
        }
        
        const validCount = Object.values(validation).filter(v => v === true).length;
        const strengthPercent = (validCount / 5) * 100;
        
        if (strengthFill) {
            strengthFill.style.width = strengthPercent + '%';
            if (strengthPercent <= 25) {
                strengthFill.style.backgroundColor = '#ef4444';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #ef4444;">Weak password</span>';
            } else if (strengthPercent <= 50) {
                strengthFill.style.backgroundColor = '#f59e0b';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #f59e0b;">Fair password</span>';
            } else if (strengthPercent <= 75) {
                strengthFill.style.backgroundColor = '#3b82f6';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #3b82f6;">Good password</span>';
            } else {
                strengthFill.style.backgroundColor = '#10b981';
                if (strengthText) strengthText.innerHTML = '<i class="fas fa-shield-alt"></i> <span style="color: #10b981;">Strong password</span>';
            }
        }
        
        checkPasswordMatch();
        
        const isStrong = Object.values(validation).every(v => v === true);
        const confirm = confirmPassword ? confirmPassword.value : '';
        const passwordsMatch = (password === confirm);
        
        if (changePasswordBtn) {
            changePasswordBtn.disabled = !(isStrong && passwordsMatch && password.length > 0);
        }
    }

    function checkPasswordMatch() {
        if (!newPassword || !confirmPassword) return;
        
        const password = newPassword.value;
        const confirm = confirmPassword.value;

        if (confirm.length === 0) {
            matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        } else if (password === confirm) {
            matchText.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981;">Passwords match</span>';
        } else {
            matchText.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i> <span style="color: #ef4444;">Passwords do not match</span>';
        }
        
        if (changePasswordBtn && newPassword.value.length > 0) {
            const validation = validatePassword(newPassword.value);
            const isStrong = Object.values(validation).every(v => v === true);
            changePasswordBtn.disabled = !(isStrong && password === confirm);
        }
    }

    function resetPasswordStrength() {
        if (strengthFill) strengthFill.style.width = '0%';
        if (strengthText) strengthText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Enter new password</span>';
        if (matchText) matchText.innerHTML = '<i class="fas fa-info-circle"></i> <span>Re-enter new password</span>';
        
        ['length', 'upper', 'lower', 'number', 'special'].forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                element.className = '';
                const texts = {
                    length: 'At least 8 characters',
                    upper: 'At least 1 uppercase letter (A-Z)',
                    lower: 'At least 1 lowercase letter (a-z)',
                    number: 'At least 1 number (0-9)',
                    special: 'At least 1 special character (!@#$%^&*)'
                };
                element.innerHTML = `<i class="fas fa-circle"></i> ${texts[req]}`;
            }
        });
    }

    // ===== PROFILE INITIALS & AVATAR SYNC =====

    function getParentInitials(name) {
        if (!name || typeof name !== 'string') return 'P';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function renderDefaultParentAvatar(name) {
        const currentName = name || (document.getElementById('fullname') ? document.getElementById('fullname').value : profileData.name);
        const initials = getParentInitials(currentName);

        const largeAvatar = document.querySelector('.profile-avatar-large');
        if (largeAvatar) {
            largeAvatar.innerHTML = `
                <div class="avatar-initial">${initials}</div>
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        const sidebarAvatar = document.querySelector('.parent-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <div class="avatar-initial">${initials}</div>
                <div class="online-dot"></div>
            `;
        }

        const modalPreview = document.getElementById('imagePreview');
        if (modalPreview) {
            modalPreview.innerHTML = `
                <div style="width: 150px; height: 150px; background: #1B2A4A; display: flex; align-items: center; justify-content: center; color: white; font-size: 52px; font-weight: bold; border-radius: 50%;">
                    ${initials}
                </div>
            `;
        }
    }

    function loadSavedParentProfile() {
        try {
            const savedName = localStorage.getItem('plsnhs_parent_name');
            if (savedName) {
                profileData.name = savedName;
                const fullnameInput = document.getElementById('fullname');
                if (fullnameInput) fullnameInput.value = savedName;
                const profileNameEl = document.getElementById('profileName');
                if (profileNameEl) profileNameEl.textContent = savedName;
                document.querySelectorAll('.parent-name').forEach(el => el.textContent = savedName);
            }
            const savedEmail = localStorage.getItem('plsnhs_parent_email');
            if (savedEmail) {
                profileData.email = savedEmail;
                const emailInput = document.getElementById('email');
                if (emailInput) emailInput.value = savedEmail;
            }
            const savedPhone = localStorage.getItem('plsnhs_parent_phone');
            if (savedPhone) {
                profileData.phone = savedPhone;
                const phoneInput = document.getElementById('phone');
                if (phoneInput) phoneInput.value = savedPhone;
            }
            const savedAddress = localStorage.getItem('plsnhs_parent_address');
            if (savedAddress) {
                profileData.address = savedAddress;
                const addressInput = document.getElementById('address');
                if (addressInput) addressInput.value = savedAddress;
            }

            const currentName = savedName || profileData.name;
            const savedAvatar = localStorage.getItem('plsnhs_parent_avatar');
            if (savedAvatar) {
                applyAvatarToDOM(savedAvatar);
            } else {
                renderDefaultParentAvatar(currentName);
            }
        } catch(e) {}
    }

    function applyAvatarToDOM(base64Image) {
        // Update large profile avatar
        const largeAvatar = document.querySelector('.profile-avatar-large');
        if (largeAvatar) {
            largeAvatar.innerHTML = `
                <img src="${base64Image}" alt="Profile Picture" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="avatar-overlay">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }

        // Update sidebar avatar
        const sidebarAvatar = document.querySelector('.parent-avatar');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <img src="${base64Image}" alt="Parent" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                <div class="online-dot"></div>
            `;
        }

        // Update modal preview
        const modalPreview = document.getElementById('imagePreview');
        if (modalPreview) {
            modalPreview.innerHTML = `<img src="${base64Image}" alt="Preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;">`;
        }
    }

    function removeAvatarFromDOM() {
        const currentName = (document.getElementById('fullname') ? document.getElementById('fullname').value : profileData.name);
        renderDefaultParentAvatar(currentName);
    }

    // ===== IMAGE MODAL =====

    window.openImageModal = function() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    };

    window.closeImageModal = function() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    };

    window.previewImage = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:150px;height:150px;border-radius:50%;object-fit:cover;">`;
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.removeProfilePic = function() {
        if (confirm('Remove your profile picture and restore default initials?')) {
            try {
                localStorage.removeItem('plsnhs_parent_avatar');
            } catch(e) {}
            removeAvatarFromDOM();
            showAlert('✅ Profile picture removed and dynamic initials restored.', 'success');
            closeImageModal();
        }
    };

    // Image upload form submit
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('profilePicture');
            if (!fileInput.files || fileInput.files.length === 0) {
                showAlert('Please select an image file to upload.', 'error');
                return;
            }

            const file = fileInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showAlert('File size exceeds 5MB limit. Please choose a smaller image.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Image = evt.target.result;
                try {
                    localStorage.setItem('plsnhs_parent_avatar', base64Image);
                } catch(err) {
                    console.warn('Avatar could not be saved to localStorage:', err);
                }
                applyAvatarToDOM(base64Image);
                showAlert('✅ Profile picture uploaded and updated successfully!', 'success');
                closeImageModal();
            };
            reader.readAsDataURL(file);
        });
    }

    // ===== PARENT DOCUMENTS MANAGEMENT =====

    const defaultParentDocs = [
        {
            id: 'pdoc_1',
            title: 'Unified Multi-Purpose ID (UMID)',
            type: 'Valid ID',
            filename: 'UMID_Guardian_ID.pdf',
            size: '1.1 MB',
            date: '2026-01-20',
            format: 'pdf',
            status: 'Verified',
            dataUrl: null
        },
        {
            id: 'pdoc_2',
            title: 'Barangay Certificate of Residency',
            type: 'Proof of Residency',
            filename: 'Barangay_Residency_Cert.jpg',
            size: '870 KB',
            date: '2026-02-10',
            format: 'img',
            status: 'Verified',
            dataUrl: null
        }
    ];

    let parentDocs = [];
    try {
        const savedPDocs = localStorage.getItem('plsnhs_parent_documents');
        if (savedPDocs) {
            parentDocs = JSON.parse(savedPDocs);
        } else {
            parentDocs = [...defaultParentDocs];
            localStorage.setItem('plsnhs_parent_documents', JSON.stringify(parentDocs));
        }
    } catch(e) {
        parentDocs = [...defaultParentDocs];
    }

    function persistParentDocs() {
        try {
            localStorage.setItem('plsnhs_parent_documents', JSON.stringify(parentDocs));
        } catch(e) {}
    }

    const parentDocDropZone = document.getElementById('parentDocDropZone');
    const parentDocFileInput = document.getElementById('parentDocFileInput');
    const parentDocUploadForm = document.getElementById('parentDocUploadForm');
    const parentDocSelectedName = document.getElementById('parentDocSelectedName');
    const parentDocTypeSelect = document.getElementById('parentDocTypeSelect');
    const parentDocCustomTitle = document.getElementById('parentDocCustomTitle');
    const parentDocCancelBtn = document.getElementById('parentDocCancelBtn');
    const parentDocSaveBtn = document.getElementById('parentDocSaveBtn');
    const parentDocList = document.getElementById('parentDocList');
    const parentDocCount = document.getElementById('parentDocCount');

    // Modal elements for doc preview
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const docPreviewContainer = document.getElementById('docPreviewContainer');
    const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');
    const dismissDocPreviewBtn = document.getElementById('dismissDocPreviewBtn');
    const docDownloadBtn = document.getElementById('docDownloadBtn');

    let currentPendingParentFile = null;

    if (parentDocDropZone && parentDocFileInput) {
        parentDocDropZone.addEventListener('click', () => parentDocFileInput.click());

        parentDocDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            parentDocDropZone.classList.add('dragover');
        });

        parentDocDropZone.addEventListener('dragleave', () => {
            parentDocDropZone.classList.remove('dragover');
        });

        parentDocDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            parentDocDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleParentFileSelected(e.dataTransfer.files[0]);
            }
        });

        parentDocFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleParentFileSelected(this.files[0]);
            }
        });
    }

    function handleParentFileSelected(file) {
        currentPendingParentFile = file;
        if (parentDocSelectedName) parentDocSelectedName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        if (parentDocCustomTitle) parentDocCustomTitle.value = file.name.replace(/\.[^/.]+$/, '');
        if (parentDocUploadForm) parentDocUploadForm.style.display = 'block';
    }

    if (parentDocCancelBtn) {
        parentDocCancelBtn.addEventListener('click', () => {
            currentPendingParentFile = null;
            if (parentDocFileInput) parentDocFileInput.value = '';
            if (parentDocUploadForm) parentDocUploadForm.style.display = 'none';
        });
    }

    if (parentDocSaveBtn) {
        parentDocSaveBtn.addEventListener('click', () => {
            if (!currentPendingParentFile) {
                showAlert('No document selected.', 'error');
                return;
            }

            const title = (parentDocCustomTitle && parentDocCustomTitle.value.trim()) || currentPendingParentFile.name;
            const type = (parentDocTypeSelect && parentDocTypeSelect.value) || 'Other';
            const sizeInMb = (currentPendingParentFile.size / (1024 * 1024)).toFixed(2);
            const sizeStr = currentPendingParentFile.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(currentPendingParentFile.size / 1024)} KB`;
            const isPdf = currentPendingParentFile.name.toLowerCase().endsWith('.pdf') || currentPendingParentFile.type === 'application/pdf';
            const format = isPdf ? 'pdf' : (currentPendingParentFile.type.startsWith('image/') ? 'img' : 'doc');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const dataUrl = evt.target.result;
                const newDoc = {
                    id: 'pdoc_' + Date.now(),
                    title: title,
                    type: type,
                    filename: currentPendingParentFile.name,
                    size: sizeStr,
                    date: new Date().toISOString().split('T')[0],
                    format: format,
                    status: 'Uploaded',
                    dataUrl: dataUrl
                };

                parentDocs.unshift(newDoc);
                persistParentDocs();
                renderParentDocs();

                currentPendingParentFile = null;
                if (parentDocFileInput) parentDocFileInput.value = '';
                if (parentDocUploadForm) parentDocUploadForm.style.display = 'none';

                showAlert(`✅ Verification document "${title}" uploaded to your profile!`, 'success');
            };
            reader.readAsDataURL(currentPendingParentFile);
        });
    }

    function renderParentDocs() {
        if (!parentDocList) return;

        if (parentDocCount) {
            parentDocCount.textContent = `${parentDocs.length} ${parentDocs.length === 1 ? 'File' : 'Files'}`;
        }

        if (parentDocs.length === 0) {
            parentDocList.innerHTML = `
                <div class="empty-docs-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No documents uploaded yet. Upload your guardian verification documents above.</p>
                </div>
            `;
            return;
        }

        let html = '';
        parentDocs.forEach(doc => {
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
                        <button type="button" class="doc-btn btn-view-pdoc" data-id="${doc.id}" title="Preview Document">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="doc-btn doc-btn-danger btn-delete-pdoc" data-id="${doc.id}" title="Delete Document">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        parentDocList.innerHTML = html;

        parentDocList.querySelectorAll('.btn-view-pdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                openParentDocPreview(id);
            });
        });

        parentDocList.querySelectorAll('.btn-delete-pdoc').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                deleteParentDoc(id);
            });
        });
    }

    function openParentDocPreview(id) {
        const doc = parentDocs.find(d => d.id === id);
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
                        <i class="fas fa-id-card-clip" style="font-size:48px;color:#1B2A4A;margin-bottom:12px;"></i>
                        <h4 style="font-size:16px;color:#0f172a;margin-bottom:6px;">${doc.title}</h4>
                        <p style="color:#64748b;font-size:13px;">${doc.filename} &bull; ${doc.type} &bull; ${doc.size}</p>
                        <span style="display:inline-block;margin-top:10px;background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Status: ${doc.status}</span>
                    </div>
                `;
            }
        }

        docPreviewModal.classList.add('show');
        docPreviewModal.style.display = 'flex';
    }

    function closeParentDocPreview() {
        if (docPreviewModal) {
            docPreviewModal.classList.remove('show');
            docPreviewModal.style.display = 'none';
        }
    }

    if (closeDocPreviewBtn) closeDocPreviewBtn.addEventListener('click', closeParentDocPreview);
    if (dismissDocPreviewBtn) dismissDocPreviewBtn.addEventListener('click', closeParentDocPreview);

    window.addEventListener('click', function(e) {
        if (e.target === docPreviewModal) {
            closeParentDocPreview();
        }
    });

    function deleteParentDoc(id) {
        const doc = parentDocs.find(d => d.id === id);
        if (!doc) return;
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
            parentDocs = parentDocs.filter(d => d.id !== id);
            persistParentDocs();
            renderParentDocs();
            showAlert('Document deleted from profile.', 'success');
        }
    }

    // ===== EVENT LISTENERS =====

    // Password change checkbox
    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            passwordFields.classList.toggle('show', isChecked);
            currentPassword.disabled = !isChecked;
            newPassword.disabled = !isChecked;
            confirmPassword.disabled = !isChecked;
            changePasswordBtn.disabled = !isChecked;
            
            if (!isChecked) {
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                resetPasswordStrength();
            } else {
                newPassword.focus();
            }
        });
    }

    if (newPassword) {
        newPassword.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }

    // Two Factor Toggle
    if (twoFactorToggle) {
        twoFactorToggle.addEventListener('change', function() {
            if (this.checked) {
                twoFactorStatus.textContent = 'Enabled';
                twoFactorStatus.className = 'security-status verified';
                showAlert('Two-Factor Authentication enabled successfully!', 'success');
            } else {
                twoFactorStatus.textContent = 'Disabled';
                twoFactorStatus.className = 'security-status unverified';
                showAlert('Two-Factor Authentication disabled.', 'error');
            }
        });
    }

    // ===== FORM SUBMITS =====

    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();

            let errors = [];

            if (!fullname) errors.push('Full name is required');
            if (!email) errors.push('Email address is required');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Invalid email format');
            }
            if (phone && !/^09\d{9}$/.test(phone)) {
                errors.push('Invalid Philippine mobile number. Format: 09XXXXXXXXX (11 digits)');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                profileData.name = fullname;
                profileData.email = email;
                profileData.phone = phone;
                profileData.address = address;

                try {
                    localStorage.setItem('plsnhs_parent_name', fullname);
                    localStorage.setItem('plsnhs_parent_email', email);
                    localStorage.setItem('plsnhs_parent_phone', phone);
                    localStorage.setItem('plsnhs_parent_address', address);
                } catch(e) {}

                document.getElementById('profileName').textContent = fullname;
                document.querySelectorAll('.parent-name').forEach(el => el.textContent = fullname);

                const savedAvatar = localStorage.getItem('plsnhs_parent_avatar');
                if (!savedAvatar) {
                    renderDefaultParentAvatar(fullname);
                }

                showAlert('✅ Profile updated successfully!', 'success');
            }
        });
    }

    // Live update initials as parent types name if no custom image is uploaded
    const fullnameInput = document.getElementById('fullname');
    if (fullnameInput) {
        fullnameInput.addEventListener('input', function() {
            const savedAvatar = localStorage.getItem('plsnhs_parent_avatar');
            if (!savedAvatar) {
                renderDefaultParentAvatar(this.value.trim() || 'Parent');
            }
        });
    }

    // Password form
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!changePasswordCheckbox.checked) {
                showAlert('Please check the "I want to change my password" checkbox.', 'error');
                return;
            }

            const current = currentPassword.value;
            const newPass = newPassword.value;
            const confirm = confirmPassword.value;
            let errors = [];

            if (!current) errors.push('Current password is required');
            if (!newPass) errors.push('New password is required');
            if (newPass && newPass.length < 8) errors.push('Password must be at least 8 characters');
            if (newPass !== confirm) errors.push('Passwords do not match');

            if (newPass) {
                const validation = validatePassword(newPass);
                const isStrong = Object.values(validation).every(v => v === true);
                if (!isStrong) errors.push('Password does not meet all requirements');
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Password changed successfully!', 'success');
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                resetPasswordStrength();
                changePasswordCheckbox.checked = false;
                passwordFields.classList.remove('show');
                currentPassword.disabled = true;
                newPassword.disabled = true;
                confirmPassword.disabled = true;
                changePasswordBtn.disabled = true;
            }
        });
    }

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('imageModal');
        if (e.target === modal) {
            closeImageModal();
        }
    });

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

    // ===== INIT =====

    renderProfile();
    renderChildrenSummary();
    renderLinkedChildren();
    loadSavedParentProfile();
    renderParentDocs();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});