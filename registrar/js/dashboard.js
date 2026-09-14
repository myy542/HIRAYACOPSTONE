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
            const { count: total } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true });

            // Pending count (case-insensitive)
            const { count: pending } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .or('status.ilike.pending,status.eq.Pending,status.eq.pending');

            // Enrolled count
            const { count: enrolled } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .or('status.ilike.enrolled,status.ilike.approved,status.eq.Enrolled,status.eq.enrolled');

            // Rejected count
            const { count: rejected } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .or('status.ilike.rejected,status.eq.Rejected,status.eq.rejected');

            const totalEl = document.getElementById('totalEnrollments');
            const pendingEl = document.getElementById('pendingCount');
            const enrolledEl = document.getElementById('enrolledCount');
            const rejectedEl = document.getElementById('rejectedCount');

            const finalTotal = total !== null && total !== undefined ? total : 0;
            const finalPending = pending !== null && pending !== undefined ? pending : 0;
            const finalEnrolled = enrolled !== null && enrolled !== undefined ? enrolled : 0;
            const finalRejected = rejected !== null && rejected !== undefined ? rejected : 0;

            if (totalEl) totalEl.textContent = finalTotal;
            if (pendingEl) pendingEl.textContent = finalPending;
            if (enrolledEl) enrolledEl.textContent = finalEnrolled;
            if (rejectedEl) rejectedEl.textContent = finalRejected;

            // Update live sidebar pending badge
            const pendingBadge = document.getElementById('pendingEnrollmentsBadge');
            if (pendingBadge) {
                if (finalPending > 0) {
                    pendingBadge.textContent = finalPending;
                    pendingBadge.style.display = 'inline-flex';
                } else {
                    pendingBadge.style.display = 'none';
                }
            }
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
    // LOAD NOTIFICATIONS & REALTIME ALERTS
    // ============================================

    function playNotificationChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {
            // AudioContext not allowed without prior user gesture
        }
    }

    function showNotificationToast(notif) {
        if (!alertContainer) return;
        const toast = document.createElement('div');
        toast.className = 'alert alert-info notif-toast-banner';
        toast.style.cursor = 'pointer';
        toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)';
        toast.style.borderLeft = '5px solid var(--primary)';
        toast.style.animation = 'slideDown 0.4s ease-out';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-bell" style="color: var(--primary); font-size: 1.25rem;"></i>
                    <div>
                        <strong style="display: block; font-size: 13.5px; color: #0f172a;">${notif.title || 'New Enrollment Notification'}</strong>
                        <span style="font-size: 12px; color: #475569;">${notif.message || ''}</span>
                    </div>
                </div>
                <button type="button" style="background: var(--primary); color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; margin-left: 12px;">
                    View
                </button>
            </div>
        `;

        toast.addEventListener('click', () => {
            if (notif.enrollment_id || notif.enrollmentId) {
                window.location.href = `view_enrollment.html?id=${notif.enrollment_id || notif.enrollmentId}`;
            } else {
                window.location.href = 'enrollments.html';
            }
        });

        alertContainer.prepend(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 8000);
    }

    async function loadNotifications() {
        if (!notificationList) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or('role.eq.registrar,role.is.null')
                .order('created_at', { ascending: false })
                .limit(30);

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
        unreadCount = notifications.filter(n => n.is_read !== true && n.read !== true && n.isRead !== true).length;
    }

    function updateBadge() {
        if (notifCount) {
            if (unreadCount > 0) {
                notifCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
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
            enrollment: 'fa-file-signature',
            update: 'fa-megaphone',
            action: 'fa-check-circle',
            reminder: 'fa-clock',
            alert: 'fa-exclamation-triangle',
            message: 'fa-envelope'
        };

        notificationList.innerHTML = notifications.map(notif => {
            const notifType = notif.type || 'message';
            const icon = typeIcons[notifType] || 'fa-bell';
            const isRead = notif.is_read === true || notif.read === true || notif.isRead === true;
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
                            <i class="far fa-clock" style="margin-right: 4px;"></i>${formatTime(notif.created_at || notif.createdAt)}
                        </div>
                    </div>
                    ${!isRead ? `
                        <button class="mark-read-btn" data-id="${notifId}" title="Mark as read">
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
                if (notif && !(notif.is_read === true || notif.read === true || notif.isRead === true)) {
                    markAsRead(id);
                }
                if (notif && (notif.enrollment_id || notif.enrollmentId)) {
                    window.location.href = `view_enrollment.html?id=${notif.enrollment_id || notif.enrollmentId}`;
                } else if (notif && notif.type === 'new_enrollment') {
                    window.location.href = 'enrollments.html';
                }
            });
        });
    }

    async function markAsRead(id) {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true, read: true })
                .eq('id', id);

            const notif = notifications.find(n => String(n.id) === String(id));
            if (notif) {
                notif.is_read = true;
                notif.read = true;
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
                .update({ is_read: true, read: true })
                .or('role.eq.registrar,role.is.null');

            notifications.forEach(n => {
                n.is_read = true;
                n.read = true;
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

    function setupRealtimeNotifications() {
        try {
            supabase
                .channel('registrar_notifications_realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, (payload) => {
                    if (!payload || !payload.new) return;
                    const newNotif = payload.new;
                    if (!newNotif.role || newNotif.role === 'registrar') {
                        if (!notifications.some(n => String(n.id) === String(newNotif.id))) {
                            notifications.unshift(newNotif);
                            updateUnreadCount();
                            renderNotifications();
                            updateBadge();
                            showNotificationToast(newNotif);
                            playNotificationChime();
                            loadDashboardStats();
                            loadRecentEnrollments();
                            loadEnrollmentTrends();
                            loadGradeDistribution();
                        }
                    }
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'enrollments'
                }, () => {
                    loadDashboardStats();
                    loadRecentEnrollments();
                    loadEnrollmentTrends();
                    loadGradeDistribution();
                })
                .subscribe();
        } catch (err) {
            console.warn('Realtime subscription error:', err);
        }

        // Cross-tab / same browser immediate synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === 'plsnhs_latest_notification' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (!data.role || data.role === 'registrar') {
                        loadNotifications();
                        loadDashboardStats();
                        loadRecentEnrollments();
                        loadEnrollmentTrends();
                        loadGradeDistribution();
                        showNotificationToast(data);
                        playNotificationChime();
                    }
                } catch(err) {}
            }
        });
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
            
            if (error) {
                console.error('Error fetching enrollments for trends:', error);
            }
            
            const months = {};
            const now = new Date();
            
            // Initialize last 6 months (e.g. Apr, May, Jun, Jul, Aug, Sep)
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
                    const st = (item.status || 'pending').toString().toLowerCase().trim();
                    
                    if (months[monthKey]) {
                        if (st === 'pending') {
                            months[monthKey].pending++;
                        } else if (st === 'enrolled' || st === 'approved') {
                            months[monthKey].enrolled++;
                        } else if (st === 'rejected') {
                            months[monthKey].rejected++;
                        }
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

                const allValues = [...pendingData, ...enrolledData, ...rejectedData];
                const maxVal = Math.max(...allValues, 1);
                
                trendsChartInstance = new Chart(trendsCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pending',
                                data: pendingData,
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                borderWidth: 3,
                                pointBackgroundColor: '#f59e0b',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true,
                                tension: 0.35
                            },
                            {
                                label: 'Enrolled',
                                data: enrolledData,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                borderWidth: 3,
                                pointBackgroundColor: '#10b981',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true,
                                tension: 0.35
                            },
                            {
                                label: 'Rejected',
                                data: rejectedData,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                borderWidth: 3,
                                pointBackgroundColor: '#ef4444',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true,
                                tension: 0.35
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: {
                                        family: "'Inter', sans-serif",
                                        size: 12,
                                        weight: '500'
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { family: "'Inter', sans-serif", weight: '600' },
                                bodyFont: { family: "'Inter', sans-serif" },
                                padding: 10,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                suggestedMax: maxVal + 1,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    stepSize: 1,
                                    precision: 0,
                                    font: { family: "'Inter', sans-serif" }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    font: { family: "'Inter', sans-serif" }
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
                .or('status.ilike.enrolled,status.ilike.approved,status.eq.Enrolled,status.eq.enrolled,status.eq.approved');
            
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
                    const rawGrade = (item.grade_level || item.grade || 'Grade 11').toString().trim();
                    const match = rawGrade.match(/Grade\s*(7|8|9|10|11|12)/i) || rawGrade.match(/^(7|8|9|10|11|12)$/);
                    const normalized = match ? `Grade ${match[1]}` : (grades[rawGrade] !== undefined ? rawGrade : 'Grade 11');
                    if (grades[normalized] !== undefined) {
                        grades[normalized]++;
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
                            borderWidth: 2,
                            borderColor: '#ffffff'
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
                                    pointStyle: 'circle',
                                    font: { family: "'Inter', sans-serif", size: 12 }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 10,
                                cornerRadius: 8
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
    setupRealtimeNotifications();

    console.log('✅ Registrar Dashboard initialized with Supabase & Realtime Notifications');

})();