// ===== HES PARENT AVATAR & INITIALS SYNC =====
(function() {
    'use strict';

    function getParentInitials(name) {
        if (!name || typeof name !== 'string') return 'P';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function syncParentAvatarAndName() {
        try {
            let parentNameStr = localStorage.getItem('hes_parent_name');
            const currentUserStr = localStorage.getItem('currentUser');

            if (currentUserStr) {
                try {
                    const u = JSON.parse(currentUserStr);
                    if (u.role === 'parent') {
                        let nameFromSession = (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email ? u.email.split('@')[0] : ''));
                        if (nameFromSession && nameFromSession.toLowerCase() !== 'parent') {
                            parentNameStr = nameFromSession;
                        } else if (!parentNameStr) {
                            parentNameStr = 'Parent';
                        }
                    }
                } catch(e) {}
            }

            const name = parentNameStr || 'Parent';

            // Apply name to all parent name elements in dashboard and pages
            document.querySelectorAll('.parent-name, #parentName, #profileName').forEach(el => {
                el.textContent = name;
            });

            const initials = getParentInitials(name);
            const savedAvatar = localStorage.getItem('hes_parent_avatar');

            document.querySelectorAll('.parent-avatar').forEach(avatar => {
                if (savedAvatar) {
                    avatar.innerHTML = `
                        <img src="${savedAvatar}" alt="Parent" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                        <div class="online-dot"></div>
                    `;
                } else {
                    avatar.innerHTML = `
                        <div class="avatar-initial">${initials}</div>
                        <div class="online-dot"></div>
                    `;
                }
            });

            // Large avatar on profile page
            document.querySelectorAll('.profile-avatar-large .avatar-initial').forEach(el => {
                el.textContent = initials;
            });

            // Child Name Sync in Sidebar
            let childNameStr = localStorage.getItem('hes_parent_child_name');
            if (childNameStr) {
                document.querySelectorAll('#sidebarChildName, .sidebar-child-name, #sidebarChildBadge span').forEach(el => {
                    el.textContent = childNameStr;
                });
            }
        } catch(e) {
            console.warn('Parent avatar sync error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncParentAvatarAndName);
    } else {
        syncParentAvatarAndName();
    }

    window.syncParentAvatarAndName = syncParentAvatarAndName;
})();
