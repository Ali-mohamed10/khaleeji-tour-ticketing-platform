import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Calendar,
  Ticket as TicketIcon,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  SwitchCamera,
  Users,
  TrendingUp,
  UserCheck,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useEventAttendees, useToggleCheckIn } from '../../hooks/useTickets';
import { ticketService, VerifyTicketResponse, EventAttendee } from '../../services/ticketService';

interface ScanHistoryItem {
  id: string;
  code: string;
  customerName: string;
  tableName: string;
  status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'NOT_PAID' | 'ERROR';
  scannedAt: Date;
  eventTitle?: string;
}

// Simple Web Audio API sound feedback
const playAudioFeedback = (type: 'success' | 'warning' | 'error') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15); // D3
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // AudioContext not allowed before user gesture
  }
};

export const TicketScannerPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Event filter from URL
  const selectedEventId = searchParams.get('event_id') || '';

  // Active Tab: 'scanner' | 'attendees'
  const [activeTab, setActiveTab] = useState<'scanner' | 'attendees'>('scanner');

  // Directory Search & Filter state
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked_in' | 'not_arrived'>('all');

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [result, setResult] = useState<VerifyTicketResponse | null>(null);
  const [crossEventWarning, setCrossEventWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Fetch events list for dropdown switcher
  const { data: events } = useEvents();

  // Fetch live gate statistics & attendees for selected event
  const { data: eventData, isLoading: isLoadingStats } = useEventAttendees(selectedEventId || undefined);
  const toggleCheckInMutation = useToggleCheckIn();

  // Current active event object
  const currentEvent = useMemo(() => {
    if (selectedEventId === 'press-conference') {
      return {
        id: 'press-conference',
        title_en: 'The 4th Press Conference',
        title_ar: 'المؤتمر الصحفي الرابع',
        venue_en: 'HILM Venues – Mississauga, Ontario',
        venue_ar: 'قاعات حِلم – ميسيساغا، أونتاريو',
      };
    }
    return events?.find((e: any) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  // Handle Event selection change
  const handleEventChange = (eventId: string) => {
    if (eventId) {
      setSearchParams({ event_id: eventId });
    } else {
      setSearchParams({});
    }
    setResult(null);
    setCrossEventWarning(null);
  };

  // Synchronous guard refs to prevent double-scan race condition
  // (html5-qrcode fires callback multiple times before React state updates)
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const SCAN_COOLDOWN_MS = 3000; // Ignore same code within 3 seconds

  // Process and verify a scanned ticket code
  const handleProcessCode = useCallback(async (rawCode: string) => {
    if (!rawCode) return;

    // Synchronous guard — prevents race condition from rapid QR callbacks
    if (isProcessingRef.current) return;

    // Deduplicate same code scanned within cooldown window
    const now = Date.now();
    const last = lastScannedRef.current;
    if (last.code === rawCode && now - last.time < SCAN_COOLDOWN_MS) return;

    isProcessingRef.current = true;
    lastScannedRef.current = { code: rawCode, time: now };
    setIsProcessing(true);
    setCrossEventWarning(null);

    // Stop scanner camera feed immediately so it pauses/closes upon scanning
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error pausing scanner:', err);
      }
      setIsScanning(false);
    }

    try {
      const data = await ticketService.verifyTicket(rawCode, true);
      setResult(data);

      // Invalidate event attendees query to instantly update live KPI stats
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });

      // Check cross-event mismatch if a specific event is selected
      if (selectedEventId && data.event?.id && data.event.id !== selectedEventId) {
        const otherTitle = isAr ? data.event.title_ar || data.event.title_en : data.event.title_en;
        setCrossEventWarning(otherTitle);
      }

      if (soundEnabled) {
        if (data.status === 'VALID') {
          playAudioFeedback('success');
        } else if (data.status === 'ALREADY_USED') {
          playAudioFeedback('warning');
        } else {
          playAudioFeedback('error');
        }
      }

      // Add to local scan history
      const formattedTable = data.isRegistration
        ? `${data.registration?.category || 'Registration'}${data.registration?.organization_name ? ` • ${data.registration.organization_name}` : ''}`
        : data.tables?.map((t) => `${t.table_name} (${t.seats_count} seats)`).join(', ') || 'General Admission';

      const historyItem: ScanHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        code: data.isRegistration
          ? data.registration?.registration_number || data.ticket?.ticket_code || rawCode
          : data.ticket?.ticket_code || rawCode,
        customerName: data.isRegistration
          ? data.registration?.full_name || data.ticket?.customer_name || 'Guest'
          : data.ticket?.customer_name || data.booking?.customer_email || 'Guest',
        tableName: formattedTable,
        status: data.status,
        scannedAt: new Date(),
        eventTitle: data.event?.title_en,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
    } catch (err: any) {
      console.error('Scan error:', err);
      const errorResult: VerifyTicketResponse = {
        success: false,
        status: 'ERROR',
        message: err?.response?.data?.error || err?.message || 'Network error verifying ticket',
      };
      setResult(errorResult);
      if (soundEnabled) playAudioFeedback('error');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [soundEnabled, selectedEventId, isAr, queryClient]);

  // Load available camera devices
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras on load:', err);
      });
  }, []);

  // Stop Camera QR Scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Start Camera QR Scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setCameraError(null);

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
    }

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.max(180, Math.floor(minEdge * 0.75));
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
      };

      const camId = cameraIdToUse || selectedCameraId;
      const cameraConfig = camId ? { deviceId: { exact: camId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        qrConfig,
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // Ignore individual frame decode errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      try {
        if (scannerRef.current) {
          await scannerRef.current.start(
            { facingMode: 'environment' },
            { fps: 15, qrbox: { width: 220, height: 220 } },
            (decodedText) => handleProcessCode(decodedText),
            () => {}
          );
          setIsScanning(true);
          return;
        }
      } catch (fallbackErr: any) {
        console.error('Fallback camera failed:', fallbackErr);
        setCameraError(
          fallbackErr?.message || 'Unable to access camera. Please allow camera permissions in your browser settings.'
        );
        setIsScanning(false);
      }
    }
  }, [handleProcessCode, selectedCameraId]);

  // Switch camera toggle
  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);

    if (isScanning) {
      await stopScanner();
      setTimeout(() => {
        startScanner(nextCamera.id);
      }, 300);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Submit manual code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessCode(manualCode.trim());
    }
  };

  const handleResetScan = useCallback(() => {
    setResult(null);
    setManualCode('');
    setCrossEventWarning(null);
    setTimeout(() => {
      startScanner();
    }, 150);
  }, [startScanner]);

  // Handle Manual check-in toggle from directory
  const handleToggleAttendee = async (attendee: EventAttendee) => {
    try {
      await toggleCheckInMutation.mutateAsync({
        ticketId: attendee.id,
        isUsed: !attendee.is_used,
        isRegistration: attendee.isRegistration,
      });
      if (soundEnabled) {
        playAudioFeedback(!attendee.is_used ? 'success' : 'warning');
      }
    } catch (err) {
      console.error('Failed to toggle check-in:', err);
    }
  };

  // Filtered Attendees list
  const filteredAttendees = useMemo(() => {
    const list = eventData?.attendees || [];
    return list.filter((a) => {
      const term = attendeeSearch.toLowerCase();
      const matchSearch =
        a.customer_name?.toLowerCase().includes(term) ||
        a.ticket_code?.toLowerCase().includes(term) ||
        a.registration_number?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term) ||
        a.organization_name?.toLowerCase().includes(term) ||
        a.tables?.some((t) => t.table_name.toLowerCase().includes(term) || t.table_code?.includes(term));

      if (!matchSearch) return false;

      if (attendeeFilter === 'checked_in') return a.is_used;
      if (attendeeFilter === 'not_arrived') return !a.is_used;
      return true;
    });
  }, [eventData?.attendees, attendeeSearch, attendeeFilter]);

  const stats = eventData?.stats || {
    totalTickets: 0,
    totalSeats: 0,
    checkedInCount: 0,
    remainingCount: 0,
    checkInPercentage: 0,
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 animate-fade-in-up">
      {/* Top Header & Event Switcher */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground">
                {t('scanner.title', 'Gate Check-in Scanner')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentEvent
                  ? `${isAr ? currentEvent.title_ar || currentEvent.title_en : currentEvent.title_en} • ${currentEvent.venue_en || ''}`
                  : t('scanner.allEventsSubtitle', 'Live Gate check-in and attendance across all events')}
              </p>
            </div>
          </div>
        </div>

        {/* Event Selector Dropdown & Sound/Camera Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Event Dropdown */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer shadow-xs"
            >
              <option value="">{t('scanner.filterAllEvents', 'All Events & Conferences')}</option>
              <optgroup label={isAr ? 'الحفلات والفعاليات' : 'Ticketed Events'}>
                {events?.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {isAr ? ev.title_ar || ev.title_en : ev.title_en}
                  </option>
                ))}
              </optgroup>
              <optgroup label={isAr ? 'تسجيلات المؤتمرات' : 'Conferences & Registrations'}>
                <option value="press-conference">
                  {isAr ? 'المؤتمر الصحفي الرابع' : 'The 4th Press Conference'}
                </option>
              </optgroup>
            </select>
          </div>

          {/* Sound Feedback Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
              soundEnabled
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
            }`}
            title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>

          {cameras.length > 1 && activeTab === 'scanner' && (
            <button
              onClick={handleSwitchCamera}
              className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Switch Cam</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Gate KPI Cards (Event Analytics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Paid Tickets */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t('scanner.kpiTotal', 'Total Tickets')}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TicketIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold font-sans text-foreground">
              {stats.totalTickets}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              ({stats.totalSeats} {t('scanner.seats', 'seats')})
            </span>
          </div>
        </div>

        {/* Metric 2: Checked-in Guests */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t('scanner.kpiCheckedIn', 'Checked In')}
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold font-sans text-emerald-500">
              {stats.checkedInCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {stats.checkInPercentage}%
            </span>
          </div>
        </div>

        {/* Metric 3: Remaining Expected */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t('scanner.kpiRemaining', 'Remaining')}
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold font-sans text-amber-500">
              {stats.remainingCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {t('scanner.expectedGuests', 'guests')}
            </span>
          </div>
        </div>

        {/* Metric 4: Live Capacity Rate & Progress Bar */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t('scanner.kpiCapacityRate', 'Gate Attendance')}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">{t('scanner.progress', 'Progress')}</span>
              <span className="text-foreground">{stats.checkInPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.checkInPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Live Scanner vs Attendee Directory) */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t('scanner.tabScanner', 'Live QR Scanner')}</span>
        </button>

        <button
          onClick={() => setActiveTab('attendees')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'attendees'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('scanner.tabDirectory', 'Attendee Directory')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-background/50 text-foreground">
            {eventData?.attendees?.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE QR SCANNER */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          {/* Left Column: Live Camera & Manual Code Entry */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Camera Viewfinder Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col items-center justify-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 w-full flex items-center justify-between">
                <span>{t('scanner.viewfinder', 'Live Camera View')}</span>
                {isScanning ? (
                  <button
                    onClick={stopScanner}
                    className="flex items-center gap-1 text-xs text-destructive hover:underline font-semibold cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>{t('scanner.stopCamera', 'Stop Camera')}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-mono">IDLE</span>
                )}
              </h2>

              {/* QR Scanner Container */}
              <div className="w-full max-w-sm aspect-square bg-background/80 border-2 border-dashed border-border rounded-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[300px]">
                <div
                  id={scannerContainerId}
                  className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>video]:rounded-xl"
                />

                {/* Result Overlay on top of camera viewfinder */}
                {result && (
                  <div className="absolute inset-0 bg-card/98 backdrop-blur-md flex flex-col items-center justify-between text-center p-5 z-30 animate-fade-in">
                    {result.status === 'VALID' && (
                      <>
                        <div className="w-full flex flex-col items-center justify-center pt-2">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/20 mb-3 animate-pulse">
                            <CheckCircle2 className="w-10 h-10" />
                          </div>
                          {result.isRegistration && (
                            <span className="inline-block px-2.5 py-0.5 mb-1 bg-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                              {isAr ? 'تسجيل مؤتمر' : 'Conference Registration'}
                            </span>
                          )}
                          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-500 font-bold block">
                            {result.registration?.registration_number || result.ticket?.ticket_code}
                          </span>
                          <h3 className="text-lg font-extrabold text-emerald-500 uppercase tracking-wide mt-0.5">
                            {t('scanner.validEntry', 'ENTRY GRANTED')}
                          </h3>
                          <p className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                            {result.registration?.full_name || result.ticket?.customer_name}
                          </p>
                          {result.isRegistration ? (
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                              <span className="px-2.5 py-0.5 bg-primary/15 text-primary rounded-full text-xs font-semibold border border-primary/30">
                                {result.registration?.category || 'Guest'}
                              </span>
                              {result.registration?.organization_name && (
                                <span className="px-2.5 py-0.5 bg-secondary text-foreground rounded-full text-xs font-medium max-w-[200px] truncate">
                                  {result.registration.organization_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            result.tables && result.tables.length > 0 && (
                              <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
                                {result.tables.map((t) => `${t.table_name} (${t.seats_count} seats)`).join(', ')}
                              </span>
                            )
                          )}
                        </div>
                        <button
                          onClick={handleResetScan}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t('scanner.scanNextBtn', 'Scan Next Attendee')}</span>
                        </button>
                      </>
                    )}

                    {result.status === 'ALREADY_USED' && (
                      <>
                        <div className="w-full flex flex-col items-center justify-center pt-2">
                          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 mb-3">
                            <AlertTriangle className="w-10 h-10" />
                          </div>
                          {result.isRegistration && (
                            <span className="inline-block px-2.5 py-0.5 mb-1 bg-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                              {isAr ? 'تسجيل مؤتمر' : 'Conference Registration'}
                            </span>
                          )}
                          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
                            {result.registration?.registration_number || result.ticket?.ticket_code}
                          </span>
                          <h3 className="text-lg font-extrabold text-amber-500 uppercase tracking-wide mt-0.5">
                            {t('scanner.alreadyUsed', 'ALREADY USED')}
                          </h3>
                          <p className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                            {result.registration?.full_name || result.ticket?.customer_name}
                          </p>
                          {result.used_at && (
                            <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90 block mt-1 font-mono">
                              {t('scanner.firstScanned', 'First scanned at')} {new Date(result.used_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleResetScan}
                          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t('scanner.scanNextBtn', 'Scan Next Attendee')}</span>
                        </button>
                      </>
                    )}

                    {(result.status === 'INVALID' || result.status === 'NOT_PAID' || result.status === 'ERROR') && (
                      <>
                        <div className="w-full flex flex-col items-center justify-center pt-2">
                          <div className="w-16 h-16 rounded-full bg-destructive/20 text-destructive flex items-center justify-center border-2 border-destructive/60 shadow-lg shadow-destructive/20 mb-3">
                            <XCircle className="w-10 h-10" />
                          </div>
                          <h3 className="text-lg font-extrabold text-destructive uppercase tracking-wide mt-0.5">
                            {result.status === 'NOT_PAID' ? t('scanner.notPaid', 'PAYMENT PENDING') : t('scanner.invalidTicket', 'INVALID TICKET')}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2 max-w-[240px]">
                            {result.message}
                          </p>
                        </div>
                        <button
                          onClick={handleResetScan}
                          className="w-full py-3 rounded-xl bg-destructive hover:opacity-90 text-destructive-foreground font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t('scanner.scanNextBtn', 'Scan Next Attendee')}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {!isScanning && !result && (
                  <div className="absolute inset-0 bg-card/95 flex flex-col items-center justify-center text-center p-6 gap-3 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">
                        {t('scanner.cameraReady', 'Camera is idle')}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                        {t('scanner.cameraHint', 'Click "Open Camera" to scan tickets using your device webcam or phone.')}
                      </p>
                    </div>
                    <button
                      onClick={() => startScanner()}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                    >
                      {t('scanner.startCamera', 'Open Camera')}
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {t('scanner.verifying', 'Verifying Ticket...')}
                    </span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs w-full flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Manual Code Input Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {t('scanner.manualEntry', 'Manual Ticket Search')}
              </h2>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder={t('scanner.inputPlaceholder', 'e.g. KT-GCIM-LX8E')}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wider text-foreground placeholder:normal-case placeholder:font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2 transition-opacity cursor-pointer shrink-0 shadow-sm"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{t('scanner.verifyBtn', 'Verify')}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Verification Result Card */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[340px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('scanner.resultTitle', 'Verification Result')}
                  </h2>
                  {result && (
                    <button
                      onClick={handleResetScan}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t('scanner.scanNext', 'Scan Next')}</span>
                    </button>
                  )}
                </div>

                {!result && (
                  <div className="flex flex-col items-center justify-center text-center py-16 gap-3 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center border border-border">
                      <TicketIcon className="w-8 h-8 opacity-40 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">
                      {t('scanner.waitingPrompt', 'Ready to Scan')}
                    </h3>
                    <p className="text-xs max-w-xs">
                      {t('scanner.waitingDescription', 'Point camera at the QR code or enter ticket code manually.')}
                    </p>
                  </div>
                )}

                {/* Cross Event Warning Alert */}
                {crossEventWarning && (
                  <div className="mb-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase">{t('scanner.crossEventWarning', 'Different Event Alert')}</span>
                      <span>
                        {t('scanner.crossEventMsg', 'Note: This ticket belongs to')} <strong>{crossEventWarning}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Status 1: VALID / ENTRY GRANTED */}
                {result && result.status === 'VALID' && (
                  <div className="flex flex-col gap-5 animate-fade-in-up">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3.5 shadow-xs">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-500 text-lg uppercase tracking-wide">
                          {t('scanner.validEntry', 'ENTRY GRANTED')}
                        </h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {result.message}
                        </p>
                      </div>
                    </div>

                    {/* Ticket / Registration Details */}
                    <div className="space-y-3 bg-background border border-border rounded-xl p-4 text-sm">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">
                          {result.isRegistration ? (isAr ? 'رقم التسجيل' : 'Registration ID') : t('scanner.ticketCode', 'Ticket Code')}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {result.registration?.registration_number || result.ticket?.ticket_code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {t('scanner.guest', 'Guest Name')}
                        </span>
                        <span className="font-bold text-foreground">
                          {result.registration?.full_name || result.ticket?.customer_name}
                        </span>
                      </div>

                      {result.isRegistration ? (
                        <>
                          <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              {isAr ? 'الفئة' : 'Category'}
                            </span>
                            <span className="font-bold text-primary">
                              {result.registration?.category || 'Guest'}
                            </span>
                          </div>
                          {result.registration?.organization_name && (
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                              <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                {isAr ? 'المؤسسة' : 'Organization'}
                              </span>
                              <span className="font-semibold text-foreground truncate max-w-[200px]">
                                {result.registration.organization_name}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                            <TicketIcon className="w-3.5 h-3.5 text-primary" />
                            {t('scanner.tableSeats', 'Table & Seats')}
                          </span>
                          <span className="font-bold text-primary">
                            {result.tables?.map((t) => `${t.table_name} (${t.seats_count} seats)`).join(', ') || 'General Admission'}
                          </span>
                        </div>
                      )}

                      {result.event && (
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {t('scanner.event', 'Event')}
                          </span>
                          <span className="font-semibold text-foreground truncate max-w-[220px]">
                            {isAr ? result.event.title_ar || result.event.title_en : result.event.title_en}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t('scanner.checkedAt', 'Checked in at')}
                        </span>
                        <span className="font-mono font-medium">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status 2: ALREADY USED */}
                {result && result.status === 'ALREADY_USED' && (
                  <div className="flex flex-col gap-5 animate-fade-in-up">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3.5 shadow-xs">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-500 text-lg uppercase tracking-wide">
                          {t('scanner.alreadyUsed', 'ALREADY USED')}
                        </h3>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {t('scanner.alreadyUsedMsg', 'This ticket has already been scanned for entry.')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-background border border-border rounded-xl p-4 text-sm">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">
                          {result.isRegistration ? (isAr ? 'رقم التسجيل' : 'Registration ID') : t('scanner.ticketCode', 'Ticket Code')}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {result.registration?.registration_number || result.ticket?.ticket_code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {t('scanner.guest', 'Guest Name')}
                        </span>
                        <span className="font-bold text-foreground">
                          {result.registration?.full_name || result.ticket?.customer_name}
                        </span>
                      </div>
                      {result.isRegistration ? (
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            {isAr ? 'الفئة' : 'Category'}
                          </span>
                          <span className="font-bold text-primary">
                            {result.registration?.category || 'Guest'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
                            <TicketIcon className="w-3.5 h-3.5 text-primary" />
                            {t('scanner.tableSeats', 'Table & Seats')}
                          </span>
                          <span className="font-bold text-primary">
                            {result.tables?.map((t) => `${t.table_name} (${t.seats_count} seats)`).join(', ') || 'N/A'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-amber-500 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t('scanner.firstUsedAt', 'First scanned at')}
                        </span>
                        <span className="font-mono">
                          {result.used_at ? new Date(result.used_at).toLocaleString() : 'Earlier today'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status 3: INVALID / FAKE TICKET */}
                {result && (result.status === 'INVALID' || result.status === 'NOT_PAID' || result.status === 'ERROR') && (
                  <div className="flex flex-col gap-5 animate-fade-in-up">
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3.5 shadow-xs">
                      <div className="w-12 h-12 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-destructive text-lg uppercase tracking-wide">
                          {result.status === 'NOT_PAID' ? t('scanner.notPaid', 'PAYMENT UNPAID') : t('scanner.invalid', 'INVALID TICKET')}
                        </h3>
                        <p className="text-xs text-destructive/90 font-medium">
                          {result.message || 'Ticket code could not be verified in the database.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Next Action Button */}
              {result && (
                <button
                  onClick={handleResetScan}
                  className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('scanner.scanNextBtn', 'Scan Next Attendee')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDEE DIRECTORY (Searchable Guest List & Manual Check-in) */}
      {activeTab === 'attendees' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6 animate-fade-in-up">
          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                type="text"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                placeholder={t('scanner.searchGuests', 'Search guests by name, ticket code, table #...')}
                className={`w-full bg-background border border-input rounded-xl py-2.5 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setAttendeeFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  attendeeFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('scanner.filterAll', 'All Guests')} ({eventData?.attendees?.length || 0})
              </button>

              <button
                onClick={() => setAttendeeFilter('checked_in')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  attendeeFilter === 'checked_in'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-secondary/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('scanner.filterCheckedIn', 'Inside')} ({stats.checkedInCount})
              </button>

              <button
                onClick={() => setAttendeeFilter('not_arrived')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  attendeeFilter === 'not_arrived'
                    ? 'bg-amber-500 text-white'
                    : 'bg-secondary/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('scanner.filterNotArrived', 'Not Arrived')} ({stats.remainingCount})
              </button>
            </div>
          </div>

          {/* Attendees Table */}
          {isLoadingStats ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold">{t('common.loading', 'Loading attendees...')}</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Users className="w-10 h-10 opacity-30 text-primary" />
              <p className="text-sm font-semibold">{t('scanner.noAttendeesFound', 'No attendees found matching your search.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">{t('scanner.guest', 'Guest Name')}</th>
                    <th className="py-3 px-3.5 font-semibold">{t('scanner.code', 'Ticket Code')}</th>
                    <th className="py-3 px-3.5 font-semibold">{t('scanner.table', 'Table')}</th>
                    <th className="py-3 px-3.5 font-semibold">{t('scanner.seats', 'Seats')}</th>
                    <th className="py-3 px-3.5 font-semibold">{t('scanner.status', 'Status')}</th>
                    <th className="py-3 px-3.5 font-semibold text-right">{t('scanner.action', 'Gate Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredAttendees.map((att) => (
                    <tr key={att.id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-foreground">{att.customer_name}</div>
                          {att.isRegistration && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                              {isAr ? 'مؤتمر' : 'Conference'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {att.customer_email || att.customer_phone}
                          {att.organization_name && ` • ${att.organization_name}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-xs font-bold text-foreground">
                        {att.isRegistration ? att.registration_number || att.ticket_code : att.ticket_code}
                      </td>
                      <td className="py-3.5 px-3.5 text-xs font-semibold text-primary">
                        {att.isRegistration ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {att.category || 'Guest'}
                          </span>
                        ) : (
                          att.tables?.map((t) => t.table_name).join(', ') || 'N/A'
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-xs font-semibold text-foreground">
                        {att.isRegistration ? 1 : att.seats_count}
                      </td>
                      <td className="py-3.5 px-3.5">
                        {att.is_used ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              INSIDE
                            </span>
                            {att.used_at && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                {new Date(att.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 w-fit">
                            <Clock className="w-3 h-3" />
                            EXPECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <button
                          onClick={() => handleToggleAttendee(att)}
                          disabled={toggleCheckInMutation.isPending}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
                            att.is_used
                              ? 'bg-secondary/20 hover:bg-destructive/20 text-muted-foreground hover:text-destructive border border-border'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                          title={att.is_used ? 'Undo Check-in' : 'Check-in Guest'}
                        >
                          {att.is_used ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>{t('scanner.undo', 'Undo')}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('scanner.checkInBtn', 'Check In')}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bottom Section: Recent Scans History (Session Log) */}
      {history.length > 0 && activeTab === 'scanner' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t('scanner.historyTitle', 'Recent Scans Session')}</span>
            </h2>
            <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-mono text-muted-foreground">
              {history.length} {t('scanner.scannedCount', 'scans')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t('scanner.time', 'Time')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('scanner.code', 'Ticket Code')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('scanner.guest', 'Guest Name')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('scanner.table', 'Table')}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t('scanner.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-sans">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3 text-xs font-mono text-muted-foreground">
                      {item.scannedAt.toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground text-xs">
                      {item.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground text-sm">
                      {item.customerName}
                    </td>
                    <td className="py-3 px-3 text-xs text-primary font-semibold">
                      {item.tableName}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.status === 'VALID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          VALID
                        </span>
                      )}
                      {item.status === 'ALREADY_USED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          USED
                        </span>
                      )}
                      {(item.status === 'INVALID' || item.status === 'ERROR' || item.status === 'NOT_PAID') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/30">
                          <XCircle className="w-3 h-3" />
                          INVALID
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketScannerPage;
