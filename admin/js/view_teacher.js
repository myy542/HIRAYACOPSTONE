// ===== VIEW TEACHER JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');

    // ===== TEACHER DATA =====

    const teacherData = {
        id: 1,
        fullname: 'Maria Santos',
        email: 'maria.santos@plshs.edu.ph',
        id_number: 'PLSNHS-TCH-000001',
        created_at: '2026-06-15 10:30:00',
        profile_picture: null
    };

    // Sections data
    const sectionsData = [
        { id: 1, section_name: 'Grade 7 - Section A', grade_name: 'Grade 7', student_count: 35 },
        { id: 2, section_name: 'Grade 10 - Section B', grade_name: 'Grade 10', student_count: 32 },
        { id: 3, section_name: 'Grade 11 - STEM A', grade_name: 'Grade 11', student_count: 28 }
    ];

    // Subjects data
    const subjectsData = [
        { id: 1, subject_name: 'Mathematics', grade_name: 'Grade 7' },
        { id: 2, subject_name: 'Mathematics', grade_name: 'Grade 8' },
        { id: 3, subject_name: 'General Mathematics', grade_name: 'Grade 11' },
        { id: 4, subject_name: 'Statistics and Probability', grade_name: 'Grade 11' }
    ];

    // ===== FUNCTIONS =====

    // Format date
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
    }

    // Calculate days active
    function calculateDaysActive(createdAt) {
        const created = new Date(createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - created);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Show alert
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // Render profile
    function renderProfile() {
        const initial = teacherData.fullname.charAt(0).toUpperCase();
        const daysActive = calculateDaysActive(teacherData.created_at);

        document.getElementById('avatarInitial').textContent = initial;
        document.getElementById('teacherName').textContent = teacherData.fullname;
        document.getElementById('teacherEmail').textContent = teacherData.email;
        document.getElementById('teacherIdNumber').textContent = teacherData.id_number || 'Not assigned';
        document.getElementById('teacherRegistered').textContent = formatDate(teacherData.created_at);
        document.getElementById('teacherDaysActive').textContent = daysActive;
    }

    // Render stats
    function renderStats() {
        const totalSections = sectionsData.length;
        const totalStudents = sectionsData.reduce((acc, section) => acc + section.student_count, 0);
        const totalSubjects = subjectsData.length;

        document.getElementById('statSections').textContent = totalSections;
        document.getElementById('statStudents').textContent = totalStudents;
        document.getElementById('statSubjects').textContent = totalSubjects;
    }

    // Render sections
    function renderSections() {
        const container = document.getElementById('sectionsContainer');

        if (sectionsData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-layer-group"></i>
                    <h3>No Advisory Sections</h3>
                    <p>This teacher is not assigned as adviser to any section.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="sections-grid">`;

        sectionsData.forEach(section => {
            html += `
                <div class="section-card">
                    <h4><i class="fas fa-users"></i> ${section.section_name}</h4>
                    <div class="section-details">
                        <span><i class="fas fa-layer-group"></i> ${section.grade_name}</span>
                    </div>
                    <div class="section-stats">
                        <div class="section-stat">
                            <div class="value">${section.student_count}</div>
                            <div class="label">Students</div>
                        </div>
                    </div>
                    <a href="view_section.html?id=${section.id}" class="view-link">
                        View Section <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // Render subjects
    function renderSubjects() {
        const container = document.getElementById('subjectsContainer');

        if (subjectsData.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px;">
                    <i class="fas fa-book"></i>
                    <p>No subjects assigned to this teacher.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="subjects-list">`;

        subjectsData.forEach(subject => {
            html += `
                <span class="subject-tag">
                    <i class="fas fa-book-open"></i>
                    ${subject.subject_name}
                    <span class="subject-grade">(${subject.grade_name})</span>
                </span>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // Delete teacher
    window.deleteTeacher = function() {
        if (confirm('Are you sure you want to delete this teacher? This action cannot be undone and will remove all associated data.')) {
            showAlert('✅ Teacher deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'teachers.html';
            }, 1500);
        }
    };

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== INIT =====

    renderProfile();
    renderStats();
    renderSections();
    renderSubjects();
});