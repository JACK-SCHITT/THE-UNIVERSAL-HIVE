// Electronic Component Code Decoder Service
// Decodes markings printed on PCB components

export type ComponentCodeCategory =
  | 'resistor_smd'
  | 'resistor_thru'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'transistor'
  | 'ic'
  | 'voltage_regulator'
  | 'crystal'
  | 'auto';

export interface DecodedComponent {
  category: ComponentCodeCategory;
  value: string;
  unit: string;
  tolerance?: string;
  description: string;
  details: Record<string, string>;
  hackNotes?: string;
}

// ─── Resistor Color Code ──────────────────────────────────────────────────────

const COLOR_CODES: Record<string, { digit: number; multiplier: number; tolerance?: string }> = {
  black:  { digit: 0, multiplier: 1 },
  brown:  { digit: 1, multiplier: 10,    tolerance: '±1%' },
  red:    { digit: 2, multiplier: 100,   tolerance: '±2%' },
  orange: { digit: 3, multiplier: 1000 },
  yellow: { digit: 4, multiplier: 10000 },
  green:  { digit: 5, multiplier: 100000,  tolerance: '±0.5%' },
  blue:   { digit: 6, multiplier: 1000000, tolerance: '±0.25%' },
  violet: { digit: 7, multiplier: 10000000, tolerance: '±0.1%' },
  grey:   { digit: 8, multiplier: 100000000, tolerance: '±0.05%' },
  white:  { digit: 9, multiplier: 1000000000 },
  gold:   { digit: -1, multiplier: 0.1, tolerance: '±5%' },
  silver: { digit: -1, multiplier: 0.01, tolerance: '±10%' },
  none:   { digit: -1, multiplier: 1, tolerance: '±20%' },
};

// ─── SMD Resistor E96 Table ────────────────────────────────────────────────────

const EIA96_CODES: Record<string, number> = {
  '01': 100, '02': 102, '03': 105, '04': 107, '05': 110, '06': 113, '07': 115,
  '08': 118, '09': 121, '10': 124, '11': 127, '12': 130, '13': 133, '14': 137,
  '15': 140, '16': 143, '17': 147, '18': 150, '19': 154, '20': 158, '21': 162,
  '22': 165, '23': 169, '24': 174, '25': 178, '26': 182, '27': 187, '28': 191,
  '29': 196, '30': 200, '31': 205, '32': 210, '33': 215, '34': 221, '35': 226,
  '36': 232, '37': 237, '38': 243, '39': 249, '40': 255, '41': 261, '42': 267,
  '43': 274, '44': 280, '45': 287, '46': 294, '47': 301, '48': 309, '49': 316,
  '50': 324, '51': 332, '52': 340, '53': 348, '54': 357, '55': 365, '56': 374,
  '57': 383, '58': 392, '59': 402, '60': 412, '61': 422, '62': 432, '63': 442,
  '64': 453, '65': 464, '66': 475, '67': 487, '68': 499, '69': 511, '70': 523,
  '71': 536, '72': 549, '73': 562, '74': 576, '75': 590, '76': 604, '77': 619,
  '78': 634, '79': 649, '80': 665, '81': 681, '82': 698, '83': 715, '84': 732,
  '85': 750, '86': 768, '87': 787, '88': 806, '89': 825, '90': 845, '91': 866,
  '92': 887, '93': 909, '94': 931, '95': 953, '96': 976,
};

const EIA96_MULTIPLIERS: Record<string, number> = {
  Z: 0.001, Y: 0.01, X: 0.1, A: 1, B: 10, C: 100, D: 1000, E: 10000, F: 100000,
};

// ─── Common ICs Database ──────────────────────────────────────────────────────

