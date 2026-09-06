// ===== VIEW STUDENT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');

    // ===== STUDENT DATA =====

    const studentData = {
        id: 1,
        fullname: 'Juan Dela Cruz',
        email: 'juan.dela@plshs.edu.ph',
        id_number: 'PLSNHS-STU-000001',
        created_at: '2026-06-15 10:30:00',
        firstname: 'Juan',
        middlename: 'D.',
        lastname: 'Dela Cruz',
        birthdate: '2008-06-15',
        gender: 'Male',
        status: 'Enrolled',
        profile_picture: null
    };

    // Current enrollment
    const currentEnrollment = {
        id: 1,
        grade_name: 'Grade 11',
        strand: 'STEM',
        school_year: '2026-2027',
        created_at: '2026-06-20 14:30:00',
        form_138: null
    };

    // Enrollment history
    const historyData = [
        { id: 1, school_year: '2025-2026', grade_name: 'Grade 10', strand: null, status: 'Enrolled', created_at: '2025-06-15 10:30:00' },
        { id: 2, school_year: '2026-2027', grade_name: 'Grade 11', strand: 'STEM', status: 'Enrolled', created_at: '2026-06-20 14:30:00' }
    ];

    // ===== FUNCTIONS =====

    // Format date
    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
    }

    // Calculate age
    function calculateAge(birthdate) {
        if (!birthdate) return null;
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
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

    // Check if strand should be shown
    function shouldShowStrand(gradeName) {
        return ['Grade 11', 'Grade 12'].includes(gradeName);
    }

    // Render profile
    function renderProfile() {
        const initial = studentData.fullname.charAt(0).toUpperCase();
        const daysActive = calculateDaysActive(studentData.created_at);

        document.getElementById('avatarInitial').textContent = initial;
        document.getElementById('studentName').textContent = studentData.fullname;
        document.getElementById('studentEmail').textContent = studentData.email;
        document.getElementById('studentIdNumber').textContent = studentData.id_number || 'Not assigned';
        document.getElementById('studentRegistered').textContent = formatDate(studentData.created_at);
        document.getElementById('studentDaysActive').textContent = daysActive;

        // Status badge
        const statusClass = studentData.status.toLowerCase();
        const badge = document.getElementById('statusBadge');
        badge.className = `profile-badge badge-${statusClass}`;
        badge.innerHTML = `
            <i class="fas fa-${studentData.status === 'Enrolled' ? 'check-circle' : 'clock'}"></i>
            Current Status: ${studentData.status}
        `;
    }

    // Render personal info
    function renderPersonalInfo() {
        const grid = document.getElementById('personalInfoGrid');
        const age = calculateAge(studentData.birthdate);
        const genderIcon = studentData.gender === 'Male' ? 'mars' : 
                          studentData.gender === 'Female' ? 'venus' : 'genderless';

        grid.innerHTML = `
            <div class="info-item">
                <div class="info-label">First Name</div>
                <div class="info-value">
                    <i class="fas fa-user"></i>
                    ${studentData.firstname || 'Not specified'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Middle Name</div>
                <div class="info-value">
                    <i class="fas fa-user"></i>
                    ${studentData.middlename || 'Not specified'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Name</div>
                <div class="info-value">
                    <i class="fas fa-user"></i>
                    ${studentData.lastname || 'Not specified'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Birthdate</div>
                <div class="info-value">
                    <i class="fas fa-cake-candles"></i>
                    ${studentData.birthdate ? formatDate(studentData.birthdate) : 'Not specified'}
                    ${age !== null ? `<span class="age-text">(Age: ${age} years)</span>` : ''}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">
                    <i class="fas fa-${genderIcon}"></i>
                    ${studentData.gender || 'Not specified'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Student ID Number</div>
                <div class="info-value">
                    <i class="fas fa-qrcode"></i>
                    ${studentData.id_number || 'Not assigned'}
                </div>
            </div>
        `;
    }

    // Render current enrollment
    function renderCurrentEnrollment() {
        const grid = document.getElementById('enrollmentInfoGrid');
        const card = document.getElementById('currentEnrollmentCard');

        if (!currentEnrollment) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        
        let strandHtml = '';
        if (shouldShowStrand(currentEnrollment.grade_name) && currentEnrollment.strand) {
            strandHtml = `
                <div class="info-item">
                    <div class="info-label">Strand</div>
                    <div class="info-value">
                        <i class="fas fa-tag"></i>
                        ${currentEnrollment.strand}
                    </div>
                </div>
            `;
        }

        let form138Html = '';
        if (currentEnrollment.form_138) {
            form138Html = `
                <div class="info-item" style="grid-column: 1 / -1; border-bottom: none;">
                    <div class="info-label">Form 138</div>
                    <div class="info-value">
                        <i class="fas fa-file-pdf"></i>
                        <a href="../${currentEnrollment.form_138}" target="_blank" class="document-link">
                            View Document
                        </a>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = `
            <div class="info-item">
                <div class="info-label">Grade Level</div>
                <div class="info-value">
                    <i class="fas fa-layer-group"></i>
                    ${currentEnrollment.grade_name}
                </div>
            </div>
            ${strandHtml}
            <div class="info-item">
                <div class="info-label">School Year</div>
                <div class="info-value">
                    <i class="fas fa-calendar"></i>
                    ${currentEnrollment.school_year}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Enrollment Date</div>
                <div class="info-value">
                    <i class="fas fa-clock"></i>
                    ${formatDate(currentEnrollment.created_at)}
                </div>
            </div>
            ${form138Html}
        `;

        // Update view link
        const viewLink = card.querySelector('.view-link');
        if (viewLink) {
            viewLink.href = `view_enrollment.html?id=${currentEnrollment.id}`;
        }
    }

    // Render history
    function renderHistory() {
        const container = document.getElementById('historyContainer');

        if (historyData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-file-signature"></i>
                    <h3>No Enrollment Records</h3>
                    <p>This student has no enrollment history.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="enrollments-table">
                <thead>
                    <tr>
                        <th>School Year</th>
                        <th>Grade Level</th>
                        <th>Strand</th>
                        <th>Status</th>
                        <th>Applied Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        historyData.forEach(record => {
            const statusClass = record.status.toLowerCase();
            let strandHtml = '—';
            if (shouldShowStrand(record.grade_name) && record.strand) {
                strandHtml = `<span class="strand-tag">${record.strand}</span>`;
            }

            html += `
                <tr>
                    <td>${record.school_year}</td>
                    <td>${record.grade_name}</td>
                    <td>${strandHtml}</td>
                    <td>
                        <span class="badge badge-${statusClass}">
                            ${record.status}
                        </span>
                    </td>
                    <td>${formatDate(record.created_at)}</td>
                    <td>
                        <a href="view_enrollment.html?id=${record.id}" class="view-link">
                            View <i class="fas fa-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    }

    // Delete student
    window.deleteStudent = function() {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone and will remove all associated data.')) {
            showAlert('✅ Student deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'students.html';
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
    renderPersonalInfo();
    renderCurrentEnrollment();
    renderHistory();
});