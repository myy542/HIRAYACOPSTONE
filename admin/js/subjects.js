/**
 * PLSNHS Admin - Subjects Management
 */

import { supabase } from '../../supabase/config.js';

(function() {
    'use strict';

    console.log('📚 Admin Subjects page ready');

    // ============================================
    // CHECK ADMIN SESSION
    // ============================================

    const currentUserStr = localStorage.getItem('currentUser');

    if (!currentUserStr) {
        console.warn('⚠️ No session, redirecting to login...');
        window.location.replace('../auth/login.html');
        return;
    }

    let currentUser;
    try {
        currentUser = JSON.parse(currentUserStr);
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.replace('../auth/login.html');
        return;
    }

    if (currentUser.role !== 'admin') {
        console.warn('⚠️ Not admin, redirecting...');
        const routes = {
            'teacher': '../teacher/dashboard.html',
            'student': '../student/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[currentUser.role] || '../auth/login.html');
        return;
    }

    console.log('✅ Admin session verified:', currentUser.email);

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminAvatar = document.getElementById('adminAvatar');
    const adminName = document.getElementById('adminName');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    const alertContainer = document.getElementById('alertContainer');
    const totalSubjectsEl = document.getElementById('totalSubjects');
    const jhsSubjectsEl = document.getElementById('jhsSubjects');
    const shsSubjectsEl = document.getElementById('shsSubjects');
    const totalStrandsEl = document.getElementById('totalStrands');

    const gradeCardsContainer = document.getElementById('gradeCards');
    const gradeFilter = document.getElementById('gradeFilter');
    const strandFilterWrapper = document.getElementById('strandFilterWrapper');
    const strandFilter = document.getElementById('strandFilter');
    const searchInput = document.getElementById('searchInput');
    const resetBtn = document.getElementById('resetBtn');
    const subjectsContainer = document.getElementById('subjectsContainer');

    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editSubjectForm = document.getElementById('editSubjectForm');
    const editSubjectId = document.getElementById('editSubjectId');
    const editSubjectName = document.getElementById('editSubjectName');
    const editGradeId = document.getElementById('editGradeId');
    const editStrandGroup = document.getElementById('editStrandGroup');
    const editStrand = document.getElementById('editStrand');
    const editDescription = document.getElementById('editDescription');

    // ============================================
    // DISPLAY ADMIN INFO
    // ============================================

    let adminFirstName = currentUser.firstName || currentUser.first_name || 'Justine';
    if (adminFirstName.toLowerCase().includes('mylene') || adminFirstName.toLowerCase() === 'student' || adminFirstName.toLowerCase() === 'admin') {
        adminFirstName = 'Justine';
    }
    if (adminAvatar) adminAvatar.textContent = adminFirstName.charAt(0).toUpperCase();
    if (adminName) adminName.textContent = adminFirstName;

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(e.target) && (!menuToggle || !menuToggle.contains(e.target))) {
            sidebar.classList.remove('active');
        }
    });

    // ============================================
    // INITIAL CURRICULUM DATA
    // ============================================

    const DEFAULT_SUBJECTS = [
        // Grade 7
        { id: 'sub-7-1', name: 'English 7', grade: 7, strand: null, category: 'Core', description: 'Grammar, Philippine Literature, and Oral Communication' },
        { id: 'sub-7-2', name: 'Mathematics 7', grade: 7, strand: null, category: 'Core', description: 'Sets, Real Numbers, Algebra, Geometry, and Statistics' },
        { id: 'sub-7-3', name: 'Science 7', grade: 7, strand: null, category: 'Core', description: 'Integrated General Science, Living Things, Matter, Energy' },
        { id: 'sub-7-4', name: 'Filipino 7', grade: 7, strand: null, category: 'Core', description: 'Ibong Adarna at Panitikang Rehiyonal' },
        { id: 'sub-7-5', name: 'Araling Panlipunan 7', grade: 7, strand: null, category: 'Core', description: 'Araling Asyano - Heograpiya, Kultura, at Kasaysayan' },
        { id: 'sub-7-6', name: 'MAPEH 7', grade: 7, strand: null, category: 'Core', description: 'Music, Arts, Physical Education, and Health' },
        { id: 'sub-7-7', name: 'Edukasyon sa Pagpapakatao 7', grade: 7, strand: null, category: 'Core', description: 'Values Education and Self-Development' },
        { id: 'sub-7-8', name: 'Technology and Livelihood Education 7', grade: 7, strand: null, category: 'Core', description: 'Exploratory ICT, Agri-Fishery, and Industrial Arts' },
        { id: 'sub-7-9', name: 'Computer Education 7', grade: 7, strand: null, category: 'Elective', description: 'Basic Computing and Productivity Tools' },

        // Grade 8
        { id: 'sub-8-1', name: 'English 8', grade: 8, strand: null, category: 'Core', description: 'Afro-Asian Literature and Advanced Grammar' },
        { id: 'sub-8-2', name: 'Mathematics 8', grade: 8, strand: null, category: 'Core', description: 'Linear Equations, Rational Expressions, Geometry, Probability' },
        { id: 'sub-8-3', name: 'Science 8', grade: 8, strand: null, category: 'Core', description: 'Forces, Motion, Work, Energy, Earthquakes, and Typhoons' },
        { id: 'sub-8-4', name: 'Filipino 8', grade: 8, strand: null, category: 'Core', description: 'Florante at Laura at Panitikang Tradisyunal' },
        { id: 'sub-8-5', name: 'Araling Panlipunan 8', grade: 8, strand: null, category: 'Core', description: 'Kasaysayan ng Daigdig' },
        { id: 'sub-8-6', name: 'MAPEH 8', grade: 8, strand: null, category: 'Core', description: 'Asian Music & Arts, Team Sports, and Family Health' },
        { id: 'sub-8-7', name: 'Edukasyon sa Pagpapakatao 8', grade: 8, strand: null, category: 'Core', description: 'Family, Interpersonal Relations, and Society' },
        { id: 'sub-8-8', name: 'Technology and Livelihood Education 8', grade: 8, strand: null, category: 'Core', description: 'Specialized TLE and Home Economics' },
        { id: 'sub-8-9', name: 'Journalism 8', grade: 8, strand: null, category: 'Elective', description: 'Campus Journalism and News Writing' },

        // Grade 9
        { id: 'sub-9-1', name: 'English 9', grade: 9, strand: null, category: 'Core', description: 'Anglo-American Literature and Communicative Competence' },
        { id: 'sub-9-2', name: 'Mathematics 9', grade: 9, strand: null, category: 'Core', description: 'Quadratic Equations, Variations, Radicals, Trigonometry' },
        { id: 'sub-9-3', name: 'Science 9', grade: 9, strand: null, category: 'Core', description: 'Living Things, Chemical Bonding, Earth and Space' },
        { id: 'sub-9-4', name: 'Filipino 9', grade: 9, strand: null, category: 'Core', description: 'Noli Me Tangere at Panitikang Asyano' },
        { id: 'sub-9-5', name: 'Araling Panlipunan 9', grade: 9, strand: null, category: 'Core', description: 'Ekonomiks - Pambansang Ekonomiya at Kaunlaran' },
        { id: 'sub-9-6', name: 'MAPEH 9', grade: 9, strand: null, category: 'Core', description: 'Western Music & Arts, Community and Environmental Health' },
        { id: 'sub-9-7', name: 'Edukasyon sa Pagpapakatao 9', grade: 9, strand: null, category: 'Core', description: 'Lipunan, Katarungang Panlipunan, at Kagalingan sa Paggawa' },
        { id: 'sub-9-8', name: 'Technology and Livelihood Education 9', grade: 9, strand: null, category: 'Core', description: 'Technical Skills and Entrepreneurship' },

        // Grade 10
        { id: 'sub-10-1', name: 'English 10', grade: 10, strand: null, category: 'Core', description: 'World Literature, Argumentation, and Research Writing' },
        { id: 'sub-10-2', name: 'Mathematics 10', grade: 10, strand: null, category: 'Core', description: 'Sequences, Polynomials, Coordinate Geometry, Statistics' },
        { id: 'sub-10-3', name: 'Science 10', grade: 10, strand: null, category: 'Core', description: 'Plate Tectonics, Electromagnetic Spectrum, Heredity, Evolution' },
        { id: 'sub-10-4', name: 'Filipino 10', grade: 10, strand: null, category: 'Core', description: 'El Filibusterismo at Panitikang Pandaigdig' },
        { id: 'sub-10-5', name: 'Araling Panlipunan 10', grade: 10, strand: null, category: 'Core', description: 'Mga Kontemporaryong Isyu' },
        { id: 'sub-10-6', name: 'MAPEH 10', grade: 10, strand: null, category: 'Core', description: '20th Century Music & Arts, Global Health Trends' },
        { id: 'sub-10-7', name: 'Edukasyon sa Pagpapakatao 10', grade: 10, strand: null, category: 'Core', description: 'Moral Choices, Dignity, and Career Orientation' },
        { id: 'sub-10-8', name: 'Technology and Livelihood Education 10', grade: 10, strand: null, category: 'Core', description: 'National Certificate (NC) Preparedness' },

        // Grade 11 - Core
        { id: 'sub-11-core-1', name: 'Oral Communication in Context', grade: 11, strand: null, category: 'Core', description: 'Speech communication and public speaking' },
        { id: 'sub-11-core-2', name: 'Reading and Writing Skills', grade: 11, strand: null, category: 'Core', description: 'Academic and professional reading and writing' },
        { id: 'sub-11-core-3', name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', grade: 11, strand: null, category: 'Core', description: 'Gamit ng wika sa lipunang Pilipino' },
        { id: 'sub-11-core-4', name: '21st Century Literature from the Philippines and the World', grade: 11, strand: null, category: 'Core', description: 'Contemporary literary genres and forms' },
        { id: 'sub-11-core-5', name: 'General Mathematics', grade: 11, strand: null, category: 'Core', description: 'Functions, Business Math, and Logic' },
        { id: 'sub-11-core-6', name: 'Statistics and Probability', grade: 11, strand: null, category: 'Core', description: 'Random variables, sampling, hypothesis testing' },
        { id: 'sub-11-core-7', name: 'Earth and Life Science', grade: 11, strand: null, category: 'Core', description: 'Earth history, processes, and biological systems' },
        { id: 'sub-11-core-8', name: 'Physical Education and Health 1', grade: 11, strand: null, category: 'Core', description: 'Fitness and aerobic training' },

        // Grade 11 - STEM
        { id: 'sub-11-stem-1', name: 'Major: Pre-Calculus', grade: 11, strand: 'STEM', category: 'Major', description: 'Conic sections, systems of equations, trigonometry' },
        { id: 'sub-11-stem-2', name: 'Major: Basic Calculus', grade: 11, strand: 'STEM', category: 'Major', description: 'Limits, continuity, derivatives, and integrals' },
        { id: 'sub-11-stem-3', name: 'Major: General Biology 1', grade: 11, strand: 'STEM', category: 'Major', description: 'Cell biology, bioenergetics, and genetics' },
        { id: 'sub-11-stem-4', name: 'Major: General Chemistry 1', grade: 11, strand: 'STEM', category: 'Major', description: 'Atomic structure, stoichiometry, and thermochemistry' },

        // Grade 11 - ABM
        { id: 'sub-11-abm-1', name: 'Major: Fundamentals of Accountancy, Business and Management 1', grade: 11, strand: 'ABM', category: 'Major', description: 'Accounting cycle of service and merchandising businesses' },
        { id: 'sub-11-abm-2', name: 'Major: Business Mathematics', grade: 11, strand: 'ABM', category: 'Major', description: 'Fractions, decimals, percentages, mark-up, payroll' },
        { id: 'sub-11-abm-3', name: 'Major: Organization and Management', grade: 11, strand: 'ABM', category: 'Major', description: 'Principles and functions of management' },
        { id: 'sub-11-abm-4', name: 'Major: Principles of Marketing', grade: 11, strand: 'ABM', category: 'Major', description: 'Marketing concepts, strategic planning, customer value' },

        // Grade 11 - HUMSS
        { id: 'sub-11-humss-1', name: 'Major: Creative Writing', grade: 11, strand: 'HUMSS', category: 'Major', description: 'Poetry, fiction, drama, and literary techniques' },
        { id: 'sub-11-humss-2', name: 'Major: Introduction to World Religions and Belief Systems', grade: 11, strand: 'HUMSS', category: 'Major', description: 'Comparative religious studies and philosophies' },
        { id: 'sub-11-humss-3', name: 'Major: Disciplines and Ideas in the Social Sciences', grade: 11, strand: 'HUMSS', category: 'Major', description: 'Anthropology, Economics, Geography, History, Linguistics' },
        { id: 'sub-11-humss-4', name: 'Major: Philippine Politics and Governance', grade: 11, strand: 'HUMSS', category: 'Major', description: 'Constitutional framework and governmental branches' },

        // Grade 11 - TVL
        { id: 'sub-11-tvl-1', name: 'Major: Computer Systems Servicing NC II', grade: 11, strand: 'TVL', category: 'Major', description: 'Hardware installation, configuration, and networking' },
        { id: 'sub-11-tvl-2', name: 'Major: Bread and Pastry Production NC II', grade: 11, strand: 'TVL', category: 'Major', description: 'Baking techniques, food safety, and pastry preparation' },
        { id: 'sub-11-tvl-3', name: 'Major: Cookery NC II', grade: 11, strand: 'TVL', category: 'Major', description: 'Commercial kitchen management and culinary skills' },
        { id: 'sub-11-tvl-4', name: 'Major: Shielded Metal Arc Welding NC I', grade: 11, strand: 'TVL', category: 'Major', description: 'Welding safety, arc welding, and metal fabrication' },

        // Grade 11 - GAS
        { id: 'sub-11-gas-1', name: 'Major: Humanities 1', grade: 11, strand: 'GAS', category: 'Major', description: 'Interdisciplinary cultural and literary studies' },
        { id: 'sub-11-gas-2', name: 'Major: Social Science 1', grade: 11, strand: 'GAS', category: 'Major', description: 'Contemporary human behavior and social systems' },
        { id: 'sub-11-gas-3', name: 'Major: Applied Economics', grade: 11, strand: 'GAS', category: 'Major', description: 'Economic principles applied to contemporary issues' },
        { id: 'sub-11-gas-4', name: 'Major: Disaster Readiness and Risk Reduction', grade: 11, strand: 'GAS', category: 'Major', description: 'Hazard management and disaster preparedness' },

        // Grade 12 - Core
        { id: 'sub-12-core-1', name: 'Contemporary Philippine Arts from the Regions', grade: 12, strand: null, category: 'Core', description: 'Contemporary art forms, practices, and artists' },
        { id: 'sub-12-core-2', name: 'Media and Information Literacy', grade: 12, strand: null, category: 'Core', description: 'Information evaluation and digital citizenship' },
        { id: 'sub-12-core-3', name: 'Introduction to the Philosophy of the Human Person', grade: 12, strand: null, category: 'Core', description: 'Philosophical inquiry, freedom, and human embodiment' },
        { id: 'sub-12-core-4', name: 'Physical Science', grade: 12, strand: null, category: 'Core', description: 'Physics and chemistry principles and discoveries' },
        { id: 'sub-12-core-5', name: 'Personal Development', grade: 12, strand: null, category: 'Core', description: 'Self-awareness, stress management, relationships' },
        { id: 'sub-12-core-6', name: 'Understanding Culture, Society and Politics', grade: 12, strand: null, category: 'Core', description: 'Cultural evolution, socialization, and governance' },
        { id: 'sub-12-core-7', name: 'Physical Education and Health 3', grade: 12, strand: null, category: 'Core', description: 'Individual, dual, and team sports' },

        // Grade 12 - STEM
        { id: 'sub-12-stem-1', name: 'Major: General Physics 1 & 2', grade: 12, strand: 'STEM', category: 'Major', description: 'Mechanics, thermodynamics, electromagnetism, optics' },
        { id: 'sub-12-stem-2', name: 'Major: General Biology 2', grade: 12, strand: 'STEM', category: 'Major', description: 'Organismal biology, systematics, ecology' },
        { id: 'sub-12-stem-3', name: 'Major: General Chemistry 2', grade: 12, strand: 'STEM', category: 'Major', description: 'Intermolecular forces, kinetics, equilibria' },
        { id: 'sub-12-stem-4', name: 'Major: Capstone Research Project in Science & Tech', grade: 12, strand: 'STEM', category: 'Major', description: 'Original scientific research and innovation defense' },

        // Grade 12 - ABM
        { id: 'sub-12-abm-1', name: 'Major: Fundamentals of Accountancy, Business and Management 2', grade: 12, strand: 'ABM', category: 'Major', description: 'Financial statements, ratios, cash flows' },
        { id: 'sub-12-abm-2', name: 'Major: Business Finance', grade: 12, strand: 'ABM', category: 'Major', description: 'Financial management, capital budgeting, working capital' },
        { id: 'sub-12-abm-3', name: 'Major: Applied Economics in Business', grade: 12, strand: 'ABM', category: 'Major', description: 'Industry and market analysis' },
        { id: 'sub-12-abm-4', name: 'Major: Business Enterprise Simulation / Practicum', grade: 12, strand: 'ABM', category: 'Major', description: 'Actual business simulation and trade show' },

        // Grade 12 - HUMSS
        { id: 'sub-12-humss-1', name: 'Major: Creative Nonfiction', grade: 12, strand: 'HUMSS', category: 'Major', description: 'Memoir, travelogue, personal essay, profile' },
        { id: 'sub-12-humss-2', name: 'Major: Trends, Networks, and Critical Thinking in the 21st Century', grade: 12, strand: 'HUMSS', category: 'Major', description: 'Pattern analysis, global networks, strategic thinking' },
        { id: 'sub-12-humss-3', name: 'Major: Community Engagement, Solidarity and Citizenship', grade: 12, strand: 'HUMSS', category: 'Major', description: 'Community development and active citizenship' },
        { id: 'sub-12-humss-4', name: 'Major: Culminating Activity / Social Science Inquiries', grade: 12, strand: 'HUMSS', category: 'Major', description: 'Applied research in social sciences and community defense' },

        // Grade 12 - TVL
        { id: 'sub-12-tvl-1', name: 'Major: Food and Beverage Services NC II', grade: 12, strand: 'TVL', category: 'Major', description: 'Dining area operations, bar service, guest relations' },
        { id: 'sub-12-tvl-2', name: 'Major: Animation NC II', grade: 12, strand: 'TVL', category: 'Major', description: '2D and 3D digital animation and storyboarding' },
        { id: 'sub-12-tvl-3', name: 'Major: Electrical Installation and Maintenance NC II', grade: 12, strand: 'TVL', category: 'Major', description: 'Residential and commercial wiring and circuits' },
        { id: 'sub-12-tvl-4', name: 'Major: Work Immersion / On-the-Job Training', grade: 12, strand: 'TVL', category: 'Major', description: 'Industry immersion and actual workplace training' },

        // Grade 12 - GAS
        { id: 'sub-12-gas-1', name: 'Major: Humanities 2', grade: 12, strand: 'GAS', category: 'Major', description: 'Philosophy, arts, and ethics in modern society' },
        { id: 'sub-12-gas-2', name: 'Major: Social Science 2', grade: 12, strand: 'GAS', category: 'Major', description: 'Applied social science research and governance' },
        { id: 'sub-12-gas-3', name: 'Major: Organization and Management for General Track', grade: 12, strand: 'GAS', category: 'Major', description: 'Organizational leadership and teamwork' },
        { id: 'sub-12-gas-4', name: 'Major: Culminating Activity / Work Immersion', grade: 12, strand: 'GAS', category: 'Major', description: 'Career exploration and portfolio defense' }
    ];

    // ============================================
    // STATE
    // ============================================

    let subjects = loadSavedSubjects();
    let currentActiveGrade = 'all'; // 'all', 7, 8, 9, 10, 11, 12
    let currentActiveStrand = '';

    function loadSavedSubjects() {
        const saved = localStorage.getItem('plsnhs_admin_subjects');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Error parsing saved subjects, resetting to defaults');
            }
        }
        return [...DEFAULT_SUBJECTS];
    }

    function saveSubjects() {
        localStorage.setItem('plsnhs_admin_subjects', JSON.stringify(subjects));
        updateStats();
    }

    // ============================================
    // ALERTS
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 4000);
    }

    // ============================================
    // STATS
    // ============================================

    function updateStats() {
        const total = subjects.length;
        const jhs = subjects.filter(s => s.grade >= 7 && s.grade <= 10).length;
        const shs = subjects.filter(s => s.grade >= 11 && s.grade <= 12).length;

        if (totalSubjectsEl) totalSubjectsEl.textContent = total;
        if (jhsSubjectsEl) jhsSubjectsEl.textContent = jhs;
        if (shsSubjectsEl) shsSubjectsEl.textContent = shs;
        if (totalStrandsEl) totalStrandsEl.textContent = 5;
    }

    // ============================================
    // RENDER SUBJECTS ACCORDION
    // ============================================

    function renderSubjects() {
        if (!subjectsContainer) return;

        const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const gradeVal = gradeFilter ? gradeFilter.value : '';
        const strandVal = strandFilter ? strandFilter.value : '';

        // Filter subjects
        let filtered = subjects.filter(s => {
            const matchSearch = !search ||
                s.name.toLowerCase().includes(search) ||
                (s.description || '').toLowerCase().includes(search) ||
                (s.category || '').toLowerCase().includes(search) ||
                (s.strand || '').toLowerCase().includes(search);

            const matchGrade = !gradeVal || s.grade.toString() === gradeVal.toString();
            const matchStrand = !strandVal || (s.strand && s.strand.toUpperCase() === strandVal.toUpperCase());

            return matchSearch && matchGrade && matchStrand;
        });

        if (filtered.length === 0) {
            subjectsContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book-open"></i>
                    <h3>No subjects found</h3>
                    <p>Try adjusting your search query or grade level filter.</p>
                </div>
            `;
            return;
        }

        // Determine which grades to display
        let gradesToRender = [7, 8, 9, 10, 11, 12];
        if (gradeVal) {
            gradesToRender = [parseInt(gradeVal)];
        }

        let html = '';

        gradesToRender.forEach(gradeNum => {
            const gradeSubjects = filtered.filter(s => s.grade === gradeNum);
            if (gradeSubjects.length === 0) return;

            const isSeniorHigh = gradeNum === 11 || gradeNum === 12;

            html += `
                <div class="grade-section" data-grade="${gradeNum}">
                    <div class="grade-section-header" onclick="toggleGradeSection(${gradeNum})">
                        <h2>
                            <i class="fas fa-graduation-cap"></i>
                            Grade ${gradeNum} Curriculum
                            <span class="badge">${gradeSubjects.length} ${gradeSubjects.length === 1 ? 'Subject' : 'Subjects'}</span>
                        </h2>
                        <i class="fas fa-chevron-down toggle-icon" id="toggle-icon-${gradeNum}"></i>
                    </div>
                    <div class="grade-section-content" id="grade-content-${gradeNum}">
            `;

            if (!isSeniorHigh) {
                // Junior High School Table (Grades 7 - 10)
                html += `
                    <div class="strand-table-wrapper">
                        <table class="strand-subject-table">
                            <thead>
                                <tr>
                                    <th>Subject Details</th>
                                    <th>Category</th>
                                    <th>Prerequisites / Notes</th>
                                    <th style="width: 110px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                gradeSubjects.forEach(s => {
                    const catBadge = s.category === 'Elective' 
                        ? `<span class="badge" style="background: #e0e7ff; color: #3730a3;">Elective</span>`
                        : `<span class="badge" style="background: #dbeafe; color: #1e40af;">Core</span>`;

                    html += `
                        <tr>
                            <td>
                                <div class="subject-info">
                                    <div class="subject-icon">
                                        <i class="fas ${s.category === 'Elective' ? 'fa-star' : 'fa-book'}"></i>
                                    </div>
                                    <div class="subject-details">
                                        <h4>${s.name}</h4>
                                        <span class="description-text">Grade ${s.grade} Junior High Subject</span>
                                    </div>
                                </div>
                            </td>
                            <td>${catBadge}</td>
                            <td><span style="font-size: 12.5px; color: #64748b;">${s.description || 'Standard DepEd K-12 Subject'}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit" onclick="openEditModal('${s.id}')" title="Edit Subject">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="deleteSubject('${s.id}')" title="Delete Subject">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                // Senior High School (Grades 11 - 12) - Core & Strands
                const coreSubjects = gradeSubjects.filter(s => !s.strand);
                const strands = ['STEM', 'ABM', 'HUMSS', 'TVL', 'GAS'];

                // Core Section
                if (coreSubjects.length > 0 && !strandVal) {
                    html += `
                        <div class="strand-subject-section">
                            <div class="strand-subject-header" onclick="toggleStrandContent('core-${gradeNum}')">
                                <i class="fas fa-book-open"></i>
                                <h4>Core Curriculum Subjects (Common to all strands)</h4>
                                <span class="badge">${coreSubjects.length} Subjects</span>
                                <i class="fas fa-chevron-down strand-subject-toggle" id="toggle-core-${gradeNum}"></i>
                            </div>
                            <div class="strand-subject-content" id="strand-content-core-${gradeNum}">
                                <div class="strand-table-wrapper">
                                    <table class="strand-subject-table">
                                        <thead>
                                            <tr>
                                                <th>Subject Name</th>
                                                <th>Category</th>
                                                <th>Description</th>
                                                <th style="width: 110px;">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                    `;

                    coreSubjects.forEach(s => {
                        html += `
                            <tr>
                                <td>
                                    <div class="subject-info">
                                        <div class="subject-icon"><i class="fas fa-book"></i></div>
                                        <div class="subject-details">
                                            <h4>${s.name}</h4>
                                            <span class="description-text">Grade ${s.grade} Senior High Core</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="badge" style="background: #dbeafe; color: #1e40af;">Core</span></td>
                                <td><span style="font-size: 12.5px; color: #64748b;">${s.description || 'DepEd SHS Core Subject'}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn edit" onclick="openEditModal('${s.id}')" title="Edit Subject"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" onclick="deleteSubject('${s.id}')" title="Delete Subject"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Strands
                strands.forEach(strandName => {
                    if (strandVal && strandVal.toUpperCase() !== strandName.toUpperCase()) return;

                    const strandSubjects = gradeSubjects.filter(s => s.strand === strandName);
                    if (strandSubjects.length === 0) return;

                    const strandColors = {
                        'STEM': '#0284c7',
                        'ABM': '#16a34a',
                        'HUMSS': '#9333ea',
                        'TVL': '#ea580c',
                        'GAS': '#4b5563'
                    };

                    const strandColor = strandColors[strandName] || '#1B2A4A';

                    html += `
                        <div class="strand-subject-section">
                            <div class="strand-subject-header" onclick="toggleStrandContent('${strandName}-${gradeNum}')">
                                <i class="fas fa-layer-group" style="color: ${strandColor};"></i>
                                <h4>${strandName} Track — Specialized / Major Subjects</h4>
                                <span class="badge" style="background: ${strandColor};">${strandSubjects.length} Subjects</span>
                                <i class="fas fa-chevron-down strand-subject-toggle" id="toggle-${strandName}-${gradeNum}"></i>
                            </div>
                            <div class="strand-subject-content" id="strand-content-${strandName}-${gradeNum}">
                                <div class="strand-table-wrapper">
                                    <table class="strand-subject-table">
                                        <thead>
                                            <tr>
                                                <th>Specialized Subject</th>
                                                <th>Track</th>
                                                <th>Description</th>
                                                <th style="width: 110px;">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                    `;

                    strandSubjects.forEach(s => {
                        html += `
                            <tr>
                                <td>
                                    <div class="subject-info">
                                        <div class="subject-icon" style="background: rgba(27, 42, 74, 0.08); color: ${strandColor};">
                                            <i class="fas fa-atom"></i>
                                        </div>
                                        <div class="subject-details">
                                            <h4>${s.name}</h4>
                                            <span class="description-text">Grade ${s.grade} • ${s.strand} Major</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="badge" style="background: rgba(27, 42, 74, 0.1); color: #1B2A4A; font-weight: 700;">${s.strand}</span></td>
                                <td><span style="font-size: 12.5px; color: #64748b;">${s.description || 'Specialized Track Subject'}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn edit" onclick="openEditModal('${s.id}')" title="Edit Subject"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" onclick="deleteSubject('${s.id}')" title="Delete Subject"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        subjectsContainer.innerHTML = html;
    }

    // ============================================
    // TOGGLE ACCORDIONS
    // ============================================

    window.toggleGradeSection = function(gradeNum) {
        const content = document.getElementById(`grade-content-${gradeNum}`);
        const icon = document.getElementById(`toggle-icon-${gradeNum}`);
        if (!content) return;

        content.classList.toggle('collapsed');
        if (icon) icon.classList.toggle('rotated');
    };

    window.toggleStrandContent = function(key) {
        const content = document.getElementById(`strand-content-${key}`);
        const icon = document.getElementById(`toggle-${key}`);
        if (!content) return;

        content.classList.toggle('collapsed');
        if (icon) icon.classList.toggle('rotated');
    };

    // ============================================
    // EDIT & DELETE SUBJECT
    // ============================================

    window.openEditModal = function(id) {
        const subject = subjects.find(s => s.id === id);
        if (!subject || !editModal) return;

        editSubjectId.value = subject.id;
        editSubjectName.value = subject.name;
        editGradeId.value = subject.grade;
        editDescription.value = subject.description || '';

        const isSeniorHigh = subject.grade === 11 || subject.grade === 12;
        if (editStrandGroup) {
            editStrandGroup.style.display = isSeniorHigh ? 'block' : 'none';
            editStrand.value = subject.strand || '';
        }

        editModal.classList.add('show');
    };

    function closeEdit() {
        if (editModal) editModal.classList.remove('show');
    }

    if (closeEditModal) closeEditModal.addEventListener('click', closeEdit);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEdit);

    if (editGradeId) {
        editGradeId.addEventListener('change', function() {
            const gradeNum = parseInt(this.value);
            const isSeniorHigh = gradeNum === 11 || gradeNum === 12;
            if (editStrandGroup) {
                editStrandGroup.style.display = isSeniorHigh ? 'block' : 'none';
                if (!isSeniorHigh && editStrand) editStrand.value = '';
            }
        });
    }

    if (editSubjectForm) {
        editSubjectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = editSubjectId.value;
            const name = editSubjectName.value.trim();
            const grade = parseInt(editGradeId.value);
            const strand = (grade === 11 || grade === 12) && editStrand.value ? editStrand.value : null;
            const description = editDescription.value.trim();

            if (!name) {
                showAlert('Please enter a subject name', 'error');
                return;
            }

            const index = subjects.findIndex(s => s.id === id);
            if (index !== -1) {
                subjects[index] = {
                    ...subjects[index],
                    name,
                    grade,
                    strand,
                    description,
                    category: strand ? 'Major' : (name.toLowerCase().includes('elective') ? 'Elective' : 'Core')
                };

                saveSubjects();
                closeEdit();
                renderSubjects();
                showAlert(`✅ Subject "${name}" updated successfully!`, 'success');
            }
        });
    }

    window.deleteSubject = function(id) {
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        if (confirm(`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`)) {
            subjects = subjects.filter(s => s.id !== id);
            saveSubjects();
            renderSubjects();
            showAlert(`🗑️ Subject "${subject.name}" has been deleted.`, 'success');
        }
    };

    // ============================================
    // GRADE CARDS FILTER
    // ============================================

    if (gradeCardsContainer) {
        gradeCardsContainer.querySelectorAll('.grade-card').forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                gradeCardsContainer.querySelectorAll('.grade-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');

                const grade = this.dataset.grade;
                currentActiveGrade = grade;

                if (gradeFilter) {
                    gradeFilter.value = grade === 'all' ? '' : grade;
                }

                // Show/hide strand filter
                if (strandFilterWrapper) {
                    strandFilterWrapper.style.display = (grade === '11' || grade === '12') ? 'block' : 'none';
                    if (grade !== '11' && grade !== '12' && strandFilter) strandFilter.value = '';
                }

                renderSubjects();
            });
        });
    }

    // ============================================
    // ACTIONS BAR FILTER LISTENERS
    // ============================================

    if (gradeFilter) {
        gradeFilter.addEventListener('change', function() {
            const grade = this.value;
            currentActiveGrade = grade || 'all';

            // Sync grade cards
            if (gradeCardsContainer) {
                gradeCardsContainer.querySelectorAll('.grade-card').forEach(c => {
                    c.classList.toggle('active', c.dataset.grade === (grade || 'all'));
                });
            }

            // Show/hide strand filter
            if (strandFilterWrapper) {
                strandFilterWrapper.style.display = (grade === '11' || grade === '12') ? 'block' : 'none';
                if (grade !== '11' && grade !== '12' && strandFilter) strandFilter.value = '';
            }

            renderSubjects();
        });
    }

    if (strandFilter) {
        strandFilter.addEventListener('change', function() {
            renderSubjects();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderSubjects();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (gradeFilter) gradeFilter.value = '';
            if (strandFilter) strandFilter.value = '';
            if (searchInput) searchInput.value = '';
            if (strandFilterWrapper) strandFilterWrapper.style.display = 'none';

            if (gradeCardsContainer) {
                gradeCardsContainer.querySelectorAll('.grade-card').forEach(c => {
                    c.classList.toggle('active', c.dataset.grade === 'all');
                });
            }

            renderSubjects();
        });
    }

    // Close modal on click outside
    window.addEventListener('click', function(e) {
        if (e.target === editModal) closeEdit();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && editModal && editModal.classList.contains('show')) {
            closeEdit();
        }
    });

    // ============================================
    // INIT
    // ============================================

    updateStats();
    renderSubjects();

    console.log('✅ Subjects page fully initialized');

})();
