class AudioSettings {
    constructor() {
        this.settings = {
            masterVolume: 70,
            musicVolume: 70,
            effectsVolume: 70,
            musicEnabled: true,
            effectsEnabled: true,
            playMode: 'sequential',
            crossfadeDuration: 1.0
        };
        
        this.audioElements = {
            backgroundMusic: document.getElementById('backgroundMusic'),
            shotSound: document.getElementById('shotSound'),
            hitSound: document.getElementById('hitSound'),
            reloadSound: document.getElementById('reloadSound')
        };
        
        this.musicConfig = {
            folder: 'music/',
            namingPattern: 'track',
            extensions: ['mp3', 'ogg', 'wav', 'm4a'],
            trackCount: 2
        };
        
        this.tracks = [];
        this.currentTrackIndex = 0;
        this.isLoading = false;
        this.availableTracks = [];
        this.playlist = [];
        this.currentTrack = null;
        
        this.init();
    }
    
    async init() {
        this.loadSettings();
        this.createUI();
        this.bindEvents();
        this.applySettings();

        this.tracks = this.createTrackList();
        this.musicScanned = false;
        this.userInteracted = false;

        this.initAudioSystem();

        // Сканируем треки один раз при старте (без попытки воспроизведения)
        setTimeout(() => this.checkForMusic(false), 500);
    }
    
    createTrackList() {
        const tracks = [];
        
        for (let i = 1; i <= this.musicConfig.trackCount; i++) {
            const track = {
                id: i,
                name: `Трек ${i}`,
                filename: `${this.musicConfig.namingPattern}${i}`,
                available: false,
                url: null,
                format: null,
                duration: 0
            };
            tracks.push(track);
        }
        
        return tracks;
    }
    
    async checkForMusic(autoplay = true) {
        if (this.isScanning) return;
        this.isScanning = true;


        const statusElement = document.getElementById('musicStatus');
        if (statusElement) {
            statusElement.textContent = '🔍 Поиск музыки...';
            statusElement.style.color = 'var(--info)';
        }

        this.availableTracks = [];

        for (const track of this.tracks) {
            track.available = false;
            track.url = null;
            await this.testTrackFormats(track);
        }

        this.musicScanned = true;
        this.isScanning = false;

        this.updateMusicStatus();
        this.generatePlaylist();

        if (this.availableTracks.length > 0) {
            if (autoplay && this.userInteracted && this.settings.musicEnabled) {
                const firstTrack = this.availableTracks[0];
                const trackIndex = this.tracks.findIndex(t => t.id === firstTrack.id);
                if (trackIndex !== -1) {
                    this.playTrack(trackIndex);
                }
            }
        } else {
            console.warn('⚠️ Музыкальные файлы не найдены в папке:', this.musicConfig.folder);
        }
    }
    
    async testTrackFormats(track) {
        const folder = this.musicConfig.folder;
        const id = track.id;

        // Проверяем только реалистичные имена файлов: track1.mp3, Track1.mp3, 1.mp3, трек1.mp3
        const testUrls = [];
        for (const ext of this.musicConfig.extensions) {
            testUrls.push(`${folder}track${id}.${ext}`);
            testUrls.push(`${folder}Track${id}.${ext}`);
            testUrls.push(`${folder}${id}.${ext}`);
            testUrls.push(`${folder}трек${id}.${ext}`);
        }

        for (const url of testUrls) {
            const isAvailable = await this.testUrl(url);
            if (isAvailable) {
                track.available = true;
                track.url = url;
                track.format = url.split('.').pop();
                if (!this.availableTracks.some(t => t.id === track.id)) {
                    this.availableTracks.push(track);
                }
                return true;
            }
        }

        track.available = false;
        return false;
    }
    
    async testUrl(url) {
        return new Promise((resolve) => {
            const audio = new Audio();
            const timer = setTimeout(() => {
                audio.src = '';
                resolve(false);
            }, 3000);

            audio.addEventListener('canplay', () => {
                clearTimeout(timer);
                audio.src = '';
                resolve(true);
            }, { once: true });

            audio.addEventListener('error', () => {
                clearTimeout(timer);
                resolve(false);
            }, { once: true });

            audio.src = url;
        });
    }
    
