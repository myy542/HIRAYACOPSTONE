/**
 * Student Enrollment Form - Firebase Integration
 * Complete working enrollment submission with Notification
 */

import { auth, db } from '../../firebase/config.js';
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ============================================================
// REQUIREMENTS DATA
// Continuing (gikan same school) → Form 138 ra
// Transferee/New (gikan laing school) → 5 ka requirements
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
// HELPER FUNCTIONS
// ============================================================

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

let currentUser = null;

// ============================================================
// AUTO-POPULATE SCHOOL YEAR
// ============================================================
if (schoolYearInput) {
    const today = new Date();
    const year = today.getFullYear();
    schoolYearInput.value = year + '-' + (year + 1);
}

// ============================================================
// SHOW ALERT
// ============================================================
function showAlert(message, type = 'success') {
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

// ============================================================
// UPDATE STUDENT TYPE OPTIONS
// ============================================================
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

// ============================================================
// UPDATE REQUIREMENTS
// ============================================================
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

            let badgeHtml = '';
            if (req.required) {
                badgeHtml = '<span class="req-badge badge-required">Required</span>';
            } else {
                badgeHtml = '<span class="req-badge badge-optional">Optional</span>';
            }

            if (req.can_follow) {
                badgeHtml += ' <span class="req-badge badge-follow">Can be followed up</span>';
            }

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

// ============================================================
// GRADE RADIO EVENT LISTENERS
// ============================================================
gradeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        updateStudentTypeOptions();
        studentTypeSelect.value = '';
        requirementsSection.style.display = 'none';
    });
});

// ============================================================
// STUDENT TYPE EVENT LISTENER
// ============================================================
studentTypeSelect.addEventListener('change', function() {
    updateRequirements();
});

