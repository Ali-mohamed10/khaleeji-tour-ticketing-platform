import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  QrCode,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react';
import { useUsers, useUpdateUserRole, useUpdateUserStatus } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';

export const UsersTable = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user: currentAuthUser } = useAuth();

  const { data: users, isLoading, isError, refetch } = useUsers();
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const name = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [users, roleFilter, searchTerm]);

  // Role change handler
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentAuthUser?.id && newRole !== 'admin') {
      const confirmChange = window.confirm(
        t('admin.users.confirmSelfDemote', 'Warning: Demoting yourself from admin will immediately revoke your dashboard access. Are you sure?')
      );
      if (!confirmChange) return;
    }

    try {
      setUpdatingUserId(userId);
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      setUpdatingUserId(user.id);
      await updateStatusMutation.mutateAsync({ userId: user.id, status: nextStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('admin.roles.admin', 'Admin')}
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
            <Shield className="w-3.5 h-3.5" />
            {t('admin.roles.editor', 'Editor')}
          </span>
        );
      case 'gate_staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <QrCode className="w-3.5 h-3.5" />
            {t('admin.roles.gateStaff', 'Gate Staff')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            {t('admin.roles.customer', 'Customer')}
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      {/* Header & Filters */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-foreground">
                {t('admin.users.title', 'Registered Users')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('admin.users.subtitle', 'Manage registered accounts, grant staff access, and control roles.')}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border self-start sm:self-auto">
            {t('admin.users.totalCount', 'Total Users: {{count}}', { count: users?.length || 0 })}
          </div>
        </div>

        {/* Search & Role Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder', 'Search by name, email, or phone...')}
              className={`w-full bg-background border border-border rounded-xl py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
              }`}
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex gap-1 bg-secondary/20 p-1 rounded-xl border border-border overflow-x-auto shrink-0">
            {['all', 'admin', 'editor', 'gate_staff', 'customer'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === role
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {role === 'all' && t('admin.users.filterAll', 'All')}
                {role === 'admin' && t('admin.roles.admin', 'Admins')}
                {role === 'editor' && t('admin.roles.editor', 'Editors')}
                {role === 'gate_staff' && t('admin.roles.gateStaff', 'Gate Staff')}
                {role === 'customer' && t('admin.roles.customer', 'Customers')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">{t('common.loading', 'Loading users...')}</span>
          </div>
        ) : isError ? (
          <div className="py-12 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{t('admin.users.errorLoading', 'Failed to load registered users.')}</p>
            <button
              onClick={() => refetch()}
              className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground hover:bg-secondary/80 transition-colors"
            >
              {t('common.tryAgain', 'Try Again')}
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {searchTerm || roleFilter !== 'all'
              ? t('admin.users.noMatches', 'No users match the search criteria.')
              : t('admin.users.noUsers', 'No registered users found.')}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/15 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.users.colUser', 'User')}</th>
                <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.users.colPhone', 'Phone')}</th>
                <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.users.colRole', 'Role / Permissions')}</th>
                <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.users.colStatus', 'Status')}</th>
                <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{t('admin.users.colJoined', 'Joined Date')}</th>
                <th className={`py-3.5 px-4 ${isAr ? 'text-left' : 'text-right'}`}>{t('admin.users.colActions', 'Change Role')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentAuthUser?.id;
                const isRowUpdating = updatingUserId === u.id;
                const initials = (u.full_name || u.email || 'U').charAt(0).toUpperCase();

                const joinedDate = u.created_at
                  ? new Date(u.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A';

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-secondary/10 transition-colors group"
                  >
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center shrink-0 border border-border">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate max-w-48 block">
                              {u.full_name || 'Anonymous User'}
                            </span>
                            {isSelf && (
                              <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.2 rounded">
                                {t('admin.users.youBadge', 'You')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4">
                      {u.phone ? (
                        <a
                          href={`tel:${u.phone}`}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground hover:text-primary transition-colors"
                          dir="ltr"
                        >
                          <Phone className="w-3 h-3 text-primary/70 shrink-0" />
                          <span>{u.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={isRowUpdating || isSelf}
                        title={t('admin.users.toggleStatusTooltip', 'Click to toggle status')}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer disabled:cursor-default disabled:opacity-80 ${
                          u.status === 'suspended'
                            ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25'
                            : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25'
                        }`}
                      >
                        {u.status === 'suspended' ? (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>{t('admin.users.statusSuspended', 'Suspended')}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>{t('admin.users.statusActive', 'Active')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <span>{joinedDate}</span>
                      </div>
                    </td>

                    {/* Actions: Role Selector Dropdown */}
                    <td className={`py-3 px-4 ${isAr ? 'text-left' : 'text-right'}`}>
                      <div className="inline-flex items-center gap-2">
                        {isRowUpdating ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <select
                            value={u.role || 'customer'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isRowUpdating}
                            className="bg-background border border-border hover:border-primary/50 text-foreground text-xs font-semibold py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors cursor-pointer"
                          >
                            <option value="customer">{t('admin.roles.customer', 'Customer')}</option>
                            <option value="gate_staff">{t('admin.roles.gateStaff', 'Gate Staff (Scanner Only)')}</option>
                            <option value="editor">{t('admin.roles.editor', 'Editor (Events & Maps)')}</option>
                            <option value="admin">{t('admin.roles.admin', 'Admin (Full Access)')}</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersTable;
