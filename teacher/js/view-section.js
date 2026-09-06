/**
 * Teacher View Section - Firebase Integration
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

    console.log('📋 View Section ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Section info
    const sectionName = document.getElementById('sectionName');
    const sectionGrade = document.getElementById('sectionGrade');
    const adviserName = document.getElementById('adviserName');
    const isAdviserBadge = document.getElementById('isAdviserBadge');

    // Stats
    const totalStudents = document.getElementById('totalStudents');
    const totalSubjects = document.getElementById('totalSubjects');
    const attendanceRate = document.getElementById('attendanceRate');
    const subjectsTaught = document.getElementById('subjectsTaught');

    // Students table body
    const studentsBody = document.getElementById('studentsBody');
    const studentCountBadge = document.getElementById('studentCountBadge');

    // Schedule list
    const scheduleList = document.getElementById('scheduleList');
    const scheduleCountBadge = document.getElementById('scheduleCountBadge');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let sectionData = null;
    let students = [];
    let schedules = [];
    let advisorySections = [];
    let isAdviser = false;

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
            
            // Get section ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const sectionId = urlParams.get('id');
            
            if (sectionId) {
                await loadUserData(user.uid);
                await loadAdvisorySections(user.uid);
                await loadSectionData(sectionId);
                await loadStudents(sectionId);
                await loadSchedule(sectionId);
            } else {
                showAlert('⚠️ No section ID provided', 'error');
                setTimeout(() => {
                    window.location.href = 'classes.html';
                }, 1500);
            }
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
                advisorySections.push(doc.id);
            });
            
            console.log('📋 Advisory sections loaded:', advisorySections.length);
        } catch (error) {
            console.error('Error loading advisory sections:', error);
            advisorySections = [];
        }
    }

    // ============================================
    // LOAD SECTION DATA
    // ============================================

    async function loadSectionData(sectionId) {
        try {
            const sectionDoc = await getDoc(doc(db, 'sections', sectionId));
            if (sectionDoc.exists()) {
                sectionData = { id: sectionDoc.id, ...sectionDoc.data() };
                console.log('📋 Section data loaded:', sectionData);
                
                // Check if user is adviser
                isAdviser = advisorySections.includes(sectionId);
                
                // Update UI
                renderSectionInfo();
                updateStats();
            } else {
                showAlert('❌ Section not found', 'error');
                setTimeout(() => {
                    window.location.href = 'classes.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error loading section data:', error);
            showAlert('❌ Error loading section: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD STUDENTS
    // ============================================

    async function loadStudents(sectionId) {
        try {
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(
                enrollmentsRef,
                where('sectionId', '==', sectionId),
                where('status', '==', 'Enrolled')
            );
            const snapshot = await getDocs(q);
            
            const studentIds = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.userId) {
                    studentIds.push(data.userId);
                }
            });

            // Get student details
            students = [];
            for (const userId of studentIds) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    students.push({
                        id: userId,
                        fullname: data.displayName || data.fullName || 'Unknown Student',
                        email: data.email || 'N/A',
                        idNumber: data.idNumber || 'N/A',
                        profilePicture: data.profilePicture || null,
                        enrollmentStatus: data.status || 'Enrolled'
                    });
                }
            }

            // Sort students by name
            students.sort((a, b) => a.fullname.localeCompare(b.fullname));
            
            console.log('👨‍🎓 Students loaded:', students.length);
            
            // Update UI
            renderStudents();
            updateStats();

            // Set up real-time listener
            setupStudentsListener(sectionId);

        } catch (error) {
            console.error('Error loading students:', error);
            students = [];
            renderStudents();
        }
    }

    // ============================================
    // SETUP STUDENTS LISTENER
    // ============================================

    function setupStudentsListener(sectionId) {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(
            enrollmentsRef,
            where('sectionId', '==', sectionId),
            where('status', '==', 'Enrolled')
        );

        onSnapshot(q, async (snapshot) => {
            const studentIds = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.userId) {
                    studentIds.push(data.userId);
                }
            });

            students = [];
            for (const userId of studentIds) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    students.push({
                        id: userId,
                        fullname: data.displayName || data.fullName || 'Unknown Student',
                        email: data.email || 'N/A',
                        idNumber: data.idNumber || 'N/A',
                        profilePicture: data.profilePicture || null,
                        enrollmentStatus: data.status || 'Enrolled'
                    });
                }
            }
            students.sort((a, b) => a.fullname.localeCompare(b.fullname));
            renderStudents();
            updateStats();
        }, (error) => {
            console.error('Error listening to students:', error);
        });
    }

    // ============================================
    // LOAD SCHEDULE
    // ============================================

    async function loadSchedule(sectionId) {
        try {
            const classSchedulesRef = collection(db, 'classSchedules');
            const q = query(
                classSchedulesRef,
                where('sectionId', '==', sectionId),
                where('status', '==', 'active')
            );
            const snapshot = await getDocs(q);
            
            schedules = [];
            snapshot.forEach((doc) => {
                schedules.push({ id: doc.id, ...doc.data() });
            });

            // Sort by day order and time
            const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
            schedules.sort((a, b) => {
                const dayDiff = (dayOrder[a.dayName] || 0) - (dayOrder[b.dayName] || 0);
                if (dayDiff !== 0) return dayDiff;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });
            
            console.log('📅 Schedule loaded:', schedules.length);
            
            // Update UI
            renderSchedule();
            updateStats();

            // Set up real-time listener
            setupScheduleListener(sectionId);

        } catch (error) {
            console.error('Error loading schedule:', error);
            schedules = [];
            renderSchedule();
        }
    }

    // ============================================
    // SETUP SCHEDULE LISTENER
    // ============================================

    function setupScheduleListener(sectionId) {
        const classSchedulesRef = collection(db, 'classSchedules');
        const q = query(
            classSchedulesRef,
            where('sectionId', '==', sectionId),
            where('status', '==', 'active')
        );

        onSnapshot(q, (snapshot) => {
            schedules = [];
            snapshot.forEach((doc) => {
                schedules.push({ id: doc.id, ...doc.data() });
            });

            const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
            schedules.sort((a, b) => {
                const dayDiff = (dayOrder[a.dayName] || 0) - (dayOrder[b.dayName] || 0);
                if (dayDiff !== 0) return dayDiff;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });

            renderSchedule();
            updateStats();
        }, (error) => {
            console.error('Error listening to schedule:', error);
        });
    }

    // ============================================
    // RENDER SECTION INFO
    // ============================================

    function renderSectionInfo() {
        if (!sectionData) return;

        sectionName.textContent = sectionData.sectionName || sectionData.name || 'Unknown Section';
        sectionGrade.textContent = sectionData.gradeName || sectionData.grade || 'N/A';
        adviserName.textContent = sectionData.adviserName || 'Not Assigned';

        if (isAdviser) {
            isAdviserBadge.style.display = 'inline-flex';
        } else {
            isAdviserBadge.style.display = 'none';
        }
    }

    // ============================================
    // RENDER STUDENTS
    // ============================================

    function renderStudents() {
        if (!studentsBody) return;

        if (students.length === 0) {
            studentsBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="no-data">
                            <i class="fas fa-user-graduate"></i>
                            <p>No students enrolled in this section.</p>
                        </div>
                    </td>
                </tr>
            `;
            studentCountBadge.textContent = '0 students';
            return;
        }

        studentsBody.innerHTML = students.map(student => {
            const initial = student.fullname.charAt(0).toUpperCase();
            const profilePic = student.profilePicture;
            const status = student.enrollmentStatus || 'Enrolled';
            const statusClass = status.toLowerCase();

            return `
                <tr>
                    <td>
                        <div class="student-info">
                            ${profilePic ? `
                                <div class="student-avatar-img">
                                    <img src="${profilePic}" alt="Profile">
                                </div>
                            ` : `
                                <div class="student-avatar">${initial}</div>
                            `}
                            <div class="student-details">
                                <h4>${student.fullname}</h4>
                                <div class="student-meta">
                                    <span><i class="fas fa-id-card"></i> ${student.idNumber}</span>
                                    <span><i class="fas fa-envelope"></i> ${student.email}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${statusClass}">${status}</span>
                    </td>
                    <td>
                        <div class="action-btns">
                            <a href="view-student.html?id=${student.id}" class="action-btn view" title="View Student">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        studentCountBadge.textContent = `${students.length} students`;
    }

    // ============================================
    // RENDER SCHEDULE
    // ============================================

    function renderSchedule() {
        if (!scheduleList) return;

        if (schedules.length === 0) {
            scheduleList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Schedule Yet</h3>
                    <p>No classes have been scheduled for this section.</p>
                </div>
            `;
            scheduleCountBadge.textContent = '0 classes';
            return;
        }

        scheduleList.innerHTML = schedules.map(schedule => {
            const isMyClass = schedule.teacherId === currentUser?.uid;
            const startTime = schedule.startTime || 'N/A';
            const endTime = schedule.endTime || 'N/A';

            return `
                <div class="schedule-item ${isMyClass ? 'taught-by-me' : ''}">
                    <div class="day-time">
                        <span class="day">${schedule.dayName || 'N/A'}</span>
                        <span class="time">
                            ${formatTime(startTime)} - ${formatTime(endTime)}
                        </span>
                    </div>
                    <div class="subject">
                        ${schedule.subjectName || 'Unknown Subject'}
                        ${isMyClass ? '<span class="taught-badge">You teach this</span>' : ''}
                    </div>
                    <div class="teacher">
                        <i class="fas fa-user"></i> ${schedule.teacherName || 'Unknown Teacher'}
                    </div>
                    ${schedule.room ? `
                        <div class="room">
                            <i class="fas fa-door-open"></i> ${schedule.room}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        scheduleCountBadge.textContent = `${schedules.length} classes`;
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        totalStudents.textContent = students.length;
        totalSubjects.textContent = schedules.length;

        // Calculate attendance rate (simplified)
        const attendanceRateValue = students.length > 0 ? Math.round((students.filter(s => s.enrollmentStatus === 'Enrolled').length / students.length) * 100) : 0;
        attendanceRate.textContent = attendanceRateValue + '%';

        // Count subjects taught by current teacher
        const taughtByMe = schedules.filter(s => s.teacherId === currentUser?.uid).length;
        subjectsTaught.textContent = taughtByMe;

        // Update badges
        studentCountBadge.textContent = `${students.length} students`;
        scheduleCountBadge.textContent = `${schedules.length} classes`;
    }

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

    console.log('✅ View Section ready!');

})();