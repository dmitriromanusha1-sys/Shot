class GraphicsSettings {
    constructor() {
        this.settings = {
            preset: 'medium',
            particles: true,
            particlesQuality: 'medium',
            shadows: true,
            blurEffects: true,
            antialiasing: true,
            showFPS: false,
            vsync: true,
            resolution: '1920x1080',
            resolutionScale: 1.0,
            textureQuality: 'medium',
            lightingQuality: 'medium'
        };
        
        this.currentFPS = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsInterval = null;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.createUI();
        this.bindEvents();
        this.startFPSTracking();
        this.applySettings();
    }
    
    createUI() {
        const html = `
            <div class="settings-overlay" id="graphicsSettingsOverlay">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-sliders-h"></i>
                            Настройки графики
                        </h2>
                        <div class="settings-close" id="graphicsSettingsClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-section">
                            <h3><i class="fas fa-prescription-bottle"></i> Пресеты графики</h3>
                            <div class="graphics-presets" id="graphicsPresets">
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-cog"></i> Расширенные настройки</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-fire"></i> Качество частиц
                                    </label>
                                    <select class="setting-select" id="particlesQualitySelect">
                                        <option value="low">Низкое</option>
                                        <option value="medium">Среднее</option>
                                        <option value="high">Высокое</option>
                                    </select>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-moon"></i> Тени
                                    </label>
                                    <div class="setting-checkbox" id="shadowsToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-blur"></i> Эффекты размытия
                                    </label>
                                    <div class="setting-checkbox" id="blurToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-wave-square"></i> Сглаживание
                                    </label>
                                    <div class="setting-checkbox" id="antialiasingToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-sync"></i> Вертикальная синхронизация (VSync)
                                    </label>
                                    <div class="setting-checkbox" id="vsyncToggle"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-chart-line"></i> Производительность</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-tachometer-alt"></i> Показать FPS
                                    </label>
                                    <div class="setting-checkbox" id="showFPSToggle"></div>
                                </div>

                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-desktop"></i> Разрешение
                                    </label>
                                    <select class="setting-select" id="resolutionSelect">
                                        <option value="900x650">900×650 (По умолчанию)</option>
                                        <option value="1280x720">1280×720 (HD)</option>
                                        <option value="1920x1080">1920×1080 (Full HD)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-info-circle"></i> Информация</h3>
                            <div class="settings-group" id="graphicsInfo">
                                <div class="setting-item">
                                    <span class="setting-label">Текущий FPS:</span>
                                    <span class="setting-value" id="currentFPSValue">0</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Разрешение:</span>
                                    <span class="setting-value" id="resolutionValue">1920×1080</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Режим графики:</span>
                                    <span class="setting-value" id="presetValue">Средняя</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-actions">
                            <button class="settings-action-btn reset" id="graphicsResetBtn">
                                <i class="fas fa-undo"></i> Сбросить
                            </button>
                            <button class="settings-action-btn apply" id="graphicsApplyBtn">
                                <i class="fas fa-check"></i> Применить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        this.generatePresetButtons();
        this.updateUI();
    }
    
    generatePresetButtons() {
        const presetsContainer = document.getElementById('graphicsPresets');
        const presets = [
            { id: 'very-low', name: 'Очень низкая', icon: 'fa-battery-empty', desc: 'Максимальная производительность' },
            { id: 'low', name: 'Низкая', icon: 'fa-battery-quarter', desc: 'Высокая производительность' },
            { id: 'medium', name: 'Средняя', icon: 'fa-adjust', desc: 'Баланс качества и производительности' },
            { id: 'high', name: 'Высокая', icon: 'fa-battery-three-quarters', desc: 'Улучшенная графика' },
            { id: 'ultra', name: 'Ультра', icon: 'fa-battery-full', desc: 'Максимальное качество' }
        ];
        
        presetsContainer.innerHTML = '';
        presets.forEach(preset => {
            const btn = document.createElement('div');
            btn.className = `graphics-preset ${preset.id === this.settings.preset ? 'selected' : ''}`;
            btn.dataset.preset = preset.id;
            btn.innerHTML = `
                <div class="preset-icon">
                    <i class="fas ${preset.icon}"></i>
                </div>
                <div class="preset-info">
                    <h4>${preset.name}</h4>
                    <p>${preset.desc}</p>
                </div>
                <div class="preset-selector">
                    <div class="preset-radio"></div>
                </div>
            `;
            btn.addEventListener('click', () => this.selectPreset(preset.id));
            presetsContainer.appendChild(btn);
        });
    }

    bindEvents() {
        document.getElementById('graphicsSettingsClose').addEventListener('click', () => this.hideMenu());

        document.getElementById('graphicsApplyBtn').addEventListener('click', () => this.applySettings());

        document.getElementById('graphicsResetBtn').addEventListener('click', () => this.resetToDefaults());
        
        document.getElementById('particlesQualitySelect').addEventListener('change', (e) => {
            this.settings.particlesQuality = e.target.value;
            this.updateUI();
        });
        
        document.getElementById('shadowsToggle').addEventListener('click', () => {
            this.settings.shadows = !this.settings.shadows;
            this.updateUI();
        });
        
        document.getElementById('blurToggle').addEventListener('click', () => {
            this.settings.blurEffects = !this.settings.blurEffects;
            this.updateUI();
        });
        
        document.getElementById('antialiasingToggle').addEventListener('click', () => {
            this.settings.antialiasing = !this.settings.antialiasing;
            this.updateUI();
        });
        
        document.getElementById('vsyncToggle').addEventListener('click', () => {
            this.settings.vsync = !this.settings.vsync;
            this.updateUI();
        });
        
        document.getElementById('showFPSToggle').addEventListener('click', () => {
            this.settings.showFPS = !this.settings.showFPS;
            this.updateUI();
        });
        
        document.getElementById('resolutionSelect').addEventListener('change', (e) => {
            this.settings.resolution = e.target.value;
            this.updateUI();
        });
    }
    
    updateUI() {
        document.querySelectorAll('.graphics-preset').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.preset === this.settings.preset);
        });
        
        document.getElementById('particlesQualitySelect').value = this.settings.particlesQuality;
        
        document.getElementById('shadowsToggle').classList.toggle('active', this.settings.shadows);
        document.getElementById('blurToggle').classList.toggle('active', this.settings.blurEffects);
        document.getElementById('antialiasingToggle').classList.toggle('active', this.settings.antialiasing);
        document.getElementById('vsyncToggle').classList.toggle('active', this.settings.vsync);
        document.getElementById('showFPSToggle').classList.toggle('active', this.settings.showFPS);
        
        document.getElementById('resolutionSelect').value = this.settings.resolution || '1920x1080';

        const [rw, rh] = (this.settings.resolution || '1920x1080').split('x');
        document.getElementById('resolutionValue').textContent = `${rw}×${rh}`;

        document.getElementById('currentFPSValue').textContent = Math.round(this.currentFPS);
        document.getElementById('presetValue').textContent = this.getPresetName(this.settings.preset);
    }
    
    getPresetName(presetId) {
        const names = {
            'very-low': 'Очень низкая',
            'low': 'Низкая',
            'medium': 'Средняя',
            'high': 'Высокая',
            'ultra': 'Ультра'
        };
        return names[presetId] || 'Средняя';
    }
    
    selectPreset(preset) {
        switch(preset) {
            case 'very-low':
                this.settings = {
                    preset: 'very-low',
                    particles: false,
                    particlesQuality: 'low',
                    shadows: false,
                    blurEffects: false,
                    antialiasing: false,
                    showFPS: true,
                    vsync: false,
                    resolution: '900x650',
                    resolutionScale: 1.0,
                    textureQuality: 'low',
                    lightingQuality: 'low'
                };
                break;
            case 'low':
                this.settings = {
                    preset: 'low',
                    particles: true,
                    particlesQuality: 'low',
                    shadows: false,
                    blurEffects: false,
                    antialiasing: true,
                    showFPS: false,
                    vsync: false,
                    resolution: '1280x720',
                    resolutionScale: 1.0,
                    textureQuality: 'low',
                    lightingQuality: 'low'
                };
                break;
            case 'medium':
                this.settings = {
                    preset: 'medium',
                    particles: true,
                    particlesQuality: 'medium',
                    shadows: true,
                    blurEffects: true,
                    antialiasing: true,
                    showFPS: false,
                    vsync: true,
                    resolution: '1920x1080',
                    resolutionScale: 1.0,
                    textureQuality: 'medium',
                    lightingQuality: 'medium'
                };
                break;
            case 'high':
                this.settings = {
                    preset: 'high',
                    particles: true,
                    particlesQuality: 'high',
                    shadows: true,
                    blurEffects: true,
                    antialiasing: true,
                    showFPS: false,
                    vsync: true,
                    resolution: '1920x1080',
                    resolutionScale: 1.0,
                    textureQuality: 'high',
                    lightingQuality: 'high'
                };
                break;
            case 'ultra':
                this.settings = {
                    preset: 'ultra',
                    particles: true,
                    particlesQuality: 'high',
                    shadows: true,
                    blurEffects: true,
                    antialiasing: true,
                    showFPS: true,
                    vsync: true,
                    resolution: '1920x1080',
                    resolutionScale: 1.0,
                    textureQuality: 'high',
                    lightingQuality: 'high'
                };
                break;
        }
        
        this.generatePresetButtons();
        this.updateUI();
    }
    
    showMenu() {
        gamePaused = true;
        document.getElementById('graphicsSettingsOverlay').classList.add('active');
        this.updateUI();
    }
    
    hideMenu() {
        document.getElementById('graphicsSettingsOverlay').classList.remove('active');
        if (window.settingsMenu) {
            window.settingsMenu.show();
        } else {
            gamePaused = false;
        }
    }
    
    applySettings() {
        this.applyCanvasSettings();
        this.updateFPSIndicator();
        this.saveSettings();
        this.hideMenu();
        this.showNotification('Настройки графики применены!');
    }
    
    applyCanvasSettings() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const [rw, rh] = (this.settings.resolution || '1920x1080').split('x').map(Number);
        const container = canvas.parentElement;

        canvas.width = rw;
        canvas.height = rh;

        if (container) {
            const scaleX = container.clientWidth / rw;
            const scaleY = container.clientHeight / rh;
            const scale = Math.min(scaleX, scaleY, 1);
            canvas.style.width = rw + 'px';
            canvas.style.height = rh + 'px';
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'top left';
            container.style.overflow = 'hidden';
        }

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = this.settings.antialiasing;
        ctx.imageSmoothingQuality = this.settings.antialiasing ? 'high' : 'low';

        if (this.settings.blurEffects) {
            canvas.style.filter = '';
        } else {
            canvas.style.filter = 'none';
        }

        if (typeof resizeCanvas === 'function') resizeCanvas();

        window.graphicsSettings = this.settings;
    }
    
    updateFPSIndicator() {
        const fpsIndicator = document.getElementById('fpsIndicator');
        if (!fpsIndicator) {
            this.createFPSIndicator();
        }
        
        if (this.settings.showFPS) {
            document.getElementById('fpsIndicator').classList.add('active');
        } else {
            document.getElementById('fpsIndicator').classList.remove('active');
        }
    }
    
    createFPSIndicator() {
        if (document.getElementById('fpsIndicator')) return;
        
        const fpsIndicator = document.createElement('div');
        fpsIndicator.id = 'fpsIndicator';
        fpsIndicator.className = 'fps-indicator';
        fpsIndicator.innerHTML = 'FPS: <span class="fps-value">0</span>';
        document.body.appendChild(fpsIndicator);
    }
    
    startFPSTracking() {
        this.fpsInterval = setInterval(() => {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;
            
            if (deltaTime >= 1000) {
                this.currentFPS = (this.frameCount * 1000) / deltaTime;
                this.lastTime = currentTime;
                this.frameCount = 0;
                
                const fpsValue = document.querySelector('.fps-value');
                if (fpsValue) {
                    fpsValue.textContent = Math.round(this.currentFPS);
                    fpsValue.style.color = this.currentFPS < 30 ? 'var(--danger)' : 
                                          this.currentFPS < 50 ? 'var(--warning)' : 'var(--accent)';
                }
                
                if (document.getElementById('graphicsSettingsOverlay').classList.contains('active')) {
                    this.updateUI();
                }
            }
        }, 100);
        
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => {
            this.frameCount++;
            return originalRAF(callback);
        };
    }
    
    resetToDefaults() {
        this.selectPreset('medium');
        this.applySettings();
    }
    
    saveSettings() {
        try { localStorage.setItem('neon_strike_graphics', JSON.stringify(this.settings)); } catch (e) {}
    }
    
    loadSettings() {
        const saved = localStorage.getItem('neon_strike_graphics');
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки настроек графики:', e);
            }
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid var(--accent);
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: var(--glow);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    shouldDrawParticles() {
        return this.settings.particles;
    }
    
    getParticlesQuality() {
        return this.settings.particlesQuality;
    }
    
    shouldDrawShadows() {
        return this.settings.shadows;
    }
}