/**
 * AdminCouponManager Component
 *
 * Purpose: Section in Admin Dashboard for managing ticket discount coupons.
 * Features:
 *   - Overview metrics (Total, Active, Redemptions)
 *   - Search & filters by code, event, and status
 *   - Responsive table & cards with quick actions: Copy Code, Toggle Status, Delete
 *   - Modal for creating new coupons with event scoping
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useCoupons, useToggleCouponStatus, useDeleteCoupon } from '../../hooks/useCoupons';
import { CreateCouponModal } from './CreateCouponModal';
import { CouponTableRow } from './CouponTableRow';

export const AdminCouponManager = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: events = [] } = useEvents();
  const { data: coupons = [], isLoading } = useCoupons();

  const toggleStatusMutation = useToggleCouponStatus();
  const deleteCouponMutation = useDeleteCoupon();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Quick stats
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.is_active).length;
    const uses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
    return { total, active, uses };
  }, [coupons]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toUpperCase().trim();
        if (!coupon.code.includes(q)) return false;
      }
      if (statusFilter === 'active' && !coupon.is_active) return false;
      if (statusFilter === 'inactive' && coupon.is_active) return false;
      if (statusFilter === 'expired') {
        const isExp = coupon.expires_at && new Date(coupon.expires_at) <= new Date();
        if (!isExp) return false;
      }
      if (eventFilter !== 'all') {
        const isGlobal = coupon.event_id === null && (!coupon.event_ids || coupon.event_ids.length === 0);
        if (eventFilter === 'global' && !isGlobal) return false;
        if (eventFilter !== 'global') {
          const matchSingle = coupon.event_id === eventFilter;
          const matchMulti = Array.isArray(coupon.event_ids) && coupon.event_ids.includes(eventFilter);
          if (!matchSingle && !matchMulti) return false;
        }
      }
      return true;
    });
  }, [coupons, searchTerm, statusFilter, eventFilter]);

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (coupon) => {
    const confirmMsg = t('admin.coupons.deleteConfirm', { code: coupon.code });
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteCouponMutation.mutateAsync(coupon.id);
    } catch (err) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-sans text-foreground">
              {t('admin.coupons.title', 'Discount Coupons & Promo Codes')}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="w-3 h-3" />
              {t('admin.coupons.badge', 'Ticket Promotions')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('admin.coupons.subtitle', 'Create and manage percentage discount codes for specific events or global ticket sales.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.coupons.createNew', 'Create Coupon')}</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border bg-secondary/5">
        <div className="p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-semibold uppercase">{t('admin.coupons.totalCoupons', 'Total Coupons')}</span>
          <span className="text-xl font-bold text-foreground font-mono">{stats.total}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-semibold uppercase">{t('admin.coupons.activeCoupons', 'Active Codes')}</span>
          <span className="text-xl font-bold text-emerald-500 font-mono">{stats.active}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-semibold uppercase">{t('admin.coupons.totalUses', 'Redemptions')}</span>
          <span className="text-xl font-bold text-primary font-mono">{stats.uses}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-3 bg-card">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.coupons.searchPlaceholder', 'Search by coupon code...')}
            className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">{t('admin.coupons.filterAll', 'All Statuses')}</option>
          <option value="active">{t('admin.coupons.filterActive', 'Active')}</option>
          <option value="inactive">{t('admin.coupons.filterInactive', 'Inactive')}</option>
          <option value="expired">{t('admin.coupons.filterExpired', 'Expired')}</option>
        </select>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="w-full sm:w-auto bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">{t('admin.coupons.filterAllEvents', 'All Events')}</option>
          <option value="global">🌟 Global (All Events)</option>
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              🎟️ {isAr && evt.title_ar ? evt.title_ar : evt.title_en}
            </option>
          ))}
        </select>
      </div>

      {/* Coupons Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs">Loading coupons...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">{t('admin.coupons.emptyTitle', 'No Coupons Found')}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">{t('admin.coupons.emptySubtitle', 'Create your first coupon to offer ticket discounts.')}</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-muted-foreground border-collapse">
            <thead className="bg-secondary/15 text-foreground uppercase tracking-wider font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{t('admin.coupons.colCode', 'Code')}</th>
                <th className="px-4 py-3">{t('admin.coupons.colDiscount', 'Discount')}</th>
                <th className="px-4 py-3">{t('admin.coupons.colEvent', 'Applies To')}</th>
                <th className="px-4 py-3">{t('admin.coupons.colUsage', 'Usage')}</th>
                <th className="px-4 py-3">{t('admin.coupons.colExpiry', 'Expires')}</th>
                <th className="px-4 py-3 text-center">{t('admin.coupons.colStatus', 'Status')}</th>
                <th className="px-4 py-3 text-right">{t('admin.coupons.colActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoupons.map((coupon) => (
                <CouponTableRow
                  key={coupon.id}
                  coupon={coupon}
                  isAr={isAr}
                  copiedId={copiedId}
                  onCopy={handleCopyCode}
                  onToggleStatus={(id, isActive) => toggleStatusMutation.mutate({ id, isActive })}
                  onDelete={handleDelete}
                  isTogglePending={toggleStatusMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateCouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        events={events}
      />
    </div>
  );
};

export default AdminCouponManager;
