/**
 * Teacher Grade Management - Firebase Integration
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
    orderBy,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

(function() {
    'use strict';

    console.log('📊 Grade Management ready');

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const teacherName = document.getElementById('teacherName');
    const teacherInitial = document.getElementById('teacherInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats
    const totalClasses = document.getElementById('totalClasses');
    const totalSubjects = document.getElementById('totalSubjects');
    const totalStudents = document.getElementById('totalStudents');
    const gradedCount = document.getElementById('gradedCount');

    // Filter form
    const sectionSelect = document.getElementById('section_id');
    const subjectSelect = document.getElementById('subject_id');
    const quarterSelect = document.getElementById('quarter');
    const filterForm = document.getElementById('filterForm');

    // Grade table container
    const gradeTableBody = document.getElementById('gradeTableBody');
    const statsPanel = document.getElementById('statsPanel');
    const gradeForm = document.getElementById('gradesForm');

    // No data container
    const noDataContainer = document.getElementById('noDataContainer');

    // Alert container
    const alertContainer = document.getElementById('alertContainer');

    // ============================================
    // STATE
    // ============================================

    let currentUser = null;
    let userData = null;
    let assignedClasses = [];
    let teacherSubjects = {};
    let studentsList = [];
    let selectedSection = 0;
    let selectedSubject = 0;
    let selectedQuarter = '1st Quarter';
    let gradesData = {};

    const quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User logged in:', user.email);
            const displayName = user.displayName || user.email || 'Teacher';
            const firstName = displayName.split('@')[0];
            teacherName.textContent = firstName;
            teacherInitial.textContent = firstName.charAt(0).toUpperCase();
            
            await loadUserData(user.uid);
            await loadAssignedClasses(user.uid);
            
            // Check URL params for filters
            const urlParams = new URLSearchParams(window.location.search);
            const sectionId = urlParams.get('section_id');
            const subjectId = urlParams.get('subject_id');
            const quarter = urlParams.get('quarter');
            
            if (sectionId && subjectId) {
                selectedSection = parseInt(sectionId);
                selectedSubject = parseInt(subjectId);
                if (quarter) selectedQuarter = quarter;
                await loadStudentsAndGrades();
            }
        } else {
            console.log('❌ User logged out - redirecting to login');
            window.location.href = '../auth/login.html';
        }
    });

    // ============================================
    // LOGOUT
    // ============================================

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                showAlert('❌ Error logging out: ' + error.message, 'error');
            });
        });
    }

    // ============================================
    // LOAD USER DATA
    // ============================================

    async function loadUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('📋 User data loaded:', userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // ============================================
    // LOAD ASSIGNED CLASSES
    // ============================================

    async function loadAssignedClasses(userId) {
        try {
            const classSchedulesRef = collection(db, 'classSchedules');
            const q = query(
                classSchedulesRef,
                where('teacherId', '==', userId),
                where('status', '==', 'active')
            );
            const snapshot = await getDocs(q);
            
            const classMap = {};
            const subjectMap = {};
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const sectionId = data.sectionId;
                const subjectId = data.subjectId;
                
                if (sectionId) {
                    if (!classMap[sectionId]) {
                        classMap[sectionId] = {
                            sectionId: sectionId,
                            sectionName: data.sectionName || 'Unknown Section',
                            gradeName: data.gradeName || 'N/A',
                            gradeId: data.gradeId
                        };
                    }
                    if (subjectId) {
                        if (!subjectMap[sectionId]) {
                            subjectMap[sectionId] = [];
                        }
                        // Avoid duplicates
                        if (!subjectMap[sectionId].some(s => s.subjectId === subjectId)) {
                            subjectMap[sectionId].push({
                                subjectId: subjectId,
                                subjectName: data.subjectName || 'Unknown Subject'
                            });
                        }
                    }
                }
            });
            
            assignedClasses = Object.values(classMap);
            teacherSubjects = subjectMap;
            
            console.log('📚 Assigned classes loaded:', assignedClasses.length);
            
            // Populate section dropdown
            populateSectionDropdown();
            
            // Update stats
            updateStats();
            
        } catch (error) {
            console.error('Error loading assigned classes:', error);
            assignedClasses = [];
        }
    }

    // ============================================
    // POPULATE DROPDOWNS
    // ============================================

    function populateSectionDropdown() {
        if (!sectionSelect) return;
        
        sectionSelect.innerHTML = '<option value="">Select Section</option>';
        assignedClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.sectionId;
            option.textContent = `${cls.sectionName} - ${cls.gradeName}`;
            option.dataset.gradeId = cls.gradeId;
            if (selectedSection === cls.sectionId) {
                option.selected = true;
            }
            sectionSelect.appendChild(option);
        });
        
        // Populate subjects based on selected section
        populateSubjectDropdown();
    }

    function populateSubjectDropdown() {
        if (!subjectSelect) return;
        
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        if (selectedSection && teacherSubjects[selectedSection]) {
            teacherSubjects[selectedSection].forEach(subj => {
                const option = document.createElement('option');
                option.value = subj.subjectId;
                option.textContent = subj.subjectName;
                if (selectedSubject === subj.subjectId) {
                    option.selected = true;
                }
                subjectSelect.appendChild(option);
            });
        }
    }

    // ============================================
    // SECTION CHANGE - Update Subjects
    // ============================================

    if (sectionSelect) {
        sectionSelect.addEventListener('change', function() {
            selectedSection = parseInt(this.value);
            selectedSubject = 0;
            populateSubjectDropdown();
            
            // Clear grade table
            gradeTableBody.innerHTML = '';
            statsPanel.innerHTML = '';
        });
    }

    // ============================================
    // LOAD STUDENTS AND GRADES
    // ============================================

    async function loadStudentsAndGrades() {
        if (!selectedSection || !selectedSubject) {
            return;
        }

        try {
            // Get selected section details
            const section = assignedClasses.find(c => c.sectionId === selectedSection);
            if (!section) {
                showAlert('⚠️ Selected section not found', 'error');
                return;
            }

            // Get enrolled students
            const enrollmentsRef = collection(db, 'enrollments');
            const q = query(
                enrollmentsRef,
                where('gradeId', '==', section.gradeId),
                where('status', '==', 'Enrolled')
            );
            const snapshot = await getDocs(q);
            
            const studentIds = [];
            const studentData = {};
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.userId) {
                    studentIds.push(data.userId);
                    studentData[data.userId] = {
                        enrollmentId: doc.id,
                        ...data
                    };
                }
            });

            // Get student details
            studentsList = [];
            for (const userId of studentIds) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    studentsList.push({
                        id: userId,
                        fullname: data.displayName || data.fullName || 'Unknown Student',
                        email: data.email || 'N/A',
                        idNumber: data.idNumber || 'N/A',
                        profilePicture: data.profilePicture || null,
                        ...studentData[userId]
                    });
                }
            }

            // Sort students by name
            studentsList.sort((a, b) => a.fullname.localeCompare(b.fullname));

            // Get existing grades
            await loadExistingGrades();

            // Render grade table
            renderGradeTable();
            renderStats();
            updateStats();

        } catch (error) {
            console.error('Error loading students:', error);
            showAlert('❌ Error loading students: ' + error.message, 'error');
        }
    }

    // ============================================
    // LOAD EXISTING GRADES
    // ============================================

    async function loadExistingGrades() {
        try {
            const gradesRef = collection(db, 'grades');
            const q = query(
                gradesRef,
                where('subjectId', '==', selectedSubject.toString()),
                where('quarter', '==', selectedQuarter)
            );
            const snapshot = await getDocs(q);
            
            gradesData = {};
            snapshot.forEach((doc) => {
                const data = doc.data();
                gradesData[data.studentId] = {
                    id: doc.id,
                    grade: data.grade,
                    ...data
                };
            });
            
            console.log('📊 Grades loaded:', Object.keys(gradesData).length);
            
        } catch (error) {
            console.error('Error loading grades:', error);
            gradesData = {};
        }
    }

    // ============================================
    // RENDER GRADE TABLE
    // ============================================

    function renderGradeTable() {
        if (!gradeTableBody) return;

        if (studentsList.length === 0) {
            gradeTableBody.innerHTML = `
                <tr>
                    <td colspan="2">
                        <div class="no-data">
                            <i class="fas fa-user-graduate"></i>
                            <h3>No Students Found</h3>
                            <p>There are no enrolled students in this section.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        gradeTableBody.innerHTML = studentsList.map(student => {
            const grade = gradesData[student.id];
            const gradeValue = grade ? grade.grade : '';
            const gradeId = grade ? grade.id : '';
            const isPassing = gradeValue && parseFloat(gradeValue) >= 75;
            const gradeClass = gradeValue ? (isPassing ? 'passing' : 'failing') : '';

            const initial = student.fullname.charAt(0).toUpperCase();
            const profilePic = student.profilePicture;

            return `
                <tr>
                    <td>
                        <div class="student-info">
                            ${profilePic ? `
                                <div class="student-avatar-img">
                                    <img src="${profilePic}" alt="Profile">
                                </div>
                            ` : `
                                <div class="student-avatar">${initial}</div>
                            `}
                            <div class="student-details">
                                <h4>${student.fullname}</h4>
                                <div class="student-meta">
                                    <span><i class="fas fa-id-card"></i> ID: ${student.idNumber}</span>
                                    <span><i class="fas fa-envelope"></i> ${student.email}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <input type="hidden" name="student_ids[]" value="${student.id}">
                        <input type="hidden" name="grade_ids[]" value="${gradeId}">
                        <input type="number" 
                               name="grades[]" 
                               class="grade-input ${gradeClass}" 
                               value="${gradeValue}"
                               min="0" 
                               max="100" 
                               step="0.01"
                               placeholder="Enter grade"
                               data-student-id="${student.id}"
                               oninput="window.validateGradeInput(this)">
                    </td>
                </tr>
            `;
        }).join('');

        // Re-attach grade validation to new inputs
        document.querySelectorAll('.grade-input').forEach(input => {
            input.addEventListener('input', function() {
                window.validateGradeInput(this);
            });
        });
    }

    // ============================================
    // RENDER STATS
    // ============================================

    function renderStats() {
        if (!statsPanel) return;

        const gradeValues = [];
        studentsList.forEach(student => {
            const grade = gradesData[student.id];
            if (grade && grade.grade !== null && grade.grade !== '') {
                gradeValues.push(parseFloat(grade.grade));
            }
        });

        if (gradeValues.length === 0) {
            statsPanel.innerHTML = '';
            return;
        }

        const average = gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length;
        const highest = Math.max(...gradeValues);
        const lowest = Math.min(...gradeValues);
        const passed = gradeValues.filter(g => g >= 75).length;
        const failed = gradeValues.filter(g => g < 75).length;

        statsPanel.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${average.toFixed(2)}</div>
                <div class="stat-label">Class Average</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${highest}</div>
                <div class="stat-label">Highest Grade</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${lowest}</div>
                <div class="stat-label">Lowest Grade</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${passed}</div>
                <div class="stat-label">Passed (≥75)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${failed}</div>
                <div class="stat-label">Failed (<75)</div>
            </div>
        `;
    }

    // ============================================
    // UPDATE STATS
    // ============================================

    function updateStats() {
        totalClasses.textContent = assignedClasses.length;
        
        let subjectCount = 0;
        Object.values(teacherSubjects).forEach(subjects => {
            subjectCount += subjects.length;
        });
        totalSubjects.textContent = subjectCount;
        
        totalStudents.textContent = studentsList.length;
        
        let graded = 0;
        studentsList.forEach(student => {
            if (gradesData[student.id]) graded++;
        });
        gradedCount.textContent = graded;
    }

    // ============================================
    // VALIDATE GRADE INPUT
    // ============================================

    window.validateGradeInput = function(input) {
        const value = parseFloat(input.value);
        if (isNaN(value)) {
            input.classList.remove('passing', 'failing');
            return;
        }
        if (value >= 75) {
            input.classList.add('passing');
            input.classList.remove('failing');
        } else {
            input.classList.add('failing');
            input.classList.remove('passing');
        }
    };

    // ============================================
    // SET ALL GRADES
    // ============================================

    window.setAllGrades = function(value) {
        const inputs = document.querySelectorAll('.grade-input');
        inputs.forEach(input => {
            input.value = value;
            window.validateGradeInput(input);
        });
    };

    // ============================================
    // SUBMIT GRADES
    // ============================================

    if (gradeForm) {
        gradeForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const studentIds = document.querySelectorAll('input[name="student_ids[]"]');
            const grades = document.querySelectorAll('input[name="grades[]"]');
            const gradeIds = document.querySelectorAll('input[name="grade_ids[]"]');

            const gradeData = [];
            let hasError = false;

            studentIds.forEach((input, index) => {
                const studentId = input.value;
                const gradeValue = grades[index] ? grades[index].value.trim() : '';
                const gradeId = gradeIds[index] ? gradeIds[index].value : '';

                // Skip empty grades
                if (gradeValue === '') {
                    return;
                }

                const numGrade = parseFloat(gradeValue);
                if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
                    hasError = true;
                    grades[index].classList.add('failing');
                    grades[index].style.borderColor = '#ef4444';
                    return;
                }

                gradeData.push({
                    studentId: studentId,
                    grade: numGrade,
                    gradeId: gradeId
                });
            });

            if (hasError) {
                showAlert('⚠️ Please fix invalid grades (must be 0-100)', 'error');
                return;
            }

            if (gradeData.length === 0) {
                showAlert('⚠️ No grades to save', 'warning');
                return;
            }

            // Disable button
            const submitBtn = document.querySelector('.btn-save');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                let saved = 0;
                for (const data of gradeData) {
                    const gradeRef = collection(db, 'grades');
                    
                    if (data.gradeId) {
                        // Update existing grade
                        await updateDoc(doc(db, 'grades', data.gradeId), {
                            grade: data.grade,
                            teacherId: currentUser.uid,
                            updatedAt: serverTimestamp()
                        });
                    } else {
                        // Insert new grade
                        await addDoc(gradeRef, {
                            studentId: data.studentId,
                            subjectId: selectedSubject.toString(),
                            quarter: selectedQuarter,
                            grade: data.grade,
                            teacherId: currentUser.uid,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                    }
                    saved++;
                }

                showAlert(`✅ Grades saved successfully! (${saved} records)`, 'success');
                
                // Reload grades
                await loadExistingGrades();
                renderGradeTable();
                renderStats();
                updateStats();

            } catch (error) {
                console.error('Error saving grades:', error);
                showAlert('❌ Error saving grades: ' + error.message, 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    }

    // ============================================
    // FILTER FORM SUBMIT
    // ============================================

    if (filterForm) {
        filterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            selectedSection = parseInt(sectionSelect.value);
            selectedSubject = parseInt(subjectSelect.value);
            selectedQuarter = quarterSelect.value;

            if (!selectedSection || !selectedSubject) {
                showAlert('⚠️ Please select both section and subject', 'warning');
                return;
            }

            await loadStudentsAndGrades();
        });
    }

    // ============================================
    // QUARTER SELECT CHANGE - Auto reload
    // ============================================

    if (quarterSelect) {
        quarterSelect.addEventListener('change', function() {
            if (selectedSection && selectedSubject) {
                selectedQuarter = this.value;
                loadStudentsAndGrades();
            }
        });
    }

    // ============================================
    // SET CURRENT DATE
    // ============================================

    const dateBadge = document.querySelector('.date-badge');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

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

    console.log('✅ Grade Management ready!');

})();