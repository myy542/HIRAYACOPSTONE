// ===== PLSNHS STUDENT AVATAR & INITIALS SYNC =====
(function() {
    'use strict';

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

    function syncStudentAvatarAndName() {
        try {
            let studentNameStr = localStorage.getItem('plsnhs_student_name');
            const currentUserStr = localStorage.getItem('currentUser');

            if (currentUserStr) {
                try {
                    const u = JSON.parse(currentUserStr);
                    if (u.role === 'student') {
                        let nameFromSession = (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email ? u.email.split('@')[0] : ''));
                        nameFromSession = sanitizeStudentName(nameFromSession, u.email);
                        
                        if (nameFromSession === 'Student') {
                            u.firstName = 'Student';
                            u.lastName = '';
                            localStorage.setItem('currentUser', JSON.stringify(u));
                        }
                        
                        studentNameStr = nameFromSession;
                        localStorage.setItem('plsnhs_student_name', studentNameStr);
                    }
                } catch(e) {}
            }

            // Clean up stored name
            studentNameStr = sanitizeStudentName(studentNameStr);
            localStorage.setItem('plsnhs_student_name', studentNameStr);

            // Apply name to all student name elements in dashboard and pages
            document.querySelectorAll('.student-name, #studentName, #studentNameHeader').forEach(el => {
                el.textContent = studentNameStr;
            });

            const initials = getStudentInitials(studentNameStr);
            const savedAvatar = localStorage.getItem('plsnhs_student_avatar');

            document.querySelectorAll('.student-avatar').forEach(avatar => {
                if (savedAvatar) {
                    avatar.innerHTML = `
                        <img src="${savedAvatar}" alt="Student" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                        <div class="online-dot"></div>
                    `;
                } else {
                    avatar.innerHTML = `
                        <div class="avatar-initial" id="studentInitial">${initials}</div>
                        <div class="online-dot"></div>
                    `;
                }
            });

            // Update any loose studentInitial element if not inside .student-avatar
            const looseInitial = document.getElementById('studentInitial');
            if (looseInitial && !savedAvatar) {
                looseInitial.textContent = initials;
            }
        } catch(e) {
            console.warn('Student avatar sync error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncStudentAvatarAndName);
    } else {
        syncStudentAvatarAndName();
    }

    window.syncStudentAvatarAndName = syncStudentAvatarAndName;
})();
