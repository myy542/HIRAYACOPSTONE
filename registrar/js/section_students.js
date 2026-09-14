// ===== REGISTRAR SECTION STUDENTS JAVASCRIPT (SUPABASE POWERED) =====
import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    console.log('📚 Registrar Section Students ready (Supabase dynamic)');

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');

    // Section info elements
    const sectionNameEl = document.getElementById('sectionName');
    const sectionGradeEl = document.getElementById('sectionGrade');
    const sectionAdviserEl = document.getElementById('sectionAdviser');
    const sectionSubtitleEl = document.getElementById('sectionSubtitle');
    const currentCountEl = document.getElementById('currentCount');
    const availableCountEl = document.getElementById('availableCount');
    const totalGradeCountEl = document.getElementById('totalGradeCount');
    const currentBadgeEl = document.getElementById('currentBadge');
    const availableBadgeEl = document.getElementById('availableBadge');

    // Student list elements
    const currentList = document.getElementById('currentList');
    const availableList = document.getElementById('availableList');
    const searchCurrent = document.getElementById('searchCurrent');
    const searchAvailable = document.getElementById('searchAvailable');

    // Forms
    const removeForm = document.getElementById('removeForm');
    const assignForm = document.getElementById('assignForm');

    // State
    let currentSection = null;
    let currentStudents = [];
    let availableStudents = [];
    let totalGradeStudentsCount = 0;

    // Get section ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sectionId = urlParams.get('id');

    // ============================================
    // ALERT HELPER
    // ============================================
    function showAlert(message, type = 'success') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    // ============================================
    // SET REGISTRAR NAME
    // ============================================
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.displayName || (user.email ? user.email.split('@')[0] : 'Registrar'));
            if (adminName) adminName.textContent = name;
            if (adminInitial) adminInitial.textContent = name.charAt(0).toUpperCase();
        }
    } catch(e) {}

    // ============================================
    // LOGOUT
    // ============================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            try { await supabase.auth.signOut(); } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    if (!sectionId) {
        showAlert('No Section ID provided. Redirecting to sections list...', 'error');
        setTimeout(() => {
            window.location.href = 'sections.html';
        }, 2000);
        return;
    }

    // ============================================
    // FETCH SECTION & STUDENTS
    // ============================================
    async function loadSectionData() {
        try {
            // 1. Fetch section
            const { data: sectionData, error: sectionError } = await supabase
                .from('sections')
                .select('*')
                .eq('id', sectionId)
                .single();

            if (sectionError || !sectionData) {
                throw new Error(sectionError ? sectionError.message : 'Section not found');
            }

            currentSection = sectionData;

            // Resolve Adviser Name
            let adviserDisplayName = currentSection.adviser_name || '';
            if (!adviserDisplayName && currentSection.adviser_id) {
                try {
                    const { data: teacherData } = await supabase
                        .from('teachers')
                        .select(`users:user_id(first_name, last_name, email)`)
                        .eq('id', currentSection.adviser_id)
                        .single();
                    if (teacherData && teacherData.users) {
                        adviserDisplayName = `${teacherData.users.first_name || ''} ${teacherData.users.last_name || ''}`.trim() || teacherData.users.email || '';
                    }
                } catch(e) {}
            }
            currentSection.resolvedAdviser = adviserDisplayName || 'Not Assigned';

            // 2. Fetch current students in this section
            const { data: sectionStudentsData, error: currErr } = await supabase
                .from('students')
                .select('*')
                .eq('section_id', sectionId)
                .order('last_name', { ascending: true });

            if (currErr) throw currErr;
            currentStudents = sectionStudentsData || [];

            // 3. Fetch available students (in same grade level or without section)
            const cleanGrade = String(currentSection.grade_level || '').replace('Grade ', '').trim();
            const gradeVariants = [
                currentSection.grade_level,
                cleanGrade,
                `Grade ${cleanGrade}`,
                `grade ${cleanGrade}`,
                `Grade ${cleanGrade}.0`
            ].filter(Boolean);

            const { data: allGradeStudents, error: availErr } = await supabase
                .from('students')
                .select('*')
                .in('grade_level', gradeVariants)
                .order('last_name', { ascending: true });

            if (availErr) {
                console.warn('Could not filter by grade_level directly, fetching all students:', availErr);
            }

            const allList = allGradeStudents || [];
            totalGradeStudentsCount = allList.length;
            availableStudents = allList.filter(s => s.section_id !== sectionId);

            updateUI();
        } catch (err) {
            console.error('Error loading section details:', err);
            showAlert('Failed to load section: ' + err.message, 'error');
            if (sectionNameEl) sectionNameEl.textContent = 'Error Loading Section';
        }
    }

    // ============================================
    // UPDATE UI
    // ============================================
    function updateUI() {
        if (!currentSection) return;

        // Section header
        if (sectionNameEl) sectionNameEl.textContent = currentSection.name || 'Unnamed Section';
        if (sectionGradeEl) sectionGradeEl.textContent = currentSection.grade_level || 'Grade Level';
        if (sectionAdviserEl) sectionAdviserEl.textContent = currentSection.resolvedAdviser || 'Not Assigned';
        if (sectionSubtitleEl) sectionSubtitleEl.textContent = `Assign and remove students from ${currentSection.name || 'this section'}`;

        // Stats
        const currLen = currentStudents.length;
        const availLen = availableStudents.length;

        if (currentCountEl) currentCountEl.textContent = currLen;
        if (availableCountEl) availableCountEl.textContent = availLen;
        if (totalGradeCountEl) totalGradeCountEl.textContent = totalGradeStudentsCount || (currLen + availLen);
        if (currentBadgeEl) currentBadgeEl.textContent = `${currLen} students`;
        if (availableBadgeEl) availableBadgeEl.textContent = `${availLen} available`;

        renderCurrentStudents();
        renderAvailableStudents();
    }

    // ============================================
    // RENDER CURRENT STUDENTS
    // ============================================
    function renderCurrentStudents() {
        if (!currentList) return;

        if (currentStudents.length === 0) {
            currentList.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 30px; color: #64748b;">
                    <i class="fas fa-user-graduate" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8; display: block;"></i>
                    <p>No students assigned to this section yet.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="select-all" style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; border-radius: 6px;">
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px;">
                    <input type="checkbox" id="selectAllCurrent"> <strong>Select All</strong> (${currentStudents.length} students)
                </label>
            </div>
        `;

        currentStudents.forEach(student => {
            const fullName = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.suffix || ''}`.replace(/\s+/g, ' ').trim() || 'Student';
            const initial = fullName.charAt(0).toUpperCase();

            html += `
                <div class="student-item" data-name="${fullName.toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <input type="checkbox" name="student_ids[]" value="${student.id}" class="student-checkbox current-checkbox">
                        <div class="student-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: #1B2A4A; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">${initial}</div>
                        <div class="student-info" style="min-width: 0;">
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fullName}</h4>
                            <div class="student-meta" style="font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 10px;">
                                <span><i class="fas fa-id-card"></i> LRN: ${student.lrn || 'N/A'}</span>
                                <span><i class="fas fa-layer-group"></i> ${student.grade_level || 'Grade'}</span>
                                ${student.strand ? `<span><i class="fas fa-graduation-cap"></i> ${student.strand}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-icon remove" onclick="window.removeSingleStudent('${student.id}')" style="background: #fee2e2; color: #ef4444; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
        });

        currentList.innerHTML = html;

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

        if (availableStudents.length === 0) {
            availableList.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 30px; color: #64748b;">
                    <i class="fas fa-user-check" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8; display: block;"></i>
                    <p>No available unassigned students for this grade.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="select-all" style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; border-radius: 6px;">
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px;">
                    <input type="checkbox" id="selectAllAvailable"> <strong>Select All</strong> (${availableStudents.length} students)
                </label>
            </div>
        `;

        availableStudents.forEach(student => {
            const fullName = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''} ${student.suffix || ''}`.replace(/\s+/g, ' ').trim() || 'Student';
            const initial = fullName.charAt(0).toUpperCase();

            html += `
                <div class="student-item" data-name="${fullName.toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <input type="checkbox" name="student_ids[]" value="${student.id}" class="student-checkbox available-checkbox">
                        <div class="student-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">${initial}</div>
                        <div class="student-info" style="min-width: 0;">
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fullName}</h4>
                            <div class="student-meta" style="font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 10px;">
                                <span><i class="fas fa-id-card"></i> LRN: ${student.lrn || 'N/A'}</span>
                                <span><i class="fas fa-layer-group"></i> ${student.grade_level || 'Grade'}</span>
                                ${student.strand ? `<span><i class="fas fa-graduation-cap"></i> ${student.strand}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-icon assign" onclick="window.assignSingleStudent('${student.id}')" style="background: #dbeafe; color: #2563eb; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-plus"></i> Assign
                    </button>
                </div>
            `;
        });

        availableList.innerHTML = html;

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
    // SEARCH FILTER
    // ============================================
    if (searchCurrent && currentList) {
        searchCurrent.addEventListener('input', function() {
            const term = this.value.toLowerCase().trim();
            currentList.querySelectorAll('.student-item').forEach(item => {
                const name = item.dataset.name || '';
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
        });
    }

    if (searchAvailable && availableList) {
        searchAvailable.addEventListener('input', function() {
            const term = this.value.toLowerCase().trim();
            availableList.querySelectorAll('.student-item').forEach(item => {
                const name = item.dataset.name || '';
                item.style.display = name.includes(term) ? 'flex' : 'none';
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
    // ASSIGN SINGLE STUDENT
    // ============================================
    window.assignSingleStudent = async function(studentId) {
        if (!confirm('Assign this student to the section?')) return;

        try {
            const { error } = await supabase
                .from('students')
                .update({ section_id: sectionId, updated_at: new Date().toISOString() })
                .eq('id', studentId);

            if (error) throw error;

            showAlert('✅ Student assigned to section successfully!', 'success');
            await loadSectionData();
        } catch (err) {
            console.error('Error assigning student:', err);
            showAlert('❌ Failed to assign student: ' + err.message, 'error');
        }
    };

    // ============================================
    // REMOVE SINGLE STUDENT
    // ============================================
    window.removeSingleStudent = async function(studentId) {
        if (!confirm('Remove this student from the section?')) return;

        try {
            const { error } = await supabase
                .from('students')
                .update({ section_id: null, updated_at: new Date().toISOString() })
                .eq('id', studentId);

            if (error) throw error;

            showAlert('✅ Student removed from section successfully!', 'success');
            await loadSectionData();
        } catch (err) {
            console.error('Error removing student:', err);
            showAlert('❌ Failed to remove student: ' + err.message, 'error');
        }
    };

    // ============================================
    // BULK ASSIGN
    // ============================================
    if (assignForm) {
        assignForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const selected = document.querySelectorAll('.available-checkbox:checked');
            if (selected.length === 0) {
                showAlert('❌ Please select at least one student.', 'error');
                return;
            }

            if (!confirm(`Assign ${selected.length} student(s) to this section?`)) return;

            const studentIds = Array.from(selected).map(cb => cb.value);

            try {
                const { error } = await supabase
                    .from('students')
                    .update({ section_id: sectionId, updated_at: new Date().toISOString() })
                    .in('id', studentIds);

                if (error) throw error;

                showAlert(`✅ ${studentIds.length} student(s) assigned to section successfully!`, 'success');
                await loadSectionData();
            } catch (err) {
                console.error('Error in bulk assign:', err);
                showAlert('❌ Failed to assign students: ' + err.message, 'error');
            }
        });
    }

    // ============================================
    // BULK REMOVE
    // ============================================
    if (removeForm) {
        removeForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const selected = document.querySelectorAll('.current-checkbox:checked');
            if (selected.length === 0) {
                showAlert('❌ Please select at least one student.', 'error');
                return;
            }

            if (!confirm(`Remove ${selected.length} student(s) from this section?`)) return;

            const studentIds = Array.from(selected).map(cb => cb.value);

            try {
                const { error } = await supabase
                    .from('students')
                    .update({ section_id: null, updated_at: new Date().toISOString() })
                    .in('id', studentIds);

                if (error) throw error;

                showAlert(`✅ ${studentIds.length} student(s) removed from section successfully!`, 'success');
                await loadSectionData();
            } catch (err) {
                console.error('Error in bulk remove:', err);
                showAlert('❌ Failed to remove students: ' + err.message, 'error');
            }
        });
    }

    // ============================================
    // INITIAL LOAD
    // ============================================
    await loadSectionData();
});