const IC_DATABASE: Record<string, { name: string; type: string; description: string; hackNotes: string }> = {
  'LM741':   { name: 'LM741', type: 'Op-Amp', description: 'General-purpose op-amp, vintage workhorse', hackNotes: 'Swap for TL071 for lower noise; pins compatible. Use as comparator, amplifier, filter stages.' },
  'LM358':   { name: 'LM358', type: 'Dual Op-Amp', description: 'Dual op-amp, low power, single supply capable', hackNotes: 'Two independent op-amps in one package. Wire as voltage followers to buffer sensors. Works 3.3V-32V.' },
  'LM324':   { name: 'LM324', type: 'Quad Op-Amp', description: 'Four op-amps in one DIP-14 package', hackNotes: 'Build multi-stage audio filters or 4-channel comparators. Each amp independent—only use what you need.' },
  'NE555':   { name: 'NE555 Timer', type: 'Timer IC', description: 'The legendary 555 timer chip', hackNotes: 'Astable mode: square wave oscillator; Monostable: one-shot trigger. Freq up to ~1MHz. Slap between any logic circuit.' },
  'NE556':   { name: 'NE556', type: 'Dual 555 Timer', description: 'Two 555 timers in one DIP-14 package', hackNotes: 'Two independent timers—chain for PWM+ pulse delay or dual-frequency oscillator. Pin-compatible with two NE555s.' },
  'TL071':   { name: 'TL071', type: 'FET Op-Amp', description: 'Low-noise JFET-input op-amp', hackNotes: 'Better noise floor than LM741 for audio. Biased for ±15V but works ±5V. Use in mic preamp or audio filter builds.' },
  'TL072':   { name: 'TL072', type: 'Dual FET Op-Amp', description: 'Dual low-noise JFET op-amp', hackNotes: 'Stereo audio circuits, differential input stages. Pin 4 to negative supply, pin 8 to positive.' },
  'LM393':   { name: 'LM393', type: 'Dual Comparator', description: 'Dual voltage comparator, open-collector output', hackNotes: 'Needs pull-up resistor on output. Use as threshold detector for sensors, zero-crossing detector for AC signals.' },
  'LM741C':  { name: 'LM741C', type: 'Op-Amp', description: 'Commercial grade LM741', hackNotes: 'Same as LM741. Good test bed for analog experiments—will survive abuse better than modern rail-to-rail chips.' },
  'ATmega328': { name: 'ATmega328P', type: 'Microcontroller', description: 'Arduino Uno brain—8-bit AVR, 32KB flash', hackNotes: 'Full Arduino-compatible MCU. 23 GPIO, 6 ADC, SPI/I2C/UART. Flash with avrdude; expand with any sensor on the market.' },
  'ATtiny85': { name: 'ATtiny85', type: 'Microcontroller', description: 'Tiny 8-pin AVR microcontroller', hackNotes: 'Smallest useful AVR—5 I/O pins, 8KB flash, hardware PWM. Program via Arduino as ISP. Excellent for compact builds.' },
  'PIC16F877': { name: 'PIC16F877A', type: 'Microcontroller', description: 'Popular 8-bit PIC MCU', hackNotes: 'MPLAB or Arduino-PIC toolchain. 8x ADC channels useful for multi-sensor analog reads.' },
  'ESP8266':  { name: 'ESP8266', type: 'WiFi Module', description: '802.11 WiFi + microcontroller combo', hackNotes: 'Reprogram with Arduino IDE. Full TCP/IP stack at 3.3V. Tap existing 3.3V rail—if board is 5V, add AMS1117-3.3 regulator.' },
  'ESP32':    { name: 'ESP32', type: 'WiFi+BT Module', description: 'Dual-core WiFi/Bluetooth SoC', hackNotes: 'WiFi + BLE + 34 GPIO + 18 ADC channels. Reprogram with ESP-IDF or Arduino. Requires 3.3V, 500mA peak—dedicated regulator recommended.' },
  'SN74HC245': { name: 'SN74HC245', type: 'Bus Transceiver', description: '8-bit bidirectional bus transceiver', hackNotes: 'OE pin (active low) controls output enable—great for multiplexing data buses. DIR pin flips data direction.' },
  'ULN2003':  { name: 'ULN2003A', type: 'Darlington Array', description: '7-channel 500mA Darlington transistor array', hackNotes: 'Drive stepper motors, relays, or LEDs from logic signals. Input: 5V logic. Output: up to 50V/500mA per channel. Built-in flyback diodes.' },
  'L293D':    { name: 'L293D', type: 'H-Bridge Driver', description: 'Dual H-bridge motor driver, 1A per channel', hackNotes: 'Drives two DC motors bidirectionally or one stepper motor. Logic supply 5V, motor supply up to 36V separately.' },
  'MAX232':   { name: 'MAX232', type: 'RS-232 Level Converter', description: 'RS-232 to TTL voltage converter', hackNotes: 'Converts ±12V RS-232 to 3.3V/5V TTL. If board talks serial, this is the gateway. Probe TX pin for data stream.' },
  'CD4017':   { name: 'CD4017', type: 'Decade Counter', description: '10-stage Johnson counter with 10 decoded outputs', hackNotes: 'Feed clock pulses to cycle through 10 outputs sequentially—LED sequencers, multiplexed displays. 3V-15V supply range.' },
  'CD4066':   { name: 'CD4066', type: 'Quad Analog Switch', description: '4 independent CMOS analog switches', hackNotes: 'Route audio or analog signals electronically. Control with 5V logic. Each switch handles signals from GND to Vdd.' },
};

