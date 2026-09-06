// ===== SECTIONS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const gradeFilter = document.getElementById('gradeFilter');
    const adviserFilter = document.getElementById('adviserFilter');
    const searchInput = document.getElementById('searchInput');
    const gradeSummary = document.getElementById('gradeSummary');

    // Modal Elements
    const addModal = document.getElementById('addModal');
    const editModal = document.getElementById('editModal');
    const scheduleModal = document.getElementById('scheduleModal');
    const addForm = document.getElementById('addSectionForm');
    const editForm = document.getElementById('editSectionForm');

    // ===== DATA =====

    // Sample sections data
    let sections = [
        { id: 1, section_name: 'Section A - STEM', grade_name: 'Grade 11', adviser: 'Maria Santos', adviser_id: 1 },
        { id: 2, section_name: 'Section B - ABM', grade_name: 'Grade 11', adviser: 'Juan Dela Cruz', adviser_id: 2 },
        { id: 3, section_name: 'Section C - HUMSS', grade_name: 'Grade 11', adviser: null, adviser_id: null },
        { id: 4, section_name: 'Section A', grade_name: 'Grade 10', adviser: 'Ana Reyes', adviser_id: 3 },
        { id: 5, section_name: 'Section B', grade_name: 'Grade 10', adviser: null, adviser_id: null },
        { id: 6, section_name: 'Section A', grade_name: 'Grade 7', adviser: 'Carlos Mendoza', adviser_id: 4 },
        { id: 7, section_name: 'Section B', grade_name: 'Grade 7', adviser: null, adviser_id: null },
        { id: 8, section_name: 'STEM A', grade_name: 'Grade 12', adviser: 'Maria Santos', adviser_id: 1 }
    ];

    // Teachers data
    const teachers = [
        { id: 1, fullname: 'Maria Santos' },
        { id: 2, fullname: 'Juan Dela Cruz' },
        { id: 3, fullname: 'Ana Reyes' },
        { id: 4, fullname: 'Carlos Mendoza' }
    ];

    // Grade levels
    const gradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

    // ===== FUNCTIONS =====

    // Update statistics
    function updateStats() {
        const total = sections.length;
        const withAdviser = sections.filter(s => s.adviser !== null).length;
        const withoutAdviser = total - withAdviser;

        document.getElementById('totalSections').textContent = total;
        document.getElementById('withAdviser').textContent = withAdviser;
        document.getElementById('withoutAdviser').textContent = withoutAdviser;
    }

    // Render grade summary
    function renderGradeSummary() {
        const counts = {};
        gradeLevels.forEach(grade => {
            counts[grade] = sections.filter(s => s.grade_name === grade).length;
        });

        let html = '';
        gradeLevels.forEach(grade => {
            html += `
                <div class="grade-summary-item">
                    <span class="grade-name">${grade}</span>
                    <span class="grade-count">${counts[grade] || 0} sections</span>
                </div>
            `;
        });

        gradeSummary.innerHTML = html;
    }

    // Render table
    function renderTable() {
        const grade = gradeFilter.value;
        const adviser = adviserFilter.value;
        const search = searchInput.value.toLowerCase().trim();

        let filtered = [...sections];

        if (grade) {
            filtered = filtered.filter(s => s.grade_name === grade);
        }
        if (adviser === 'assigned') {
            filtered = filtered.filter(s => s.adviser !== null);
        } else if (adviser === 'unassigned') {
            filtered = filtered.filter(s => s.adviser === null);
        }
        if (search) {
            filtered = filtered.filter(s => 
                s.section_name.toLowerCase().includes(search) ||
                (s.adviser && s.adviser.toLowerCase().includes(search)) ||
                s.grade_name.toLowerCase().includes(search)
            );
        }

        recordCount.textContent = `Total: ${filtered.length} sections`;

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="no-data">
                            <i class="fas fa-layer-group"></i>
                            <h3>No Sections Found</h3>
                            <p>Click "Add New Section" to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(section => {
            const initial = section.adviser ? section.adviser.charAt(0).toUpperCase() : '?';
            
            html += `
                <tr>
                    <td>
                        <div class="section-info">
                            <div class="section-icon"><i class="fas fa-users"></i></div>
                            <div class="section-details">
                                <h4>${section.section_name}</h4>
                                <span>ID: ${section.id}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="grade-tag">${section.grade_name}</span></td>
                    <td>
                        ${section.adviser ? `
                            <div class="adviser-info">
                                <div class="adviser-avatar">${initial}</div>
                                <span class="adviser-name">${section.adviser}</span>
                            </div>
                        ` : `
                            <span class="no-adviser">Not Assigned</span>
                        `}
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn schedule" onclick="openScheduleModal(${section.id}, '${section.section_name}')" title="Manage Schedule"><i class="fas fa-calendar-alt"></i></button>
                            <button class="action-btn edit" onclick="openEditModal(${section.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" onclick="deleteSection(${section.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
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

    // Add section
    window.addSection = function(data) {
        const newSection = {
            id: sections.length + 1,
            section_name: data.section_name,
            grade_name: data.grade_name,
            adviser: data.adviser || null,
            adviser_id: data.adviser_id || null
        };
        sections.push(newSection);
        updateStats();
        renderGradeSummary();
        renderTable();
        showAlert('✅ Section added successfully!', 'success');
    };

    // Edit section
    window.editSection = function(id, data) {
        const section = sections.find(s => s.id === id);
        if (section) {
            section.section_name = data.section_name;
            section.grade_name = data.grade_name;
            section.adviser = data.adviser || null;
            section.adviser_id = data.adviser_id || null;
            updateStats();
            renderGradeSummary();
            renderTable();
            showAlert('✅ Section updated successfully!', 'success');
        }
    };

    // Delete section
    window.deleteSection = function(id) {
        const section = sections.find(s => s.id === id);
        if (!section) return;

        // Check if section has enrolled students (simulated)
        const hasEnrollments = false; // In real app, check database

        if (hasEnrollments) {
            showAlert('Cannot delete section because it has enrolled students.', 'error');
            return;
        }

        if (confirm(`Delete section "${section.section_name}"?`)) {
            sections = sections.filter(s => s.id !== id);
            updateStats();
            renderGradeSummary();
            renderTable();
            showAlert('✅ Section deleted successfully!', 'success');
        }
    };

    // ===== MODAL FUNCTIONS =====

    // Open add modal
    window.openAddModal = function() {
        addModal.classList.add('show');
        document.getElementById('addSectionName').value = '';
        document.getElementById('addGradeId').value = '';
        document.getElementById('addAdviserId').value = '';
    };

    // Close add modal
    window.closeAddModal = function() {
        addModal.classList.remove('show');
    };

    // Open edit modal
    window.openEditModal = function(id) {
        const section = sections.find(s => s.id === id);
        if (!section) return;

        document.getElementById('editSectionId').value = section.id;
        document.getElementById('editSectionName').value = section.section_name;
        document.getElementById('editGradeId').value = section.grade_name.replace('Grade ', '');
        document.getElementById('editAdviserId').value = section.adviser_id || '';
        
        editModal.classList.add('show');
    };

    // Close edit modal
    window.closeEditModal = function() {
        editModal.classList.remove('show');
    };

    // Open schedule modal
    window.openScheduleModal = function(id, name) {
        document.getElementById('scheduleSectionName').textContent = name;
        scheduleModal.classList.add('show');
    };

    // Close schedule modal
    window.closeScheduleModal = function() {
        scheduleModal.classList.remove('show');
    };

    // ===== FORM HANDLERS =====

    // Add form
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const sectionName = document.getElementById('addSectionName').value.trim();
            const gradeId = document.getElementById('addGradeId').value;
            const adviserId = document.getElementById('addAdviserId').value;

            if (!sectionName || !gradeId) {
                showAlert('Please fill in all required fields.', 'error');
                return;
            }

            const gradeName = `Grade ${gradeId}`;
            const adviser = adviserId ? teachers.find(t => t.id == adviserId)?.fullname || null : null;

            // Check for duplicate
            const exists = sections.some(s => s.section_name === sectionName && s.grade_name === gradeName);
            if (exists) {
                showAlert('Section already exists for this grade level.', 'error');
                return;
            }

            addSection({
                section_name: sectionName,
                grade_name: gradeName,
                adviser: adviser,
                adviser_id: adviserId || null
            });

            closeAddModal();
            addForm.reset();
        });
    }

    // Edit form
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = parseInt(document.getElementById('editSectionId').value);
            const sectionName = document.getElementById('editSectionName').value.trim();
            const gradeId = document.getElementById('editGradeId').value;
            const adviserId = document.getElementById('editAdviserId').value;

            if (!sectionName || !gradeId) {
                showAlert('Please fill in all required fields.', 'error');
                return;
            }

            const gradeName = `Grade ${gradeId}`;
            const adviser = adviserId ? teachers.find(t => t.id == adviserId)?.fullname || null : null;

            // Check for duplicate (excluding current)
            const exists = sections.some(s => 
                s.section_name === sectionName && 
                s.grade_name === gradeName && 
                s.id !== id
            );
            if (exists) {
                showAlert('Section already exists for this grade level.', 'error');
                return;
            }

            editSection(id, {
                section_name: sectionName,
                grade_name: gradeName,
                adviser: adviser,
                adviser_id: adviserId || null
            });

            closeEditModal();
        });
    }

    // ===== EVENT LISTENERS =====

    // Filter changes
    if (gradeFilter) gradeFilter.addEventListener('change', renderTable);
    if (adviserFilter) adviserFilter.addEventListener('change', renderTable);
    if (searchInput) searchInput.addEventListener('input', renderTable);

    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target === addModal) closeAddModal();
        if (e.target === editModal) closeEditModal();
        if (e.target === scheduleModal) closeScheduleModal();
    });

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
    renderGradeSummary();
    renderTable();
});