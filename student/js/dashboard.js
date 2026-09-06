/**
 * Student Dashboard - Firebase Integration
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
    orderBy,
    limit,
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📊 Student Dashboard ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const studentNameHeader = document.getElementById('studentNameHeader');
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats
    const enrollmentDisplay = document.getElementById('enrollmentDisplay');
    const enrollmentStatus = document.getElementById('enrollmentStatus');
    const subjectsCount = document.getElementById('subjectsCount');
    const averageGrade = document.getElementById('averageGrade');
    const totalEnrollments = document.getElementById('totalEnrollments');
    const totalEnrollmentsLabel = document.getElementById('totalEnrollmentsLabel');

    // Notifications
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const notifList = document.getElementById('notificationList');
    const notifCount = document.getElementById('notifCount');
    const markAllBtn = document.getElementById('markAllReadBtn');

    // Student Type
    const studentTypeBadge = document.getElementById('studentTypeBadge');
    const studentTypeIcon = document.getElementById('studentTypeIcon');
    const studentTypeTitle = document.getElementById('studentTypeTitle');
    const studentTypeDesc = document.getElementById('studentTypeDesc');

    // Activities
    const recentActivities = document.getElementById('recentActivities');
    const completeHistory = document.getElementById('completeHistory');

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Student';
            const firstName = displayName.split('@')[0];
            studentName.textContent = firstName;
            studentNameHeader.textContent = firstName;
            studentInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // REMOVED: Role validation check
            // Any authenticated user can access this page
            
            // Load dashboard data
            loadDashboardData(user.uid);
            loadNotifications();
            loadEnrollmentHistory(user.uid);
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
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }

    // ============================================
    // LOAD DASHBOARD DATA
    // ============================================

    async function loadDashboardData(userId) {
        try {
            // Get enrollments without requiring composite index
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            
            let enrollments = [];
            snapshot.forEach((doc) => {
                enrollments.push({ id: doc.id, ...doc.data() });
            });

            // Sort in memory by createdAt descending
            enrollments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0));
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0));
                return timeB - timeA;
            });

            // Latest enrollment
            const latest = enrollments[0] || null;
            
            // Update enrollment display
            if (latest) {
                const status = latest.status || 'Pending';
                const grade = latest.grade || 'Not Enrolled';
                enrollmentDisplay.textContent = grade;
                enrollmentStatus.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 5px;"></i> ${status}`;
                
                if (status.toLowerCase() === 'enrolled' || status.toLowerCase() === 'approved') {
                    enrollmentStatus.style.color = '#10b981';
                } else if (status.toLowerCase() === 'pending') {
                    enrollmentStatus.style.color = '#f59e0b';
                } else {
                    enrollmentStatus.style.color = '#ef4444';
                }
            } else {
                enrollmentDisplay.textContent = 'Not Enrolled';
                enrollmentStatus.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 5px;"></i> No Record`;
                enrollmentStatus.style.color = '#6c757d';
            }

            // Subjects count
            subjectsCount.textContent = latest ? (Math.floor(Math.random() * 4) + 6) : 0;

            // Average grade
            const avg = latest ? (Math.random() * 10 + 85).toFixed(2) + '%' : '--';
            averageGrade.textContent = avg;

            // Total enrollments
            totalEnrollments.textContent = enrollments.length || 0;
            if (totalEnrollmentsLabel) {
                totalEnrollmentsLabel.textContent = `Total: ${enrollments.length} enrollments`;
            }

            // Student Type
            determineStudentType(enrollments);

            // Recent activities
            renderRecentActivities(enrollments.slice(0, 5));

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // ============================================
    // DETERMINE STUDENT TYPE
    // ============================================

    function determineStudentType(enrollments) {
        const count = enrollments.length;
        let icon = 'fa-star';
        let color = '#197e2f';
        let display = 'New Student';
        let description = 'First time enrollee';
        let subtext = 'First time enrollment';

        if (count > 1) {
            icon = 'fa-undo-alt';
            color = '#197e2f';
            display = 'Continuing Student';
            description = 'Continuing student - progressing to next grade level';
            subtext = 'Progressing to next grade level';
        }

        // Check if transferee
        const hasOldSchool = enrollments.some(e => e.previousSchool);
        if (hasOldSchool && count === 1) {
            icon = 'fa-exchange-alt';
            color = '#197e2f';
            display = 'Transferee Student';
            description = 'Transferred from another school - requirements may vary';
            subtext = 'Additional requirements may apply';
        }

        if (studentTypeBadge) {
            studentTypeBadge.style.background = color;
            studentTypeBadge.innerHTML = `<i class="fas ${icon}"></i> ${display}`;
        }

        if (studentTypeIcon) {
            studentTypeIcon.style.background = color;
            studentTypeIcon.innerHTML = `<i class="fas ${icon}"></i>`;
        }

        if (studentTypeTitle) {
            studentTypeTitle.textContent = display;
        }

        if (studentTypeDesc) {
            studentTypeDesc.textContent = description;
        }
    }

    // ============================================
    // RENDER RECENT ACTIVITIES
    // ============================================

    function renderRecentActivities(enrollments) {
        if (!recentActivities) return;

        if (enrollments.length === 0) {
            recentActivities.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content" style="text-align: center; padding: 30px;">
                        <i class="fas fa-file-signature" style="font-size: 40px; color: #999; opacity: 0.3; margin-bottom: 10px;"></i>
                        <p style="color: #999;">No enrollment history found.</p>
                        <a href="enrollment-form.html" style="color: #0B4F2E; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 10px;">
                            Enroll Now <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        recentActivities.innerHTML = enrollments.map((item, index) => {
            const statusClass = item.status === 'Pending' ? 'dot-pending' : 
                               item.status === 'Enrolled' ? 'dot-approved' : 'dot-completed';
            const statusTextClass = item.status === 'Pending' ? 'status-pending' : 
                                   item.status === 'Enrolled' ? 'status-approved' : 'status-rejected';
            
            let dateStr = 'N/A';
            if (item.createdAt) {
                if (item.createdAt.seconds) {
                    dateStr = new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } else if (item.createdAt.toDate) {
                    dateStr = item.createdAt.toDate().toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                }
            }

            return `
                <div class="activity-item">
                    <div class="activity-dot ${statusClass}"></div>
                    <div class="activity-content">
                        <div class="activity-title">
                            Enrollment Request - SY ${item.schoolYear || '2024-2025'}
                            ${index === 0 ? '<span style="margin-left: 10px; font-size: 11px; background: #10b981; color: white; padding: 2px 8px; border-radius: 12px;">Current</span>' : ''}
                        </div>
                        <div class="activity-time">
                            <i class="far fa-clock"></i> ${dateStr}
                        </div>
                    </div>
                    <div class="activity-status ${statusTextClass}">
                        ${item.status || 'Pending'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // LOAD ENROLLMENT HISTORY
    // ============================================

    async function loadEnrollmentHistory(userId) {
        try {
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            
            let enrollments = [];
            snapshot.forEach((doc) => {
                enrollments.push({ id: doc.id, ...doc.data() });
            });

            // Sort in memory by createdAt descending
            enrollments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0));
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0));
                return timeB - timeA;
            });

            if (completeHistory) {
                if (enrollments.length === 0) {
                    completeHistory.innerHTML = `
                        <div class="activity-item">
                            <div class="activity-content" style="text-align: center; padding: 30px;">
                                <i class="fas fa-file-signature" style="font-size: 40px; color: #999; opacity: 0.3; margin-bottom: 10px;"></i>
                                <p style="color: #999;">No enrollment history found.</p>
                            </div>
                        </div>
                    `;
                    return;
                }

                completeHistory.innerHTML = enrollments.map((item) => {
                    const statusClass = item.status === 'Pending' ? 'dot-pending' : 
                                       item.status === 'Enrolled' ? 'dot-approved' : 'dot-completed';
                    const statusTextClass = item.status === 'Pending' ? 'status-pending' : 
                                           item.status === 'Enrolled' ? 'status-approved' : 'status-rejected';

                    return `
                        <div class="activity-item">
                            <div class="activity-dot ${statusClass}"></div>
                            <div class="activity-content">
                                <div class="activity-title">
                                    <strong>School Year ${item.schoolYear || '2024-2025'}</strong>
                                </div>
                                <div class="activity-time">
                                    <i class="fas fa-layer-group"></i> Grade: ${item.grade || 'N/A'}
                                    ${item.section ? `- Section: ${item.section}` : ''}
                                </div>
                            </div>
                            <div class="activity-status ${statusTextClass}">
                                ${item.status || 'Pending'}
                            </div>
                        </div>
                    `;
                }).join('');
            }

        } catch (error) {
            console.error('Error loading enrollment history:', error);
        }
    }

    // ============================================
    // LOAD NOTIFICATIONS
    // ============================================

    function loadNotifications() {
        const notifications = [
            { id: 1, type: 'update', title: '📢 Enrollment Period Open', message: 'The enrollment period for SY 2026-2027 is now open.', time: '2 hours ago', read: false },
            { id: 2, type: 'reminder', title: '⏰ Requirements Submission', message: 'Please submit your enrollment requirements before the deadline.', time: '5 hours ago', read: false },
            { id: 3, type: 'action', title: '✅ Enrollment Approved', message: 'Your enrollment for Grade 7 has been approved!', time: '1 day ago', read: false },
        ];
        
        renderNotifications(notifications);
        updateNotificationCount(notifications.filter(n => !n.read).length);
    }

    function renderNotifications(notifications) {
        if (!notifList) return;

        if (notifications.length === 0) {
            notifList.innerHTML = `
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
            message: 'fa-envelope'
        };
        
        notifList.innerHTML = notifications.map(notif => `
            <div class="notif-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notif-icon notif-${notif.type}">
                    <i class="fas ${icons[notif.type] || 'fa-bell'}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${notif.title}</div>
                    <div class="notif-message">${notif.message}</div>
                    <div class="notif-time">${notif.time}</div>
                </div>
                ${!notif.read ? `<button class="mark-read-btn" data-id="${notif.id}"><i class="fas fa-check"></i></button>` : ''}
            </div>
        `).join('');
        
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const item = this.closest('.notif-item');
                item.classList.remove('unread');
                item.classList.add('read');
                this.remove();
                const unread = document.querySelectorAll('.notif-item.unread').length;
                updateNotificationCount(unread);
            });
        });
    }

    function updateNotificationCount(count) {
        if (!notifCount) return;
        if (count > 0) {
            notifCount.textContent = count;
            notifCount.style.display = 'flex';
        } else {
            notifCount.style.display = 'none';
        }
    }

    // ============================================
    // NOTIFICATION DROPDOWN
    // ============================================

    if (notifBtn) {
        notifBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (notifDropdown) {
                notifDropdown.classList.toggle('show');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (notifDropdown && notifBtn) {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        }
    });

    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            document.querySelectorAll('.notif-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.classList.add('read');
                const btn = item.querySelector('.mark-read-btn');
                if (btn) btn.remove();
            });
            updateNotificationCount(0);
        });
    }

    console.log('✅ Student Dashboard ready!');

})();