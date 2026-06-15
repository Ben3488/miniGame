/* ==========================================================================
   White Noise Workspace Audio Engine & Controls (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    let audioCtx = null;
    let masterGain = null;
    let isPlaying = false;

    // Sound configuration object
    const sounds = {
        white: {
            volume: 0.3,
            active: true,
            sourceNode: null,
            gainNode: null,
            type: 'synth',
            setup: createWhiteNoise
        },
        brown: {
            volume: 0.3,
            active: true,
            sourceNode: null,
            gainNode: null,
            type: 'synth',
            setup: createBrownNoise
        },
        rain: {
            volume: 0.0,
            active: false,
            sourceNode: null,
            gainNode: null,
            type: 'env',
            setup: createRain
        },
        waves: {
            volume: 0.0,
            active: false,
            sourceNode: null,
            gainNode: null,
            type: 'env',
            setup: createWaves
        },
        wind: {
            volume: 0.0,
            active: false,
            sourceNode: null,
            gainNode: null,
            type: 'env',
            setup: createWind
        },
        campfire: {
            volume: 0.0,
            active: false,
            sourceNode: null,
            gainNode: null,
            type: 'env',
            setup: createCampfire
        },
        cafe: {
            volume: 0.0,
            active: false,
            sourceNode: null,
            gainNode: null,
            type: 'env',
            setup: createCafe
        }
    };

    // Shared Noise Buffers (generated once when AudioContext is initialized)
    let buffers = {
        white: null,
        brown: null,
        pink: null,
        crackle: null,
        cafe: null
    };

    // UI elements
    const btnMasterToggle = document.getElementById('btn-master-toggle');
    const pulseIndicator = document.getElementById('pulse-indicator');
    const soundCards = document.querySelectorAll('.sound-card');

    // Initialize UI states
    soundCards.forEach(card => {
        const soundKey = card.getAttribute('data-sound');
        const sound = sounds[soundKey];
        const toggleBtn = card.querySelector('.btn-sound-toggle');
        const slider = card.querySelector('.volume-slider');
        const pctText = card.querySelector('.volume-pct');

        // Apply config
        slider.value = sound.volume * 100;
        pctText.textContent = `${Math.round(sound.volume * 100)}%`;
        
        if (sound.active && sound.volume > 0) {
            card.classList.add('active');
            toggleBtn.textContent = '🔊';
        } else {
            card.classList.remove('active');
            toggleBtn.textContent = '🔇';
            sound.active = false;
        }

        // Slider change handler
        slider.addEventListener('input', () => {
            const vol = parseFloat(slider.value) / 100;
            sound.volume = vol;
            pctText.textContent = `${slider.value}%`;
            
            if (vol > 0) {
                sound.active = true;
                card.classList.add('active');
                toggleBtn.textContent = '🔊';
            } else {
                sound.active = false;
                card.classList.remove('active');
                toggleBtn.textContent = '🔇';
            }

            // Update real-time node gain if playing
            if (sound.gainNode && audioCtx && audioCtx.state === 'running') {
                sound.gainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
            }
        });

        // Toggle button handler
        toggleBtn.addEventListener('click', () => {
            if (sound.active) {
                // Mute
                sound.active = false;
                card.classList.remove('active');
                toggleBtn.textContent = '🔇';
                if (sound.gainNode) {
                    sound.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
                }
            } else {
                // Unmute to last volume or default 30%
                sound.active = true;
                if (sound.volume === 0) {
                    sound.volume = 0.3;
                    slider.value = 30;
                    pctText.textContent = '30%';
                }
                card.classList.add('active');
                toggleBtn.textContent = '🔊';
                if (sound.gainNode) {
                    sound.gainNode.gain.setTargetAtTime(sound.volume, audioCtx.currentTime, 0.05);
                }
            }
        });
    });

    // Master play click
    btnMasterToggle.addEventListener('click', () => {
        if (!isPlaying) {
            startAudio();
        } else {
            stopAudio();
        }
    });

    // ==========================================================================
    // 🎧 Audio Engine Control
    // ==========================================================================
    function startAudio() {
        if (!audioCtx) {
            // Create AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
            
            // Build shared cyclic buffers
            buildSharedBuffers();
            
            // Set up all tracks
            for (const key in sounds) {
                sounds[key].setup();
            }

            // Fade in master
            masterGain.gain.exponentialRampToValueAtTime(1.0, audioCtx.currentTime + 0.3);
        } else {
            // Resume suspended context
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        isPlaying = true;
        btnMasterToggle.classList.add('playing');
        btnMasterToggle.querySelector('.play-icon').textContent = '⏸';
        pulseIndicator.classList.remove('inactive');
        pulseIndicator.classList.add('active');
    }

    function stopAudio() {
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        isPlaying = false;
        btnMasterToggle.classList.remove('playing');
        btnMasterToggle.querySelector('.play-icon').textContent = '▶';
        pulseIndicator.classList.add('inactive');
        pulseIndicator.classList.remove('active');
    }

    // Generate cyclic buffers (runs once to save CPU)
    function buildSharedBuffers() {
        const sampleRate = audioCtx.sampleRate;
        const length = sampleRate * 5; // 5-second loop

        // 1. White Noise Buffer
        buffers.white = audioCtx.createBuffer(1, length, sampleRate);
        const whiteData = buffers.white.getChannelData(0);
        for (let i = 0; i < length; i++) {
            whiteData[i] = Math.random() * 2 - 1;
        }

        // 2. Brown Noise Buffer
        buffers.brown = audioCtx.createBuffer(1, length, sampleRate);
        const brownData = buffers.brown.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < length; i++) {
            let white = Math.random() * 2 - 1;
            brownData[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = brownData[i];
            brownData[i] *= 3.5; // Gain compensation
        }

        // 3. Pink Noise Buffer (Paul Kellet's refined method)
        buffers.pink = audioCtx.createBuffer(1, length, sampleRate);
        const pinkData = buffers.pink.getChannelData(0);
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < length; i++) {
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            pinkData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            pinkData[i] *= 0.11; // Gain compensation
            b6 = white * 0.115926;
        }

        // 4. Crackle Buffer (for Campfire)
        buffers.crackle = audioCtx.createBuffer(1, length, sampleRate);
        const crackleData = buffers.crackle.getChannelData(0);
        for (let i = 0; i < length; i++) {
            if (Math.random() < 0.00015) { // periodic random sparks
                let decay = 0.91;
                let val = Math.random() > 0.5 ? 0.7 : -0.7;
                for (let j = 0; j < 250 && (i + j) < length; j++) {
                    crackleData[i + j] += val;
                    val *= decay;
                }
            }
        }

        // 5. Murmur & Clink Buffer (for Cafe)
        buffers.cafe = audioCtx.createBuffer(1, length, sampleRate);
        const cafeData = buffers.cafe.getChannelData(0);
        let cafeLastOut = 0.0;
        for (let i = 0; i < length; i++) {
            let white = Math.random() * 2 - 1;
            cafeData[i] = (cafeLastOut + white * 0.035) / 1.035; // gentle bandpass rumble
            cafeLastOut = cafeData[i];

            // Add coffee cup clinks randomly
            if (Math.random() < 0.00007) {
                const pitch = 2000 + Math.random() * 3000;
                let amp = 0.15 + Math.random() * 0.15;
                let clinkDecay = 0.994;
                for (let j = 0; j < 1000 && (i + j) < length; j++) {
                    cafeData[i + j] += Math.sin(2 * Math.PI * pitch * (j / sampleRate)) * amp;
                    amp *= clinkDecay;
                }
            }
        }
    }

    // Helpers to create sound loops
    function playLoopNode(buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    // ==========================================================================
    // 🧬 Node Synthesizers Setup
    // ==========================================================================

    function createWhiteNoise() {
        const source = playLoopNode(buffers.white);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.white.active ? sounds.white.volume : 0, audioCtx.currentTime);

        source.connect(gain);
        gain.connect(masterGain);
        source.start(0);

        sounds.white.sourceNode = source;
        sounds.white.gainNode = gain;
    }

    function createBrownNoise() {
        const source = playLoopNode(buffers.brown);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.brown.active ? sounds.brown.volume : 0, audioCtx.currentTime);

        source.connect(gain);
        gain.connect(masterGain);
        source.start(0);

        sounds.brown.sourceNode = source;
        sounds.brown.gainNode = gain;
    }

    function createRain() {
        const source = playLoopNode(buffers.pink);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.6;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.rain.active ? sounds.rain.volume : 0, audioCtx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start(0);

        sounds.rain.sourceNode = source;
        sounds.rain.gainNode = gain;
    }

    function createWaves() {
        const source = playLoopNode(buffers.brown);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.waves.active ? sounds.waves.volume : 0, audioCtx.currentTime);

        // LFO volume modulator to simulate wave cycles
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12; // wave every ~8 seconds

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.35; // sweep depth

        const waveGainOffset = audioCtx.createGain();
        waveGainOffset.gain.value = 0.55; // base wave level

        lfo.connect(lfoGain);
        lfoGain.connect(waveGainOffset.gain); // modulate waves

        source.connect(filter);
        filter.connect(waveGainOffset);
        waveGainOffset.connect(gain);
        gain.connect(masterGain);

        source.start(0);
        lfo.start(0);

        sounds.waves.sourceNode = source;
        sounds.waves.gainNode = gain;
    }

    function createWind() {
        const source = playLoopNode(buffers.pink);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 3.5;
        filter.frequency.value = 400;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.wind.active ? sounds.wind.volume : 0, audioCtx.currentTime);

        // LFO to modulate filter frequency to create whistling wind sweeps
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.06; // sweep speed

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 220; // swept frequency depth

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency); // modulate wind whistling frequency

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(0);
        lfo.start(0);

        sounds.wind.sourceNode = source;
        sounds.wind.gainNode = gain;
    }

    function createCampfire() {
        // Campfire is a mix of low crackle + high crackle click spikes
        const sourceCrackle = playLoopNode(buffers.crackle);
        const crackleFilter = audioCtx.createBiquadFilter();
        crackleFilter.type = 'highpass';
        crackleFilter.frequency.value = 1200;

        const sourceRumble = playLoopNode(buffers.brown);
        const rumbleFilter = audioCtx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 130;

        const mixer = audioCtx.createGain();
        mixer.gain.value = 0.8;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.campfire.active ? sounds.campfire.volume : 0, audioCtx.currentTime);

        // Connect crackles
        sourceCrackle.connect(crackleFilter);
        crackleFilter.connect(mixer);

        // Connect warm rumble
        sourceRumble.connect(rumbleFilter);
        rumbleFilter.connect(mixer);

        mixer.connect(gain);
        gain.connect(masterGain);

        sourceCrackle.start(0);
        sourceRumble.start(0);

        sounds.campfire.sourceNode = sourceCrackle;
        sounds.campfire.gainNode = gain;
    }

    function createCafe() {
        const source = playLoopNode(buffers.cafe);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 0.5;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(sounds.cafe.active ? sounds.cafe.volume : 0, audioCtx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(0);

        sounds.cafe.sourceNode = source;
        sounds.cafe.gainNode = gain;
    }
});
