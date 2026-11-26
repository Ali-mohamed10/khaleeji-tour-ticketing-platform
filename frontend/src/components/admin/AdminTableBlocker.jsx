/**
 * AdminTableBlocker Component
 *
 * Purpose: Allows admins to quickly block (mark as sold/booked) or unblock (make available)
 *          individual tables and seats for any event directly from the dashboard.
 *
 * Features:
 *  - Event selector
 *  - Real-time table capacity & occupancy metrics
 *  - Search and filter by category or availability status
 *  - 1-click Quick Block / Unblock buttons per table
 *  - Custom seat stepper to block partial capacity
 *  - Bulk select and block/unblock operations
 */
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Armchair,
  Search,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Calendar,
  Layers,
  Lock,
  Unlock,
  Loader2,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Undo2,
  X,
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import {
  useAdminTables,
  useSetTableBlockStatus,
  useBulkSetBlockStatus,
  useResetEventBlocks,
} from '../../hooks/useAdminTables';
import { TABLE_CATEGORIES } from '../../utils/seatMapConstants';

export const AdminTableBlocker = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // 1. Fetch all events
  const { data: events, isLoading: isEventsLoading } = useEvents();

  // Selected event state
  const [selectedEventId, setSelectedEventId] = useState('');

  // Auto-select first event with seat_map_id
  useEffect(() => {
    if (!selectedEventId && events && events.length > 0) {
      const eventWithMap = events.find((e) => e.seat_map_id) || events[0];
      if (eventWithMap) {
        setSelectedEventId(eventWithMap.id);
      }
    }
  }, [events, selectedEventId]);

  // Current selected event object
  const currentEvent = useMemo(() => {
    return (events || []).find((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const seatMapId = currentEvent?.seat_map_id;

  // 2. Fetch tables for the selected event's seat map
  const {
    data: tables = [],
    isLoading: isTablesLoading,
  } = useAdminTables(seatMapId);

  // Mutations
  const setBlockMutation = useSetTableBlockStatus(seatMapId);
  const bulkBlockMutation = useBulkSetBlockStatus(seatMapId);
  const resetBlocksMutation = useResetEventBlocks(seatMapId);

  // UI Filters & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const showNotification = (msg) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  // Helper for category label & color
  const getCategoryMeta = (catKey) => {
    const key = (catKey || '').toLowerCase();
    const config = TABLE_CATEGORIES[key] || TABLE_CATEGORIES.standard || { color: '#94A3B8', label: 'Standard' };
    const label = t(config.label, catKey || 'Standard');
    return { ...config, label };
  };

  // Filtered tables
  const filteredTables = useMemo(() => {
    return (tables || []).filter((table) => {
      // 1. Search term (table_code or svg_element_id)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const code = (table.table_code || '').toLowerCase();
        const svgId = (table.svg_element_id || '').toLowerCase();
        if (!code.includes(query) && !svgId.includes(query)) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter !== 'all') {
        const cat = (table.category || '').toLowerCase();
        if (categoryFilter === 'vip_room' && cat !== 'vip_room') return false;
        if (categoryFilter === 'vip_premium' && !['vip_premium', 'gold'].includes(cat)) return false;
        if (categoryFilter === 'vip_standard' && !['vip_standard', 'vip'].includes(cat)) return false;
        if (categoryFilter === 'general' && !['general', 'standard', 'silver'].includes(cat)) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all') {
        const booked = Number(table.booked_seats) || 0;
        const cap = Number(table.capacity) || 1;
        const isFull = booked >= cap || table.status === 'sold';
        const isPartial = booked > 0 && booked < cap;

        if (statusFilter === 'available' && (isFull || isPartial)) return false;
        if (statusFilter === 'partial' && !isPartial) return false;
        if (statusFilter === 'blocked' && !isFull) return false;
      }

      return true;
    });
  }, [tables, searchTerm, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalTables = tables.length;
    let totalCapacity = 0;
    let totalBookedSeats = 0;
    let availableCount = 0;
    let partialCount = 0;
    let blockedCount = 0;

    tables.forEach((t) => {
      const cap = Number(t.capacity) || 0;
      const booked = Number(t.booked_seats) || 0;
      totalCapacity += cap;
      totalBookedSeats += Math.min(cap, booked);

      if (booked >= cap || t.status === 'sold') {
        blockedCount++;
      } else if (booked > 0) {
        partialCount++;
      } else {
        availableCount++;
      }
    });

    return {
      totalTables,
      totalCapacity,
      totalBookedSeats,
      availableCount,
      partialCount,
      blockedCount,
      remainingSeats: Math.max(0, totalCapacity - totalBookedSeats),
    };
  }, [tables]);

  // Handlers
  const handleSingleToggleBlock = async (table) => {
    const isCurrentlyBlocked = (table.booked_seats >= table.capacity) || table.status === 'sold';
    try {
      await setBlockMutation.mutateAsync({
        tableId: table.id,
        isBlocked: !isCurrentlyBlocked,
      });
      showNotification(
        !isCurrentlyBlocked
          ? (isAr ? `تم تعطيل/حجب الطاولة ${table.svg_element_id || table.table_code} بنجاح` : `Table ${table.svg_element_id || table.table_code} blocked successfully`)
          : (isAr ? `تمت إتاحة الطاولة ${table.svg_element_id || table.table_code} للجمهور` : `Table ${table.svg_element_id || table.table_code} released to available`)
      );
    } catch (err) {
      console.error('Error toggling table status:', err);
    }
  };

  const handleCustomSeatsChange = async (table, newSeats) => {
    const seats = Math.max(0, Math.min(table.capacity, newSeats));
    try {
      await setBlockMutation.mutateAsync({
        tableId: table.id,
        isBlocked: seats > 0,
        customSeats: seats,
      });
      showNotification(
        isAr
          ? `تم تحديث مقاعد الطاولة ${table.svg_element_id || table.table_code}: ${seats}/${table.capacity}`
          : `Updated Table ${table.svg_element_id || table.table_code}: ${seats}/${table.capacity} seats`
      );
    } catch (err) {
      console.error('Error updating custom seats:', err);
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedTableIds.length === filteredTables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(filteredTables.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (tableId) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleBulkAction = async (isBlocked) => {
    if (!selectedTableIds.length) return;
    try {
      await bulkBlockMutation.mutateAsync({
        tableIds: selectedTableIds,
        isBlocked,
      });
      showNotification(
        isBlocked
          ? (isAr ? `تم تعطيل ${selectedTableIds.length} طاولة بنجاح` : `Successfully blocked ${selectedTableIds.length} tables`)
          : (isAr ? `تمت إتاحة ${selectedTableIds.length} طاولة بنجاح` : `Successfully unblocked ${selectedTableIds.length} tables`)
      );
      setSelectedTableIds([]);
    } catch (err) {
      console.error('Error in bulk table update:', err);
    }
  };

  const handleConfirmReset = async () => {
    if (!seatMapId) return;
    try {
      await resetBlocksMutation.mutateAsync(seatMapId);
      setShowResetModal(false);
      showNotification(
        isAr
          ? 'تم إلغاء التعديلات اليدوية واستعادة الحالة الطبيعية لجميع المقاعد والحجوزات الفعلية بنجاح'
          : 'Successfully reset manual changes and restored actual booking states'
      );
    } catch (err) {
      console.error('Error resetting event blocks:', err);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showResetModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showResetModal]);

  const isMutating = setBlockMutation.isPending || bulkBlockMutation.isPending || resetBlocksMutation.isPending;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-0 relative">
      {/* Reset Confirmation Modal mounted directly to document.body */}
      {showResetModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#1C1613] text-[#F7F1E8] border border-primary/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative z-[100000] animate-scale-up border-t-2 border-t-amber-500">
              {/* Close X Button */}
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-secondary/40 cursor-pointer`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon Glowing Badge */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <AlertTriangle className="w-7 h-7" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-sans text-foreground">
                  {t('admin.tableBlocker.resetModalTitle', 'استعادة الحالة الطبيعية للمقاعد؟')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    'admin.tableBlocker.resetModalDesc',
                    'سيتم إلغاء جميع التعديلات والحجوبات اليدوية التي قمت بها، وإرجاع المقاعد إلى وضعها الطبيعي.'
                  )}
                </p>
              </div>

              {/* Protection Notice Box */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5 text-start">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                <span className="leading-snug">
                  {t(
                    'admin.tableBlocker.paidProtectedNote',
                    'جميع الحجوزات المدفوعة للعملاء (PAID) ستظل محفوظة ومحمية 100% ولن تتأثر نهائياً.'
                  )}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-secondary/60 hover:bg-secondary text-foreground border border-border transition-colors cursor-pointer"
                >
                  {t('admin.tableBlocker.cancelBtn', 'إلغاء')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={resetBlocksMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {resetBlocksMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>{t('admin.tableBlocker.confirmResetBtn', 'تأكيد الاستعادة')}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 1. Header with Event Selector & Title */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap mb-1.5 items-center gap-2">
                <h2 className="text-lg font-bold font-sans text-foreground">
                  {t('admin.tableBlocker.title', 'Seat & Table Availability Control')}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  {t('admin.tableBlocker.badge', 'Live Seat Blocker')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'admin.tableBlocker.subtitle',
                  'Block or release specific tables and seats for VIPs, offline reservations, or organizers without creating payments.'
                )}
              </p>
            </div>
          </div>

          {/* Event Picker Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative min-w-[240px] sm:min-w-[300px]">
              <Calendar className={`w-4 h-4 text-primary absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'} pointer-events-none`} />
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedTableIds([]);
                }}
                disabled={isEventsLoading}
                className={`w-full bg-background border border-border rounded-xl py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              >
                {isEventsLoading ? (
                  <option value="">{t('common.loading', 'Loading events...')}</option>
                ) : (events || []).length === 0 ? (
                  <option value="">{t('admin.bookingsReport.noEvents', 'No events found')}</option>
                ) : (
                  (events || []).map((evt) => {
                    const title = isAr ? evt.title_ar || evt.title_en : evt.title_en || evt.title_ar;
                    const dateStr = evt.start_date
                      ? new Date(evt.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '';
                    return (
                      <option key={evt.id} value={evt.id}>
                        {title} {dateStr ? `(${dateStr})` : ''} {!evt.seat_map_id ? '⚠️ [No Seat Map]' : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Action Toast / Success Banner */}
        {actionSuccessMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* 2. Numeric Statistics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Total Tables */}
          <div className="p-3 rounded-xl bg-secondary/15 border border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {t('admin.tableBlocker.totalTables', 'Total Tables')}
              </span>
              <span className="text-lg font-bold font-sans text-foreground">
                {stats.totalTables}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Available Tables */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                {t('admin.tableBlocker.availableTables', 'Fully Available')}
              </span>
              <span className="text-lg font-bold font-sans text-emerald-500">
                {stats.availableCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Unlock className="w-4 h-4" />
            </div>
          </div>

          {/* Partially Booked */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 block">
                {t('admin.tableBlocker.partialTables', 'Partially Booked')}
              </span>
              <span className="text-lg font-bold font-sans text-amber-500">
                {stats.partialCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          {/* Blocked / Sold */}
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-500 block">
                {t('admin.tableBlocker.blockedTables', 'Blocked / Sold')}
              </span>
              <span className="text-lg font-bold font-sans text-red-500">
                {stats.blockedCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. Search and Filters Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Search Table Code */}
          <div className="relative flex-1 max-w-sm">
            <Search className={`w-3.5 h-3.5 text-muted-foreground absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.tableBlocker.searchPlaceholder', 'Search table # (e.g. 1, 19, VIP)...')}
              className={`w-full bg-background border border-border rounded-xl py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Category & Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">{t('admin.tableBlocker.allCategories', 'All Categories')}</option>
              <option value="vip_room">{t('seatMap.vipRoom', 'VIP Room')}</option>
              <option value="vip_premium">{t('seatMap.vipPremium', 'VIP Premium')}</option>
              <option value="vip_standard">{t('seatMap.vipStandard', 'VIP Standard')}</option>
              <option value="general">{t('seatMap.general', 'General')}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">{t('admin.tableBlocker.allStatuses', 'All Statuses')}</option>
              <option value="available">{t('seatMap.available', 'Available')}</option>
              <option value="partial">{t('admin.tableBlocker.partial', 'Partially Booked')}</option>
              <option value="blocked">{t('seatMap.sold', 'Blocked / Sold')}</option>
            </select>

            {/* Reset All Manual Changes Button */}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={isMutating || !seatMapId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-amber-500/40"
              title={t('admin.tableBlocker.resetAllTooltip', 'إلغاء التعديلات اليدوية وإرجاع حالة المقاعد للحجوزات الحقيقية فقط')}
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('admin.tableBlocker.resetAllBtn', 'استعادة الحجوزات الفعلية')}</span>
            </button>

            {/* Bulk Actions Trigger */}
            {selectedTableIds.length > 0 && (
              <div className="flex items-center gap-1.5 animate-fade-in bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-lg">
                <span className="text-[11px] font-bold text-primary">
                  {selectedTableIds.length} {t('admin.tableBlocker.selected', 'selected')}
                </span>
                <button
                  onClick={() => handleBulkAction(true)}
                  disabled={isMutating}
                  className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {t('admin.tableBlocker.blockAll', 'Block All')}
                </button>
                <button
                  onClick={() => handleBulkAction(false)}
                  disabled={isMutating}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {t('admin.tableBlocker.unblockAll', 'Unblock All')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tables Grid / List */}
      <div className="p-4 sm:p-5">
        {!seatMapId ? (
          <div className="py-12 text-center space-y-2 bg-secondary/10 rounded-xl border border-dashed border-border">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
            <p className="text-sm font-bold text-foreground">
              {t('admin.tableBlocker.noSeatMapTitle', 'No Seat Map Attached to this Event')}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t(
                'admin.tableBlocker.noSeatMapDesc',
                'Please attach a seat map to this event from the Events Editor to manage interactive seat blocking.'
              )}
            </p>
          </div>
        ) : isTablesLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">
              {t('admin.tableBlocker.loadingTables', 'Loading interactive venue tables...')}
            </span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
            {t('admin.tableBlocker.noMatchingTables', 'No tables match the current filter or search criteria.')}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header select-all bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors cursor-pointer"
              >
                {selectedTableIds.length === filteredTables.length ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>
                  {selectedTableIds.length === filteredTables.length
                    ? t('admin.tableBlocker.deselectAll', 'Deselect All')
                    : t('admin.tableBlocker.selectAll', 'Select All ({{count}})', { count: filteredTables.length })}
                </span>
              </button>

              <span className="text-[11px]">
                {t('admin.tableBlocker.showingTables', 'Showing {{count}} tables', { count: filteredTables.length })}
              </span>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTables.map((table) => {
                const isSelected = selectedTableIds.includes(table.id);
                const categoryMeta = getCategoryMeta(table.category);
                const capacity = Number(table.capacity) || 1;
                const bookedSeats = Number(table.booked_seats) || 0;
                const isFullBlocked = bookedSeats >= capacity || table.status === 'sold';
                const isPartial = bookedSeats > 0 && bookedSeats < capacity;

                const availableSeats = Math.max(0, capacity - bookedSeats);
                const rawCode = (table.svg_element_id || table.table_code || '').trim();
                const displayName = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

                return (
                  <div
                    key={table.id}
                    className={`relative p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                        : isFullBlocked
                        ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/60'
                        : isPartial
                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                        : 'border-border bg-card hover:border-border/90'
                    }`}
                  >
                    {/* Top Row: Checkbox, Table Badge, Category, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(table.id)}
                          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-foreground font-mono block truncate">
                            {displayName}
                          </span>
                          <span
                            className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border"
                            style={{
                              backgroundColor: `${categoryMeta.color}15`,
                              borderColor: `${categoryMeta.color}40`,
                              color: categoryMeta.color,
                            }}
                          >
                            {categoryMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Status indicator Pill */}
                      <div>
                        {isFullBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                            <Lock className="w-2.5 h-2.5" />
                            {t('seatMap.sold', 'Blocked / Sold')}
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <Sliders className="w-2.5 h-2.5" />
                            {t('admin.tableBlocker.partialShort', 'Partial')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {t('seatMap.available', 'Available')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Available Seats Control & Steppers */}
                    <div className="space-y-2 pt-1">
                      {/* Available vs Blocked Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-center p-2 rounded-lg bg-secondary/25 border border-border/70">
                        {/* Available Seats */}
                        <div className="border-r border-border/50">
                          <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                            {t('admin.tableBlocker.availableSeats', 'المتاح للجمهور')}
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-500">
                            {availableSeats} {t('admin.tableBlocker.seats', 'كراسي')}
                          </span>
                        </div>

                        {/* Blocked Seats */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-500 block">
                            {t('admin.tableBlocker.blockedSeats', 'المحجوب')}
                          </span>
                          <span className="text-xs font-bold font-mono text-amber-500">
                            {bookedSeats} {t('admin.tableBlocker.seats', 'كراسي')}
                          </span>
                        </div>
                      </div>

                      {/* Mini visual progress bar */}
                      <div className="w-full h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFullBlocked ? 'bg-red-500' : isPartial ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (availableSeats / capacity) * 100)}%` }}
                        />
                      </div>

                      {/* Stepper to control available seats directly */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {t('admin.tableBlocker.adjustAvailable', 'تعديل المقاعد المتاحة:')}
                        </span>

                        <div className="flex items-center gap-1 bg-secondary/50 border border-border rounded-lg p-0.5">
                          {/* Decrease available seats (blocks 1 more seat) */}
                          <button
                            type="button"
                            onClick={() => handleCustomSeatsChange(table, bookedSeats + 1)}
                            disabled={availableSeats <= 0 || isMutating}
                            className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-background hover:bg-destructive/20 hover:text-destructive text-foreground disabled:opacity-30 cursor-pointer transition-colors"
                            title={t('admin.tableBlocker.decreaseAvailable', 'إنقاص المقاعد المتاحة (حجب كرسي)')}
                          >
                            -
                          </button>
                          
                          <span className="font-mono font-bold text-xs px-1.5 text-foreground min-w-5 text-center">
                            {availableSeats}
                          </span>

                          {/* Increase available seats (unblocks 1 seat) */}
                          <button
                            type="button"
                            onClick={() => handleCustomSeatsChange(table, bookedSeats - 1)}
                            disabled={bookedSeats <= 0 || isMutating}
                            className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs bg-background hover:bg-emerald-500/20 hover:text-emerald-500 text-foreground disabled:opacity-30 cursor-pointer transition-colors"
                            title={t('admin.tableBlocker.increaseAvailable', 'زيادة المقاعد المتاحة (إتاحة كرسي)')}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: 1-Click Quick Actions (Block Full / Make Full Available) */}
                    <div className="pt-1 flex gap-2">
                      {isFullBlocked ? (
                        <button
                          type="button"
                          onClick={() => handleSingleToggleBlock(table)}
                          disabled={isMutating}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 transition-all cursor-pointer active:scale-98"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{t('admin.tableBlocker.unblockBtn', 'إتاحة كل المقاعد')}</span>
                        </button>
                      ) : (
                        <div className="w-full flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSingleToggleBlock(table)}
                            disabled={isMutating}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-all cursor-pointer active:scale-98"
                          >
                            <Lock className="w-3 h-3" />
                            <span>{t('admin.tableBlocker.blockBtn', 'حجب الطاولة كاملة')}</span>
                          </button>

                          {bookedSeats > 0 && (
                            <button
                              type="button"
                              onClick={() => handleCustomSeatsChange(table, 0)}
                              disabled={isMutating}
                              className="flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-colors cursor-pointer"
                              title={t('admin.tableBlocker.resetAvailable', 'إتاحة جميع مقاعد الطاولة')}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTableBlocker;