const VOLTAGE_REGULATORS: Record<string, { output: string; type: string; description: string; hackNotes: string }> = {
  '7805': { output: '+5V', type: 'Linear Regulator', description: 'LM7805 — +5V 1A positive regulator', hackNotes: 'Needs 7V+ input for stable 5V out. Heatsink if drawing >200mA. Output pins 1=in, 2=GND, 3=out.' },
  '7812': { output: '+12V', type: 'Linear Regulator', description: 'LM7812 — +12V 1A positive regulator', hackNotes: 'Needs 14V+ input. 12V rail for fans, motors, relay coils. Adjust with resistor divider between out and GND for custom voltages.' },
  '7815': { output: '+15V', type: 'Linear Regulator', description: 'LM7815 — +15V 1A positive regulator', hackNotes: 'Op-amp dual-supply builds. Add 7915 for ±15V split rail for audio circuits.' },
  '7905': { output: '-5V', type: 'Linear Regulator', description: 'LM7905 — -5V 1A negative regulator', hackNotes: 'Negative rail for op-amp circuits. Pin out REVERSED vs positive series—check datasheet before assuming.' },
  '7912': { output: '-12V', type: 'Linear Regulator', description: 'LM7912 — -12V 1A negative regulator', hackNotes: 'Pairs with 7812 for ±12V split supply. Essential for audio preamp/mixer builds.' },
  'AMS1117': { output: '3.3V/5V', type: 'LDO Regulator', description: 'AMS1117 — Low-dropout regulator, multiple versions', hackNotes: 'AMS1117-3.3 is the ESP8266/ESP32 power supply chip. Requires only 1.2V dropout. 800mA max—add bulk cap 10µF+.' },
  'LM317':   { output: 'Adjustable', type: 'Linear Regulator', description: 'LM317 — Adjustable positive regulator 1.2V-37V', hackNotes: 'Set output with two resistors: Vout = 1.25 * (1 + R2/R1). 1.5A max. Most versatile regulator ever made.' },
  'LM337':   { output: 'Adjustable', type: 'Linear Regulator', description: 'LM337 — Adjustable negative regulator', hackNotes: 'Negative version of LM317. Same resistor formula with negative voltages. Pair with LM317 for split adjustable supply.' },
};

const TRANSISTOR_DB: Record<string, { type: string; polarity: string; description: string; hackNotes: string }> = {
  '2N2222': { type: 'BJT', polarity: 'NPN', description: 'General purpose NPN, 600mA, 30V', hackNotes: 'Switch up to 600mA loads with 5mA base current. Classic logic-to-motor interface. Hfe ~100-300.' },
  '2N2907': { type: 'BJT', polarity: 'PNP', description: 'General purpose PNP, 600mA, 40V', hackNotes: 'Complement to 2N2222. High-side switch—emitter to +V, collector to load, base pulls low to activate.' },
  '2N3904': { type: 'BJT', polarity: 'NPN', description: 'Small signal NPN, 200mA, 40V', hackNotes: 'Ubiquitous signal transistor. Use as audio amplifier, LED driver, logic inverter. Hfe 100-300.' },
  '2N3906': { type: 'BJT', polarity: 'PNP', description: 'Small signal PNP, 200mA, 40V', hackNotes: 'Complement to 2N3906. Low-side control with PNP high-side gives full push-pull output.' },
  'BC547':  { type: 'BJT', polarity: 'NPN', description: 'European small signal NPN, 100mA, 45V', hackNotes: 'European standard for 2N3904 equivalent. Pinout: EBC vs 2N3904 CBE—watch the pinout difference!' },
  'BC557':  { type: 'BJT', polarity: 'PNP', description: 'European small signal PNP, 100mA, 45V', hackNotes: 'PNP complement to BC547. Same pinout reversal warning applies.' },
  'TIP31':  { type: 'BJT', polarity: 'NPN', description: 'Medium power NPN, 3A, 40V, TO-220', hackNotes: 'TO-220 package—bolt to heatsink. Drive motors up to 3A, solenoids, high-current LEDs. Hfe ~10-50.' },
  'TIP41':  { type: 'BJT', polarity: 'NPN', description: 'Power NPN, 6A, 40V, TO-220', hackNotes: 'Heavy-duty switching. 6A, 65W with heatsink. Base needs ~120mA for saturation—drive from ULN2003 or small transistor stage.' },
  'IRF540': { type: 'MOSFET', polarity: 'N-Channel', description: 'N-channel power MOSFET, 28A, 100V', hackNotes: 'Logic-level gate control, switches 28A. Fully on with 10V Vgs; partial turn-on at 5V. Zero gate current when static.' },
  'IRF9540': { type: 'MOSFET', polarity: 'P-Channel', description: 'P-channel power MOSFET, 23A, 100V', hackNotes: 'High-side switch. Gate must pull BELOW source to activate. Pair with IRF540 for CMOS-style push-pull output.' },
};

// ─── Capacitor Codes ───────────────────────────────────────────────────────────

