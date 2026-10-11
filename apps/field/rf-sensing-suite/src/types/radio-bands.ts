export interface RadioBand {
  id: string;
  name: string;
  frequencyRange: [number, number]; // Hz
  modulation: 'AM' | 'FM' | 'SSB' | 'Digital' | 'Mixed';
  usage: string;
  channels?: number;
  channelSpacing?: number; // kHz
  capabilities: string[];
  color: string;
}

export interface RadioSignal {
  frequency: number; // Hz
  bandwidth: number; // Hz
  strength: number; // dBm
  modulation: string;
  timestamp: number;
  decoded?: string;
}

export interface ChannelInfo {
  number: number;
  frequency: number;
  name: string;
  usage: string;
}

export const RADIO_BANDS: RadioBand[] = [
  {
    id: 'am_broadcast',
    name: 'AM Broadcast',
    frequencyRange: [530e3, 1700e3],
    modulation: 'AM',
    usage: 'Commercial AM radio stations',
    capabilities: [
      'Long-range broadcast reception',
      'News, talk radio, sports',
      'Can propagate hundreds of miles at night',
      'Susceptible to electrical interference'
    ],
    color: '#FF6B6B'
  },
  {
    id: 'fm_broadcast',
    name: 'FM Broadcast',
    frequencyRange: [88e6, 108e6],
    modulation: 'FM',
    usage: 'Commercial FM radio stations',
    capabilities: [
      'High-fidelity audio quality',
      'Music, news, talk shows',
      'Line-of-sight propagation (30-60 miles)',
      'RDS data for station info'
    ],
    color: '#4ECDC4'
  },
  {
    id: 'cb_radio',
    name: 'CB Radio (Citizens Band)',
    frequencyRange: [26.965e6, 27.405e6],
    modulation: 'AM',
    usage: 'Short-range two-way communication',
    channels: 40,
    channelSpacing: 10,
    capabilities: [
      'Truckers, hobbyists, emergency comms',
      '40 channels (Channel 9 = emergency)',
      'Range: 1-5 miles (up to 20 with skip)',
      'No license required in most countries',
      'Channel 19: Highway trucker channel'
    ],
    color: '#FFD93D'
  },
  {
    id: 'marine_vhf',
    name: 'Marine VHF',
    frequencyRange: [156e6, 162e6],
    modulation: 'FM',
    usage: 'Ship-to-ship and ship-to-shore',
    channels: 57,
    channelSpacing: 25,
    capabilities: [
      'Channel 16: Distress and calling (156.8 MHz)',
      'Channel 13: Bridge-to-bridge navigation',
      'Digital Selective Calling (DSC) on CH 70',
      'Range: 5-60 miles (depends on antenna height)',
      'Weather channels: WX1-WX10',
      'Required for vessels over 20m'
    ],
    color: '#45B7D1'
  },
  {
    id: 'aviation',
    name: 'Aviation VHF',
    frequencyRange: [118e6, 137e6],
    modulation: 'AM',
    usage: 'Air traffic control and aircraft comms',
    channels: 760,
    channelSpacing: 25,
    capabilities: [
      '121.5 MHz: Emergency frequency',
      '122.75 MHz: Air-to-air (general aviation)',
      'Tower, approach, departure frequencies',
      'ATIS (weather/airport info)',
      'Can monitor local airport traffic',
      'Requires aviation radio license to transmit'
    ],
    color: '#A78BFA'
  },
  {
    id: 'ham_160m',
    name: 'Ham Radio 160m',
    frequencyRange: [1.8e6, 2.0e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - HF band',
    capabilities: [
      'Long-distance nighttime propagation',
      'Voice, CW (morse), digital modes',
      'DX contests, ragchewing',
      'Requires amateur license (Technician+)'
    ],
    color: '#F87171'
  },
  {
    id: 'ham_80m',
    name: 'Ham Radio 80m',
    frequencyRange: [3.5e6, 4.0e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - HF band',
    capabilities: [
      'Regional to continental range',
      'Popular for evening nets',
      'SSB voice, CW, digital (FT8, PSK31)'
    ],
    color: '#FB923C'
  },
  {
    id: 'ham_40m',
    name: 'Ham Radio 40m',
    frequencyRange: [7.0e6, 7.3e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - HF band',
    capabilities: [
      'Excellent DX band day and night',
      '7.200 MHz: QRP calling frequency',
      'Most versatile HF band',
      'Worldwide communication possible'
    ],
    color: '#FBBF24'
  },
  {
    id: 'ham_20m',
    name: 'Ham Radio 20m',
    frequencyRange: [14.0e6, 14.35e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - HF band',
    capabilities: [
      'Most popular DX band',
      'Worldwide propagation during daylight',
      '14.074 MHz: FT8 digital mode hotspot',
      'Contests, DXpeditions, casual contacts'
    ],
    color: '#34D399'
  },
  {
    id: 'ham_10m',
    name: 'Ham Radio 10m',
    frequencyRange: [28.0e6, 29.7e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - HF band',
    capabilities: [
      'Long-distance during solar maximum',
      'FM repeaters 29.5-29.7 MHz',
      'Technician class license can use 28.0-28.5',
      'Sporadic-E propagation in summer'
    ],
    color: '#22D3EE'
  },
  {
    id: 'ham_6m',
    name: 'Ham Radio 6m',
    frequencyRange: [50e6, 54e6],
    modulation: 'Mixed',
    usage: 'Amateur radio - VHF',
    capabilities: [
      '"Magic band" - occasional long-distance',
      '50.125 MHz: SSB calling frequency',
      'Sporadic-E, meteor scatter, aurora',
      'FM simplex 52.525 MHz'
    ],
    color: '#818CF8'
  },
  {
    id: 'ham_2m',
    name: 'Ham Radio 2m',
    frequencyRange: [144e6, 148e6],
    modulation: 'FM',
    usage: 'Amateur radio - VHF',
    capabilities: [
      'Most popular VHF band',
      'FM repeaters for extended range',
      '146.52 MHz: National simplex calling',
      'APRS (position reporting) on 144.39',
      'Satellite communication',
      'ISS contacts on 145.8 MHz'
    ],
    color: '#C084FC'
  },
  {
    id: 'ham_70cm',
    name: 'Ham Radio 70cm',
    frequencyRange: [420e6, 450e6],
    modulation: 'FM',
    usage: 'Amateur radio - UHF',
    capabilities: [
      'FM repeaters, digital voice (DMR, D-STAR)',
      '446 MHz: Simplex calling',
      'Better building penetration than 2m',
      'Popular for handheld transceivers'
    ],
    color: '#F472B6'
  },
  {
    id: 'weather',
    name: 'NOAA Weather Radio',
    frequencyRange: [162.4e6, 162.55e6],
    modulation: 'FM',
    usage: 'Weather alerts and forecasts',
    channels: 7,
    channelSpacing: 25,
    capabilities: [
      'WX1: 162.550 MHz (most common)',
      'WX2: 162.400 MHz',
      '24/7 weather broadcasts',
      'SAME alerts for emergencies',
      'No license required to receive'
    ],
    color: '#60A5FA'
  },
  {
    id: 'frs',
    name: 'FRS (Family Radio Service)',
    frequencyRange: [462.5625e6, 462.7250e6],
    modulation: 'FM',
    usage: 'Short-range family/consumer radios',
    channels: 22,
    capabilities: [
      'No license required',
      'Range: 0.5-2 miles',
      'Shares channels with GMRS',
      'Low power (2W max)',
      'Popular for kids walkie-talkies'
    ],
    color: '#A3E635'
  },
  {
    id: 'gmrs',
    name: 'GMRS (General Mobile Radio)',
    frequencyRange: [462e6, 467e6],
    modulation: 'FM',
    usage: 'Personal/business two-way radio',
    channels: 30,
    capabilities: [
      'Requires FCC license ($35, 10 years)',
      'Higher power than FRS (5-50W)',
      'Repeater capable',
      'Range: 5-25 miles with repeater',
      'Family-shared license'
    ],
    color: '#4ADE80'
  },
  {
    id: 'public_safety_vhf',
    name: 'Public Safety VHF',
    frequencyRange: [150e6, 174e6],
    modulation: 'FM',
    usage: 'Police, fire, EMS communications',
    capabilities: [
      'Emergency services coordination',
      '155.160 MHz: Common police frequency',
      '154.28 MHz: Fire/EMS simplex',
      'Digital (P25) in many areas',
      'Legal to listen, illegal to transmit'
    ],
    color: '#EF4444'
  },
  {
    id: 'public_safety_uhf',
    name: 'Public Safety UHF',
    frequencyRange: [450e6, 512e6],
    modulation: 'FM',
    usage: 'Police, fire, EMS, government',
    capabilities: [
      'Better building penetration',
      'Trunked radio systems',
      'Digital encryption common',
      '453-458 MHz: Business/public safety mix'
    ],
    color: '#DC2626'
  },
  {
    id: 'wifi_2_4',
    name: 'WiFi 2.4 GHz',
    frequencyRange: [2.4e9, 2.5e9],
    modulation: 'Digital',
    usage: 'WiFi networks, Bluetooth, IoT',
    channels: 14,
    capabilities: [
      'Channels 1, 6, 11 non-overlapping',
      'Better wall penetration than 5GHz',
      'Bluetooth: 2.402-2.480 GHz',
      'ZigBee, IoT devices',
      'Microwave oven interference (2.45 GHz)'
    ],
    color: '#8B5CF6'
  },
  {
    id: 'wifi_5',
    name: 'WiFi 5 GHz',
    frequencyRange: [5.15e9, 5.875e9],
    modulation: 'Digital',
    usage: 'High-speed WiFi networks',
    channels: 24,
    capabilities: [
      'Less congestion than 2.4 GHz',
      'Higher throughput speeds',
      'Shorter range, poor wall penetration',
      'DFS channels (weather radar avoidance)'
    ],
    color: '#6366F1'
  }
];

// CB Radio Channels
export const CB_CHANNELS: ChannelInfo[] = Array.from({ length: 40 }, (_, i) => ({
  number: i + 1,
  frequency: 26.965e6 + (i * 10e3),
  name: `Channel ${i + 1}`,
  usage: i === 8 ? 'EMERGENCY' : i === 18 ? 'Highway Trucker' : 'General'
}));

// Marine VHF Channels
export const MARINE_CHANNELS: ChannelInfo[] = [
  { number: 16, frequency: 156.8e6, name: 'Channel 16', usage: 'DISTRESS & CALLING' },
  { number: 9, frequency: 156.45e6, name: 'Channel 9', usage: 'Boater Calling (alternate)' },
  { number: 13, frequency: 156.65e6, name: 'Channel 13', usage: 'Bridge-to-Bridge Navigation' },
  { number: 6, frequency: 156.3e6, name: 'Channel 6', usage: 'Intership Safety' },
  { number: 70, frequency: 156.525e6, name: 'Channel 70', usage: 'Digital Selective Calling' },
  { number: 22, frequency: 157.1e6, name: 'Channel 22A', usage: 'Coast Guard Liaison' },
  { number: 68, frequency: 156.425e6, name: 'Channel 68', usage: 'Marina/Non-commercial' },
  { number: 72, frequency: 156.625e6, name: 'Channel 72', usage: 'Ship-to-ship (non-commercial)' }
];

// NOAA Weather Channels
export const WEATHER_CHANNELS: ChannelInfo[] = [
  { number: 1, frequency: 162.550e6, name: 'WX1', usage: 'Most common' },
  { number: 2, frequency: 162.400e6, name: 'WX2', usage: 'Secondary' },
  { number: 3, frequency: 162.475e6, name: 'WX3', usage: 'Regional' },
  { number: 4, frequency: 162.425e6, name: 'WX4', usage: 'Regional' },
  { number: 5, frequency: 162.450e6, name: 'WX5', usage: 'Regional' },
  { number: 6, frequency: 162.500e6, name: 'WX6', usage: 'Regional' },
  { number: 7, frequency: 162.525e6, name: 'WX7', usage: 'Regional' }
];

export function formatFrequency(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}

export function getWavelength(hz: number): string {
  const wavelengthMeters = 299792458 / hz;
  if (wavelengthMeters >= 1) return `${wavelengthMeters.toFixed(1)}m`;
  if (wavelengthMeters >= 0.01) return `${(wavelengthMeters * 100).toFixed(1)}cm`;
  return `${(wavelengthMeters * 1000).toFixed(1)}mm`;
}

export function findBandForFrequency(hz: number): RadioBand | undefined {
  return RADIO_BANDS.find(band => 
    hz >= band.frequencyRange[0] && hz <= band.frequencyRange[1]
  );
}
