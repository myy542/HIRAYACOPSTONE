// ===== SEND NOTIFICATION REQUIREMENTS JAVASCRIPT (SUPABASE POWERED) =====
import { supabase } from '../../supabase/config.js';

document.addEventListener('DOMContentLoaded', async function() {
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

    // State
    let students = [];
    let notificationLog = [];
    let stats = {
        totalStudents: 0,
        missingReqs: 0,
        notifSent: 0
    };

    // Alert helper
    function showAlert(message, type = 'error') {
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // ===== DATA FETCHING =====
    async function loadStudents() {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('last_name', { ascending: true });

            if (error) throw error;

            students = (data || []).map(s => {
                const name = `${s.last_name || ''}, ${s.first_name || ''} ${s.middle_name || ''}`.trim() || 'Student';
                return {
                    id: s.id,
                    name: name,
                    email: s.email || 'student@plshs.edu.ph',
                    lrn: s.lrn || '—',
                    documents_status: s.documents_status || 'Pending'
                };
            });

            stats.totalStudents = students.length;
            stats.missingReqs = students.filter(s => s.documents_status !== 'Complete' && s.documents_status !== 'Verified').length;
            updateStats();

            // Populate select
            if (studentSelect) {
                let html = '<option value="">Select Student</option>';
                students.forEach(s => {
                    html += `<option value="${s.id}">${s.name} (${s.lrn})</option>`;
                });
                studentSelect.innerHTML = html;
            }
        } catch (err) {
            console.error('Error loading students:', err);
        }
    }

    function updateStats() {
        const totalEl = document.getElementById('totalStudents');
        const missingEl = document.getElementById('missingReqs');
        const notifEl = document.getElementById('notifSent');

        if (totalEl) totalEl.textContent = stats.totalStudents;
        if (missingEl) missingEl.textContent = stats.missingReqs;
        if (notifEl) notifEl.textContent = stats.notifSent;
    }

    function updatePreview() {
        if (!studentSelect || !requirementSelect) return;
        const studentId = studentSelect.value;
        const requirement = requirementSelect.value;
        const message = additionalMessage ? additionalMessage.value.trim() : '';

        const student = students.find(s => s.id === studentId);
        const studentNameText = student ? student.name : '[Select student]';

        if (previewTitle) {
            previewTitle.textContent = requirement ? 
                `⚠️ Missing Requirement: ${requirement}` : 
                '⚠️ Missing Requirement: [Select requirement]';
        }

        if (previewMessage) {
            let msg = requirement ? 
                `The school administration has notified you about the missing requirement: ${requirement}. ` :
                'The school administration has notified you about a missing requirement. ';
            msg += 'Please submit this requirement as soon as possible to complete your enrollment process.';
            
            if (message) {
                msg += `\n\nAdditional Instructions: ${message}`;
            }
            previewMessage.textContent = msg;
        }

        if (previewStudent) {
            previewStudent.innerHTML = `<i class="fas fa-user"></i> Student: ${studentNameText}`;
        }
    }

    function addLogEntry(studentName, requirement, status) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        notificationLog.unshift({
            time: `${date} ${time}`,
            student: studentName,
            requirement: requirement,
            status: status
        });

        renderLog();
    }

    function renderLog() {
        if (!logBody) return;

        if (notificationLog.length === 0) {
            logBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="no-data" style="text-align: center; padding: 24px; color: #64748b;">
                            <i class="fas fa-bell-slash"></i>
                            <p style="margin-top: 8px;">No notifications sent yet</p>
                        </div>
                    </td>
                </tr>
            `;
            if (logCount) logCount.textContent = '0 entries';
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
        if (logCount) logCount.textContent = `${notificationLog.length} entries`;
    }

    window.resetForm = function() {
        if (studentSelect) studentSelect.value = '';
        if (requirementSelect) requirementSelect.value = '';
        if (additionalMessage) additionalMessage.value = '';
        if (studentEmail) studentEmail.value = '';
        if (studentName) studentName.value = '';
        updatePreview();
    };

    // ===== EVENT LISTENERS =====
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            const studentId = this.value;
            const stu = students.find(s => s.id === studentId);
            if (stu) {
                if (studentEmail) studentEmail.value = stu.email;
                if (studentName) studentName.value = stu.name;
            } else {
                if (studentEmail) studentEmail.value = '';
                if (studentName) studentName.value = '';
            }
            updatePreview();
        });
    }

    if (requirementSelect) requirementSelect.addEventListener('change', updatePreview);
    if (additionalMessage) additionalMessage.addEventListener('input', updatePreview);

    // ===== FORM SUBMISSION =====
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const studentId = studentSelect.value;
            const requirement = requirementSelect.value;
            const message = additionalMessage ? additionalMessage.value.trim() : '';

            if (!studentId) {
                showAlert('Please select a student.', 'error');
                return;
            }

            if (!requirement) {
                showAlert('Please select a missing requirement.', 'error');
                return;
            }

            const student = students.find(s => s.id === studentId);
            if (!student) {
                showAlert('Student not found.', 'error');
                return;
            }

            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }

            try {
                // Insert real notification in Supabase
                const notificationTitle = `⚠️ Missing Requirement: ${requirement}`;
                const notificationMsg = `Please submit your ${requirement} to complete your enrollment. ${message ? 'Note: ' + message : ''}`;

                await supabase
                    .from('notifications')
                    .insert([{
                        user_id: student.id,
                        role: 'student',
                        title: notificationTitle,
                        message: notificationMsg,
                        type: 'warning',
                        read: false
                    }]);

                showAlert(`✅ Notification sent to ${student.name}!`, 'success');
                addLogEntry(student.name, requirement, 'Sent');
                stats.notifSent++;
                updateStats();

                window.resetForm();
            } catch (error) {
                console.error('Error sending notification:', error);
                showAlert('Failed to send notification: ' + error.message, 'error');
                addLogEntry(student.name, requirement, 'Failed');
            } finally {
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Notification';
                }
            }
        });
    }

    // Mobile Menu
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Init
    await loadStudents();
    updatePreview();
});