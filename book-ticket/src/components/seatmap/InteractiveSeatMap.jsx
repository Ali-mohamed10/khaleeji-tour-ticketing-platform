/**
 * InteractiveSeatMap Component
 *
 * Purpose: Render the custom venue seating maps (Hillm Venues & Gul Gul) matching the exact architectural layout.
 *          Supports zoom, pan, fullscreen, and click-to-view table details popup.
 * Inputs: seatMap object, onTableSelect, selectedTables array, onSeatsCountChange
 * Output: Interactive SVG Map with custom rooms/tables and coordinates
 * Dependencies: react, lucide-react, react-i18next
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { computeStatus } from '../../utils/seatMapConstants';
import { Table } from './Table';
import { ZoomControls } from './ZoomControls';
import { SeatMapTooltip } from './SeatMapTooltip';

// 1. Static Layout of the 31 tables & rooms for Hillm Venues
const HILLM_TABLE_LAYOUTS = [
  // 1. Top Row (VIP Premium, Yellow/Gold, 12 PP, $75 default)
  {
    id: '#1',
    x: 390,
    y: 55,
    width: 125,
    height: 42,
    rotation: 0,
    category: 'vip_premium',
    capacity: 12,
    price: 110,
    shape: 'rect_bench',
  },
  {
    id: '#19',
    x: 810,
    y: 55,
    width: 125,
    height: 42,
    rotation: 0,
    category: 'vip_premium',
    capacity: 12,
    price: 110,
    shape: 'rect_bench',
  },

  // 2. Left Wing Top Angled Row (Slanted -20°)
  {
    id: '#2',
    x: 275,
    y: 80,
    width: 105,
    height: 38,
    rotation: -20,
    category: 'vip_standard',
    capacity: 8,
    price: 100,
    shape: 'rect_bench',
  },
  {
    id: '#3',
    x: 170,
    y: 120,
    width: 105,
    height: 38,
    rotation: -20,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench',
  },
  {
    id: '#4',
    x: 65,
    y: 160,
    width: 115,
    height: 38,
    rotation: -20,
    category: 'general',
    capacity: 12,
    price: 90,
    shape: 'rect_bench',
  },

  // 3. Left Wing Bottom Angled Row (Slanted -20°)
  {
    id: '#6',
    x: 235,
    y: 180,
    width: 115,
    height: 38,
    rotation: -20,
    category: 'vip_standard',
    capacity: 12,
    price: 100,
    shape: 'rect_bench',
  },
  {
    id: '#5',
    x: 125,
    y: 220,
    width: 115,
    height: 38,
    rotation: -20,
    category: 'general',
    capacity: 12,
    price: 90,
    shape: 'rect_bench',
  },

  // 4. Right Wing Top Angled Row (Slanted 20°)
  {
    id: '#18',
    x: 925,
    y: 80,
    width: 105,
    height: 38,
    rotation: 20,
    category: 'vip_standard',
    capacity: 8,
    price: 100,
    shape: 'rect_bench',
  },
  {
    id: '#17',
    x: 1030,
    y: 120,
    width: 105,
    height: 38,
    rotation: 20,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench',
  },
  {
    id: '#16',
    x: 1135,
    y: 160,
    width: 115,
    height: 38,
    rotation: 20,
    category: 'general',
    capacity: 12,
    price: 90,
    shape: 'rect_bench',
  },

  // 5. Right Wing Bottom Angled Row (Slanted 20°)
  {
    id: '#14',
    x: 965,
    y: 180,
    width: 115,
    height: 38,
    rotation: 20,
    category: 'vip_standard',
    capacity: 12,
    price: 100,
    shape: 'rect_bench',
  },
  {
    id: '#15',
    x: 1075,
    y: 220,
    width: 115,
    height: 38,
    rotation: 20,
    category: 'general',
    capacity: 12,
    price: 90,
    shape: 'rect_bench',
  },

  // 6. Dance Floor Side Tables
  {
    id: '#7',
    x: 380,
    y: 200,
    width: 135,
    height: 42,
    rotation: 0,
    category: 'vip_premium',
    capacity: 16,
    price: 110,
    shape: 'rect_bench',
  },
  {
    id: '#13',
    x: 820,
    y: 200,
    width: 135,
    height: 42,
    rotation: 0,
    category: 'vip_premium',
    capacity: 16,
    price: 110,
    shape: 'rect_bench',
  },
  {
    id: '#8',
    x: 430,
    y: 350,
    width: 120,
    height: 40,
    rotation: 45,
    category: 'vip_premium',
    capacity: 12,
    price: 110,
    shape: 'rect_bench',
  },
  {
    id: '#12',
    x: 770,
    y: 350,
    width: 120,
    height: 40,
    rotation: -45,
    category: 'vip_premium',
    capacity: 12,
    price: 110,
    shape: 'rect_bench',
  },

  // 7. Center Sub-Dance Floor Tables (Vertical Benches)
  {
    id: '#9',
    x: 540,
    y: 375,
    width: 44,
    height: 95,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#10',
    x: 600,
    y: 375,
    width: 44,
    height: 95,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#11',
    x: 660,
    y: 375,
    width: 44,
    height: 95,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 110,
    shape: 'rect_bench_v',
  },

  // 8. Bottom Aisle Columns
  // Left Column (x=445)
  {
    id: '#20',
    x: 445,
    y: 485,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'vip_premium',
    capacity: 8,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#28',
    x: 445,
    y: 575,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench_v',
  },
  {
    id: '#29',
    x: 445,
    y: 665,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench_v',
  },

  // Center-Left Column (x=555)
  {
    id: '#21',
    x: 555,
    y: 490,
    width: 46,
    height: 90,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#27',
    x: 555,
    y: 595,
    width: 46,
    height: 90,
    rotation: 0,
    category: 'general',
    capacity: 10,
    price: 90,
    shape: 'rect_bench_v',
  },

  // Center-Right Column (x=645)
  {
    id: '#22',
    x: 645,
    y: 490,
    width: 46,
    height: 90,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#26',
    x: 645,
    y: 595,
    width: 46,
    height: 90,
    rotation: 0,
    category: 'general',
    capacity: 10,
    price: 90,
    shape: 'rect_bench_v',
  },

  // Right Column (x=755)
  {
    id: '#23',
    x: 755,
    y: 485,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'vip_premium',
    capacity: 8,
    price: 110,
    shape: 'rect_bench_v',
  },
  {
    id: '#24',
    x: 755,
    y: 575,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench_v',
  },
  {
    id: '#25',
    x: 755,
    y: 665,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'general',
    capacity: 8,
    price: 90,
    shape: 'rect_bench_v',
  },

  // 9. VIP Rooms (Red, 12 PP, $125)
  {
    id: 'VIP 1',
    x: 235,
    y: 510,
    width: 95,
    height: 135,
    rotation: 0,
    category: 'vip_room',
    capacity: 12,
    price: 125,
    shape: 'vip_room',
  },
  {
    id: 'VIP 2',
    x: 965,
    y: 510,
    width: 95,
    height: 135,
    rotation: 0,
    category: 'vip_room',
    capacity: 12,
    price: 125,
    shape: 'vip_room',
  },
];

// 2. Static Layout of the 18 tables for Gul Gul
const GULGUL_TABLE_LAYOUTS = [
  // Top Section — VIP Premium (Yellow / Gold, $75)
  {
    id: '#1',
    x: 85,
    y: 195,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'vip_premium',
    capacity: 4,
    price: 75,
    shape: 'rect_bench_v',
  },
  {
    id: '#2',
    x: 190,
    y: 235,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 75,
    shape: 'rect_bench_v',
  },
  {
    id: '#3',
    x: 275,
    y: 235,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 75,
    shape: 'rect_bench_v',
  },
  {
    id: '#4',
    x: 360,
    y: 235,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_premium',
    capacity: 10,
    price: 75,
    shape: 'rect_bench_v',
  },
  {
    id: '#6',
    x: 485,
    y: 250,
    width: 66,
    height: 66,
    rotation: 0,
    category: 'vip_premium',
    capacity: 5,
    price: 75,
    shape: 'round',
  },
  {
    id: '#5',
    x: 85,
    y: 395,
    width: 44,
    height: 180,
    rotation: 0,
    category: 'vip_premium',
    capacity: 12,
    price: 75,
    shape: 'rect_bench_v',
  },

  // Middle Section — VIP Standard (Green, $65)
  {
    id: '#7',
    x: 485,
    y: 365,
    width: 66,
    height: 66,
    rotation: 0,
    category: 'vip_standard',
    capacity: 5,
    price: 65,
    shape: 'round',
  },
  {
    id: '#8',
    x: 360,
    y: 400,
    width: 44,
    height: 75,
    rotation: 0,
    category: 'vip_standard',
    capacity: 4,
    price: 65,
    shape: 'rect_bench_v',
  },
  {
    id: '#9',
    x: 95,
    y: 575,
    width: 44,
    height: 110,
    rotation: 0,
    category: 'vip_standard',
    capacity: 8,
    price: 65,
    shape: 'rect_bench_v',
  },
  {
    id: '#10',
    x: 190,
    y: 550,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_standard',
    capacity: 10,
    price: 65,
    shape: 'rect_bench_v',
  },
  {
    id: '#11',
    x: 275,
    y: 550,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_standard',
    capacity: 10,
    price: 65,
    shape: 'rect_bench_v',
  },
  {
    id: '#12',
    x: 360,
    y: 550,
    width: 44,
    height: 145,
    rotation: 0,
    category: 'vip_standard',
    capacity: 10,
    price: 65,
    shape: 'rect_bench_v',
  },

  // Bottom Section — General (Grey, $55)
  {
    id: '#13',
    x: 485,
    y: 515,
    width: 44,
    height: 180,
    rotation: 0,
    category: 'general',
    capacity: 12,
    price: 55,
    shape: 'rect_bench_v',
  },
  {
    id: '#14',
    x: 485,
    y: 665,
    width: 66,
    height: 66,
    rotation: 0,
    category: 'general',
    capacity: 5,
    price: 55,
    shape: 'round',
  },
  {
    id: '#15',
    x: 485,
    y: 775,
    width: 66,
    height: 66,
    rotation: 0,
    category: 'general',
    capacity: 5,
    price: 55,
    shape: 'round',
  },
  {
    id: '#18',
    x: 190,
    y: 765,
    width: 44,
    height: 115,
    rotation: 0,
    category: 'general',
    capacity: 10,
    price: 55,
    shape: 'rect_bench_v',
  },
  {
    id: '#17',
    x: 275,
    y: 765,
    width: 44,
    height: 115,
    rotation: 0,
    category: 'general',
    capacity: 10,
    price: 55,
    shape: 'rect_bench_v',
  },
  {
    id: '#16',
    x: 360,
    y: 765,
    width: 44,
    height: 115,
    rotation: 0,
    category: 'general',
    capacity: 10,
    price: 55,
    shape: 'rect_bench_v',
  },
];

export const InteractiveSeatMap = ({
  seatMap,
  onTableSelect,
  selectedTables = [],
  onSeatsCountChange,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);

  // Detect whether the map is Gul Gul based on slug or name
  const isGulGul = useMemo(() => {
    const identifier = (seatMap?.slug || seatMap?.name || '').toLowerCase();
    return identifier.includes('gul') || identifier.includes('windsor');
  }, [seatMap?.slug, seatMap?.name]);

  const activeLayouts = isGulGul ? GULGUL_TABLE_LAYOUTS : HILLM_TABLE_LAYOUTS;

  // Active clicked table popup state (NO hover)
  const [clickedTable, setClickedTable] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Zoom Scroll Overlay prompt state
  const [showScrollOverlay, setShowScrollOverlay] = useState(false);
  const overlayTimeoutRef = useRef(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error('Error attempting to enable fullscreen:', err.message);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Pan & Zoom state
  const initialScale = isGulGul ? 0.9 : 0.95;
  const [transform, setTransform] = useState({ scale: initialScale, x: 0, y: 0 });
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  const isDragging = useRef(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const pinchStateRef = useRef(null);

  // Merge Supabase table data with static layout, compute status from bookedSeats and DB status
  const mergedTables = useMemo(() => {
    const dbTables = seatMap?.tables || [];
    return activeLayouts.map((layout) => {
      const cleanLayoutId = layout.id.replace('#', '').trim().toUpperCase();
      const dbTable = dbTables.find((t) => {
        const cleanDbCode = (t.table_code || '').replace('#', '').trim().toUpperCase();
        return cleanDbCode === cleanLayoutId || cleanDbCode === layout.id.toUpperCase();
      });

      const cap = dbTable?.capacity || layout.capacity;
      const booked = dbTable?.booked_seats || 0;
      const dbStatus = dbTable?.status;
      let finalStatus = 'available';
      if (dbStatus === 'disabled') {
        finalStatus = 'disabled';
      } else {
        finalStatus = computeStatus(booked, cap);
      }
      const available = finalStatus === 'sold' || finalStatus === 'disabled'
        ? 0
        : Math.max(0, cap - booked);

      return {
        ...layout,
        db_id: dbTable?.id,
        table_code: layout.id,
        price: dbTable?.price ? parseFloat(dbTable.price) : layout.price,
        capacity: cap,
        bookedSeats: booked,
        availableSeats: available,
        status: finalStatus,
      };
    });
  }, [seatMap?.tables, activeLayouts]);

  // Handlers for zooming
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.15, 3) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.15, 0.4) }));
  }, []);

  const handleResetView = useCallback(() => {
    setTransform({ scale: isGulGul ? 0.9 : 0.95, x: 0, y: 0 });
  }, [isGulGul]);

  // Handlers for mouse-wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
        return;
      }

      const isFullscreenActive = !!document.fullscreenElement;
      const isMac = navigator.platform.indexOf('Mac') > -1;
      const modifierPressed = isFullscreenActive || (isMac ? e.metaKey : e.ctrlKey);

      if (modifierPressed) {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        setTransform((prev) => {
          let newScale = prev.scale * (1 + scaleAmount);
          newScale = Math.min(Math.max(0.4, newScale), 3);
          return { ...prev, scale: newScale };
        });
        setShowScrollOverlay(false);
      } else {
        setShowScrollOverlay(true);
        if (overlayTimeoutRef.current) {
          clearTimeout(overlayTimeoutRef.current);
        }
        overlayTimeoutRef.current = setTimeout(() => {
          setShowScrollOverlay(false);
        }, 1500);
      }
    };

    const handleNativeTouchMove = (e) => {
      if (e.touches.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleNativeTouchMove);
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  // Handlers for panning (Mouse)
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startDragPos.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - startDragPos.current.x,
      y: e.clientY - startDragPos.current.y,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Handlers for panning & pinch-to-zoom (Touch/Mobile)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 2 fingers -> Pinch to zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      pinchStateRef.current = {
        initialDist: dist,
        initialScale: transformRef.current.scale,
        initialX: transformRef.current.x,
        initialY: transformRef.current.y,
        initialMidX: midX,
        initialMidY: midY,
      };
      isDragging.current = false;
    } else if (e.touches.length === 1) {
      // 1 finger -> Pan
      pinchStateRef.current = null;
      isDragging.current = true;
      const touch = e.touches[0];
      startDragPos.current = {
        x: touch.clientX - transformRef.current.x,
        y: touch.clientY - transformRef.current.y,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const { initialDist, initialScale, initialX, initialY, initialMidX, initialMidY } = pinchStateRef.current;
      if (initialDist > 0) {
        const scaleMultiplier = dist / initialDist;
        const newScale = Math.min(Math.max(0.4, initialScale * scaleMultiplier), 3);
        const deltaX = midX - initialMidX;
        const deltaY = midY - initialMidY;

        setTransform({
          scale: newScale,
          x: initialX + deltaX,
          y: initialY + deltaY,
        });
      }
    } else if (e.touches.length === 1 && isDragging.current) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      setTransform((prev) => ({
        ...prev,
        x: touch.clientX - startDragPos.current.x,
        y: touch.clientY - startDragPos.current.y,
      }));
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 1) {
      // Transition from 2 fingers to 1 finger seamlessly
      pinchStateRef.current = null;
      isDragging.current = true;
      const touch = e.touches[0];
      startDragPos.current = {
        x: touch.clientX - transformRef.current.x,
        y: touch.clientY - transformRef.current.y,
      };
    } else if (e.touches.length === 0) {
      isDragging.current = false;
      pinchStateRef.current = null;
    }
  };

  // Merge clicked table with database status/count
  const clickedTableMerged = useMemo(() => {
    if (!clickedTable) return null;

    const tableId = clickedTable.table_code || clickedTable.id;
    const dbId = clickedTable.db_id || clickedTable.id;

    const layoutTable = activeLayouts.find((t) => t.id.toUpperCase() === tableId.toUpperCase());
    if (!layoutTable) return null;

    const selected = selectedTables.find(
      (t) => t.id === dbId || t.table_code?.toUpperCase() === tableId.toUpperCase()
    );
    const dbTables = seatMap?.tables || [];
    const cleanLayoutId = layoutTable.id.replace('#', '').trim().toUpperCase();
    const dbTable = dbTables.find((t) => {
      const cleanDbCode = (t.table_code || '').replace('#', '').trim().toUpperCase();
      return cleanDbCode === cleanLayoutId || cleanDbCode === layoutTable.id.toUpperCase();
    });

    const cap = dbTable?.capacity || layoutTable.capacity;
    const booked = dbTable?.booked_seats || 0;
    const dbStatus = dbTable?.status;
    let finalStatus = 'available';
    if (dbStatus === 'disabled') {
      finalStatus = 'disabled';
    } else {
      finalStatus = computeStatus(booked, cap);
    }
    const maxAvailable = finalStatus === 'sold' || finalStatus === 'disabled'
      ? 0
      : Math.max(0, cap - booked);

    return {
      ...layoutTable,
      db_id: dbTable?.id,
      table_code: layoutTable.id,
      selectedSeatsCount: selected ? selected.selectedSeatsCount || 1 : 0,
      isSelected: !!selected,
      availableSeats: maxAvailable,
      bookedSeats: booked,
      capacity: cap,
      price: dbTable?.price ? parseFloat(dbTable.price) : layoutTable.price,
      status: finalStatus,
    };
  }, [clickedTable, selectedTables, seatMap?.tables, activeLayouts]);

  const handleCanvasClick = useCallback(() => {
    setClickedTable(null);
  }, []);

  // Selection & Popup callback - Opens table preview only
  const handleTableClick = useCallback(
    (table, e) => {
      if (e) {
        e.stopPropagation();
      }

      if (containerRef.current && e) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          containerWidth: rect.width,
          containerHeight: rect.height,
        });
      }

      setClickedTable(table);
    },
    []
  );

  return (
    <div
      className={`relative w-full bg-[#12100B] border border-border rounded-lg overflow-hidden select-none transition-all duration-300 ${isFullscreen ? 'h-full border-none rounded-none' : 'h-100 md:h-160'}`}
      ref={containerRef}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Zoom, Reset and Fullscreen Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* SVG Canvas */}
      <div
        className="w-full h-full origin-center cursor-grab active:cursor-grabbing z-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <svg
          viewBox={isGulGul ? '0 0 600 980' : '0 0 1200 740'}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Outer Venue Border */}
          <rect
            x={10}
            y={10}
            width={isGulGul ? 580 : 1180}
            height={isGulGul ? 960 : 720}
            rx={10}
            className="fill-transparent stroke-border/20 stroke-1 stroke-dasharray-[8,6]"
          />

          {isGulGul ? (
            /* ============================================================
               GUL GUL VENUE ARCHITECTURE
               ============================================================ */
            <g id="gulgul-architecture">
              {/* 1. Brand Logo Calligraphy "Gul Gul" */}
              <g id="gulgul-brand" transform="translate(300, 58)">
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-serif italic font-extrabold fill-primary text-4xl tracking-wider select-none drop-shadow-md"
                >
                  Gul Gul
                </text>
              </g>

              {/* 2. Framed STAGE Badge */}
              <g id="gulgul-stage" transform="translate(300, 112)">
                <rect
                  x={-120}
                  y={-20}
                  width={240}
                  height={40}
                  rx={6}
                  className="fill-[#1A1610] stroke-primary/70 stroke-2"
                />
                <rect
                  x={-116}
                  y={-16}
                  width={232}
                  height={32}
                  rx={4}
                  className="fill-transparent stroke-primary/30 stroke-1"
                />
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-extrabold fill-primary text-base uppercase tracking-[0.35em]"
                >
                  STAGE
                </text>
              </g>

              {/* 3. Center Yellow & Green Decorative Feature Circles */}
              <g id="center-features" className="pointer-events-none">
                {/* Yellow circle near tables 2,3,4,8 */}
                <circle
                  cx={232}
                  cy={395}
                  r={38}
                  className="fill-transparent stroke-seat-vip-premium stroke-2"
                />
                {/* Green circle near tables 10,11,12 */}
                <circle
                  cx={232}
                  cy={665}
                  r={38}
                  className="fill-transparent stroke-seat-vip-standard stroke-2"
                />
              </g>

              {/* 4. Bottom Horizontal In-Map Legend (Fixed English Architectural Style) */}
              <g id="gulgul-legend" transform="translate(300, 930)" direction="ltr">
                <rect
                  x={-240}
                  y={-18}
                  width={480}
                  height={36}
                  rx={6}
                  className="fill-[#1A1610]/95 stroke-primary/30 stroke-1"
                />

                {/* VIP Premium - Yellow */}
                <g transform="translate(-155, 0)" direction="ltr">
                  <rect
                    x={-50}
                    y={-6}
                    width={12}
                    height={12}
                    rx={2}
                    className="fill-transparent stroke-seat-vip-premium stroke-1.5"
                  />
                  <text
                    x={-32}
                    y={1}
                    textAnchor="start"
                    direction="ltr"
                    dominantBaseline="middle"
                    className="font-sans font-medium fill-[#F7F1E8] text-[9.5px]"
                  >
                    VIP Premium · $75
                  </text>
                </g>

                {/* VIP Standard - Green */}
                <g transform="translate(0, 0)" direction="ltr">
                  <rect
                    x={-50}
                    y={-6}
                    width={12}
                    height={12}
                    rx={2}
                    className="fill-transparent stroke-seat-vip-standard stroke-1.5"
                  />
                  <text
                    x={-32}
                    y={1}
                    textAnchor="start"
                    direction="ltr"
                    dominantBaseline="middle"
                    className="font-sans font-medium fill-[#F7F1E8] text-[9.5px]"
                  >
                    VIP Standard · $65
                  </text>
                </g>

                {/* General - Grey */}
                <g transform="translate(155, 0)" direction="ltr">
                  <rect
                    x={-42}
                    y={-6}
                    width={12}
                    height={12}
                    rx={2}
                    className="fill-transparent stroke-seat-general stroke-1.5"
                  />
                  <text
                    x={-24}
                    y={1}
                    textAnchor="start"
                    direction="ltr"
                    dominantBaseline="middle"
                    className="font-sans font-medium fill-[#F7F1E8] text-[9.5px]"
                  >
                    General · $55
                  </text>
                </g>
              </g>
            </g>
          ) : (
            /* ============================================================
               HILLM VENUES ARCHITECTURE
               ============================================================ */
            <g id="hillm-architecture">
              {/* Top Wall Barrier Line */}
              <line x1={50} y1={8} x2={1150} y2={8} className="stroke-foreground/40 stroke-2" />

              {/* 1. Stage ((2 Ft) Elevated Stage) */}
              <g id="stage-bg" transform="translate(600, 55)">
                <rect
                  x={-80}
                  y={-25}
                  width={160}
                  height={50}
                  rx={4}
                  className="fill-[#1A1610] stroke-primary/50 stroke-1.5"
                />
                <text
                  x={0}
                  y={-4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-bold fill-[#F7F1E8] text-xs uppercase tracking-wider"
                >
                  (2 Ft) Elevated
                </text>
                <text
                  x={0}
                  y={10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-extrabold fill-primary text-sm uppercase tracking-widest"
                >
                  Stage
                </text>
              </g>

              {/* 2. Dance Floor */}
              <g id="dance-floor-bg" transform="translate(600, 200)">
                <rect
                  x={-110}
                  y={-90}
                  width={220}
                  height={180}
                  rx={6}
                  className="fill-[#1A1610]/70 stroke-primary/30 stroke-1.5 stroke-dasharray-[6,6]"
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-bold fill-primary/50 text-xl uppercase tracking-[0.2em]"
                >
                  DANCE FLOOR
                </text>
              </g>

              {/* 3. Aisle Divider Lines */}
              <line
                x1={405}
                y1={440}
                x2={405}
                y2={710}
                className="stroke-foreground/30 stroke-1.5"
              />
              <line
                x1={510}
                y1={440}
                x2={510}
                y2={710}
                className="stroke-foreground/20 stroke-1 stroke-dasharray-[4,4]"
              />
              <line
                x1={700}
                y1={440}
                x2={700}
                y2={710}
                className="stroke-foreground/20 stroke-1 stroke-dasharray-[4,4]"
              />
              <line
                x1={795}
                y1={440}
                x2={795}
                y2={710}
                className="stroke-foreground/30 stroke-1.5"
              />

              {/* 4. Hillm Brand Logo Watermark in Background */}
              <g
                id="hillm-watermark"
                transform="translate(970, 360)"
                className="pointer-events-none opacity-20"
              >
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  className="font-serif text-5xl font-extrabold fill-primary tracking-widest"
                >
                  Hillm
                </text>
                <text
                  x={0}
                  y={24}
                  textAnchor="middle"
                  className="font-sans text-[9px] uppercase tracking-[0.2em] fill-[#BDAF9D]"
                >
                  Premium Café & Banquet
                </text>
              </g>

              {/* 5. In-Map Legend / Category Swatches (Fixed English Architectural Style) */}
              <g id="references-box" transform="translate(45, 605)" direction="ltr">
                <rect
                  x={0}
                  y={0}
                  width={200}
                  height={96}
                  rx={6}
                  className="fill-[#1A1610]/95 stroke-primary/30 stroke-1"
                />
                <text
                  x={12}
                  y={18}
                  textAnchor="start"
                  direction="ltr"
                  className="font-sans font-bold fill-primary text-[10px] uppercase tracking-wider"
                >
                  Legend & Pricing:
                </text>

                {/* VIP Room - Red */}
                <rect
                  x={12}
                  y={27}
                  width={11}
                  height={11}
                  rx={2}
                  className="fill-transparent stroke-seat-vip-room stroke-1.5"
                />
                <text
                  x={30}
                  y={36}
                  textAnchor="start"
                  direction="ltr"
                  className="font-sans fill-[#BDAF9D] text-[8.5px]"
                >
                  VIP Room · 12 guests · $125
                </text>

                {/* VIP Premium - Yellow */}
                <rect
                  x={12}
                  y={43}
                  width={11}
                  height={11}
                  rx={2}
                  className="fill-transparent stroke-seat-vip-premium stroke-1.5"
                />
                <text
                  x={30}
                  y={52}
                  textAnchor="start"
                  direction="ltr"
                  className="font-sans fill-[#BDAF9D] text-[8.5px]"
                >
                  VIP Premium (Yellow) · $110
                </text>

                {/* VIP Standard - Green */}
                <rect
                  x={12}
                  y={59}
                  width={11}
                  height={11}
                  rx={2}
                  className="fill-transparent stroke-seat-vip-standard stroke-1.5"
                />
                <text
                  x={30}
                  y={68}
                  textAnchor="start"
                  direction="ltr"
                  className="font-sans fill-[#BDAF9D] text-[8.5px]"
                >
                  VIP Standard (Green) · $100
                </text>

                {/* General - Grey */}
                <rect
                  x={12}
                  y={75}
                  width={11}
                  height={11}
                  rx={2}
                  className="fill-transparent stroke-seat-general stroke-1.5"
                />
                <text
                  x={30}
                  y={84}
                  textAnchor="start"
                  direction="ltr"
                  className="font-sans fill-[#BDAF9D] text-[8.5px]"
                >
                  General (Grey) · $90
                </text>
              </g>
            </g>
          )}

          {/* Tables & VIP Rooms Rendering */}
          {mergedTables.map((table) => {
            const isSelected = selectedTables.some(
              (t) => t.id === table.db_id || t.table_code === table.id
            );
            return (
              <Table
                key={table.id}
                table={table}
                isSelected={isSelected}
                onClick={(tbl, e) => handleTableClick(tbl, e)}
              />
            );
          })}
        </svg>
      </div>

      {/* Zoom Scroll modifier overlay prompt */}
      {showScrollOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-xs transition-opacity duration-300 pointer-events-none">
          <div className="bg-[#1A1610]/95 border border-primary/25 px-5 py-3 rounded-lg text-sm text-[#F7F1E8] font-bold shadow-lg animate-fade-in-up">
            {navigator.platform.indexOf('Mac') > -1
              ? t('seatMap.zoomMacPrompt', 'Use ⌘ + scroll to zoom')
              : t('seatMap.zoomWinPrompt', 'Use Ctrl + scroll to zoom')}
          </div>
        </div>
      )}

      {/* Click Popup Overlay */}
      <div className="absolute inset-0 z-60 pointer-events-none">
        <SeatMapTooltip
          table={clickedTableMerged}
          x={tooltipPos.x}
          y={tooltipPos.y}
          containerWidth={tooltipPos.containerWidth}
          visible={!!clickedTableMerged}
          onSeatsCountChange={onSeatsCountChange}
          onTableSelect={onTableSelect}
          onClose={() => setClickedTable(null)}
        />
      </div>
    </div>
  );
};
