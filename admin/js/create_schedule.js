// ===== CREATE SCHEDULE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const scheduleForm = document.getElementById('scheduleForm');
    const dayTabs = document.querySelectorAll('.day-tab');
    const daySchedules = document.querySelectorAll('.day-schedule');
    const scheduleCount = document.getElementById('scheduleCount');
    const weeklyBody = document.getElementById('weeklyBody');
    const weeklyCount = document.getElementById('weeklyCount');
    const conflictWarning = document.getElementById('conflictWarning');
    const conflictMessage = document.getElementById('conflictMessage');

    // ===== DATA =====

    // Sample data (in real app, this comes from PHP)
    const sectionData = {
        id: 1,
        section_name: 'Grade 10 - Section A',
        grade_name: 'Grade 10',
        adviser_name: 'Maria Santos',
        school_year: '2024-2025'
    };

    const days = [
        { id: 1, name: 'Monday' },
        { id: 2, name: 'Tuesday' },
        { id: 3, name: 'Wednesday' },
        { id: 4, name: 'Thursday' },
        { id: 5, name: 'Friday' }
    ];

    const timeSlots = [
        { id: 1, start: '07:00:00', end: '08:00:00', label: '7:00 AM - 8:00 AM' },
        { id: 2, start: '08:00:00', end: '09:00:00', label: '8:00 AM - 9:00 AM' },
        { id: 3, start: '09:00:00', end: '10:00:00', label: '9:00 AM - 10:00 AM' },
        { id: 4, start: '10:00:00', end: '11:00:00', label: '10:00 AM - 11:00 AM' },
        { id: 5, start: '11:00:00', end: '12:00:00', label: '11:00 AM - 12:00 PM' }
    ];

    const teachers = [
        { id: 1, name: 'Maria Santos' },
        { id: 2, name: 'Juan Dela Cruz' },
        { id: 3, name: 'Ana Reyes' },
        { id: 4, name: 'Carlos Mendoza' }
    ];

    const subjects = [
        { id: 1, name: 'Mathematics' },
        { id: 2, name: 'Science' },
        { id: 3, name: 'English' },
        { id: 4, name: 'Filipino' },
        { id: 5, name: 'Araling Panlipunan' }
    ];

    // Sample schedules
    let schedules = [
        { id: 1, section_id: 1, subject_id: 1, subject_name: 'Mathematics', teacher_id: 1, teacher_name: 'Maria Santos', day_id: 1, day_name: 'Monday', time_slot_id: 1, start_time: '07:00:00', end_time: '08:00:00', room: 'Room 101', school_year: '2024-2025', quarter: 1 },
        { id: 2, section_id: 1, subject_id: 2, subject_name: 'Science', teacher_id: 2, teacher_name: 'Juan Dela Cruz', day_id: 1, day_name: 'Monday', time_slot_id: 2, start_time: '08:00:00', end_time: '09:00:00', room: 'Room 102', school_year: '2024-2025', quarter: 1 },
        { id: 3, section_id: 1, subject_id: 3, subject_name: 'English', teacher_id: 3, teacher_name: 'Ana Reyes', day_id: 2, day_name: 'Tuesday', time_slot_id: 1, start_time: '07:00:00', end_time: '08:00:00', room: 'Room 101', school_year: '2024-2025', quarter: 1 },
        { id: 4, section_id: 1, subject_id: 4, subject_name: 'Filipino', teacher_id: 4, teacher_name: 'Carlos Mendoza', day_id: 3, day_name: 'Wednesday', time_slot_id: 3, start_time: '09:00:00', end_time: '10:00:00', room: 'Room 103', school_year: '2024-2025', quarter: 1 },
        { id: 5, section_id: 1, subject_id: 1, subject_name: 'Mathematics', teacher_id: 1, teacher_name: 'Maria Santos', day_id: 3, day_name: 'Wednesday', time_slot_id: 4, start_time: '10:00:00', end_time: '11:00:00', room: 'Room 101', school_year: '2024-2025', quarter: 1 }
    ];

    // ===== FUNCTIONS =====

    // Update section info
    function updateSectionInfo() {
        document.getElementById('sectionNameDisplay').textContent = sectionData.section_name;
        document.getElementById('sectionTitle').textContent = sectionData.section_name;
        document.getElementById('gradeName').textContent = sectionData.grade_name;
        document.getElementById('adviserName').textContent = sectionData.adviser_name;
        document.getElementById('schoolYearDisplay').textContent = sectionData.school_year;
    }

    // Render day schedules
    function renderDaySchedules() {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        let totalSchedules = 0;

        dayNames.forEach(dayName => {
            const container = document.getElementById(`${dayName.toLowerCase()}-schedule`);
            const daySchedules = schedules.filter(s => s.day_name === dayName);
            totalSchedules += daySchedules.length;

            if (daySchedules.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-day"></i>
                        <p>No classes scheduled on ${dayName}</p>
                    </div>
                `;
            } else {
                let html = `<div class="schedule-list">`;
                daySchedules.forEach(sch => {
                    const time = new Date(`2000-01-01T${sch.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    html += `
                        <div class="schedule-item ${dayName.toLowerCase()}">
                            <div class="schedule-info">
                                <h4>${sch.subject_name}</h4>
                                <p>
                                    <span><i class="fas fa-user"></i> ${sch.teacher_name}</span>
                                    <span><i class="fas fa-clock"></i> ${time}</span>
                                    ${sch.room ? `<span><i class="fas fa-door-open"></i> ${sch.room}</span>` : ''}
                                </p>
                            </div>
                            <button class="delete-btn" onclick="deleteSchedule(${sch.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                });
                html += `</div>`;
                container.innerHTML = html;
            }
        });

        scheduleCount.textContent = `${totalSchedules} subjects`;
        weeklyCount.textContent = `${totalSchedules} classes`;
    }

    // Render weekly schedule
    function renderWeeklySchedule() {
        // Group schedules by day and time slot
        const scheduleByDayTime = {};
        schedules.forEach(sch => {
            if (!scheduleByDayTime[sch.day_name]) {
                scheduleByDayTime[sch.day_name] = {};
            }
            scheduleByDayTime[sch.day_name][sch.time_slot_id] = sch;
        });

        let html = '';
        timeSlots.forEach(slot => {
            const start = new Date(`2000-01-01T${slot.start}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const end = new Date(`2000-01-01T${slot.end}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            html += `
                <tr>
                    <td class="time-cell">${start} - ${end}</td>
            `;

            days.forEach(day => {
                const sch = scheduleByDayTime[day.name]?.[slot.id];
                if (sch) {
                    html += `
                        <td class="schedule-cell">
                            <div class="subject-name"><strong>${sch.subject_name}</strong></div>
                            <div class="teacher-name"><i class="fas fa-user"></i> ${sch.teacher_name}</div>
                            ${sch.room ? `<div class="room-badge"><i class="fas fa-door-open"></i> ${sch.room}</div>` : ''}
                        </td>
                    `;
                } else {
                    html += `<td class="empty-cell">—</td>`;
                }
            });

            html += `</tr>`;
        });

        weeklyBody.innerHTML = html;
    }

    // Check for conflicts
    function checkConflicts(teacherId, dayId, timeSlotId, room, subjectId) {
        const dayName = days.find(d => d.id === parseInt(dayId))?.name;

        // Check teacher conflict
        const teacherConflict = schedules.some(s => 
            s.teacher_id === parseInt(teacherId) && 
            s.day_id === parseInt(dayId) && 
            s.time_slot_id === parseInt(timeSlotId)
        );

        if (teacherConflict) {
            const conflict = schedules.find(s => 
                s.teacher_id === parseInt(teacherId) && 
                s.day_id === parseInt(dayId) && 
                s.time_slot_id === parseInt(timeSlotId)
            );
            return {
                hasConflict: true,
                message: `Teacher conflict! This teacher is already teaching ${conflict.subject_name} for ${sectionData.section_name} on ${dayName} at ${new Date(`2000-01-01T${conflict.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            };
        }

        // Check room conflict
        if (room.trim()) {
            const roomConflict = schedules.some(s => 
                s.room === room.trim() && 
                s.day_id === parseInt(dayId) && 
                s.time_slot_id === parseInt(timeSlotId)
            );

            if (roomConflict) {
                const conflict = schedules.find(s => 
                    s.room === room.trim() && 
                    s.day_id === parseInt(dayId) && 
                    s.time_slot_id === parseInt(timeSlotId)
                );
                return {
                    hasConflict: true,
                    message: `Room conflict! Room ${room} is already used for ${conflict.subject_name} on ${dayName} at ${new Date(`2000-01-01T${conflict.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                };
            }
        }

        return { hasConflict: false };
    }

    // Add schedule
    function addSchedule(data) {
        const dayName = days.find(d => d.id === parseInt(data.day_id))?.name;
        const teacher = teachers.find(t => t.id === parseInt(data.teacher_id));
        const subject = subjects.find(s => s.id === parseInt(data.subject_id));
        const timeSlot = timeSlots.find(t => t.id === parseInt(data.time_slot_id));

        const newSchedule = {
            id: schedules.length + 1,
            section_id: sectionData.id,
            subject_id: parseInt(data.subject_id),
            subject_name: subject.name,
            teacher_id: parseInt(data.teacher_id),
            teacher_name: teacher.name,
            day_id: parseInt(data.day_id),
            day_name: dayName,
            time_slot_id: parseInt(data.time_slot_id),
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            room: data.room || '',
            school_year: data.school_year,
            quarter: parseInt(data.quarter)
        };

        schedules.push(newSchedule);
        renderDaySchedules();
        renderWeeklySchedule();
        showAlert('Schedule added successfully!', 'success');
    }

    // Delete schedule
    window.deleteSchedule = function(id) {
        if (confirm('Delete this schedule?')) {
            schedules = schedules.filter(s => s.id !== id);
            renderDaySchedules();
            renderWeeklySchedule();
            showAlert('Schedule deleted successfully!', 'success');
        }
    };

    // Show alert
    function showAlert(message, type = 'error') {
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

    // ===== DAY TAB FUNCTIONALITY =====

    dayTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            dayTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Hide all day schedules
            daySchedules.forEach(s => s.classList.remove('active'));

            // Show selected day schedule
            const day = this.dataset.day;
            const target = document.getElementById(`${day}-schedule`);
            if (target) target.classList.add('active');
        });
    });

    // ===== FORM SUBMIT =====

    scheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = {
            subject_id: formData.get('subject_id'),
            teacher_id: formData.get('teacher_id'),
            day_id: formData.get('day_id'),
            time_slot_id: formData.get('time_slot_id'),
            room: formData.get('room'),
            school_year: formData.get('school_year'),
            quarter: formData.get('quarter')
        };

        // Validate
        if (!data.subject_id || !data.teacher_id || !data.day_id || !data.time_slot_id) {
            showAlert('Please fill in all required fields.', 'error');
            return;
        }

        // Check conflicts
        const conflict = checkConflicts(
            data.teacher_id,
            data.day_id,
            data.time_slot_id,
            data.room,
            data.subject_id
        );

        if (conflict.hasConflict) {
            conflictWarning.style.display = 'flex';
            conflictMessage.textContent = conflict.message;
            showAlert(conflict.message, 'error');
            return;
        } else {
            conflictWarning.style.display = 'none';
        }

        // Add schedule
        addSchedule(data);
        this.reset();
    });

    // ===== LIVE CONFLICT CHECK =====

    const formInputs = ['subject_id', 'teacher_id', 'day_id', 'time_slot_id', 'room'];
    formInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', function() {
                const teacherId = document.getElementById('teacher_id').value;
                const dayId = document.getElementById('day_id').value;
                const timeSlotId = document.getElementById('time_slot_id').value;
                const room = document.getElementById('room').value;

                if (teacherId && dayId && timeSlotId) {
                    const conflict = checkConflicts(teacherId, dayId, timeSlotId, room);
                    if (conflict.hasConflict) {
                        conflictWarning.style.display = 'flex';
                        conflictMessage.textContent = conflict.message;
                    } else {
                        conflictWarning.style.display = 'none';
                    }
                }
            });
        }
    });

    // ===== MOBILE MENU =====

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== INIT =====

    updateSectionInfo();
    renderDaySchedules();
    renderWeeklySchedule();
});