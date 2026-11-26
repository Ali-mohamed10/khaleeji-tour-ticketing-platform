/**
 * SeatMapTooltip Component
 *
 * Purpose: Display table details preview and explicit booking confirmation.
 *          On desktop: absolute floating tooltip near table.
 *          On mobile: docked bottom sheet at the bottom of the container.
 *          Allows user to choose seat count and explicitly click "Add to Booking".
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Check, Trash2 } from 'lucide-react';
import { TABLE_CATEGORIES } from '../../utils/seatMapConstants';

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'available':
      return '#22c55e';
    case 'reserved':
      return '#f59e0b';
    case 'sold':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

export const SeatMapTooltip = ({
  table,
  x,
  y,
  containerWidth = 600,
  visible,
  onSeatsCountChange,
  onTableSelect,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localSeatsCount, setLocalSeatsCount] = useState(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync local seats count and reset collapse when table changes
  useEffect(() => {
    setIsCollapsed(false);
    setLocalSeatsCount(table?.selectedSeatsCount || 1);
  }, [table?.id, table?.table_code, table?.selectedSeatsCount]);

  if (!visible || !table) return null;

  const category = TABLE_CATEGORIES[table.category];
  const bookedSeats = table.bookedSeats || 0;
  const selectedSeatsCount = table.selectedSeatsCount || 0;
  const availableSeats = table.availableSeats ?? Math.max(0, table.capacity - bookedSeats);
  const isSelected = !!table.isSelected;
  const isSold = table.status === 'sold' || availableSeats <= 0;

  // Desktop vertical calculations
  const isUpperHalf = y < 350;
  const clampedTop = isUpperHalf ? Math.min(y, 220) : Math.max(y, 370);
  const translateY = isUpperHalf ? '15px' : '-105%';

  // Desktop horizontal calculations
  const tooltipWidth = 260;
  const halfWidth = tooltipWidth / 2;
  let translateX = '-50%';
  let clampedLeft = x;

  if (x < halfWidth + 15) {
    translateX = '0%';
    clampedLeft = Math.max(10, x - 10);
  } else if (containerWidth && x > containerWidth - (halfWidth + 15)) {
    translateX = '-100%';
    clampedLeft = Math.min(containerWidth - 10, x + 10);
  }

  const handleAddTable = (e) => {
    e.stopPropagation();
    const finalTable = {
      id: table.db_id || table.id,
      db_id: table.db_id,
      table_code: table.table_code || table.id,
      capacity: table.capacity,
      price: table.price,
      category: table.category,
      status: table.status,
    };
    onTableSelect?.(finalTable, localSeatsCount);
  };

  const handleRemoveTable = (e) => {
    e.stopPropagation();
    const finalTable = {
      id: table.db_id || table.id,
      db_id: table.db_id,
      table_code: table.table_code || table.id,
      capacity: table.capacity,
      price: table.price,
      category: table.category,
      status: table.status,
    };
    onTableSelect?.(finalTable);
  };

  return (
    <div
      className={`absolute z-50 pointer-events-auto bg-[#1A1610]/98 backdrop-blur-md text-[#F7F1E8] border-primary/20 shadow-2xl transition-all duration-300 ${
        isMobile
          ? 'bottom-0 inset-x-0 w-full rounded-t-2xl border-t border-primary/30 p-4'
          : 'rounded-xl border border-primary/30 p-3.5 w-68'
      }`}
      style={
        isMobile
          ? {
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(100%)',
            }
          : {
              left: `${clampedLeft}px`,
              top: `${clampedTop}px`,
              transform: `translate(${translateX}, ${translateY})`,
              opacity: visible ? 1 : 0,
            }
      }
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header: Table code + Status badge + Collapse/Close Controls */}
      <div
        className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-2 border-b border-primary/10 pb-2'}`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-[#F7F1E8]">{table.table_code || table.id}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: getStatusBadgeColor(table.status) }}
          >
            {t(`seatMap.${table.status}`, table.status)}
          </span>
          {isCollapsed && (
            <span className="text-xs font-bold text-primary ml-1">${table.price}</span>
          )}
          {isSelected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" />
              {t('seatMap.addedToBooking', 'Selected')}
            </span>
          )}
        </div>

        {/* Action Controls: Collapse & Close */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
            className="flex items-center justify-center text-[11px] font-bold px-2 py-1 rounded bg-secondary/40 hover:bg-secondary/70 text-foreground transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand details' : 'Collapse details'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded bg-secondary/40 hover:bg-secondary/70 text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Hidden when collapsed) */}
      {!isCollapsed && (
        <>
          {/* Metadata layout */}
          <div className="space-y-1.5 mb-3 text-xs">
            {/* Category */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#BDAF9D] shrink-0">{t('seatMap.categoryLabel', 'Category')}</span>
              <span className="font-semibold text-right truncate" style={{ color: `var(${category?.colorVar})` }}>
                {t(category?.label, table.category)}
              </span>
            </div>

            {/* Capacity */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#BDAF9D] shrink-0">{t('seatMap.capacityLabel', 'Capacity')}</span>
              <span className="font-medium text-[#F7F1E8]">{table.capacity}</span>
            </div>

            {/* Booked */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#BDAF9D] shrink-0">{t('seatMap.bookedLabel', 'Booked')}</span>
              <span
                className={`font-medium ${bookedSeats > 0 ? 'text-[#f59e0b]' : 'text-[#F7F1E8]'}`}
              >
                {bookedSeats}
              </span>
            </div>

            {/* Available */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#BDAF9D] shrink-0">{t('seatMap.availableLabel', 'Available')}</span>
              <span
                className={`font-medium ${availableSeats === 0 ? 'text-[#6b7280]' : 'text-[#22c55e]'}`}
              >
                {availableSeats}
              </span>
            </div>

            {/* Price per seat */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#BDAF9D] shrink-0">{t('seatMap.priceLabel', 'Price')}</span>
              <span className="font-bold text-primary">${table.price}</span>
            </div>
          </div>

          {/* Booking Action Block */}
          {!isSold && (
            <div className="mt-2 pt-2 border-t border-primary/10 space-y-3">
              {isSelected ? (
                /* Already Selected State */
                <div className="space-y-3">
                  {/* Seat Quantity Picker */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#BDAF9D]">
                      {t('seatMap.seatsToBook', 'Seats Quantity')}
                    </span>
                    <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeatsCountChange?.(
                            table.db_id || table.id,
                            Math.max(1, (table.selectedSeatsCount || 1) - 1)
                          );
                        }}
                        disabled={selectedSeatsCount <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/40 text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-foreground">
                        {selectedSeatsCount}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeatsCountChange?.(
                            table.db_id || table.id,
                            Math.min(availableSeats, (table.selectedSeatsCount || 1) + 1)
                          );
                        }}
                        disabled={selectedSeatsCount >= availableSeats}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/40 text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total & Deselect Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs font-bold text-primary">
                      <span>{t('seatMap.total', 'Total')}: </span>
                      <span>${(Number(table.price) * selectedSeatsCount).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveTable}
                      className="inline-flex items-center gap-1 bg-destructive/15 hover:bg-destructive/25 border border-destructive/30 text-destructive text-xs py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('seatMap.deselectTable', 'Deselect Table')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unselected State: Pick quantity & Add button */
                <div className="space-y-3">
                  {/* Seat Quantity Picker */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#BDAF9D]">
                      {t('seatMap.seatsToBook', 'Seats Quantity')}
                    </span>
                    <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSeatsCount((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={localSeatsCount <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/40 text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-foreground">
                        {localSeatsCount}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSeatsCount((prev) => Math.min(availableSeats, prev + 1));
                        }}
                        disabled={localSeatsCount >= availableSeats}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/40 text-foreground disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total & Add to Selection Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs font-bold text-primary">
                      <span>{t('seatMap.total', 'Total')}: </span>
                      <span>${(Number(table.price) * localSeatsCount).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTable}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 text-xs py-2 px-3 rounded-lg font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('seatMap.addToBooking', 'إضافة إلى الحجز')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
