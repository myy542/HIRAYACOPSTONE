// ===== SEND NOTIFICATION REQUIREMENTS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const form = document.getElementById('notificationForm');
    const studentSelect = document.getElementById('studentSelect');
    const studentEmail = document.getElementById('studentEmail');
    const studentName = document.getElementById('studentName');
    const requirementSelect = document.getElementById('requirementSelect');
    const additionalMessage = document.getElementById('additionalMessage');
    const previewTitle = document.getElementById('previewTitle');
    const previewMessage = document.getElementById('previewMessage');
    const previewStudent = document.getElementById('previewStudent');
    const sendBtn = document.getElementById('sendBtn');
    const logBody = document.getElementById('logBody');
    const logCount = document.getElementById('logCount');

    // ===== DATA =====

    // Student data
    const students = {
        1: { name: 'Juan Dela Cruz', email: 'juan.dela@plshs.edu.ph' },
        2: { name: 'Maria Santos', email: 'maria.santos@plshs.edu.ph' },
        3: { name: 'Carlos Mendoza', email: 'carlos.m@plshs.edu.ph' },
        4: { name: 'Elena Garcia', email: 'elena.g@plshs.edu.ph' },
        5: { name: 'Ana Reyes', email: 'ana.reyes@plshs.edu.ph' }
    };

    // Notification log
    let notificationLog = [];

    // Statistics
    let stats = {
        totalStudents: 5,
        missingReqs: 3,
        notifSent: 0
    };

    // ===== FUNCTIONS =====

    // Update stats
    function updateStats() {
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('missingReqs').textContent = stats.missingReqs;
        document.getElementById('notifSent').textContent = stats.notifSent;
    }

    // Update preview
    function updatePreview() {
        const studentId = studentSelect.value;
        const requirement = requirementSelect.value;
        const message = additionalMessage.value.trim();

        const student = studentId ? students[studentId] : null;
        const studentNameText = student ? student.name : '[Select student]';

        // Update title
        previewTitle.textContent = requirement ? 
            `⚠️ Missing Requirement: ${requirement}` : 
            '⚠️ Missing Requirement: [Select requirement]';

        // Update message
        let msg = requirement ? 
            `The school administration has notified you about the missing requirement: ${requirement}. ` :
            'The school administration has notified you about a missing requirement. ';
        msg += 'Please submit this requirement as soon as possible to complete your enrollment process.';
        
        if (message) {
            msg += `\n\nAdditional Instructions: ${message}`;
        }
        previewMessage.textContent = msg;

        // Update student
        previewStudent.innerHTML = `<i class="fas fa-user"></i> Student: ${studentNameText}`;
    }

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

    // Add log entry
    function addLogEntry(student, requirement, status) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        notificationLog.unshift({
            time: `${date} ${time}`,
            student: student,
            requirement: requirement,
            status: status
        });

        renderLog();
    }

    // Render log
    function renderLog() {
        if (notificationLog.length === 0) {
            logBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="no-data">
                            <i class="fas fa-bell-slash"></i>
                            <p>No notifications sent yet</p>
                        </div>
                    </td>
                </tr>
            `;
            logCount.textContent = '0 entries';
            return;
        }

        let html = '';
        notificationLog.forEach(log => {
            const statusClass = log.status === 'Sent' ? 'sent' : log.status === 'Failed' ? 'failed' : 'pending';
            html += `
                <tr>
                    <td>${log.time}</td>
                    <td><strong>${log.student}</strong></td>
                    <td>${log.requirement}</td>
                    <td><span class="status-badge status-${statusClass}">${log.status}</span></td>
                </tr>
            `;
        });

        logBody.innerHTML = html;
        logCount.textContent = `${notificationLog.length} entries`;
    }

    // Reset form
    window.resetForm = function() {
        studentSelect.value = '';
        requirementSelect.value = '';
        additionalMessage.value = '';
        studentEmail.value = '';
        studentName.value = '';
        updatePreview();
    };

    // ===== SIMULATE API CALL =====

    function sendNotification(data) {
        return new Promise((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                // Random success/failure (90% success rate)
                const success = Math.random() < 0.9;
                resolve({
                    success: success,
                    message: success ? 
                        'Notification sent successfully to student dashboard and email' :
                        'Failed to send notification. Please try again.'
                });
            }, 1500);
        });
    }

    // ===== EVENT LISTENERS =====

    // Student select change
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            const studentId = this.value;
            if (studentId && students[studentId]) {
                studentEmail.value = students[studentId].email;
                studentName.value = students[studentId].name;
            } else {
                studentEmail.value = '';
                studentName.value = '';
            }
            updatePreview();
        });
    }

    // Requirement select change
    if (requirementSelect) {
        requirementSelect.addEventListener('change', updatePreview);
    }

    // Additional message input
    if (additionalMessage) {
        additionalMessage.addEventListener('input', updatePreview);
    }

    // ===== FORM SUBMIT =====

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const studentId = studentSelect.value;
            const requirement = requirementSelect.value;
            const message = additionalMessage.value.trim();

            // Validate
            if (!studentId) {
                showAlert('Please select a student.', 'error');
                return;
            }

            if (!requirement) {
                showAlert('Please select a missing requirement.', 'error');
                return;
            }

            const student = students[studentId];
            if (!student) {
                showAlert('Student not found.', 'error');
                return;
            }

            // Disable button and show loading
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                // Prepare data
                const data = {
                    student_id: studentId,
                    student_email: student.email,
                    student_name: student.name,
                    requirement: requirement,
                    requirement_key: requirement.toLowerCase().replace(/\s+/g, '_'),
                    additional_message: message
                };

                // Send notification (simulated API call)
                const result = await sendNotification(data);

                if (result.success) {
                    showAlert('✅ ' + result.message, 'success');
                    addLogEntry(student.name, requirement, 'Sent');
                    stats.notifSent++;
                    updateStats();
                    
                    // Reset form after successful send
                    setTimeout(() => {
                        resetForm();
                    }, 1000);
                } else {
                    showAlert('❌ ' + result.message, 'error');
                    addLogEntry(student.name, requirement, 'Failed');
                }
            } catch (error) {
                showAlert('❌ Error sending notification: ' + error.message, 'error');
                addLogEntry(student.name, requirement, 'Failed');
            } finally {
                // Re-enable button
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Notification';
            }
        });
    }

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

    updateStats();
    updatePreview();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});