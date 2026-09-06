// ===== ACCOUNTS JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const alertContainer = document.getElementById('alertContainer');
    const filterForm = document.getElementById('filterForm');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const usersTableBody = document.getElementById('usersTableBody');
    const pendingTableBody = document.getElementById('pendingTableBody');

    // Modal Elements
    const rejectModal = document.getElementById('rejectModal');
    const rejectForm = document.getElementById('rejectForm');
    const rejectUserId = document.getElementById('rejectUserId');
    const rejectUserName = document.getElementById('rejectUserName');
    const rejectionReason = document.getElementById('rejectionReason');

    // ===== DATA =====

    // Sample user data
    let users = [
        { id: 1, id_number: 'PLSNHS-ADM-00001', fullname: 'Admin User', email: 'admin@plshs.edu.ph', role: 'Admin', status: 'approved', created_at: '2026-01-01 08:00:00', rejection_reason: null },
        { id: 2, id_number: 'PLSNHS-TCH-000001', fullname: 'Maria Santos', email: 'maria.santos@plshs.edu.ph', role: 'Teacher', status: 'pending', created_at: '2026-06-20 10:30:00', rejection_reason: null },
        { id: 3, id_number: 'PLSNHS-STU-000001', fullname: 'Juan Dela Cruz', email: 'juan.dela@plshs.edu.ph', role: 'Student', status: 'approved', created_at: '2026-06-15 14:20:00', rejection_reason: null },
        { id: 4, id_number: null, fullname: 'Ana Reyes', email: 'ana.reyes@plshs.edu.ph', role: 'Teacher', status: 'pending', created_at: '2026-06-22 09:00:00', rejection_reason: null },
        { id: 5, id_number: 'PLSNHS-RGR-00001', fullname: 'Registrar User', email: 'registrar@plshs.edu.ph', role: 'Registrar', status: 'approved', created_at: '2026-06-10 11:00:00', rejection_reason: null },
        { id: 6, id_number: 'PLSNHS-STU-000002', fullname: 'Carlos Mendoza', email: 'carlos.m@plshs.edu.ph', role: 'Student', status: 'rejected', created_at: '2026-06-18 16:00:00', rejection_reason: 'Incomplete requirements' },
        { id: 7, id_number: null, fullname: 'Elena Garcia', email: 'elena.g@plshs.edu.ph', role: 'Teacher', status: 'pending', created_at: '2026-06-23 08:30:00', rejection_reason: null }
    ];

    // Current user ID (logged in)
    const currentUserId = 1;

    // ===== FUNCTIONS =====

    // Update statistics
    function updateStats() {
        const total = users.filter(u => u.status === 'approved').length;
        const pending = users.filter(u => u.status === 'pending').length;
        const approved = users.filter(u => u.status === 'approved').length;
        const rejected = users.filter(u => u.status === 'rejected').length;

        document.getElementById('totalUsers').textContent = total;
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;
        document.getElementById('pendingBadge').innerHTML = `<i class="fas fa-users"></i> ${pending} pending`;
    }

    // Get role color
    function getRoleColor(role) {
        switch(role.toLowerCase()) {
            case 'admin': return '#dc3545';
            case 'registrar': return '#fd7e14';
            case 'teacher': return '#28a745';
            case 'student': return '#007bff';
            default: return '#6c757d';
        }
    }

    // Render pending users
    function renderPendingUsers() {
        const pendingUsers = users.filter(u => u.status === 'pending');
        const section = document.getElementById('pendingSection');

        if (pendingUsers.length === 0) {
            pendingTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="no-pending">
                            <i class="fas fa-check-circle"></i>
                            <p>No pending approvals at the moment.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        pendingUsers.forEach(user => {
            const roleColor = getRoleColor(user.role);
            html += `
                <tr>
                    <td><span class="id-badge">${user.id_number || 'N/A'}</span></td>
                    <td><strong>${user.fullname}</strong></td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge ${user.role.toLowerCase()}" style="background: ${roleColor} !important;">
                            ${user.role}
                        </span>
                    </td>
                    <td><i class="far fa-calendar"></i> ${formatDate(user.created_at)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-approve" onclick="approveUser(${user.id})"><i class="fas fa-check"></i> Approve</button>
                            <button class="btn-reject" onclick="openRejectModal(${user.id}, '${user.fullname}')"><i class="fas fa-times"></i> Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        pendingTableBody.innerHTML = html;
    }

    // Render all users
    function renderUsers() {
        const search = searchInput.value.toLowerCase().trim();
        const role = roleFilter.value;
        const status = statusFilter.value;

        let filtered = [...users];

        if (search) {
            filtered = filtered.filter(u => 
                u.fullname.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search) ||
                (u.id_number && u.id_number.toLowerCase().includes(search))
            );
        }
        if (role) {
            filtered = filtered.filter(u => u.role === role);
        }
        if (status) {
            filtered = filtered.filter(u => u.status === status);
        }

        if (filtered.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="no-data">
                            <i class="fas fa-users"></i>
                            <h3>No Users Found</h3>
                            <p>No user accounts match your search criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(user => {
            const roleColor = getRoleColor(user.role);
            const statusClass = `status-${user.status}`;
            
            html += `
                <tr>
                    <td><span class="id-badge">${user.id_number || 'N/A'}</span></td>
                    <td><strong>${user.fullname}</strong></td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge ${user.role.toLowerCase()}" style="background: ${roleColor} !important;">
                            ${user.role}
                        </span>
                    </td>
                    <td><span class="status-badge ${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
                    <td><span class="activity-time"><i class="far fa-calendar"></i> ${formatDate(user.created_at)}</span></td>
                    <td>
                        <div class="action-btns">
                            <a href="view_account.html?id=${user.id}" class="btn-view" title="View"><i class="fas fa-eye"></i></a>
                            ${user.status === 'pending' ? `
                                <button class="btn-approve" onclick="approveUser(${user.id})"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn-reject" onclick="openRejectModal(${user.id}, '${user.fullname}')"><i class="fas fa-times"></i> Reject</button>
                            ` : ''}
                            ${user.role !== 'Admin' ? `<a href="edit_account.html?id=${user.id}" class="btn-edit" title="Edit"><i class="fas fa-edit"></i></a>` : ''}
                            ${user.id !== currentUserId ? `<button class="btn-delete" onclick="deleteUser(${user.id})" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </td>
                </tr>
                ${user.rejection_reason ? `
                    <tr class="rejection-row">
                        <td colspan="7">
                            <div class="rejection-reason">
                                <i class="fas fa-exclamation-triangle"></i> 
                                <strong>Rejection Reason:</strong> ${user.rejection_reason}
                            </div>
                        </td>
                    </tr>
                ` : ''}
            `;
        });

        usersTableBody.innerHTML = html;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Approve user
    window.approveUser = function(id) {
        const user = users.find(u => u.id === id);
        if (!user) return;

        if (confirm(`Approve ${user.fullname}?`)) {
            user.status = 'approved';
            showAlert(`✅ ${user.fullname} approved successfully!`, 'success');
            updateStats();
            renderPendingUsers();
            renderUsers();
        }
    };

    // Open reject modal
    window.openRejectModal = function(id, name) {
        rejectUserId.value = id;
        rejectUserName.textContent = name;
        rejectionReason.value = '';
        rejectModal.classList.add('active');
    };

    // Close reject modal
    window.closeRejectModal = function() {
        rejectModal.classList.remove('active');
    };

    // Delete user
    window.deleteUser = function(id) {
        const user = users.find(u => u.id === id);
        if (!user) return;

        if (id === currentUserId) {
            showAlert('You cannot delete your own account!', 'error');
            return;
        }

        // Check if user has related records (simulated)
        const hasRelated = false; // In real app, check for enrollments, sections, etc.

        if (hasRelated) {
            showAlert('Cannot delete user because they have related records.', 'error');
            return;
        }

        if (confirm(`Delete ${user.fullname}?`)) {
            users = users.filter(u => u.id !== id);
            showAlert(`✅ ${user.fullname} deleted successfully!`, 'success');
            updateStats();
            renderPendingUsers();
            renderUsers();
        }
    };

    // Reset filters
    window.resetFilters = function() {
        searchInput.value = '';
        roleFilter.value = '';
        statusFilter.value = '';
        renderUsers();
    };

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

    // ===== EVENT LISTENERS =====

    // Filter form
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderUsers();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderUsers();
        });
    }

    // Role filter
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            renderUsers();
        });
    }

    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            renderUsers();
        });
    }

    // Reject form
    if (rejectForm) {
        rejectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(rejectUserId.value);
            const user = users.find(u => u.id === id);
            const reason = rejectionReason.value.trim();

            if (user) {
                user.status = 'rejected';
                user.rejection_reason = reason || 'No reason provided';
                showAlert(`✅ ${user.fullname} rejected successfully!`, 'success');
                closeRejectModal();
                updateStats();
                renderPendingUsers();
                renderUsers();
            }
        });
    }

    // Close modal on outside click
    document.addEventListener('click', function(e) {
        if (e.target === rejectModal) {
            closeRejectModal();
        }
    });

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
    renderPendingUsers();
    renderUsers();
});