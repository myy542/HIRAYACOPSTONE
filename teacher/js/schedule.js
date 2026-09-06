/**
 * Teacher Schedule - Firebase Integration
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
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📅 Teacher Schedule ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats
    const totalClasses = document.getElementById('totalClasses');
    const totalSections = document.getElementById('totalSections');
    const totalSubjects = document.getElementById('totalSubjects');
    const freePeriods = document.getElementById('freePeriods');

    // Schedule table body
    const scheduleBody = document.getElementById('scheduleBody');
    const weekDisplay = document.getElementById('weekDisplay');
    const weekRange = document.getElementById('weekRange');

    // Summary
    const sectionsList = document.getElementById('sectionsList');
    const subjectsList = document.getElementById('subjectsList');
    const advisoryList = document.getElementById('advisoryList');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let schedules = [];
    let advisorySections = [];
    let timeSlots = [];
    let weeklySchedule = {};
    let uniqueSections = {};
    let uniqueSubjects = {};
    let totalClassesCount = 0;

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const gradeOrder = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Teacher';
            const firstName = displayName.split('@')[0];
            teacherName.textContent = firstName;
            teacherInitial.textContent = firstName.charAt(0).toUpperCase();
            
            await loadUserData(user.uid);
            await loadAdvisorySections(user.uid);
            await loadTimeSlots();
            await loadSchedule(user.uid);
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
                showAlert('❌ Error logging out: ' + error.message, 'error');
            });
        });
    }

    // ============================================
    // LOAD USER DATA
    // ============================================

    async function loadUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('📋 User data loaded:', userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // ============================================
    // LOAD ADVISORY SECTIONS
    // ============================================

    async function loadAdvisorySections(userId) {
        try {
            const sectionsRef = collection(db, 'sections');
            const q = query(sectionsRef, where('adviserId', '==', userId));
            const snapshot = await getDocs(q);
            
            advisorySections = [];
            snapshot.forEach((doc) => {
                advisorySections.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📋 Advisory sections loaded:', advisorySections.length);
        } catch (error) {
            console.error('Error loading advisory sections:', error);
            advisorySections = [];
        }
    }

    // ============================================
    // LOAD TIME SLOTS
    // ============================================

    async function loadTimeSlots() {
        try {
            const timeSlotsRef = collection(db, 'timeSlots');
            const q = query(timeSlotsRef, orderBy('startTime', 'asc'));
            const snapshot = await getDocs(q);
            
            timeSlots = [];
            snapshot.forEach((doc) => {
                timeSlots.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('⏰ Time slots loaded:', timeSlots.length);
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSlots = [];
        }
    }

    // ============================================
    // LOAD SCHEDULE
    // ============================================

    async function loadSchedule(userId) {
        try {
            const classSchedulesRef = collection(db, 'classSchedules');
            const q = query(
                classSchedulesRef,
                where('teacherId', '==', userId),
                where('status', '==', 'active')
            );
            const snapshot = await getDocs(q);
            
            schedules = [];
            snapshot.forEach((doc) => {
                schedules.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📅 Schedule loaded:', schedules.length);
            
            // Organize schedule
            organizeSchedule();
            
            // Update UI
            updateStats();
            renderScheduleTable();
            updateSummary();
            
            // Set up real-time listener
            setupScheduleListener(userId);
            
        } catch (error) {
            console.error('Error loading schedule:', error);
            schedules = [];
            showAlert('❌ Error loading schedule: ' + error.message, 'error');
        }
    }

    // ============================================
    // SETUP SCHEDULE LISTENER
    // ============================================

    function setupScheduleListener(userId) {
        const classSchedulesRef = collection(db, 'classSchedules');
        const q = query(
            classSchedulesRef,
            where('teacherId', '==', userId),
            where('status', '==', 'active')
        );

        onSnapshot(q, (snapshot) => {
            schedules = [];
            snapshot.forEach((doc) => {
                schedules.push({ id: doc.id, ...doc.data() });
            });
            organizeSchedule();
            updateStats();
            renderScheduleTable();
            updateSummary();
        }, (error) => {
            console.error('Error listening to schedule:', error);
        });
    }

    // ============================================
    // ORGANIZE SCHEDULE
    // ============================================

    function organizeSchedule() {
        weeklySchedule = {};
        uniqueSections = {};
        uniqueSubjects = {};
        totalClassesCount = 0;

        // Initialize weekly schedule structure
        daysOrder.forEach(day => {
            weeklySchedule[day] = {};
            timeSlots.forEach(slot => {
                weeklySchedule[day][slot.id] = null;
            });
        });

        // Populate schedules
        schedules.forEach(schedule => {
            const day = schedule.dayName || schedule.day;
            const timeSlotId = schedule.timeSlotId;
            const sectionId = schedule.sectionId;
            const sectionName = schedule.sectionName || 'Unknown Section';
            const gradeName = schedule.gradeName || 'N/A';
            const subjectName = schedule.subjectName || 'Unknown Subject';
            const subjectId = schedule.subjectId;
            
            if (day && timeSlotId) {
                const isAdvisory = advisorySections.some(a => a.id === sectionId);
                
                weeklySchedule[day][timeSlotId] = {
                    subjectName: subjectName,
                    subjectId: subjectId,
                    sectionName: sectionName,
                    sectionId: sectionId,
                    gradeName: gradeName,
                    room: schedule.room || 'N/A',
                    startTime: schedule.startTime || 'N/A',
                    endTime: schedule.endTime || 'N/A',
                    isAdvisory: isAdvisory
                };
                
                totalClassesCount++;
                
                // Track unique sections
                if (sectionId) {
                    uniqueSections[sectionId] = sectionName + ' - ' + gradeName;
                }
                
                // Track unique subjects
                if (subjectId) {
                    uniqueSubjects[subjectId] = subjectName;
                }
            }
        });
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        totalClasses.textContent = totalClassesCount;
        totalSections.textContent = Object.keys(uniqueSections).length;
        totalSubjects.textContent = Object.keys(uniqueSubjects).length;
        
        const totalSlots = timeSlots.length * daysOrder.length;
        const free = totalSlots - totalClassesCount;
        freePeriods.textContent = free > 0 ? free : 0;
    }

    // ============================================
    // RENDER SCHEDULE TABLE
    // ============================================

    function renderScheduleTable() {
        if (!scheduleBody) return;

        // Update week display
        updateWeekDisplay();

        if (timeSlots.length === 0) {
            scheduleBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data-cell">
                        <div class="no-data">
                            <i class="fas fa-clock"></i>
                            <h3>No time slots configured</h3>
                            <p>Please contact the administrator.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        scheduleBody.innerHTML = timeSlots.map(slot => {
            const startTime = slot.startTime || 'N/A';
            const endTime = slot.endTime || 'N/A';
            const timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;

            return `
                <tr>
                    <td class="time-column">${timeDisplay}</td>
                    ${daysOrder.map(day => {
                        const classData = weeklySchedule[day]?.[slot.id] || null;
                        const advisoryClass = classData && classData.isAdvisory ? 'advisory' : '';

                        if (classData) {
                            return `
                                <td>
                                    <div class="schedule-cell">
                                        <div class="class-item ${advisoryClass}">
                                            <div class="section-name">
                                                <i class="fas fa-users"></i> 
                                                ${classData.sectionName}
                                            </div>
                                            <div class="subject-name">
                                                <i class="fas fa-book-open"></i>
                                                ${classData.subjectName}
                                            </div>
                                            <div class="grade-name">
                                                <i class="fas fa-graduation-cap"></i>
                                                ${classData.gradeName}
                                            </div>
                                            ${classData.room && classData.room !== 'N/A' ? `
                                                <div class="room-badge">
                                                    <i class="fas fa-door-open"></i> ${classData.room}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </td>
                            `;
                        } else {
                            return `
                                <td>
                                    <div class="schedule-cell">
                                        <div class="empty-cell">
                                            <i class="fas fa-minus-circle"></i> Free
                                        </div>
                                    </div>
                                </td>
                            `;
                        }
                    }).join('')}
                </tr>
            `;
        }).join('');
    }

    // ============================================
    // UPDATE WEEK DISPLAY
    // ============================================

    function updateWeekDisplay() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 4);
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const startStr = startOfWeek.toLocaleDateString('en-US', options);
        const endStr = endOfWeek.toLocaleDateString('en-US', options);
        
        if (weekRange) {
            weekRange.textContent = `${startStr} - ${endStr}`;
        }
    }

    // ============================================
    // UPDATE SUMMARY
    // ============================================

    function updateSummary() {
        // Sections
        const sectionsArray = Object.values(uniqueSections);
        if (sectionsList) {
            if (sectionsArray.length === 0) {
                sectionsList.innerHTML = `<div class="no-data-message"><i class="fas fa-info-circle"></i> No sections assigned</div>`;
            } else {
                sectionsList.innerHTML = sectionsArray.map(section => `
                    <span class="summary-tag">
                        <i class="fas fa-layer-group"></i>
                        ${section}
                    </span>
                `).join('');
            }
        }

        // Subjects
        const subjectsArray = Object.values(uniqueSubjects);
        if (subjectsList) {
            if (subjectsArray.length === 0) {
                subjectsList.innerHTML = `<div class="no-data-message"><i class="fas fa-info-circle"></i> No subjects assigned</div>`;
            } else {
                subjectsList.innerHTML = subjectsArray.map(subject => `
                    <span class="summary-tag">
                        <i class="fas fa-book-open"></i>
                        ${subject}
                    </span>
                `).join('');
            }
        }

        // Advisory
        if (advisoryList) {
            if (advisorySections.length === 0) {
                advisoryList.innerHTML = `<div class="no-data-message"><i class="fas fa-info-circle"></i> No advisory classes</div>`;
            } else {
                advisoryList.innerHTML = advisorySections.map(section => `
                    <span class="summary-tag advisory">
                        <i class="fas fa-users"></i>
                        ${section.sectionName || section.name || 'Unknown'} - ${section.gradeName || section.grade || 'N/A'}
                    </span>
                `).join('');
            }
        }
    }

    // ============================================
    // WEEK NAVIGATION
    // ============================================

    window.changeWeek = function(direction) {
        // For demo, just show a toast
        showToast('📅 Week navigation feature coming soon!', 'info');
    };

    // ============================================
    // HELPERS
    // ============================================

    function formatTime(timeStr) {
        if (!timeStr || timeStr === 'N/A') return 'N/A';
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    }

    // ============================================
    // SET CURRENT DATE
    // ============================================

    const dateBadge = document.querySelector('.date-badge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // ============================================
    // TOAST SYSTEM
    // ============================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        const colors = {
            success: '#10b981',
            info: '#0b2b4a',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 14px 28px;
            border-radius: 14px;
            font-weight: 500;
            font-size: 0.95rem;
            box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideInToast 0.4s ease;
            max-width: 400px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: default;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add toast styles
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideInToast {
                from { transform: translateX(60px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
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

    console.log('✅ Teacher Schedule ready!');

})();