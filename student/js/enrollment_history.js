/**
 * Student Enrollment History - Firebase Integration
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
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📊 Enrollment History ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const backBtn = document.getElementById('backBtn');

    // Stats
    const totalEnrollmentsEl = document.getElementById('totalEnrollments');
    const enrolledCountEl = document.getElementById('enrolledCount');
    const pendingCountEl = document.getElementById('pendingCount');
    const uniqueYearsEl = document.getElementById('uniqueYears');

    // Enrollment Status Banner
    const currentBanner = document.getElementById('currentBanner');
    const noEnrollmentBanner = document.getElementById('noEnrollmentBanner');
    const currentGrade = document.getElementById('currentGrade');
    const currentSection = document.getElementById('currentSection');
    const currentStrand = document.getElementById('currentStrand');
    const currentSchoolYear = document.getElementById('currentSchoolYear');
    const studentTypeBadge = document.getElementById('studentTypeBadge');

    // History List
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');

    // Alert Container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Student';
            const firstName = displayName.split('@')[0];
            studentName.textContent = firstName;
            studentInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // REMOVED: Role validation check
            // Any authenticated user can access this page
            
            // Load enrollment history
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
    // BACK BUTTON
    // ============================================

    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
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
                const data = doc.data();
                // Convert Firestore timestamp to date
                let createdAt = data.createdAt;
                if (createdAt && createdAt.toDate) {
                    createdAt = createdAt.toDate();
                } else if (createdAt && createdAt.seconds) {
                    createdAt = new Date(createdAt.seconds * 1000);
                }
                
                enrollments.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: createdAt || new Date()
                });
            });

            // Sort by createdAt descending
            enrollments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            if (enrollments.length > 0) {
                renderEnrollmentHistory(enrollments);
            } else {
                renderEmptyState();
            }

        } catch (error) {
            console.error('Error loading enrollment history:', error);
            showAlert('❌ Error loading enrollment history: ' + error.message, 'error');
        }
    }

    // ============================================
    // RENDER ENROLLMENT HISTORY
    // ============================================

    function renderEnrollmentHistory(enrollments) {
        const latest = enrollments[0];
        const isEnrolled = latest && (latest.status === 'Enrolled' || latest.status === 'Approved');
        const isNewStudent = enrollments.length === 1;

        // Update stats
        const total = enrollments.length;
        const enrolled = enrollments.filter(e => e.status === 'Enrolled' || e.status === 'Approved').length;
        const pending = enrollments.filter(e => e.status === 'Pending').length;
        const years = [...new Set(enrollments.map(e => e.schoolYear).filter(Boolean))];

        totalEnrollmentsEl.textContent = total;
        enrolledCountEl.textContent = enrolled;
        pendingCountEl.textContent = pending;
        uniqueYearsEl.textContent = years.length;

        // Show/Hide banners
        if (isEnrolled) {
            currentBanner.style.display = 'flex';
            noEnrollmentBanner.style.display = 'none';
            
            currentGrade.textContent = latest.grade || 'N/A';
            currentSection.textContent = latest.section || 'Not Assigned';
            currentStrand.textContent = latest.strand || 'N/A';
            currentSchoolYear.textContent = latest.schoolYear || 'N/A';
            
            studentTypeBadge.textContent = isNewStudent ? 'New Student' : 'Old Student';
            studentTypeBadge.className = isNewStudent ? 'new-student-badge' : 'old-student-badge';
        } else {
            currentBanner.style.display = 'none';
            noEnrollmentBanner.style.display = 'flex';
            
            const pendingEnrollment = enrollments.some(e => e.status === 'Pending');
            if (pendingEnrollment) {
                studentTypeBadge.textContent = 'New Student - Pending Enrollment';
                studentTypeBadge.className = 'new-student-badge';
            }
        }

        // Render history list
        historyList.innerHTML = '';
        historyCount.textContent = `${total} record(s)`;

        enrollments.forEach((enrollment, index) => {
            const isCurrent = (index === 0 && (enrollment.status === 'Enrolled' || enrollment.status === 'Approved'));
            const isLatestPending = (index === 0 && enrollment.status === 'Pending');
            
            const statusClass = enrollment.status ? enrollment.status.toLowerCase() : 'pending';
            const statusIcon = getStatusIcon(enrollment.status);
            
            const dateStr = enrollment.createdAt ? 
                new Date(enrollment.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 
                'N/A';

            const itemDiv = document.createElement('div');
            itemDiv.className = `history-item ${isCurrent ? 'current-item' : ''}`;
            
            itemDiv.innerHTML = `
                <div class="year-badge">
                    <i class="fas fa-calendar-alt"></i>
                    ${enrollment.schoolYear || 'N/A'}
                </div>
                <div class="history-details">
                    <h3>
                        Grade ${enrollment.grade || 'N/A'}
                        ${enrollment.section ? `- Section ${enrollment.section}` : ''}
                        ${isCurrent ? '<span class="current-badge"><i class="fas fa-check-circle"></i> Current Enrollment</span>' : ''}
                        ${isLatestPending ? '<span class="pending-badge"><i class="fas fa-clock"></i> Latest Application</span>' : ''}
                    </h3>
                    <p>
                        <span><i class="fas fa-calendar-day"></i> Submitted: ${dateStr}</span>
                        ${enrollment.strand ? `<span><i class="fas fa-tag"></i> Strand: ${enrollment.strand}</span>` : ''}
                    </p>
                </div>
                <div class="status-badge status-${statusClass}">
                    ${statusIcon} ${enrollment.status || 'Pending'}
                </div>
            `;
            
            historyList.appendChild(itemDiv);
        });
    }

    // ============================================
    // RENDER EMPTY STATE
    // ============================================

    function renderEmptyState() {
        totalEnrollmentsEl.textContent = '0';
        enrolledCountEl.textContent = '0';
        pendingCountEl.textContent = '0';
        uniqueYearsEl.textContent = '0';
        
        currentBanner.style.display = 'none';
        noEnrollmentBanner.style.display = 'flex';
        
        historyList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-signature"></i>
                <h3>No Enrollment History</h3>
                <p>You haven't made any enrollments yet.</p>
                <a href="enrollment-form.html" class="btn-primary" style="display: inline-block; margin-top: 20px; padding: 0.7rem 2rem; border-radius: 40px; background: var(--primary); color: white; text-decoration: none; font-weight: 600;">
                    <i class="fas fa-graduation-cap"></i> Enroll Now
                </a>
            </div>
        `;
        historyCount.textContent = '0 record(s)';
    }

    // ============================================
    // HELPERS
    // ============================================

    function getStatusIcon(status) {
        const s = (status || '').toLowerCase();
        if (s === 'enrolled' || s === 'approved') {
            return '<i class="fas fa-check-circle"></i>';
        } else if (s === 'pending') {
            return '<i class="fas fa-hourglass-half"></i>';
        } else if (s === 'rejected') {
            return '<i class="fas fa-times-circle"></i>';
        }
        return '';
    }

    // ============================================
    // ALERT SYSTEM
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
    // CONSOLE LOG
    // ============================================

    console.log('✅ Enrollment History ready!');

})();