// ============================================================
// LOAD EXISTING ENROLLMENT
// ============================================================
async function loadExistingEnrollment(userId) {
    try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(enrollmentsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            let enrollments = [];
            snapshot.forEach(d => enrollments.push({ id: d.id, ...d.data() }));

            enrollments.sort((a, b) => {
                const getTime = (d) => {
                    if (d.createdAt?.toDate) return d.createdAt.toDate().getTime();
                    if (d.createdAt?.seconds) return d.createdAt.seconds * 1000;
                    return new Date(d.createdAt || 0).getTime() || 0;
                };
                return getTime(b) - getTime(a);
            });

            const data = enrollments[0];

            existingEnrollmentDiv.style.display = 'block';
            enrollmentForm.style.display = 'none';

            let dateStr = 'N/A';
            if (data.createdAt) {
                if (data.createdAt.toDate) {
                    dateStr = data.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                } else if (data.createdAt.seconds) {
                    dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                } else {
                    dateStr = new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
            }

            enrollmentDisplay.innerHTML = `
                <div class="enrollment-badge status-${(data.status || 'pending').toLowerCase()}">
                    Status: ${data.status || 'Pending'}
                </div>
                <div class="enrollment-details">
                    <p><strong>Grade Level:</strong> ${data.grade || 'N/A'}</p>
                    ${data.strand ? `<p><strong>Strand:</strong> ${data.strand}</p>` : ''}
                    <p><strong>School Year:</strong> ${data.schoolYear || 'N/A'}</p>
                    <p><strong>Date Submitted:</strong> ${dateStr}</p>
                </div>
            `;
        } else {
            existingEnrollmentDiv.style.display = 'none';
            enrollmentForm.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading existing enrollment:', error);
    }
}

// ============================================================
// SEND NOTIFICATION TO REGISTRAR
// ============================================================
async function sendNotificationToRegistrar(enrollmentData, enrollmentId) {
    try {
        // Get student name
        const firstName = document.getElementById('firstName')?.value || 'N/A';
        const lastName = document.getElementById('lastName')?.value || 'N/A';
        const fullName = `${firstName} ${lastName}`.trim();

        // Get guardian contact
        const guardianContact = document.getElementById('guardianContact')?.value || 'N/A';

        // Build notification data
        const notificationData = {
            type: 'new_enrollment',
            title: '📋 New Enrollment Submission',
            message: `
                <strong>Student:</strong> ${fullName}<br>
                <strong>Grade:</strong> ${enrollmentData.grade || 'N/A'}<br>
                <strong>Student Type:</strong> ${enrollmentData.studentType || 'N/A'}<br>
                ${enrollmentData.strand ? `<strong>Strand:</strong> ${enrollmentData.strand}<br>` : ''}
                <strong>School Year:</strong> ${enrollmentData.schoolYear || 'N/A'}<br>
                <strong>Contact:</strong> ${guardianContact}<br>
                <strong>Status:</strong> Pending Review
            `,
            enrollmentId: enrollmentId,
            userId: enrollmentData.userId,
            userEmail: enrollmentData.userEmail,
            studentName: fullName,
            grade: enrollmentData.grade,
            studentType: enrollmentData.studentType,
            strand: enrollmentData.strand || '',
            schoolYear: enrollmentData.schoolYear,
            status: 'pending',
            isRead: false,
            createdAt: serverTimestamp(),
            timestamp: serverTimestamp()
        };

        // Save to Firestore 'notifications' collection
        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        console.log('✅ Notification sent to registrar with ID:', docRef.id);

        return docRef.id;

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        // Don't throw error - enrollment already saved, notification is secondary
        return null;
    }
}

// ============================================================
// SUBMIT ENROLLMENT - MAIN FUNCTION
// ============================================================
async function submitEnrollment(e) {
    e.preventDefault();

    // 1. Get selected grade
    const gradeName = getSelectedGrade();
    if (!gradeName) {
        showAlert('⚠️ Please select your grade level', 'error');
        return;
    }

    // 2. Get student type
    const studentType = studentTypeSelect.value;
    if (!studentType) {
        showAlert('⚠️ Please select your student type', 'error');
        return;
    }

    // 3. Get school year
    const schoolYear = schoolYearInput.value.trim();
    if (!schoolYear) {
        showAlert('⚠️ Please enter the school year', 'error');
        return;
    }

    // 4. Get strand (if SHS)
    let strand = '';
    if (gradeName === 'Grade 11' || gradeName === 'Grade 12') {
        strand = getSelectedStrand();
        if (!strand) {
            showAlert('⚠️ Please select your strand', 'error');
            return;
        }
    }

    // 5. Check required documents
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

    // 6. Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        // 7. Build enrollment data
        const enrollmentData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            grade: gradeName,
            studentType: studentType,
            schoolYear: schoolYear,
            status: 'Pending',
            createdAt: serverTimestamp()
        };

        // Add strand if SHS
        if (strand) {
            enrollmentData.strand = strand;
        }

        // Add file names
        requirements.forEach(req => {
            const fileInput = document.getElementById(req.field);
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                enrollmentData[req.field + '_filename'] = fileInput.files[0].name;
                enrollmentData[req.field + '_size'] = fileInput.files[0].size;
                enrollmentData[req.field + '_type'] = fileInput.files[0].type;
            }
        });

        // 8. Save to Firestore 'enrollments'
        const docRef = await addDoc(collection(db, 'enrollments'), enrollmentData);
        console.log('✅ Enrollment saved with ID:', docRef.id);

        // 9. SEND NOTIFICATION TO REGISTRAR
        await sendNotificationToRegistrar(enrollmentData, docRef.id);

        // 10. Show success
        showAlert('✅ Enrollment submitted successfully! The registrar has been notified.', 'success');

        // 11. Reset form
        enrollmentForm.reset();
        gradeRadios.forEach(r => r.checked = false);
        document.querySelectorAll('input[name="strand"]').forEach(r => r.checked = false);
        studentTypeSelect.value = '';
        studentTypeGroup.style.display = 'none';
        strandDiv.style.display = 'none';
        requirementsSection.style.display = 'none';
        requirementsList.innerHTML = '';
        document.querySelectorAll('.file-name').forEach(el => el.innerHTML = '');

        // 12. Reload to show existing enrollment
        setTimeout(() => {
            loadExistingEnrollment(currentUser.uid);
        }, 1500);

    } catch (error) {
        console.error('❌ Error submitting enrollment:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Submit Enrollment';
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Form submit
if (enrollmentForm) {
    enrollmentForm.addEventListener('submit', submitEnrollment);
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = '../auth/login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    });
}

// Back button
if (backBtn) {
    backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'dashboard.html';
    });
}

// ============================================================
// AUTH STATE
// ============================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User logged in:', user.email);
        await loadExistingEnrollment(user.uid);
    } else {
        console.log('❌ User logged out - redirecting to login');
        window.location.href = '../auth/login.html';
    }
});

console.log('✅ Enrollment Form ready!');