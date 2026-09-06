/**
 * Sections Management - Interactive JavaScript
 * No hardcoded data - all data comes from PHP via window.sectionsData
 */

(function() {
    'use strict';

    console.log('📚 Sections Management ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Stats
    const totalSections = document.getElementById('totalSections');
    const totalStudents = document.getElementById('totalStudents');
    const sectionsWithAdviser = document.getElementById('sectionsWithAdviser');
    const currentYear = document.getElementById('currentYear');

    // Filters
    const gradeFilter = document.getElementById('gradeFilter');
    const searchInput = document.getElementById('searchInput');
    const sectionsGrid = document.getElementById('sectionsGrid');

    // Add Modal
    const addModal = document.getElementById('addModal');
    const addSectionForm = document.getElementById('addSectionForm');
    const addSectionName = document.getElementById('addSectionName');
    const addGradeId = document.getElementById('addGradeId');
    const addAdviserId = document.getElementById('addAdviserId');

    // Edit Modal
    const editModal = document.getElementById('editModal');
    const editSectionForm = document.getElementById('editSectionForm');
    const editSectionId = document.getElementById('editSectionId');
    const editSectionName = document.getElementById('editSectionName');
    const editGradeId = document.getElementById('editGradeId');
    const editAdviserId = document.getElementById('editAdviserId');
    const editWarning = document.getElementById('editWarning');
    const editStudentCount = document.getElementById('editStudentCount');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.sectionsData || {
        sections: [],
        grade_levels: [],
        teachers: [],
        edit_section: null,
        stats: {
            total: 0,
            students: 0,
            with_adviser: 0
        }
    };

    // ============================================
    // SET ADMIN NAME
    // ============================================

    if (adminName) adminName.textContent = 'Registrar';
    if (adminInitial) adminInitial.textContent = 'R';

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../auth/login.html';
        });
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // ============================================
    // LOAD DATA
    // ============================================

    function loadData() {
        // Stats
        if (totalSections) totalSections.textContent = data.stats.total;
        if (totalStudents) totalStudents.textContent = data.stats.students;
        if (sectionsWithAdviser) sectionsWithAdviser.textContent = data.stats.with_adviser;
        if (currentYear) currentYear.textContent = new Date().getFullYear();

        // Populate dropdowns
        populateGradeFilter();
        populateAddFormDropdowns();
        populateEditFormDropdowns();

        // Render sections
        renderSections();

        // Check if edit modal should open
        if (data.edit_section) {
            openEditModal(data.edit_section);
        }
    }

    // ============================================
    // POPULATE DROPDOWNS
    // ============================================

    function populateGradeFilter() {
        if (!gradeFilter) return;
        const grades = data.grade_levels || [];
        gradeFilter.innerHTML = '<option value="">All Grades</option>';
        grades.forEach(grade => {
            gradeFilter.innerHTML += `
                <option value="${grade.grade_name}">${grade.grade_name}</option>
            `;
        });
    }

    function populateAddFormDropdowns() {
        // Grade levels
        if (addGradeId) {
            const grades = data.grade_levels || [];
            addGradeId.innerHTML = '<option value="">Select Grade Level</option>';
            grades.forEach(grade => {
                addGradeId.innerHTML += `
                    <option value="${grade.id}">${grade.grade_name}</option>
                `;
            });
        }

        // Teachers
        if (addAdviserId) {
            const teachers = data.teachers || [];
            addAdviserId.innerHTML = '<option value="">Select Teacher (Optional)</option>';
            teachers.forEach(teacher => {
                addAdviserId.innerHTML += `
                    <option value="${teacher.id}">${teacher.fullname}</option>
                `;
            });
        }
    }

    function populateEditFormDropdowns() {
        // Grade levels
        if (editGradeId) {
            const grades = data.grade_levels || [];
            editGradeId.innerHTML = '<option value="">Select Grade Level</option>';
            grades.forEach(grade => {
                editGradeId.innerHTML += `
                    <option value="${grade.id}">${grade.grade_name}</option>
                `;
            });
        }

        // Teachers
        if (editAdviserId) {
            const teachers = data.teachers || [];
            editAdviserId.innerHTML = '<option value="">Select Teacher (Optional)</option>';
            teachers.forEach(teacher => {
                editAdviserId.innerHTML += `
                    <option value="${teacher.id}">${teacher.fullname}</option>
                `;
            });
        }
    }

    // ============================================
    // RENDER SECTIONS
    // ============================================

    function renderSections(filteredSections) {
        const sections = filteredSections || data.sections || [];

        if (sections.length === 0) {
            sectionsGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-layer-group"></i>
                    <h3>No Sections Found</h3>
                    <p>Click "Add New Section" to create your first section.</p>
                </div>
            `;
            return;
        }

        let html = '';
        sections.forEach(section => {
            const initial = section.adviser_name ? section.adviser_name.charAt(0) : '?';
            const hasAdviser = section.adviser_name && section.adviser_name !== '';

            html += `
                <div class="section-card" data-grade="${section.grade_name || ''}">
                    <div class="section-header">
                        <div class="section-icon"><i class="fas fa-users"></i></div>
                        <span class="section-badge">${section.student_count || 0} Students</span>
                    </div>
                    <div class="section-name">${section.section_name || 'Unknown'}</div>
                    <div class="grade-level"><i class="fas fa-layer-group"></i> ${section.grade_name || 'N/A'}</div>
                    
                    <div class="adviser-info">
                        <div class="adviser-avatar">${initial}</div>
                        <div class="adviser-details">
                            <div class="adviser-label">Class Adviser</div>
                            <div class="adviser-name">${section.adviser_name || 'Not Assigned'}</div>
                        </div>
                    </div>

                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-value">${section.student_count || 0}</div>
                            <div class="stat-label">Students</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">-</div>
                            <div class="stat-label">Subjects</div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <a href="section_students.html?id=${section.id}" class="btn-action btn-students" title="View Students">
                            <i class="fas fa-users"></i> Students
                        </a>
                        <button class="btn-action btn-edit" onclick="openEditModalById(${section.id})" title="Edit Section">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteSection(${section.id}, '${section.section_name || ''}', ${section.student_count || 0})" title="Delete Section">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        sectionsGrid.innerHTML = html;
    }

    // ============================================
    // FILTER SECTIONS
    // ============================================

    function filterSections() {
        const grade = gradeFilter ? gradeFilter.value : '';
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = data.sections || [];

        if (grade) {
            filtered = filtered.filter(s => s.grade_name === grade);
        }

        if (search) {
            filtered = filtered.filter(s => 
                s.section_name && s.section_name.toLowerCase().includes(search)
            );
        }

        renderSections(filtered);
    }

    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterSections);
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterSections, 300);
        });
    }

    // ============================================
    // ADD SECTION
    // ============================================

    function openAddModal() {
        addModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        addSectionForm.reset();
    }

    window.openAddModal = openAddModal;

    function closeAddModal() {
        addModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    window.closeAddModal = closeAddModal;

    if (addSectionForm) {
        addSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const name = formData.get('section_name');
            const gradeId = formData.get('grade_id');
            const adviserId = formData.get('adviser_id');

            if (!name || !gradeId) {
                showAlert('❌ Please fill in all required fields.', 'error');
                return;
            }

            // Simulate AJAX request
            const btn = this.querySelector('.btn-save');
            btn.disabled = true;
            btn.textContent = 'Adding...';

            setTimeout(() => {
                const newSection = {
                    id: Date.now(),
                    section_name: name,
                    grade_id: parseInt(gradeId),
                    grade_name: addGradeId.options[addGradeId.selectedIndex].text,
                    adviser_id: adviserId ? parseInt(adviserId) : null,
                    adviser_name: adviserId ? addAdviserId.options[addAdviserId.selectedIndex].text : null,
                    student_count: 0
                };

                data.sections.unshift(newSection);
                data.stats.total++;
                updateStats();
                renderSections();
                filterSections();

                btn.disabled = false;
                btn.textContent = 'Add Section';
                closeAddModal();
                showAlert(`✅ Section "${name}" added successfully!`, 'success');
            }, 800);
        });
    }

    // ============================================
    // EDIT SECTION
    // ============================================

    function openEditModalById(id) {
        const section = data.sections.find(s => s.id === id);
        if (section) {
            openEditModal(section);
        }
    }

    window.openEditModalById = openEditModalById;

    function openEditModal(section) {
        if (!section) return;

        editSectionId.value = section.id;
        editSectionName.value = section.section_name || '';
        editGradeId.value = section.grade_id || '';
        editAdviserId.value = section.adviser_id || '';

        // Show warning if section has students
        const studentCount = section.student_count || 0;
        if (studentCount > 0) {
            editWarning.style.display = 'block';
            editStudentCount.textContent = studentCount;
        } else {
            editWarning.style.display = 'none';
        }

        editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    window.openEditModal = openEditModal;

    function closeEditModal() {
        editModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    window.closeEditModal = closeEditModal;

    if (editSectionForm) {
        editSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const id = formData.get('section_id');
            const name = formData.get('section_name');
            const gradeId = formData.get('grade_id');

            if (!name || !gradeId) {
                showAlert('❌ Please fill in all required fields.', 'error');
                return;
            }

            // Simulate AJAX request
            const btn = this.querySelector('.btn-save');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            setTimeout(() => {
                const section = data.sections.find(s => s.id === parseInt(id));
                if (section) {
                    const oldGrade = section.grade_name;
                    section.section_name = name;
                    section.grade_id = parseInt(gradeId);
                    section.grade_name = editGradeId.options[editGradeId.selectedIndex].text;
                    section.adviser_id = parseInt(formData.get('adviser_id')) || null;
                    section.adviser_name = section.adviser_id ? 
                        editAdviserId.options[editAdviserId.selectedIndex].text : null;

                    renderSections();
                    filterSections();

                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                    closeEditModal();

                    const gradeMsg = oldGrade !== section.grade_name ? 
                        ` Grade changed from "${oldGrade}" to "${section.grade_name}".` : '';
                    showAlert(`✅ Section "${name}" updated successfully!${gradeMsg}`, 'success');
                }
            }, 800);
        });
    }

    // ============================================
    // DELETE SECTION
    // ============================================

    window.deleteSection = function(id, name, studentCount) {
        let message = `Delete section "${name}"?`;
        if (studentCount > 0) {
            message += `\n\n⚠️ Warning: This section has ${studentCount} enrolled student(s).\nThey will be unassigned from this section.`;
        }
        message += '\n\nThis action cannot be undone.';

        if (confirm(message)) {
            // Simulate AJAX request
            const index = data.sections.findIndex(s => s.id === id);
            if (index !== -1) {
                data.sections.splice(index, 1);
                data.stats.total--;
                updateStats();
                renderSections();
                filterSections();
                showAlert(`🗑️ Section "${name}" deleted successfully!`, 'success');
            }
        }
    };

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        if (totalSections) totalSections.textContent = data.stats.total;
        if (totalStudents) {
            let total = 0;
            data.sections.forEach(s => total += (s.student_count || 0));
            totalStudents.textContent = total;
        }
        if (sectionsWithAdviser) {
            let count = 0;
            data.sections.forEach(s => {
                if (s.adviser_name && s.adviser_name !== 'Not Assigned') count++;
            });
            sectionsWithAdviser.textContent = count;
        }
    }

    // ============================================
    // SHOW ALERT
    // ============================================

    function showAlert(message, type = 'success') {
        if (!alertContainer) return;

        alertContainer.innerHTML = '';

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
    // AUTO-HIDE ALERTS
    // ============================================

    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);

    // ============================================
    // CLOSE MODALS ON OUTSIDE CLICK
    // ============================================

    [addModal, editModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    if (this === addModal) closeAddModal();
                    else closeEditModal();
                }
            });
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (addModal && addModal.classList.contains('active')) closeAddModal();
            if (editModal && editModal.classList.contains('active')) closeEditModal();
        }
    });

    // ============================================
    // INITIALIZE
    // ============================================

    loadData();

    console.log('✅ Sections Management ready!');
    console.log(`📚 ${data.sections.length} sections loaded`);

})();