    createUI() {
        const html = `
            <div class="settings-overlay" id="audioSettingsOverlay">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-music"></i>
                            Настройки звука
                        </h2>
                        <div class="settings-close" id="audioSettingsClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-section">
                            <h3><i class="fas fa-volume-up"></i> Громкость</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-volume"></i> Общая громкость
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0" max="100" value="${this.settings.masterVolume}"
                                               class="setting-slider" id="masterVolumeSlider">
                                        <span class="setting-value" id="masterVolumeValue">${this.settings.masterVolume}%</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-music"></i> Громкость музыки
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0" max="100" value="${this.settings.musicVolume}"
                                               class="setting-slider" id="musicVolumeSlider">
                                        <span class="setting-value" id="musicVolumeValue">${this.settings.musicVolume}%</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-bolt"></i> Громкость эффектов
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0" max="100" value="${this.settings.effectsVolume}"
                                               class="setting-slider" id="effectsVolumeSlider">
                                        <span class="setting-value" id="effectsVolumeValue">${this.settings.effectsVolume}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-toggle-on"></i> Включение звуков</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-headphones"></i> Фоновая музыка
                                    </label>
                                    <div class="setting-checkbox ${this.settings.musicEnabled ? 'active' : ''}" id="musicToggle">
                                        <div class="checkbox-inner"></div>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-gun"></i> Звуковые эффекты
                                    </label>
                                    <div class="setting-checkbox ${this.settings.effectsEnabled ? 'active' : ''}" id="effectsToggle">
                                        <div class="checkbox-inner"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-search"></i> Статус музыки</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-info-circle"></i> Найдено треков
                                    </label>
                                    <div class="setting-value" id="musicStatus">
                                        <span class="status-text">Проверка...</span>
                                        <span class="status-details"></span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-folder-open"></i> Папка с музыкой
                                    </label>
                                    <div class="setting-control">
                                        <input type="text" id="musicFolderInput" value="${this.musicConfig.folder}" 
                                               class="folder-input">
                                        <button class="folder-btn" id="refreshMusicBtn" title="Обновить список">
                                            <i class="fas fa-sync"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-question-circle"></i> Имена файлов
                                    </label>
                                    <div class="setting-value">
                                        <span id="filenamePattern">track1.mp3, track2.mp3, ...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-list-music"></i> Плейлист (${this.tracks.length} треков)</h3>
                            <div class="playlist-container" id="playlistContainer">
                                <div class="playlist-loading">
                                    <i class="fas fa-spinner fa-spin"></i> Поиск музыки...
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-info">
                            <h4><i class="fas fa-exclamation-triangle"></i> Как добавить музыку:</h4>
                            <ol class="instructions-list">
                                <li>Создайте папку <strong>"music"</strong> рядом с игрой</li>
                                <li>Поместите в неё файлы с именами:
                                    <ul>
                                        <li><code>track1.mp3</code></li>
                                        <li><code>track2.mp3</code></li>
                                        <li>и т.д. до <code>track10.mp3</code></li>
                                    </ul>
                                </li>
                                <li>Или используйте другие форматы: <code>.ogg</code>, <code>.wav</code>, <code>.m4a</code></li>
                            </ol>
                        </div>
                        
                        <div class="settings-actions">
                            <button class="settings-action-btn reset" id="audioResetBtn">
                                <i class="fas fa-undo"></i> Сбросить
                            </button>
                            <button class="settings-action-btn apply" id="audioApplyBtn">
                                <i class="fas fa-check"></i> Применить
                            </button>
                            <button class="settings-action-btn info" id="debugMusicBtn">
                                <i class="fas fa-bug"></i> Отладка
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    }
    
    updateMusicStatus() {
        const statusElement = document.getElementById('musicStatus');
        if (!statusElement) return;
        
        const statusText = statusElement.querySelector('.status-text');
        const statusDetails = statusElement.querySelector('.status-details');
        
        if (!statusText) return;
        
        const found = this.availableTracks.length;
        const total = this.tracks.length;
        
        if (found === 0) {
            statusText.textContent = '❌ Музыка не найдена';
            statusText.style.color = 'var(--danger)';
            if (statusDetails) statusDetails.textContent = 'Папка: ' + this.musicConfig.folder;
        } else if (found < total) {
            statusText.textContent = `⚠️ ${found}/${total} треков`;
            statusText.style.color = 'var(--warning)';
            if (statusDetails) statusDetails.textContent = 'Папка: ' + this.musicConfig.folder;
        } else {
            statusText.textContent = `✅ ${found}/${total} треков`;
            statusText.style.color = 'var(--accent)';
            if (statusDetails) statusDetails.textContent = 'Папка: ' + this.musicConfig.folder;
        }
    }
    
    bindEvents() {
        document.getElementById('audioSettingsClose').addEventListener('click', () => this.hideMenu());
        
        document.getElementById('audioApplyBtn').addEventListener('click', () => this.applySettings());
        document.getElementById('audioResetBtn').addEventListener('click', () => this.resetToDefaults());
        document.getElementById('refreshMusicBtn').addEventListener('click', () => {
            this.showNotification('Обновление списка музыки...', 'info');
            this.checkForMusic();
        });
        document.getElementById('debugMusicBtn').addEventListener('click', () => this.showDebugInfo());
        
        document.getElementById('masterVolumeSlider').addEventListener('input', (e) => {
            this.settings.masterVolume = parseInt(e.target.value);
            document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
            this.applyAudioSettings();
        });
        
        document.getElementById('musicVolumeSlider').addEventListener('input', (e) => {
            this.settings.musicVolume = parseInt(e.target.value);
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
            this.applyAudioSettings();
        });
        
        document.getElementById('effectsVolumeSlider').addEventListener('input', (e) => {
            this.settings.effectsVolume = parseInt(e.target.value);
            document.getElementById('effectsVolumeValue').textContent = e.target.value + '%';
            this.applyAudioSettings();
        });
        
        document.getElementById('musicFolderInput').addEventListener('change', (e) => {
            let newFolder = e.target.value.trim();
            if (newFolder && !newFolder.endsWith('/')) {
                newFolder += '/';
            }
            this.musicConfig.folder = newFolder || 'music/';
            this.checkForMusic();
        });
        
        document.getElementById('musicToggle').addEventListener('click', () => {
            this.settings.musicEnabled = !this.settings.musicEnabled;
            this.updateUI();
            this.applyAudioSettings();
        });
        
        document.getElementById('effectsToggle').addEventListener('click', () => {
            this.settings.effectsEnabled = !this.settings.effectsEnabled;
            this.updateUI();
            this.applyAudioSettings();
        });
    }
    
    generatePlaylist() {
        const container = document.getElementById('playlistContainer');
        if (!container) return;
        
        if (this.availableTracks.length === 0) {
            container.innerHTML = `
                <div class="playlist-empty">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Музыка не найдена</h3>
                    <p>Поместите файлы в папку <code>${this.musicConfig.folder}</code></p>
                    <div class="suggestions">
                        <p>Примеры файлов:</p>
                        <ul>
                            <li><code>track1.mp3</code></li>
                            <li><code>track2.ogg</code></li>
                            <li><code>track3.wav</code></li>
                            <li>и т.д. до track10</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="playlist-header">
                <div class="playlist-header-item">#</div>
                <div class="playlist-header-item">Трек</div>
                <div class="playlist-header-item">Формат</div>
                <div class="playlist-header-item">Статус</div>
                <div class="playlist-header-item">Действия</div>
            </div>
            <div class="playlist-items">
                ${this.tracks.map((track, index) => `
                    <div class="playlist-item ${track.available ? 'available' : 'unavailable'} ${index === this.currentTrackIndex ? 'active' : ''}">
                        <div class="playlist-cell number">${track.id}</div>
                        <div class="playlist-cell title">
                            <i class="fas fa-${track.available ? 'music' : 'times-circle'}"></i>
                            ${track.name}
                        </div>
                        <div class="playlist-cell format">
                            ${track.available ? track.format?.toUpperCase() || '?' : '-'}
                        </div>
                        <div class="playlist-cell status">
                            ${!track.available ? '<span class="unavailable">⛔ Нет</span>' : 
                              index === this.currentTrackIndex ? '<span class="playing">▶️ Играет</span>' : 
                              '<span class="available">✓ Есть</span>'}
                        </div>
                        <div class="playlist-cell controls">
                            <button class="playlist-btn play-btn" data-index="${index}" ${!track.available ? 'disabled' : ''}>
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.querySelectorAll('.playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.closest('.playlist-btn').dataset.index);
                this.playTrack(index);
            });
        });
    }
    
    playTrack(index) {
        if (index < 0 || index >= this.tracks.length) {
            console.error('Неверный индекс трека:', index);
            return;
        }
        
        const track = this.tracks[index];
        
        if (!track.available) {
            this.showNotification(`Трек "${track.name}" недоступен!`, 'error');
            return;
        }
        
        if (!track.url) {
            console.error('У трека нет URL:', track);
            return;
        }
        
        
        this.currentTrackIndex = index;
        this.currentTrack = track;
        
        if (this.audioElements.backgroundMusic) {
            this.audioElements.backgroundMusic.pause();
            
            this.audioElements.backgroundMusic.src = track.url;
            
            this.audioElements.backgroundMusic.load();
            
            this.audioElements.backgroundMusic.play().then(() => {
                this.isLoading = false;
                this.userInteracted = true;
                this.updateMiniPlayer();
            }).catch(() => {
                // Браузер заблокировал автовоспроизведение — дождёмся взаимодействия
                this.isLoading = false;
                this.audioElements.backgroundMusic.src = track.url;
            });
            
            this.generatePlaylist();
            this.updateMiniPlayer();
        }
    }
    
    updateUI() {
        const masterSlider = document.getElementById('masterVolumeSlider');
        const musicSlider = document.getElementById('musicVolumeSlider');
        const effectsSlider = document.getElementById('effectsVolumeSlider');
        
        if (masterSlider) masterSlider.value = this.settings.masterVolume;
        if (musicSlider) musicSlider.value = this.settings.musicVolume;
        if (effectsSlider) effectsSlider.value = this.settings.effectsVolume;
        
        const masterValue = document.getElementById('masterVolumeValue');
        const musicValue = document.getElementById('musicVolumeValue');
        const effectsValue = document.getElementById('effectsVolumeValue');
        
        if (masterValue) masterValue.textContent = this.settings.masterVolume + '%';
        if (musicValue) musicValue.textContent = this.settings.musicVolume + '%';
        if (effectsValue) effectsValue.textContent = this.settings.effectsVolume + '%';
        
        const musicToggle = document.getElementById('musicToggle');
        const effectsToggle = document.getElementById('effectsToggle');
        
        if (musicToggle) {
            musicToggle.classList.toggle('active', this.settings.musicEnabled);
        }
        if (effectsToggle) {
            effectsToggle.classList.toggle('active', this.settings.effectsEnabled);
        }
        
        const folderInput = document.getElementById('musicFolderInput');
        if (folderInput) {
            folderInput.value = this.musicConfig.folder;
        }
        
        const filenamePattern = document.getElementById('filenamePattern');
        if (filenamePattern) {
            filenamePattern.textContent = `${this.musicConfig.namingPattern}1.${this.musicConfig.extensions[0]}, ${this.musicConfig.namingPattern}2.${this.musicConfig.extensions[0]}, ...`;
        }
        
        this.updateMusicStatus();
    }
    
    showMenu() {
        gamePaused = true;
        document.getElementById('audioSettingsOverlay').classList.add('active');
        this.updateUI();
        // Пересканировать только если ещё не сканировали (например, при первом открытии)
        if (!this.musicScanned) {
            this.checkForMusic(false);
        }
    }
    
    hideMenu() {
        document.getElementById('audioSettingsOverlay').classList.remove('active');
        if (window.settingsMenu) {
            window.settingsMenu.show();
        } else {
            gamePaused = false;
        }
    }
    
    applySettings() {
        this.applyAudioSettings();
        this.saveSettings();
        this.hideMenu();
        this.showNotification('Настройки звука применены!', 'success');
    }
    
    applyAudioSettings() {
        const masterVolume = this.settings.masterVolume / 100;
        const musicVolume = this.settings.musicVolume / 100;
        const effectsVolume = this.settings.effectsVolume / 100;
        
        if (this.audioElements.backgroundMusic) {
            this.audioElements.backgroundMusic.volume = masterVolume * musicVolume;
            this.audioElements.backgroundMusic.muted = !this.settings.musicEnabled;
            
            if (this.settings.musicEnabled && this.currentTrack && this.currentTrack.available) {
                if (this.audioElements.backgroundMusic.paused) {
                    this.audioElements.backgroundMusic.play().catch(() => {});
                }
            } else if (!this.settings.musicEnabled) {
                this.audioElements.backgroundMusic.pause();
            }
        }
        
        ['shotSound', 'hitSound', 'reloadSound'].forEach(soundId => {
            if (this.audioElements[soundId]) {
                this.audioElements[soundId].volume = masterVolume * effectsVolume;
                this.audioElements[soundId].muted = !this.settings.effectsEnabled;
            }
        });
        
        window.audioSettings = this.settings;
    }
    
    updateMiniPlayer() {
        const miniTrackName = document.getElementById('miniTrackName');
        if (miniTrackName && this.currentTrack) {
            miniTrackName.textContent = this.currentTrack.name;
        }
    }
    
    initAudioSystem() {
        if (this.audioElements.backgroundMusic) {
            this.audioElements.backgroundMusic.addEventListener('ended', () => {
                if (this.settings.musicEnabled && this.availableTracks.length > 0) {
                    if (this.settings.playMode === 'sequential') {
                        this.nextTrack();
                    } else if (this.settings.playMode === 'random') {
                        this.playRandomTrack();
                    }
                }
            });

            this.audioElements.backgroundMusic.addEventListener('error', () => {
                if (this.settings.musicEnabled) {
                    this.nextTrack();
                }
            });
        }

        // Запускаем музыку при первом взаимодействии пользователя
        const onFirstInteraction = () => {
            if (this.userInteracted) return;
            this.userInteracted = true;
            document.removeEventListener('click', onFirstInteraction);
            document.removeEventListener('keydown', onFirstInteraction);

            if (this.settings.musicEnabled && this.availableTracks.length > 0
                && this.audioElements.backgroundMusic?.paused) {
                const firstTrack = this.availableTracks[0];
                const idx = this.tracks.findIndex(t => t.id === firstTrack.id);
                if (idx !== -1) this.playTrack(idx);
            }
        };
        document.addEventListener('click', onFirstInteraction);
        document.addEventListener('keydown', onFirstInteraction);

        document.addEventListener('keydown', (e) => this.handleHotkeys(e));

        this.updateMusicStatusIndicator();
    }
    
    nextTrack() {
        if (this.availableTracks.length === 0) return;
        
        let nextIndex = this.currentTrackIndex;
        let attempts = 0;
        
        do {
            nextIndex = (nextIndex + 1) % this.tracks.length;
            attempts++;
            
            if (attempts > this.tracks.length) {
                return;
            }
        } while (!this.tracks[nextIndex]?.available);
        
        this.playTrack(nextIndex);
    }
    
    playRandomTrack() {
        if (this.availableTracks.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.availableTracks.length);
        const randomTrack = this.availableTracks[randomIndex];
        const trackIndex = this.tracks.findIndex(t => t.id === randomTrack.id);
        
        if (trackIndex !== -1) {
            this.playTrack(trackIndex);
        }
    }
    
    handleHotkeys(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            switch(e.key.toLowerCase()) {
                case 'arrowright':
                    this.nextTrack();
                    break;
                case 'arrowleft':
                    this.prevTrack();
                    break;
                case 'm':
                case 'M':
                    this.toggleMusic();
                    break;
            }
        }
    }
    
    toggleMusic() {
        if (this.audioElements.backgroundMusic) {
            if (this.audioElements.backgroundMusic.paused) {
                this.audioElements.backgroundMusic.play().catch(() => {});
            } else {
                this.audioElements.backgroundMusic.pause();
            }
        }
    }
    
    prevTrack() {
        if (this.availableTracks.length === 0) return;
        
        let prevIndex = this.currentTrackIndex;
        let attempts = 0;
        
        do {
            prevIndex = (prevIndex - 1 + this.tracks.length) % this.tracks.length;
            attempts++;
            
            if (attempts > this.tracks.length) {
                return;
            }
        } while (!this.tracks[prevIndex]?.available);
        
        this.playTrack(prevIndex);
    }
    
    resetToDefaults() {
        const doReset = () => {
            this.settings = {
                masterVolume: 70,
                musicVolume: 70,
                effectsVolume: 70,
                musicEnabled: true,
                effectsEnabled: true,
                playMode: 'sequential',
                crossfadeDuration: 1.0
            };
            this.applySettings();
        };
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('Сбросить настройки звука<br>к значениям по умолчанию?', doReset);
        } else {
            doReset();
        }
    }
    
    saveSettings() {
        try { localStorage.setItem('neon_strike_audio', JSON.stringify(this.settings)); } catch (e) {}
    }
    
    loadSettings() {
        const saved = localStorage.getItem('neon_strike_audio');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(this.settings, parsed);
            } catch (e) {
                console.error('Ошибка загрузки настроек звука:', e);
            }
        }
    }
    
    showDebugInfo() {
        
        let debugInfo = '=== ИНФОРМАЦИЯ О МУЗЫКЕ ===\n\n';
        debugInfo += `Папка: ${this.musicConfig.folder}\n`;
        debugInfo += `Искалось треков: ${this.tracks.length}\n`;
        debugInfo += `Найдено треков: ${this.availableTracks.length}\n\n`;
        
        if (this.availableTracks.length > 0) {
            debugInfo += 'Найденные треки:\n';
            this.availableTracks.forEach(track => {
                debugInfo += `  ${track.name}: ${track.url}\n`;
            });
        } else {
            debugInfo += 'Треки не найдены.\n';
            debugInfo += 'Проверьте:\n';
            debugInfo += `1. Существует ли папка "${this.musicConfig.folder}"?\n`;
            debugInfo += `2. Файлы называются правильно? (track1.mp3, track2.mp3, ...)\n`;
            debugInfo += `3. Файлы имеют правильный формат? (${this.musicConfig.extensions.join(', ')})\n`;
        }
        
        alert(debugInfo);
    }
    
    showNotification(message, type = 'success') {
        const oldNotifications = document.querySelectorAll('.settings-notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid ${type === 'success' ? 'var(--accent)' : 
                             type === 'error' ? 'var(--danger)' : 
                             'var(--info)'};
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: var(--glow);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        return notification;
    }
    
    updateMusicStatusIndicator() {
        const indicator = document.getElementById('musicStatusIndicator');
        if (!indicator) return;
        
        const icon = indicator.querySelector('i');
        const text = indicator.querySelector('.music-status-text');
        
        if (!icon || !text) return;
        
        if (this.availableTracks.length === 0) {
            icon.className = 'fas fa-volume-mute';
            text.textContent = 'Нет музыки';
            indicator.classList.add('error');
            indicator.classList.remove('success', 'warning');
        } else if (this.audioElements.backgroundMusic?.paused) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Пауза';
            indicator.classList.add('warning');
            indicator.classList.remove('success', 'error');
        } else {
            icon.className = 'fas fa-music';
            text.textContent = this.currentTrack ? this.currentTrack.name : 'Музыка';
            indicator.classList.add('success');
            indicator.classList.remove('error', 'warning');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.audioSettingsInstance = new AudioSettings();
    }, 100);
});