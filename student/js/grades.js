/**
 * Student Grades - Firebase Integration
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
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📊 Grades page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Class info
    const gradeDisplay = document.getElementById('gradeDisplay');
    const strandDisplay = document.getElementById('strandDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const schoolYearDisplay = document.getElementById('schoolYearDisplay');

    // Stats
    const subjectsCount = document.getElementById('subjectsCount');
    const gradeLevelDisplay = document.getElementById('gradeLevelDisplay');
    const schoolYearStat = document.getElementById('schoolYearStat');

    // Subjects container
    const subjectsGrid = document.getElementById('subjectsGrid');
    const noGradesMsg = document.getElementById('noGradesMsg');
    const notEnrolledCard = document.getElementById('notEnrolledCard');

    // Modal
    const gradeModal = document.getElementById('gradeModal');
    const modalSubjectTitle = document.getElementById('modalSubjectTitle');
    const modalBody = document.getElementById('modalBody');

    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let currentEnrollment = null;
    let subjectsList = [];
    let gradesData = {};

    // Quarter names
    const quarterNames = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Student';
            const firstName = displayName.split('@')[0];
            studentName.textContent = firstName;
            studentInitial.textContent = firstName.charAt(0).toUpperCase();
            
            // REMOVED: Role validation check
            // Any authenticated user can access this page
            
            // Load grades data
            loadStudentData(user.uid);
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
    // LOAD STUDENT DATA
    // ============================================

    async function loadStudentData(userId) {
        try {
            // Get student profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                console.log('User profile doc not found, using auth profile');
            }

            // Get current enrollment (approved/enrolled or pending)
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(enrollmentsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            let enrollments = [];
            snapshot.forEach((d) => {
                enrollments.push({ id: d.id, ...d.data() });
            });

            // Sort in memory by createdAt descending
            enrollments.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0));
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0));
                return timeB - timeA;
            });

            if (enrollments.length > 0) {
                currentEnrollment = enrollments[0];
                renderEnrollmentInfo(currentEnrollment);
                
                // Load subjects and grades
                await loadSubjectsAndGrades(userId, currentEnrollment);
            } else {
                // No enrollment found
                if (notEnrolledCard) notEnrolledCard.style.display = 'block';
                if (noGradesMsg) noGradesMsg.style.display = 'none';
                const classCard = document.querySelector('.class-info-card');
                if (classCard) classCard.style.display = 'none';
                const statsCont = document.querySelector('.stats-container');
                if (statsCont) statsCont.style.display = 'none';
                const subCard = document.querySelector('.subjects-card');
                if (subCard) subCard.style.display = 'none';
            }

        } catch (error) {
            console.error('Error loading student data:', error);
            showAlert('❌ Error loading data: ' + error.message, 'error');
        }
    }

    // ============================================
    // RENDER ENROLLMENT INFO
    // ============================================

    function renderEnrollmentInfo(enrollment) {
        const classCard = document.querySelector('.class-info-card');
        if (classCard) classCard.style.display = 'flex';
        const statsCont = document.querySelector('.stats-container');
        if (statsCont) statsCont.style.display = 'grid';
        const subCard = document.querySelector('.subjects-card');
        if (subCard) subCard.style.display = 'block';
        if (notEnrolledCard) notEnrolledCard.style.display = 'none';

        if (gradeDisplay) gradeDisplay.textContent = enrollment.grade || 'N/A';
        if (strandDisplay) strandDisplay.textContent = enrollment.strand || 'N/A';
        if (statusDisplay) statusDisplay.textContent = enrollment.status || 'Enrolled';
        if (schoolYearDisplay) schoolYearDisplay.textContent = enrollment.schoolYear || 'N/A';
        if (gradeLevelDisplay) gradeLevelDisplay.textContent = enrollment.grade || 'N/A';
        if (schoolYearStat) schoolYearStat.textContent = enrollment.schoolYear || 'N/A';
    }

    // ============================================
    // LOAD SUBJECTS AND GRADES
    // ============================================

    async function loadSubjectsAndGrades(userId, enrollment) {
        try {
            subjectsList = [];
            const gradeName = enrollment.grade || 'Grade 7';

            // Get subjects from Firestore if any
            try {
                const subjectsRef = collection(db, 'subjects');
                const q = query(subjectsRef);
                const snapshot = await getDocs(q);
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.gradeId == enrollment.gradeId || data.grade_name == gradeName || data.gradeLevel == gradeName || data.grade == gradeName) {
                        subjectsList.push({ id: doc.id, ...data });
                    }
                });
            } catch (e) {
                console.log('Subjects fetch error, using default curriculum:', e);
            }

            // If no subjects found in Firestore, use default standard curriculum
            if (subjectsList.length === 0) {
                const isSHS = gradeName === 'Grade 11' || gradeName === 'Grade 12';
                const defaultSubjects = isSHS ? [
                    'General Mathematics',
                    'Oral Communication',
                    'Komunikasyon at Pananaliksik',
                    '21st Century Literature',
                    'Earth and Life Science',
                    'Understanding Culture, Society and Politics',
                    'Physical Education and Health'
                ] : [
                    'Mathematics',
                    'Science',
                    'English',
                    'Filipino',
                    'Araling Panlipunan (AP)',
                    'MAPEH',
                    'Edukasyon sa Pagpapakatao (EsP)',
                    'Technology and Livelihood Education (TLE)'
                ];

                subjectsList = defaultSubjects.map((name, idx) => ({
                    id: 'sub_' + (idx + 1),
                    subjectName: name,
                    name: name
                }));
            }

            // Get grades for this student
            gradesData = {};
            try {
                const gradesRef = collection(db, 'grades');
                const gq = query(gradesRef, where('userId', '==', userId));
                const gradesSnapshot = await getDocs(gq);
                
                gradesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const subjectId = data.subjectId;
                    if (!gradesData[subjectId]) {
                        gradesData[subjectId] = {};
                    }
                    gradesData[subjectId][data.quarter] = data.grade;
                });
            } catch (e) {
                console.log('Grades fetch error:', e);
            }

            // Render subjects
            renderSubjects();

            // Show no grades message if no grades exist
            const hasGrades = Object.keys(gradesData).length > 0;
            if (noGradesMsg) {
                noGradesMsg.style.display = hasGrades ? 'none' : 'block';
            }

            // Update subject count
            if (subjectsCount) {
                subjectsCount.textContent = subjectsList.length;
            }

        } catch (error) {
            console.error('Error loading subjects:', error);
            showAlert('❌ Error loading subjects: ' + error.message, 'error');
        }
    }

    // ============================================
    // RENDER SUBJECTS
    // ============================================

    function renderSubjects() {
        subjectsGrid.innerHTML = '';

        if (subjectsList.length === 0) {
            subjectsGrid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1; padding: 30px;">
                    <i class="fas fa-book"></i>
                    <p>No subjects found for your grade level.</p>
                </div>
            `;
            return;
        }

        subjectsList.forEach(subject => {
            const subjectGrades = gradesData[subject.id] || {};
            const hasGrades = Object.values(subjectGrades).some(g => g > 0);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'subject-item';
            itemDiv.innerHTML = `
                <div class="subject-info">
                    <h4>${subject.subjectName || subject.name || 'N/A'}</h4>
                    ${!hasGrades ? `<p style="font-size: 0.7rem; color: #065510ff;"><i class="fas fa-clock"></i> No grades yet</p>` : ''}
                </div>
                <button class="view-grade-btn" data-subject-id="${subject.id}" data-subject-name="${subject.subjectName || subject.name || 'N/A'}">
                    <i class="fas fa-eye"></i> View Grades
                </button>
            `;
            subjectsGrid.appendChild(itemDiv);
        });

        // Add click listeners to view grade buttons
        document.querySelectorAll('.view-grade-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const subjectId = this.dataset.subjectId;
                const subjectName = this.dataset.subjectName;
                openGradeModal(subjectId, subjectName);
            });
        });
    }

    // ============================================
    // GRADE MODAL
    // ============================================

    function openGradeModal(subjectId, subjectName) {
        modalSubjectTitle.textContent = `${subjectName} - Grades`;

        const grades = gradesData[subjectId] || {};
        const hasGrades = Object.values(grades).some(g => g > 0);

        if (!hasGrades) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-clock" style="font-size: 2rem; color: var(--gray-300); margin-bottom: 0.5rem;"></i>
                    <p style="color: var(--gray-500);">No grades recorded for this subject yet.</p>
                </div>
            `;
            gradeModal.classList.add('show');
            return;
        }

        let html = '';
        let total = 0;
        let count = 0;

        for (let i = 1; i <= 4; i++) {
            const grade = grades[i] || null;
            const hasGrade = grade && grade > 0;
            let gradeClass = '';
            if (hasGrade) {
                if (grade >= 90) gradeClass = 'high';
                else if (grade >= 75) gradeClass = 'medium';
                else gradeClass = 'low';
                total += grade;
                count++;
            }

            html += `
                <div class="grade-item">
                    <span class="quarter-label">${quarterNames[i-1]}</span>
                    <span class="grade-value ${hasGrade ? gradeClass : ''}">${hasGrade ? grade : '—'}</span>
                </div>
            `;
        }

        const average = count > 0 ? (total / count).toFixed(2) : null;

        html += `
            <div class="average-display">
                <div class="avg-label">Overall Average</div>
                <div class="avg-value">${average !== null ? average + '%' : 'No grades'}</div>
            </div>
        `;

        modalBody.innerHTML = html;
        gradeModal.classList.add('show');
    }

    // ============================================
    // CLOSE MODAL
    // ============================================

    function closeModal() {
        gradeModal.classList.remove('show');
    }

    // Close modal on outside click
    if (gradeModal) {
        gradeModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Expose closeModal globally
    window.closeModal = closeModal;

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
    // SET CURRENT DATE
    // ============================================

    const dateBadge = document.querySelector('.date-badge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    console.log('✅ Grades page ready!');

})();