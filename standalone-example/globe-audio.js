/**
 * Audio Controls for Interactive Globe
 * Handles background music and sound effects
 */

// Audio context for better control
let audioContext;
let backgroundMusic;
let gainNode;
let isAudioInitialized = false;

/**
 * Initialize audio system
 */
function initAudio() {
    try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5; // Default volume (0 to 1)
        gainNode.connect(audioContext.destination);
        
        // Create audio element for background music
        backgroundMusic = new Audio('https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3');
        const source = audioContext.createMediaElementSource(backgroundMusic);
        source.connect(gainNode);
        
        // Set loop and autoplay
        backgroundMusic.loop = true;
        
        // Handle autoplay restrictions
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (backgroundMusic.paused) {
                backgroundMusic.play().catch(e => console.warn('Autoplay prevented:', e));
            }
        }, { once: true });
        
        // Try to start playback
        backgroundMusic.play().catch(e => {
            console.log('Autoplay prevented, will start after user interaction');
        });
        
        // Create and add audio controls to the UI
        createAudioControls();
        
        isAudioInitialized = true;
        console.log('🎵 Audio system initialized');
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

/**
 * Create audio control UI elements
 */
function createAudioControls() {
    // Create container
    const container = document.createElement('div');
    container.className = 'audio-controls';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.7);
        padding: 8px 12px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Create volume icon
    const icon = document.createElement('div');
    icon.innerHTML = '🔊';
    icon.style.cursor = 'pointer';
    
    // Create volume slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = '0.5';
    slider.style.width = '80px';
    
    // Update volume when slider changes
    slider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        gainNode.gain.value = volume;
        
        // Update icon based on volume level
        if (volume === 0) {
            icon.textContent = '🔇';
        } else if (volume < 0.3) {
            icon.textContent = '🔈';
        } else if (volume < 0.7) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '🔊';
        }
    });
    
    // Toggle mute when icon is clicked
    icon.addEventListener('click', () => {
        if (gainNode.gain.value > 0) {
            // Store current volume and mute
            icon.dataset.lastVolume = gainNode.gain.value;
            gainNode.gain.value = 0;
            slider.value = 0;
            icon.textContent = '🔇';
        } else {
            // Restore previous volume
            const lastVolume = parseFloat(icon.dataset.lastVolume || '0.5');
            gainNode.gain.value = lastVolume;
            slider.value = lastVolume;
            
            if (lastVolume === 0) {
                icon.textContent = '🔇';
            } else if (lastVolume < 0.3) {
                icon.textContent = '🔈';
            } else if (lastVolume < 0.7) {
                icon.textContent = '🔉';
            } else {
                icon.textContent = '🔊';
            }
        }
    });
    
    // Add elements to container
    container.appendChild(icon);
    container.appendChild(slider);
    document.body.appendChild(container);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .audio-controls input[type="range"] {
            -webkit-appearance: none;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            outline: none;
        }
        .audio-controls input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #00BFFF;
            border-radius: 50%;
            cursor: pointer;
        }
        .audio-controls input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #00BFFF;
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }
    `;
    document.head.appendChild(style);
}

// Initialize audio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize audio if not on a mobile device
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        initAudio();
    }
});

// Export functions for global access
window.initAudio = initAudio;
