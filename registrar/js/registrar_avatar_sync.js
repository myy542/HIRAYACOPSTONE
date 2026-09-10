// ===== PLSNHS REGISTRAR AVATAR & INITIALS SYNC =====
(function() {
    function getRegistrarInitials(name) {
        if (!name || typeof name !== 'string') return 'R';
        const cleanName = name.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|engr\.?|atty\.?)\s+/i, '').trim();
        const words = cleanName.split(/[\s,&-]+/).filter(w => w.length > 0 && !['and', 'the', 'of', '&'].includes(w.toLowerCase()));
        if (words.length === 0) return name.charAt(0).toUpperCase();
        if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    function syncRegistrarAvatarAndName() {
        try {
            const savedName = localStorage.getItem('plsnhs_registrar_name');
            const savedAvatar = localStorage.getItem('plsnhs_registrar_avatar');

            if (savedName) {
                document.querySelectorAll('.admin-name, #adminName').forEach(el => {
                    el.textContent = savedName.split(' ')[0];
                });
            }

            const name = savedName || (document.getElementById('adminName') ? document.getElementById('adminName').textContent : 'Registrar');
            const initials = getRegistrarInitials(name);

            document.querySelectorAll('.admin-avatar').forEach(avatar => {
                if (savedAvatar) {
                    avatar.innerHTML = `
                        <img src="${savedAvatar}" alt="Registrar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
                        <div class="online-dot"></div>
                    `;
                } else {
                    avatar.innerHTML = `
                        <div class="avatar-initial" id="adminInitial">${initials}</div>
                        <div class="online-dot"></div>
                    `;
                }
            });
        } catch(e) {
            console.warn('Registrar avatar sync error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncRegistrarAvatarAndName);
    } else {
        syncRegistrarAvatarAndName();
    }

    window.syncRegistrarAvatarAndName = syncRegistrarAvatarAndName;
})();
