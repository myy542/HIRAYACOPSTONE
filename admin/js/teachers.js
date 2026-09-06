// ===== TEACHERS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');

    // ===== DATA =====

    // Sample teachers data
    let teachers = [
        { 
            id: 1, 
            fullname: 'Maria Santos', 
            email: 'maria.santos@plshs.edu.ph', 
            id_number: 'PLSNHS-TCH-000001',
            profile_picture: null,
            created_at: '2025-06-15 10:30:00',
            section_count: 2,
            sections: 'Grade 7 - Section A, Grade 8 - Section B'
        },
        { 
            id: 2, 
            fullname: 'Juan Dela Cruz', 
            email: 'juan.dela@plshs.edu.ph', 
            id_number: 'PLSNHS-TCH-000002',
            profile_picture: null,
            created_at: '2025-06-20 09:00:00',
            section_count: 1,
            sections: 'Grade 10 - Section A'
        },
        { 
            id: 3, 
            fullname: 'Ana Reyes', 
            email: 'ana.reyes@plshs.edu.ph', 
            id_number: 'PLSNHS-TCH-000003',
            profile_picture: null,
            created_at: '2025-07-01 14:20:00',
            section_count: 0,
            sections: null
        },
        { 
            id: 4, 
            fullname: 'Carlos Mendoza', 
            email: 'carlos.m@plshs.edu.ph', 
            id_number: 'PLSNHS-TCH-000004',
            profile_picture: null,
            created_at: '2025-07-10 11:00:00',
            section_count: 1,
            sections: 'Grade 11 - STEM A'
        },
        { 
            id: 5, 
            fullname: 'Elena Garcia', 
            email: 'elena.g@plshs.edu.ph', 
            id_number: 'PLSNHS-TCH-000005',
            profile_picture: null,
            created_at: '2025-08-01 08:30:00',
            section_count: 0,
            sections: null
        }
    ];

    // ===== FUNCTIONS =====

    // Update statistics
    function updateStats() {
        const total = teachers.length;
        const withSections = teachers.filter(t => t.section_count > 0).length;
        const withoutSections = total - withSections;

        document.getElementById('totalTeachers').textContent = total;
        document.getElementById('withSections').textContent = withSections;
        document.getElementById('withoutSections').textContent = withoutSections;
    }

    // Render table
    function renderTable() {
        const status = statusFilter.value;
        const search = searchInput.value.toLowerCase().trim();

        let filtered = [...teachers];

        if (status === 'with-sections') {
            filtered = filtered.filter(t => t.section_count > 0);
        } else if (status === 'without-sections') {
            filtered = filtered.filter(t => t.section_count === 0);
        }

        if (search) {
            filtered = filtered.filter(t => 
                t.fullname.toLowerCase().includes(search) ||
                t.email.toLowerCase().includes(search)
            );
        }

        recordCount.textContent = `Total: ${filtered.length} teachers`;

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-data">
                            <i class="fas fa-chalkboard-user"></i>
                            <h3>No Teachers Found</h3>
                            <p>Click "Add New Teacher" to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(teacher => {
            const initial = teacher.fullname.charAt(0).toUpperCase();
            const joinedDate = new Date(teacher.created_at);
            const formattedDate = joinedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const hasSections = teacher.section_count > 0;
            
            // Sections tags
            let sectionsHtml = '';
            if (hasSections && teacher.sections) {
                const sectionList = teacher.sections.split(', ');
                sectionsHtml = `
                    <div class="section-tags">
                        ${sectionList.map(s => `<span class="section-tag">${s}</span>`).join('')}
                    </div>
                `;
            } else {
                sectionsHtml = `<span class="badge badge-warning">No sections assigned</span>`;
            }

            // Status badge
            const statusBadge = hasSections
                ? `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Adviser</span>`
                : `<span class="badge badge-warning"><i class="fas fa-clock"></i> Available</span>`;

            html += `
                <tr>
                    <td>
                        <div class="teacher-info">
                            <div class="teacher-avatar">${initial}</div>
                            <div class="teacher-details">
                                <h4>${teacher.fullname}</h4>
                                <span><i class="fas fa-calendar-alt"></i> Joined: ${formattedDate}</span>
                            </div>
                        </div>
                    </td>
                    <td><i class="fas fa-envelope"></i> ${teacher.email}</td>
                    <td>
                        <span class="badge badge-info">
                            ${teacher.id_number || 'N/A'}
                        </span>
                    </td>
                    <td>${sectionsHtml}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-btns">
                            <a href="view_teacher.html?id=${teacher.id}" class="action-btn view" title="View Teacher">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="edit_teacher.html?id=${teacher.id}" class="action-btn edit" title="Edit Teacher">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button class="action-btn delete" onclick="deleteTeacher(${teacher.id})" title="Delete Teacher">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    // Delete teacher
    window.deleteTeacher = function(id) {
        const teacher = teachers.find(t => t.id === id);
        if (!teacher) return;

        // Check if teacher is assigned as adviser (simulated)
        const hasSections = teacher.section_count > 0;
        if (hasSections) {
            showAlert('Cannot delete teacher because they are assigned as adviser to a section.', 'error');
            return;
        }

        if (confirm(`Delete teacher "${teacher.fullname}"?`)) {
            teachers = teachers.filter(t => t.id !== id);
            showAlert('✅ Teacher deleted successfully!', 'success');
            updateStats();
            renderTable();
        }
    };

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

    // ===== EVENT LISTENERS =====

    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', renderTable);
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }

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

    updateStats();
    renderTable();
});