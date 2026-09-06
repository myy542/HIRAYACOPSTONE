// ===== ADD SUBJECT JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const subjectNameInput = document.getElementById('subject_name');
    const gradeSelect = document.getElementById('grade_id');
    const previewName = document.getElementById('previewName');
    const previewGrade = document.getElementById('previewGrade');
    const quickButtons = document.getElementById('quickButtons');
    const categoryTags = document.getElementById('categoryTags');
    const subjectForm = document.getElementById('subjectForm');
    const alertContainer = document.getElementById('alertContainer');

    // State
    let currentCategory = null;
    let isPrefixProtected = false;
    let currentPrefix = '';

    // Subject lists by grade level
    const juniorHighSubjects = [
        'Mathematics', 'Science', 'English', 'Filipino', 'Araling Panlipunan', 
        'MAPEH', 'Edukasyon sa Pagpapakatao', 'Technology and Livelihood Education'
    ];
    
    const seniorHighSubjects = [
        'General Mathematics', 'Statistics and Probability', 'Earth Science', 'Physical Science',
        '21st Century Literature', 'Oral Communication', 'Reading and Writing Skills',
        'Personal Development', 'Understanding Culture, Society and Politics',
        'Introduction to Philosophy', 'Physical Education and Health'
    ];

    const gradeOptions = {
        7: 'Grade 7',
        8: 'Grade 8',
        9: 'Grade 9',
        10: 'Grade 10',
        11: 'Grade 11',
        12: 'Grade 12'
    };

    // ===== FUNCTIONS =====

    // Select category
    window.selectCategory = function(category) {
        const gradeId = parseInt(gradeSelect.value);
        
        if (!gradeId) {
            showAlert('Please select a grade level first', 'error');
            return;
        }
        
        const isSeniorHigh = gradeId === 11 || gradeId === 12;
        if (isSeniorHigh) {
            showAlert('For Senior High, only "Major" category is available.', 'error');
            return;
        }
        
        currentCategory = category;
        const prefix = category + ':';
        
        // Remove existing prefix
        const prefixes = ['Core:', 'Major:', 'Elective:'];
        let currentValue = subjectNameInput.value;
        for (let p of prefixes) {
            if (currentValue.startsWith(p)) {
                currentValue = currentValue.substring(p.length).trim();
                break;
            }
        }
        
        // Set new value
        if (currentValue === 'Enter Subject Name' || currentValue === '' || currentValue === 'Enter subject name') {
            subjectNameInput.value = prefix + ' Enter Subject Name';
        } else {
            subjectNameInput.value = prefix + ' ' + currentValue;
        }
        
        isPrefixProtected = true;
        currentPrefix = prefix;
        
        // Update active state
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.classList.remove('active-category');
        });
        const activeTag = document.querySelector(`.category-tag[data-category="${category}"]`);
        if (activeTag) activeTag.classList.add('active-category');
        
        updatePreview();
    };

    // Select Major category for Senior High
    window.selectMajorCategory = function() {
        const gradeId = parseInt(gradeSelect.value);
        const isSeniorHigh = gradeId === 11 || gradeId === 12;
        
        if (!isSeniorHigh) {
            showAlert('Major category is only available for Senior High (Grades 11-12)', 'error');
            return;
        }
        
        currentCategory = 'Major';
        currentPrefix = 'Major:';
        
        let currentValue = subjectNameInput.value;
        if (currentValue === 'Enter Subject Name' || currentValue === '' || 
            currentValue === 'Core:' || currentValue === 'Elective:' || 
            currentValue === 'Core: Enter Subject Name' || currentValue === 'Elective: Enter Subject Name') {
            subjectNameInput.value = currentPrefix + ' Enter Subject Name';
        } else {
            const prefixes = ['Core:', 'Major:', 'Elective:'];
            for (let p of prefixes) {
                if (currentValue.startsWith(p)) {
                    currentValue = currentValue.substring(p.length).trim();
                    break;
                }
            }
            subjectNameInput.value = currentPrefix + ' ' + currentValue;
        }
        
        isPrefixProtected = true;
        
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.classList.remove('active-category');
        });
        const activeTag = document.querySelector('.category-tag.major');
        if (activeTag) activeTag.classList.add('active-category');
        
        updatePreview();
    };

    // Set subject from quick add
    window.setSubjectName = function(name) {
        let currentValue = subjectNameInput.value;
        
        if (isPrefixProtected && currentPrefix) {
            const cleanValue = currentValue.substring(currentPrefix.length).trim();
            if (cleanValue === 'Enter Subject Name' || cleanValue === '') {
                subjectNameInput.value = currentPrefix + ' ' + name;
            } else if (!cleanValue.includes(name)) {
                subjectNameInput.value = currentPrefix + ' ' + cleanValue + ', ' + name;
            } else {
                showAlert('This subject is already in the list', 'error');
            }
        } else {
            if (currentValue === 'Enter Subject Name' || currentValue === '') {
                subjectNameInput.value = name;
            } else if (!currentValue.includes(name)) {
                subjectNameInput.value = currentValue + ', ' + name;
            } else {
                showAlert('This subject is already in the list', 'error');
            }
        }
        
        updatePreview();
        subjectNameInput.focus();
    };

    // Protect prefix from being deleted
    function protectPrefix(e) {
        if (!isPrefixProtected || !currentPrefix) return true;
        
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const prefixLength = currentPrefix.length;
        
        if (start < prefixLength && end > 0) {
            e.preventDefault();
            showAlert(`The "${currentPrefix}" prefix is protected and cannot be erased.`, 'error');
            return false;
        }
        return true;
    }

    // Handle input with prefix protection
    function handleInput() {
        if (!isPrefixProtected || !currentPrefix) return;
        
        let newValue = this.value;
        
        if (!newValue.startsWith(currentPrefix)) {
            if (newValue === '' || newValue === 'Enter Subject Name' || newValue === 'Enter subject name') {
                this.value = currentPrefix + ' Enter Subject Name';
            } else {
                this.value = currentPrefix + ' ' + newValue;
            }
        }
        
        if (newValue === currentPrefix) {
            this.value = currentPrefix + ' Enter Subject Name';
        }
        
        updatePreview();
    }

    // Update category tags based on grade level
    function updateCategoryTags() {
        const gradeId = parseInt(gradeSelect.value);
        const isSeniorHigh = gradeId === 11 || gradeId === 12;
        
        if (isSeniorHigh) {
            categoryTags.innerHTML = `
                <button type="button" class="category-tag major" onclick="selectMajorCategory()">
                    <i class="fas fa-star"></i> Major Subject (Required)
                </button>
            `;
            if (gradeId) {
                selectMajorCategory();
            }
        } else if (gradeId) {
            categoryTags.innerHTML = `
                <button type="button" class="category-tag core" data-category="Core" onclick="selectCategory('Core')">
                    <i class="fas fa-book-open"></i> Core Subject
                </button>
                <button type="button" class="category-tag elective" data-category="Elective" onclick="selectCategory('Elective')">
                    <i class="fas fa-star"></i> Elective
                </button>
            `;
            if (currentCategory === 'Major') {
                isPrefixProtected = false;
                currentPrefix = '';
                const prefixes = ['Core:', 'Major:', 'Elective:'];
                let value = subjectNameInput.value;
                for (let p of prefixes) {
                    if (value.startsWith(p)) {
                        value = value.substring(p.length).trim();
                        subjectNameInput.value = value;
                        break;
                    }
                }
                document.querySelectorAll('.category-tag').forEach(tag => {
                    tag.classList.remove('active-category');
                });
            }
        } else {
            categoryTags.innerHTML = `
                <button type="button" class="category-tag core" data-category="Core" onclick="selectCategory('Core')">
                    <i class="fas fa-book-open"></i> Core Subject
                </button>
                <button type="button" class="category-tag elective" data-category="Elective" onclick="selectCategory('Elective')">
                    <i class="fas fa-star"></i> Elective
                </button>
            `;
        }
    }

    // Update quick buttons
    function updateQuickButtons() {
        const gradeId = parseInt(gradeSelect.value);
        const isSeniorHigh = gradeId === 11 || gradeId === 12;
        
        if (!gradeId) {
            quickButtons.innerHTML = '<p class="quick-placeholder">Select a grade level to see quick add options</p>';
            return;
        }
        
        const subjects = isSeniorHigh ? seniorHighSubjects : juniorHighSubjects;
        
        quickButtons.innerHTML = subjects.map(subject => 
            `<button type="button" class="quick-btn" onclick="setSubjectName('${subject.replace(/'/g, "\\'")}')">${subject}</button>`
        ).join('');
    }

    // Update preview
    function updatePreview() {
        let subjectName = subjectNameInput.value.trim();
        if (!subjectName || subjectName === '') {
            subjectName = 'Enter Subject Name';
        }
        previewName.textContent = subjectName;

        const gradeId = gradeSelect.value;
        if (gradeId && gradeOptions[gradeId]) {
            previewGrade.textContent = gradeOptions[gradeId];
        } else {
            previewGrade.textContent = 'Grade Level';
        }
    }

    // Reset category on grade change
    function resetCategory() {
        const gradeId = parseInt(gradeSelect.value);
        const isSeniorHigh = gradeId === 11 || gradeId === 12;
        
        if (isSeniorHigh && gradeId) {
            selectMajorCategory();
        } else if (gradeId) {
            currentCategory = null;
            isPrefixProtected = false;
            currentPrefix = '';
            
            let currentValue = subjectNameInput.value;
            const prefixes = ['Core:', 'Major:', 'Elective:'];
            for (let p of prefixes) {
                if (currentValue.startsWith(p)) {
                    currentValue = currentValue.substring(p.length).trim();
                    subjectNameInput.value = currentValue;
                    break;
                }
            }
            
            document.querySelectorAll('.category-tag').forEach(tag => {
                tag.classList.remove('active-category');
            });
        }
        updatePreview();
    }

    // Show alert
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        alertDiv.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        alertContainer.appendChild(alertDiv);

        setTimeout(function() {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }

    // ===== EVENT LISTENERS =====

    if (subjectNameInput) {
        subjectNameInput.addEventListener('keydown', protectPrefix);
        subjectNameInput.addEventListener('input', handleInput);
    }

    if (gradeSelect) {
        gradeSelect.addEventListener('change', function() {
            resetCategory();
            updateCategoryTags();
            updateQuickButtons();
            updatePreview();
        });
    }

    // ===== FORM SUBMIT =====

    if (subjectForm) {
        subjectForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const subjectName = subjectNameInput.value.trim();
            const gradeId = gradeSelect.value;
            let errors = [];

            if (!gradeId) {
                errors.push('Please select a grade level');
            }

            if (!subjectName || subjectName === '' || subjectName === 'Enter Subject Name' || subjectName === 'Enter subject name') {
                errors.push('Please enter a valid subject name');
            }

            const isSeniorHigh = parseInt(gradeId) === 11 || parseInt(gradeId) === 12;
            if (isSeniorHigh && gradeId) {
                if (!subjectName.startsWith('Major:') || 
                    subjectName === 'Major:' || 
                    subjectName === 'Major: Enter Subject Name') {
                    errors.push('For Senior High subjects, you must enter a subject name with the "Major:" prefix.');
                }
            }

            if (errors.length > 0) {
                showAlert(errors.join('<br>'), 'error');
            } else {
                showAlert('✅ Subject added successfully!', 'success');
                setTimeout(() => {
                    subjectNameInput.value = 'Enter Subject Name';
                    gradeSelect.value = '';
                    resetCategory();
                    updateCategoryTags();
                    updateQuickButtons();
                    updatePreview();
                    previewName.textContent = 'Enter Subject Name';
                    previewGrade.textContent = 'Grade Level';
                }, 1500);
            }
        });
    }

    // ===== INIT =====

    updateCategoryTags();
    updateQuickButtons();
    updatePreview();

    // Auto-hide alerts
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    }, 5000);
});