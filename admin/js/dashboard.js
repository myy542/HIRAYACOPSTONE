// ===== DASHBOARD JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ===== ROLE & SESSION GUARD =====
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        try {
            const user = JSON.parse(currentUserStr);
            if (user && user.role && user.role !== 'admin') {
                console.warn('⚠️ Non-admin session detected on admin dashboard. Redirecting...');
                const routes = {
                    'teacher': '../teacher/dashboard.html',
                    'student': '../student/dashboard.html',
                    'parent': '../parents/dashboard.html',
                    'registrar': '../registrar/dashboard.html'
                };
                window.location.replace(routes[user.role] || '../auth/login.html');
                return;
            }
        } catch(e) {}
    }

    // ===== DATA =====

    // Default notifications template
    const defaultNotifications = [
        { 
            id: 1, 
            type: 'enrollment', 
            title: 'New Student Enrollment', 
            message: 'Juan Dela Cruz submitted an online enrollment form for Grade 10 - Section A. Academic credentials and birth certificate were attached for verification.', 
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
            is_read: false,
            sender: 'Registrar Portal',
            actionType: 'Enrollment Approval',
            priority: 'High',
            actionUrl: 'enrollments.html',
            actionLabel: 'View Enrollment'
        },
        { 
            id: 2, 
            type: 'account', 
            title: 'New Faculty Account Request', 
            message: 'A new faculty account for Teacher Maria Santos (Mathematics Dept) was created and is currently awaiting administrator activation.', 
            created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(), 
            is_read: false,
            sender: 'Account Service',
            actionType: 'Account Management',
            priority: 'Medium',
            actionUrl: 'manage_accounts.html',
            actionLabel: 'Manage Accounts'
        },
        { 
            id: 3, 
            type: 'action', 
            title: 'Class Schedule Updated', 
            message: 'Class schedule for Grade 10 - Section A has been modified by the curriculum coordinator. 4 time slots were adjusted.', 
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), 
            is_read: true,
            sender: 'Curriculum Office',
            actionType: 'Schedule Adjustment',
            priority: 'Normal',
            actionUrl: 'sections.html',
            actionLabel: 'View Sections'
        },
        { 
            id: 4, 
            type: 'profile', 
            title: 'Student Profile Updated', 
            message: 'Student Ana Reyes (LRN: 109876543204) updated contact details and emergency guardian telephone numbers.', 
            created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), 
            is_read: false,
            sender: 'Student Portal',
            actionType: 'Profile Change',
            priority: 'Low',
            actionUrl: 'student.html',
            actionLabel: 'View Students'
        },
        { 
            id: 5, 
            type: 'message', 
            title: 'Attendance Advisory', 
            message: 'Daily attendance reports for Junior High School (Grades 7 to 10) have been compiled. Current school-wide attendance is 94.2%.', 
            created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), 
            is_read: true,
            sender: 'Attendance System',
            actionType: 'System Advisory',
            priority: 'Normal',
            actionUrl: 'attendance.html',
            actionLabel: 'View Attendance'
        }
    ];

    let initialNotifications = [...defaultNotifications];
    try {
        const storedNotifs = localStorage.getItem('plsnhs_admin_notifications');
        if (storedNotifs) {
            initialNotifications = JSON.parse(storedNotifs);
        } else {
            localStorage.setItem('plsnhs_admin_notifications', JSON.stringify(defaultNotifications));
        }
    } catch (e) {
        initialNotifications = [...defaultNotifications];
    }

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
        notifications: initialNotifications,
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

    function persistNotifications() {
        try {
            localStorage.setItem('plsnhs_admin_notifications', JSON.stringify(dashboardData.notifications));
        } catch(e) {
            console.error('Error saving notifications to localStorage:', e);
        }
    }

    // ===== DOM ELEMENTS =====

    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notifCount = document.getElementById('notifCount');
    const unreadPill = document.getElementById('unreadPill');
    const triggerSimulatedNotifBtn = document.getElementById('triggerSimulatedNotifBtn');
    const clearAllNotifsBtn = document.getElementById('clearAllNotifsBtn');

    // Modal elements
    const notificationDetailModal = document.getElementById('notificationDetailModal');
    const closeNotifModalBtn = document.getElementById('closeNotifModalBtn');
    const dismissNotifModalBtn = document.getElementById('dismissNotifModalBtn');
    const modalNotifIcon = document.getElementById('modalNotifIcon');
    const modalNotifCategory = document.getElementById('modalNotifCategory');
    const modalNotifTitle = document.getElementById('modalNotifTitle');
    const modalNotifTime = document.getElementById('modalNotifTime');
    const modalNotifStatusBadge = document.getElementById('modalNotifStatusBadge');
    const modalNotifMessage = document.getElementById('modalNotifMessage');
    const modalNotifSender = document.getElementById('modalNotifSender');
    const modalNotifActionType = document.getElementById('modalNotifActionType');
    const modalNotifPriority = document.getElementById('modalNotifPriority');
    const modalNotifSystemId = document.getElementById('modalNotifSystemId');
    const modalNotifActionLink = document.getElementById('modalNotifActionLink');

    let currentNotifFilter = 'all';

    // Format relative time helper
    function getRelativeTimeString(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (isNaN(diffMins) || diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Update stats
    function updateStats() {
        const stats = dashboardData.stats;
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('totalStudents', stats.totalStudents);
        setTxt('totalTeachers', stats.totalTeachers);
        setTxt('totalSections', stats.totalSections);
        setTxt('totalSubjects', stats.totalSubjects);
        setTxt('totalEnrollments', stats.totalEnrollments);
        setTxt('enrolledCount', stats.enrolledCount);
        setTxt('pendingCount', stats.pendingCount);
        setTxt('profileUpdates', stats.profileUpdates);
        setTxt('adminActions', stats.adminActions);
        setTxt('accountApprovals', stats.accountApprovals);
        setTxt('enrollmentActions', stats.enrollmentActions);
        setTxt('totalUsers', stats.totalUsers);
        
        setTxt('adminActionsCount', stats.adminActions + ' actions');
        setTxt('accountApprovalsCount', stats.accountApprovals + ' approvals');
        setTxt('enrollmentActionsCount', stats.enrollmentActions + ' actions');
        setTxt('profileUpdatesCount', stats.profileUpdates + ' updates');
        setTxt('usersCount', dashboardData.allUsers.length + ' users');
    }

    // Render notifications
    function renderNotifications() {
        if (!notificationList) return;

        const notifications = dashboardData.notifications || [];
        const unreadCount = notifications.filter(n => !n.is_read).length;

        // Update badge counters
        if (notifCount) {
            notifCount.textContent = unreadCount;
            notifCount.classList.toggle('empty', unreadCount === 0);
        }
        if (unreadPill) {
            unreadPill.textContent = `${unreadCount} New`;
            unreadPill.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }

        let displayNotifs = [...notifications];
        if (currentNotifFilter === 'unread') {
            displayNotifs = displayNotifs.filter(n => !n.is_read);
        }

        if (displayNotifs.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>${currentNotifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
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
        displayNotifs.forEach(notif => {
            const icon = icons[notif.type] || 'fa-bell';
            const timeAgo = getRelativeTimeString(notif.created_at);
            
            html += `
                <div class="notif-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notif-icon notif-${notif.type || 'message'}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">
                            <span>${notif.title}</span>
                            <span class="notif-time">${timeAgo}</span>
                        </div>
                        <div class="notif-message">${notif.message}</div>
                    </div>
                    <div class="notif-item-actions">
                        ${!notif.is_read ? `
                            <button type="button" class="mark-read-btn" data-id="${notif.id}" title="Mark as read">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        notificationList.innerHTML = html;

        // Click on entire notification item to OPEN DETAIL MODAL
        notificationList.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.mark-read-btn')) return;
                const id = this.dataset.id;
                openNotificationDetailModal(id);
            });
        });

        // Click on checkmark button
        notificationList.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                markNotificationRead(id);
            });
        });
    }

    // Open Notification Detail Modal
    function openNotificationDetailModal(id) {
        const notif = dashboardData.notifications.find(n => n.id == id);
        if (!notif) return;

        // Mark as read automatically when opened
        notif.is_read = true;
        persistNotifications();
        renderNotifications();

        // Close dropdown
        if (notificationDropdown) notificationDropdown.classList.remove('show');

        // Populate modal
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

        const iconClass = icons[notif.type] || 'fa-bell';
        if (modalNotifIcon) modalNotifIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        if (modalNotifCategory) modalNotifCategory.textContent = (notif.type || 'System').toUpperCase();
        if (modalNotifTitle) modalNotifTitle.textContent = notif.title;
        
        const fullDate = new Date(notif.created_at).toLocaleString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        if (modalNotifTime) modalNotifTime.textContent = fullDate;
        
        if (modalNotifStatusBadge) {
            modalNotifStatusBadge.textContent = 'Read';
            modalNotifStatusBadge.className = 'notif-read-status';
        }

        if (modalNotifMessage) modalNotifMessage.textContent = notif.message;
        if (modalNotifSender) modalNotifSender.textContent = notif.sender || 'Placido L. Señor NHS System';
        if (modalNotifActionType) modalNotifActionType.textContent = notif.actionType || notif.type || 'General Advisory';
        if (modalNotifPriority) modalNotifPriority.textContent = notif.priority || 'Normal';
        if (modalNotifSystemId) modalNotifSystemId.textContent = `NOTIF-${String(notif.id).padStart(4, '0')}`;

        // Link
        if (modalNotifActionLink) {
            let url = notif.actionUrl;
            let label = notif.actionLabel;
            if (!url) {
                if (notif.type === 'enrollment') { url = 'enrollments.html'; label = 'Go to Enrollments'; }
                else if (notif.type === 'account') { url = 'manage_accounts.html'; label = 'Go to Accounts'; }
                else if (notif.type === 'action') { url = 'sections.html'; label = 'Go to Sections'; }
                else if (notif.type === 'profile') { url = 'student.html'; label = 'Go to Students'; }
                else { url = 'dashboard.html'; label = 'Back to Dashboard'; }
            }
            modalNotifActionLink.href = url;
            modalNotifActionLink.innerHTML = `<span>${label || 'Go to Related Page'}</span> <i class="fas fa-arrow-right"></i>`;
        }

        // Show modal
        if (notificationDetailModal) {
            notificationDetailModal.classList.add('active');
        }
    }

    // Mark single notification as read
    function markNotificationRead(id) {
        const notif = dashboardData.notifications.find(n => n.id == id);
        if (notif) {
            notif.is_read = true;
            persistNotifications();
            renderNotifications();
        }
    }

    // Mark all notifications as read
    function markAllRead() {
        dashboardData.notifications.forEach(n => n.is_read = true);
        persistNotifications();
        renderNotifications();
    }

    // Trigger simulated notification for live user interaction
    function triggerSimulatedNotification() {
        const sampleAlerts = [
            {
                type: 'enrollment',
                title: 'New Online Enrollment Form',
                message: 'A new student submitted Grade 11 - STEM enrollment documents for initial registrar evaluation.',
                sender: 'Online Enrollment Form',
                actionType: 'Enrollment Request',
                priority: 'High',
                actionUrl: 'enrollments.html',
                actionLabel: 'Review Enrollment'
            },
            {
                type: 'account',
                title: 'Staff Registration Received',
                message: 'New registrar staff account was registered and requires verification approval.',
                sender: 'Authentication Gateway',
                actionType: 'User Authorization',
                priority: 'Medium',
                actionUrl: 'manage_accounts.html',
                actionLabel: 'Review Account'
            },
            {
                type: 'alert',
                title: 'Attendance Cutoff Reached',
                message: 'Morning cutoff (8:00 AM) completed. 12 late student check-ins were registered for today.',
                sender: 'Attendance QR System',
                actionType: 'Attendance Notice',
                priority: 'Normal',
                actionUrl: 'attendance.html',
                actionLabel: 'Open Attendance'
            },
            {
                type: 'action',
                title: 'Section Roster Updated',
                message: 'Grade 10 - Section A assigned 2 new continuing students from transferee pool.',
                sender: 'Section Management',
                actionType: 'Roster Update',
                priority: 'Normal',
                actionUrl: 'sections.html',
                actionLabel: 'View Sections'
            }
        ];

        const randomAlert = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];
        const newNotif = {
            id: Date.now(),
            type: randomAlert.type,
            title: randomAlert.title,
            message: randomAlert.message,
            created_at: new Date().toISOString(),
            is_read: false,
            sender: randomAlert.sender,
            actionType: randomAlert.actionType,
            priority: randomAlert.priority,
            actionUrl: randomAlert.actionUrl,
            actionLabel: randomAlert.actionLabel
        };

        dashboardData.notifications.unshift(newNotif);
        persistNotifications();
        renderNotifications();

        // Brief bell animation
        if (notificationBtn) {
            notificationBtn.style.transform = 'scale(1.18) rotate(12deg)';
            setTimeout(() => {
                notificationBtn.style.transform = 'scale(1) rotate(0deg)';
            }, 250);
        }
    }

    // Filter notifications in dropdown
    document.querySelectorAll('.notif-filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.notif-filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentNotifFilter = this.dataset.filter;
            renderNotifications();
        });
    });

    // Unread pill in dropdown header is also clickable to filter unread
    if (unreadPill) {
        unreadPill.style.cursor = 'pointer';
        unreadPill.setAttribute('title', 'Click to show unread notifications');
        unreadPill.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.notif-filter-btn[data-filter]').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === 'unread');
            });
            currentNotifFilter = 'unread';
            renderNotifications();
        });
    }

    // Clear read notifications
    if (clearAllNotifsBtn) {
        clearAllNotifsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dashboardData.notifications = dashboardData.notifications.filter(n => !n.is_read);
            persistNotifications();
            renderNotifications();
        });
    }

    // Trigger test notification
    if (triggerSimulatedNotifBtn) {
        triggerSimulatedNotifBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            triggerSimulatedNotification();
        });
    }

    // Modal close handlers
    function closeDetailModal() {
        if (notificationDetailModal) {
            notificationDetailModal.classList.remove('active');
        }
    }

    if (closeNotifModalBtn) {
        closeNotifModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeDetailModal();
        });
    }

    if (dismissNotifModalBtn) {
        dismissNotifModalBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeDetailModal();
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === notificationDetailModal) {
            closeDetailModal();
        }
    });

    // Support Escape key to close modal or dropdown
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDetailModal();
            if (notificationDropdown) {
                notificationDropdown.classList.remove('show');
            }
        }
    });

    // Render recent activities
    function renderActivities() {
        const list = document.getElementById('activityList');
        if (!list) return;
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
        if (!list) return;
        const enrollments = dashboardData.recentEnrollments;

        if (enrollments.length === 0) {
            list.innerHTML = `
                <li class="enrollment-item">
                    <div class="enrollment-info">
                        <p>No recent enrollments</p>
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
        if (!tbody) return;
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
        if (!tbody) return;
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
                        <span class="action-badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">
                            <i class="fas ${isApproved ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                            ${approval.title}
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
        if (!tbody) return;
        const approvals = dashboardData.enrollmentApprovals;

        if (approvals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No enrollment approvals recorded</p></td></tr>`;
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
                        <span class="action-badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">
                            <i class="fas ${isApproved ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                            ${approval.title}
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
        if (!tbody) return;
        const updates = dashboardData.profileUpdates;

        if (updates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No profile updates recorded</p></td></tr>`;
            return;
        }

        let html = '';
        updates.forEach(update => {
            const initial = update.fullname.charAt(0).toUpperCase();
            const time = new Date(update.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });

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
                    <td><span class="role-badge ${update.role.toLowerCase()}">${update.role}</span></td>
                    <td><strong>${update.title}</strong></td>
                    <td>${update.message}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Render all users table
    function renderUsers() {
        const tbody = document.getElementById('usersBody');
        if (!tbody) return;
        const users = dashboardData.allUsers;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>No users found</p></td></tr>`;
            return;
        }

        let html = '';
        users.forEach(user => {
            const initial = user.fullname.charAt(0).toUpperCase();
            const registeredDate = new Date(user.registered_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            const lastActivity = new Date(user.last_activity).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });

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
                    <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                    <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                    <td>${registeredDate}</td>
                    <td><span class="notif-count-badge">${user.notification_count} notifications</span></td>
                    <td>${lastActivity}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // Initialize enrollment chart
    function initChart() {
        const ctx = document.getElementById('enrollmentChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Enrolled Students',
                        data: [12, 19, 25, 45, 60, 85, 120, 156, 170, 180, 185, 189],
                        borderColor: '#1B2A4A',
                        backgroundColor: 'rgba(27, 42, 74, 0.05)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#1B2A4A',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Pending Approvals',
                        data: [5, 8, 12, 15, 20, 28, 35, 33, 25, 18, 10, 5],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 15,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1B2A4A',
                        titleFont: { family: "'Inter', sans-serif", size: 13 },
                        bodyFont: { family: "'Inter', sans-serif", size: 12 },
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 11 },
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 11 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // ===== NOTIFICATION BUTTON EVENT LISTENERS =====

    function toggleNotificationDropdown(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (notificationDropdown) {
            notificationDropdown.classList.toggle('show');
        }
    }

    // Toggle notification dropdown on bell button or badge click
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotificationDropdown);
    }
    if (notifCount) {
        notifCount.addEventListener('click', toggleNotificationDropdown);
    }

    // Keep dropdown open when interacting inside it
    if (notificationDropdown) {
        notificationDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationDropdown && notificationDropdown.classList.contains('show')) {
            const isClickInsideBtn = notificationBtn && notificationBtn.contains(e.target);
            const isClickInsideDropdown = notificationDropdown.contains(e.target);
            if (!isClickInsideBtn && !isClickInsideDropdown) {
                notificationDropdown.classList.remove('show');
            }
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            markAllRead();
        });
    }

    // Table notification count badges click handler
    document.addEventListener('click', function(e) {
        const notifBadge = e.target.closest('.notif-count-badge');
        if (notifBadge) {
            e.stopPropagation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                if (notificationDropdown) {
                    notificationDropdown.classList.add('show');
                }
            }, 250);
        }
    });

    // Chart period change
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', function() {
            console.log('Period changed to:', this.value);
        });
    }

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar && menuToggle) {
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