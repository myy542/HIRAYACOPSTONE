/**
 * PLSNHS Admin - Attendance Management (By Year Level & Section)
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const alertContainer = document.getElementById('alertContainer');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    // Tab switcher
    const tabStudentsBtn = document.getElementById('tabStudentsBtn');
    const tabTeachersBtn = document.getElementById('tabTeachersBtn');
    const studentAttendanceSection = document.getElementById('studentAttendanceSection');
    const teacherAttendanceSection = document.getElementById('teacherAttendanceSection');

    // Student controls & filters
    const gradeChips = document.getElementById('gradeChips');
    const currentGradeLabel = document.getElementById('currentGradeLabel');
    const studentGradeFilter = document.getElementById('studentGradeFilter');
    const studentSectionFilter = document.getElementById('studentSectionFilter');
    const studentDateFilter = document.getElementById('studentDateFilter');
    const studentStatusFilter = document.getElementById('studentStatusFilter');
    const studentSearchInput = document.getElementById('studentSearchInput');
    const studentAttendanceBody = document.getElementById('studentAttendanceBody');
    const currentSectionBadge = document.getElementById('currentSectionBadge');
    const studentCountBadge = document.getElementById('studentCountBadge');

    // Student stats
    const totalStudentsStat = document.getElementById('totalStudentsStat');
    const presentStudentsStat = document.getElementById('presentStudentsStat');
    const lateStudentsStat = document.getElementById('lateStudentsStat');
    const absentStudentsStat = document.getElementById('absentStudentsStat');
    const excusedStudentsStat = document.getElementById('excusedStudentsStat');
    const presentRate = document.getElementById('presentRate');

    // Chip counts
    const chipCountAll = document.getElementById('chipCountAll');
    const chipCountG7 = document.getElementById('chipCountG7');
    const chipCountG8 = document.getElementById('chipCountG8');
    const chipCountG9 = document.getElementById('chipCountG9');
    const chipCountG10 = document.getElementById('chipCountG10');
    const chipCountG11 = document.getElementById('chipCountG11');
    const chipCountG12 = document.getElementById('chipCountG12');

    // Quick action buttons
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    const saveAllAttendanceBtn = document.getElementById('saveAllAttendanceBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const exportBtn = document.getElementById('exportBtn');

    // Teacher controls & filters
    const teacherSelectFilter = document.getElementById('teacherSelectFilter');
    const teacherDateFilter = document.getElementById('teacherDateFilter');
    const teacherStatusFilter = document.getElementById('teacherStatusFilter');
    const teacherAttendanceBody = document.getElementById('teacherAttendanceBody');
    const teacherRecordBadge = document.getElementById('teacherRecordBadge');
    const totalTeachersStat = document.getElementById('totalTeachersStat');
    const presentTeachersStat = document.getElementById('presentTeachersStat');
    const lateTeachersStat = document.getElementById('lateTeachersStat');
    const absentTeachersStat = document.getElementById('absentTeachersStat');

    // Modal elements
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const attendanceModal = document.getElementById('attendanceModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const attendanceModalForm = document.getElementById('attendanceModalForm');
    const modalTitle = document.getElementById('modalTitle');
    const editRecordId = document.getElementById('editRecordId');
    const modalType = document.getElementById('modalType');
    const studentModalFields = document.getElementById('studentModalFields');
    const teacherModalFields = document.getElementById('teacherModalFields');
    const modalGrade = document.getElementById('modalGrade');
    const modalSection = document.getElementById('modalSection');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentLRN = document.getElementById('modalStudentLRN');
    const modalTeacherSelect = document.getElementById('modalTeacherSelect');
    const modalDate = document.getElementById('modalDate');
    const modalStatus = document.getElementById('modalStatus');
    const modalTimeIn = document.getElementById('modalTimeIn');
    const modalTimeOut = document.getElementById('modalTimeOut');
    const modalRemarks = document.getElementById('modalRemarks');

    // ============================================
    // SECTIONS PER GRADE LEVEL
    // ============================================
    const sectionsByGrade = {
        'Grade 7': ['Section A', 'Section B', 'Section C', 'Section D'],
        'Grade 8': ['Section A', 'Section B', 'Section C', 'Section D'],
        'Grade 9': ['Section A', 'Section B', 'Section C', 'Section D'],
        'Grade 10': ['Section A', 'Section B', 'Section C', 'Section D'],
        'Grade 11': ['11-STEM A', '11-STEM B', '11-ABM A', '11-HUMSS A', '11-TVL A', '11-GAS A'],
        'Grade 12': ['12-STEM A', '12-STEM B', '12-ABM A', '12-HUMSS A', '12-TVL A', '12-GAS A']
    };

    // ============================================
    // INITIAL SAMPLE DATA GENERATION
    // ============================================
    const todayStr = new Date().toISOString().split('T')[0];

    const defaultStudents = [
        // Grade 7
        { id: 101, lrn: '109876543201', name: 'John Doe', grade: 'Grade 7', section: 'Section A', gender: 'Male', status: 'Present', timeIn: '07:25 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 102, lrn: '109876543202', name: 'Samantha Jane Cruz', grade: 'Grade 7', section: 'Section A', gender: 'Female', status: 'Present', timeIn: '07:30 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 103, lrn: '109876543203', name: 'Angelo Miguel Reyes', grade: 'Grade 7', section: 'Section B', gender: 'Male', status: 'Late', timeIn: '08:15 AM', timeOut: '04:30 PM', remarks: 'Traffic' },
        { id: 104, lrn: '109876543204', name: 'Patricia Nicole Ramos', grade: 'Grade 7', section: 'Section B', gender: 'Female', status: 'Absent', timeIn: '—', timeOut: '—', remarks: 'Unexcused' },

        // Grade 8
        { id: 201, lrn: '109876543211', name: 'Mark Kevin Santos', grade: 'Grade 8', section: 'Section A', gender: 'Male', status: 'Present', timeIn: '07:15 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 202, lrn: '109876543212', name: 'Beatrice Anne Lopez', grade: 'Grade 8', section: 'Section A', gender: 'Female', status: 'Excused', timeIn: '—', timeOut: '—', remarks: 'Medical appointment' },
        { id: 203, lrn: '109876543213', name: 'Christian Dave Perez', grade: 'Grade 8', section: 'Section B', gender: 'Male', status: 'Present', timeIn: '07:40 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 204, lrn: '109876543214', name: 'Klarisse Diane Gomez', grade: 'Grade 8', section: 'Section C', gender: 'Female', status: 'Late', timeIn: '08:05 AM', timeOut: '04:30 PM', remarks: 'Transportation issue' },

        // Grade 9
        { id: 301, lrn: '109876543221', name: 'Joshua Gabriel Tan', grade: 'Grade 9', section: 'Section A', gender: 'Male', status: 'Present', timeIn: '07:20 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 302, lrn: '109876543222', name: 'Camille Joy Mendoza', grade: 'Grade 9', section: 'Section A', gender: 'Female', status: 'Present', timeIn: '07:35 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 303, lrn: '109876543223', name: 'Rafael Vincent Torres', grade: 'Grade 9', section: 'Section B', gender: 'Male', status: 'Absent', timeIn: '—', timeOut: '—', remarks: 'No notice' },
        { id: 304, lrn: '109876543224', name: 'Sophia Louise Garcia', grade: 'Grade 9', section: 'Section C', gender: 'Female', status: 'Present', timeIn: '07:45 AM', timeOut: '04:30 PM', remarks: 'On time' },

        // Grade 10
        { id: 401, lrn: '109876543231', name: 'Juan Carlos Dela Cruz', grade: 'Grade 10', section: 'Section A', gender: 'Male', status: 'Present', timeIn: '07:10 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 402, lrn: '109876543232', name: 'Maria Angelica Santos', grade: 'Grade 10', section: 'Section A', gender: 'Female', status: 'Present', timeIn: '07:28 AM', timeOut: '04:30 PM', remarks: 'On time' },
        { id: 403, lrn: '109876543233', name: 'Gabriel Ian Bautista', grade: 'Grade 10', section: 'Section B', gender: 'Male', status: 'Late', timeIn: '08:20 AM', timeOut: '04:30 PM', remarks: 'Rain delay' },
        { id: 404, lrn: '109876543234', name: 'Hannah Mae Villanueva', grade: 'Grade 10', section: 'Section C', gender: 'Female', status: 'Present', timeIn: '07:30 AM', timeOut: '04:30 PM', remarks: 'On time' },

        // Grade 11 (Senior High)
        { id: 501, lrn: '109876543241', name: 'Alexander James Flores', grade: 'Grade 11', section: '11-STEM A', gender: 'Male', status: 'Present', timeIn: '07:15 AM', timeOut: '05:00 PM', remarks: 'STEM Research Lab' },
        { id: 502, lrn: '109876543242', name: 'Christine Bernadette Sy', grade: 'Grade 11', section: '11-ABM A', gender: 'Female', status: 'Present', timeIn: '07:25 AM', timeOut: '05:00 PM', remarks: 'On time' },
        { id: 503, lrn: '109876543243', name: 'Nathaniel Keith Ocampo', grade: 'Grade 11', section: '11-HUMSS A', gender: 'Male', status: 'Excused', timeIn: '—', timeOut: '—', remarks: 'Debate tournament' },
        { id: 504, lrn: '109876543244', name: 'Alyssa Rose Castro', grade: 'Grade 11', section: '11-TVL A', gender: 'Female', status: 'Present', timeIn: '07:40 AM', timeOut: '05:00 PM', remarks: 'Workshop pass' },

        // Grade 12 (Senior High)
        { id: 601, lrn: '109876543251', name: 'Dominic Paul Navarro', grade: 'Grade 12', section: '12-STEM A', gender: 'Male', status: 'Present', timeIn: '07:05 AM', timeOut: '05:00 PM', remarks: 'Capstone session' },
        { id: 602, lrn: '109876543252', name: 'Kirsten Nicole Morales', grade: 'Grade 12', section: '12-ABM A', gender: 'Female', status: 'Present', timeIn: '07:22 AM', timeOut: '05:00 PM', remarks: 'On time' },
        { id: 603, lrn: '109876543253', name: 'Elijah Jude Salazar', grade: 'Grade 12', section: '12-HUMSS A', gender: 'Male', status: 'Late', timeIn: '08:10 AM', timeOut: '05:00 PM', remarks: 'Late arrival' },
        { id: 604, lrn: '109876543254', name: 'Gabrielle Denise Lim', grade: 'Grade 12', section: '12-GAS A', gender: 'Female', status: 'Present', timeIn: '07:33 AM', timeOut: '05:00 PM', remarks: 'On time' }
    ];

    const defaultTeachers = [
        { id: 1, name: 'Maria Santos', id_number: 'PLSNHS-TCH-00001', dept: 'Mathematics', date: todayStr, timeIn: '07:12 AM', timeOut: '04:45 PM', status: 'Present', remarks: 'Classroom 101' },
        { id: 2, name: 'Juan Dela Cruz', id_number: 'PLSNHS-TCH-00002', dept: 'Science & Chemistry', date: todayStr, timeIn: '07:28 AM', timeOut: '04:30 PM', status: 'Present', remarks: 'Science Lab' },
        { id: 3, name: 'Ana Reyes', id_number: 'PLSNHS-TCH-00003', dept: 'English & Literature', date: todayStr, timeIn: '08:05 AM', timeOut: '04:30 PM', status: 'Late', remarks: 'Morning meeting' },
        { id: 4, name: 'Carlos Mendoza', id_number: 'PLSNHS-TCH-00004', dept: 'Social Studies', date: todayStr, timeIn: '—', timeOut: '—', status: 'Absent', remarks: 'Official Leave' },
        { id: 5, name: 'Elena Garcia', id_number: 'PLSNHS-TCH-00005', dept: 'Filipino', date: todayStr, timeIn: '07:18 AM', timeOut: '04:30 PM', status: 'Present', remarks: 'Classroom 204' }
    ];

    // Initialize state
    let studentRecords = [];
    let teacherRecords = [];

    try {
        const storedStudents = localStorage.getItem('plsnhs_student_attendance');
        studentRecords = storedStudents ? JSON.parse(storedStudents) : [...defaultStudents];
    } catch (e) {
        studentRecords = [...defaultStudents];
    }

    try {
        const storedTeachers = localStorage.getItem('plsnhs_teacher_attendance');
        teacherRecords = storedTeachers ? JSON.parse(storedTeachers) : [...defaultTeachers];
    } catch (e) {
        teacherRecords = [...defaultTeachers];
    }

    function saveStudentAttendance() {
        try {
            localStorage.setItem('plsnhs_student_attendance', JSON.stringify(studentRecords));
        } catch (e) {
            console.error('Failed to save student attendance:', e);
        }
    }

    function saveTeacherAttendance() {
        try {
            localStorage.setItem('plsnhs_teacher_attendance', JSON.stringify(teacherRecords));
        } catch (e) {
            console.error('Failed to save teacher attendance:', e);
        }
    }

    // Set today's date in pickers
    if (studentDateFilter) studentDateFilter.value = todayStr;
    if (teacherDateFilter) teacherDateFilter.value = todayStr;
    if (modalDate) modalDate.value = todayStr;

    // ============================================
    // POPULATE SECTION DROPDOWN
    // ============================================
    function populateSectionDropdown(selectedGrade = '') {
        if (!studentSectionFilter) return;

        const currentSection = studentSectionFilter.value;
        let sections = [];

        if (selectedGrade && sectionsByGrade[selectedGrade]) {
            sections = sectionsByGrade[selectedGrade];
        } else {
            // Aggregate all distinct sections
            const allSecs = new Set();
            Object.values(sectionsByGrade).forEach(list => list.forEach(s => allSecs.add(s)));
            sections = Array.from(allSecs);
        }

        let html = '<option value="">All Sections</option>';
        sections.forEach(sec => {
            html += `<option value="${sec}" ${sec === currentSection ? 'selected' : ''}>${sec}</option>`;
        });

        studentSectionFilter.innerHTML = html;
    }

    // Populate modal sections
    function populateModalSectionDropdown(grade) {
        if (!modalSection) return;
        const sections = sectionsByGrade[grade] || ['Section A', 'Section B'];
        modalSection.innerHTML = sections.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Populate teacher dropdowns
    function populateTeacherDropdowns() {
        if (teacherSelectFilter) {
            let html = '<option value="">All Teachers</option>';
            teacherRecords.forEach(t => {
                html += `<option value="${t.name}">${t.name} (${t.id_number})</option>`;
            });
            teacherSelectFilter.innerHTML = html;
        }

        if (modalTeacherSelect) {
            let html = '<option value="">Select Teacher</option>';
            teacherRecords.forEach(t => {
                html += `<option value="${t.name}">${t.name} (${t.dept})</option>`;
            });
            modalTeacherSelect.innerHTML = html;
        }
    }

    // ============================================
    // STATS & CHIP COUNTS
    // ============================================
    function updateChipCounts() {
        if (chipCountAll) chipCountAll.textContent = studentRecords.length;
        if (chipCountG7) chipCountG7.textContent = studentRecords.filter(s => s.grade === 'Grade 7').length;
        if (chipCountG8) chipCountG8.textContent = studentRecords.filter(s => s.grade === 'Grade 8').length;
        if (chipCountG9) chipCountG9.textContent = studentRecords.filter(s => s.grade === 'Grade 9').length;
        if (chipCountG10) chipCountG10.textContent = studentRecords.filter(s => s.grade === 'Grade 10').length;
        if (chipCountG11) chipCountG11.textContent = studentRecords.filter(s => s.grade === 'Grade 11').length;
        if (chipCountG12) chipCountG12.textContent = studentRecords.filter(s => s.grade === 'Grade 12').length;
    }

    function updateStudentStats(filtered) {
        const total = filtered.length;
        const present = filtered.filter(s => s.status === 'Present').length;
        const late = filtered.filter(s => s.status === 'Late').length;
        const absent = filtered.filter(s => s.status === 'Absent').length;
        const excused = filtered.filter(s => s.status === 'Excused').length;

        if (totalStudentsStat) totalStudentsStat.textContent = total;
        if (presentStudentsStat) presentStudentsStat.textContent = present;
        if (lateStudentsStat) lateStudentsStat.textContent = late;
        if (absentStudentsStat) absentStudentsStat.textContent = absent;
        if (excusedStudentsStat) excusedStudentsStat.textContent = excused;

        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        if (presentRate) presentRate.textContent = `${rate}%`;
    }

    function updateTeacherStats(filtered) {
        const total = filtered.length;
        const present = filtered.filter(t => t.status === 'Present').length;
        const late = filtered.filter(t => t.status === 'Late').length;
        const absent = filtered.filter(t => t.status === 'Absent').length;

        if (totalTeachersStat) totalTeachersStat.textContent = total;
        if (presentTeachersStat) presentTeachersStat.textContent = present;
        if (lateTeachersStat) lateTeachersStat.textContent = late;
        if (absentTeachersStat) absentTeachersStat.textContent = absent;
        if (teacherRecordBadge) teacherRecordBadge.textContent = `Showing ${total} records`;
    }

    // ============================================
    // RENDER STUDENT ATTENDANCE TABLE
    // ============================================
    function renderStudentAttendance() {
        const selectedGrade = studentGradeFilter ? studentGradeFilter.value : '';
        const selectedSection = studentSectionFilter ? studentSectionFilter.value : '';
        const selectedStatus = studentStatusFilter ? studentStatusFilter.value : '';
        const search = studentSearchInput ? studentSearchInput.value.toLowerCase().trim() : '';

        // Filter student list
        const filtered = studentRecords.filter(s => {
            const matchGrade = !selectedGrade || s.grade === selectedGrade;
            const matchSection = !selectedSection || s.section === selectedSection;
            const matchStatus = !selectedStatus || s.status === selectedStatus;
            const matchSearch = !search ||
                s.name.toLowerCase().includes(search) ||
                (s.lrn && s.lrn.toLowerCase().includes(search)) ||
                (s.remarks && s.remarks.toLowerCase().includes(search));

            return matchGrade && matchSection && matchStatus && matchSearch;
        });

        // Update badges
        if (currentSectionBadge) {
            let label = selectedGrade || 'Whole School';
            if (selectedSection) label += ` · ${selectedSection}`;
            else label += ' · All Sections';
            currentSectionBadge.textContent = label;
        }

        if (studentCountBadge) {
            studentCountBadge.innerHTML = `<i class="fas fa-user-check"></i> Showing ${filtered.length} of ${studentRecords.length} students`;
        }

        updateStudentStats(filtered);
        updateChipCounts();

        if (filtered.length === 0) {
            studentAttendanceBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-user-clock"></i>
                            <h4>No Student Attendance Records Found</h4>
                            <p>No students match the selected Year Level, Section, or Status filter. Try changing your filters or add a new record.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach((student, index) => {
            const initial = student.name.charAt(0).toUpperCase();
            const statusLower = student.status.toLowerCase();

            html += `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-info">
                                <div class="user-name">${student.name}</div>
                                <div class="user-lrn"><i class="far fa-id-card"></i> LRN: ${student.lrn || '—'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="section-tag">
                            <i class="fas fa-graduation-cap"></i> ${student.grade} - ${student.section}
                        </span>
                    </td>
                    <td>
                        <span class="time-tag"><i class="far fa-clock"></i> ${student.timeIn || '—'}</span>
                    </td>
                    <td>
                        <span class="time-tag"><i class="far fa-clock"></i> ${student.timeOut || '—'}</span>
                    </td>
                    <td>
                        <span class="status-badge ${statusLower}">
                            ${student.status}
                        </span>
                    </td>
                    <td>
                        <div class="quick-status-group">
                            <button type="button" class="btn-qs p ${student.status === 'Present' ? 'active' : ''}" 
                                onclick="window.setQuickStudentStatus(${student.id}, 'Present')" title="Mark Present">P</button>
                            <button type="button" class="btn-qs l ${student.status === 'Late' ? 'active' : ''}" 
                                onclick="window.setQuickStudentStatus(${student.id}, 'Late')" title="Mark Late">L</button>
                            <button type="button" class="btn-qs a ${student.status === 'Absent' ? 'active' : ''}" 
                                onclick="window.setQuickStudentStatus(${student.id}, 'Absent')" title="Mark Absent">A</button>
                            <button type="button" class="btn-qs e ${student.status === 'Excused' ? 'active' : ''}" 
                                onclick="window.setQuickStudentStatus(${student.id}, 'Excused')" title="Mark Excused">E</button>
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" class="btn-icon" onclick="window.editStudentRecord(${student.id})" title="Edit Details">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn-icon delete" onclick="window.deleteStudentRecord(${student.id})" title="Delete Record">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        studentAttendanceBody.innerHTML = html;
    }

    // ============================================
    // RENDER TEACHER ATTENDANCE TABLE
    // ============================================
    function renderTeacherAttendance() {
        const selectedTeacher = teacherSelectFilter ? teacherSelectFilter.value : '';
        const selectedStatus = teacherStatusFilter ? teacherStatusFilter.value : '';

        const filtered = teacherRecords.filter(t => {
            const matchTeacher = !selectedTeacher || t.name === selectedTeacher;
            const matchStatus = !selectedStatus || t.status === selectedStatus;
            return matchTeacher && matchStatus;
        });

        updateTeacherStats(filtered);

        if (filtered.length === 0) {
            teacherAttendanceBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-chalkboard-user"></i>
                            <h4>No Teacher Attendance Records Found</h4>
                            <p>No faculty records match the selected filter criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(t => {
            const initial = t.name.charAt(0).toUpperCase();
            const statusLower = t.status.toLowerCase();

            html += `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-info">
                                <div class="user-name">${t.name}</div>
                                <div class="user-lrn"><i class="fas fa-book"></i> ${t.dept}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="section-tag">${t.id_number}</span></td>
                    <td><span class="time-tag"><i class="far fa-calendar"></i> ${t.date}</span></td>
                    <td><span class="time-tag"><i class="far fa-clock"></i> ${t.timeIn}</span></td>
                    <td><span class="time-tag"><i class="far fa-clock"></i> ${t.timeOut}</span></td>
                    <td><span class="status-badge ${statusLower}">${t.status}</span></td>
                    <td><span style="font-size: 12.5px; color: #64748b;">${t.remarks || '—'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" class="btn-icon delete" onclick="window.deleteTeacherRecord(${t.id})" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        teacherAttendanceBody.innerHTML = html;
    }

    // ============================================
    // GLOBAL QUICK STATUS TOGGLE
    // ============================================
    window.setQuickStudentStatus = function(id, newStatus) {
        const student = studentRecords.find(s => s.id === id);
        if (!student) return;

        student.status = newStatus;
        if (newStatus === 'Present') {
            student.timeIn = '07:30 AM';
            student.timeOut = '04:30 PM';
            student.remarks = 'On time';
        } else if (newStatus === 'Late') {
            student.timeIn = '08:15 AM';
            student.timeOut = '04:30 PM';
            student.remarks = 'Late arrival';
        } else if (newStatus === 'Absent') {
            student.timeIn = '—';
            student.timeOut = '—';
            student.remarks = 'Absent';
        } else if (newStatus === 'Excused') {
            student.timeIn = '—';
            student.timeOut = '—';
            student.remarks = 'Excused absence';
        }

        saveStudentAttendance();
        renderStudentAttendance();
    };

    // Edit student record modal
    window.editStudentRecord = function(id) {
        const student = studentRecords.find(s => s.id === id);
        if (!student) return;

        editRecordId.value = student.id;
        modalType.value = 'student';
        modalType.disabled = true;
        studentModalFields.style.display = 'block';
        teacherModalFields.style.display = 'none';

        modalTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Attendance: ${student.name}`;
        modalGrade.value = student.grade;
        populateModalSectionDropdown(student.grade);
        modalSection.value = student.section;
        modalStudentName.value = student.name;
        modalStudentLRN.value = student.lrn || '';
        modalStatus.value = student.status;
        modalRemarks.value = student.remarks || '';

        attendanceModal.classList.add('active');
    };

    // Delete student record
    window.deleteStudentRecord = function(id) {
        const student = studentRecords.find(s => s.id === id);
        if (!student) return;

        if (confirm(`Remove attendance record for ${student.name}?`)) {
            studentRecords = studentRecords.filter(s => s.id !== id);
            saveStudentAttendance();
            renderStudentAttendance();
            showAlert(`✅ Attendance record for ${student.name} removed.`, 'success');
        }
    };

    // Delete teacher record
    window.deleteTeacherRecord = function(id) {
        const teacher = teacherRecords.find(t => t.id === id);
        if (!teacher) return;

        if (confirm(`Delete attendance record for ${teacher.name}?`)) {
            teacherRecords = teacherRecords.filter(t => t.id !== id);
            saveTeacherAttendance();
            renderTeacherAttendance();
            showAlert(`✅ Teacher attendance record removed.`, 'success');
        }
    };

    // ============================================
    // ALERT HELPER
    // ============================================
    function showAlert(message, type = 'error') {
        if (!alertContainer) return;
        alertContainer.innerHTML = '';
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 4000);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    // Main Hub tab switching
    if (tabStudentsBtn && tabTeachersBtn) {
        tabStudentsBtn.addEventListener('click', function() {
            tabStudentsBtn.classList.add('active');
            tabTeachersBtn.classList.remove('active');
            studentAttendanceSection.classList.add('active');
            teacherAttendanceSection.classList.remove('active');
        });

        tabTeachersBtn.addEventListener('click', function() {
            tabTeachersBtn.classList.add('active');
            tabStudentsBtn.classList.remove('active');
            teacherAttendanceSection.classList.add('active');
            studentAttendanceSection.classList.remove('active');
            renderTeacherAttendance();
        });
    }

    // Year level chips
    if (gradeChips) {
        gradeChips.querySelectorAll('.grade-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                gradeChips.querySelectorAll('.grade-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');

                const grade = this.dataset.grade;
                if (studentGradeFilter) studentGradeFilter.value = grade;
                if (currentGradeLabel) currentGradeLabel.textContent = grade || 'All Grade Levels';

                populateSectionDropdown(grade);
                renderStudentAttendance();
            });
        });
    }

    // Year level dropdown change
    if (studentGradeFilter) {
        studentGradeFilter.addEventListener('change', function() {
            const grade = this.value;
            if (currentGradeLabel) currentGradeLabel.textContent = grade || 'All Grade Levels';

            // Sync chips
            if (gradeChips) {
                gradeChips.querySelectorAll('.grade-chip').forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.grade === grade);
                });
            }

            populateSectionDropdown(grade);
            renderStudentAttendance();
        });
    }

    if (studentSectionFilter) studentSectionFilter.addEventListener('change', renderStudentAttendance);
    if (studentStatusFilter) studentStatusFilter.addEventListener('change', renderStudentAttendance);
    if (studentSearchInput) studentSearchInput.addEventListener('input', renderStudentAttendance);

    // Teacher filter listeners
    if (teacherSelectFilter) teacherSelectFilter.addEventListener('change', renderTeacherAttendance);
    if (teacherStatusFilter) teacherStatusFilter.addEventListener('change', renderTeacherAttendance);

    // Mark All Present
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', function() {
            const selectedGrade = studentGradeFilter ? studentGradeFilter.value : '';
            const selectedSection = studentSectionFilter ? studentSectionFilter.value : '';

            let count = 0;
            studentRecords.forEach(s => {
                const matchGrade = !selectedGrade || s.grade === selectedGrade;
                const matchSection = !selectedSection || s.section === selectedSection;

                if (matchGrade && matchSection) {
                    s.status = 'Present';
                    s.timeIn = '07:30 AM';
                    s.timeOut = '04:30 PM';
                    s.remarks = 'Marked present (bulk)';
                    count++;
                }
            });

            saveStudentAttendance();
            renderStudentAttendance();
            showAlert(`✅ Marked ${count} students as Present.`, 'success');
        });
    }

    // Save All Attendance
    if (saveAllAttendanceBtn) {
        saveAllAttendanceBtn.addEventListener('click', function() {
            saveStudentAttendance();
            showAlert('✅ Attendance records saved successfully!', 'success');
        });
    }

    // Reset filters
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            if (studentGradeFilter) studentGradeFilter.value = '';
            if (studentSectionFilter) studentSectionFilter.value = '';
            if (studentStatusFilter) studentStatusFilter.value = '';
            if (studentSearchInput) studentSearchInput.value = '';
            if (studentDateFilter) studentDateFilter.value = todayStr;

            if (currentGradeLabel) currentGradeLabel.textContent = 'All Grade Levels';
            if (gradeChips) {
                gradeChips.querySelectorAll('.grade-chip').forEach((c, idx) => {
                    c.classList.toggle('active', idx === 0);
                });
            }

            populateSectionDropdown('');
            renderStudentAttendance();
        });
    }

    // Export report
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const selectedGrade = studentGradeFilter ? studentGradeFilter.value : 'Whole School';
            const selectedSection = studentSectionFilter ? studentSectionFilter.value : 'All Sections';
            const date = studentDateFilter ? studentDateFilter.value : todayStr;

            let csvContent = `data:text/csv;charset=utf-8,PLSNHS Attendance Report\nDate: ${date}\nYear Level: ${selectedGrade}\nSection: ${selectedSection}\n\n`;
            csvContent += "LRN,Student Name,Grade Level,Section,Time In,Time Out,Status,Remarks\n";

            studentRecords.forEach(s => {
                csvContent += `"${s.lrn}","${s.name}","${s.grade}","${s.section}","${s.timeIn}","${s.timeOut}","${s.status}","${s.remarks || ''}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `PLSNHS_Attendance_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showAlert('✅ Attendance CSV Report downloaded successfully!', 'success');
        });
    }

    // Modal open
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', function() {
            editRecordId.value = '';
            modalType.disabled = false;
            modalType.value = 'student';
            studentModalFields.style.display = 'block';
            teacherModalFields.style.display = 'none';

            modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add Attendance Record';
            modalStudentName.value = '';
            modalStudentLRN.value = '';
            modalStatus.value = 'Present';
            modalRemarks.value = '';
            modalGrade.value = 'Grade 10';
            populateModalSectionDropdown('Grade 10');

            attendanceModal.classList.add('active');
        });
    }

    // Modal close
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => attendanceModal.classList.remove('active'));
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => attendanceModal.classList.remove('active'));

    // Modal type change
    if (modalType) {
        modalType.addEventListener('change', function() {
            if (this.value === 'student') {
                studentModalFields.style.display = 'block';
                teacherModalFields.style.display = 'none';
            } else {
                studentModalFields.style.display = 'none';
                teacherModalFields.style.display = 'block';
            }
        });
    }

    if (modalGrade) {
        modalGrade.addEventListener('change', function() {
            populateModalSectionDropdown(this.value);
        });
    }

    // Modal submit
    if (attendanceModalForm) {
        attendanceModalForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const type = modalType.value;
            const recordId = editRecordId.value;

            if (type === 'student') {
                const name = modalStudentName.value.trim();
                const grade = modalGrade.value;
                const section = modalSection.value;
                const lrn = modalStudentLRN.value.trim() || `109876${Math.floor(100000 + Math.random() * 900000)}`;
                const status = modalStatus.value;
                const timeIn = modalTimeIn.value ? `${modalTimeIn.value} AM` : '07:30 AM';
                const timeOut = modalTimeOut.value ? `${modalTimeOut.value} PM` : '04:30 PM';
                const remarks = modalRemarks.value.trim();

                if (!name) {
                    showAlert('Student name is required', 'error');
                    return;
                }

                if (recordId) {
                    // Update
                    const s = studentRecords.find(item => item.id == recordId);
                    if (s) {
                        s.name = name;
                        s.grade = grade;
                        s.section = section;
                        s.lrn = lrn;
                        s.status = status;
                        s.timeIn = timeIn;
                        s.timeOut = timeOut;
                        s.remarks = remarks;
                    }
                    showAlert('✅ Student attendance updated successfully!', 'success');
                } else {
                    // Add
                    const newRec = {
                        id: Date.now(),
                        lrn: lrn,
                        name: name,
                        grade: grade,
                        section: section,
                        gender: 'Unspecified',
                        status: status,
                        timeIn: timeIn,
                        timeOut: timeOut,
                        remarks: remarks
                    };
                    studentRecords.unshift(newRec);
                    showAlert('✅ Student attendance added successfully!', 'success');
                }

                saveStudentAttendance();
                renderStudentAttendance();
            } else {
                // Teacher attendance
                const teacherName = modalTeacherSelect.value;
                const status = modalStatus.value;
                const timeIn = modalTimeIn.value ? `${modalTimeIn.value} AM` : '07:30 AM';
                const timeOut = modalTimeOut.value ? `${modalTimeOut.value} PM` : '04:30 PM';
                const remarks = modalRemarks.value.trim();

                if (!teacherName) {
                    showAlert('Please select a teacher', 'error');
                    return;
                }

                const newTeacherRec = {
                    id: Date.now(),
                    name: teacherName,
                    id_number: `PLSNHS-TCH-0000${Math.floor(1 + Math.random() * 9)}`,
                    dept: 'Faculty Member',
                    date: modalDate.value || todayStr,
                    timeIn: timeIn,
                    timeOut: timeOut,
                    status: status,
                    remarks: remarks
                };

                teacherRecords.unshift(newTeacherRec);
                saveTeacherAttendance();
                renderTeacherAttendance();
                showAlert('✅ Teacher attendance record added successfully!', 'success');
            }

            attendanceModal.classList.remove('active');
        });
    }

    // Mobile sidebar
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close modal on click outside
    window.addEventListener('click', function(e) {
        if (e.target === attendanceModal) {
            attendanceModal.classList.remove('active');
        }
    });

    // ============================================
    // INITIALIZATION
    // ============================================
    populateSectionDropdown('');
    populateModalSectionDropdown('Grade 10');
    populateTeacherDropdowns();
    renderStudentAttendance();
    renderTeacherAttendance();
});