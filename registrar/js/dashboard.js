/**
 * Registrar Dashboard - Firebase Integration
 * Real-time data from Firestore
 */

import { auth, db } from '../../firebase/config.js';
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy,
    limit,
    doc,
    updateDoc,
    serverTimestamp,
    getCountFromServer,
    addDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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

    let currentUser = null;
    let notifications = [];
    let unreadCount = 0;

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
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
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
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ Registrar logged in:', user.email);

            // Check if user is registrar (role check)
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.role !== 'registrar' && userData.role !== 'admin') {
                        showAlert('⚠️ You are not authorized to access this page. Redirecting...', 'error');
                        setTimeout(() => {
                            window.location.href = '../auth/login.html';
                        }, 3000);
                        return;
                    }
                    
                    // Set admin name
                    const displayName = userData.displayName || user.email || 'Registrar';
                    adminName.textContent = displayName;
                    adminInitial.textContent = displayName.charAt(0).toUpperCase();
                    localStorage.setItem('registrarName', displayName);
                }
            } catch (error) {
                console.error('Error checking user role:', error);
            }

            // Load all data
            await loadDashboardStats();
            await loadRecentEnrollments();
            await loadNotifications();
            await loadEnrollmentTrends();
            await loadGradeDistribution();

        } else {
            console.log('❌ User logged out - redirecting to login');
            window.location.href = '../auth/login.html';
        }
    });

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signOut(auth).then(() => {
                localStorage.removeItem('registrarName');
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }

    // ============================================
    // LOAD DASHBOARD STATS (Real-time)
    // ============================================

    async function loadDashboardStats() {
        try {
            const enrollmentsRef = collection(db, 'enrollments');
            
            // Total count
            const totalSnapshot = await getCountFromServer(enrollmentsRef);
            document.getElementById('totalEnrollments').textContent = totalSnapshot.data().count || 0;

            // Pending count
            const pendingQuery = query(enrollmentsRef, where('status', '==', 'Pending'));
            const pendingSnapshot = await getCountFromServer(pendingQuery);
            document.getElementById('pendingCount').textContent = pendingSnapshot.data().count || 0;

            // Enrolled count
            const enrolledQuery = query(enrollmentsRef, where('status', '==', 'Enrolled'));
            const enrolledSnapshot = await getCountFromServer(enrolledQuery);
            document.getElementById('enrolledCount').textContent = enrolledSnapshot.data().count || 0;

            // Rejected count
            const rejectedQuery = query(enrollmentsRef, where('status', '==', 'Rejected'));
            const rejectedSnapshot = await getCountFromServer(rejectedQuery);
            document.getElementById('rejectedCount').textContent = rejectedSnapshot.data().count || 0;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // ============================================
    // LOAD RECENT ENROLLMENTS (Real-time)
    // ============================================

    function loadRecentEnrollments() {
        const container = document.getElementById('recentEnrollments');
        if (!container) return;

        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(enrollmentsRef, orderBy('createdAt', 'desc'), limit(5));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-file-signature"></i>
                        <p>No recent enrollments</p>
                    </div>
                `;
                return;
            }

            const enrollments = [];
            snapshot.forEach(doc => {
                enrollments.push({ id: doc.id, ...doc.data() });
            });

            container.innerHTML = `
                <div class="enrollment-list">
                    ${enrollments.map(e => {
                        const studentName = e.studentName || e.userEmail || 'Unknown Student';
                        const initials = studentName.charAt(0).toUpperCase();
                        const status = e.status || 'Pending';
                        const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
                        
                        return `
                            <div class="enrollment-item">
                                <div class="enrollment-avatar">${initials}</div>
                                <div class="enrollment-info">
                                    <h4>${studentName}</h4>
                                    <p>
                                        <span>${e.grade || 'N/A'}</span>
                                        ${e.strand ? `<span> - ${e.strand}</span>` : ''}
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

            // Add click to view enrollment details
            document.querySelectorAll('.enrollment-item').forEach((item, index) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    if (enrollments[index]) {
                        window.location.href = `enrollment-detail.html?id=${enrollments[index].id}`;
                    }
                });
            });

        }, (error) => {
            console.error('Error loading recent enrollments:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading enrollments</p>
                </div>
            `;
        });
    }

    // ============================================
    // LOAD NOTIFICATIONS (Real-time)
    // ============================================

    function loadNotifications() {
        if (!notificationList) return;

        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));

        onSnapshot(q, (snapshot) => {
            notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });

            updateUnreadCount();
            renderNotifications();
            updateBadge();

        }, (error) => {
            console.error('Error loading notifications:', error);
        });
    }

    function updateUnreadCount() {
        unreadCount = notifications.filter(n => !n.isRead).length;
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
            const isRead = notif.isRead || false;
            const title = notif.title || 'New Notification';
            const message = notif.message || '';
            
            return `
                <div class="notif-item ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notif-icon notif-${notifType}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${title}</div>
                        <div class="notif-message">${message}</div>
                        <div class="notif-time">
                            ${formatTime(notif.createdAt)}
                        </div>
                    </div>
                    ${!isRead ? `
                        <button class="mark-read-btn" data-id="${notif.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Add event listeners to mark read buttons
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                markAsRead(id);
            });
        });

        // Add click event to notification items
        document.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                const notif = notifications.find(n => n.id === id);
                if (notif && !notif.isRead) {
                    markAsRead(id);
                }
                // If it has enrollmentId, navigate to enrollment detail
                if (notif && notif.enrollmentId) {
                    window.location.href = `enrollment-detail.html?id=${notif.enrollmentId}`;
                }
            });
        });
    }

    async function markAsRead(id) {
        try {
            await updateDoc(doc(db, 'notifications', id), {
                isRead: true
            });
            console.log('✅ Notification marked as read');
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            const promises = notifications
                .filter(n => !n.isRead)
                .map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));
            
            await Promise.all(promises);
            showAlert('✅ All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
            showAlert('❌ Error marking all as read', 'error');
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Toggle notification dropdown
    if (notificationBtn) {
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

    let trendsChartInstance = null;
    let gradeChartInstance = null;

    async function loadEnrollmentTrends() {
        try {
            const enrollmentsRef = collection(db, 'enrollments');
            const snapshot = await getDocs(enrollmentsRef);
            
            const months = {};
            const now = new Date();
            
            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString('en-US', { month: 'short' });
                months[key] = { pending: 0, enrolled: 0, rejected: 0 };
            }

            // Count enrollments by month
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                const monthKey = date.toLocaleString('en-US', { month: 'short' });
                const status = data.status || 'Pending';
                
                if (months[monthKey]) {
                    if (status === 'Pending') months[monthKey].pending++;
                    else if (status === 'Enrolled') months[monthKey].enrolled++;
                    else if (status === 'Rejected') months[monthKey].rejected++;
                }
            });

            const labels = Object.keys(months);
            const pendingData = labels.map(k => months[k].pending);
            const enrolledData = labels.map(k => months[k].enrolled);
            const rejectedData = labels.map(k => months[k].rejected);

            // Render chart
            const trendsCtx = document.getElementById('trendsChart');
            if (trendsCtx) {
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
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('status', '==', 'Enrolled'));
            const snapshot = await getDocs(q);
            
            const grades = {
                'Grade 7': 0,
                'Grade 8': 0,
                'Grade 9': 0,
                'Grade 10': 0,
                'Grade 11': 0,
                'Grade 12': 0
            };

            snapshot.forEach(doc => {
                const data = doc.data();
                const grade = data.grade || 'Grade 7';
                if (grades[grade] !== undefined) {
                    grades[grade]++;
                }
            });

            const labels = Object.keys(grades);
            const data = Object.values(grades);
            const colors = ['#0b2b4a', '#1a3d5f', '#2a4f74', '#3a6189', '#4a739e', '#5a85b3'];

            // Render chart
            const gradeCtx = document.getElementById('gradeChart');
            if (gradeCtx) {
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
    // RECENT ACTIVITIES (Real-time from notifications)
    // ============================================

    function loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(5));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-bell-slash"></i>
                        <p>No recent activities</p>
                    </div>
                `;
                return;
            }

            const activities = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    description: data.title || 'New notification',
                    time: data.createdAt
                });
            });

            container.innerHTML = `
                <div class="activity-list">
                    ${activities.map(a => {
                        const date = a.time?.toDate ? a.time.toDate() : new Date();
                        return `
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-bell"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">${a.description}</div>
                                    <div class="activity-time">
                                        <i class="far fa-clock"></i>
                                        ${formatTime(a.time)}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

        }, (error) => {
            console.error('Error loading activities:', error);
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================

    // Load recent activities (real-time)
    loadRecentActivities();

    // Auto-hide alerts after 5 seconds
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);

    console.log('✅ Registrar Dashboard ready with Firebase!');

})();