// ===== VIEW ACCOUNT JAVASCRIPT (SUPABASE POWERED) =====
import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const profileAvatar = document.querySelector('.profile-avatar-large .avatar-initial');
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountIdNumber = document.getElementById('accountIdNumber');
    const accountRegistered = document.getElementById('accountRegistered');
    const accountDaysActive = document.getElementById('accountDaysActive');
    const accountRoleBadge = document.getElementById('accountRoleBadge');
    const statsGrid = document.getElementById('statsGrid');
    const accountInfoGrid = document.getElementById('accountInfoGrid');
    const roleSpecificDetails = document.getElementById('roleSpecificDetails');
    const timeline = document.getElementById('timeline');

    // State
    let user = null;
    let currentUserSession = null;

    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) currentUserSession = JSON.parse(stored);
    } catch(e) {}

    // Alert helper
    function showAlert(message, type = 'error') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    function calculateDaysActive(createdAt) {
        if (!createdAt) return 1;
        const created = new Date(createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - created);
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function getRoleIcon(role) {
        const icons = {
            'admin': 'user-shield',
            'registrar': 'user-tie',
            'teacher': 'chalkboard-user',
            'student': 'user-graduate',
            'parent': 'user-group'
        };
        return icons[(role || '').toLowerCase()] || 'user';
    }

    // ===== MAIN LOAD FUNCTION =====
    async function init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let userId = urlParams.get('id');

            if (!userId) {
                const { data: firstUser } = await supabase.from('users').select('id').limit(1).maybeSingle();
                if (firstUser) userId = firstUser.id;
            }

            if (!userId) {
                showAlert('No account specified to view.', 'error');
                return;
            }

            // Fetch user
            const { data: userData, error: userErr } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userErr || !userData) throw new Error('User account not found.');
            user = userData;

            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
            const roleFormatted = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

            // Resolve ID Number
            let idNumber = null;
            let roleStats = {};

            const roleLower = (user.role || '').toLowerCase();
            if (roleLower === 'teacher') {
                const { data: teacherRec } = await supabase
                    .from('teachers')
                    .select('id, employee_id, specialization')
                    .eq('user_id', user.id)
                    .maybeSingle();

                idNumber = teacherRec?.employee_id || `HES-TCH-${user.id.substring(0, 5).toUpperCase()}`;

                // Fetch teacher's sections
                const { data: sections } = await supabase
                    .from('sections')
                    .select('*')
                    .or(`adviser_id.eq.${teacherRec?.id || 'none'},adviser_id.eq.${user.id}`);

                roleStats.sections = sections || [];
                roleStats.sections_count = (sections || []).length;
            } else if (roleLower === 'student') {
                const { data: studentRec } = await supabase
                    .from('students')
                    .select('*')
                    .eq('email', user.email)
                    .maybeSingle();

                idNumber = studentRec?.lrn || `HES-STU-${user.id.substring(0, 5).toUpperCase()}`;

                // Fetch enrollments & attendance
                const [enrollmentsRes, attendanceRes] = await Promise.all([
                    supabase.from('enrollments').select('*').eq('email', user.email),
                    studentRec ? supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', studentRec.id) : { count: 0 }
                ]);

                roleStats.enrollments = (enrollmentsRes.data || []).length;
                roleStats.attendance = attendanceRes.count || 0;
                roleStats.current_enrollment = (enrollmentsRes.data && enrollmentsRes.data.length > 0) ? enrollmentsRes.data[0] : null;
            } else if (roleLower === 'registrar') {
                idNumber = `HES-RGR-${user.id.substring(0, 5).toUpperCase()}`;
                const { count: enrollmentsProcessed } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Approved');
                roleStats.processed = enrollmentsProcessed || 0;
            } else {
                idNumber = `HES-ADM-${user.id.substring(0, 5).toUpperCase()}`;
                const [usersCount, enrollmentsCount] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('enrollments').select('*', { count: 'exact', head: true })
                ]);
                roleStats.total_users = usersCount.count || 0;
                roleStats.total_enrollments = enrollmentsCount.count || 0;
            }

            // Render UI
            renderProfile(fullName, roleFormatted, idNumber);
            renderStats(roleLower, roleStats);
            renderAccountInfo(fullName, roleFormatted, idNumber);
            renderRoleSpecific(roleLower, roleStats);
            renderTimeline();
        } catch (err) {
            console.error('Error viewing account:', err);
            showAlert('Failed to load account: ' + err.message, 'error');
        }
    }

    function renderProfile(fullName, roleFormatted, idNumber) {
        const initial = fullName.charAt(0).toUpperCase() || 'U';
        const daysActive = calculateDaysActive(user.created_at);
        const roleIcon = getRoleIcon(user.role);

        if (profileAvatar) profileAvatar.textContent = initial;
        if (accountName) accountName.textContent = fullName;
        if (accountEmail) accountEmail.textContent = user.email || '—';
        if (accountIdNumber) accountIdNumber.textContent = idNumber;
        if (accountRegistered) accountRegistered.textContent = formatDate(user.created_at);
        if (accountDaysActive) accountDaysActive.textContent = daysActive;

        if (accountRoleBadge) {
            accountRoleBadge.className = `role-badge role-${(user.role || '').toLowerCase()}`;
            accountRoleBadge.innerHTML = `<i class="fas fa-${roleIcon}"></i> ${roleFormatted}`;
        }

        const editBtn = document.querySelector('.btn-edit');
        if (editBtn) editBtn.href = `edit_account.html?id=${user.id}`;
    }

    function renderStats(roleLower, stats) {
        if (!statsGrid) return;
        let html = '';

        if (roleLower === 'student') {
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
                        <div class="stat-number">${stats.current_enrollment?.grade_level || 'Grade 11'}</div>
                        <div class="stat-label">Current Grade</div>
                    </div>
                </div>
            `;
        } else if (roleLower === 'teacher') {
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
                        <div class="stat-number">${stats.sections_count > 0 ? 'Active' : 'Faculty'}</div>
                        <div class="stat-label">Teaching Status</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">2026-2027</div>
                        <div class="stat-label">School Year</div>
                    </div>
                </div>
            `;
        } else if (roleLower === 'registrar') {
            html = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-file-signature"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.processed || 0}</div>
                        <div class="stat-label">Enrollments Approved</div>
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
                        <div class="stat-number">2026-2027</div>
                        <div class="stat-label">School Year</div>
                    </div>
                </div>
            `;
        } else {
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

        statsGrid.innerHTML = html;
    }

    function renderAccountInfo(fullName, roleFormatted, idNumber) {
        if (!accountInfoGrid) return;
        accountInfoGrid.innerHTML = `
            <div class="info-item">
                <div class="info-label">Account ID</div>
                <div class="info-value">${user.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value"><i class="fas fa-user"></i> ${fullName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value"><i class="fas fa-envelope"></i> ${user.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ID Number</div>
                <div class="info-value"><i class="fas fa-id-card"></i> ${idNumber}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Role</div>
                <div class="info-value"><i class="fas fa-user-tag"></i> ${roleFormatted}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Created</div>
                <div class="info-value"><i class="fas fa-calendar-alt"></i> ${formatDate(user.created_at)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Active / Approved
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Updated</div>
                <div class="info-value"><i class="fas fa-clock"></i> ${formatDate(user.updated_at || user.created_at)}</div>
            </div>
        `;
    }

    function renderRoleSpecific(roleLower, stats) {
        if (!roleSpecificDetails) return;
        let html = '';

        if (roleLower === 'student' && stats.current_enrollment) {
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
                            <div class="info-value"><i class="fas fa-layer-group"></i> ${enrollment.grade_level || 'Grade 11'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Strand</div>
                            <div class="info-value"><i class="fas fa-tag"></i> ${enrollment.strand || 'TVL-ICT'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${enrollment.status || 'Approved'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (roleLower === 'teacher' && stats.sections && stats.sections.length > 0) {
            let sectionsHtml = stats.sections.map(section => `
                <div class="section-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
                    <h4 style="color:#1B2A4A; margin-bottom:6px;"><i class="fas fa-users"></i> ${section.name}</h4>
                    <p style="color:#64748b; font-size:13px; margin-bottom:8px;"><i class="fas fa-layer-group"></i> ${section.grade_level}</p>
                    <a href="view_section.html?id=${section.id}" class="view-link" style="color:#1B2A4A; font-weight:600; text-decoration:none;">View Section <i class="fas fa-arrow-right"></i></a>
                </div>
            `).join('');

            html += `
                <div class="detail-card">
                    <div class="card-header">
                        <h3><i class="fas fa-layer-group"></i> Advisory Sections</h3>
                    </div>
                    <div class="sections-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px;">
                        ${sectionsHtml}
                    </div>
                </div>
            `;
        }

        roleSpecificDetails.innerHTML = html;
    }

    function renderTimeline() {
        if (!timeline || !user) return;
        timeline.innerHTML = `
            <li class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-user-plus"></i></div>
                <div class="timeline-content">
                    <div class="timeline-title">Account Created</div>
                    <div class="timeline-time"><i class="far fa-clock"></i> ${formatDate(user.created_at)}</div>
                </div>
            </li>
            <li class="timeline-item">
                <div class="timeline-icon"><i class="fas fa-check-circle"></i></div>
                <div class="timeline-content">
                    <div class="timeline-title">Account Verified & Active</div>
                    <div class="timeline-time"><i class="far fa-clock"></i> Status: Active in HES System</div>
                </div>
            </li>
        `;
    }

    window.deleteAccount = async function() {
        if (!user) return;

        if (currentUserSession && currentUserSession.email && currentUserSession.email.toLowerCase() === user.email.toLowerCase()) {
            showAlert('You cannot delete your own account!', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete account for ${user.first_name || ''} ${user.last_name || ''}? This action cannot be undone.`)) {
            return;
        }

        try {
            if (user.role === 'teacher') {
                await supabase.from('teachers').delete().eq('user_id', user.id);
            }

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            showAlert('✅ Account deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'manage_accounts.html';
            }, 1200);
        } catch (err) {
            console.error('Error deleting account:', err);
            showAlert('Failed to delete account: ' + err.message, 'error');
        }
    };

    await init();
});