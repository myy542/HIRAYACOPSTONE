/**
 * Teacher View Student - Firebase Integration
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

    console.log('👤 View Student ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Student profile
    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const studentEmail = document.getElementById('studentEmail');
    const studentId = document.getElementById('studentId');
    const studentGrade = document.getElementById('studentGrade');
    const studentSection = document.getElementById('studentSection');
    const studentSchoolYear = document.getElementById('studentSchoolYear');
    const studentStrand = document.getElementById('studentStrand');
    const enrollmentStatus = document.getElementById('enrollmentStatus');
    const memberSince = document.getElementById('memberSince');

    // Stats
    const averageGrade = document.getElementById('averageGrade');
    const subjectsCount = document.getElementById('subjectsCount');
    const quartersCount = document.getElementById('quartersCount');
    const memberYear = document.getElementById('memberYear');

    // Grade summary
    const q1Avg = document.getElementById('q1Avg');
    const q2Avg = document.getElementById('q2Avg');
    const q3Avg = document.getElementById('q3Avg');
    const q4Avg = document.getElementById('q4Avg');

    // Grades table
    const gradesBody = document.getElementById('gradesBody');
    const gradesCountBadge = document.getElementById('gradesCountBadge');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let studentData = null;
    let enrollmentData = null;
    let gradesData = [];
    const quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

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

            // Get student ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const studentIdParam = urlParams.get('id');

            if (studentIdParam) {
                await loadUserData(user.uid);
                await loadStudentData(studentIdParam);
                await loadEnrollmentData(studentIdParam);
                await loadGradesData(studentIdParam);
            } else {
                showAlert('⚠️ No student ID provided', 'error');
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
    // LOAD STUDENT DATA
    // ============================================

    async function loadStudentData(studentId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists()) {
                studentData = { id: userDoc.id, ...userDoc.data() };
                console.log('📋 Student data loaded:', studentData);
                renderStudentInfo();
                updateStats();
            } else {
                showAlert('❌ Student not found', 'error');
                setTimeout(() => {
                    window.location.href = 'classes.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            showAlert('❌ Error loading student: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD ENROLLMENT DATA
    // ============================================

    async function loadEnrollmentData(studentId) {
        try {
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(
                enrollmentsRef,
                where('userId', '==', studentId),
                where('status', '==', 'Enrolled'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                enrollmentData = { id: doc.id, ...doc.data() };
                console.log('📋 Enrollment data loaded:', enrollmentData);
                renderEnrollmentInfo();
            } else {
                enrollmentData = null;
                renderEnrollmentInfo();
            }

            // Set up real-time listener
            setupEnrollmentListener(studentId);

        } catch (error) {
            console.error('Error loading enrollment data:', error);
            enrollmentData = null;
        }
    }

    // ============================================
    // SETUP ENROLLMENT LISTENER
    // ============================================

    function setupEnrollmentListener(studentId) {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(
            enrollmentsRef,
            where('userId', '==', studentId),
            where('status', '==', 'Enrolled'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                enrollmentData = { id: doc.id, ...doc.data() };
                renderEnrollmentInfo();
            }
        }, (error) => {
            console.error('Error listening to enrollment:', error);
        });
    }

    // ============================================
    // LOAD GRADES DATA
    // ============================================

    async function loadGradesData(studentId) {
        try {
            const gradesRef = collection(db, 'grades');
            const q = query(
                gradesRef,
                where('studentId', '==', studentId),
                orderBy('quarter', 'asc')
            );
            const snapshot = await getDocs(q);

            gradesData = [];
            snapshot.forEach((doc) => {
                gradesData.push({ id: doc.id, ...doc.data() });
            });

            console.log('📊 Grades loaded:', gradesData.length);
            renderGrades();
            updateStats();
            renderGradeSummary();

            // Set up real-time listener
            setupGradesListener(studentId);

        } catch (error) {
            console.error('Error loading grades:', error);
            gradesData = [];
            renderGrades();
        }
    }

    // ============================================
    // SETUP GRADES LISTENER
    // ============================================

    function setupGradesListener(studentId) {
        const gradesRef = collection(db, 'grades');
        const q = query(
            gradesRef,
            where('studentId', '==', studentId),
            orderBy('quarter', 'asc')
        );

        onSnapshot(q, (snapshot) => {
            gradesData = [];
            snapshot.forEach((doc) => {
                gradesData.push({ id: doc.id, ...doc.data() });
            });
            renderGrades();
            updateStats();
            renderGradeSummary();
        }, (error) => {
            console.error('Error listening to grades:', error);
        });
    }

    // ============================================
    // RENDER STUDENT INFO
    // ============================================

    function renderStudentInfo() {
        if (!studentData) return;

        const fullname = studentData.displayName || studentData.fullName || 'Unknown Student';
        studentName.textContent = fullname;
        studentInitial.textContent = fullname.charAt(0).toUpperCase();
        studentEmail.textContent = studentData.email || 'N/A';
        studentId.textContent = studentData.idNumber || 'N/A';

        if (studentData.createdAt) {
            const date = studentData.createdAt.toDate ? studentData.createdAt.toDate() : new Date(studentData.createdAt);
            memberSince.textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            memberYear.textContent = date.getFullYear();
        } else {
            memberSince.textContent = 'N/A';
            memberYear.textContent = 'N/A';
        }

        // Profile picture
        const avatarContainer = document.querySelector('.profile-avatar-large');
        if (studentData.profilePicture) {
            avatarContainer.innerHTML = `<img src="${studentData.profilePicture}" alt="Profile Picture">`;
        } else {
            avatarContainer.innerHTML = `<div class="avatar-initial">${fullname.charAt(0).toUpperCase()}</div>`;
        }
    }

    // ============================================
    // RENDER ENROLLMENT INFO
    // ============================================

    function renderEnrollmentInfo() {
        if (enrollmentData) {
            studentGrade.textContent = enrollmentData.grade || enrollmentData.gradeName || 'N/A';
            studentSection.textContent = enrollmentData.section || enrollmentData.sectionName || 'N/A';
            studentSchoolYear.textContent = enrollmentData.schoolYear || 'N/A';
            studentStrand.textContent = enrollmentData.strand || 'N/A';

            const status = enrollmentData.status || 'Pending';
            enrollmentStatus.textContent = status;
            enrollmentStatus.className = `status-badge status-${status.toLowerCase()}`;
        } else {
            studentGrade.textContent = 'Not Enrolled';
            studentSection.textContent = 'N/A';
            studentSchoolYear.textContent = 'N/A';
            studentStrand.textContent = 'N/A';
            enrollmentStatus.textContent = 'Not Enrolled';
            enrollmentStatus.className = 'status-badge status-pending';
        }
    }

    // ============================================
    // RENDER GRADES
    // ============================================

    function renderGrades() {
        if (!gradesBody) return;

        if (gradesData.length === 0) {
            gradesBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="no-data">
                            <i class="fas fa-star"></i>
                            <h3>No Grades Available</h3>
                            <p>This student doesn't have any grades recorded yet.</p>
                        </div>
                    </td>
                </tr>
            `;
            gradesCountBadge.textContent = '0 records';
            return;
        }

        // Get subject names
        const subjectNames = {};
        gradesData.forEach(grade => {
            if (grade.subjectName && !subjectNames[grade.subjectId]) {
                subjectNames[grade.subjectId] = grade.subjectName;
            }
        });

        gradesBody.innerHTML = gradesData.map(grade => {
            const gradeValue = grade.grade || 0;
            let gradeClass = '';
            let remarks = '';

            if (gradeValue > 0) {
                if (gradeValue >= 90) {
                    gradeClass = 'grade-high';
                    remarks = 'Excellent';
                } else if (gradeValue >= 75) {
                    gradeClass = 'grade-medium';
                    remarks = 'Passed';
                } else {
                    gradeClass = 'grade-low';
                    remarks = 'Failed';
                }
            }

            const subjectName = grade.subjectName || subjectNames[grade.subjectId] || 'Unknown Subject';

            return `
                <tr>
                    <td><strong>${subjectName}</strong></td>
                    <td>${grade.quarter || 'N/A'}</td>
                    <td>
                        ${gradeValue > 0 ? `<span class="${gradeClass}">${gradeValue}</span>` : '—'}
                    </td>
                    <td>${gradeValue > 0 ? remarks : '—'}</td>
                </tr>
            `;
        }).join('');

        gradesCountBadge.textContent = `${gradesData.length} records`;
    }

    // ============================================
    // RENDER GRADE SUMMARY
    // ============================================

    function renderGradeSummary() {
        if (gradesData.length === 0) {
            q1Avg.textContent = '—';
            q2Avg.textContent = '—';
            q3Avg.textContent = '—';
            q4Avg.textContent = '—';
            return;
        }

        const q1Grades = gradesData.filter(g => g.quarter === '1st Quarter' || g.quarter === 1);
        const q2Grades = gradesData.filter(g => g.quarter === '2nd Quarter' || g.quarter === 2);
        const q3Grades = gradesData.filter(g => g.quarter === '3rd Quarter' || g.quarter === 3);
        const q4Grades = gradesData.filter(g => g.quarter === '4th Quarter' || g.quarter === 4);

        function calcAverage(grades) {
            const validGrades = grades.filter(g => g.grade > 0);
            if (validGrades.length === 0) return '—';
            const sum = validGrades.reduce((acc, g) => acc + g.grade, 0);
            return (sum / validGrades.length).toFixed(1);
        }

        q1Avg.textContent = calcAverage(q1Grades);
        q2Avg.textContent = calcAverage(q2Grades);
        q3Avg.textContent = calcAverage(q3Grades);
        q4Avg.textContent = calcAverage(q4Grades);
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        // Calculate average grade
        const validGrades = gradesData.filter(g => g.grade > 0);
        if (validGrades.length > 0) {
            const sum = validGrades.reduce((acc, g) => acc + g.grade, 0);
            const avg = (sum / validGrades.length).toFixed(1);
            averageGrade.textContent = avg;
        } else {
            averageGrade.textContent = 'N/A';
        }

        // Count unique subjects
        const subjects = new Set();
        gradesData.forEach(g => {
            if (g.subjectId) subjects.add(g.subjectId);
        });
        subjectsCount.textContent = subjects.size;

        // Count quarters with grades
        const quartersSet = new Set();
        gradesData.forEach(g => {
            if (g.quarter && g.grade > 0) {
                quartersSet.add(g.quarter);
            }
        });
        quartersCount.textContent = quartersSet.size > 0 ? quartersSet.size : '0';
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

    console.log('✅ View Student ready!');

})();