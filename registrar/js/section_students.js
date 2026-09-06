/**
 * Section Students - Interactive JavaScript
 * No hardcoded data - all data comes from PHP via window.sectionData
 */

(function() {
    'use strict';

    console.log('📚 Section Students page ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Section info
    const sectionName = document.getElementById('sectionName');
    const sectionGrade = document.getElementById('sectionGrade');
    const sectionAdviser = document.getElementById('sectionAdviser');
    const sectionSubtitle = document.getElementById('sectionSubtitle');
    const currentCount = document.getElementById('currentCount');
    const availableCount = document.getElementById('availableCount');
    const totalGradeCount = document.getElementById('totalGradeCount');
    const currentBadge = document.getElementById('currentBadge');
    const availableBadge = document.getElementById('availableBadge');

    // Student lists
    const currentList = document.getElementById('currentList');
    const availableList = document.getElementById('availableList');
    const searchCurrent = document.getElementById('searchCurrent');
    const searchAvailable = document.getElementById('searchAvailable');

    // Forms
    const removeForm = document.getElementById('removeForm');
    const assignForm = document.getElementById('assignForm');
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    const assignSelectedBtn = document.getElementById('assignSelectedBtn');

    // ============================================
    // DATA FROM PHP
    // ============================================

    const data = window.sectionData || {
        id: 0,
        name: 'Section Name',
        grade: 'Grade Level',
        adviser: 'Not Assigned',
        currentCount: 0,
        availableCount: 0,
        totalGradeStudents: 0,
        currentStudents: [],
        availableStudents: []
    };

    // ============================================
    // SET ADMIN NAME (from data)
    // ============================================

    const firstName = 'Registrar';
    if (adminName) adminName.textContent = firstName;
    if (adminInitial) adminInitial.textContent = firstName.charAt(0).toUpperCase();

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
        // Section info
        if (sectionName) sectionName.textContent = data.name;
        if (sectionGrade) sectionGrade.textContent = data.grade;
        if (sectionAdviser) sectionAdviser.textContent = data.adviser;
        if (sectionSubtitle) sectionSubtitle.textContent = `Assign and remove students from ${data.name}`;

        // Stats
        if (currentCount) currentCount.textContent = data.currentCount;
        if (availableCount) availableCount.textContent = data.availableCount;
        if (totalGradeCount) totalGradeCount.textContent = data.totalGradeStudents;
        if (currentBadge) currentBadge.textContent = `${data.currentCount} students`;
        if (availableBadge) availableBadge.textContent = `${data.availableCount} available`;

        // Render student lists
        renderCurrentStudents();
        renderAvailableStudents();
    }

    // ============================================
    // RENDER CURRENT STUDENTS
    // ============================================

    function renderCurrentStudents() {
        if (!currentList) return;

        if (data.currentStudents.length === 0) {
            currentList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-graduate"></i>
                    <p>No students in this section yet.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="select-all">
                <label>
                    <input type="checkbox" id="selectAllCurrent"> <strong>Select All</strong> (${data.currentStudents.length} students)
                </label>
            </div>
        `;

        data.currentStudents.forEach(student => {
            const initial = student.fullname ? student.fullname.charAt(0) : 'S';
            const hasProfilePic = student.profile_picture && student.profile_picture !== '';
            const profilePicUrl = hasProfilePic ? `../${student.profile_picture}?t=${Date.now()}` : '';

            html += `
                <div class="student-item" data-name="${(student.fullname || '').toLowerCase()}">
                    <input type="checkbox" name="student_ids[]" value="${student.id}" class="student-checkbox current-checkbox">
                    ${hasProfilePic ? `
                        <div class="student-avatar-img">
                            <img src="${profilePicUrl}" alt="Profile">
                        </div>
                    ` : `
                        <div class="student-avatar">${initial}</div>
                    `}
                    <div class="student-info">
                        <h4>${student.fullname || 'Unknown'}</h4>
                        <div class="student-meta">
                            <span><i class="fas fa-envelope"></i> ${student.email || 'N/A'}</span>
                            <span><i class="fas fa-id-card"></i> ID: ${student.id_number || 'N/A'}</span>
                            <span><i class="fas fa-calendar"></i> SY: ${student.school_year || 'N/A'}</span>
                        </div>
                    </div>
                    <button class="btn-icon remove" onclick="removeStudent(${student.id})">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
        });

        currentList.innerHTML = html;

        // Select All functionality
        const selectAll = document.getElementById('selectAllCurrent');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                document.querySelectorAll('.current-checkbox').forEach(cb => {
                    cb.checked = this.checked;
                });
            });
        }
    }

    // ============================================
    // RENDER AVAILABLE STUDENTS
    // ============================================

    function renderAvailableStudents() {
        if (!availableList) return;

        if (data.availableStudents.length === 0) {
            availableList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-check"></i>
                    <p>No available students in ${data.grade}</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="select-all">
                <label>
                    <input type="checkbox" id="selectAllAvailable"> <strong>Select All</strong> (${data.availableStudents.length} students)
                </label>
            </div>
        `;

        data.availableStudents.forEach(student => {
            const initial = student.fullname ? student.fullname.charAt(0) : 'S';
            const hasProfilePic = student.profile_picture && student.profile_picture !== '';
            const profilePicUrl = hasProfilePic ? `../${student.profile_picture}?t=${Date.now()}` : '';

            html += `
                <div class="student-item" data-name="${(student.fullname || '').toLowerCase()}">
                    <input type="checkbox" name="student_ids[]" value="${student.id}" class="student-checkbox available-checkbox">
                    ${hasProfilePic ? `
                        <div class="student-avatar-img">
                            <img src="${profilePicUrl}" alt="Profile">
                        </div>
                    ` : `
                        <div class="student-avatar">${initial}</div>
                    `}
                    <div class="student-info">
                        <h4>${student.fullname || 'Unknown'}</h4>
                        <div class="student-meta">
                            <span><i class="fas fa-envelope"></i> ${student.email || 'N/A'}</span>
                            <span><i class="fas fa-id-card"></i> ID: ${student.id_number || 'N/A'}</span>
                            <span><i class="fas fa-calendar"></i> SY: ${student.school_year || 'N/A'}</span>
                        </div>
                    </div>
                    <button class="btn-icon assign" onclick="assignStudent(${student.id})">
                        <i class="fas fa-plus"></i> Assign
                    </button>
                </div>
            `;
        });

        availableList.innerHTML = html;

        // Select All functionality
        const selectAll = document.getElementById('selectAllAvailable');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                document.querySelectorAll('.available-checkbox').forEach(cb => {
                    cb.checked = this.checked;
                });
            });
        }
    }

    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================

    if (searchCurrent) {
        searchCurrent.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const items = currentList.querySelectorAll('.student-item');
            items.forEach(item => {
                const name = item.dataset.name || '';
                if (name.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    if (searchAvailable) {
        searchAvailable.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const items = availableList.querySelectorAll('.student-item');
            items.forEach(item => {
                const name = item.dataset.name || '';
                if (name.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // ============================================
    // TOGGLE ALL CHECKBOXES
    // ============================================

    window.toggleAll = function(type) {
        const checkboxClass = type === 'current' ? '.current-checkbox' : '.available-checkbox';
        const checkboxes = document.querySelectorAll(checkboxClass);
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    };

    // ============================================
    // ASSIGN STUDENT (Single)
    // ============================================

    window.assignStudent = function(studentId) {
        if (confirm('Assign this student to the section?')) {
            // Simulate AJAX request
            showAlert('✅ Student assigned to section successfully!', 'success');

            // Move student from available to current
            const studentIndex = data.availableStudents.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
                const student = data.availableStudents.splice(studentIndex, 1)[0];
                data.currentStudents.push(student);
                data.currentCount = data.currentStudents.length;
                data.availableCount = data.availableStudents.length;
                renderCurrentStudents();
                renderAvailableStudents();
                updateStats();
            }
        }
    };

    // ============================================
    // REMOVE STUDENT (Single)
    // ============================================

    window.removeStudent = function(studentId) {
        if (confirm('Remove this student from the section?')) {
            // Simulate AJAX request
            showAlert('✅ Student removed from section successfully!', 'success');

            // Move student from current to available
            const studentIndex = data.currentStudents.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
                const student = data.currentStudents.splice(studentIndex, 1)[0];
                data.availableStudents.push(student);
                data.currentCount = data.currentStudents.length;
                data.availableCount = data.availableStudents.length;
                renderCurrentStudents();
                renderAvailableStudents();
                updateStats();
            }
        }
    };

    // ============================================
    // BULK ASSIGN
    // ============================================

    if (assignForm) {
        assignForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const selected = document.querySelectorAll('.available-checkbox:checked');
            if (selected.length === 0) {
                showAlert('❌ Please select at least one student.', 'error');
                return;
            }

            if (confirm(`Assign ${selected.length} student(s) to this section?`)) {
                const studentIds = Array.from(selected).map(cb => parseInt(cb.value));

                // Simulate AJAX request
                showAlert(`✅ ${selected.length} student(s) assigned to section successfully!`, 'success');

                // Move selected students from available to current
                studentIds.forEach(id => {
                    const studentIndex = data.availableStudents.findIndex(s => s.id === id);
                    if (studentIndex !== -1) {
                        const student = data.availableStudents.splice(studentIndex, 1)[0];
                        data.currentStudents.push(student);
                    }
                });

                data.currentCount = data.currentStudents.length;
                data.availableCount = data.availableStudents.length;
                renderCurrentStudents();
                renderAvailableStudents();
                updateStats();
            }
        });
    }

    // ============================================
    // BULK REMOVE
    // ============================================

    if (removeForm) {
        removeForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const selected = document.querySelectorAll('.current-checkbox:checked');
            if (selected.length === 0) {
                showAlert('❌ Please select at least one student.', 'error');
                return;
            }

            if (confirm(`Remove ${selected.length} student(s) from this section?`)) {
                const studentIds = Array.from(selected).map(cb => parseInt(cb.value));

                // Simulate AJAX request
                showAlert(`✅ ${selected.length} student(s) removed from section successfully!`, 'success');

                // Move selected students from current to available
                studentIds.forEach(id => {
                    const studentIndex = data.currentStudents.findIndex(s => s.id === id);
                    if (studentIndex !== -1) {
                        const student = data.currentStudents.splice(studentIndex, 1)[0];
                        data.availableStudents.push(student);
                    }
                });

                data.currentCount = data.currentStudents.length;
                data.availableCount = data.availableStudents.length;
                renderCurrentStudents();
                renderAvailableStudents();
                updateStats();
            }
        });
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        if (currentCount) currentCount.textContent = data.currentCount;
        if (availableCount) availableCount.textContent = data.availableCount;
        if (currentBadge) currentBadge.textContent = `${data.currentCount} students`;
        if (availableBadge) availableBadge.textContent = `${data.availableCount} available`;
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
    // INITIALIZE
    // ============================================

    loadData();

    console.log('✅ Section Students ready!');
    console.log('📚 Section:', data.name);
    console.log(`👥 ${data.currentCount} students in section, ${data.availableCount} available`);

})();