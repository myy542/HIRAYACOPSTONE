/**
 * Registrar Dashboard - Supabase Integration
 * Real-time data from Supabase
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📚 Registrar Dashboard ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const notifCount = document.getElementById('notifCount');
    const alertContainer = document.getElementById('alertContainer');
    const dateBadge = document.getElementById('dateBadge');

    let currentUser = null;
    let notifications = [];
    let unreadCount = 0;
    let trendsChartInstance = null;
    let gradeChartInstance = null;

    // ============================================
    // SET DATE
    // ============================================

    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
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
            ${message}
        `;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // SESSION CHECK
    // ============================================

    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            currentUser = JSON.parse(stored);
        }
    } catch(e) {
        console.error('Error reading currentUser:', e);
    }

    if (!currentUser) {
        console.warn('⚠️ No active registrar session, redirecting to login...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (currentUser.role && currentUser.role !== 'registrar' && currentUser.role !== 'admin') {
        showAlert('⚠️ You are not authorized to access this page. Redirecting...', 'error');
        const routes = {
            'teacher': '../teacher/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'admin': '../admin/dashboard.html'
        };
        setTimeout(() => {
            window.location.replace(routes[currentUser.role] || '../auth/login.html');
        }, 1500);
        return;
    }

    // Set display name & initials
    const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Registrar'));
    if (adminName) adminName.textContent = displayName;
    if (adminInitial) adminInitial.textContent = displayName.charAt(0).toUpperCase();
    localStorage.setItem('registrarName', displayName);

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚪 Registrar logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('registrarName');
            localStorage.removeItem('plsnhs_registrar_avatar');
            localStorage.removeItem('plsnhs_registrar_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {
                console.warn('Supabase signOut error:', err);
            }
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // LOAD DASHBOARD STATS
    // ============================================

    async function loadDashboardStats() {
        try {
            // Total count
            const { count: total, error: totalErr } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true });

            // Pending count
            const { count: pending, error: pendErr } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pending');

            // Enrolled count
            const { count: enrolled, error: enrolErr } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Enrolled');

            // Rejected count
            const { count: rejected, error: rejErr } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Rejected');

            const totalEl = document.getElementById('totalEnrollments');
            const pendingEl = document.getElementById('pendingCount');
            const enrolledEl = document.getElementById('enrolledCount');
            const rejectedEl = document.getElementById('rejectedCount');

            if (totalEl) totalEl.textContent = total !== null && total !== undefined ? total : 0;
            if (pendingEl) pendingEl.textContent = pending !== null && pending !== undefined ? pending : 0;
            if (enrolledEl) enrolledEl.textContent = enrolled !== null && enrolled !== undefined ? enrolled : 0;
            if (rejectedEl) rejectedEl.textContent = rejected !== null && rejected !== undefined ? rejected : 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // ============================================
    // LOAD RECENT ENROLLMENTS
    // ============================================

    async function loadRecentEnrollments() {
        const container = document.getElementById('recentEnrollments');
        if (!container) return;

        try {
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error || !enrollments || enrollments.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-file-signature"></i>
                        <p>No recent enrollments</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="enrollment-list">
                    ${enrollments.map(e => {
                        const studentName = (e.first_name || e.firstName) ? `${e.first_name || e.firstName} ${e.last_name || e.lastName || ''}`.trim() : (e.student_name || e.studentName || e.email || 'Unknown Student');
                        const initials = studentName.charAt(0).toUpperCase();
                        const status = e.status || 'Pending';
                        const date = e.created_at ? new Date(e.created_at) : new Date();
                        const grade = e.grade_level || e.grade || 'N/A';
                        const strand = e.strand || '';
                        
                        return `
                            <div class="enrollment-item" data-id="${e.id}">
                                <div class="enrollment-avatar">${initials}</div>
                                <div class="enrollment-info">
                                    <h4>${studentName}</h4>
                                    <p>
                                        <span>${grade}</span>
                                        ${strand ? `<span> - ${strand}</span>` : ''}
                                        <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                                    </p>
                                    <div class="activity-time">
                                        <i class="far fa-calendar"></i>
                                        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            container.querySelectorAll('.enrollment-item').forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    if (id) {
                        window.location.href = `view_enrollment.html?id=${id}`;
                    }
                });
            });

        } catch (error) {
            console.error('Error loading recent enrollments:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading enrollments</p>
                </div>
            `;
        }
    }

    // ============================================
    // LOAD NOTIFICATIONS
    // ============================================

    async function loadNotifications() {
        if (!notificationList) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data && data.length > 0) {
                notifications = data;
            } else {
                notifications = [];
            }
        } catch (error) {
            console.warn('Error loading notifications:', error);
            notifications = [];
        }

        updateUnreadCount();
        renderNotifications();
        updateBadge();
    }

    function updateUnreadCount() {
        unreadCount = notifications.filter(n => !n.is_read && !n.isRead).length;
    }

    function updateBadge() {
        if (notifCount) {
            if (unreadCount > 0) {
                notifCount.textContent = unreadCount;
                notifCount.style.display = 'flex';
            } else {
                notifCount.style.display = 'none';
            }
        }
    }

    function renderNotifications() {
        if (!notificationList) return;

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        const typeIcons = {
            new_enrollment: 'fa-file-signature',
            update: 'fa-megaphone',
            action: 'fa-check-circle',
            reminder: 'fa-clock',
            alert: 'fa-exclamation-triangle',
            message: 'fa-envelope'
        };

        notificationList.innerHTML = notifications.map(notif => {
            const notifType = notif.type || 'message';
            const icon = typeIcons[notifType] || 'fa-bell';
            const isRead = notif.is_read || notif.isRead || false;
            const title = notif.title || 'New Notification';
            const message = notif.message || '';
            const notifId = notif.id;
            
            return `
                <div class="notif-item ${isRead ? 'read' : 'unread'}" data-id="${notifId}">
                    <div class="notif-icon notif-${notifType}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${title}</div>
                        <div class="notif-message">${message}</div>
                        <div class="notif-time">
                            ${formatTime(notif.created_at || notif.createdAt)}
                        </div>
                    </div>
                    ${!isRead ? `
                        <button class="mark-read-btn" data-id="${notifId}">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add event listeners to mark read buttons
        notificationList.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                markAsRead(id);
            });
        });

        // Add click event to notification items
        notificationList.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                const notif = notifications.find(n => String(n.id) === String(id));
                if (notif && !(notif.is_read || notif.isRead)) {
                    markAsRead(id);
                }
                if (notif && (notif.enrollment_id || notif.enrollmentId)) {
                    window.location.href = `view_enrollment.html?id=${notif.enrollment_id || notif.enrollmentId}`;
                }
            });
        });
    }

    async function markAsRead(id) {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            const notif = notifications.find(n => String(n.id) === String(id));
            if (notif) {
                notif.is_read = true;
                notif.isRead = true;
            }
            updateUnreadCount();
            renderNotifications();
            updateBadge();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            notifications.forEach(n => {
                n.is_read = true;
                n.isRead = true;
            });
            updateUnreadCount();
            renderNotifications();
            updateBadge();
            showAlert('✅ All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
            showAlert('❌ Error marking all as read', 'error');
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        let date;
        if (typeof timestamp === 'object' && timestamp.toDate) {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'object' && timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) return 'Just now';

        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Toggle notification dropdown
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationDropdown && notificationBtn) {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllAsRead();
        });
    }

    // ============================================
    // CHARTS - ENROLLMENT TRENDS
    // ============================================

    async function loadEnrollmentTrends() {
        try {
            const { data: snapshot, error } = await supabase
                .from('enrollments')
                .select('created_at, status');
            
            const months = {};
            const now = new Date();
            
            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = d.toLocaleString('en-US', { month: 'short' });
                months[key] = { pending: 0, enrolled: 0, rejected: 0 };
            }

            // Count enrollments by month
            if (snapshot && Array.isArray(snapshot)) {
                snapshot.forEach(item => {
                    const date = item.created_at ? new Date(item.created_at) : new Date();
                    const monthKey = date.toLocaleString('en-US', { month: 'short' });
                    const status = item.status || 'Pending';
                    
                    if (months[monthKey]) {
                        if (status === 'Pending') months[monthKey].pending++;
                        else if (status === 'Enrolled') months[monthKey].enrolled++;
                        else if (status === 'Rejected') months[monthKey].rejected++;
                    }
                });
            }

            const labels = Object.keys(months);
            const pendingData = labels.map(k => months[k].pending);
            const enrolledData = labels.map(k => months[k].enrolled);
            const rejectedData = labels.map(k => months[k].rejected);

            // Render chart
            const trendsCtx = document.getElementById('trendsChart');
            if (trendsCtx && typeof Chart !== 'undefined') {
                if (trendsChartInstance) {
                    trendsChartInstance.destroy();
                }
                
                trendsChartInstance = new Chart(trendsCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pending',
                                data: pendingData,
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Enrolled',
                                data: enrolledData,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Rejected',
                                data: rejectedData,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error loading trends:', error);
        }
    }

    // ============================================
    // CHARTS - GRADE DISTRIBUTION
    // ============================================

    async function loadGradeDistribution() {
        try {
            const { data: snapshot, error } = await supabase
                .from('enrollments')
                .select('grade, grade_level, status')
                .eq('status', 'Enrolled');
            
            const grades = {
                'Grade 7': 0,
                'Grade 8': 0,
                'Grade 9': 0,
                'Grade 10': 0,
                'Grade 11': 0,
                'Grade 12': 0
            };

            if (snapshot && Array.isArray(snapshot)) {
                snapshot.forEach(item => {
                    const grade = item.grade_level || item.grade || 'Grade 7';
                    if (grades[grade] !== undefined) {
                        grades[grade]++;
                    }
                });
            }

            const labels = Object.keys(grades);
            const data = Object.values(grades);
            const colors = ['#0b2b4a', '#1a3d5f', '#2a4f74', '#3a6189', '#4a739e', '#5a85b3'];

            // Render chart
            const gradeCtx = document.getElementById('gradeChart');
            if (gradeCtx && typeof Chart !== 'undefined') {
                if (gradeChartInstance) {
                    gradeChartInstance.destroy();
                }
                
                gradeChartInstance = new Chart(gradeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            }
                        },
                        cutout: '65%'
                    }
                });
            }

        } catch (error) {
            console.error('Error loading grade distribution:', error);
        }
    }

    // ============================================
    // RECENT ACTIVITIES
    // ============================================

    async function loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        try {
            const { data: notifs, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error || !notifs || notifs.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-bell-slash"></i>
                        <p>No recent activities</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="activity-list">
                    ${notifs.map(a => {
                        return `
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">${a.title || a.message || 'Notification'}</div>
                                    <div class="activity-time">
                                        <i class="far fa-clock"></i>
                                        ${formatTime(a.created_at)}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading activities:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-bell-slash"></i>
                    <p>No recent activities</p>
                </div>
            `;
        }
    }

    // ============================================
    // INITIALIZE
    // ============================================

    loadDashboardStats();
    loadRecentEnrollments();
    loadNotifications();
    loadEnrollmentTrends();
    loadGradeDistribution();
    loadRecentActivities();

    console.log('✅ Registrar Dashboard initialized with Supabase');

})();