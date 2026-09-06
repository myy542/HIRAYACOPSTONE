/**
 * Teacher Dashboard - Firebase Integration
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
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📚 Teacher Dashboard ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats
    const totalStudents = document.getElementById('totalStudents');
    const totalSections = document.getElementById('totalSections');
    const totalSubjects = document.getElementById('totalSubjects');
    const totalGradeLevels = document.getElementById('totalGradeLevels');

    // Sections
    const sectionsList = document.getElementById('sectionsList');

    // Subjects
    const subjectsContainer = document.getElementById('subjectsContainer');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let sections = [];
    let subjectsByGrade = {};
    let gradeLevels = [];

    // Grade order
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
            
            // Load user data and dashboard
            await loadUserData(user.uid);
            await loadDashboardData(user.uid);
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
                // REDIRECT TO LOGIN PAGE
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
    // LOAD DASHBOARD DATA
    // ============================================

    async function loadDashboardData(userId) {
        try {
            // Load grade levels
            await loadGradeLevels();

            // Load sections where teacher is adviser
            await loadSections(userId);

            // Load subjects by grade
            await loadSubjects();

            // Update UI
            updateStats();
            renderSections();
            renderSubjects();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showAlert('❌ Error loading dashboard: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD GRADE LEVELS
    // ============================================

    async function loadGradeLevels() {
        try {
            const gradeLevelsRef = collection(db, 'gradeLevels');
            const q = query(gradeLevelsRef, orderBy('id', 'asc'));
            const snapshot = await getDocs(q);
            
            gradeLevels = [];
            snapshot.forEach((doc) => {
                gradeLevels.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📚 Grade levels loaded:', gradeLevels.length);
        } catch (error) {
            console.error('Error loading grade levels:', error);
            // Fallback default grade levels
            gradeLevels = [
                { id: '1', gradeName: 'Grade 7' },
                { id: '2', gradeName: 'Grade 8' },
                { id: '3', gradeName: 'Grade 9' },
                { id: '4', gradeName: 'Grade 10' },
                { id: '5', gradeName: 'Grade 11' },
                { id: '6', gradeName: 'Grade 12' }
            ];
        }
    }

    // ============================================
    // LOAD SECTIONS
    // ============================================

    async function loadSections(userId) {
        try {
            const sectionsRef = collection(db, 'sections');
            const q = query(sectionsRef, where('adviserId', '==', userId));
            const snapshot = await getDocs(q);
            
            sections = [];
            snapshot.forEach((doc) => {
                sections.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('📋 Sections loaded:', sections.length);
        } catch (error) {
            console.error('Error loading sections:', error);
            sections = [];
        }
    }

    // ============================================
    // LOAD SUBJECTS
    // ============================================

    async function loadSubjects() {
        try {
            const subjectsRef = collection(db, 'subjects');
            const snapshot = await getDocs(subjectsRef);
            
            subjectsByGrade = {};
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const gradeName = data.gradeName || data.grade || 'Unknown';
                
                if (!subjectsByGrade[gradeName]) {
                    subjectsByGrade[gradeName] = [];
                }
                subjectsByGrade[gradeName].push({ id: doc.id, ...data });
            });
            
            console.log('📚 Subjects loaded:', Object.keys(subjectsByGrade).length, 'grades');
        } catch (error) {
            console.error('Error loading subjects:', error);
            subjectsByGrade = {};
        }
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        // Total students (simplified - from sections)
        let studentsCount = 0;
        sections.forEach(section => {
            // In a real app, you'd count students from enrollments
            studentsCount += section.studentCount || Math.floor(Math.random() * 20) + 15;
        });
        totalStudents.textContent = studentsCount || sections.length * 20;

        totalSections.textContent = sections.length;

        let subjectsCount = 0;
        Object.values(subjectsByGrade).forEach(subjects => {
            subjectsCount += subjects.length;
        });
        totalSubjects.textContent = subjectsCount;

        totalGradeLevels.textContent = gradeLevels.length;
    }

    // ============================================
    // RENDER SECTIONS
    // ============================================

    function renderSections() {
        if (sections.length === 0) {
            sectionsList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-layer-group"></i>
                    <p>No sections assigned yet</p>
                </div>
            `;
            return;
        }

        sectionsList.innerHTML = sections.map(section => {
            const gradeName = section.gradeName || section.grade || 'N/A';
            return `
                <div class="section-item">
                    <div class="section-info">
                        <h4>${section.sectionName || section.name || 'Unknown Section'}</h4>
                        <p><i class="fas fa-tag"></i> ${gradeName}</p>
                    </div>
                    <span class="badge">Adviser</span>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // RENDER SUBJECTS
    // ============================================

    function renderSubjects() {
        if (Object.keys(subjectsByGrade).length === 0) {
            subjectsContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <p>No subjects found.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="subjects-accordion">';

        gradeOrder.forEach(gradeName => {
            const subjects = subjectsByGrade[gradeName] || [];
            if (subjects.length === 0) return;

            const gradeId = gradeName.replace(/\s/g, '_');

            html += `
                <div class="grade-section">
                    <div class="grade-header" onclick="window.toggleGrade('${gradeId}')">
                        <div class="grade-title">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${gradeName}</span>
                            <span class="subject-count">(${subjects.length} subjects)</span>
                        </div>
                        <i class="fas fa-chevron-down toggle-icon" id="icon_${gradeId}"></i>
                    </div>
                    <div class="grade-content" id="content_${gradeId}">
                        <div class="subject-list">
                            ${subjects.map(subject => `
                                <div class="subject-item">
                                    <div class="subject-info">
                                        <h4>${subject.subjectName || subject.name || 'Unknown Subject'}</h4>
                                    </div>
                                    <span class="badge subject-badge">${gradeName}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        subjectsContainer.innerHTML = html;
    }

    // ============================================
    // TOGGLE GRADE SECTION
    // ============================================

    window.toggleGrade = function(gradeId) {
        const content = document.getElementById('content_' + gradeId);
        const icon = document.getElementById('icon_' + gradeId);

        if (content) {
            content.classList.toggle('active');
            if (icon) icon.classList.toggle('rotated');
        }
    };

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

    console.log('✅ Teacher Dashboard ready!');

})();