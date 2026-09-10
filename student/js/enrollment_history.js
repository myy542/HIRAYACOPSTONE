/**
 * Student Enrollment History - Supabase Integration
 * PLSNHS - Placido L. Señor National High School
 */

import { supabase } from '../../supabase/config.js';

(function () {
    'use strict';

    console.log('📊 Student Enrollment History (Supabase) ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const studentName = document.getElementById('studentName');
    const studentInitial = document.getElementById('studentInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats
    const totalEnrollmentsEl = document.getElementById('totalEnrollments');
    const enrolledCountEl = document.getElementById('enrolledCount');
    const pendingCountEl = document.getElementById('pendingCount');
    const uniqueYearsEl = document.getElementById('uniqueYears');

    // Enrollment Status Banner
    const currentBanner = document.getElementById('currentBanner');
    const noEnrollmentBanner = document.getElementById('noEnrollmentBanner');
    const currentGrade = document.getElementById('currentGrade');
    const currentSection = document.getElementById('currentSection');
    const currentStrand = document.getElementById('currentStrand');
    const currentSchoolYear = document.getElementById('currentSchoolYear');
    const studentTypeBadge = document.getElementById('studentTypeBadge');

    // Table & Controls
    const historyCount = document.getElementById('historyCount');
    const historySearchInput = document.getElementById('historySearchInput');
    const historyStatusFilter = document.getElementById('historyStatusFilter');
    const historyTableBody = document.getElementById('historyTableBody');

    // Modal Elements
    const enrollmentDetailModal = document.getElementById('enrollmentDetailModal');
    const modalEnrollmentTitle = document.getElementById('modalEnrollmentTitle');
    const modalEnrollmentBody = document.getElementById('modalEnrollmentBody');
    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    const dismissDetailModalBtn = document.getElementById('dismissDetailModalBtn');

    // Alert Container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let rawEnrollments = [];
    let displayedEnrollments = [];
    let studentProfile = null;
    let sectionsMap = new Map();

    // ============================================
    // SESSION CHECK (Supabase / localStorage)
    // ============================================

    let sessionUser = null;
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            sessionUser = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading currentUser from localStorage', e);
    }

    if (!sessionUser) {
        console.warn('⚠️ No active user session found, redirecting to login...');
        window.location.replace('../auth/login.html');
        return;
    }

    // Role check
    if (sessionUser.role && sessionUser.role !== 'student') {
        const routes = {
            'admin': '../admin/dashboard.html',
            'teacher': '../teacher/dashboard.html',
            'parent': '../parents/dashboard.html',
            'registrar': '../registrar/dashboard.html'
        };
        window.location.replace(routes[sessionUser.role] || '../auth/login.html');
        return;
    }

    function getStudentInitials(name) {
        if (!name || typeof name !== 'string') return 'S';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?)\s+/i, '').trim();
        if (!cleanName || cleanName.toLowerCase() === 'student' || cleanName.toLowerCase().includes('mylene') || cleanName.toLowerCase().includes('raganas')) return 'S';
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return 'S';
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function sanitizeStudentName(name, email) {
        if (!name && email) {
            if (email.toLowerCase().includes('mylene') || email.toLowerCase().includes('student')) return 'Student';
            name = email.split('@')[0];
        }
        if (!name || name.toLowerCase().includes('mylene') || name.toLowerCase().includes('raganas') || name.toLowerCase() === 'admin') {
            return 'Student';
        }
        return name;
    }

    // Set initial display name from session
    let initialDisplayName = sessionUser.firstName ?
        `${sessionUser.firstName} ${sessionUser.lastName || ''}`.trim() :
        (sessionUser.email ? sessionUser.email.split('@')[0] : 'Student');
    initialDisplayName = sanitizeStudentName(initialDisplayName, sessionUser.email);

    if (studentName) studentName.textContent = initialDisplayName;
    if (studentInitial) studentInitial.textContent = getStudentInitials(initialDisplayName);

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('plsnhs_student_avatar');
            localStorage.removeItem('plsnhs_student_name');
            try {
                await supabase.auth.signOut();
            } catch (err) { }
            window.location.replace('../auth/login.html');
        });
    }

    // ============================================
    // LOAD DATA FROM SUPABASE
    // ============================================

    async function loadAllData() {
        try {
            showTableLoading();

            // 1. Fetch sections for ID to Name mapping
            try {
                const { data: sectionsData } = await supabase
                    .from('sections')
                    .select('id, name, grade_level, strand');

                if (sectionsData) {
                    sectionsData.forEach(s => sectionsMap.set(s.id, s));
                }
            } catch (err) {
                console.warn('⚠️ Could not load sections table:', err);
            }

            // 2. Fetch student profile from students or users table
            const userEmail = sessionUser.email || '';
            const userUid = sessionUser.uid || '';

            try {
                const { data: studentRows, error: studentError } = await supabase
                    .from('students')
                    .select('*')
                    .or(`email.eq.${userEmail},id.eq.${userUid}`);

                if (!studentError && studentRows && studentRows.length > 0) {
                    studentProfile = studentRows[0];
                    let fullName = `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim();
                    fullName = sanitizeStudentName(fullName, userEmail);
                    if (fullName) {
                        if (studentName) studentName.textContent = fullName;
                        if (studentInitial) studentInitial.textContent = getStudentInitials(fullName);
                    }
                }
            } catch (err) {
                console.warn('⚠️ Student profile query failed:', err);
            }

            // 3. Fetch enrollments
            let enrollmentsData = [];
            const studentId = studentProfile?.id || userUid;

            try {
                let query = supabase
                    .from('enrollments')
                    .select('*');

                if (userEmail && studentId) {
                    query = query.or(`email.eq.${userEmail},student_id.eq.${studentId}`);
                } else if (userEmail) {
                    query = query.eq('email', userEmail);
                } else if (studentId) {
                    query = query.eq('student_id', studentId);
                }

                const { data, error } = await query.order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Supabase enrollments query error:', error);
                } else if (data) {
                    enrollmentsData = data;
                }
            } catch (err) {
                console.error('❌ Error fetching enrollments:', err);
            }

            // Fallback to localStorage if online table returned 0 rows but local dummy/test data exists
            if (enrollmentsData.length === 0) {
                try {
                    const localSaved = localStorage.getItem('plsnhs_enrollments');
                    if (localSaved) {
                        const parsed = JSON.parse(localSaved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            enrollmentsData = parsed;
                        }
                    }
                } catch (e) { }
            }

            // Format & normalize records
            rawEnrollments = enrollmentsData.map(item => normalizeEnrollment(item));

            // Sort by created date descending
            rawEnrollments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            displayedEnrollments = [...rawEnrollments];

            // Render stats and UI
            updateStatsAndBanners();
            renderTable();

        } catch (error) {
            console.error('❌ Unexpected error in loadAllData:', error);
            showAlert('❌ Error loading enrollment records: ' + error.message, 'error');
            renderEmptyState('Failed to load records. Please refresh the page.');
        }
    }

    // ============================================
    // DATA NORMALIZATION
    // ============================================

    function normalizeEnrollment(item) {
        let created = item.created_at || item.createdAt;
        let createdDate = new Date();
        if (created) {
            createdDate = new Date(created);
            if (isNaN(createdDate.getTime())) createdDate = new Date();
        }

        // Section resolution
        let sectionName = item.section || item.section_name || '';
        if (!sectionName && item.section_id && sectionsMap.has(item.section_id)) {
            sectionName = sectionsMap.get(item.section_id).name;
        }
        if (!sectionName && studentProfile?.section_id && sectionsMap.has(studentProfile.section_id)) {
            sectionName = sectionsMap.get(studentProfile.section_id).name;
        }

        // School Year resolution
        let schoolYear = item.school_year || item.schoolYear || item.last_school_year;
        if (!schoolYear) {
            const year = createdDate.getFullYear();
            schoolYear = `${year}-${year + 1}`;
        }

        // Student Type
        let studentType = item.student_type || item.studentType;
        if (!studentType) {
            if (item.previous_school || item.previousSchool) {
                studentType = 'Transferee';
            } else {
                studentType = 'New Student';
            }
        }

        return {
            id: item.id || `enr_${Math.random().toString(36).substr(2, 9)}`,
            studentId: item.student_id || item.studentId || studentProfile?.id || '',
            firstName: item.first_name || item.firstName || studentProfile?.first_name || '',
            lastName: item.last_name || item.lastName || studentProfile?.last_name || '',
            email: item.email || studentProfile?.email || sessionUser.email || '',
            gradeLevel: item.grade_level || item.grade || item.gradeLevel || studentProfile?.grade_level || 'Grade 11',
            strand: item.strand || studentProfile?.strand || 'N/A',
            section: sectionName || (studentProfile?.section_name) || 'Not Assigned',
            schoolYear: schoolYear,
            previousSchool: item.previous_school || item.previousSchool || 'N/A',
            previousGrade: item.previous_grade || item.previousGrade || 'N/A',
            generalAverage: item.general_average || item.generalAverage || null,
            status: (item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1).toLowerCase(),
            studentType: studentType,
            createdAt: createdDate,
            raw: item
        };
    }

    // ============================================
    // STATS & BANNERS
    // ============================================

    function updateStatsAndBanners() {
        const total = rawEnrollments.length;
        const approved = rawEnrollments.filter(e => e.status.toLowerCase() === 'approved' || e.status.toLowerCase() === 'enrolled').length;
        const pending = rawEnrollments.filter(e => e.status.toLowerCase() === 'pending').length;
        const years = [...new Set(rawEnrollments.map(e => e.schoolYear).filter(Boolean))];

        if (totalEnrollmentsEl) totalEnrollmentsEl.textContent = total;
        if (enrolledCountEl) enrolledCountEl.textContent = approved;
        if (pendingCountEl) pendingCountEl.textContent = pending;
        if (uniqueYearsEl) uniqueYearsEl.textContent = years.length;

        // Current Active Banner
        const activeEnrollment = rawEnrollments.find(e => e.status.toLowerCase() === 'approved' || e.status.toLowerCase() === 'enrolled');

        if (activeEnrollment) {
            if (currentBanner) currentBanner.style.display = 'flex';
            if (noEnrollmentBanner) noEnrollmentBanner.style.display = 'none';

            if (currentGrade) currentGrade.textContent = activeEnrollment.gradeLevel || 'N/A';
            if (currentSection) currentSection.textContent = activeEnrollment.section || 'Not Assigned';
            if (currentStrand) currentStrand.textContent = activeEnrollment.strand || 'N/A';
            if (currentSchoolYear) currentSchoolYear.textContent = activeEnrollment.schoolYear || 'N/A';

            if (studentTypeBadge) {
                studentTypeBadge.textContent = activeEnrollment.studentType || 'Enrolled Student';
                studentTypeBadge.className = 'new-student-badge';
            }
        } else {
            if (currentBanner) currentBanner.style.display = 'none';
            if (noEnrollmentBanner) noEnrollmentBanner.style.display = 'flex';
        }
    }

    // ============================================
    // RENDER TABLE
    // ============================================

    function renderTable() {
        if (!historyTableBody) return;

        if (historyCount) {
            historyCount.textContent = `${displayedEnrollments.length} record(s)`;
        }

        if (displayedEnrollments.length === 0) {
            renderEmptyState('No enrollment records found matching your filters.');
            return;
        }

        historyTableBody.innerHTML = '';

        displayedEnrollments.forEach((enrollment, index) => {
            const tr = document.createElement('tr');
            tr.className = 'history-table-row';

            // Status Badge Formatter
            const statusLower = enrollment.status.toLowerCase();
            let statusBadgeClass = 'status-pending';
            let statusIcon = '<i class="fas fa-hourglass-half"></i>';

            if (statusLower === 'approved' || statusLower === 'enrolled') {
                statusBadgeClass = 'status-approved';
                statusIcon = '<i class="fas fa-check-circle"></i>';
            } else if (statusLower === 'rejected') {
                statusBadgeClass = 'status-rejected';
                statusIcon = '<i class="fas fa-times-circle"></i>';
            }

            // Formatted Date
            const formattedDate = enrollment.createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Section badge text
            const sectionDisplay = enrollment.section && enrollment.section !== 'Not Assigned' ?
                `<span class="badge-section"><i class="fas fa-users"></i> ${enrollment.section}</span>` :
                `<span class="badge-section unassigned"><i class="fas fa-clock"></i> Not Assigned</span>`;

            // Strand badge
            const strandDisplay = enrollment.strand && enrollment.strand !== 'N/A' ?
                `<span class="badge-strand">${enrollment.strand}</span>` :
                `<span class="text-muted">General</span>`;

            tr.innerHTML = `
                <td style="font-weight: 600; color: var(--gray-500); text-align: center;">${index + 1}</td>
                <td>
                    <div class="table-year-cell">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${enrollment.schoolYear}</span>
                    </div>
                </td>
                <td>
                    <div class="grade-section-cell">
                        <span class="badge-grade">${enrollment.gradeLevel}</span>
                        ${sectionDisplay}
                    </div>
                </td>
                <td>${strandDisplay}</td>
                <td><span class="badge-type">${enrollment.studentType}</span></td>
                <td><span class="table-date">${formattedDate}</span></td>
                <td>
                    <span class="status-badge ${statusBadgeClass}">
                        ${statusIcon} ${enrollment.status}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button type="button" class="btn-view-details" data-id="${enrollment.id}" title="View Record Details">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;

            historyTableBody.appendChild(tr);
        });

        // Attach modal click events to buttons
        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                openEnrollmentDetailModal(id);
            });
        });
    }

    // ============================================
    // EMPTY & LOADING STATES
    // ============================================

    function showTableLoading() {
        if (!historyTableBody) return;
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-cell">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading enrollment records from Supabase...</p>
                </td>
            </tr>
        `;
    }

    function renderEmptyState(message = 'No enrollment records found.') {
        if (!historyTableBody) return;
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table-cell">
                    <div class="empty-state-content">
                        <i class="fas fa-folder-open"></i>
                        <h4>${message}</h4>
                        <p>Submit an enrollment application or adjust your search filters.</p>
                        <a href="enrollment.html" class="btn-enroll-empty">
                            <i class="fas fa-pen-fancy"></i> Enroll Now
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }

    // ============================================
    // SEARCH & FILTER HANDLERS
    // ============================================

    function applyFilters() {
        const searchTerm = (historySearchInput?.value || '').toLowerCase().trim();
        const statusFilter = (historyStatusFilter?.value || '').toLowerCase().trim();

        displayedEnrollments = rawEnrollments.filter(item => {
            // Status check
            if (statusFilter) {
                const itemStatus = item.status.toLowerCase();
                if (statusFilter === 'enrolled') {
                    if (itemStatus !== 'enrolled' && itemStatus !== 'approved') return false;
                } else if (itemStatus !== statusFilter) {
                    return false;
                }
            }

            // Search term check
            if (searchTerm) {
                const combinedText = [
                    item.schoolYear,
                    item.gradeLevel,
                    item.section,
                    item.strand,
                    item.studentType,
                    item.status,
                    item.previousSchool
                ].join(' ').toLowerCase();

                if (!combinedText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        renderTable();
    }

    if (historySearchInput) {
        historySearchInput.addEventListener('input', applyFilters);
    }

    if (historyStatusFilter) {
        historyStatusFilter.addEventListener('change', applyFilters);
    }

    // ============================================
    // DETAILS MODAL
    // ============================================

    window.viewEnrollmentDetails = function (id) {
        openEnrollmentDetailModal(id);
    };

    function openEnrollmentDetailModal(id) {
        const enrollment = rawEnrollments.find(e => e.id === id);
        if (!enrollment) {
            showAlert('⚠️ Enrollment details not found', 'error');
            return;
        }

        const studentFullName = `${enrollment.firstName} ${enrollment.lastName}`.trim() || sessionUser.email;
        const lrn = studentProfile?.lrn || 'N/A';
        const contact = studentProfile?.contact_number || 'N/A';
        const address = studentProfile?.address || 'N/A';
        const parentName = studentProfile?.parent_name || 'N/A';
        const parentContact = studentProfile?.parent_contact || 'N/A';

        const statusLower = enrollment.status.toLowerCase();
        let statusBadgeClass = 'status-pending';
        let statusIcon = '<i class="fas fa-hourglass-half"></i>';

        if (statusLower === 'approved' || statusLower === 'enrolled') {
            statusBadgeClass = 'status-approved';
            statusIcon = '<i class="fas fa-check-circle"></i>';
        } else if (statusLower === 'rejected') {
            statusBadgeClass = 'status-rejected';
            statusIcon = '<i class="fas fa-times-circle"></i>';
        }

        const dateFormatted = enrollment.createdAt.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (modalEnrollmentTitle) {
            modalEnrollmentTitle.innerHTML = `<i class="fas fa-file-invoice"></i> Enrollment Record - SY ${enrollment.schoolYear}`;
        }

        if (modalEnrollmentBody) {
            modalEnrollmentBody.innerHTML = `
                <div class="modal-detail-container">
                    <div class="modal-status-banner">
                        <div>
                            <span class="status-label">Current Status:</span>
                            <span class="status-badge ${statusBadgeClass}" style="margin-left: 8px;">
                                ${statusIcon} ${enrollment.status}
                            </span>
                        </div>
                        <span class="modal-date"><i class="far fa-clock"></i> ${dateFormatted}</span>
                    </div>

                    <div class="detail-section">
                        <h4 class="section-title"><i class="fas fa-user-graduate"></i> Student Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Full Name</span>
                                <span class="detail-value highlight">${studentFullName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">LRN</span>
                                <span class="detail-value">${lrn}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email Address</span>
                                <span class="detail-value">${enrollment.email}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Contact Number</span>
                                <span class="detail-value">${contact}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">Home Address</span>
                                <span class="detail-value">${address}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4 class="section-title"><i class="fas fa-graduation-cap"></i> Academic & Class Details</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">School Year</span>
                                <span class="detail-value highlight">${enrollment.schoolYear}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Grade Level</span>
                                <span class="detail-value"><span class="badge-grade">${enrollment.gradeLevel}</span></span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Assigned Section</span>
                                <span class="detail-value">${enrollment.section}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Strand / Track</span>
                                <span class="detail-value"><span class="badge-strand">${enrollment.strand}</span></span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Student Type</span>
                                <span class="detail-value">${enrollment.studentType}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">General Average</span>
                                <span class="detail-value">${enrollment.generalAverage ? enrollment.generalAverage + '%' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4 class="section-title"><i class="fas fa-history"></i> Previous Background</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Previous School</span>
                                <span class="detail-value">${enrollment.previousSchool}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Previous Grade</span>
                                <span class="detail-value">${enrollment.previousGrade}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Parent / Guardian</span>
                                <span class="detail-value">${parentName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Parent Contact</span>
                                <span class="detail-value">${parentContact}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (enrollmentDetailModal) {
            enrollmentDetailModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeDetailModal() {
        if (enrollmentDetailModal) {
            enrollmentDetailModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);
    if (dismissDetailModalBtn) dismissDetailModalBtn.addEventListener('click', closeDetailModal);

    window.addEventListener('click', function (e) {
        if (enrollmentDetailModal && e.target === enrollmentDetailModal) {
            closeDetailModal();
        }
    });

    // ============================================
    // ALERT SYSTEM
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

    loadAllData();

})();