const CAP_TOLERANCE_CODES: Record<string, string> = {
  B: '±0.1pF', C: '±0.25pF', D: '±0.5pF', E: '±0.5%', F: '±1%',
  G: '±2%', H: '±3%', J: '±5%', K: '±10%', M: '±20%',
  N: '±30%', P: '+100/-0%', S: '+50/-20%', W: '+200/-0%', Z: '+80/-20%',
};

const CAP_VOLTAGE_CODES: Record<string, string> = {
  G: '4V', J: '6.3V', A: '10V', C: '16V', D: '20V', E: '25V',
  V: '35V', H: '50V', B: '63V', T: '80V', F: '100V',
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

function formatOhms(value: number): { value: string; unit: string } {
  if (value >= 1_000_000) return { value: (value / 1_000_000).toFixed(2).replace(/\.00$/, ''), unit: 'MΩ' };
  if (value >= 1_000) return { value: (value / 1_000).toFixed(2).replace(/\.00$/, ''), unit: 'kΩ' };
  return { value: value.toFixed(2).replace(/\.00$/, ''), unit: 'Ω' };
}

function formatFarads(pF: number): { value: string; unit: string } {
  if (pF >= 1_000_000) return { value: (pF / 1_000_000).toFixed(2).replace(/\.00$/, ''), unit: 'µF' };
  if (pF >= 1_000) return { value: (pF / 1_000).toFixed(2).replace(/\.00$/, ''), unit: 'nF' };
  return { value: pF.toFixed(2).replace(/\.00$/, ''), unit: 'pF' };
}

function formatHenry(nH: number): { value: string; unit: string } {
  if (nH >= 1_000_000) return { value: (nH / 1_000_000).toFixed(2).replace(/\.00$/, ''), unit: 'mH' };
  if (nH >= 1_000) return { value: (nH / 1_000).toFixed(2).replace(/\.00$/, ''), unit: 'µH' };
  return { value: nH.toFixed(2).replace(/\.00$/, ''), unit: 'nH' };
}

// ─── Decoder Functions ─────────────────────────────────────────────────────────

function decodeSMDResistor(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase();

  // EIA-96 format: 2 digits + letter (e.g., 01A = 100Ω)
  const eia96Match = upper.match(/^([0-9]{2})([A-Z])$/);
  if (eia96Match) {
    const numCode = eia96Match[1];
    const multLetter = eia96Match[2];
    const base = EIA96_CODES[numCode];
    const mult = EIA96_MULTIPLIERS[multLetter];
    if (base && mult !== undefined) {
      const resistanceOhms = base * mult;
      const { value, unit } = formatOhms(resistanceOhms);
      return {
        category: 'resistor_smd',
        value,
        unit,
        tolerance: '±1%',
        description: `SMD Resistor (EIA-96): ${value} ${unit}`,
        details: {
          'Code': upper,
          'Base Value': `${base}`,
          'Multiplier': `×${mult}`,
          'Resistance': `${value} ${unit}`,
          'Tolerance': '±1%',
          'Standard': 'EIA-96 1% Series',
        },
        hackNotes: `${value} ${unit} resistor. In series = voltage divider, voltage drop/current limit. In feedback = sets op-amp gain. In parallel with cap = RC filter.`,
      };
    }
  }

  // 4-digit SMD: e.g., 1002 → first 3 digits value, last digit multiplier
  const fourDigitMatch = upper.match(/^([0-9]{3})([0-9])$/);
  if (fourDigitMatch) {
    const digits = parseInt(fourDigitMatch[1]);
    const mult = Math.pow(10, parseInt(fourDigitMatch[2]));
    const ohms = digits * mult;
    const { value, unit } = formatOhms(ohms);
    return {
      category: 'resistor_smd',
      value,
      unit,
      tolerance: '±1%',
      description: `SMD Resistor (4-digit): ${value} ${unit}`,
      details: {
        'Code': upper,
        'Resistance': `${value} ${unit}`,
        'Tolerance': '±1% (typical)',
        'Standard': '4-Digit SMD Code',
      },
      hackNotes: `${value} ${unit} — 4-digit = tighter 1% tolerance. Typical on precision circuits. Swap with ±1% through-hole equivalent if replacing.`,
    };
  }

  // 3-digit SMD: e.g., 102 → first 2 digits + multiplier
  // Special: R notation (e.g., 4R7 = 4.7Ω, 0R1 = 0.1Ω)
  const rNotation = upper.match(/^([0-9]+)R([0-9]+)$/);
  if (rNotation) {
    const ohms = parseFloat(`${rNotation[1]}.${rNotation[2]}`);
    const { value, unit } = formatOhms(ohms);
    return {
      category: 'resistor_smd',
      value,
      unit,
      tolerance: '±5%',
      description: `SMD Resistor (R-notation): ${value} ${unit}`,
      details: { 'Code': upper, 'Resistance': `${value} ${unit}`, 'Format': 'R-notation (decimal)' },
      hackNotes: `Low-value resistor ${value} ${unit}. Often used as current sense shunts or source degeneration. Measure actual value with multimeter.`,
    };
  }

  const threeDigitMatch = upper.match(/^([0-9]{2})([0-9])$/);
  if (threeDigitMatch) {
    const digits = parseInt(threeDigitMatch[1]);
    const mult = Math.pow(10, parseInt(threeDigitMatch[2]));
    const ohms = digits * mult;
    const { value, unit } = formatOhms(ohms);
    return {
      category: 'resistor_smd',
      value,
      unit,
      tolerance: '±5%',
      description: `SMD Resistor: ${value} ${unit}`,
      details: {
        'Code': upper,
        'Resistance': `${value} ${unit}`,
        'Tolerance': '±5% (typical)',
        'Standard': '3-Digit SMD Code',
      },
      hackNotes: `${value} ${unit} — standard ±5% SMD. Replace with next standard E24 value if needed. Series pair for exact non-standard values.`,
    };
  }

  return null;
}

function decodeColorBandResistor(bands: string[]): DecodedComponent | null {
  if (bands.length < 3) return null;

  const normalizedBands = bands.map(b => b.toLowerCase().trim());
  const tolerance = normalizedBands.length >= 4
    ? COLOR_CODES[normalizedBands[normalizedBands.length - 1]]?.tolerance || '±20%'
    : '±20%';

  const significantBands = normalizedBands.slice(0, normalizedBands.length - 1);
  const multiplierBand = normalizedBands.length === 4
    ? normalizedBands[2]
    : normalizedBands[3];

  const digits = significantBands.slice(0, -1);
  const allValid = digits.every(d => COLOR_CODES[d] && COLOR_CODES[d].digit >= 0);
  if (!allValid) return null;

  let value = 0;
  digits.forEach((d, i) => {
    value = value * 10 + (COLOR_CODES[d]?.digit ?? 0);
  });

  const multiplier = COLOR_CODES[multiplierBand]?.multiplier;
  if (multiplier === undefined) return null;

  const ohms = value * multiplier;
  const { value: v, unit } = formatOhms(ohms);

  return {
    category: 'resistor_thru',
    value: v,
    unit,
    tolerance,
    description: `Through-hole Resistor: ${v} ${unit} ${tolerance}`,
    details: {
      'Resistance': `${v} ${unit}`,
      'Tolerance': tolerance,
      'Bands': bands.join(' / '),
    },
    hackNotes: `${v} ${unit} through-hole. Safe to hand-solder. Can sub any ±1% or ±5% equivalent. Series/parallel combos hit non-standard values.`,
  };
}

function decodeCapacitor(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase();

  // Electrolytic: value directly in µF (e.g., "100µF 16V" or "100 16V")
  const electrolyticMatch = upper.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:UF|µF|MF)?\s*([0-9]+(?:\.[0-9]+)?)\s*V/i);
  if (electrolyticMatch) {
    const capacitance = parseFloat(electrolyticMatch[1]);
    const voltage = parseFloat(electrolyticMatch[2]);
    return {
      category: 'capacitor',
      value: `${capacitance}`,
      unit: 'µF',
      description: `Electrolytic Capacitor: ${capacitance}µF ${voltage}V`,
      details: {
        'Capacitance': `${capacitance} µF`,
        'Voltage Rating': `${voltage}V`,
        'Type': 'Electrolytic (polarized)',
      },
      hackNotes: `POLARIZED—long leg/stripe is negative. Check polarity before powering. Bloated cap = replace immediately. Swap for 2× voltage rating for longevity. Discharge before touching: ${voltage}V stored can bite.`,
    };
  }

  // Standard 3-digit ceramic code + optional tolerance letter (e.g., 104, 104K, 102J)
  const ceramicMatch = upper.match(/^([0-9]{2})([0-9])([A-Z]?)$/);
  if (ceramicMatch) {
    const digits = parseInt(ceramicMatch[1]);
    const mult = Math.pow(10, parseInt(ceramicMatch[2]));
    const tolCode = ceramicMatch[3];
    const pF = digits * mult;
    const { value, unit } = formatFarads(pF);
    const tolerance = tolCode ? CAP_TOLERANCE_CODES[tolCode] || '' : '';

    return {
      category: 'capacitor',
      value,
      unit,
      tolerance,
      description: `Ceramic Capacitor: ${value} ${unit}${tolerance ? ` ${tolerance}` : ''}`,
      details: {
        'Code': upper,
        'Capacitance': `${value} ${unit}`,
        'In pF': `${pF} pF`,
        ...(tolerance && { 'Tolerance': tolerance }),
        'Type': 'Ceramic (non-polarized)',
      },
      hackNotes: `Non-polarized—any orientation. ${value} ${unit} ceramic. Bypass cap on power rails: 0.1µF (104) = standard decoupling, place within 5mm of IC Vcc pin. Ceramic caps drift with temperature; use C0G for precision circuits.`,
    };
  }

  // Picofarad direct value with letter codes (e.g., 4n7 = 4.7nF)
  const nfMatch = upper.match(/^([0-9]+)N([0-9]*)$/);
  if (nfMatch) {
    const nF = parseFloat(`${nfMatch[1]}.${nfMatch[2] || '0'}`);
    const { value, unit } = formatFarads(nF * 1000);
    return {
      category: 'capacitor',
      value,
      unit,
      description: `Capacitor: ${value} ${unit}`,
      details: { 'Capacitance': `${value} ${unit}`, 'Format': 'n-notation' },
      hackNotes: `${value} ${unit} — timing capacitor range. RC filter cutoff: f = 1/(2π×R×C). In 555 timer circuits, this sets oscillation frequency.`,
    };
  }

  return null;
}

