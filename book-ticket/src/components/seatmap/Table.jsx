/**
 * Table Component
 *
 * Purpose: Render a single interactive table or VIP Room SVG group <g> with surrounding chairs/seating.
 *          Category color is PERMANENT (VIP Room = Red, VIP Premium = Yellow, VIP Standard = Green, General = Grey).
 *          Status (available/reserved/sold) adds visual overlays only, never changes category color.
 * Inputs: table object (id, x, y, rotation, width, height, category, capacity, price, status, shape, bookedSeats, availableSeats), isSelected, onClick
 * Output: SVG group <g> containing table shape, chairs, labels, and status overlays
 * Dependencies: react-i18next
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

/**
/**
 * Get category stroke & style definitions.
 * Table body has a clean transparent background with colored category borders.
 */
const getCategoryStyles = (category) => {
  switch (category) {
    case 'vip_room':
      return {
        stroke: 'stroke-seat-vip-room',
        hoverFill: 'group-hover:fill-seat-vip-room/15',
        chair: 'fill-transparent stroke-seat-vip-room stroke-1',
      };
    case 'vip_premium':
    case 'gold':
      return {
        stroke: 'stroke-seat-vip-premium',
        hoverFill: 'group-hover:fill-seat-vip-premium/15',
        chair: 'fill-transparent stroke-seat-vip-premium stroke-1',
      };
    case 'vip_standard':
    case 'vip':
      return {
        stroke: 'stroke-seat-vip-standard',
        hoverFill: 'group-hover:fill-seat-vip-standard/15',
        chair: 'fill-transparent stroke-seat-vip-standard stroke-1',
      };
    case 'general':
    case 'silver':
    case 'standard':
    default:
      return {
        stroke: 'stroke-seat-general',
        hoverFill: 'group-hover:fill-seat-general/15',
        chair: 'fill-transparent stroke-seat-general stroke-1',
      };
  }
};

