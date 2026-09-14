/**
 * Enrollment Management - Supabase Realtime & Interactive JavaScript
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';
import { EmailNotificationService } from '../../js/email_service.js';

(function() {
    'use strict';

    console.log('📚 Enrollment Management module ready with Supabase');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const adminName = document.getElementById('adminName');
    const adminInitial = document.getElementById('adminInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const alertContainer = document.getElementById('alertContainer');
    const tableBody = document.getElementById('tableBody');
    const recordCount = document.getElementById('recordCount');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const filterForm = document.getElementById('filterForm');

    // Notification elements
    const notificationBtn = document.getElementById('notificationBtn');
    const notifCount = document.getElementById('notifCount');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    // Modal elements
    const modal = document.getElementById('addModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addEnrollmentForm = document.getElementById('addEnrollmentForm');
    const gradeSelect = document.getElementById('gradeSelect');
    const strandGroup = document.getElementById('strandGroup');

    // Stats
    const totalEnrollments = document.getElementById('totalEnrollments');
    const pendingCount = document.getElementById('pendingCount');
    const enrolledCount = document.getElementById('enrolledCount');
    const rejectedCount = document.getElementById('rejectedCount');
    const pendingActionCount = document.getElementById('pendingActionCount');

    // ============================================
    // STATE
    // ============================================

    let enrollments = [];
    let students = [];
    let notifications = [];
    let unreadCount = 0;

    // Check URL parameters for status filter (e.g. enrollments.html?status=Pending)
    const urlParams = new URLSearchParams(window.location.search);
    const initialStatusParam = urlParams.get('status');
    if (initialStatusParam && statusFilter) {
        statusFilter.value = initialStatusParam;
    }

    // ============================================
    // SET REGISTRAR NAME & LOGOUT
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('plsnhs_registrar_avatar');
            localStorage.removeItem('plsnhs_registrar_name');
            try {
                await supabase.auth.signOut();
            } catch(err) {}
            window.location.replace('../auth/login.html');
        });
    }

    // Date
    const dateBadge = document.getElementById('dateBadge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // Mobile menu toggle
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // ============================================
    // FETCH ENROLLMENTS FROM SUPABASE
    // ============================================

    async function fetchEnrollments() {
        try {
            const [enrRes, stdRes] = await Promise.all([
                supabase.from('enrollments').select('*').order('created_at', { ascending: false }),
                supabase.from('students').select('*')
            ]);

            const enrData = enrRes.data || [];
            const stdData = stdRes.data || [];
            students = stdData;

            // Map and normalize enrollments
            enrollments = enrData.map(enr => {
                const std = stdData.find(s => s.id === enr.student_id || (s.email && enr.email && s.email.toLowerCase() === enr.email.toLowerCase())) || {};
                const fName = (std.first_name || enr.first_name || '').trim();
                const lName = (std.last_name || enr.last_name || '').trim();
                const fullName = `${fName} ${lName}`.trim() || 'Student Applicant';
                const email = enr.email || std.email || '—';
                const idNumber = std.lrn || std.student_id_number || enr.lrn || 'Pending LRN';
                const gradeLevel = enr.grade_level || std.grade_level || 'Grade 7';
                const strand = enr.strand || std.strand || '';
                const schoolYear = enr.last_school_year || enr.school_year || '2026-2027';
                const studentType = enr.student_type || (gradeLevel.includes('7') ? 'New' : 'Continuing');
                const rawStatus = (enr.status || 'Pending').trim();
                const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

                return {
                    id: enr.id,
                    student_id: enr.student_id || std.id,
                    fullname: fullName,
                    first_name: fName,
                    last_name: lName,
                    email: email,
                    id_number: idNumber,
                    grade_name: gradeLevel,
                    strand: strand,
                    school_year: schoolYear,
                    student_type: studentType,
                    status: status,
                    created_at: enr.created_at
                };
            });

            filterEnrollments();
            updateStats();
            populateStudentSelect();

        } catch (error) {
            console.error('Error fetching enrollments:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8">
                            <div class="no-data">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>Error Loading Records</h3>
                                <p>${error.message || 'Unable to load enrollments'}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        const total = enrollments.length;
        const pending = enrollments.filter(e => e.status.toLowerCase() === 'pending').length;
        const enrolled = enrollments.filter(e => e.status.toLowerCase() === 'enrolled' || e.status.toLowerCase() === 'approved').length;
        const rejected = enrollments.filter(e => e.status.toLowerCase() === 'rejected').length;

        if (totalEnrollments) totalEnrollments.textContent = total;
        if (pendingCount) pendingCount.textContent = pending;
        if (enrolledCount) enrolledCount.textContent = enrolled;
        if (rejectedCount) rejectedCount.textContent = rejected;
        if (pendingActionCount) pendingActionCount.textContent = pending;

        // Update live sidebar pending badge
        const pendingBadge = document.getElementById('pendingEnrollmentsBadge');
        if (pendingBadge) {
            if (pending > 0) {
                pendingBadge.textContent = pending;
                pendingBadge.style.display = 'inline-flex';
            } else {
                pendingBadge.style.display = 'none';
            }
        }
    }

    // ============================================
    // RENDER TABLE
    // ============================================

    function renderTable(data) {
        const rows = data || enrollments;

        if (!tableBody) return;

        if (rows.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="no-data">
                            <i class="fas fa-file-signature"></i>
                            <h3>No Enrollment Records Found</h3>
                            <p>Try adjusting your filters or add a new enrollment.</p>
                        </div>
                    </td>
                </tr>
            `;
            if (recordCount) recordCount.textContent = 'Total: 0 records';
            return;
        }

        let html = '';
        rows.forEach(row => {
            const avatarInitial = (row.fullname || 'S').charAt(0).toUpperCase();

            html += `
                <tr>
                    <td data-label="Student">
                        <div class="student-info">
                            <div class="student-avatar">${avatarInitial}</div>
                            <div class="student-details">
                                <h4>${row.fullname}</h4>
                                <span><i class="fas fa-envelope"></i> ${row.email}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="ID Number">
                        <span class="id-badge">${row.id_number}</span>
                    </td>
                    <td data-label="Grade & Strand">
                        <span class="grade-tag">${row.grade_name}</span>
                        ${row.strand ? `<span class="grade-tag strand" style="background:#e0f2fe; color:#0369a1;">${row.strand}</span>` : ''}
                    </td>
                    <td data-label="School Year">
                        <span class="school-year">${row.school_year}</span>
                    </td>
                    <td data-label="Student Type">
                        <span class="student-type-badge student-type-${(row.student_type || 'new').toLowerCase()}">
                            ${row.student_type || 'New'}
                        </span>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge status-${(row.status || 'pending').toLowerCase() === 'enrolled' || (row.status || '').toLowerCase() === 'approved' ? 'enrolled' : ((row.status || '').toLowerCase() === 'rejected' ? 'rejected' : 'pending')}">
                            ${(row.status || 'pending').toLowerCase() === 'enrolled' || (row.status || '').toLowerCase() === 'approved' ? 'Enrolled' : ((row.status || '').toLowerCase() === 'rejected' ? 'Rejected' : 'Pending')}
                        </span>
                    </td>
                    <td data-label="Requirements">
                        <span class="complete-badge-sm"><i class="fas fa-check-circle"></i> Complete</span>
                    </td>
                    <td data-label="Actions">
                        <div class="action-btns">
                            <a href="view_enrollment.html?id=${row.id}" class="action-btn view" title="View Application Details">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${(row.status || 'pending').toLowerCase() === 'pending' ? `
                                <button type="button" class="action-btn approve" data-id="${row.id}" data-name="${row.fullname}" title="Approve Application">
                                    <i class="fas fa-check-circle"></i>
                                </button>
                                <button type="button" class="action-btn reject" data-id="${row.id}" data-name="${row.fullname}" title="Reject Application">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            ` : ''}
                            <button type="button" class="action-btn delete" data-id="${row.id}" data-name="${row.fullname}" title="Delete Record">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        if (recordCount) recordCount.textContent = `Total: ${rows.length} records`;

        // Bind action buttons
        tableBody.querySelectorAll('.action-btn.approve').forEach(btn => {
            btn.addEventListener('click', () => approveEnrollment(btn.dataset.id, btn.dataset.name));
        });

        tableBody.querySelectorAll('.action-btn.reject').forEach(btn => {
            btn.addEventListener('click', () => rejectEnrollment(btn.dataset.id, btn.dataset.name));
        });

        tableBody.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteEnrollment(btn.dataset.id, btn.dataset.name));
        });
    }

    // ============================================
    // FILTER FUNCTION
    // ============================================

    function filterEnrollments() {
        const search = (searchInput?.value || '').toLowerCase().trim();
        const status = (statusFilter?.value || '').toLowerCase().trim();

        let filtered = [...enrollments];

        if (search) {
            filtered = filtered.filter(e =>
                (e.fullname && e.fullname.toLowerCase().includes(search)) ||
                (e.email && e.email.toLowerCase().includes(search)) ||
                (e.id_number && e.id_number.toLowerCase().includes(search)) ||
                (e.school_year && e.school_year.toLowerCase().includes(search)) ||
                (e.grade_name && e.grade_name.toLowerCase().includes(search))
            );
        }

        if (status && status !== 'all') {
            filtered = filtered.filter(e => e.status.toLowerCase() === status);
        }

        renderTable(filtered);
    }

    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterEnrollments();
        });
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterEnrollments, 250);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterEnrollments);
    }

    // ============================================
    // CREDENTIALS MODAL & NOTIFICATION HELPERS
    // ============================================

    let activeCredentialsData = null;

    function showCredentialsModal(creds) {
        activeCredentialsData = creds;
        const credModal = document.getElementById('credentialsModal');
        const credName = document.getElementById('credStudentName');
        const credUser = document.getElementById('credUsername');
        const credPass = document.getElementById('credPassword');

        if (credName) credName.textContent = creds.studentFullName || `${creds.firstName} ${creds.lastName}`;
        if (credUser) credUser.textContent = creds.email;
        if (credPass) credPass.textContent = creds.lastName;

        if (credModal) {
            credModal.style.display = 'flex';
        }
    }

    function closeCredentialsModal() {
        const credModal = document.getElementById('credentialsModal');
        if (credModal) credModal.style.display = 'none';
    }

    const closeCredBtn = document.getElementById('closeCredentialsBtn');
    const dismissCredBtn = document.getElementById('dismissCredentialsBtn');
    const copyUserBtn = document.getElementById('copyUsernameBtn');
    const copyPassBtn = document.getElementById('copyPasswordBtn');
    const sendGmailCredBtn = document.getElementById('sendGmailCredBtn');
    const copyEmailTextBtn = document.getElementById('copyEmailTextBtn');
    const sendMailtoCredBtn = document.getElementById('sendMailtoCredBtn');

    if (closeCredBtn) closeCredBtn.addEventListener('click', closeCredentialsModal);
    if (dismissCredBtn) dismissCredBtn.addEventListener('click', closeCredentialsModal);

    if (copyUserBtn) {
        copyUserBtn.addEventListener('click', () => {
            const userText = document.getElementById('credUsername')?.textContent || '';
            navigator.clipboard.writeText(userText).then(() => {
                showAlert('📋 Username copied to clipboard!', 'success');
            });
        });
    }

    if (copyPassBtn) {
        copyPassBtn.addEventListener('click', () => {
            const passText = document.getElementById('credPassword')?.textContent || '';
            navigator.clipboard.writeText(passText).then(() => {
                showAlert('📋 Password copied to clipboard!', 'success');
            });
        });
    }

    if (sendGmailCredBtn) {
        sendGmailCredBtn.addEventListener('click', () => {
            if (!activeCredentialsData) return;
            const emailData = EmailNotificationService.buildCredentialsEmail(activeCredentialsData);
            EmailNotificationService.sendViaGmailWeb(emailData);
            showAlert(`📧 Opening Gmail compose to send credentials to ${activeCredentialsData.email}...`, 'success');
        });
    }

    if (copyEmailTextBtn) {
        copyEmailTextBtn.addEventListener('click', async () => {
            if (!activeCredentialsData) return;
            const emailData = EmailNotificationService.buildCredentialsEmail(activeCredentialsData);
            const success = await EmailNotificationService.copyEmailText(emailData);
            if (success) {
                showAlert('📋 Full credentials email text copied to clipboard!', 'success');
            } else {
                showAlert('⚠️ Could not copy email text.', 'error');
            }
        });
    }

    if (sendMailtoCredBtn) {
        sendMailtoCredBtn.addEventListener('click', () => {
            if (!activeCredentialsData) return;
            const emailData = EmailNotificationService.buildCredentialsEmail(activeCredentialsData);
            EmailNotificationService.sendViaMailto(emailData);
        });
    }

    async function provisionAndApproveStudentById(id) {
        // 1. Fetch enrollment
        const { data: enr, error: enrErr } = await supabase
            .from('enrollments')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (enrErr || !enr) {
            throw new Error('Enrollment record not found.');
        }

        // Fetch student if exists
        let studentData = null;
        if (enr.student_id) {
            const { data: s } = await supabase.from('students').select('*').eq('id', enr.student_id).maybeSingle();
            studentData = s;
        }

        const email = (enr.email || studentData?.email || '').trim().toLowerCase();
        let lastName = (enr.last_name || studentData?.last_name || '').trim();
        let firstName = (enr.first_name || studentData?.first_name || '').trim();
        const gradeLevel = enr.grade_level || studentData?.grade_level || 'Grade 11';
        const strand = enr.strand || studentData?.strand || '';

        if (!lastName && enr.fullname) {
            const parts = enr.fullname.trim().split(' ');
            firstName = parts.slice(0, -1).join(' ') || parts[0];
            lastName = parts[parts.length - 1];
        }

        if (!email) {
            throw new Error(`Cannot provision account: Student email is missing on enrollment record.`);
        }

        if (!lastName) {
            lastName = 'Student';
        }

        const studentFullName = `${firstName} ${lastName}`.trim() || 'Student';

        // 2. Query / Upsert in public.users table (Username = Email, Password = Last Name)
        const { data: existingUsers } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email);

        let studentUserId = null;

        if (existingUsers && existingUsers.length > 0) {
            studentUserId = existingUsers[0].id;
            await supabase
                .from('users')
                .update({
                    password: lastName, // Password is Last Name
                    role: 'student',
                    first_name: firstName || existingUsers[0].first_name,
                    last_name: lastName || existingUsers[0].last_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', studentUserId);
        } else {
            const { data: newUser, error: insErr } = await supabase
                .from('users')
                .insert([{
                    email: email,
                    password: lastName, // Password is Last Name
                    role: 'student',
                    first_name: firstName,
                    last_name: lastName,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (insErr) {
                console.error('Error inserting user in users table:', insErr);
            } else if (newUser && newUser.length > 0) {
                studentUserId = newUser[0].id;
            }
        }

        // 3. Ensure students table profile
        let studentTableId = studentData?.id || enr.student_id;
        const studentPayload = {
            first_name: firstName,
            last_name: lastName,
            middle_name: enr.middle_name || studentData?.middle_name || null,
            email: email,
            grade_level: gradeLevel,
            strand: strand,
            date_of_birth: enr.date_of_birth || enr.dob || studentData?.date_of_birth || null,
            birth_date: enr.dob || studentData?.birth_date || null,
            age: enr.age || studentData?.age || null,
            gender: enr.gender || studentData?.gender || null,
            nationality: enr.nationality || studentData?.nationality || 'Filipino',
            religion: enr.religion || studentData?.religion || null,
            address: enr.address || studentData?.address || null,
            contact_number: enr.contact_number || enr.guardian_contact || studentData?.contact_number || null,
            parent_name: enr.guardian_name || enr.mother_name || enr.father_name || studentData?.parent_name || null,
            parent_contact: enr.guardian_contact || studentData?.parent_contact || null,
            enrollment_id: enr.id,
            documents_status: 'complete',
            updated_at: new Date().toISOString()
        };

        if (studentTableId) {
            await supabase
                .from('students')
                .update(studentPayload)
                .eq('id', studentTableId);
        } else {
            const { data: existingStudent } = await supabase
                .from('students')
                .select('id')
                .ilike('email', email)
                .maybeSingle();

            if (existingStudent) {
                studentTableId = existingStudent.id;
                await supabase
                    .from('students')
                    .update(studentPayload)
                    .eq('id', studentTableId);
            } else {
                studentPayload.created_at = new Date().toISOString();
                const { data: createdStudent } = await supabase
                    .from('students')
                    .insert([studentPayload])
                    .select();

                if (createdStudent && createdStudent.length > 0) {
                    studentTableId = createdStudent[0].id;
                }
            }
        }

        // Link student_id in users if not linked
        if (studentUserId && studentTableId) {
            await supabase
                .from('users')
                .update({ student_id: studentTableId })
                .eq('id', studentUserId);
        }

        // 4. Update enrollments record
        const { error: enrUpdateErr } = await supabase
            .from('enrollments')
            .update({
                status: 'enrolled',
                student_id: studentTableId || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (enrUpdateErr) {
            console.error('Error updating enrollment record:', enrUpdateErr);
            throw enrUpdateErr;
        }

        // 5. Send Approval Notification with credentials
        const credentialsMessage = `Congratulations ${firstName}! Your enrollment for ${gradeLevel}${strand ? ' (' + strand + ')' : ''} has been approved by the Registrar.\n\nYour Student Portal Login Credentials:\n• Username (Email): ${email}\n• Password: ${lastName}\n\nYou can now log in to the PLSNHS Student Portal.`;

        await supabase
            .from('notifications')
            .insert([{
                user_id: studentUserId || studentTableId || null,
                role: 'student',
                title: '🎉 Enrollment Approved!',
                message: credentialsMessage,
                type: 'action',
                enrollment_id: enr.id,
                read: false,
                is_read: false,
                created_at: new Date().toISOString()
            }]);

        return {
            email,
            lastName,
            firstName,
            studentFullName,
            gradeLevel,
            strand
        };
    }

    // ============================================
    // APPROVE / REJECT / DELETE (Supabase)
    // ============================================

    async function approveEnrollment(id, name) {
        if (!confirm(`Approve enrollment application for ${name}?`)) return;

        try {
            showAlert('Processing enrollment approval & account creation...', 'info');
            const creds = await provisionAndApproveStudentById(id);
            showCredentialsModal(creds);
            showAlert(`✅ Enrollment approved for ${creds.studentFullName}! Student account created (Username: ${creds.email}, Password: ${creds.lastName}).`, 'success');
            await fetchEnrollments();
        } catch (error) {
            console.error('Error approving enrollment:', error);
            showAlert('❌ Error approving: ' + error.message, 'error');
        }
    }

    async function rejectEnrollment(id, name) {
        const reason = prompt(`Please enter reason for rejecting enrollment for ${name}:`, 'Incomplete requirements or duplicate application.');
        if (reason === null) return;

        try {
            const { error } = await supabase
                .from('enrollments')
                .update({ 
                    status: 'Rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            try {
                await supabase
                    .from('notifications')
                    .insert([{
                        role: 'student',
                        title: '⚠️ Enrollment Update',
                        message: `Your enrollment application was not approved. Reason: ${reason}`,
                        type: 'enrollment_status',
                        enrollment_id: id,
                        is_read: false,
                        read: false,
                        created_at: new Date().toISOString()
                    }]);
            } catch(nErr) {}

            showAlert(`❌ Enrollment application for ${name} has been rejected.`, 'info');
            await fetchEnrollments();
        } catch (error) {
            console.error('Error rejecting enrollment:', error);
            showAlert('❌ Error rejecting: ' + error.message, 'error');
        }
    }

    async function deleteEnrollment(id, name) {
        if (!confirm(`Are you sure you want to permanently delete the enrollment record for ${name}?`)) return;

        try {
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showAlert(`🗑️ Enrollment record for ${name} deleted successfully.`, 'success');
            await fetchEnrollments();
        } catch (error) {
            console.error('Error deleting enrollment:', error);
            showAlert('❌ Error deleting: ' + error.message, 'error');
        }
    }

    // ============================================
    // MODAL FUNCTIONS & ADD ENROLLMENT
    // ============================================

    function openModal() {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            if (addEnrollmentForm) addEnrollmentForm.reset();
        }
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }

    if (gradeSelect) {
        gradeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const gradeName = selectedOption ? selectedOption.text : '';
            if (strandGroup) {
                if (gradeName.includes('Grade 11') || gradeName.includes('Grade 12')) {
                    strandGroup.style.display = 'block';
                } else {
                    strandGroup.style.display = 'none';
                }
            }
        });
    }

    function populateStudentSelect() {
        const select = document.getElementById('studentSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Choose Student (Optional) --</option>';
        students.forEach(student => {
            const name = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
            select.innerHTML += `
                <option value="${student.id}">${name} (${student.email || 'No email'})</option>
            `;
        });
    }

    if (addEnrollmentForm) {
        addEnrollmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const studentId = document.getElementById('studentSelect')?.value || null;
            const gradeName = document.getElementById('gradeSelect')?.value || 'Grade 7';
            const strand = document.getElementById('strandSelect')?.value || null;
            const studentType = document.getElementById('studentTypeSelect')?.value || 'new';
            const schoolYear = document.getElementById('schoolYearInput')?.value || '2026-2027';
            const status = document.getElementById('statusSelect')?.value || 'Pending';

            let fName = 'Walk-in';
            let lName = 'Student';
            let email = 'walkin.student@plsnhs.edu.ph';

            if (studentId) {
                const matched = students.find(s => s.id === studentId);
                if (matched) {
                    fName = matched.first_name || fName;
                    lName = matched.last_name || lName;
                    email = matched.email || email;
                }
            }

            try {
                const { data: createdEnr, error } = await supabase
                    .from('enrollments')
                    .insert([{
                        student_id: studentId,
                        first_name: fName,
                        last_name: lName,
                        email: email,
                        grade_level: gradeName,
                        strand: strand,
                        student_type: studentType,
                        last_school_year: schoolYear,
                        status: status,
                        created_at: new Date().toISOString()
                    }])
                    .select();

                if (error) throw error;

                closeModal();

                if (status === 'Enrolled' && createdEnr && createdEnr[0]) {
                    const creds = await provisionAndApproveStudentById(createdEnr[0].id);
                    showCredentialsModal(creds);
                    showAlert(`✅ New enrolled student added! Account created (Username: ${creds.email}, Password: ${creds.lastName}).`, 'success');
                } else {
                    showAlert('✅ New enrollment record added successfully!', 'success');
                }

                await fetchEnrollments();
            } catch (err) {
                console.error('Error adding enrollment:', err);
                showAlert('❌ Error adding enrollment: ' + err.message, 'error');
            }
        });
    }

    const schoolYearInput = document.getElementById('schoolYearInput');
    if (schoolYearInput) {
        const currentYear = new Date().getFullYear();
        schoolYearInput.value = `${currentYear}-${currentYear + 1}`;
    }

    // ============================================
    // NOTIFICATIONS SYSTEM
    // ============================================

    function playNotificationChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    function showNotificationToast(notif) {
        if (!alertContainer) return;
        const toast = document.createElement('div');
        toast.className = 'alert alert-info notif-toast-banner';
        toast.style.cursor = 'pointer';
        toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)';
        toast.style.borderLeft = '5px solid var(--primary)';
        toast.style.animation = 'slideDown 0.4s ease-out';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-bell" style="color: var(--primary); font-size: 1.25rem;"></i>
                    <div>
                        <strong style="display: block; font-size: 13.5px; color: #0f172a;">${notif.title || 'New Enrollment Notification'}</strong>
                        <span style="font-size: 12px; color: #475569;">${notif.message || ''}</span>
                    </div>
                </div>
                <button type="button" style="background: var(--primary); color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; margin-left: 12px;">
                    View
                </button>
            </div>
        `;

        toast.addEventListener('click', () => {
            if (notif.enrollment_id || notif.enrollmentId) {
                window.location.href = `view_enrollment.html?id=${notif.enrollment_id || notif.enrollmentId}`;
            } else {
                fetchEnrollments();
            }
        });

        alertContainer.prepend(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 8000);
    }

    async function loadNotifications() {
        if (!notificationList) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or('role.eq.registrar,role.is.null')
                .order('created_at', { ascending: false })
                .limit(30);

            if (!error && data && data.length > 0) {
                notifications = data;
            } else {
                notifications = [];
            }
        } catch (error) {
            console.warn('Error loading notifications:', error);
            notifications = [];
        }

        updateUnreadCount();
        renderNotifications();
        updateBadge();
    }

    function updateUnreadCount() {
        unreadCount = notifications.filter(n => n.is_read !== true && n.read !== true && n.isRead !== true).length;
    }

    function updateBadge() {
        if (notifCount) {
            if (unreadCount > 0) {
                notifCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
                notifCount.style.display = 'flex';
            } else {
                notifCount.style.display = 'none';
            }
        }
    }

    function renderNotifications() {
        if (!notificationList) return;

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        const typeIcons = {
            new_enrollment: 'fa-file-signature',
            enrollment: 'fa-file-signature',
            update: 'fa-megaphone',
            action: 'fa-check-circle',
            reminder: 'fa-clock',
            alert: 'fa-exclamation-triangle',
            message: 'fa-envelope'
        };

        notificationList.innerHTML = notifications.map(notif => {
            const notifType = notif.type || 'message';
            const icon = typeIcons[notifType] || 'fa-bell';
            const isRead = notif.is_read === true || notif.read === true || notif.isRead === true;
            const title = notif.title || 'New Notification';
            const message = notif.message || '';
            const notifId = notif.id;
            
            return `
                <div class="notif-item ${isRead ? 'read' : 'unread'}" data-id="${notifId}">
                    <div class="notif-icon notif-${notifType}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-title">${title}</div>
                        <div class="notif-message">${message}</div>
                        <div class="notif-time">
                            <i class="far fa-clock" style="margin-right: 4px;"></i>${formatTime(notif.created_at || notif.createdAt)}
                        </div>
                    </div>
                    ${!isRead ? `
                        <button class="mark-read-btn" data-id="${notifId}" title="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        notificationList.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                markAsRead(id);
            });
        });

        notificationList.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id;
                const notif = notifications.find(n => String(n.id) === String(id));
                if (notif && !(notif.is_read === true || notif.read === true || notif.isRead === true)) {
                    markAsRead(id);
                }
                if (notif && (notif.enrollment_id || notif.enrollmentId)) {
                    window.location.href = `view_enrollment.html?id=${notif.enrollment_id || notif.enrollmentId}`;
                }
            });
        });
    }

    async function markAsRead(id) {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true, read: true })
                .eq('id', id);

            const notif = notifications.find(n => String(n.id) === String(id));
            if (notif) {
                notif.is_read = true;
                notif.read = true;
                notif.isRead = true;
            }
            updateUnreadCount();
            renderNotifications();
            updateBadge();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true, read: true })
                .or('role.eq.registrar,role.is.null');

            notifications.forEach(n => {
                n.is_read = true;
                n.read = true;
                n.isRead = true;
            });
            updateUnreadCount();
            renderNotifications();
            updateBadge();
            showAlert('✅ All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
            showAlert('❌ Error marking all as read', 'error');
        }
    }

    function setupRealtimeNotifications() {
        try {
            supabase
                .channel('registrar_enrollments_page_realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, (payload) => {
                    if (!payload || !payload.new) return;
                    const newNotif = payload.new;
                    if (!newNotif.role || newNotif.role === 'registrar') {
                        if (!notifications.some(n => String(n.id) === String(newNotif.id))) {
                            notifications.unshift(newNotif);
                            updateUnreadCount();
                            renderNotifications();
                            updateBadge();
                            showNotificationToast(newNotif);
                            playNotificationChime();
                            fetchEnrollments();
                        }
                    }
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'enrollments'
                }, () => {
                    fetchEnrollments();
                })
                .subscribe();
        } catch (err) {
            console.warn('Realtime subscription error:', err);
        }

        // Cross-tab synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === 'plsnhs_latest_notification' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (!data.role || data.role === 'registrar') {
                        loadNotifications();
                        fetchEnrollments();
                        showNotificationToast(data);
                        playNotificationChime();
                    }
                } catch(err) {}
            }
        });
    }

    function formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        let date;
        if (typeof timestamp === 'object' && timestamp.toDate) {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'object' && timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) return 'Just now';

        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function(e) {
        if (notificationDropdown && notificationBtn) {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        }
    });

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllAsRead();
        });
    }

    // ============================================
    // SHOW ALERT
    // ============================================

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

    // ============================================
    // INITIALIZE
    // ============================================

    fetchEnrollments();
    loadNotifications();
    setupRealtimeNotifications();

})();