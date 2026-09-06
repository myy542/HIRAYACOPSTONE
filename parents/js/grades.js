// ===== GRADES JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const studentSelect = document.getElementById('studentSelect');
    const gradesBody = document.getElementById('gradesBody');
    const gradeCount = document.getElementById('gradeCount');
    const gradesStats = document.getElementById('gradesStats');
    const summaryCards = document.getElementById('summaryCards');
    const honorRollSection = document.getElementById('honorRollSection');

    // ===== DATA =====

    // Sample grade data
    const gradesData = [
        {
            student_id: 1,
            student_name: 'Juan Dela Cruz',
            grade_level: 'Grade 11 - STEM A',
            subjects: [
                { name: 'Mathematics', q1: 94, q2: 92, q3: 95, q4: 93, final: 93.5 },
                { name: 'Science', q1: 91, q2: 89, q3: 92, q4: 90, final: 90.5 },
                { name: 'English', q1: 88, q2: 86, q3: 90, q4: 87, final: 87.75 },
                { name: 'Filipino', q1: 85, q2: 88, q3: 87, q4: 86, final: 86.5 },
                { name: 'Araling Panlipunan', q1: 82, q2: 84, q3: 86, q4: 85, final: 84.25 },
                { name: 'MAPEH', q1: 90, q2: 91, q3: 92, q4: 93, final: 91.5 },
                { name: 'Edukasyon sa Pagpapakatao', q1: 88, q2: 87, q3: 89, q4: 90, final: 88.5 },
                { name: 'TLE', q1: 86, q2: 85, q3: 88, q4: 87, final: 86.5 }
            ],
            average: 88.6,
            honor: 'With Honors'
        },
        {
            student_id: 2,
            student_name: 'Maria Dela Cruz',
            grade_level: 'Grade 9 - Section B',
            subjects: [
                { name: 'Mathematics', q1: 86, q2: 84, q3: 88, q4: 85, final: 85.75 },
                { name: 'Science', q1: 90, q2: 89, q3: 92, q4: 91, final: 90.5 },
                { name: 'English', q1: 84, q2: 82, q3: 85, q4: 83, final: 83.5 },
                { name: 'Filipino', q1: 88, q2: 86, q3: 89, q4: 87, final: 87.5 },
                { name: 'Araling Panlipunan', q1: 80, q2: 82, q3: 83, q4: 81, final: 81.5 },
                { name: 'MAPEH', q1: 92, q2: 90, q3: 93, q4: 91, final: 91.5 },
                { name: 'Edukasyon sa Pagpapakatao', q1: 85, q2: 84, q3: 86, q4: 85, final: 85 },
                { name: 'TLE', q1: 88, q2: 87, q3: 89, q4: 88, final: 88 }
            ],
            average: 86.6,
            honor: 'With High Honors'
        }
    ];

    // ===== FUNCTIONS =====

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

    // Get selected student
    function getSelectedStudent() {
        const value = studentSelect.value;
        if (value === 'all') return null;
        return parseInt(value);
    }

    // Get filtered data
    function getFilteredData() {
        const studentId = getSelectedStudent();
        if (studentId) {
            return gradesData.filter(g => g.student_id === studentId);
        }
        return gradesData;
    }

    // Render stats
    function renderStats() {
        const data = getFilteredData();
        
        if (data.length === 0) {
            gradesStats.innerHTML = `
                <div class="no-data" style="grid-column: 1 / -1;">
                    <i class="fas fa-star"></i>
                    <p>No grade data available.</p>
                </div>
            `;
            return;
        }

        let totalAverage = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let honorCount = 0;

        data.forEach(student => {
            totalAverage += student.average;
            // Count passed/failed subjects
            student.subjects.forEach(sub => {
                if (sub.final >= 75) {
                    totalPassed++;
                } else {
                    totalFailed++;
                }
            });
            if (student.honor !== 'No Honor' && student.honor !== 'Not Applicable') {
                honorCount++;
            }
        });

        const avgDisplay = data.length > 0 ? (totalAverage / data.length).toFixed(1) : 'N/A';

        gradesStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon average"><i class="fas fa-chart-line"></i></div>
                <div class="stat-number">${avgDisplay}</div>
                <div class="stat-label">Overall Average</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon passed"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number">${totalPassed}</div>
                <div class="stat-label">Passed Subjects</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon failed"><i class="fas fa-times-circle"></i></div>
                <div class="stat-number">${totalFailed}</div>
                <div class="stat-label">Failed Subjects</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon honor"><i class="fas fa-trophy"></i></div>
                <div class="stat-number">${honorCount}</div>
                <div class="stat-label">With Honors</div>
            </div>
        `;
    }

    // Render grades table
    function renderGrades() {
        const data = getFilteredData();
        
        if (data.length === 0) {
            gradesBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="no-data">
                            <i class="fas fa-star"></i>
                            <p>No grades available.</p>
                        </div>
                    </td>
                </tr>
            `;
            gradeCount.textContent = '0 subjects';
            return;
        }

        let totalSubjects = 0;
        let html = '';

        data.forEach(student => {
            // Add student name as header row
            html += `
                <tr style="background: #f8fafc; border-top: 2px solid #e9edf4;">
                    <td colspan="7" style="font-weight: 700; color: #1B2A4A; padding: 10px 14px;">
                        <i class="fas fa-user-graduate"></i> ${student.student_name} - ${student.grade_level}
                    </td>
                </tr>
            `;

            student.subjects.forEach(sub => {
                totalSubjects++;
                const finalGrade = sub.final;
                const isPassed = finalGrade >= 75;
                const gradeClass = isPassed ? 'grade-passed' : 'grade-failed';

                // Format quarter grades - show '—' if no data
                const q1 = sub.q1 || '—';
                const q2 = sub.q2 || '—';
                const q3 = sub.q3 || '—';
                const q4 = sub.q4 || '—';

                html += `
                    <tr>
                        <td class="subject-cell">${sub.name}</td>
                        <td class="grade-cell">${q1}</td>
                        <td class="grade-cell">${q2}</td>
                        <td class="grade-cell">${q3}</td>
                        <td class="grade-cell">${q4}</td>
                        <td class="grade-cell ${gradeClass}">${finalGrade}</td>
                        <td class="grade-cell">
                            ${isPassed ? 
                                '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Passed</span>' : 
                                '<span style="color: #ef4444;"><i class="fas fa-times-circle"></i> Failed</span>'
                            }
                        </td>
                    </tr>
                `;
            });

            // Add average row
            const avgClass = student.average >= 75 ? 'grade-passed' : 'grade-failed';
            html += `
                <tr style="background: #f8fafc; font-weight: 600;">
                    <td colspan="5" style="text-align: right; padding: 10px 14px;">
                        <strong>Average: ${student.average}%</strong>
                    </td>
                    <td class="${avgClass}">${student.average}</td>
                    <td>
                        <span class="grade-with-${student.honor.toLowerCase().replace(' ', '-')}">
                            ${student.honor}
                        </span>
                    </td>
                </tr>
            `;
        });

        gradesBody.innerHTML = html;
        gradeCount.textContent = `${totalSubjects} subjects`;
    }

    // Render summary cards
    function renderSummary() {
        const data = getFilteredData();
        
        if (data.length === 0) {
            summaryCards.innerHTML = '';
            return;
        }

        let html = '';
        data.forEach(student => {
            const passed = student.subjects.filter(s => s.final >= 75).length;
            const failed = student.subjects.filter(s => s.final < 75).length;
            const total = student.subjects.length;

            html += `
                <div class="summary-card">
                    <div class="summary-value">${student.average}%</div>
                    <div class="summary-label">${student.student_name}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                        Passed: ${passed} | Failed: ${failed} | Total: ${total}
                    </div>
                    <div style="margin-top: 6px;">
                        <span class="grade-with-${student.honor.toLowerCase().replace(' ', '-')}">
                            ${student.honor}
                        </span>
                    </div>
                </div>
            `;
        });

        summaryCards.innerHTML = html;
    }

    // Render honor roll
    function renderHonorRoll() {
        const data = getFilteredData();
        const honorStudents = data.filter(s => s.honor !== 'No Honor' && s.honor !== 'Not Applicable');

        if (honorStudents.length === 0) {
            honorRollSection.innerHTML = `
                <div class="honor-roll-header">
                    <i class="fas fa-trophy"></i>
                    <h3>Honor Roll</h3>
                </div>
                <div class="no-data">
                    <i class="fas fa-trophy"></i>
                    <p>No students with honors.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="honor-roll-header">
                <i class="fas fa-trophy"></i>
                <h3>Honor Roll</h3>
            </div>
        `;

        honorStudents.forEach(student => {
            const honorClass = student.honor.toLowerCase().replace(' ', '-');
            html += `
                <div class="honor-roll-item">
                    <span class="student-name">
                        <i class="fas fa-user-graduate"></i> ${student.student_name}
                    </span>
                    <div>
                        <span class="honor-badge ${honorClass}">
                            ${student.honor}
                        </span>
                        <span style="font-size: 13px; color: #64748b; margin-left: 10px;">
                            Avg: ${student.average}%
                        </span>
                    </div>
                </div>
            `;
        });

        honorRollSection.innerHTML = html;
    }

    // Render all
    function renderAll() {
        renderStats();
        renderGrades();
        renderSummary();
        renderHonorRoll();
    }

    // ===== EVENT LISTENERS =====

    // Student select change
    if (studentSelect) {
        studentSelect.addEventListener('change', renderAll);
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

    renderAll();

    // Auto-dismiss alerts
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
    }, 5000);
});