export const Table = memo(({ table, isSelected, onClick }) => {
  const { t } = useTranslation();
  const {
    id,
    x = 0,
    y = 0,
    rotation = 0,
    width = 110,
    height = 40,
    category = 'general',
    capacity = 8,
    price = 90,
    status = 'available',
    shape = 'rect_bench',
    bookedSeats = 0,
    availableSeats,
  } = table;

  const catStyles = getCategoryStyles(category);
  const isSold = status === 'sold';
  const isReserved = status === 'reserved';
  const isClickable = !isSold;

  // Handles clicking or pressing space/enter
  const handleAction = (e) => {
    if (isSold) return;
    e.preventDefault();
    onClick(table, e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction(e);
    }
  };

  /**
   * Build table shape classes.
   * Background is transparent; borders and hover states represent the category.
   */
  const getTableClasses = () => {
    if (isSelected) {
      return `fill-primary/20 stroke-seat-selected stroke-2`;
    }
    if (isSold) {
      return `fill-transparent ${catStyles.stroke} opacity-30 saturate-[0.3] cursor-not-allowed stroke-1`;
    }
    return `fill-transparent ${catStyles.stroke} stroke-1.5 ${catStyles.hoverFill} transition-all duration-200`;
  };

  /**
   * Chair styling:
   * - Booked chairs are dimmed / muted (low opacity) to show they are taken.
   * - Available chairs are bright and clear with category stroke outline.
   */
  const getChairClasses = (index = 0) => {
    if (isSold) {
      return `fill-transparent ${catStyles.stroke} opacity-20 stroke-1`;
    }
    // Individual chair is booked -> Dimmed / Muted
    if (index < bookedSeats) {
      return 'fill-black/60 stroke-foreground/20 opacity-25 stroke-1';
    }
    if (isSelected) {
      return 'fill-seat-selected/30 stroke-seat-selected stroke-1.5';
    }
    return `${catStyles.chair} transition-all duration-200`;
  };

  // Render chairs based on table capacity and shape layout
  const renderChairs = () => {
    const chairList = [];
    const chairWidth = 14;
    const chairHeight = 5;
    const rx = 1.5;

    if (shape === 'round' || shape === 'circle') {
      // Circular table with radiating chairs
      const radius = width / 2;
      const count = capacity || 5;
      const angleStep = (2 * Math.PI) / count;
      const startAngle = -Math.PI / 2; // start from top

      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * angleStep;
        const chairDistance = radius + 6;
        const cx = Math.cos(angle) * chairDistance;
        const cy = Math.sin(angle) * chairDistance;
        const chairRotation = (angle * 180) / Math.PI + 90;

        chairList.push(
          <rect
            key={`round-chair-${i}`}
            x={-chairWidth / 2}
            y={-chairHeight / 2}
            width={chairWidth}
            height={chairHeight}
            rx={rx}
            transform={`translate(${cx}, ${cy}) rotate(${chairRotation})`}
            className={getChairClasses(i)}
          />
        );
      }
      return chairList;
    }

    if (shape === 'vip_room') {
      // VIP Room: lounge seating along the outer edges
      const w = width;
      const h = height;
      // Top wall sofas
      chairList.push(
        <rect
          key="vr-t1"
          x={-w / 2 + 10}
          y={-h / 2 - 6}
          width={w / 3}
          height={5}
          rx={rx}
          className={getChairClasses(0)}
        />,
        <rect
          key="vr-t2"
          x={10}
          y={-h / 2 - 6}
          width={w / 3}
          height={5}
          rx={rx}
          className={getChairClasses(1)}
        />
      );
      // Left / Right wall sofas
      chairList.push(
        <rect
          key="vr-l1"
          x={-w / 2 - 6}
          y={-h / 4}
          width={5}
          height={h / 2}
          rx={rx}
          className={getChairClasses(2)}
        />,
        <rect
          key="vr-r1"
          x={w / 2 + 1}
          y={-h / 4}
          width={5}
          height={h / 2}
          rx={rx}
          className={getChairClasses(3)}
        />
      );
      return chairList;
    }

    if (shape === 'rect_bench_v') {
      // Vertical bench: chairs along left and right sides
      const halfH = height / 2;
      const halfW = width / 2;
      const chairsPerSide = Math.max(2, Math.floor(capacity / 2));
      const step = (height - 16) / (chairsPerSide - 1 || 1);

      for (let i = 0; i < chairsPerSide; i++) {
        const cy = -halfH + 8 + i * step;
        chairList.push(
          <rect
            key={`left-${i}`}
            x={-halfW - 6}
            y={cy - chairWidth / 2}
            width={5}
            height={chairWidth}
            rx={rx}
            className={getChairClasses(i * 2)}
          />,
          <rect
            key={`right-${i}`}
            x={halfW + 1}
            y={cy - chairWidth / 2}
            width={5}
            height={chairWidth}
            rx={rx}
            className={getChairClasses(i * 2 + 1)}
          />
        );
      }
      return chairList;
    }

    // Default: Horizontal / Angled bench table
    const halfW = width / 2;
    const halfH = height / 2;
    const chairsPerSide = Math.max(2, Math.floor(capacity / 2));
    const step = (width - 24) / (chairsPerSide - 1 || 1);

    for (let i = 0; i < chairsPerSide; i++) {
      const cx = -halfW + 12 + i * step;
      chairList.push(
        <rect
          key={`top-${i}`}
          x={cx - chairWidth / 2}
          y={-halfH - 6}
          width={chairWidth}
          height={chairHeight}
          rx={rx}
          className={getChairClasses(i * 2)}
        />,
        <rect
          key={`bottom-${i}`}
          x={cx - chairWidth / 2}
          y={halfH + 1}
          width={chairWidth}
          height={chairHeight}
          rx={rx}
          className={getChairClasses(i * 2 + 1)}
        />
      );
    }
    return chairList;
  };

  // Render table main body
  const renderTableShape = () => {
    const commonClasses = `transition-all duration-300 stroke-[1.5] ${getTableClasses()}`;
    const halfW = width / 2;
    const halfH = height / 2;

    if (shape === 'round' || shape === 'circle') {
      return (
        <circle cx={0} cy={0} r={width / 2} className={commonClasses} />
      );
    }

    if (shape === 'vip_room') {
      return (
        <g>
          {/* Room Outer Structure */}
          <rect
            x={-halfW}
            y={-halfH}
            width={width}
            height={height}
            rx={6}
            className={commonClasses}
          />
          {/* Room Door Indicator */}
          <line
            x1={-15}
            y1={-halfH}
            x2={15}
            y2={-halfH}
            className="stroke-background stroke-[2.5]"
          />
          {/* Room Inner Accent Box */}
          <rect
            x={-halfW + 8}
            y={-halfH + 8}
            width={width - 16}
            height={height - 16}
            rx={4}
            className="fill-transparent stroke-current opacity-20 stroke-dasharray-[4,4]"
          />
        </g>
      );
    }

    return (
      <rect x={-halfW} y={-halfH} width={width} height={height} rx={5} className={commonClasses} />
    );
  };

  // Label text opacity depends on status
  const labelClasses = isSold
    ? 'fill-[#F7F1E8]/25'
    : isSelected
      ? 'fill-primary font-extrabold'
      : 'fill-[#F7F1E8]';

  const subLabelClasses = isSold
    ? 'fill-[#BDAF9D]/15'
    : isSelected
      ? 'fill-primary/80 font-bold'
      : 'fill-[#BDAF9D]';

  const transformStr = `translate(${x}, ${y}) rotate(${rotation})${isSelected ? ' scale(1.03)' : ''}`;

  return (
    <g
      id={`table-${id}`}
      data-table-id={id}
      transform={transformStr}
      className={`group select-none outline-none ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={handleAction}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={`${t('seatMap.tableInfo', 'Table')} ${id}, ${t(`seatMap.${category}`, category)}, ${capacity} ${t('checkout.seats', 'seats')}, $${price}, ${t(`seatMap.${status}`, status)}`}
    >
      {/* Selected glow effect */}
      {isSelected && (
        shape === 'round' || shape === 'circle' ? (
          <circle
            cx={0}
            cy={0}
            r={width / 2 + 4}
            className="fill-none stroke-seat-selected/40 stroke-[3]"
            style={{ filter: 'blur(4px)' }}
          />
        ) : (
          <rect
            x={-width / 2 - 4}
            y={-height / 2 - 4}
            width={width + 8}
            height={height + 8}
            rx={8}
            className="fill-none stroke-seat-selected/40 stroke-[3]"
            style={{ filter: 'blur(4px)' }}
          />
        )
      )}

      {/* Surrounding Chairs */}
      {renderChairs()}

      {/* Table Main Surface */}
      {renderTableShape()}

      {/* Table Labels */}
      {shape === 'round' || shape === 'circle' ? (
        <g className="pointer-events-none select-none">
          <text
            x={0}
            y={-5}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-bold text-[11px] ${labelClasses}`}
          >
            {id}
          </text>
          <text
            x={0}
            y={9}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-semibold text-[9px] tracking-wide ${subLabelClasses}`}
          >
            (
            {isSold
              ? t('seatMap.sold', 'Sold')
              : isReserved || (bookedSeats > 0 && availableSeats < capacity)
                ? `${availableSeats ?? capacity - bookedSeats}/${capacity}`
                : `${capacity} pp`}
            )
          </text>
        </g>
      ) : shape === 'vip_room' ? (
        <g className="pointer-events-none select-none">
          <text
            x={0}
            y={-14}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-extrabold text-[12px] tracking-wider uppercase ${labelClasses}`}
          >
            VIP
          </text>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-bold text-[10px] tracking-wider uppercase ${labelClasses}`}
          >
            ROOM
          </text>
          <text
            x={0}
            y={18}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-bold text-[10px] ${subLabelClasses}`}
          >
            {isSold
              ? t('seatMap.sold', 'Sold')
              : isReserved || (bookedSeats > 0 && availableSeats < capacity)
                ? `${availableSeats ?? capacity - bookedSeats}/${capacity}`
                : `${capacity} PP`}
          </text>
        </g>
      ) : shape === 'rect_bench_v' ? (
        <g className="pointer-events-none select-none">
          <text
            x={0}
            y={-5}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-bold text-[11px] ${labelClasses}`}
          >
            {id}
          </text>
          <text
            x={0}
            y={9}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-semibold text-[9px] tracking-wide ${subLabelClasses}`}
          >
            (
            {isSold
              ? t('seatMap.sold', 'Sold')
              : isReserved || (bookedSeats > 0 && availableSeats < capacity)
                ? `${availableSeats ?? capacity - bookedSeats}/${capacity}`
                : `${capacity} pp`}
            )
          </text>
        </g>
      ) : (
        <g className="pointer-events-none select-none">
          <text
            x={0}
            y={-2}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-bold text-[11px] ${labelClasses}`}
          >
            {id}
          </text>
          <text
            x={0}
            y={11}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-sans font-semibold text-[9px] tracking-wide ${subLabelClasses}`}
          >
            (
            {isSold
              ? t('seatMap.sold', 'Sold')
              : isReserved || (bookedSeats > 0 && availableSeats < capacity)
                ? `${availableSeats ?? capacity - bookedSeats}/${capacity}`
                : `${capacity} pp`}
            )
          </text>
        </g>
      )}
    </g>
  );
});

Table.displayName = 'Table';
export default Table;