function decodeInductor(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase();

  // 3-digit code like resistor but value in µH (e.g., 101 = 100µH)
  const inductorMatch = upper.match(/^([0-9]{2})([0-9])([A-Z]?)$/);
  if (inductorMatch) {
    const digits = parseInt(inductorMatch[1]);
    const mult = Math.pow(10, parseInt(inductorMatch[2]));
    const nH = digits * mult;
    const { value, unit } = formatHenry(nH);

    return {
      category: 'inductor',
      value,
      unit,
      description: `Inductor: ${value} ${unit}`,
      details: {
        'Code': upper,
        'Inductance': `${value} ${unit}`,
        'Type': 'SMD Inductor',
      },
      hackNotes: `${value} ${unit} inductor. Choke high-frequency noise on power lines; part of LC filters and DC-DC converters. Measure DC resistance—higher than spec means near saturation. Do NOT short a powered inductor—inductive kick = voltage spike.`,
    };
  }

  return null;
}

function decodeVoltageRegulator(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase().replace(/^LM/, '').replace(/^UA/, '');

  for (const [key, reg] of Object.entries(VOLTAGE_REGULATORS)) {
    if (upper.startsWith(key) || upper === key) {
      return {
        category: 'voltage_regulator',
        value: reg.output,
        unit: '',
        description: reg.description,
        details: {
          'Part': code.toUpperCase(),
          'Output': reg.output,
          'Type': reg.type,
          'Max Current': '1A (typical)',
        },
        hackNotes: reg.hackNotes,
      };
    }
  }
  return null;
}

