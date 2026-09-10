// ===== PLSNHS ADMIN AVATAR & INITIALS SYNC =====
(function() {
    function getAdminInitials(name) {
        if (!name || typeof name !== 'string') return 'J';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|engr\.?|atty\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return 'J';
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function syncAdminAvatarAndName() {
        try {
            let savedName = localStorage.getItem('plsnhs_admin_name');
            const savedAvatar = localStorage.getItem('plsnhs_admin_avatar');

            if (!savedName || savedName.toLowerCase().includes('mylene') || savedName.toLowerCase() === 'student' || savedName.toLowerCase() === 'admin') {
                savedName = 'Justine';
                localStorage.setItem('plsnhs_admin_name', 'Justine');
            }

            document.querySelectorAll('.admin-name').forEach(el => {
                el.textContent = savedName;
            });

            const name = savedName || 'Justine';
            const initials = getAdminInitials(name);

            document.querySelectorAll('.admin-avatar').forEach(avatar => {
                if (savedAvatar) {
                    avatar.innerHTML = `
                        <img src="${savedAvatar}" alt="Admin" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                        <div class="online-dot"></div>
                    `;
                } else {
                    avatar.innerHTML = `
                        <div class="avatar-initial" id="adminAvatar">${initials}</div>
                        <div class="online-dot"></div>
                    `;
                }
            });
        } catch(e) {
            console.warn('Admin avatar sync error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncAdminAvatarAndName);
    } else {
        syncAdminAvatarAndName();
    }

    // Expose for immediate re-sync
    window.syncAdminAvatarAndName = syncAdminAvatarAndName;
})();
