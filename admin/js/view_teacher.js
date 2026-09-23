// ===== VIEW TEACHER JAVASCRIPT (Supabase Dynamic Integration) =====

import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    'use strict';

    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const avatarInitial = document.getElementById('avatarInitial');
    const teacherName = document.getElementById('teacherName');
    const teacherEmail = document.getElementById('teacherEmail');
    const teacherIdNumber = document.getElementById('teacherIdNumber');
    const teacherRegistered = document.getElementById('teacherRegistered');
    const teacherDaysActive = document.getElementById('teacherDaysActive');

    const statSections = document.getElementById('statSections');
    const statStudents = document.getElementById('statStudents');
    const statSubjects = document.getElementById('statSubjects');

    const sectionsContainer = document.getElementById('sectionsContainer');
    const subjectsContainer = document.getElementById('subjectsContainer');

    // Get teacher ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const teacherId = urlParams.get('id');

    // ===== FUNCTIONS =====

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
    }

    function calculateDaysActive(createdAt) {
        if (!createdAt) return 0;
        const created = new Date(createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - created);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

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

    // Load teacher profile dynamically
    async function loadTeacherProfile() {
        if (!teacherId) {
            showAlert('No teacher ID specified in the URL.', 'error');
            return;
        }

        try {
            // 1. Fetch teacher record
            let teacherRecord = null;
            let userRecord = null;

            const { data: tData } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', teacherId)
                .maybeSingle();

            if (tData) {
                teacherRecord = tData;
                if (tData.user_id) {
                    const { data: uData } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', tData.user_id)
                        .maybeSingle();
                    userRecord = uData;
                }
            } else {
                // Try searching by user ID
                const { data: uData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', teacherId)
                    .maybeSingle();

                if (uData) {
                    userRecord = uData;
                    const { data: tByUser } = await supabase
                        .from('teachers')
                        .select('*')
                        .eq('user_id', uData.id)
                        .maybeSingle();
                    teacherRecord = tByUser;
                }
            }

            if (!userRecord && !teacherRecord) {
                showAlert('Teacher not found in database.', 'error');
                return;
            }

            const fullName = userRecord ? `${userRecord.first_name || ''} ${userRecord.last_name || ''}`.trim() : (teacherRecord?.fullname || 'Faculty Teacher');
            const email = userRecord?.email || teacherRecord?.email || 'N/A';
            const employeeId = teacherRecord?.employee_id || 'HES-TCH-0000';
            const createdAt = teacherRecord?.created_at || userRecord?.created_at || new Date().toISOString();
            const initial = fullName.charAt(0).toUpperCase() || 'T';
            const daysActive = calculateDaysActive(createdAt);

            if (avatarInitial) avatarInitial.textContent = initial;
            if (teacherName) teacherName.textContent = fullName;
            if (teacherEmail) teacherEmail.textContent = email;
            if (teacherIdNumber) teacherIdNumber.textContent = employeeId;
            if (teacherRegistered) teacherRegistered.textContent = formatDate(createdAt);
            if (teacherDaysActive) teacherDaysActive.textContent = daysActive;

            // 2. Fetch assigned sections
            const teacherKey = teacherRecord?.id || teacherId;
            const userKey = userRecord?.id || teacherId;

            const { data: sectionsData } = await supabase
                .from('sections')
                .select('*')
                .or(`adviser_id.eq.${teacherKey},adviser_id.eq.${userKey}`);

            const sections = sectionsData || [];

            // 3. Fetch students count under advisory
            let totalStudentsCount = 0;
            if (sections.length > 0) {
                const sectionIds = sections.map(s => s.id);
                const { count: sCount } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .in('section_id', sectionIds);

                totalStudentsCount = sCount || 0;
            }

            // 4. Fetch subjects taught
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('*')
                .limit(6);

            const subjects = subjectsData || [];

            // Update stats
            if (statSections) statSections.textContent = sections.length;
            if (statStudents) statStudents.textContent = totalStudentsCount;
            if (statSubjects) statSubjects.textContent = subjects.length;

            // Render sections
            if (sectionsContainer) {
                if (sections.length === 0) {
                    sectionsContainer.innerHTML = `
                        <div class="no-data" style="text-align: center; padding: 24px; color: #64748b;">
                            <i class="fas fa-layer-group" style="font-size: 28px; color: #cbd5e1; margin-bottom: 8px;"></i>
                            <p style="margin: 0;">No advisory sections currently assigned to this teacher.</p>
                        </div>
                    `;
                } else {
                    let sHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">';
                    sections.forEach(sec => {
                        sHtml += `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                                <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px;">${sec.name || 'Section'}</h4>
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">Grade: ${sec.grade_level || 'Grade 11'} ${sec.strand ? '• ' + sec.strand : ''}</p>
                                <a href="view_section.html?id=${sec.id}" class="badge badge-info" style="text-decoration: none; display: inline-block;">View Section &rarr;</a>
                            </div>
                        `;
                    });
                    sHtml += '</div>';
                    sectionsContainer.innerHTML = sHtml;
                }
            }

            // Render subjects
            if (subjectsContainer) {
                if (subjects.length === 0) {
                    subjectsContainer.innerHTML = `
                        <div class="no-data" style="text-align: center; padding: 24px; color: #64748b;">
                            <i class="fas fa-book-open" style="font-size: 28px; color: #cbd5e1; margin-bottom: 8px;"></i>
                            <p style="margin: 0;">No subjects registered for this department.</p>
                        </div>
                    `;
                } else {
                    let subHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">';
                    subjects.forEach(sub => {
                        subHtml += `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                                <strong style="font-size: 13px; color: #1e293b; display: block; margin-bottom: 4px;">${sub.name}</strong>
                                <span style="font-size: 11.5px; color: #64748b;">Grade ${sub.grade_level || '—'} ${sub.strand ? '(' + sub.strand + ')' : ''}</span>
                            </div>
                        `;
                    });
                    subHtml += '</div>';
                    subjectsContainer.innerHTML = subHtml;
                }
            }

        } catch (err) {
            console.error('Error loading teacher profile:', err);
            showAlert('Failed to load teacher profile: ' + err.message, 'error');
        }
    }

    await loadTeacherProfile();
});