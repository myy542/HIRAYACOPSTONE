// ===== REGISTRAR CREATE SECTION JAVASCRIPT (SUPABASE POWERED) =====
import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const sectionNameInput = document.getElementById('section_name');
    const gradeSelect = document.getElementById('grade_id');
    const adviserInput = document.getElementById('adviser_name');
    const previewName = document.getElementById('previewName');
    const previewDetails = document.getElementById('previewDetails');
    const sectionForm = document.getElementById('sectionForm');
    const alertContainer = document.getElementById('alertContainer');
    const quickButtons = document.querySelectorAll('.quick-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    // State
    let teachers = [];

    // ===== ALERT HELPER =====
    function showAlert(message, type = 'error') {
        if (!alertContainer) return;
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

    function showErrorList(errors) {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        
        let html = `<i class="fas fa-exclamation-circle"></i> Please fix the following errors:`;
        html += `<ul class="error-list" style="margin-top: 8px; padding-left: 20px;">`;
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += `</ul>`;
        
        alertDiv.innerHTML = html;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // ===== LOAD TEACHERS FROM SUPABASE =====
    async function loadTeachers() {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select(`
                    id,
                    user_id,
                    employee_id,
                    users:user_id (
                        id,
                        first_name,
                        last_name,
                        email
                    )
                `);

            if (error) throw error;

            teachers = (data || []).map(t => {
                const u = t.users || {};
                const name = (u.first_name || u.last_name) 
                    ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                    : (u.email || t.employee_id || 'Teacher');
                return {
                    id: t.id,
                    name: name
                };
            });
        } catch (err) {
            console.error('Error loading teachers:', err);
        }
    }

    // ===== PREVIEW =====
    function updatePreview() {
        if (!previewName || !previewDetails) return;

        const sectionName = sectionNameInput.value.trim() || 'Section Name';
        previewName.textContent = sectionName;

        let gradeText = 'Grade Level';
        if (gradeSelect && gradeSelect.value) {
            gradeText = `Grade ${gradeSelect.value}`;
        }

        let adviserText = 'No Adviser Entered';
        if (adviserInput && adviserInput.value.trim()) {
            adviserText = `Adviser: ${adviserInput.value.trim()}`;
        }

        previewDetails.textContent = `${gradeText} · ${adviserText}`;
    }

    // ===== QUICK BUTTONS =====
    quickButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            const grade = this.dataset.grade;
            
            if (sectionNameInput) sectionNameInput.value = section;
            if (gradeSelect) gradeSelect.value = grade;
            
            updatePreview();
            
            this.style.background = '#0b2b4a';
            this.style.color = '#fff';
            setTimeout(() => {
                this.style.background = '';
                this.style.color = '';
            }, 400);
        });
    });

    // ===== EVENT LISTENERS =====
    if (sectionNameInput) sectionNameInput.addEventListener('input', updatePreview);
    if (gradeSelect) gradeSelect.addEventListener('change', updatePreview);
    if (adviserInput) adviserInput.addEventListener('input', updatePreview);

    // ===== LOGOUT & MOBILE MENU =====
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.replace('../auth/login.html');
        });
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // ===== FORM SUBMIT =====
    if (sectionForm) {
        sectionForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const sectionName = sectionNameInput.value.trim();
            const gradeId = gradeSelect.value;
            const adviserName = adviserInput ? adviserInput.value.trim() : '';

            let errors = [];
            if (!sectionName) errors.push('Section name is required');
            if (!gradeId) errors.push('Grade level is required');
            if (!adviserName) errors.push('Class adviser name is required');

            if (errors.length > 0) {
                showErrorList(errors);
                return;
            }

            const gradeLevelStr = `Grade ${gradeId}`;

            // Optional: determine strand if included in name
            let strand = null;
            const upper = sectionName.toUpperCase();
            if (upper.includes('STEM')) strand = 'STEM';
            else if (upper.includes('TVL') || upper.includes('ICT')) strand = 'TVL';
            else if (upper.includes('HUMSS')) strand = 'HUMSS';
            else if (upper.includes('ABM')) strand = 'ABM';
            else if (upper.includes('GAS')) strand = 'GAS';

            // Match teacher if exists
            const matchedTeacher = teachers.find(t => t.name.toLowerCase() === adviserName.toLowerCase());
            const adviserId = matchedTeacher ? matchedTeacher.id : null;

            const submitBtn = sectionForm.querySelector('button[type="submit"]');
            try {
                if (submitBtn) submitBtn.disabled = true;

                const { data, error } = await supabase
                    .from('sections')
                    .insert([{
                        name: sectionName,
                        grade_level: gradeLevelStr,
                        strand: strand,
                        adviser_name: adviserName,
                        adviser_id: adviserId
                    }])
                    .select();

                if (error) throw error;

                showAlert(`✅ Section "${sectionName}" created successfully!<br><small>Grade: ${gradeLevelStr} | Adviser: ${adviserName}</small>`, 'success');

                setTimeout(() => {
                    window.location.href = 'sections.html';
                }, 1200);
            } catch (err) {
                console.error('Error creating section:', err);
                showAlert('Failed to create section: ' + err.message, 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // ===== INIT =====
    await loadTeachers();
    updatePreview();
});