function decodeIC(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase().replace(/^(UA|SG|ST|SGS|LM|TI|NSC)/i, '');

  for (const [key, ic] of Object.entries(IC_DATABASE)) {
    const cleanKey = key.replace('LM', '').replace('NE', '').replace('TL', '');
    if (upper.includes(key) || upper.includes(cleanKey)) {
      return {
        category: 'ic',
        value: ic.name,
        unit: '',
        description: ic.description,
        details: {
          'Part Number': code.toUpperCase(),
          'Full Name': ic.name,
          'Type': ic.type,
        },
        hackNotes: ic.hackNotes,
      };
    }
  }

  // Generic IC prefix identification
  if (upper.startsWith('74')) {
    return {
      category: 'ic',
      value: code.toUpperCase(),
      unit: '',
      description: `74xx Series Logic IC — ${code.toUpperCase()}`,
      details: {
        'Part': code.toUpperCase(),
        'Family': '74xx CMOS/TTL Logic',
        'Series': code.length > 4 ? code.substring(0, 4).toUpperCase() : code.toUpperCase(),
      },
      hackNotes: '74xx = standard logic family. HC = high-speed CMOS (3.3V-5V), LS = low-power Schottky, HCT = 5V TTL-compatible. Logic gates, flip-flops, counters, decoders—backbone of digital circuits.',
    };
  }

  if (upper.startsWith('CD40') || upper.startsWith('CD45')) {
    return {
      category: 'ic',
      value: code.toUpperCase(),
      unit: '',
      description: `CD4xxx Series CMOS Logic — ${code.toUpperCase()}`,
      details: {
        'Part': code.toUpperCase(),
        'Family': 'CD4000 CMOS Logic',
      },
      hackNotes: 'CD4xxx = classic CMOS, works 3V-18V. Extremely versatile for linear/analog circuits too. CD4046 = PLL, CD4051 = 8-ch mux, CD4060 = oscillator+counter.',
    };
  }

  return null;
}

