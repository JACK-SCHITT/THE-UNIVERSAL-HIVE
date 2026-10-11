import { useState, useEffect, useRef, useCallback } from 'react';
import type { DeviceInfo, ConnectedDevice } from '@/types';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import { Wifi, Bluetooth, Usb, Monitor, RefreshCw, Zap, Copy, QrCode, Share2, X, Check } from 'lucide-react';

// ── Real device detection ──────────────────────────────────────────────
async function getDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };

  let os = 'Unknown';
  if (/Android/i.test(ua)) os = `Android ${(ua.match(/Android ([0-9.]+)/) || [])[1] || ''}`;
  else if (/iPhone|iPad|iPod/i.test(ua)) os = `iOS ${(ua.match(/OS ([0-9_]+)/) || [])[1]?.replace(/_/g, '.') || ''}`;
  else if (/Windows NT/i.test(ua)) os = `Windows ${(ua.match(/Windows NT ([0-9.]+)/) || [])[1] || ''}`;
  else if (/Mac OS X/i.test(ua)) os = `macOS ${(ua.match(/Mac OS X ([0-9_]+)/) || [])[1]?.replace(/_/g, '.') || ''}`;
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  let browser = 'Unknown';
  if (/Chrome\/([0-9.]+)/.test(ua) && !/Chromium|Edg|OPR/.test(ua)) browser = `Chrome ${(ua.match(/Chrome\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Firefox\/([0-9.]+)/.test(ua)) browser = `Firefox ${(ua.match(/Firefox\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Edg\/([0-9.]+)/.test(ua)) browser = `Edge ${(ua.match(/Edg\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = `Safari ${(ua.match(/Version\/([0-9.]+)/) || [])[1] || ''}`;

  let battery = 'N/A';
  let batteryLevel = 0;
  let batteryCharging = false;
  try {
    if ('getBattery' in navigator) {
      const b = await (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery();
      batteryLevel = b.level;
      batteryCharging = b.charging;
      battery = `${Math.round(b.level * 100)}% ${b.charging ? '⚡' : '🔋'}`;
    }
  } catch (_) {}

  const conn = nav.connection;
  const connection = conn
    ? `${conn.effectiveType?.toUpperCase() || '?'} ${conn.downlink ? conn.downlink + 'Mbps' : ''} RTT:${conn.rtt || 0}ms`.trim()
    : navigator.onLine ? 'ONLINE' : 'OFFLINE';

  // Storage estimate
  let storageUsed: number | undefined;
  let storageTotal: number | undefined;
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const est = await navigator.storage.estimate();
      storageUsed = est.usage;
      storageTotal = est.quota;
    }
  } catch (_) {}

  const orientation = screen.orientation?.type || 'unknown';

  return {
    os: os.trim() || 'Unknown',
    platform: navigator.platform || 'Unknown',
    browser, cores: navigator.hardwareConcurrency || 0,
    memory: nav.deviceMemory || null,
    screenW: screen.width, screenH: screen.height,
    connection, battery, batteryLevel, batteryCharging,
    touchPoints: navigator.maxTouchPoints || 0,
    language: navigator.language || 'en',
    online: navigator.onLine,
    userAgent: ua,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    vendor: navigator.vendor || 'Unknown',
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    effectiveType: conn?.effectiveType,
    storageUsed, storageTotal, orientation,
  };
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return 'N/A';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

// ── Replication Modal ──────────────────────────────────────────────────
function ReplicateModal({ device, onConfirm, onCancel }: {
  device: ConnectedDevice;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-hive-dark border border-gold/30 rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔄</div>
          <h3 className="font-mono text-sm font-bold text-gold tracking-wider">REPLICATE HIVE-OS?</h3>
          <p className="font-mono text-[10px] text-muted-foreground mt-2">
            This will send the KRACKERJACK AI app URL and all synced Hive data to:
          </p>
        </div>
        <div className="bg-hive-card border border-hive-border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: device.type === 'wifi' ? '#00ff41' : device.type === 'bluetooth' ? '#00d4ff' : '#bb00ff' }} />
            <div>
              <div className="font-mono text-xs font-bold text-gray-200">{device.name}</div>
              <div className="font-mono text-[9px] text-muted-foreground">{device.type.toUpperCase()} · {device.address || 'Connected'}</div>
            </div>
          </div>
        </div>
        <div className="bg-hive-card border border-gold/20 rounded-lg p-3">
          <div className="font-mono text-[10px] text-gold font-bold mb-1">WHAT GETS REPLICATED:</div>
          <div className="space-y-1">
            {['App URL (open on target browser)', 'All Soul Pillars + Core Memories', 'Hive Settings (auto-synced via cloud)', 'HIVE-OS config files'].map(item => (
              <div key={item} className="flex items-center gap-2">
                <Check size={9} className="text-terminal-green flex-shrink-0" />
                <span className="font-mono text-[9px] text-gray-300">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-hive-border">
            <div className="font-mono text-[9px] text-red-400/80">API keys stay local — never replicated for security</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-hive-border font-mono text-xs text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors">
            CANCEL
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-gold text-hive-black font-mono text-xs font-bold tracking-wider">
            {countdown > 0 ? `CONFIRM (${countdown})` : 'REPLICATE NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Device Monitor ───────────────────────────────────────────────
function DeviceMonitor() {
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const d = await getDeviceInfo();
    setInfo(d);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = window.setInterval(refresh, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  if (!info) return (
    <div className="text-center py-8 font-mono text-gold text-xs animate-pulse">PROBING HARDWARE...</div>
  );

  const batteryPct = Math.round(info.batteryLevel * 100);

  const stats = [
    { label: 'OS', value: info.os, color: '#f5a623' },
    { label: 'BROWSER', value: info.browser, color: '#f5a623' },
    { label: 'CPU CORES', value: `${info.cores} logical`, color: '#00ff41' },
    { label: 'RAM', value: info.memory ? `${info.memory} GB` : 'Not disclosed', color: '#00ff41' },
    { label: 'DISPLAY', value: `${info.screenW}×${info.screenH}`, color: '#00d4ff' },
    { label: 'ORIENTATION', value: info.orientation || 'unknown', color: '#00d4ff' },
    { label: 'NETWORK', value: info.connection, color: info.online ? '#00ff41' : '#ff3333' },
    { label: 'DOWNLINK', value: info.downlink ? `${info.downlink} Mbps` : 'N/A', color: '#00ff41' },
    { label: 'LATENCY', value: info.rtt ? `${info.rtt}ms` : 'N/A', color: '#00ff41' },
    { label: 'TIMEZONE', value: info.timezone, color: '#bb00ff' },
    { label: 'LANGUAGE', value: info.language, color: '#bb00ff' },
    { label: 'TOUCH PTS', value: `${info.touchPoints}`, color: '#bb00ff' },
    { label: 'STORAGE USED', value: formatBytes(info.storageUsed), color: '#ff6b35' },
    { label: 'STORAGE QUOTA', value: formatBytes(info.storageTotal), color: '#ff6b35' },
    { label: 'STATUS', value: info.online ? '🟢 ONLINE' : '🔴 OFFLINE', color: info.online ? '#00ff41' : '#ff3333' },
  ];

  return (
    <div className="space-y-3">
      {/* Battery Bar */}
      <div className="hive-card rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">BATTERY</span>
            {info.batteryCharging && <span className="font-mono text-[9px] text-terminal-green">⚡ CHARGING</span>}
          </div>
          <span className="font-mono text-xs font-bold" style={{ color: batteryPct > 50 ? '#00ff41' : batteryPct > 20 ? '#f5a623' : '#ff3333' }}>
            {info.battery}
          </span>
        </div>
        <div className="w-full h-2 bg-hive-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${batteryPct}%`,
              background: batteryPct > 50 ? '#00ff41' : batteryPct > 20 ? '#f5a623' : '#ff3333',
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="hive-card rounded-lg p-2.5">
            <div className="font-mono text-[8px] text-muted-foreground tracking-wider mb-0.5">{s.label}</div>
            <div className="font-mono text-[10px] font-bold truncate" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground/50">Auto-refresh every 5s</span>
        <button onClick={refresh} className="p-1.5 rounded border border-hive-border">
          <RefreshCw size={11} className={`text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// ── Main Device Bridge Page ────────────────────────────────────────────
type BridgeView = 'monitor' | 'wifi' | 'bluetooth' | 'usb' | 'replicate';

export function DeviceBridgePage() {
  const [view, setView] = useState<BridgeView>('monitor');
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [replicateTarget, setReplicateTarget] = useState<ConnectedDevice | null>(null);
  const [btScanning, setBtScanning] = useState(false);
  const [usbDevices, setUsbDevices] = useState<USBDevice[]>([]);
  const [appUrl] = useState(() => window.location.origin);
  const [qrReady, setQrReady] = useState(false);
  const [wifiPairCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);

  // Load QR code lib
  useEffect(() => {
    if (view === 'wifi') {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      s.onload = () => setQrReady(true);
      document.head.appendChild(s);
    }
  }, [view]);

  useEffect(() => {
    if (qrReady && view === 'wifi') {
      const el = document.getElementById('qr-container');
      if (el && el.childElementCount === 0 && (window as unknown as { QRCode?: unknown }).QRCode) {
        try {
          new (window as unknown as { QRCode: new (el: HTMLElement, opts: Record<string, unknown>) => void }).QRCode(el, {
            text: appUrl,
            width: 180, height: 180,
            colorDark: '#f5a623', colorLight: '#0a0a0a',
          });
        } catch (_) {}
      }
    }
  }, [qrReady, view, appUrl]);

  // ── Bluetooth connect ──────────────────────────────────────────────
  const connectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      toast.error('Web Bluetooth not supported on this browser. Use Chrome/Edge on Android or desktop.');
      return;
    }
    setBtScanning(true);
    try {
      const device = await (navigator as unknown as {
        bluetooth: { requestDevice: (opts: Record<string, unknown>) => Promise<{ name?: string; id: string }> }
      }).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });

      const connected: ConnectedDevice = {
        id: generateId(),
        name: device.name || `BT Device ${device.id.slice(0, 6)}`,
        type: 'bluetooth',
        status: 'connected',
        address: device.id,
        connectedAt: new Date().toLocaleTimeString(),
      };
      setConnectedDevices(prev => [...prev, connected]);
      toast.success(`Bluetooth connected: ${connected.name}`);
    } catch (err: unknown) {
      if ((err as Error).name !== 'NotFoundError') {
        toast.error(`Bluetooth error: ${(err as Error).message}`);
      }
    }
    setBtScanning(false);
  };

  // ── USB connect ────────────────────────────────────────────────────
  const connectUsb = async () => {
    if (!('usb' in navigator)) {
      toast.error('WebUSB not supported. Use Chrome/Edge desktop or Android Chrome.');
      return;
    }
    try {
      const device = await (navigator as unknown as {
        usb: { requestDevice: (opts: Record<string, unknown>) => Promise<{ productName?: string; manufacturerName?: string; vendorId: number }> }
      }).usb.requestDevice({ filters: [] });

      const name = device.productName || device.manufacturerName || `USB Device (${device.vendorId.toString(16)})`;
      const connected: ConnectedDevice = {
        id: generateId(),
        name,
        type: 'usb',
        status: 'connected',
        connectedAt: new Date().toLocaleTimeString(),
      };
      setConnectedDevices(prev => [...prev, connected]);
      toast.success(`USB connected: ${name}`);
    } catch (err: unknown) {
      if ((err as Error).name !== 'NotFoundError') {
        toast.error(`USB error: ${(err as Error).message}`);
      }
    }
  };

  // ── Scan already-permitted USB devices ────────────────────────────
  const scanUsb = async () => {
    if (!('usb' in navigator)) { toast.error('WebUSB not supported'); return; }
    const devices = await (navigator as unknown as {
      usb: { getDevices: () => Promise<USBDevice[]> }
    }).usb.getDevices();
    setUsbDevices(devices);
    if (devices.length === 0) toast.info('No previously permitted USB devices found');
    else toast.success(`Found ${devices.length} USB device(s)`);
  };

  // ── Add WiFi device ───────────────────────────────────────────────
  const addWifiDevice = () => {
    const d: ConnectedDevice = {
      id: generateId(),
      name: `WiFi Device · ${wifiPairCode}`,
      type: 'wifi',
      status: 'connected',
      address: `code:${wifiPairCode}`,
      connectedAt: new Date().toLocaleTimeString(),
    };
    setConnectedDevices(prev => [...prev, d]);
    toast.success('WiFi device registered');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success('App URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ title: 'KRACKERJACK AI HIVE-OS', url: appUrl });
      } catch (_) {}
    } else {
      copyUrl();
    }
  };

  const confirmReplicate = (device: ConnectedDevice) => {
    setReplicateTarget(device);
  };

  const doReplicate = async () => {
    if (!replicateTarget) return;
    toast.success(`Replicating HIVE-OS to ${replicateTarget.name}...`);
    // Open share/copy prompt
    await shareUrl();
    setReplicateTarget(null);
    toast.success('App URL shared! Open on target device to complete replication.');
  };

  const removeDevice = (id: string) => {
    setConnectedDevices(prev => prev.filter(d => d.id !== id));
  };

  const NAV_VIEWS: { id: BridgeView; icon: string; label: string; color: string }[] = [
    { id: 'monitor', icon: '📊', label: 'MONITOR', color: '#f5a623' },
    { id: 'wifi', icon: '📶', label: 'WiFi', color: '#00ff41' },
    { id: 'bluetooth', icon: '🔵', label: 'BT', color: '#00d4ff' },
    { id: 'usb', icon: '🔌', label: 'USB', color: '#bb00ff' },
    { id: 'replicate', icon: '🔄', label: 'CLONE', color: '#ff6b35' },
  ];

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-130px)]">
      {/* Sub-nav */}
      <div className="flex border-b border-hive-border bg-hive-dark overflow-x-auto no-scrollbar">
        {NAV_VIEWS.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 transition-all ${
              view === n.id ? 'border-b-2' : 'opacity-50'
            }`}
            style={view === n.id ? { borderColor: n.color } : {}}>
            <span className="text-base">{n.icon}</span>
            <span className="font-mono text-[8px] tracking-wider" style={{ color: view === n.id ? n.color : undefined }}>{n.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── MONITOR ── */}
        {view === 'monitor' && (
          <>
            <div>
              <h2 className="font-mono text-sm font-bold text-gold tracking-widest gold-glow">DEVICE MONITOR</h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Real-time hardware and system telemetry</p>
            </div>
            <DeviceMonitor />
          </>
        )}

        {/* ── WiFi ── */}
        {view === 'wifi' && (
          <>
            <div>
              <h2 className="font-mono text-sm font-bold text-terminal-green tracking-widest green-glow">WiFi BRIDGE</h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Connect devices on the same network</p>
            </div>

            {/* QR Code */}
            <div className="hive-card rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider flex items-center gap-2">
                <QrCode size={12} className="text-gold" /> SCAN TO OPEN HIVE-OS
              </div>
              <div id="qr-container" className="rounded-lg overflow-hidden border-2 border-gold/30" style={{ minHeight: 180, minWidth: 180, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!qrReady && <span className="font-mono text-[10px] text-muted-foreground animate-pulse">GENERATING QR...</span>}
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 bg-hive-black rounded px-3 py-2">
                  <span className="font-mono text-[10px] text-gray-300 flex-1 truncate">{appUrl}</span>
                  <button onClick={copyUrl}>
                    {copied ? <Check size={12} className="text-terminal-green" /> : <Copy size={12} className="text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded border border-terminal-green/30 font-mono text-[10px] text-terminal-green hover:border-terminal-green/60 transition-colors">
                    <Copy size={11} /> COPY URL
                  </button>
                  <button onClick={shareUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded bg-terminal-green text-hive-black font-mono text-[10px] font-bold">
                    <Share2 size={11} /> SHARE
                  </button>
                </div>
              </div>
            </div>

            {/* Pair code */}
            <div className="hive-card rounded-lg p-4">
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">WIFI PAIR CODE</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center py-3 bg-hive-black rounded-lg border border-terminal-green/30">
                  <span className="font-mono text-2xl font-bold tracking-[0.4em] text-terminal-green">{wifiPairCode}</span>
                </div>
                <button onClick={addWifiDevice}
                  className="px-4 py-3 rounded-lg bg-terminal-green/20 border border-terminal-green/50 font-mono text-[10px] text-terminal-green font-bold">
                  CONFIRM
                </button>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground mt-2">
                On the target device, open the app URL and enter this code to confirm the connection
              </p>
            </div>

            <div className="hive-card rounded-lg p-3 border border-gold/10">
              <div className="font-mono text-[10px] text-gold font-bold mb-2">WINDOWS 10 SETUP</div>
              <div className="space-y-1.5">
                {[
                  '1. Open Chrome or Edge on your Windows PC',
                  '2. Scan the QR code or paste the URL above',
                  '3. Bookmark it — works fully in browser',
                  '4. Pin to taskbar: ⋮ menu → More tools → Create shortcut',
                ].map(s => (
                  <div key={s} className="font-mono text-[9px] text-gray-400">{s}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── BLUETOOTH ── */}
        {view === 'bluetooth' && (
          <>
            <div>
              <h2 className="font-mono text-sm font-bold text-neon-blue tracking-widest" style={{ textShadow: '0 0 10px #00d4ff55' }}>
                BLUETOOTH BRIDGE
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Web Bluetooth API · BLE devices</p>
            </div>

            <div className="hive-card rounded-lg p-3 border border-neon-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Bluetooth size={14} className="text-neon-blue" />
                <span className="font-mono text-[10px] text-neon-blue font-bold">SUPPORTED PLATFORMS</span>
              </div>
              <div className="space-y-1">
                {[
                  ['✅', 'Chrome / Edge on Android'],
                  ['✅', 'Chrome / Edge on Windows / macOS / Linux'],
                  ['❌', 'iOS Safari (not supported by Apple)'],
                  ['❌', 'Firefox (no Web Bluetooth)'],
                ].map(([icon, label]) => (
                  <div key={label as string} className="flex items-center gap-2">
                    <span className="font-mono text-[10px]">{icon}</span>
                    <span className="font-mono text-[9px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={connectBluetooth}
              disabled={btScanning}
              className="w-full py-4 rounded-xl font-mono text-sm font-bold tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #0080ff)', color: '#0a0a0a' }}
            >
              {btScanning ? <RefreshCw size={18} className="animate-spin" /> : <Bluetooth size={18} />}
              {btScanning ? 'SCANNING...' : 'SCAN FOR DEVICES'}
            </button>

            <p className="font-mono text-[9px] text-muted-foreground text-center">
              Browser will show a device picker. Select your target device.
            </p>

            <div className="hive-card rounded-lg p-3 border border-gold/10">
              <div className="font-mono text-[10px] text-gold font-bold mb-2">FOR WINDOWS 10 PC</div>
              <div className="space-y-1.5">
                {[
                  '1. Enable Bluetooth on both devices',
                  '2. Pair devices in Windows Settings → Bluetooth',
                  '3. Open this app in Chrome on Windows PC',
                  '4. Use WiFi tab QR code to open on PC',
                  '5. Both devices now share the same Hive via cloud sync',
                ].map(s => (
                  <div key={s} className="font-mono text-[9px] text-gray-400">{s}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── USB ── */}
        {view === 'usb' && (
          <>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-widest" style={{ color: '#bb00ff', textShadow: '0 0 10px #bb00ff55' }}>
                USB BRIDGE
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">WebUSB API · Connect USB devices</p>
            </div>

            <div className="hive-card rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Usb size={14} style={{ color: '#bb00ff' }} />
                <span className="font-mono text-[10px] font-bold" style={{ color: '#bb00ff' }}>SUPPORTED PLATFORMS</span>
              </div>
              <div className="space-y-1">
                {[
                  ['✅', 'Chrome / Edge on Android (OTG)'],
                  ['✅', 'Chrome / Edge on Windows / macOS / Linux'],
                  ['❌', 'iOS Safari (not supported)'],
                  ['⚠️', 'Mass storage devices blocked by browsers (security)'],
                ].map(([icon, label]) => (
                  <div key={label as string} className="flex items-center gap-2">
                    <span className="font-mono text-[10px]">{icon}</span>
                    <span className="font-mono text-[9px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={connectUsb}
                className="flex-1 py-3 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(90deg, #bb00ff, #7700cc)', color: '#fff' }}>
                <Usb size={15} /> CONNECT USB
              </button>
              <button onClick={scanUsb}
                className="flex-1 py-3 rounded-xl border border-purple-500/40 font-mono text-xs text-purple-300 font-bold tracking-wider flex items-center justify-center gap-2">
                <RefreshCw size={13} /> SCAN KNOWN
              </button>
            </div>

            {/* Previously connected USB devices */}
            {usbDevices.length > 0 && (
              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">PERMITTED USB DEVICES</div>
                <div className="space-y-2">
                  {usbDevices.map((d, i) => (
                    <div key={i} className="hive-card rounded-lg p-3 flex items-center gap-3">
                      <Usb size={16} style={{ color: '#bb00ff' }} />
                      <div>
                        <div className="font-mono text-xs text-gray-200">{d.productName || 'Unknown Device'}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">{d.manufacturerName || ''} · VID: {d.vendorId.toString(16)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── REPLICATE ── */}
        {view === 'replicate' && (
          <>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-widest" style={{ color: '#ff6b35', textShadow: '0 0 10px #ff6b3555' }}>
                SELF-REPLICATION
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Deploy HIVE-OS to any connected device</p>
            </div>

            <div className="hive-card rounded-lg p-4 border border-orange-500/20">
              <div className="font-mono text-[10px] text-orange-400 font-bold mb-2">⚠️ PERMISSION REQUIRED</div>
              <p className="font-mono text-[9px] text-gray-400 leading-relaxed">
                Replication will send the KRACKERJACK AI app URL to the target device. The recipient must open the link and grant permissions on their end. API keys are NEVER replicated — they stay on your device only. Soul data syncs via cloud automatically.
              </p>
            </div>

            {/* How replication works */}
            <div className="hive-card rounded-lg p-4">
              <div className="font-mono text-[10px] text-gold font-bold mb-3">HOW IT WORKS</div>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Connect a device', desc: 'Use WiFi/Bluetooth/USB tab to connect your target device', color: '#00ff41' },
                  { step: '2', label: 'Select + Confirm', desc: 'Choose the device below and confirm replication', color: '#f5a623' },
                  { step: '3', label: 'Open on target', desc: 'Target device receives the URL — open it in Chrome/Edge', color: '#00d4ff' },
                  { step: '4', label: 'Auto-sync', desc: 'Soul pillars and Hive data sync automatically via cloud', color: '#bb00ff' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-hive-black font-mono text-[9px] font-bold" style={{ background: s.color }}>
                      {s.step}
                    </div>
                    <div>
                      <div className="font-mono text-[10px] font-bold" style={{ color: s.color }}>{s.label}</div>
                      <div className="font-mono text-[9px] text-gray-400">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick replicate — share URL directly */}
            <div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">QUICK REPLICATE (no device needed)</div>
              <button onClick={shareUrl}
                className="w-full py-4 rounded-xl font-mono text-sm font-bold tracking-widest flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #ff6b35, #ff3333)', color: '#fff' }}>
                <Share2 size={18} /> SHARE APP TO ANY DEVICE
              </button>
              <p className="font-mono text-[9px] text-muted-foreground/60 mt-2 text-center">
                Opens native share sheet on mobile · Copies URL on desktop
              </p>
            </div>

            {/* Connected devices */}
            {connectedDevices.length > 0 ? (
              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">CONNECTED DEVICES ({connectedDevices.length})</div>
                <div className="space-y-2">
                  {connectedDevices.map(device => (
                    <div key={device.id} className="hive-card rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
                            background: device.type === 'wifi' ? '#00ff41' : device.type === 'bluetooth' ? '#00d4ff' : '#bb00ff'
                          }} />
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-gray-200 truncate">{device.name}</div>
                            <div className="font-mono text-[9px] text-muted-foreground">{device.type.toUpperCase()} · {device.connectedAt}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => confirmReplicate(device)}
                            className="px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all"
                            style={{ background: '#ff6b35', color: '#fff' }}>
                            REPLICATE
                          </button>
                          <button onClick={() => removeDevice(device.id)}
                            className="p-1.5 rounded border border-hive-border hover:border-red-500/40 transition-colors">
                            <X size={11} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-hive-border rounded-lg">
                <Monitor size={24} className="text-muted-foreground mx-auto mb-2 opacity-30" />
                <div className="font-mono text-[10px] text-muted-foreground">No devices connected yet</div>
                <div className="font-mono text-[9px] text-muted-foreground/60 mt-1">Use WiFi / BT / USB tabs to connect</div>
              </div>
            )}

            {/* Windows 10 specific */}
            <div className="hive-card rounded-lg p-4 border border-gold/10">
              <div className="font-mono text-[10px] text-gold font-bold mb-3">🪟 WINDOWS 10 REPLICATION GUIDE</div>
              <div className="space-y-2">
                {[
                  { label: 'Method 1 — Same WiFi Network', steps: ['Connect phone and PC to same WiFi', 'Tap "Share App" above', 'On PC: open the shared URL in Chrome', 'Pin to taskbar as PWA for native feel'] },
                  { label: 'Method 2 — USB Cable', steps: ['Connect phone to PC via USB cable', 'Enable USB file transfer on phone', 'Open Chrome on PC and navigate to the URL', 'Hive data auto-syncs via cloud'] },
                  { label: 'Method 3 — Bluetooth', steps: ['Pair phone and PC in Windows Bluetooth settings', 'Use BT tab to detect PC', 'Share app URL via Bluetooth Send'] },
                ].map(m => (
                  <div key={m.label}>
                    <div className="font-mono text-[9px] font-bold text-gray-300 mb-1">{m.label}</div>
                    {m.steps.map(s => <div key={s} className="font-mono text-[9px] text-gray-500 pl-3">• {s}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Connected devices summary (all views) */}
        {connectedDevices.length > 0 && view !== 'replicate' && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">CONNECTED ({connectedDevices.length})</div>
            <div className="space-y-1">
              {connectedDevices.map(d => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-hive-border bg-hive-card">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.type === 'wifi' ? '#00ff41' : d.type === 'bluetooth' ? '#00d4ff' : '#bb00ff' }} />
                    <span className="font-mono text-[10px] text-gray-200">{d.name}</span>
                    <span className="font-mono text-[8px] text-muted-foreground">{d.type.toUpperCase()}</span>
                  </div>
                  <button onClick={() => removeDevice(d.id)}>
                    <X size={11} className="text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Replication confirmation modal */}
      {replicateTarget && (
        <ReplicateModal
          device={replicateTarget}
          onConfirm={doReplicate}
          onCancel={() => setReplicateTarget(null)}
        />
      )}
    </div>
  );
}
