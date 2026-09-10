/**
 * Student Enrollment Form - Supabase Integration
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';

// ============================================================
// REQUIREMENTS DATA
// ============================================================
const requirementsData = {
    'Grade 7': {
        'new': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion (Elementary)', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    },
    'Grade 8': {
        'continuing': [
            { name: 'Form 138 (Report Card)', required: true, can_follow: false, field: 'form_138' }
        ],
        'transferee': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Latest Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    },
    'Grade 9': {
        'continuing': [
            { name: 'Form 138 (Report Card)', required: true, can_follow: false, field: 'form_138' }
        ],
        'transferee': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Latest Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    },
    'Grade 10': {
        'continuing': [
            { name: 'Form 138 (Report Card)', required: true, can_follow: false, field: 'form_138' }
        ],
        'transferee': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Latest Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    },
    'Grade 11': {
        'same_school': [
            { name: 'Form 138 (Grade 10 Report Card)', required: true, can_follow: false, field: 'form_138' }
        ],
        'different_school': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Grade 10 Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion (Junior High)', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    },
    'Grade 12': {
        'continuing': [
            { name: 'Form 138 (Grade 11 Report Card)', required: true, can_follow: false, field: 'form_138' }
        ],
        'transferee': [
            { name: 'Form 137 (Permanent Record)', required: true, can_follow: false, field: 'form_137' },
            { name: 'Form 138 (Grade 11 Report Card)', required: true, can_follow: false, field: 'form_138' },
            { name: 'Certificate of Completion', required: true, can_follow: false, field: 'certificate_of_completion' },
            { name: 'PSA Birth Certificate', required: true, can_follow: false, field: 'psa_birth_cert' },
            { name: 'Good Moral Certificate', required: true, can_follow: false, field: 'good_moral_cert' }
        ]
    }
};

// ============================================================
// DOM REFS
// ============================================================
const $ = (id) => document.getElementById(id);

const gradeRadios = document.querySelectorAll('input[name="gradeLevel"]');
const studentTypeGroup = $('studentTypeGroup');
const studentTypeSelect = $('student_type');
const strandDiv = $('strandDiv');
const schoolYearInput = $('school_year');
const requirementsSection = $('requirementsSection');
const requirementsList = $('requirementsList');
const enrollmentForm = $('enrollmentForm');
const alertContainer = $('alertContainer');
const existingEnrollmentDiv = $('existingEnrollment');
const enrollmentDisplay = $('enrollmentDisplay');
const logoutBtn = $('logoutBtn');
const backBtn = $('backBtn');
const submitBtn = $('submitBtn');

let sessionUser = null;
try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        sessionUser = JSON.parse(stored);
    }
} catch(e) {}

if (!sessionUser) {
    window.location.replace('../auth/login.html');
}

// Auto-populate school year
if (schoolYearInput) {
    const today = new Date();
    const year = today.getFullYear();
    schoolYearInput.value = year + '-' + (year + 1);
}

function getStudentTypeOptions(gradeName) {
    const map = {
        'Grade 7': { 'new': 'New Student (From Elementary)' },
        'Grade 8': { 'continuing': 'Continuing Student', 'transferee': 'Transferee (From another school)' },
        'Grade 9': { 'continuing': 'Continuing Student', 'transferee': 'Transferee (From another school)' },
        'Grade 10': { 'continuing': 'Continuing Student', 'transferee': 'Transferee (From another school)' },
        'Grade 11': {
            'same_school': 'From PLSNHS Junior High',
            'different_school': 'From a different school (Transferee)'
        },
        'Grade 12': { 'continuing': 'Continuing Student (From Grade 11)', 'transferee': 'Transferee (From another school)' }
    };
    return map[gradeName] || {};
}

function getSelectedGrade() {
    const checked = document.querySelector('input[name="gradeLevel"]:checked');
    return checked ? checked.value : '';
}

function getSelectedStrand() {
    const checked = document.querySelector('input[name="strand"]:checked');
    return checked ? checked.value : '';
}

function showAlert(message, type = 'success') {
    if (!alertContainer) return;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

function updateStudentTypeOptions() {
    const gradeName = getSelectedGrade();

    if (gradeName) {
        const options = getStudentTypeOptions(gradeName);
        studentTypeSelect.innerHTML = '<option value="">-- Select Student Type --</option>';

        for (const [value, label] of Object.entries(options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            studentTypeSelect.appendChild(option);
        }

        studentTypeGroup.style.display = 'block';

        if (gradeName === 'Grade 11' || gradeName === 'Grade 12') {
            strandDiv.style.display = 'block';
        } else {
            strandDiv.style.display = 'none';
            document.querySelectorAll('input[name="strand"]').forEach(r => r.checked = false);
        }

        requirementsSection.style.display = 'none';
        requirementsList.innerHTML = '';

    } else {
        studentTypeGroup.style.display = 'none';
        strandDiv.style.display = 'none';
        requirementsSection.style.display = 'none';
    }
}

function updateRequirements() {
    const gradeName = getSelectedGrade();
    const studentType = studentTypeSelect.value;

    if (gradeName && studentType && requirementsData[gradeName] && requirementsData[gradeName][studentType]) {
        requirementsSection.style.display = 'block';
        const requirements = requirementsData[gradeName][studentType];

        requirementsList.innerHTML = '';
        requirements.forEach(req => {
            const reqDiv = document.createElement('div');
            reqDiv.className = 'requirement-item';

            let badgeHtml = req.required ? 
                '<span class="req-badge badge-required">Required</span>' : 
                '<span class="req-badge badge-optional">Optional</span>';

            reqDiv.innerHTML = `
                <div class="requirement-name">
                    <span><i class="fas fa-file"></i> ${req.name}</span>
                    <div>${badgeHtml}</div>
                </div>
                <div class="file-upload-area" onclick="document.getElementById('${req.field}').click()">
                    <i class="fas fa-cloud-upload-alt"></i> Click to upload
                    <p style="font-size: 11px; color: #666; margin-top: 5px;">PDF, JPG, JPEG, or PNG</p>
                </div>
                <input type="file" name="${req.field}" id="${req.field}" accept=".pdf,.jpg,.jpeg,.png" style="display: none;" 
                       ${req.required ? 'required' : ''}>
                <div class="file-name" id="${req.field}_name"></div>
            `;
            requirementsList.appendChild(reqDiv);
        });

        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', function() {
                const fileNameDiv = document.getElementById(this.id + '_name');
                if (this.files && this.files.length > 0) {
                    fileNameDiv.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> ' + this.files[0].name;
                } else {
                    fileNameDiv.innerHTML = '';
                }
            });
        });

    } else {
        requirementsSection.style.display = 'none';
    }
}

gradeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        updateStudentTypeOptions();
        studentTypeSelect.value = '';
        requirementsSection.style.display = 'none';
    });
});

if (studentTypeSelect) {
    studentTypeSelect.addEventListener('change', updateRequirements);
}

// ============================================================
// LOAD EXISTING ENROLLMENT FROM SUPABASE
// ============================================================
async function loadExistingEnrollment() {
    try {
        const userEmail = sessionUser?.email || '';
        const userUid = sessionUser?.uid || '';

        let query = supabase.from('enrollments').select('*');
        if (userEmail && userUid) {
            query = query.or(`email.eq.${userEmail},student_id.eq.${userUid}`);
        } else if (userEmail) {
            query = query.eq('email', userEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            const latest = data[0];
            const isPendingOrApproved = latest.status?.toLowerCase() === 'pending' || latest.status?.toLowerCase() === 'approved' || latest.status?.toLowerCase() === 'enrolled';

            if (isPendingOrApproved && existingEnrollmentDiv && enrollmentForm) {
                existingEnrollmentDiv.style.display = 'block';
                enrollmentForm.style.display = 'none';

                const dateStr = latest.created_at ? new Date(latest.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';

                enrollmentDisplay.innerHTML = `
                    <div class="enrollment-badge status-${(latest.status || 'pending').toLowerCase()}">
                        Status: ${latest.status || 'Pending'}
                    </div>
                    <div class="enrollment-details">
                        <p><strong>Grade Level:</strong> ${latest.grade_level || 'N/A'}</p>
                        ${latest.strand ? `<p><strong>Strand:</strong> ${latest.strand}</p>` : ''}
                        <p><strong>School Year:</strong> ${latest.school_year || latest.last_school_year || '2025-2026'}</p>
                        <p><strong>Date Submitted:</strong> ${dateStr}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading existing enrollment:', error);
    }
}

// ============================================================
// SUBMIT ENROLLMENT TO SUPABASE
// ============================================================
async function submitEnrollment(e) {
    e.preventDefault();

    const gradeName = getSelectedGrade();
    if (!gradeName) {
        showAlert('⚠️ Please select your grade level', 'error');
        return;
    }

    const studentType = studentTypeSelect.value;
    if (!studentType) {
        showAlert('⚠️ Please select your student type', 'error');
        return;
    }

    const schoolYear = schoolYearInput.value.trim();
    if (!schoolYear) {
        showAlert('⚠️ Please enter the school year', 'error');
        return;
    }

    let strand = '';
    if (gradeName === 'Grade 11' || gradeName === 'Grade 12') {
        strand = getSelectedStrand();
        if (!strand) {
            showAlert('⚠️ Please select your strand', 'error');
            return;
        }
    }

    const requirements = requirementsData[gradeName]?.[studentType] || [];
    const missingFiles = [];

    requirements.forEach(req => {
        if (req.required) {
            const fileInput = document.getElementById(req.field);
            if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
                missingFiles.push(req.name);
            }
        }
    });

    if (missingFiles.length > 0) {
        showAlert(`⚠️ Please upload: ${missingFiles.join(', ')}`, 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    try {
        const firstName = document.getElementById('firstName')?.value || sessionUser?.firstName || '';
        const lastName = document.getElementById('lastName')?.value || sessionUser?.lastName || '';
        const previousSchool = document.getElementById('previousSchool')?.value || 'N/A';
        const previousGrade = document.getElementById('previousGrade')?.value || 'N/A';

        // 1. Insert enrollment in Supabase
        const { data: newEnr, error: enrError } = await supabase
            .from('enrollments')
            .insert([{
                student_id: sessionUser.uid,
                email: sessionUser.email,
                first_name: firstName,
                last_name: lastName,
                grade_level: gradeName,
                strand: strand || null,
                previous_school: previousSchool,
                previous_grade: previousGrade,
                last_school_year: schoolYear,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (enrError) throw enrError;

        // 2. Notify Registrar via notifications table
        try {
            await supabase
                .from('notifications')
                .insert([{
                    role: 'registrar',
                    title: '📋 New Enrollment Submission',
                    message: `New enrollment application from ${firstName} ${lastName} (${gradeName} ${strand || ''}).`,
                    type: 'enrollment',
                    read: false,
                    created_at: new Date().toISOString()
                }]);
        } catch(e) {}

        showAlert('✅ Enrollment submitted successfully! The registrar has been notified.', 'success');

        setTimeout(() => {
            window.location.href = 'enrollment_history.html';
        }, 1200);

    } catch (error) {
        console.error('❌ Error submitting enrollment:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Submit Enrollment';
        }
    }
}

if (enrollmentForm) {
    enrollmentForm.addEventListener('submit', submitEnrollment);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('plsnhs_student_avatar');
        localStorage.removeItem('plsnhs_student_name');
        try {
            await supabase.auth.signOut();
        } catch(err) {}
        window.location.replace('../auth/login.html');
    });
}

if (backBtn) {
    backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
}

// Initialize
loadExistingEnrollment();