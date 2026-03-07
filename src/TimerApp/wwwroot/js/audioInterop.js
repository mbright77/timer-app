window.getBoundingClientRect = function(element) {
    return element.getBoundingClientRect();
};

window.audioInterop = {
    initialize: function() {
        this.audioContext = null;
        this.alarmBuffer = null;
        this.isInitialized = false;
    },

    loadAlarmSound: async function() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const response = await fetch('audio/alarm.mp3');
            if (!response.ok) {
                throw new Error('Audio file not found');
            }
            const arrayBuffer = await response.arrayBuffer();
            this.alarmBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.isInitialized = true;
        } catch (e) {
            console.warn('Failed to load alarm sound, using fallback beep:', e);
            this.alarmBuffer = null;
            this.isInitialized = true;
        }
    },

    playAlarm: async function() {
        await this.loadAlarmSound();

        if (!this.audioContext) {
            console.warn('Audio context not available');
            return;
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.alarmBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.alarmBuffer;
            source.loop = true;
            source.connect(this.audioContext.destination);
            source.start(0);
            this.currentAlarmSource = source;

            setTimeout(() => {
                if (this.currentAlarmSource) {
                    this.currentAlarmSource.stop();
                    this.currentAlarmSource = null;
                }
            }, 5000);
        } else {
            this.playFallbackBeep();
        }
    },

    playFallbackBeep: function() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
        }, 500);
    },

    vibrate: function() {
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }
    }
};

document.addEventListener('touchstart', function initAudioOnFirstTouch() {
    window.audioInterop.loadAlarmSound();
    document.removeEventListener('touchstart', initAudioOnFirstTouch);
}, { once: true });

document.addEventListener('click', function initAudioOnFirstClick() {
    window.audioInterop.loadAlarmSound();
    document.removeEventListener('click', initAudioOnFirstClick);
}, { once: true });
