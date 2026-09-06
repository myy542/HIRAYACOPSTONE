// ===== CREATE SECTION JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sectionNameInput = document.getElementById('section_name');
    const gradeSelect = document.getElementById('grade_id');
    const adviserSelect = document.getElementById('adviser_id');
    const previewName = document.getElementById('previewName');
    const previewDetails = document.getElementById('previewDetails');
    const sectionForm = document.getElementById('sectionForm');
    const alertContainer = document.getElementById('alertContainer');
    const quickButtons = document.querySelectorAll('.quick-btn');

    // ===== DATA =====

    // Grade level mapping
    const gradeOptions = {
        7: 'Grade 7',
        8: 'Grade 8',
        9: 'Grade 9',
        10: 'Grade 10',
        11: 'Grade 11',
        12: 'Grade 12'
    };

    // Teachers data
    const teachers = {
        1: 'Maria Santos',
        2: 'Juan Dela Cruz',
        3: 'Ana Reyes',
        4: 'Carlos Mendoza'
    };

    // ===== FUNCTIONS =====

    // Get selected option text
    function getSelectedOptionText(select) {
        if (!select.value) return '';
        const option = select.options[select.selectedIndex];
        return option ? option.text : '';
    }

    // Update preview
    function updatePreview() {
        // Update section name
        const sectionName = sectionNameInput.value.trim() || 'Section Name';
        previewName.textContent = sectionName;

        // Get grade text
        let gradeText = 'Grade Level';
        if (gradeSelect.value && gradeOptions[gradeSelect.value]) {
            gradeText = gradeOptions[gradeSelect.value];
        }

        // Get adviser text
        let adviserText = 'No Adviser Assigned';
        if (adviserSelect.value && teachers[adviserSelect.value]) {
            adviserText = 'Adviser: ' + teachers[adviserSelect.value];
        }

        previewDetails.textContent = `${gradeText} · ${adviserText}`;
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

    // Show error list
    function showErrorList(errors) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';
        
        let html = `<i class="fas fa-exclamation-circle"></i> Please fix the following errors:`;
        html += `<ul class="error-list">`;
        errors.forEach(error => {
            html += `<li><i class="fas fa-times-circle"></i> ${error}</li>`;
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

    // ===== QUICK ADD BUTTONS =====

    quickButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            const grade = this.dataset.grade;
            
            // Set section name
            if (sectionNameInput) {
                sectionNameInput.value = section;
            }
            
            // Set grade
            if (gradeSelect) {
                gradeSelect.value = grade;
            }
            
            // Update preview
            updatePreview();
            
            // Highlight effect
            this.style.background = '#1B2A4A';
            this.style.color = '#fff';
            setTimeout(() => {
                this.style.background = '';
                this.style.color = '';
            }, 500);
        });
    });

    // ===== EVENT LISTENERS =====

    if (sectionNameInput) {
        sectionNameInput.addEventListener('input', updatePreview);
    }

    if (gradeSelect) {
        gradeSelect.addEventListener('change', updatePreview);
    }

    if (adviserSelect) {
        adviserSelect.addEventListener('change', updatePreview);
    }

    // ===== FORM SUBMIT =====

    if (sectionForm) {
        sectionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const sectionName = sectionNameInput.value.trim();
            const gradeId = gradeSelect.value;
            const adviserId = adviserSelect.value;

            let errors = [];

            // Validate section name
            if (!sectionName) {
                errors.push('Section name is required');
            }

            // Validate grade level
            if (!gradeId) {
                errors.push('Grade level is required');
            }

            // Show errors or success
            if (errors.length > 0) {
                showErrorList(errors);
            } else {
                // Get grade and adviser names for display
                const gradeName = gradeOptions[gradeId] || 'Unknown Grade';
                const adviserName = adviserId && teachers[adviserId] ? teachers[adviserId] : 'Not Assigned';
                
                const message = `✅ Section "${sectionName}" created successfully!<br>
                                <small>Grade: ${gradeName} | Adviser: ${adviserName}</small>`;
                showAlert(message, 'success');
                
                // Reset form after success
                setTimeout(() => {
                    sectionNameInput.value = '';
                    gradeSelect.value = '';
                    adviserSelect.value = '';
                    updatePreview();
                    previewName.textContent = 'Section Name';
                    previewDetails.textContent = 'Grade Level · No Adviser Assigned';
                    
                    // Scroll to top to show success message
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 1500);
            }
        });
    }

    // ===== AUTO-HIDE ALERTS =====

    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);

    // ===== INITIAL PREVIEW =====

    updatePreview();

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
});