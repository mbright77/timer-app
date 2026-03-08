window.getBoundingClientRect = function(element) {
    return element.getBoundingClientRect();
};

window.audioInterop = {
    initialize: function() {
        this.audioContext = null;
        this.isInitialized = false;
    },

    ensureAudioContext: async function() {
        if (!this.audioContext) {
            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isInitialized = true;
    },

    requestNotificationPermission: async function() {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.warn('Notification permission request failed:', error);
            }
        }
    },

    playAlarm: async function() {
        await this.ensureAudioContext();

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('Timer finished!', { body: 'Your countdown is complete.' });
            } catch (error) {
                console.warn('Notification alarm failed:', error);
            }
        }

        this.playFallbackBeep();
    },

    playFallbackBeep: function() {
        if (!this.audioContext) {
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 440;

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        oscillator.start(now);
        oscillator.stop(now + 1.5);
    },

    vibrate: function() {
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }
    }
};

document.addEventListener('touchstart', function initAudioOnFirstTouch() {
    window.audioInterop.ensureAudioContext();
    document.removeEventListener('touchstart', initAudioOnFirstTouch);
}, { once: true });

document.addEventListener('click', function initAudioOnFirstClick() {
    window.audioInterop.ensureAudioContext();
    document.removeEventListener('click', initAudioOnFirstClick);
}, { once: true });
