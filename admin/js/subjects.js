// ===== SUBJECTS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const subjectsContainer = document.getElementById('subjectsContainer');
    const gradeCards = document.getElementById('gradeCards');
    const filterForm = document.getElementById('filterForm');
    const gradeSelect = document.getElementById('gradeSelect');
    const strandSelect = document.getElementById('strandSelect');
    const strandFilterGroup = document.getElementById('strandFilterGroup');
    const searchInput = document.getElementById('searchInput');

    // Modal Elements
    const addModal = document.getElementById('addModal');
    const editModal = document.getElementById('editModal');
    const viewModal = document.getElementById('viewModal');
    const addForm = document.getElementById('addSubjectForm');
    const editForm = document.getElementById('editSubjectForm');

    // ===== DATA =====

    // Sample subjects data
    let subjects = [
        { id: 1, subject_name: 'Mathematics', grade_id: 1, grade_name: 'Grade 7', strand: null, description: 'Basic arithmetic, algebra, and geometry' },
        { id: 2, subject_name: 'Science', grade_id: 1, grade_name: 'Grade 7', strand: null, description: 'Introduction to scientific method and basic sciences' },
        { id: 3, subject_name: 'English', grade_id: 1, grade_name: 'Grade 7', strand: null, description: 'English grammar, reading, and writing' },
        { id: 4, subject_name: 'Mathematics', grade_id: 2, grade_name: 'Grade 8', strand: null, description: 'Intermediate algebra and geometry' },
        { id: 5, subject_name: 'Science', grade_id: 2, grade_name: 'Grade 8', strand: null, description: 'Biology, chemistry, and physics basics' },
        { id: 6, subject_name: 'Mathematics', grade_id: 3, grade_name: 'Grade 9', strand: null, description: 'Advanced algebra and trigonometry' },
        { id: 7, subject_name: 'Science', grade_id: 3, grade_name: 'Grade 9', strand: null, description: 'Earth science and environmental studies' },
        { id: 8, subject_name: 'Mathematics', grade_id: 4, grade_name: 'Grade 10', strand: null, description: 'Geometry and statistics' },
        { id: 9, subject_name: 'English', grade_id: 4, grade_name: 'Grade 10', strand: null, description: 'Advanced reading and writing' },
        { id: 10, subject_name: 'General Mathematics', grade_id: 5, grade_name: 'Grade 11', strand: 'GAS', description: 'Basic mathematics for general academic strand' },
        { id: 11, subject_name: 'Statistics and Probability', grade_id: 5, grade_name: 'Grade 11', strand: 'TVL-Cookery', description: 'Basic statistics and probability' },
        { id: 12, subject_name: 'Earth Science', grade_id: 5, grade_name: 'Grade 11', strand: 'GAS', description: 'Earth science fundamentals' },
        { id: 13, subject_name: 'Physical Science', grade_id: 5, grade_name: 'Grade 11', strand: 'HUMMS', description: 'Physical science basics' },
        { id: 14, subject_name: '21st Century Literature', grade_id: 6, grade_name: 'Grade 12', strand: 'HUMMS', description: '21st century literature studies' },
        { id: 15, subject_name: 'Introduction to Philosophy', grade_id: 6, grade_name: 'Grade 12', strand: 'HUMMS', description: 'Introduction to philosophy' }
    ];

    // Grade levels
    const gradeLevels = [
        { id: 1, name: 'Grade 7' },
        { id: 2, name: 'Grade 8' },
        { id: 3, name: 'Grade 9' },
        { id: 4, name: 'Grade 10' },
        { id: 5, name: 'Grade 11' },
        { id: 6, name: 'Grade 12' }
    ];

    const strandOptions = ['TVL-Cookery', 'HUMMS', 'GAS'];

    // ===== FUNCTIONS =====

    // Update statistics
    function updateStats() {
        const total = subjects.length;
        const jhs = subjects.filter(s => s.grade_id >= 1 && s.grade_id <= 4).length;
        const shs = subjects.filter(s => s.grade_id >= 5 && s.grade_id <= 6).length;

        document.getElementById('totalSubjects').textContent = total;
        document.getElementById('jhsCount').textContent = jhs;
        document.getElementById('shsCount').textContent = shs;
    }

    // Render grade cards
    function renderGradeCards() {
        const filter = gradeSelect.value;
        let html = '';
        gradeLevels.forEach(grade => {
            const count = subjects.filter(s => s.grade_id === grade.id).length;
            const active = filter == grade.id ? 'active' : '';
            html += `
                <a href="#" class="grade-card ${active}" data-grade="${grade.id}">
                    <div class="grade-number">${grade.name.replace('Grade ', '')}</div>
                    <div class="grade-name">${grade.name}</div>
                </a>
            `;
        });
        gradeCards.innerHTML = html;

        // Add click events
        document.querySelectorAll('.grade-card').forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                const grade = this.dataset.grade;
                gradeSelect.value = grade;
                renderSubjects();
                renderGradeCards();
            });
        });
    }

    // Render subjects
    function renderSubjects() {
        const grade = gradeSelect.value;
        const strand = strandSelect.value;
        const search = searchInput.value.toLowerCase().trim();

        let filtered = [...subjects];

        if (grade) {
            filtered = filtered.filter(s => s.grade_id == grade);
        }
        if (strand) {
            filtered = filtered.filter(s => s.strand === strand);
        }
        if (search) {
            filtered = filtered.filter(s => 
                s.subject_name.toLowerCase().includes(search) ||
                (s.description && s.description.toLowerCase().includes(search))
            );
        }

        // Group by grade
        const grouped = {};
        filtered.forEach(subject => {
            if (!grouped[subject.grade_id]) {
                grouped[subject.grade_id] = {
                    grade_id: subject.grade_id,
                    grade_name: subject.grade_name,
                    subjects: []
                };
            }
            grouped[subject.grade_id].subjects.push(subject);
        });

        // Separate JHS and SHS
        const jhsGrades = [1, 2, 3, 4];
        const shsGrades = [5, 6];

        let html = '';

        // Render JHS
        jhsGrades.forEach(gradeId => {
            if (grouped[gradeId]) {
                const data = grouped[gradeId];
                html += `
                    <div class="grade-section">
                        <div class="grade-section-header" onclick="toggleGradeSection(this)">
                            <h2><i class="fas fa-layer-group"></i> ${data.grade_name}</h2>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span class="badge">${data.subjects.length} Subjects</span>
                                <i class="fas fa-chevron-down toggle-icon"></i>
                            </div>
                        </div>
                        <div class="grade-section-content">
                            <div class="strand-table-wrapper">
                                <table class="strand-subject-table">
                                    <thead>
                                        <tr>
                                            <th width="70%">Subject</th>
                                            <th width="30%">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.subjects.map(subject => renderSubjectRow(subject)).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // Render SHS by strand
        shsGrades.forEach(gradeId => {
            if (grouped[gradeId]) {
                const data = grouped[gradeId];
                const gradeSubjects = data.subjects;
                
                // Group by strand
                const strandGroups = {};
                gradeSubjects.forEach(subject => {
                    const strandKey = subject.strand || 'Unspecified';
                    if (!strandGroups[strandKey]) {
                        strandGroups[strandKey] = [];
                    }
                    strandGroups[strandKey].push(subject);
                });

                html += `
                    <div class="grade-section">
                        <div class="grade-section-header" onclick="toggleGradeSection(this)">
                            <h2><i class="fas fa-layer-group"></i> ${data.grade_name}</h2>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span class="badge">${Object.keys(strandGroups).length} Strands</span>
                                <i class="fas fa-chevron-down toggle-icon"></i>
                            </div>
                        </div>
                        <div class="grade-section-content">
                            ${Object.keys(strandGroups).map(strandName => {
                                const strandSubjects = strandGroups[strandName];
                                return `
                                    <div class="strand-subject-section">
                                        <div class="strand-subject-header" data-strand="${strandName}" onclick="toggleStrandSection(this)">
                                            <i class="fas fa-tag"></i>
                                            <h4>${strandName === 'Unspecified' ? 'No Strand' : strandName}</h4>
                                            <span class="badge">${strandSubjects.length} Subjects</span>
                                            <i class="fas fa-chevron-down strand-subject-toggle"></i>
                                        </div>
                                        <div class="strand-subject-content">
                                            <div class="strand-table-wrapper">
                                                <table class="strand-subject-table">
                                                    <thead>
                                                        <tr>
                                                            <th width="70%">Subject</th>
                                                            <th width="30%">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${strandSubjects.map(subject => renderSubjectRow(subject)).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        if (!html) {
            html = `
                <div class="grade-section">
                    <div class="no-data">
                        <i class="fas fa-book"></i>
                        <h3>No Subjects Found</h3>
                        <p>Click "Add New Subject" to get started.</p>
                    </div>
                </div>
            `;
        }

        subjectsContainer.innerHTML = html;
    }

    // Render subject row
    function renderSubjectRow(subject) {
        return `
            <tr>
                <td>
                    <div class="subject-info">
                        <div class="subject-icon"><i class="fas fa-book-open"></i></div>
                        <div class="subject-details">
                            <h4>${escapeHtml(subject.subject_name)}</h4>
                            ${subject.description ? `<span class="description-text">${escapeHtml(subject.description.substring(0, 60))}${subject.description.length > 60 ? '...' : ''}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewSubject(${subject.id})" title="View"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit" onclick="openEditModal(${subject.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="deleteSubject(${subject.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toggle grade section
    window.toggleGradeSection = function(element) {
        const gradeSection = element.closest('.grade-section');
        const content = gradeSection.querySelector('.grade-section-content');
        const icon = element.querySelector('.toggle-icon');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            if (icon) icon.classList.remove('rotated');
        } else {
            content.classList.add('collapsed');
            if (icon) icon.classList.add('rotated');
        }
    };

    // Toggle strand section
    window.toggleStrandSection = function(element) {
        const strandSection = element.closest('.strand-subject-section');
        const content = strandSection.querySelector('.strand-subject-content');
        const icon = element.querySelector('.strand-subject-toggle');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            if (icon) icon.classList.remove('rotated');
        } else {
            content.classList.add('collapsed');
            if (icon) icon.classList.add('rotated');
        }
    };

    // View subject
    window.viewSubject = function(id) {
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        const gradeName = gradeLevels.find(g => g.id === subject.grade_id)?.name || 'Unknown';
        const strandHtml = subject.strand ? `
            <div class="form-group">
                <label>Strand</label>
                <p style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 0;">
                    <i class="fas fa-tag"></i> ${escapeHtml(subject.strand)}
                </p>
            </div>
        ` : '';

        document.getElementById('viewContent').innerHTML = `
            <div class="form-group">
                <label>Subject Name</label>
                <p style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 0;">${escapeHtml(subject.subject_name)}</p>
            </div>
            <div class="form-group">
                <label>Grade Level</label>
                <p style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 0;">${escapeHtml(gradeName)}</p>
            </div>
            ${strandHtml}
            <div class="form-group">
                <label>Description</label>
                <p style="background: #f8fafc; padding: 10px; border-radius: 8px; margin: 0;">${escapeHtml(subject.description) || 'No description provided.'}</p>
            </div>
        `;
        viewModal.classList.add('show');
    };

    // Delete subject
    window.deleteSubject = function(id) {
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        if (confirm(`Delete subject "${subject.subject_name}"?`)) {
            subjects = subjects.filter(s => s.id !== id);
            showAlert('✅ Subject deleted successfully!', 'success');
            updateStats();
            renderSubjects();
        }
    };

    // Open add modal
    window.openAddModal = function() {
        addModal.classList.add('show');
        document.getElementById('addSubjectName').value = '';
        document.getElementById('addGradeId').value = '';
        document.getElementById('addStrand').value = '';
        document.getElementById('addDescription').value = '';
        document.getElementById('addStrandGroup').style.display = 'none';
    };

    // Close add modal
    window.closeAddModal = function() {
        addModal.classList.remove('show');
    };

    // Open edit modal
    window.openEditModal = function(id) {
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        document.getElementById('editSubjectId').value = subject.id;
        document.getElementById('editSubjectName').value = subject.subject_name;
        document.getElementById('editGradeId').value = subject.grade_id;
        document.getElementById('editDescription').value = subject.description || '';

        const strandSelect = document.getElementById('editStrand');
        const strandGroup = document.getElementById('editStrandGroup');

        if (subject.strand && strandSelect) {
            strandSelect.value = subject.strand;
        } else if (strandSelect) {
            strandSelect.value = '';
        }

        if (subject.grade_id === 5 || subject.grade_id === 6) {
            strandGroup.style.display = 'block';
            if (strandSelect) strandSelect.required = true;
        } else {
            strandGroup.style.display = 'none';
            if (strandSelect) strandSelect.required = false;
        }

        editModal.classList.add('show');
    };

    // Close edit modal
    window.closeEditModal = function() {
        editModal.classList.remove('show');
    };

    // Close view modal
    window.closeViewModal = function() {
        viewModal.classList.remove('show');
    };

    // Reset filters
    window.resetFilters = function() {
        gradeSelect.value = '';
        strandSelect.value = '';
        searchInput.value = '';
        strandFilterGroup.style.display = 'none';
        renderSubjects();
        renderGradeCards();
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

    // ===== FORM HANDLERS =====

    // Add form
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('addSubjectName').value.trim();
            const gradeId = parseInt(document.getElementById('addGradeId').value);
            const strand = document.getElementById('addStrand').value;
            const description = document.getElementById('addDescription').value.trim();

            if (!name || !gradeId) {
                showAlert('Please fill in all required fields.', 'error');
                return;
            }

            if ((gradeId === 5 || gradeId === 6) && !strand) {
                showAlert('Strand is required for Senior High School subjects (Grades 11-12).', 'error');
                return;
            }

            const gradeName = gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';

            // Check duplicate
            const exists = subjects.some(s => 
                s.subject_name === name && 
                s.grade_id === gradeId && 
                (s.strand === strand || (!s.strand && !strand))
            );

            if (exists) {
                showAlert('Subject with this name already exists for this grade level.', 'error');
                return;
            }

            const newSubject = {
                id: subjects.length + 1,
                subject_name: name,
                grade_id: gradeId,
                grade_name: gradeName,
                strand: strand || null,
                description: description || null
            };

            subjects.push(newSubject);
            showAlert('✅ Subject added successfully!', 'success');
            updateStats();
            renderSubjects();
            closeAddModal();
            addForm.reset();
        });
    }

    // Edit form
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = parseInt(document.getElementById('editSubjectId').value);
            const name = document.getElementById('editSubjectName').value.trim();
            const gradeId = parseInt(document.getElementById('editGradeId').value);
            const strand = document.getElementById('editStrand').value;
            const description = document.getElementById('editDescription').value.trim();

            if (!name || !gradeId) {
                showAlert('Please fill in all required fields.', 'error');
                return;
            }

            if ((gradeId === 5 || gradeId === 6) && !strand) {
                showAlert('Strand is required for Senior High School subjects.', 'error');
                return;
            }

            const subject = subjects.find(s => s.id === id);
            if (subject) {
                subject.subject_name = name;
                subject.grade_id = gradeId;
                subject.grade_name = gradeLevels.find(g => g.id === gradeId)?.name || 'Unknown';
                subject.strand = strand || null;
                subject.description = description || null;

                showAlert('✅ Subject updated successfully!', 'success');
                updateStats();
                renderSubjects();
                closeEditModal();
            }
        });
    }

    // ===== EVENT LISTENERS =====

    // Grade select change - show/hide strand filter
    if (gradeSelect) {
        gradeSelect.addEventListener('change', function() {
            const gradeId = parseInt(this.value);
            if (gradeId === 5 || gradeId === 6) {
                strandFilterGroup.style.display = 'inline-block';
            } else {
                strandFilterGroup.style.display = 'none';
                strandSelect.value = '';
            }
            renderSubjects();
            renderGradeCards();
        });
    }

    // Strand select change
    if (strandSelect) {
        strandSelect.addEventListener('change', function() {
            renderSubjects();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderSubjects();
        });
    }

    // Filter form
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderSubjects();
        });
    }

    // Add grade change handler for strand toggle
    document.getElementById('addGradeId')?.addEventListener('change', function() {
        const gradeId = parseInt(this.value);
        const strandGroup = document.getElementById('addStrandGroup');
        const strandSelect = document.getElementById('addStrand');
        
        if (gradeId === 5 || gradeId === 6) {
            strandGroup.style.display = 'block';
            if (strandSelect) strandSelect.required = true;
        } else {
            strandGroup.style.display = 'none';
            if (strandSelect) {
                strandSelect.required = false;
                strandSelect.value = '';
            }
        }
    });

    document.getElementById('editGradeId')?.addEventListener('change', function() {
        const gradeId = parseInt(this.value);
        const strandGroup = document.getElementById('editStrandGroup');
        const strandSelect = document.getElementById('editStrand');
        
        if (gradeId === 5 || gradeId === 6) {
            strandGroup.style.display = 'block';
            if (strandSelect) strandSelect.required = true;
        } else {
            strandGroup.style.display = 'none';
            if (strandSelect) {
                strandSelect.required = false;
                strandSelect.value = '';
            }
        }
    });

    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target === addModal) closeAddModal();
        if (e.target === editModal) closeEditModal();
        if (e.target === viewModal) closeViewModal();
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
    renderGradeCards();
    renderSubjects();
});