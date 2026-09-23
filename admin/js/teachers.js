// ===== TEACHERS JAVASCRIPT (Dynamic Supabase Integration) =====

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');

    let teachers = [];

    // Update statistics
    function updateStats() {
        const total = teachers.length;
        const withSections = teachers.filter(t => t.section_count > 0).length;
        const withoutSections = total - withSections;

        const elTotal = document.getElementById('totalTeachers');
        const elWith = document.getElementById('withSections');
        const elWithout = document.getElementById('withoutSections');

        if (elTotal) elTotal.textContent = total;
        if (elWith) elWith.textContent = withSections;
        if (elWithout) elWithout.textContent = withoutSections;
    }

    // Render table
    function renderTable() {
        if (!tableBody) return;

        const status = statusFilter ? statusFilter.value : 'all';
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = [...teachers];

        if (status === 'with-sections') {
            filtered = filtered.filter(t => t.section_count > 0);
        } else if (status === 'without-sections') {
            filtered = filtered.filter(t => t.section_count === 0);
        }

        if (search) {
            filtered = filtered.filter(t => 
                (t.fullname || '').toLowerCase().includes(search) ||
                (t.email || '').toLowerCase().includes(search) ||
                (t.id_number || '').toLowerCase().includes(search) ||
                (t.specialization || '').toLowerCase().includes(search)
            );
        }

        if (recordCount) {
            recordCount.textContent = `Total: ${filtered.length} teachers`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-data" style="text-align: center; padding: 40px; color: #64748b;">
                            <i class="fas fa-chalkboard-user" style="font-size: 36px; margin-bottom: 12px; color: #94a3b8;"></i>
                            <h3 style="font-size: 16px; margin-bottom: 6px; color: #1e293b;">No Teachers Found</h3>
                            <p style="font-size: 13px; margin: 0;">${search ? 'No faculty members matched your search.' : 'Click "Add New Teacher" to register a faculty member.'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(teacher => {
            const initial = (teacher.fullname || 'T').charAt(0).toUpperCase();
            const joinedDate = new Date(teacher.created_at || Date.now());
            const formattedDate = joinedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const hasSections = teacher.section_count > 0;
            
            // Sections tags
            let sectionsHtml = '';
            if (hasSections && teacher.sections) {
                const sectionList = Array.isArray(teacher.sections) ? teacher.sections : teacher.sections.split(', ');
                sectionsHtml = `
                    <div class="section-tags" style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${sectionList.map(s => `<span class="badge badge-info" style="font-size: 11px;">${s}</span>`).join('')}
                    </div>
                `;
            } else {
                sectionsHtml = `<span class="badge badge-warning" style="font-size: 11px;">No sections assigned</span>`;
            }

            // Status badge
            const statusBadge = hasSections
                ? `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Adviser</span>`
                : `<span class="badge badge-secondary"><i class="fas fa-clock"></i> Available</span>`;

            html += `
                <tr>
                    <td>
                        <div class="teacher-info" style="display: flex; align-items: center; gap: 12px;">
                            <div class="teacher-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: #1B2A4A; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${initial}</div>
                            <div class="teacher-details">
                                <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">${teacher.fullname}</h4>
                                <span style="font-size: 12px; color: #64748b;"><i class="fas fa-calendar-alt"></i> Joined: ${formattedDate}</span>
                            </div>
                        </div>
                    </td>
                    <td><i class="fas fa-envelope" style="color: #94a3b8; margin-right: 6px;"></i> ${teacher.email}</td>
                    <td>
                        <span class="badge badge-info">
                            ${teacher.id_number || teacher.employee_id || 'N/A'}
                        </span>
                    </td>
                    <td>${sectionsHtml}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-btns">
                            <a href="register_face.html?id=${teacher.id}" class="action-btn" title="Register / Re-scan Face Biometrics" style="color: #0f766e; background: #ccfbf1;">
                                <i class="fas fa-camera"></i>
                            </a>
                            <a href="view_teacher.html?id=${teacher.id}" class="action-btn view" title="View Teacher">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="edit_teacher.html?id=${teacher.id}" class="action-btn edit" title="Edit Teacher">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button type="button" class="action-btn delete" data-id="${teacher.id}" title="Delete Teacher">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;

        // Attach delete handlers
        tableBody.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                deleteTeacher(id);
            });
        });
    }

    // Load teachers dynamically from Supabase
    async function loadTeachers() {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #1B2A4A; margin-bottom: 8px;"></i>
                        <p style="margin: 0;">Loading faculty members from database...</p>
                    </td>
                </tr>
            `;
        }

        try {
            const [
                { data: teacherRows, error: tErr },
                { data: userRows, error: uErr },
                { data: sectionRows, error: sErr }
            ] = await Promise.all([
                supabase.from('teachers').select('*'),
                supabase.from('users').select('*').eq('role', 'teacher'),
                supabase.from('sections').select('*')
            ]);

            if (tErr) throw tErr;

            const users = userRows || [];
            const sections = sectionRows || [];
            const teacherTableData = teacherRows || [];

            // Map each user with role teacher or teacher table record
            const combinedTeachers = [];
            const processedUserIds = new Set();

            teacherTableData.forEach(t => {
                const matchedUser = users.find(u => u.id === t.user_id);
                if (matchedUser) processedUserIds.add(matchedUser.id);

                const fullName = matchedUser ? `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() : (t.fullname || 'Faculty Teacher');
                const email = matchedUser ? matchedUser.email : (t.email || 'teacher@hiraya.edu.ph');

                // Find assigned sections
                const assignedSections = sections.filter(sec => sec.adviser_id === t.id || sec.adviser_id === t.user_id);

                combinedTeachers.push({
                    id: t.id,
                    user_id: t.user_id,
                    fullname: fullName,
                    email: email,
                    id_number: t.employee_id || 'HES-TCH-0000',
                    specialization: t.specialization || 'General',
                    phone: t.phone || '',
                    created_at: t.created_at || (matchedUser ? matchedUser.created_at : new Date().toISOString()),
                    section_count: assignedSections.length,
                    sections: assignedSections.map(s => s.name || `${s.grade_level || ''} - ${s.strand || ''}`).join(', ')
                });
            });

            // Add any user with role=teacher not yet in teachers table
            users.forEach(u => {
                if (!processedUserIds.has(u.id)) {
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
                    const assignedSections = sections.filter(sec => sec.adviser_id === u.id);

                    combinedTeachers.push({
                        id: u.id,
                        user_id: u.id,
                        fullname: fullName,
                        email: u.email,
                        id_number: 'HES-TCH-PEND',
                        specialization: 'Faculty',
                        phone: '',
                        created_at: u.created_at || new Date().toISOString(),
                        section_count: assignedSections.length,
                        sections: assignedSections.map(s => s.name).join(', ')
                    });
                }
            });

            teachers = combinedTeachers;
            updateStats();
            renderTable();
        } catch (err) {
            console.error('Error loading teachers:', err);
            showAlert('Failed to load teachers from database: ' + err.message, 'error');
        }
    }

    // Delete teacher
    async function deleteTeacher(id) {
        const teacher = teachers.find(t => t.id === id);
        if (!teacher) return;

        if (teacher.section_count > 0) {
            showAlert('Cannot delete teacher because they are assigned as adviser to an active section.', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete teacher "${teacher.fullname}"?`)) {
            return;
        }

        try {
            // Delete from teachers table
            const { error: tDelErr } = await supabase
                .from('teachers')
                .delete()
                .eq('id', id);

            if (tDelErr) throw tDelErr;

            // Also delete from users table if user_id exists
            if (teacher.user_id) {
                await supabase.from('users').delete().eq('id', teacher.user_id);
            }

            showAlert(`✅ Teacher "${teacher.fullname}" deleted successfully!`, 'success');
            await loadTeachers();
        } catch (err) {
            console.error('Error deleting teacher:', err);
            showAlert('Failed to delete teacher: ' + err.message, 'error');
        }
    }

    // Show alert
    function showAlert(message, type = 'error') {
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

    // Event listeners
    if (statusFilter) statusFilter.addEventListener('change', renderTable);
    if (searchInput) searchInput.addEventListener('input', renderTable);

    // Initial load
    await loadTeachers();
});