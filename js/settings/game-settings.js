class GameSettings {
    constructor() {
        this.settings = {
            difficulty: 'normal',
            spawnRate: 0.05,
            enemyHealthMultiplier: 1.0,
            enemySpeedMultiplier: 1.0,
            playerHealthMultiplier: 1.0,
            weaponDamageMultiplier: 1.0,
            rewardMultiplier: 1.0,
            showTutorial: true,
            showDamageNumbers: true,
            showHealthBars: true,
            language: 'ru',
            autoSave: true,
            saveInterval: 300,
            showComboCounter: true,
            screenShake: true,
            hitEffects: true,
            particleEffects: true
        };
        
        this.difficultyPresets = {
            easy: {
                spawnRate: 0.03,
                enemyHealthMultiplier: 0.7,
                enemySpeedMultiplier: 0.8,
                playerHealthMultiplier: 1.5,
                weaponDamageMultiplier: 1.2,
                rewardMultiplier: 0.8
            },
            normal: {
                spawnRate: 0.05,
                enemyHealthMultiplier: 1.0,
                enemySpeedMultiplier: 1.0,
                playerHealthMultiplier: 1.0,
                weaponDamageMultiplier: 1.0,
                rewardMultiplier: 1.0
            },
            hard: {
                spawnRate: 0.08,
                enemyHealthMultiplier: 1.5,
                enemySpeedMultiplier: 1.2,
                playerHealthMultiplier: 0.8,
                weaponDamageMultiplier: 0.8,
                rewardMultiplier: 1.5
            },
            nightmare: {
                spawnRate: 0.12,
                enemyHealthMultiplier: 2.0,
                enemySpeedMultiplier: 1.5,
                playerHealthMultiplier: 0.5,
                weaponDamageMultiplier: 0.6,
                rewardMultiplier: 2.0
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.createUI();
        this.bindEvents();
    }
    
    createUI() {
        const html = `
            <div class="settings-overlay" id="gameSettingsOverlay">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-cogs"></i>
                            Игровые настройки
                        </h2>
                        <div class="settings-close" id="gameSettingsClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-section">
                            <h3><i class="fas fa-skull"></i> Сложность</h3>
                            <div class="difficulty-presets" id="difficultyPresets">
                                <div class="difficulty-preset" data-difficulty="easy">
                                    <div class="difficulty-icon">
                                        <i class="fas fa-smile"></i>
                                    </div>
                                    <div class="difficulty-info">
                                        <h4>Легкая</h4>
                                        <p>Для новичков</p>
                                    </div>
                                    <div class="difficulty-selector"></div>
                                </div>
                                
                                <div class="difficulty-preset" data-difficulty="normal">
                                    <div class="difficulty-icon">
                                        <i class="fas fa-meh"></i>
                                    </div>
                                    <div class="difficulty-info">
                                        <h4>Нормальная</h4>
                                        <p>Стандартный опыт</p>
                                    </div>
                                    <div class="difficulty-selector"></div>
                                </div>
                                
                                <div class="difficulty-preset" data-difficulty="hard">
                                    <div class="difficulty-icon">
                                        <i class="fas fa-frown"></i>
                                    </div>
                                    <div class="difficulty-info">
                                        <h4>Сложная</h4>
                                        <p>Для опытных игроков</p>
                                    </div>
                                    <div class="difficulty-selector"></div>
                                </div>
                                
                                <div class="difficulty-preset" data-difficulty="nightmare">
                                    <div class="difficulty-icon">
                                        <i class="fas fa-skull"></i>
                                    </div>
                                    <div class="difficulty-info">
                                        <h4>Кошмар</h4>
                                        <p>Только для смелых</p>
                                    </div>
                                    <div class="difficulty-selector"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-balance-scale"></i> Баланс игры</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-bolt"></i> Множитель урона
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.weaponDamageMultiplier}"
                                               class="setting-slider" id="damageMultiplierSlider">
                                        <span class="setting-value" id="damageMultiplierValue">${this.settings.weaponDamageMultiplier}x</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-heart"></i> Множитель здоровья игрока
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.playerHealthMultiplier}"
                                               class="setting-slider" id="playerHealthMultiplierSlider">
                                        <span class="setting-value" id="playerHealthMultiplierValue">${this.settings.playerHealthMultiplier}x</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-shield-alt"></i> Множитель здоровья врагов
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.enemyHealthMultiplier}"
                                               class="setting-slider" id="enemyHealthMultiplierSlider">
                                        <span class="setting-value" id="enemyHealthMultiplierValue">${this.settings.enemyHealthMultiplier}x</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-tachometer-alt"></i> Множитель скорости врагов
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.enemySpeedMultiplier}"
                                               class="setting-slider" id="enemySpeedMultiplierSlider">
                                        <span class="setting-value" id="enemySpeedMultiplierValue">${this.settings.enemySpeedMultiplier}x</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-coins"></i> Множитель наград
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.rewardMultiplier}"
                                               class="setting-slider" id="rewardMultiplierSlider">
                                        <span class="setting-value" id="rewardMultiplierValue">${this.settings.rewardMultiplier}x</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-eye"></i> Визуальные эффекты</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-shake"></i> Тряска экрана
                                    </label>
                                    <div class="setting-checkbox" id="screenShakeToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-burst"></i> Эффекты попаданий
                                    </label>
                                    <div class="setting-checkbox" id="hitEffectsToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-sparkles"></i> Частицы
                                    </label>
                                    <div class="setting-checkbox" id="particleEffectsToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-heartbeat"></i> Полоски здоровья
                                    </label>
                                    <div class="setting-checkbox" id="healthBarsToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-calculator"></i> Числа урона
                                    </label>
                                    <div class="setting-checkbox" id="damageNumbersToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-fire"></i> Счетчик комбо
                                    </label>
                                    <div class="setting-checkbox" id="comboCounterToggle"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-user-graduate"></i> Интерфейс и обучение</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-graduation-cap"></i> Показывать обучение
                                    </label>
                                    <div class="setting-checkbox" id="tutorialToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-language"></i> Язык
                                    </label>
                                    <select class="setting-select" id="languageSelect">
                                        <option value="ru">Русский</option>
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="de">Deutsch</option>
                                    </select>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-save"></i> Автосохранение
                                    </label>
                                    <div class="setting-checkbox" id="autoSaveToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-clock"></i> Интервал автосохранения (сек)
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="30" max="600" step="30" value="${this.settings.saveInterval}"
                                               class="setting-slider" id="saveIntervalSlider">
                                        <span class="setting-value" id="saveIntervalValue">${this.settings.saveInterval}с</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-actions">
                            <button class="settings-action-btn reset" id="gameResetBtn">
                                <i class="fas fa-undo"></i> Сбросить
                            </button>
                            <button class="settings-action-btn apply" id="gameApplyBtn">
                                <i class="fas fa-check"></i> Применить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        this.updateUI();
    }
    
    bindEvents() {
        document.getElementById('gameSettingsClose').addEventListener('click', () => this.hideMenu());
        
        document.getElementById('gameApplyBtn').addEventListener('click', () => this.applySettings());
        document.getElementById('gameResetBtn').addEventListener('click', () => this.resetToDefaults());
        
        document.querySelectorAll('.difficulty-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                this.selectDifficulty(preset.dataset.difficulty);
            });
        });
        
        const sliders = [
            'damageMultiplierSlider',
            'playerHealthMultiplierSlider',
            'enemyHealthMultiplierSlider',
            'enemySpeedMultiplierSlider',
            'rewardMultiplierSlider',
            'saveIntervalSlider'
        ];
        
        sliders.forEach(sliderId => {
            document.getElementById(sliderId).addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const settingKey = sliderId.replace('Slider', '');
                this.settings[settingKey] = value;
                document.getElementById(sliderId.replace('Slider', 'Value')).textContent = 
                    sliderId === 'saveIntervalSlider' ? value + 'с' : value.toFixed(1) + 'x';
            });
        });
        
        const toggles = [
            'screenShakeToggle',
            'hitEffectsToggle',
            'particleEffectsToggle',
            'healthBarsToggle',
            'damageNumbersToggle',
            'comboCounterToggle',
            'tutorialToggle',
            'autoSaveToggle'
        ];
        
        toggles.forEach(toggleId => {
            document.getElementById(toggleId).addEventListener('click', () => {
                const settingKey = toggleId.replace('Toggle', '');
                this.settings[settingKey] = !this.settings[settingKey];
                this.updateUI();
            });
        });
        
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.settings.language = e.target.value;
        });
    }
    
    updateUI() {
        document.querySelectorAll('.difficulty-preset').forEach(preset => {
            preset.classList.toggle('selected', preset.dataset.difficulty === this.settings.difficulty);
        });
        
        document.getElementById('damageMultiplierSlider').value = this.settings.weaponDamageMultiplier;
        document.getElementById('damageMultiplierValue').textContent = this.settings.weaponDamageMultiplier.toFixed(1) + 'x';
        
        document.getElementById('playerHealthMultiplierSlider').value = this.settings.playerHealthMultiplier;
        document.getElementById('playerHealthMultiplierValue').textContent = this.settings.playerHealthMultiplier.toFixed(1) + 'x';
        
        document.getElementById('enemyHealthMultiplierSlider').value = this.settings.enemyHealthMultiplier;
        document.getElementById('enemyHealthMultiplierValue').textContent = this.settings.enemyHealthMultiplier.toFixed(1) + 'x';
        
        document.getElementById('enemySpeedMultiplierSlider').value = this.settings.enemySpeedMultiplier;
        document.getElementById('enemySpeedMultiplierValue').textContent = this.settings.enemySpeedMultiplier.toFixed(1) + 'x';
        
        document.getElementById('rewardMultiplierSlider').value = this.settings.rewardMultiplier;
        document.getElementById('rewardMultiplierValue').textContent = this.settings.rewardMultiplier.toFixed(1) + 'x';
        
        document.getElementById('saveIntervalSlider').value = this.settings.saveInterval;
        document.getElementById('saveIntervalValue').textContent = this.settings.saveInterval + 'с';
        
        document.getElementById('screenShakeToggle').classList.toggle('active', this.settings.screenShake);
        document.getElementById('hitEffectsToggle').classList.toggle('active', this.settings.hitEffects);
        document.getElementById('particleEffectsToggle').classList.toggle('active', this.settings.particleEffects);
        document.getElementById('healthBarsToggle').classList.toggle('active', this.settings.showHealthBars);
        document.getElementById('damageNumbersToggle').classList.toggle('active', this.settings.showDamageNumbers);
        document.getElementById('comboCounterToggle').classList.toggle('active', this.settings.showComboCounter);
        document.getElementById('tutorialToggle').classList.toggle('active', this.settings.showTutorial);
        document.getElementById('autoSaveToggle').classList.toggle('active', this.settings.autoSave);
        
        document.getElementById('languageSelect').value = this.settings.language;
    }
    
    selectDifficulty(difficulty) {
        this.settings.difficulty = difficulty;
        
        const preset = this.difficultyPresets[difficulty];
        if (preset) {
            Object.assign(this.settings, preset);
        }
        
        this.updateUI();
    }
    
    showMenu() {
        gamePaused = true;
        document.getElementById('gameSettingsOverlay').classList.add('active');
        this.updateUI();
    }
    
    hideMenu() {
        gamePaused = false;
        document.getElementById('gameSettingsOverlay').classList.remove('active');
    }
    
    applySettings() {
        this.saveSettings();
        this.applyToGame();
        this.hideMenu();
        this.showNotification('Игровые настройки применены!');
    }
    
    applyToGame() {
        window.gameSettings = this.settings;
        
        if (window.gameInstance) {
            window.gameInstance.difficultyMultipliers = {
                weaponDamage: this.settings.weaponDamageMultiplier,
                playerHealth: this.settings.playerHealthMultiplier,
                enemyHealth: this.settings.enemyHealthMultiplier,
                enemySpeed: this.settings.enemySpeedMultiplier,
                reward: this.settings.rewardMultiplier
            };
            
            window.gameInstance.baseSpawnRate = this.settings.spawnRate;
            
            window.gameInstance.screenShakeEnabled = this.settings.screenShake;
            window.gameInstance.showHealthBars = this.settings.showHealthBars;
            window.gameInstance.showDamageNumbers = this.settings.showDamageNumbers;
        }
        
        if (this.settings.autoSave) {
            this.setupAutoSave();
        } else {
            this.clearAutoSave();
        }
    }
    
    setupAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (window.gameInstance && typeof window.gameInstance.saveGame === 'function') {
                window.gameInstance.saveGame();
            }
        }, this.settings.saveInterval * 1000);
    }
    
    clearAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    resetToDefaults() {
        this.selectDifficulty('normal');
        this.applySettings();
    }
    
    saveSettings() {
        try { localStorage.setItem('neon_strike_game', JSON.stringify(this.settings)); } catch (e) {}
    }
    
    loadSettings() {
        const saved = localStorage.getItem('neon_strike_game');
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки игровых настроек:', e);
            }
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.innerHTML = `
            <i class="fas fa-cogs"></i>
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
}