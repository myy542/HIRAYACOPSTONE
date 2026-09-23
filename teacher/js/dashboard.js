/**
 * Teacher Dashboard - Supabase Integration
 */

import { supabase } from '../../supabase/config.js';

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

    let sessionUser = null;
    let sections = [];
    let subjectsByGrade = {};
    let gradeLevels = [
        { id: '1', gradeName: 'Grade 7' },
        { id: '2', gradeName: 'Grade 8' },
        { id: '3', gradeName: 'Grade 9' },
        { id: '4', gradeName: 'Grade 10' },
        { id: '5', gradeName: 'Grade 11' },
        { id: '6', gradeName: 'Grade 12' }
    ];

    // Grade order
    const gradeOrder = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

    // ============================================
    // SESSION CHECK
    // ============================================

    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch(e) {}

    if (!sessionUser) {
        console.warn('⚠️ No active teacher session, redirecting...');
        window.location.replace('../auth/login.html');
        return;
    }

    if (sessionUser.role && sessionUser.role !== 'teacher') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    // Set teacher display name & initial
    const displayName = (sessionUser.firstName ? `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() : (sessionUser.email ? sessionUser.email.split('@')[0] : 'Teacher'));
    if (teacherName) teacherName.textContent = displayName;
    if (teacherInitial) teacherInitial.textContent = displayName.charAt(0).toUpperCase();

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚪 Teacher logging out...');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('hes_teacher_avatar');
            localStorage.removeItem('hes_teacher_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // LOAD DASHBOARD DATA FROM SUPABASE
    // ============================================

    async function loadDashboardData() {
        try {
            await loadSections();
            await loadSubjects();
            await updateStats();
            renderSections();
            renderSubjects();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showAlert('❌ Error loading dashboard: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD SECTIONS
    // ============================================

    async function loadSections() {
        try {
            const { data, error } = await supabase
                .from('sections')
                .select('*')
                .order('grade_level', { ascending: true });

            if (error) throw error;
            sections = data || [];
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
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            subjectsByGrade = {};

            (data || []).forEach((sub) => {
                const gradeName = sub.grade_level || 'General';
                if (!subjectsByGrade[gradeName]) {
                    subjectsByGrade[gradeName] = [];
                }
                subjectsByGrade[gradeName].push(sub);
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

    async function updateStats() {
        try {
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            if (totalStudents) totalStudents.textContent = studentCount || 0;
        } catch(e) {
            if (totalStudents) totalStudents.textContent = sections.length * 25;
        }

        if (totalSections) totalSections.textContent = sections.length;

        let totalSubCount = 0;
        Object.values(subjectsByGrade).forEach(subs => {
            totalSubCount += subs.length;
        });
        if (totalSubjects) totalSubjects.textContent = totalSubCount;

        if (totalGradeLevels) totalGradeLevels.textContent = gradeLevels.length;
    }

    // ============================================
    // RENDER SECTIONS
    // ============================================

    function renderSections() {
        if (!sectionsList) return;

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
            const gradeName = section.grade_level || 'N/A';
            const strandText = section.strand ? ` (${section.strand})` : '';
            return `
                <div class="section-item">
                    <div class="section-info">
                        <h4>${section.name || 'Unknown Section'}</h4>
                        <p><i class="fas fa-tag"></i> ${gradeName}${strandText}</p>
                    </div>
                    <span class="badge">Section</span>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // RENDER SUBJECTS
    // ============================================

    function renderSubjects() {
        if (!subjectsContainer) return;

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
                                        <h4>${subject.name || subject.code || 'Unknown Subject'}</h4>
                                        <p style="font-size:0.8rem; color:#6b7280;">Code: ${subject.code || '—'}</p>
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
    // SET CURRENT DATE
    // ============================================

    const dateBadge = document.querySelector('.date-badge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // Initialize
    loadDashboardData();

    console.log('✅ Teacher Dashboard initialized!');
})();