function decodeTransistor(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase();

  for (const [key, tr] of Object.entries(TRANSISTOR_DB)) {
    if (upper === key || upper.startsWith(key)) {
      return {
        category: 'transistor',
        value: key,
        unit: '',
        description: `${tr.polarity} ${tr.type} — ${tr.description}`,
        details: {
          'Part': code.toUpperCase(),
          'Type': tr.type,
          'Polarity': tr.polarity,
        },
        hackNotes: tr.hackNotes,
      };
    }
  }

  // Generic transistor identification
  if (upper.match(/^2N[0-9]+/)) {
    return {
      category: 'transistor',
      value: code.toUpperCase(),
      unit: '',
      description: `2N-Series BJT Transistor`,
      details: { 'Part': code.toUpperCase(), 'Family': 'JEDEC 2N-series BJT' },
      hackNotes: 'JEDEC 2N series — lookup datasheet for Ic, Vce, Hfe. Generally: even numbers = NPN, but not always. Check polarity with multimeter in diode mode.',
    };
  }

  if (upper.match(/^BC[0-9]+/)) {
    const num = parseInt(upper.replace('BC', ''));
    const polarity = num < 300 ? 'NPN' : num < 600 ? 'PNP' : 'Unknown';
    return {
      category: 'transistor',
      value: code.toUpperCase(),
      unit: '',
      description: `European BC-Series ${polarity} BJT`,
      details: { 'Part': code.toUpperCase(), 'Family': 'European BC-series', 'Likely Polarity': polarity },
      hackNotes: `BC${num}: European small-signal BJT. Pinout: Collector-Base-Emitter (CBE), opposite of US 2N series (EBC). Measure with multimeter to confirm NPN/PNP.`,
    };
  }

  if (upper.match(/^IRF[0-9]+/)) {
    return {
      category: 'transistor',
      value: code.toUpperCase(),
      unit: '',
      description: 'International Rectifier N-Channel Power MOSFET',
      details: { 'Part': code.toUpperCase(), 'Type': 'N-Channel MOSFET', 'Package': 'TO-220 or D2PAK' },
      hackNotes: 'IRF series N-MOSFET. Gate needs 10V for full turn-on; 4.5V for logic-level versions (IRLZ series). Zero gate current when static. Heatsink for >5W dissipation.',
    };
  }

  return null;
}

function decodeDiode(code: string): DecodedComponent | null {
  const upper = code.trim().toUpperCase();

  const diodeCodes: Record<string, { name: string; description: string; hackNotes: string }> = {
    '1N4001': { name: '1N4001', description: 'Rectifier diode, 1A, 50V', hackNotes: 'AC to DC rectification. Forward voltage drop ~0.7V—accounts for voltage loss in supply rails. Replace with Schottky for less drop (0.3V).' },
    '1N4007': { name: '1N4007', description: 'Rectifier diode, 1A, 1000V', hackNotes: 'High voltage rectifier. Same as 1N4001 but handles 1kV PIV. Overkill for most low-voltage builds but excellent free flyback diode on relays/motors.' },
    '1N4148': { name: '1N4148', description: 'Signal diode, 200mA, 75V, fast switching', hackNotes: 'Fast switching diode (4ns). Use in logic clamping circuits, signal routing, demodulators. Lower capacitance than rectifier diodes—better for RF.' },
    '1N5817': { name: '1N5817', description: 'Schottky rectifier, 1A, 20V', hackNotes: 'Schottky — only 0.2V forward drop vs 0.7V for silicon. Essential for battery charging, solar, and high-efficiency power circuits.' },
    '1N5819': { name: '1N5819', description: 'Schottky rectifier, 1A, 40V', hackNotes: 'Same as 1N5817 but higher voltage. Reverse-polarity protection without the 0.7V penalty. Must-have for battery projects.' },
    'LED':    { name: 'LED', description: 'Light Emitting Diode', hackNotes: 'Forward voltage: red/yellow ~1.8-2.2V, green/blue/white ~3.0-3.5V. Always use current limiting resistor: R = (Vcc - Vf) / If. Typical If = 10-20mA.' },
    'ZENER':  { name: 'Zener Diode', description: 'Voltage reference/clamp diode', hackNotes: 'Reverse-biased at specific voltage (marked on body: 3V3, 5V1, etc.). Used as voltage reference or clamp. Wire cathode to higher voltage in voltage divider circuit.' },
  };

  for (const [key, diode] of Object.entries(diodeCodes)) {
    if (upper === key || upper.startsWith(key)) {
      return {
        category: 'diode',
        value: diode.name,
        unit: '',
        description: diode.description,
        details: { 'Part': code.toUpperCase() },
        hackNotes: diode.hackNotes,
      };
    }
  }

  // Generic 1N series
  if (upper.match(/^1N[0-9]+/)) {
    return {
      category: 'diode',
      value: code.toUpperCase(),
      unit: '',
      description: 'JEDEC 1N-series diode',
      details: { 'Part': code.toUpperCase(), 'Family': 'JEDEC 1N-Series' },
      hackNotes: 'Look up datasheet for forward voltage, max current, PIV. Always: cathode = stripe = connects to + side for rectification. Check with multimeter diode mode—should read ~0.3-0.7V forward.',
    };
  }

  return null;
}

