class ControlsSettings {
    constructor() {
        this.settings = {
            controls: {
                fire: ['MouseLeft', 'Space'],
                autoFire: 'F',
                weapon1: 'Digit1',
                weapon2: 'Digit2',
                weapon3: 'Digit3',
                weapon4: 'Digit4',
                weapon5: 'Digit5',
                pause: 'Escape',
                menu: 'KeyH',
                devMenu: 'KeyM',
                graphicsMenu: ['ControlLeft+KeyG', 'ControlRight+KeyG'],
                audioMenu: ['ControlLeft+KeyM', 'ControlRight+KeyM'],
                spawnPause: 'KeyP',
                clearEnemies: 'KeyC',
                spawnOff: 'Digit0',
                spawnMax: 'Digit9'
            },
            mouseSensitivity: 1.0,
            invertMouseY: false,
            autoFireDefault: false,
            mouseControl: true,
            keyboardControl: true
        };
        
        this.keyMap = new Map();
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.createUI();
        this.bindEvents();
        this.buildKeyMap();
    }
    
    createUI() {
        const html = `
            <div class="settings-overlay" id="controlsSettingsOverlay">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-gamepad"></i>
                            Настройки управления
                        </h2>
                        <div class="settings-close" id="controlsSettingsClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-section">
                            <h3><i class="fas fa-mouse"></i> Настройки мыши</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-arrows-alt"></i> Чувствительность мыши
                                    </label>
                                    <div class="setting-control">
                                        <input type="range" min="0.1" max="3.0" step="0.1" value="${this.settings.mouseSensitivity}"
                                               class="setting-slider" id="mouseSensitivitySlider">
                                        <span class="setting-value" id="mouseSensitivityValue">${this.settings.mouseSensitivity}x</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-exchange-alt"></i> Инвертировать ось Y
                                    </label>
                                    <div class="setting-checkbox" id="invertMouseYToggle"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-keyboard"></i> Назначение клавиш</h3>
                            <div class="controls-table" id="controlsTable">
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-cog"></i> Дополнительные настройки</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-fire"></i> Автоматический огонь по умолчанию
                                    </label>
                                    <div class="setting-checkbox" id="autoFireDefaultToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-mouse-pointer"></i> Управление мышью
                                    </label>
                                    <div class="setting-checkbox" id="mouseControlToggle"></div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <i class="fas fa-keyboard"></i> Управление клавиатурой
                                    </label>
                                    <div class="setting-checkbox" id="keyboardControlToggle"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3><i class="fas fa-info-circle"></i> Справка по управлению</h3>
                            <div class="controls-help">
                                <div class="help-item">
                                    <i class="fas fa-mouse"></i>
                                    <span>Перемещение мыши - управление кораблем</span>
                                </div>
                                <div class="help-item">
                                    <i class="fas fa-mouse-pointer"></i>
                                    <span>ЛКМ или ПРОБЕЛ - стрельба</span>
                                </div>
                                <div class="help-item">
                                    <i class="fas fa-fire"></i>
                                    <span>F - переключение режима стрельбы</span>
                                </div>
                                <div class="help-item">
                                    <i class="fas fa-layer-group"></i>
                                    <span>1-5 - смена оружия</span>
                                </div>
                                <div class="help-item">
                                    <i class="fas fa-pause"></i>
                                    <span>ESC - пауза/меню</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-actions">
                            <button class="settings-action-btn reset" id="controlsResetBtn">
                                <i class="fas fa-undo"></i> Сбросить
                            </button>
                            <button class="settings-action-btn apply" id="controlsApplyBtn">
                                <i class="fas fa-check"></i> Применить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        this.generateControlsTable();
    }
    
    generateControlsTable() {
        const table = document.getElementById('controlsTable');
        table.innerHTML = '';
        
        const controls = [
            { key: 'fire', label: 'Стрельба', default: 'ЛКМ/ПРОБЕЛ' },
            { key: 'autoFire', label: 'Режим стрельбы', default: 'F' },
            { key: 'weapon1', label: 'Оружие 1 (Пистолет)', default: '1' },
            { key: 'weapon2', label: 'Оружие 2 (Винтовка)', default: '2' },
            { key: 'weapon3', label: 'Оружие 3 (Автомат)', default: '3' },
            { key: 'weapon4', label: 'Оружие 4 (Снайперка)', default: '4' },
            { key: 'weapon5', label: 'Оружие 5 (Пулемет)', default: '5' },
            { key: 'pause', label: 'Пауза/Меню', default: 'ESC' },
            { key: 'menu', label: 'В меню', default: 'H' },
            { key: 'devMenu', label: 'Меню разработчика', default: 'M' },
            { key: 'graphicsMenu', label: 'Настройки графики', default: 'Ctrl+G' },
            { key: 'audioMenu', label: 'Настройки звука', default: 'Ctrl+M' },
            { key: 'spawnPause', label: 'Пауза спавна', default: 'P' },
            { key: 'clearEnemies', label: 'Очистить врагов', default: 'C' },
            { key: 'spawnOff', label: 'Выключить спавн', default: '0' },
            { key: 'spawnMax', label: 'Макс. спавн', default: '9' }
        ];
        
        controls.forEach(control => {
            const row = document.createElement('div');
            row.className = 'control-row';
            row.innerHTML = `
                <div class="control-label">${control.label}</div>
                <div class="control-key" data-key="${control.key}">
                    ${this.formatKeyDisplay(this.settings.controls[control.key])}
                </div>
                <button class="control-change-btn" data-key="${control.key}">
                    <i class="fas fa-edit"></i> Изменить
                </button>
            `;
            table.appendChild(row);
        });
    }
    
    formatKeyDisplay(key) {
        if (Array.isArray(key)) {
            return key.map(k => this.formatSingleKey(k)).join(' или ');
        }
        return this.formatSingleKey(key);
    }
    
    formatSingleKey(key) {
        const keyMap = {
            'MouseLeft': 'ЛКМ',
            'MouseRight': 'ПКМ',
            'MouseMiddle': 'Средняя кнопка',
            'Space': 'ПРОБЕЛ',
            'Escape': 'ESC',
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3',
            'Digit4': '4',
            'Digit5': '5',
            'KeyH': 'H',
            'KeyM': 'M',
            'KeyP': 'P',
            'KeyC': 'C',
            'Digit0': '0',
            'Digit9': '9',
            'KeyF': 'F',
            'ControlLeft+KeyG': 'Ctrl+G',
            'ControlRight+KeyG': 'Ctrl+G',
            'ControlLeft+KeyM': 'Ctrl+M',
            'ControlRight+KeyM': 'Ctrl+M'
        };
        
        return keyMap[key] || key;
    }
    
    bindEvents() {
        document.getElementById('controlsSettingsClose').addEventListener('click', () => this.hideMenu());
        
        document.getElementById('controlsApplyBtn').addEventListener('click', () => this.applySettings());
        document.getElementById('controlsResetBtn').addEventListener('click', () => this.resetToDefaults());
        
        document.getElementById('mouseSensitivitySlider').addEventListener('input', (e) => {
            this.settings.mouseSensitivity = parseFloat(e.target.value);
            document.getElementById('mouseSensitivityValue').textContent = e.target.value + 'x';
        });
        
        document.getElementById('invertMouseYToggle').addEventListener('click', () => {
            this.settings.invertMouseY = !this.settings.invertMouseY;
            this.updateUI();
        });
        
        document.getElementById('autoFireDefaultToggle').addEventListener('click', () => {
            this.settings.autoFireDefault = !this.settings.autoFireDefault;
            this.updateUI();
        });
        
        document.getElementById('mouseControlToggle').addEventListener('click', () => {
            this.settings.mouseControl = !this.settings.mouseControl;
            this.updateUI();
        });
        
        document.getElementById('keyboardControlToggle').addEventListener('click', () => {
            this.settings.keyboardControl = !this.settings.keyboardControl;
            this.updateUI();
        });
        
        document.querySelectorAll('.control-change-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.closest('.control-change-btn').dataset.key;
                this.startKeyBinding(key);
            });
        });
    }
    
    updateUI() {
        document.getElementById('mouseSensitivitySlider').value = this.settings.mouseSensitivity;
        document.getElementById('mouseSensitivityValue').textContent = this.settings.mouseSensitivity + 'x';
        
        document.getElementById('invertMouseYToggle').classList.toggle('active', this.settings.invertMouseY);
        document.getElementById('autoFireDefaultToggle').classList.toggle('active', this.settings.autoFireDefault);
        document.getElementById('mouseControlToggle').classList.toggle('active', this.settings.mouseControl);
        document.getElementById('keyboardControlToggle').classList.toggle('active', this.settings.keyboardControl);
        
        document.querySelectorAll('.control-key').forEach(element => {
            const key = element.dataset.key;
            element.textContent = this.formatKeyDisplay(this.settings.controls[key]);
        });
    }
    
    startKeyBinding(key) {
        const keyElement = document.querySelector(`.control-key[data-key="${key}"]`);
        if (!keyElement) return;
        
        keyElement.innerHTML = '<span class="binding-prompt">Нажмите новую клавишу...</span>';
        keyElement.classList.add('binding');
        
        const finishBinding = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            let newKey;
            if (e.type === 'mousedown') {
                switch(e.button) {
                    case 0: newKey = 'MouseLeft'; break;
                    case 1: newKey = 'MouseMiddle'; break;
                    case 2: newKey = 'MouseRight'; break;
                    default: return;
                }
            } else if (e.type === 'keydown') {
                if (e.ctrlKey) {
                    newKey = `Control${e.location === 1 ? 'Left' : 'Right'}+${e.code}`;
                } else {
                    newKey = e.code;
                }
            } else {
                return;
            }
            
            this.settings.controls[key] = newKey;
            
            keyElement.textContent = this.formatKeyDisplay(newKey);
            keyElement.classList.remove('binding');
            
            document.removeEventListener('keydown', finishBinding);
            document.removeEventListener('mousedown', finishBinding);
            
            this.showNotification(`Клавиша для "${this.getControlLabel(key)}" изменена`);
        };
        
        document.addEventListener('keydown', finishBinding, { once: true });
        document.addEventListener('mousedown', finishBinding, { once: true });
        
        setTimeout(() => {
            if (keyElement.classList.contains('binding')) {
                keyElement.textContent = this.formatKeyDisplay(this.settings.controls[key]);
                keyElement.classList.remove('binding');
                document.removeEventListener('keydown', finishBinding);
                document.removeEventListener('mousedown', finishBinding);
            }
        }, 5000);
    }
    
    getControlLabel(key) {
        const labels = {
            'fire': 'Стрельба',
            'autoFire': 'Режим стрельбы',
            'weapon1': 'Оружие 1',
            'weapon2': 'Оружие 2',
            'weapon3': 'Оружие 3',
            'weapon4': 'Оружие 4',
            'weapon5': 'Оружие 5',
            'pause': 'Пауза',
            'menu': 'В меню',
            'devMenu': 'Меню разработчика',
            'graphicsMenu': 'Настройки графики',
            'audioMenu': 'Настройки звука',
            'spawnPause': 'Пауза спавна',
            'clearEnemies': 'Очистить врагов',
            'spawnOff': 'Выключить спавн',
            'spawnMax': 'Макс. спавн'
        };
        
        return labels[key] || key;
    }
    
    buildKeyMap() {
        this.keyMap.clear();
        
        Object.entries(this.settings.controls).forEach(([action, key]) => {
            if (Array.isArray(key)) {
                key.forEach(k => this.keyMap.set(k, action));
            } else {
                this.keyMap.set(key, action);
            }
        });
    }
    
    showMenu() {
        gamePaused = true;
        document.getElementById('controlsSettingsOverlay').classList.add('active');
        this.updateUI();
    }
    
    hideMenu() {
        document.getElementById('controlsSettingsOverlay').classList.remove('active');
        if (window.settingsMenu) {
            window.settingsMenu.show();
        } else {
            gamePaused = false;
        }
    }
    
    applySettings() {
        this.buildKeyMap();
        this.saveSettings();
        this.applyToGame();
        this.hideMenu();
        this.showNotification('Настройки управления применены!');
    }
    
    applyToGame() {
        window.controlsSettings = this.settings;
        window.keyMap = this.keyMap;
        
        if (window.gameInstance) {
            window.gameInstance.mouseSensitivity = this.settings.mouseSensitivity;
            window.gameInstance.invertMouseY = this.settings.invertMouseY;
        }
        
        if (window.autoFireMode !== undefined) {
            window.autoFireMode = this.settings.autoFireDefault;
            if (typeof updateFireModeUI === 'function') {
                updateFireModeUI();
            }
        }
    }
    
    resetToDefaults() {
        this.settings = {
            controls: {
                fire: ['MouseLeft', 'Space'],
                autoFire: 'F',
                weapon1: 'Digit1',
                weapon2: 'Digit2',
                weapon3: 'Digit3',
                weapon4: 'Digit4',
                weapon5: 'Digit5',
                pause: 'Escape',
                menu: 'KeyH',
                devMenu: 'KeyM',
                graphicsMenu: ['ControlLeft+KeyG', 'ControlRight+KeyG'],
                audioMenu: ['ControlLeft+KeyM', 'ControlRight+KeyM'],
                spawnPause: 'KeyP',
                clearEnemies: 'KeyC',
                spawnOff: 'Digit0',
                spawnMax: 'Digit9'
            },
            mouseSensitivity: 1.0,
            invertMouseY: false,
            autoFireDefault: false,
            mouseControl: true,
            keyboardControl: true
        };
        this.applySettings();
    }
    
    saveSettings() {
        try { localStorage.setItem('neon_strike_controls', JSON.stringify(this.settings)); } catch (e) {}
    }
    
    loadSettings() {
        const saved = localStorage.getItem('neon_strike_controls');
        if (saved) {
            try {
                this.settings = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки настроек управления:', e);
            }
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.innerHTML = `
            <i class="fas fa-gamepad"></i>
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
    
    checkKey(keyCode, ctrlKey = false) {
        let keyToCheck = keyCode;
        if (ctrlKey) {
            keyToCheck = `Control${keyCode.startsWith('ControlLeft') ? 'Left' : 'Right'}+${keyCode}`;
        }
        
        const action = this.keyMap.get(keyToCheck);
        if (action) {
            return { action, key: keyToCheck };
        }
        return null;
    }
}