// ===== DASHBOARD JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // ===== DATA =====

    // Sample dashboard data
    const dashboardData = {
        stats: {
            totalStudents: 245,
            totalTeachers: 32,
            totalSections: 18,
            totalSubjects: 45,
            totalEnrollments: 189,
            enrolledCount: 156,
            pendingCount: 33,
            profileUpdates: 27,
            adminActions: 42,
            accountApprovals: 19,
            enrollmentActions: 24,
            totalUsers: 278
        },
        notifications: [
            { id: 1, type: 'enrollment', title: 'New Enrollment', message: 'Juan Dela Cruz enrolled in Grade 10 - Section A', created_at: '2026-06-23 10:30:00', is_read: false },
            { id: 2, type: 'account', title: 'Account Approved', message: 'Teacher account for Maria Santos has been approved', created_at: '2026-06-23 09:15:00', is_read: false },
            { id: 3, type: 'action', title: 'Schedule Updated', message: 'Class schedule for Grade 10 has been updated', created_at: '2026-06-22 16:45:00', is_read: true },
            { id: 4, type: 'profile', title: 'Profile Updated', message: 'Ana Reyes updated their profile information', created_at: '2026-06-22 14:20:00', is_read: false },
            { id: 5, type: 'message', title: 'New Message', message: 'You have a new message from the Registrar', created_at: '2026-06-22 11:00:00', is_read: true }
        ],
        recentActivities: [
            { type: 'enrollment', description: 'New enrollment: Juan Dela Cruz enrolled in Grade 10', date: '2026-06-23 10:30:00' },
            { type: 'admin_action', description: 'Admin approved teacher account: Maria Santos', date: '2026-06-23 09:15:00' },
            { type: 'profile', description: 'Student Ana Reyes updated their profile', date: '2026-06-22 14:20:00' },
            { type: 'enrollment_approval', description: 'Enrollment approved: Carlos Mendoza', date: '2026-06-22 13:00:00' },
            { type: 'account_approval', description: 'Account approved: Elena Garcia (Teacher)', date: '2026-06-22 11:30:00' }
        ],
        recentEnrollments: [
            { fullname: 'Juan Dela Cruz', grade_name: 'Grade 10 - Section A', status: 'Enrolled', created_at: '2026-06-23 10:30:00' },
            { fullname: 'Maria Santos', grade_name: 'Grade 11 - STEM A', status: 'Pending', created_at: '2026-06-23 09:15:00' },
            { fullname: 'Carlos Mendoza', grade_name: 'Grade 12 - ABM A', status: 'Enrolled', created_at: '2026-06-22 13:00:00' },
            { fullname: 'Elena Garcia', grade_name: 'Grade 10 - Section B', status: 'Enrolled', created_at: '2026-06-22 11:30:00' }
        ],
        adminActions: [
            { fullname: 'Admin', role: 'Admin', profile_picture: null, title: 'Approved Teacher Account', message: 'Teacher account for Maria Santos has been approved', created_at: '2026-06-23 09:15:00' },
            { fullname: 'Registrar', role: 'Registrar', profile_picture: null, title: 'Updated Schedule', message: 'Class schedule for Grade 10 has been updated', created_at: '2026-06-22 16:45:00' }
        ],
        accountApprovals: [
            { fullname: 'Maria Santos', role: 'Teacher', profile_picture: null, title: 'Account Approved', message: 'Teacher account has been approved', created_at: '2026-06-23 09:15:00' },
            { fullname: 'Elena Garcia', role: 'Teacher', profile_picture: null, title: 'Account Approved', message: 'Teacher account has been approved', created_at: '2026-06-22 11:30:00' }
        ],
        enrollmentApprovals: [
            { fullname: 'Juan Dela Cruz', role: 'Student', profile_picture: null, title: 'Enrollment Approved', message: 'Student enrolled in Grade 10 - Section A', created_at: '2026-06-23 10:30:00' },
            { fullname: 'Carlos Mendoza', role: 'Student', profile_picture: null, title: 'Enrollment Approved', message: 'Student enrolled in Grade 12 - ABM A', created_at: '2026-06-22 13:00:00' }
        ],
        profileUpdates: [
            { fullname: 'Ana Reyes', role: 'Student', email: 'ana.reyes@plshs.edu.ph', profile_picture: null, title: 'Profile Picture Updated', message: 'Updated profile picture', created_at: '2026-06-22 14:20:00' },
            { fullname: 'Juan Dela Cruz', role: 'Student', email: 'juan.dela@plshs.edu.ph', profile_picture: null, title: 'Email Changed', message: 'Updated email address', created_at: '2026-06-21 10:00:00' }
        ],
        allUsers: [
            { fullname: 'Admin', email: 'admin@plshs.edu.ph', role: 'Admin', profile_picture: null, status: 'active', registered_date: '2026-01-01', notification_count: 45, last_activity: '2026-06-23 10:30:00' },
            { fullname: 'Maria Santos', email: 'maria.santos@plshs.edu.ph', role: 'Teacher', profile_picture: null, status: 'active', registered_date: '2026-06-15', notification_count: 12, last_activity: '2026-06-23 09:15:00' },
            { fullname: 'Juan Dela Cruz', email: 'juan.dela@plshs.edu.ph', role: 'Student', profile_picture: null, status: 'active', registered_date: '2026-06-10', notification_count: 8, last_activity: '2026-06-23 10:30:00' }
        ]
    };

    // ===== DOM ELEMENTS =====

    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notifCount = document.getElementById('notifCount');

    // ===== FUNCTIONS =====

    // Update stats
    function updateStats() {
        const stats = dashboardData.stats;
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalTeachers').textContent = stats.totalTeachers;
        document.getElementById('totalSections').textContent = stats.totalSections;
        document.getElementById('totalSubjects').textContent = stats.totalSubjects;
        document.getElementById('totalEnrollments').textContent = stats.totalEnrollments;
        document.getElementById('enrolledCount').textContent = stats.enrolledCount;
        document.getElementById('pendingCount').textContent = stats.pendingCount;
        document.getElementById('profileUpdates').textContent = stats.profileUpdates;
        document.getElementById('adminActions').textContent = stats.adminActions;
        document.getElementById('accountApprovals').textContent = stats.accountApprovals;
        document.getElementById('enrollmentActions').textContent = stats.enrollmentActions;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        
        document.getElementById('adminActionsCount').textContent = stats.adminActions + ' actions';
        document.getElementById('accountApprovalsCount').textContent = stats.accountApprovals + ' approvals';
        document.getElementById('enrollmentActionsCount').textContent = stats.enrollmentActions + ' actions';
        document.getElementById('profileUpdatesCount').textContent = stats.profileUpdates + ' updates';
        document.getElementById('usersCount').textContent = dashboardData.allUsers.length + ' users';
    }

    // Render notifications
    function renderNotifications() {
        const notifications = dashboardData.notifications;
        const unread = notifications.filter(n => !n.is_read).length;
        notifCount.textContent = unread;

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        const icons = {
            update: 'fa-megaphone',
            action: 'fa-check-circle',
            reminder: 'fa-clock',
            alert: 'fa-exclamation-triangle',
            message: 'fa-envelope',
            grade: 'fa-star',
            requirement: 'fa-file-upload',
            profile: 'fa-user-edit',
            enrollment: 'fa-graduation-cap',
            account: 'fa-user-plus'
        };

        let html = '';
        notifications.forEach(notif => {
            const icon = icons[notif.type] || 'fa-bell';
            const time = new Date(notif.created_at).toLocaleString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
            });
            
            html += `
                <div class="notif-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notif-icon notif-${notif.type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${notif.title}</div>
                        <div class="notif-message">${notif.message}</div>
                        <div class="notif-time">${time}</div>
                    </div>
                    ${!notif.is_read ? `<button class="mark-read-btn" data-id="${notif.id}"><i class="fas fa-check"></i></button>` : ''}
                </div>
            `;
        });

        notificationList.innerHTML = html;

        // Add event listeners for mark read buttons
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                markNotificationRead(id);
            });
        });
    }

    // Mark notification as read
    function markNotificationRead(id) {
        const notif = dashboardData.notifications.find(n => n.id == id);
        if (notif) {
            notif.is_read = true;
            renderNotifications();
            
            // Update unread count
            const unread = dashboardData.notifications.filter(n => !n.is_read).length;
            notifCount.textContent = unread;
        }
    }

    // Mark all notifications as read
    function markAllRead() {
        dashboardData.notifications.forEach(n => n.is_read = true);
        renderNotifications();
        notifCount.textContent = '0';
    }

    // Render recent activities
    function renderActivities() {
        const list = document.getElementById('activityList');
        const activities = dashboardData.recentActivities;

        if (activities.length === 0) {
            list.innerHTML = `
                <li class="activity-item">
                    <div class="activity-icon"><i class="fas fa-bell"></i></div>
                    <div class="activity-content">
                        <div class="activity-text">No recent activities</div>
                    </div>
                </li>
            `;
            return;
        }

        const icons = {
            enrollment: 'fa-user-graduate',
            requirement: 'fa-file-upload',
            profile: 'fa-user-edit',
            admin_action: 'fa-shield-alt',
            account_approval: 'fa-user-check',
            enrollment_approval: 'fa-file-signature',
            message: 'fa-envelope'
        };

        let html = '';
        activities.forEach(activity => {
            const icon = icons[activity.type] || 'fa-bell';
            const time = new Date(activity.date).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });
            
            html += `
                <li class="activity-item">
                    <div class="activity-icon"><i class="fas ${icon}"></i></div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.description}</div>
                        <div class="activity-time"><i class="far fa-clock"></i> ${time}</div>
                    </div>
                </li>
            `;
        });

        list.innerHTML = html;
    }

    // Render recent enrollments
    function renderEnrollments() {
        const list = document.getElementById('enrollmentList');
        const enrollments = dashboardData.recentEnrollments;

        if (enrollments.length === 0) {
            list.innerHTML = `
                <li class="enrollment-item">
                    <div class="enrollment-avatar">N</div>
                    <div class="enrollment-info">
                        <h4>No recent enrollments</h4>
                    </div>
                </li>
            `;
            return;
        }

        let html = '';
        enrollments.forEach(enrollment => {
            const initial = enrollment.fullname.charAt(0).toUpperCase();
            const time = new Date(enrollment.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            
            html += `
                <li class="enrollment-item">
                    <div class="enrollment-avatar">${initial}</div>
                    <div class="enrollment-info">
                        <h4>${enrollment.fullname}</h4>
                        <div class="enrollment-meta">
                            <span>${enrollment.grade_name}</span>
                            <span class="status-badge status-${enrollment.status.toLowerCase()}">${enrollment.status}</span>
                        </div>
                        <div class="enrollment-date"><i class="far fa-calendar-alt"></i> ${time}</div>
                    </div>
                </li>
            `;
        });

        list.innerHTML = html;
    }

    // Render admin actions table
    function renderAdminActions() {
        const tbody = document.getElementById('adminActionsBody');
        const actions = dashboardData.adminActions;

        if (actions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No admin actions recorded</p></td></tr>`;
            return;
        }

        let html = '';
        actions.forEach(action => {
            const initial = action.fullname.charAt(0).toUpperCase();
            const time = new Date(action.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-details">
                                <strong>${action.fullname}</strong>
                                <small>${action.role}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="action-badge"><i class="fas fa-check-circle"></i> ${action.title}</span></td>
                    <td>${action.message.substring(0, 80)}${action.message.length > 80 ? '...' : ''}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Render account approvals table
    function renderAccountApprovals() {
        const tbody = document.getElementById('accountApprovalsBody');
        const approvals = dashboardData.accountApprovals;

        if (approvals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No account approvals recorded</p></td></tr>`;
            return;
        }

        let html = '';
        approvals.forEach(approval => {
            const initial = approval.fullname.charAt(0).toUpperCase();
            const time = new Date(approval.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });
            const isApproved = approval.title.includes('Approved');

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-details">
                                <strong>${approval.fullname}</strong>
                                <small>${approval.role}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="approval-badge">
                            ${isApproved ? '<i class="fas fa-check-circle"></i> Approved' : '<i class="fas fa-times-circle"></i> Rejected'}
                        </span>
                    </td>
                    <td>${approval.message.substring(0, 80)}${approval.message.length > 80 ? '...' : ''}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Render enrollment approvals table
    function renderEnrollmentApprovals() {
        const tbody = document.getElementById('enrollmentApprovalsBody');
        const approvals = dashboardData.enrollmentApprovals;

        if (approvals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No enrollment actions recorded</p></td></tr>`;
            return;
        }

        let html = '';
        approvals.forEach(approval => {
            const initial = approval.fullname.charAt(0).toUpperCase();
            const time = new Date(approval.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });
            const isApproved = approval.title.includes('Approved');

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-details">
                                <strong>${approval.fullname}</strong>
                                <small>${approval.role}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="approval-badge">
                            ${isApproved ? '<i class="fas fa-check-circle"></i> Approved' : '<i class="fas fa-times-circle"></i> Rejected'}
                        </span>
                    </td>
                    <td>${approval.message.substring(0, 80)}${approval.message.length > 80 ? '...' : ''}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Render profile updates table
    function renderProfileUpdates() {
        const tbody = document.getElementById('profileUpdatesBody');
        const updates = dashboardData.profileUpdates;

        if (updates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No profile updates yet</p></td></tr>`;
            return;
        }

        let html = '';
        updates.forEach(update => {
            const initial = update.fullname.charAt(0).toUpperCase();
            const time = new Date(update.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });

            let updateType = '📝 Profile Update';
            if (update.title.includes('Email')) updateType = '📧 Email Change';
            else if (update.title.includes('Password')) updateType = '🔐 Password Change';
            else if (update.title.includes('Picture')) updateType = '🖼️ Profile Picture';

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-details">
                                <strong>${update.fullname}</strong>
                                <small>${update.email}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="role-badge role-${update.role.toLowerCase()}">${update.role}</span></td>
                    <td><span class="update-badge">${updateType}</span></td>
                    <td>${update.message.substring(0, 80)}${update.message.length > 80 ? '...' : ''}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Render all users table
    function renderUsers() {
        const tbody = document.getElementById('usersBody');
        const users = dashboardData.allUsers;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>No users found</p></td></tr>`;
            return;
        }

        let html = '';
        users.forEach(user => {
            const initial = user.fullname.charAt(0).toUpperCase();
            const registered = new Date(user.registered_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            const lastActivity = user.last_activity ? 
                new Date(user.last_activity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                'No activity';

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-details">
                                <strong>${user.fullname}</strong>
                                <small>${user.email}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
                    <td><span class="status-badge status-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
                    <td>${registered}</td>
                    <td><span class="notif-count-badge">${user.notification_count} notifications</span></td>
                    <td>${lastActivity}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Initialize Chart
    function initChart() {
        const ctx = document.getElementById('enrollmentChart').getContext('2d');
        
        // Sample data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const enrollments = [12, 19, 15, 22, 18, 25, 30, 28, 35, 32, 40, 45];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Enrollments',
                    data: enrollments,
                    backgroundColor: 'rgba(27, 42, 74, 0.8)',
                    borderColor: '#1B2A4A',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // ===== EVENT LISTENERS =====

    // Toggle notification dropdown
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.remove('show');
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllRead();
            notificationDropdown.classList.remove('show');
        });
    }

    // Chart period change
    document.getElementById('chartPeriod').addEventListener('change', function() {
        // In a real app, this would fetch new data
        console.log('Period changed to:', this.value);
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

    updateStats();
    renderNotifications();
    renderActivities();
    renderEnrollments();
    renderAdminActions();
    renderAccountApprovals();
    renderEnrollmentApprovals();
    renderProfileUpdates();
    renderUsers();
    initChart();
});