function decodeCrystal(code: string): DecodedComponent | null {
  const freqMatch = code.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(MHz|KHz|kHz|mhz|khz)$/i);
  if (freqMatch) {
    const freq = parseFloat(freqMatch[1]);
    const unit = freqMatch[2].toUpperCase();
    return {
      category: 'crystal',
      value: `${freq}`,
      unit,
      description: `Crystal Oscillator: ${freq} ${unit}`,
      details: {
        'Frequency': `${freq} ${unit}`,
        'Type': 'Quartz Crystal',
        'Load Capacitance': '12-22pF (typical)',
      },
      hackNotes: `${freq} ${unit} crystal — sets clock frequency for MCU or oscillator circuit. Replace crystal to change system clock (within tolerance of MCU datasheet). Needs ~22pF load caps on each pin to oscillate properly.`,
    };
  }
  return null;
}

// ─── Auto-Detect ───────────────────────────────────────────────────────────────

function autoDetect(code: string): DecodedComponent | null {
  const trim = code.trim().toUpperCase();

  // Try IC/transistor/diode database first (specific matches beat generic)
  const icResult = decodeIC(trim);
  if (icResult) return icResult;

  const trResult = decodeTransistor(trim);
  if (trResult) return trResult;

  const diodeResult = decodeDiode(trim);
  if (diodeResult) return diodeResult;

  const vrResult = decodeVoltageRegulator(trim);
  if (vrResult) return vrResult;

  const crystalResult = decodeCrystal(trim);
  if (crystalResult) return crystalResult;

  // Capacitor check before SMD resistor (3-digit with µF/V markers)
  const capResult = decodeCapacitor(trim);
  if (capResult) return capResult;

  // SMD resistor (3 or 4 digits, EIA-96)
  const smdResult = decodeSMDResistor(trim);
  if (smdResult) return smdResult;

  return null;
}

// ─── Main Decoder Export ───────────────────────────────────────────────────────

class ComponentCodeDecoder {
  decode(code: string, category: ComponentCodeCategory = 'auto'): DecodedComponent | null {
    if (!code || code.trim().length === 0) return null;

    switch (category) {
      case 'resistor_smd':
        return decodeSMDResistor(code);
      case 'resistor_thru':
        return null; // Color bands handled separately via decodeColorBands
      case 'capacitor':
        return decodeCapacitor(code);
      case 'inductor':
        return decodeInductor(code);
      case 'diode':
        return decodeDiode(code);
      case 'transistor':
        return decodeTransistor(code);
      case 'ic':
        return decodeIC(code);
      case 'voltage_regulator':
        return decodeVoltageRegulator(code);
      case 'crystal':
        return decodeCrystal(code);
      default:
        return autoDetect(code);
    }
  }

  decodeColorBands(bands: string[]): DecodedComponent | null {
    return decodeColorBandResistor(bands);
  }

  getColorOptions(): string[] {
    return Object.keys(COLOR_CODES);
  }

  getCategoryLabel(cat: ComponentCodeCategory): string {
    const labels: Record<ComponentCodeCategory, string> = {
      auto: 'AUTO',
      resistor_smd: 'SMD RESISTOR',
      resistor_thru: 'THRU-HOLE RESISTOR',
      capacitor: 'CAPACITOR',
      inductor: 'INDUCTOR',
      diode: 'DIODE',
      transistor: 'TRANSISTOR',
      ic: 'IC / CHIP',
      voltage_regulator: 'VOLT. REG.',
      crystal: 'CRYSTAL',
    };
    return labels[cat];
  }

  getExamples(cat: ComponentCodeCategory): string[] {
    const examples: Record<ComponentCodeCategory, string[]> = {
      auto: ['NE555', '104', '2N2222', '7805', '10MHz'],
      resistor_smd: ['102', '1002', '4R7', '01A'],
      resistor_thru: ['brown black red gold'],
      capacitor: ['104', '104K', '100uF 16V'],
      inductor: ['101', '472'],
      diode: ['1N4148', '1N5819'],
      transistor: ['2N2222', 'BC547', 'IRF540'],
      ic: ['NE555', 'LM741', 'ATmega328'],
      voltage_regulator: ['7805', 'LM317', 'AMS1117'],
      crystal: ['16MHz', '32.768kHz'],
    };
    return examples[cat] || [];
  }
}

export const componentCodeDecoder = new ComponentCodeDecoder();
export { decodeColorBandResistor };
