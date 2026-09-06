// ===== VIEW ACCOUNT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');

    // ===== ACCOUNT DATA =====

    // Sample account data (from URL parameter in real app)
    const accountData = {
        id: 1,
        fullname: 'Juan Dela Cruz',
        email: 'juan.dela@plshs.edu.ph',
        id_number: 'PLSNHS-STU-000001',
        role: 'Student',
        status: 'approved',
        email_verified: 1,
        created_at: '2026-06-15 10:30:00',
        approved_at: '2026-06-16 08:00:00',
        profile_picture: null
    };

    // Role-specific stats
    const roleStats = {
        Student: {
            enrollments: 2,
            attendance: 45,
            current_enrollment: {
                grade_name: 'Grade 11',
                strand: 'STEM',
                school_year: '2026-2027',
                status: 'Enrolled',
                id: 1
            }
        },
        Teacher: {
            sections_count: 2,
            sections: [
                { id: 1, section_name: 'Grade 7 - Section A', grade_name: 'Grade 7' },
                { id: 2, section_name: 'Grade 10 - Section B', grade_name: 'Grade 10' }
            ]
        },
        Registrar: {
            processed: 156
        },
        Admin: {
            total_users: 278,
            total_enrollments: 189
        }
    };

    const currentUser = {
        id: 1 // Logged in user ID
    };

    // ===== FUNCTIONS =====

    // Calculate days active
    function calculateDaysActive(createdAt) {
        const created = new Date(createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - created);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    // Get role icon
    function getRoleIcon(role) {
        const icons = {
            'Admin': 'user-shield',
            'Registrar': 'user-tie',
            'Teacher': 'chalkboard-user',
            'Student': 'user-graduate'
        };
        return icons[role] || 'user';
    }

    // Get role color class
    function getRoleClass(role) {
        return `role-${role.toLowerCase()}`;
    }

    // Render profile
    function renderProfile() {
        const initial = accountData.fullname.charAt(0).toUpperCase();
        const daysActive = calculateDaysActive(accountData.created_at);
        const roleIcon = getRoleIcon(accountData.role);
        const roleClass = getRoleClass(accountData.role);

        document.querySelector('.profile-avatar-large .avatar-initial').textContent = initial;
        document.getElementById('accountName').textContent = accountData.fullname;
        document.getElementById('accountEmail').textContent = accountData.email;
        document.getElementById('accountIdNumber').textContent = accountData.id_number || 'Not assigned';
        document.getElementById('accountRegistered').textContent = formatDate(accountData.created_at);
        document.getElementById('accountDaysActive').textContent = daysActive;

        document.getElementById('accountRoleBadge').className = `role-badge ${roleClass}`;
        document.getElementById('accountRoleBadge').innerHTML = `
            <i class="fas fa-${roleIcon}"></i> ${accountData.role}
        `;

        // Update action buttons
        const editBtn = document.querySelector('.btn-edit');
        if (editBtn) {
            editBtn.href = `edit_account.html?id=${accountData.id}`;
        }
    }

    // Render stats
    function renderStats() {
        const stats = roleStats[accountData.role] || {};
        const grid = document.getElementById('statsGrid');
        
        let html = '';

        if (accountData.role === 'Student') {
            html = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-file-signature"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.enrollments || 0}</div>
                        <div class="stat-label">Total Enrollments</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.attendance || 0}</div>
                        <div class="stat-label">Attendance Records</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.current_enrollment?.grade_name || 'N/A'}</div>
                        <div class="stat-label">Current Grade</div>
                    </div>
                </div>
            `;
        } else if (accountData.role === 'Teacher') {
            html = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-layer-group"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.sections_count || 0}</div>
                        <div class="stat-label">Advisory Sections</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chalkboard-user"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.sections_count > 0 ? 'Active' : 'No Section'}</div>
                        <div class="stat-label">Teaching Status</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${new Date().getFullYear()}</div>
                        <div class="stat-label">Current Year</div>
                    </div>
                </div>
            `;
        } else if (accountData.role === 'Registrar') {
            html = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-file-signature"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.processed || 0}</div>
                        <div class="stat-label">Enrollments Processed</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">Active</div>
                        <div class="stat-label">Account Status</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${new Date().getFullYear()}</div>
                        <div class="stat-label">School Year</div>
                    </div>
                </div>
            `;
        } else if (accountData.role === 'Admin') {
            html = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total_users || 0}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-file-signature"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total_enrollments || 0}</div>
                        <div class="stat-label">Total Enrollments</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-shield-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">System</div>
                        <div class="stat-label">Administrator</div>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }

    // Render account info
    function renderAccountInfo() {
        const grid = document.getElementById('accountInfoGrid');
        const statusColor = accountData.status === 'approved' ? '#10b981' : 
                           accountData.status === 'pending' ? '#f59e0b' : '#ef4444';
        const statusIcon = accountData.status === 'approved' ? 'check-circle' : 
                          accountData.status === 'pending' ? 'clock' : 'times-circle';
        const verifiedColor = accountData.email_verified ? '#10b981' : '#ef4444';
        const verifiedIcon = accountData.email_verified ? 'check-circle' : 'times-circle';

        grid.innerHTML = `
            <div class="info-item">
                <div class="info-label">Account ID</div>
                <div class="info-value">${accountData.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value"><i class="fas fa-user"></i> ${accountData.fullname}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value"><i class="fas fa-envelope"></i> ${accountData.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ID Number</div>
                <div class="info-value"><i class="fas fa-id-card"></i> ${accountData.id_number || 'Not assigned'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Role</div>
                <div class="info-value"><i class="fas fa-user-tag"></i> ${accountData.role}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Created</div>
                <div class="info-value"><i class="fas fa-calendar-alt"></i> ${formatDate(accountData.created_at)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email Verified</div>
                <div class="info-value">
                    <i class="fas fa-${verifiedIcon}" style="color: ${verifiedColor};"></i>
                    ${accountData.email_verified ? 'Verified' : 'Not Verified'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                    <i class="fas fa-${statusIcon}" style="color: ${statusColor};"></i>
                    ${accountData.status.charAt(0).toUpperCase() + accountData.status.slice(1)}
                </div>
            </div>
        `;
    }

    // Render role-specific details
    function renderRoleSpecific() {
        const container = document.getElementById('roleSpecificDetails');
        const stats = roleStats[accountData.role] || {};
        let html = '';

        if (accountData.role === 'Student' && stats.current_enrollment) {
            const enrollment = stats.current_enrollment;
            html += `
                <div class="detail-card">
                    <div class="card-header">
                        <h3><i class="fas fa-graduation-cap"></i> Current Enrollment</h3>
                        <a href="view_enrollment.html?id=${enrollment.id}" class="view-link">View Details <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Grade Level</div>
                            <div class="info-value"><i class="fas fa-layer-group"></i> ${enrollment.grade_name}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Strand</div>
                            <div class="info-value"><i class="fas fa-tag"></i> ${enrollment.strand || 'Not Applicable'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">School Year</div>
                            <div class="info-value"><i class="fas fa-calendar-alt"></i> ${enrollment.school_year}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${enrollment.status}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (accountData.role === 'Teacher' && stats.sections && stats.sections.length > 0) {
            let sectionsHtml = stats.sections.map(section => `
                <div class="section-card">
                    <h4><i class="fas fa-users"></i> ${section.section_name}</h4>
                    <p><i class="fas fa-layer-group"></i> ${section.grade_name}</p>
                    <a href="view_section.html?id=${section.id}" class="view-link">View Section <i class="fas fa-arrow-right"></i></a>
                </div>
            `).join('');

            html += `
                <div class="detail-card">
                    <div class="card-header">
                        <h3><i class="fas fa-layer-group"></i> Advisory Sections</h3>
                    </div>
                    <div class="sections-grid">
                        ${sectionsHtml}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Render timeline
    function renderTimeline() {
        const timeline = document.getElementById('timeline');
        let html = `
            <li class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-user-plus"></i></div>
                <div class="timeline-content">
                    <div class="timeline-title">Account Created</div>
                    <div class="timeline-time"><i class="far fa-clock"></i> ${formatDate(accountData.created_at)}</div>
                </div>
            </li>
        `;

        if (accountData.email_verified) {
            html += `
                <li class="timeline-item">
                    <div class="timeline-icon"><i class="fas fa-envelope"></i></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Email Verified</div>
                        <div class="timeline-time"><i class="far fa-clock"></i> Email has been verified</div>
                    </div>
                </li>
            `;
        }

        if (accountData.status === 'approved' && accountData.approved_at) {
            html += `
                <li class="timeline-item">
                    <div class="timeline-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Account Approved</div>
                        <div class="timeline-time"><i class="far fa-clock"></i> ${formatDate(accountData.approved_at)}</div>
                    </div>
                </li>
            `;
        }

        timeline.innerHTML = html;
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

    // Delete account
    window.deleteAccount = function() {
        if (accountData.id === currentUser.id) {
            showAlert('You cannot delete your own account!', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            showAlert('✅ Account deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'manage_accounts.html';
            }, 1500);
        }
    };

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
    renderStats();
    renderAccountInfo();
    renderRoleSpecific();
    renderTimeline();
});