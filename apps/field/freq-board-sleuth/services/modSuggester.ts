// Mod suggestion engine
import { ModSuggestion, BoardAnalysis } from '../types';

export class ModSuggester {
  // Generate mod suggestions based on board analysis
  generateMods(analysis: BoardAnalysis, goal?: string): ModSuggestion[] {
    const mods: ModSuggestion[] = [];

    // Check for microcontroller presence
    const hasMCU = analysis.components.some(c => c.category === 'ic' && c.name.includes('ATmega'));
    
    if (hasMCU) {
      mods.push({
        id: 'mod-freq-scan',
        title: 'Add RF Frequency Scanner',
        description: 'Attach Si4730 FM/AM radio chip to MCU for 64-108MHz scanning. Taps existing crystal for clock.',
        riskLevel: 'medium',
        components: ['Si4730 radio chip ($3 AliExpress)', '3.3V regulator', 'Antenna wire'],
        steps: [
          'Solder Si4730 to I2C pins (SDA/SCL on MCU)',
          'Power from 3.3V rail or add regulator if only 5V available',
          'Attach 30cm wire to RF_IN as antenna',
          'Flash firmware to scan and display frequencies',
        ],
        capabilities: ['FM/AM radio reception', 'Signal strength monitoring', 'RDS data decoding'],
        warnings: ['I2C address conflict possible—check existing devices', 'Antenna may pick up noise if near power lines'],
      });

      mods.push({
        id: 'mod-overclock',
        title: 'Overclock MCU to 20MHz',
        description: 'Replace 16MHz crystal with 20MHz for 25% speed boost. Requires cap tuning and cooling.',
        riskLevel: 'high',
        components: ['20MHz crystal', '22pF ceramic caps (x2)', 'Small heatsink'],
        steps: [
          'Desolder existing 16MHz crystal and load caps',
          'Solder 20MHz crystal + 22pF caps in same spots',
          'Add heatsink to MCU with thermal paste',
          'Update firmware fuse settings for 20MHz clock',
          'Test stability—may need voltage bump to 5.5V',
        ],
        capabilities: ['Faster code execution', 'Higher baud rates for serial', 'More responsive I/O'],
        warnings: [
          'EXTREME: Can fry MCU if voltage too low or heat buildup',
          'May violate timing specs—chips not guaranteed to work',
          'Power consumption increases ~25%',
        ],
      });

      mods.push({
        id: 'mod-sdr-attach',
        title: 'Attach RTL-SDR for Wide-Band Scanning',
        description: 'Wire RTL2832U chip to MCU via SPI for 24-1766MHz scanning. Ultimate freq hunter upgrade.',
        riskLevel: 'extreme',
        components: ['RTL2832U + R820T2 tuner module ($20)', 'USB-to-SPI bridge or bit-bang', '5V power tap'],
        steps: [
          'Connect RTL2832U SPI to MCU GPIO (MOSI/MISO/SCK)',
          'Power module from 5V rail—draw is ~300mA, check capacity',
          'Solder antenna to tuner RF input',
          'Flash SDR control firmware to MCU',
          'Stream FFT data to display or log',
        ],
        capabilities: [
          'Full spectrum 24-1766MHz (AM/FM/VHF/UHF)',
          'Waterfall plot visualization',
          'Decode digital modes (ADS-B, POCSAG, etc.)',
        ],
        warnings: [
          'CHAOS MODE: Complex wiring, easy to short',
          'High current draw may overload board PSU',
          'Firmware is advanced—expect bugs',
          'FCC compliance: Don\'t transmit without license',
        ],
      });
    }

    // General power tap mod
    mods.push({
      id: 'mod-power-tap',
      title: 'Safe Power Taps for External Devices',
      description: 'Identify and expose voltage rails for powering add-ons without main PSU load.',
      riskLevel: 'low',
      components: ['Jumper wires', 'Pin headers', 'Multimeter'],
      steps: [
        'Use multimeter to find 5V/3.3V/12V traces',
        'Solder pin headers to traces for easy connection',
        'Add 100µF cap near tap to stabilize if adding high-draw devices',
        'Label taps with voltage and max current',
      ],
      capabilities: ['Power external sensors/modules', 'No PSU modifications needed'],
      warnings: ['Check trace current capacity—thin traces = fire hazard if overloaded'],
    });

    return mods;
  }

  // Filter mods by risk level
  filterByRisk(mods: ModSuggestion[], maxRisk: 'low' | 'medium' | 'high' | 'extreme'): ModSuggestion[] {
    const riskOrder = ['low', 'medium', 'high', 'extreme'];
    const maxIndex = riskOrder.indexOf(maxRisk);
    return mods.filter(m => riskOrder.indexOf(m.riskLevel) <= maxIndex);
  }
}

export const modSuggester = new ModSuggester();
