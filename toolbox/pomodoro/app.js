/* ==========================================================================
   Pomodoro & Stopwatch Business Logic (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Tab Elements
    const tabPomo = document.getElementById('tab-pomo');
    const tabStopwatch = document.getElementById('tab-stopwatch');
    const pomoView = document.getElementById('pomo-view');
    const stopwatchView = document.getElementById('stopwatch-view');

    // Pomodoro DOM Elements
    const pomoTime = document.getElementById('pomo-time');
    const pomoProgress = document.getElementById('pomo-progress');
    const pomoStatus = document.getElementById('pomo-status');
    const btnPomoStart = document.getElementById('btn-pomo-start');
    const btnPomoReset = document.getElementById('btn-pomo-reset');
    const btnPomoSkip = document.getElementById('btn-pomo-skip');
    const pomoStartText = document.getElementById('pomo-start-text');
    const btnPresets = document.querySelectorAll('.btn-preset');

    // Stopwatch DOM Elements
    const swTime = document.getElementById('stopwatch-time');
    const btnSwStart = document.getElementById('btn-sw-start');
    const btnSwLap = document.getElementById('btn-sw-lap');
    const btnSwReset = document.getElementById('btn-sw-reset');
    const lapList = document.getElementById('lap-list');

    // Web Audio API Sound Generator (Offline Beep Alert)
    function playBeepAlert() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            
            // Double beep sequence
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5 note
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.2);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            gain.gain.setValueAtTime(0.3, now + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.16);
            osc2.start(now + 0.2);
            osc2.stop(now + 0.36);
        } catch (e) {
            console.warn('Web Audio API not supported or blocked by browser policy:', e);
        }
    }

    // Tab Switching
    tabPomo.addEventListener('click', () => {
        tabPomo.classList.add('active');
        tabStopwatch.classList.remove('active');
        pomoView.classList.add('active');
        stopwatchView.classList.remove('active');
    });

    tabStopwatch.addEventListener('click', () => {
        tabStopwatch.classList.add('active');
        tabPomo.classList.remove('active');
        stopwatchView.classList.add('active');
        pomoView.classList.remove('active');
    });

    // ==========================================================================
    // 🍅 Pomodoro Mode Logic
    // ==========================================================================
    let pomoDuration = 1500; // default 25m in seconds
    let pomoSecondsLeft = 1500;
    let pomoInterval = null;
    let pomoIsRunning = false;
    let pomoType = 'work'; // 'work', 'break', 'longBreak'

    const SVG_CIRCUMFERENCE = 2 * Math.PI * 95; // r=95 -> C=596.9

    // Initialize SVG Progress Ring
    if (pomoProgress) {
        pomoProgress.style.strokeDasharray = SVG_CIRCUMFERENCE;
        pomoProgress.style.strokeDashoffset = 0;
    }

    function updatePomoDisplay() {
        const minutes = Math.floor(pomoSecondsLeft / 60);
        const seconds = pomoSecondsLeft % 60;
        pomoTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (pomoProgress) {
            const percent = pomoSecondsLeft / pomoDuration;
            pomoProgress.style.strokeDashoffset = SVG_CIRCUMFERENCE - (percent * SVG_CIRCUMFERENCE);
        }
    }

    function togglePomo() {
        if (pomoIsRunning) {
            // Pause
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoIsRunning = false;
            pomoStartText.textContent = '開始';
            btnPomoStart.querySelector('svg').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>'; // Play icon
        } else {
            // Start
            pomoIsRunning = true;
            pomoStartText.textContent = '暫停';
            btnPomoStart.querySelector('svg').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; // Pause icon
            
            pomoInterval = setInterval(() => {
                if (pomoSecondsLeft > 0) {
                    pomoSecondsLeft--;
                    updatePomoDisplay();
                } else {
                    // Timer Finished!
                    clearInterval(pomoInterval);
                    pomoInterval = null;
                    pomoIsRunning = false;
                    pomoStartText.textContent = '開始';
                    btnPomoStart.querySelector('svg').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
                    playBeepAlert();
                    handlePomoCycleEnd();
                }
            }, 1000);
        }
    }

    function handlePomoCycleEnd() {
        if (pomoType === 'work') {
            alert('專注時間結束！休息一下吧 ☕');
            switchPreset('break', 300); // automatic switch to break
        } else {
            alert('休息結束！開始專注吧 💪');
            switchPreset('work', 1500); // automatic switch to work
        }
    }

    function resetPomo() {
        clearInterval(pomoInterval);
        pomoInterval = null;
        pomoIsRunning = false;
        pomoSecondsLeft = pomoDuration;
        pomoStartText.textContent = '開始';
        btnPomoStart.querySelector('svg').innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
        updatePomoDisplay();
    }

    function skipPomo() {
        if (pomoType === 'work') {
            switchPreset('break', 300);
        } else {
            switchPreset('work', 1500);
        }
    }

    function switchPreset(type, duration) {
        pomoType = type;
        pomoDuration = duration;
        pomoSecondsLeft = duration;
        
        // Reset styles and presets active state
        btnPresets.forEach(btn => {
            btn.classList.remove('active', 'break-active');
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
                if (type === 'break' || type === 'longBreak') {
                    btn.classList.add('break-active');
                }
            }
        });

        // Set status text
        if (type === 'work') {
            pomoStatus.textContent = '專注學習中';
            pomoStatus.className = 'pomo-status-badge';
            pomoProgress.style.stroke = 'var(--color-pomo)';
            pomoProgress.style.filter = 'drop-shadow(0 0 8px rgba(255, 94, 94, 0.2))';
            btnPomoStart.className = 'btn btn-primary btn-large';
        } else {
            pomoStatus.textContent = type === 'break' ? '茶歇休息中' : '放空長休中';
            pomoStatus.className = 'pomo-status-badge';
            pomoStatus.style.color = 'var(--color-break)';
            pomoStatus.style.borderColor = 'rgba(45, 223, 130, 0.2)';
            pomoStatus.style.background = 'rgba(45, 223, 130, 0.1)';
            pomoProgress.style.stroke = 'var(--color-break)';
            pomoProgress.style.filter = 'drop-shadow(0 0 8px rgba(45, 223, 130, 0.2))';
            btnPomoStart.className = 'btn btn-primary btn-large break-active';
        }

        resetPomo();
    }

    // Attach Pomodoro Events
    btnPomoStart.addEventListener('click', togglePomo);
    btnPomoReset.addEventListener('click', resetPomo);
    btnPomoSkip.addEventListener('click', skipPomo);

    btnPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            const duration = parseInt(btn.getAttribute('data-time'));
            const type = btn.getAttribute('data-type');
            switchPreset(type, duration);
        });
    });

    updatePomoDisplay();


    // ==========================================================================
    // ⏱️ Stopwatch Mode Logic
    // ==========================================================================
    let swRunning = false;
    let swInterval = null;
    let swStartTime = 0;
    let swElapsedTime = 0;
    let swLaps = [];

    function formatTime(totalCentiseconds) {
        const min = Math.floor(totalCentiseconds / 6000);
        const sec = Math.floor((totalCentiseconds % 6000) / 100);
        const cs = totalCentiseconds % 100;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }

    function updateStopwatch() {
        const currentTime = Date.now();
        const diff = currentTime - swStartTime + swElapsedTime;
        const totalCS = Math.floor(diff / 10);
        swTime.textContent = formatTime(totalCS);
    }

    function toggleStopwatch() {
        if (swRunning) {
            // Pause
            clearInterval(swInterval);
            swInterval = null;
            swElapsedTime += Date.now() - swStartTime;
            swRunning = false;
            btnSwStart.textContent = '繼續';
            btnSwStart.className = 'btn btn-primary btn-large sw-active';
            btnSwLap.textContent = '分次';
            btnSwLap.disabled = true;
        } else {
            // Start
            swStartTime = Date.now();
            swInterval = setInterval(updateStopwatch, 10);
            swRunning = true;
            btnSwStart.textContent = '暫停';
            btnSwStart.className = 'btn btn-danger btn-large';
            btnSwLap.textContent = '計圈';
            btnSwLap.disabled = false;
        }
    }

    function lapStopwatch() {
        if (!swRunning) return;

        const currentTime = Date.now();
        const diff = currentTime - swStartTime + swElapsedTime;
        const currentCS = Math.floor(diff / 10);

        const lapNumber = swLaps.length + 1;
        let lapCS = currentCS;
        
        if (swLaps.length > 0) {
            lapCS = currentCS - swLaps[0].cumulative;
        }

        const newLap = {
            num: lapNumber,
            lapTime: formatTime(lapCS),
            accumulatedTime: formatTime(currentCS),
            cumulative: currentCS
        };

        swLaps.unshift(newLap); // add to top of list
        renderLaps();
    }

    function renderLaps() {
        if (swLaps.length === 0) {
            lapList.innerHTML = '<li class="lap-empty">尚無計圈紀錄</li>';
            return;
        }

        let html = '';
        swLaps.forEach(lap => {
            html += `
                <li class="lap-item">
                    <span>#${lap.num}</span>
                    <span>${lap.lapTime}</span>
                    <span>${lap.accumulatedTime}</span>
                </li>
            `;
        });
        lapList.innerHTML = html;
    }

    function resetStopwatch() {
        clearInterval(swInterval);
        swInterval = null;
        swRunning = false;
        swStartTime = 0;
        swElapsedTime = 0;
        swLaps = [];
        swTime.textContent = '00:00.00';
        btnSwStart.textContent = '開始';
        btnSwStart.className = 'btn btn-primary btn-large';
        btnSwLap.textContent = '計圈';
        btnSwLap.disabled = true;
        renderLaps();
    }

    // Attach Stopwatch Events
    btnSwStart.addEventListener('click', toggleStopwatch);
    btnSwLap.addEventListener('click', lapStopwatch);
    btnSwReset.addEventListener('click', resetStopwatch);
});
