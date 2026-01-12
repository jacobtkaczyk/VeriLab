export interface Waveform {
    name: string;
    data: { time: number; value: number | string }[];
}

export const parseVCD = (vcdContent: string): Record<string, Waveform> => {
    const lines = vcdContent.split(/\r?\n/);
    const signals: Record<string, string> = {}; // ID -> FullName
    const waveforms: Record<string, Waveform> = {};

    let currentTime = 0;
    const scopeStack: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // --- Header Parsing ---
        if (line.startsWith("$scope")) {
            const parts = line.split(/\s+/);
            if (parts.length >= 3) scopeStack.push(parts[2]);
        }
        else if (line.startsWith("$upscope")) {
            scopeStack.pop();
        }
        else if (line.startsWith("$var")) {
            // Example: $var wire 1 ! A $end
            const parts = line.split(/\s+/);
            if (parts.length >= 5) {
                const id = parts[3];
                const name = parts[4];
                const fullName = [...scopeStack, name].join(".");

                signals[id] = fullName;
                waveforms[fullName] = { name: fullName, data: [] };
            }
        }

        // --- Data Parsing ---
        else if (line.startsWith("#")) {
            currentTime = parseInt(line.substring(1));
        }
        else {
            // Handle scalars: 0! or 1! or 0 !
            // We look for the first valid value character
            const firstChar = line.charAt(0);

            if (['0', '1', 'x', 'z', 'X', 'Z'].includes(firstChar)) {
                // The value is the first char
                const value = firstChar;
                // The ID is everything after the first char, TRIMMED
                const id = line.substring(1).trim();

                if (signals[id]) {
                    const sigName = signals[id];
                    const wave = waveforms[sigName];

                    // Avoid duplicate points at the same time (glitch suppression)
                    const len = wave.data.length;
                    if (len > 0 && wave.data[len - 1].time === currentTime) {
                        wave.data[len - 1].value = value;
                    } else {
                        wave.data.push({ time: currentTime, value });
                    }
                }
            }
        }
    }

    // Final Cleanup: Extend to simulation end
    // If a signal has data, extend the last value to the final timestamp found
    Object.values(waveforms).forEach(wave => {
        if (wave.data.length > 0) {
            const lastVal = wave.data[wave.data.length - 1].value;
            // Extend to at least the current time (end of sim)
            if (wave.data[wave.data.length - 1].time < currentTime) {
                wave.data.push({ time: currentTime, value: lastVal });
            }
        }
    });

    return waveforms;
};