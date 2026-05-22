class SettingsManager {
    constructor() {
        this.modules = {
            graphics: null,
            audio: null,
            controls: null,
            game: null
        };
        
        this.mainMenu = null;
        this.settings = this.loadSettings();
        this.currentModule = null;
        
        this.init();
    }
    
    init() {
        this.initMainMenu();
        this.initModules();
        this.bindEvents();
        this.bindExistingButtons();
    }

    bindExistingButtons() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showMainMenu());
        }

        const panelSettingsBtn = document.getElementById('panelSettingsBtn');
        if (panelSettingsBtn) {
            panelSettingsBtn.addEventListener('click', () => this.showMainMenu());
        }
    }
    
    initMainMenu() {
        const html = `
            <div class="settings-overlay" id="settingsMainMenu">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-cogs"></i>
                            Настройки игры
                        </h2>
                        <div class="settings-close" id="settingsMainClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-grid">
                            <div class="settings-grid-item" id="menuGraphicsBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-sliders-h"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Графика</h3>
                                    <p>Качество, эффекты и производительность</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="menuAudioBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-music"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Звук</h3>
                                    <p>Громкость, музыка и эффекты</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="menuControlsBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-gamepad"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Управление</h3>
                                    <p>Клавиши, мышь и настройки ввода</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="menuGameBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-gamepad"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Игровые настройки</h3>
                                    <p>Сложность, геймплей и интерфейс</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>

                            <div class="settings-grid-item" id="menuDevBtn">
                                <div class="settings-item-icon" style="color:#ff4757">
                                    <i class="fas fa-code"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Меню разработчика</h3>
                                    <p>Читы, отладка и скрытые функции</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>

                            <div class="settings-grid-item" id="menuAboutBtn">
                                <div class="settings-item-icon" style="color:#3498db">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Об авторе</h3>
                                    <p>Информация об игре и разработчике</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-quick-actions">
                            <h3><i class="fas fa-bolt"></i> Быстрые действия</h3>
                            <div class="quick-actions-grid">
                                <button class="quick-action-btn" id="quickApplyAll">
                                    <i class="fas fa-check"></i>
                                    <span>Применить все</span>
                                </button>
                                <button class="quick-action-btn" id="quickResetAll">
                                    <i class="fas fa-undo"></i>
                                    <span>Сбросить все</span>
                                </button>
                                <button class="quick-action-btn" id="quickSave">
                                    <i class="fas fa-save"></i>
                                    <span>Сохранить</span>
                                </button>
                                <button class="quick-action-btn" id="quickLoad">
                                    <i class="fas fa-download"></i>
                                    <span>Загрузить</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="settings-info">
                            <div class="settings-info-item">
                                <i class="fas fa-keyboard"></i>
                                <span>Горячие клавиши:</span>
                                <div class="hotkey-list">
                                    <span class="hotkey"><kbd>ESC</kbd> - Меню</span>
                                    <span class="hotkey"><kbd>Ctrl+G</kbd> - Графика</span>
                                    <span class="hotkey"><kbd>Ctrl+M</kbd> - Звук</span>
                                    <span class="hotkey"><kbd>Ctrl+C</kbd> - Управление</span>
                                    <span class="hotkey"><kbd>Ctrl+O</kbd> - Игра</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        this.bindMainMenuEvents();
    }
    
    bindMainMenuEvents() {
        const menu = document.getElementById('settingsMainMenu');
        if (!menu) return;
        
        document.getElementById('settingsMainClose').addEventListener('click', () => {
            this.hideMainMenu();
        });
        
        document.getElementById('menuGraphicsBtn').addEventListener('click', () => {
            this.showModule('graphics');
        });
        
        document.getElementById('menuAudioBtn').addEventListener('click', () => {
            this.showModule('audio');
        });
        
        document.getElementById('menuControlsBtn').addEventListener('click', () => {
            this.showModule('controls');
        });
        
        document.getElementById('menuGameBtn').addEventListener('click', () => {
            this.showModule('game');
        });

        document.getElementById('menuDevBtn').addEventListener('click', () => {
            this.hideMainMenu();
            if (typeof showDevMenu === 'function') showDevMenu();
        });

        document.getElementById('menuAboutBtn').addEventListener('click', () => {
            this.hideMainMenu();
            if (typeof showAboutMenu === 'function') showAboutMenu();
        });
        
        document.getElementById('quickApplyAll').addEventListener('click', () => {
            this.applyAllSettings();
            this.showNotification('Все настройки применены!');
        });
        
        document.getElementById('quickResetAll').addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        document.getElementById('quickSave').addEventListener('click', () => {
            this.saveSettings();
            this.showNotification('Настройки сохранены!');
        });
        
        document.getElementById('quickLoad').addEventListener('click', () => {
            this.loadSettings(true);
            this.showNotification('Настройки загружены!');
        });
        
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                this.hideMainMenu();
            }
        });
    }
    
    initModules() {
        if (typeof GraphicsSettings !== 'undefined') {
            this.modules.graphics = new GraphicsSettings();
        }
        
        if (typeof AudioSettings !== 'undefined') {
            this.modules.audio = new AudioSettings();
        }
        
        if (typeof ControlsSettings !== 'undefined') {
            this.modules.controls = new ControlsSettings();
        }
        
        if (typeof GameSettings !== 'undefined') {
            this.modules.game = new GameSettings();
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isAnySettingsVisible()) {
                    e.preventDefault();
                    this.hideAllModules();
                    this.hideMainMenu();
                }
                return;
            }

            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                switch(e.key.toLowerCase()) {
                    case 'g':
                        e.preventDefault();
                        this.showModule('graphics');
                        break;
                    case 'm':
                        e.preventDefault();
                        this.showModule('audio');
                        break;
                    case 'c':
                        e.preventDefault();
                        this.showModule('controls');
                        break;
                    case 'o':
                        e.preventDefault();
                        this.showModule('game');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveSettings();
                        this.showNotification('Настройки сохранены!');
                        break;
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    }
    
    showMainMenu() {
        if (this.isMainMenuVisible()) return;
        
        this.hideAllModules();
        gamePaused = true;
        document.getElementById('settingsMainMenu').classList.add('active');
        this.currentModule = 'main';
    }
    
    hideMainMenu() {
        document.getElementById('settingsMainMenu').classList.remove('active');
        this.currentModule = null;
        if (typeof isInMenuState === 'function' && isInMenuState()) {
            if (typeof enterMenuState === 'function') enterMenuState();
        } else {
            gamePaused = false;
        }
    }
    
    isMainMenuVisible() {
        const menu = document.getElementById('settingsMainMenu');
        return menu && menu.classList.contains('active');
    }
    
    showModule(moduleName) {
        if (this.modules[moduleName] && typeof this.modules[moduleName].showMenu === 'function') {
            this.hideMainMenu();
            this.hideAllModules();
            
            setTimeout(() => {
                this.modules[moduleName].showMenu();
                this.currentModule = moduleName;
            }, 50);
        }
    }
    
    hideModule(moduleName) {
        if (this.modules[moduleName] && typeof this.modules[moduleName].hideMenu === 'function') {
            this.modules[moduleName].hideMenu();
            if (this.currentModule === moduleName) {
                this.currentModule = null;
            }
        }
    }
    
    hideAllModules() {
        Object.keys(this.modules).forEach(moduleName => {
            this.hideModule(moduleName);
        });
    }
    
    isAnySettingsVisible() {
        return Object.values(this.modules).some(module => {
            if (!module || !module.showMenu) return false;
            const overlayId = this.getModuleOverlayId(module);
            if (!overlayId) return false;
            const overlay = document.getElementById(overlayId);
            return overlay && overlay.classList.contains('active');
        });
    }
    
    getModuleOverlayId(module) {
        if (module instanceof GraphicsSettings) return 'graphicsSettingsOverlay';
        if (module instanceof AudioSettings) return 'audioSettingsOverlay';
        if (module instanceof ControlsSettings) return 'controlsSettingsOverlay';
        if (module instanceof GameSettings) return 'gameSettingsOverlay';
        return null;
    }
    
    getModule(moduleName) {
        return this.modules[moduleName];
    }
    
    saveSettings() {
        const allSettings = {};
        
        Object.entries(this.modules).forEach(([key, module]) => {
            if (module && module.settings) {
                allSettings[key] = module.settings;
            }
        });
        
        try { localStorage.setItem('neon_strike_all_settings', JSON.stringify(allSettings)); } catch (e) {}
        
        this.saveIndividualSettings();
        
        return allSettings;
    }
    
    saveIndividualSettings() {
        Object.entries(this.modules).forEach(([key, module]) => {
            if (module && typeof module.saveSettings === 'function') {
                module.saveSettings();
            }
        });
    }
    
    loadSettings(apply = false) {
        const saved = localStorage.getItem('neon_strike_all_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.settings = settings;
                
                Object.entries(settings).forEach(([key, moduleSettings]) => {
                    if (this.modules[key] && this.modules[key].settings) {
                        Object.assign(this.modules[key].settings, moduleSettings);
                        
                        if (typeof this.modules[key].loadSettings === 'function') {
                            this.modules[key].loadSettings();
                        }
                    }
                });
                
                if (apply) {
                    this.applyAllSettings();
                }
                
                return settings;
            } catch (e) {
                console.error('Ошибка загрузки настроек:', e);
                return {};
            }
        }
        return {};
    }
    
    applyAllSettings() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.applySettings === 'function') {
                module.applySettings();
            }
        });
        this.saveSettings();
    }
    
    resetToDefaults() {
        const doReset = () => {
            Object.values(this.modules).forEach(module => {
                if (module && typeof module.resetToDefaults === 'function') {
                    module.resetToDefaults();
                }
            });
            try {
                localStorage.removeItem('neon_strike_all_settings');
                localStorage.removeItem('neon_strike_graphics');
                localStorage.removeItem('neon_strike_audio');
                localStorage.removeItem('neon_strike_controls');
                localStorage.removeItem('neon_strike_game');
            } catch (e) {}
            this.settings = {};
            this.applyAllSettings();
            this.showNotification('Все настройки сброшены к значениям по умолчанию!');
        };
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('Сбросить все настройки<br>к значениям по умолчанию?', doReset);
        } else {
            doReset();
        }
    }
    
    exportSettings() {
        const settings = this.saveSettings();
        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `neon_strike_settings_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    importSettings(jsonString) {
        try {
            const settings = JSON.parse(jsonString);
            Object.entries(settings).forEach(([key, moduleSettings]) => {
                if (this.modules[key] && this.modules[key].settings) {
                    Object.assign(this.modules[key].settings, moduleSettings);
                }
            });
            
            this.saveSettings();
            this.applyAllSettings();
            this.showNotification('Настройки импортированы и применены!');
            return true;
        } catch (e) {
            console.error('Ошибка импорта настроек:', e);
            this.showNotification('Ошибка импорта настроек!', 'error');
            return false;
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid ${type === 'success' ? 'var(--accent)' : 'var(--danger)'};
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
    }
    
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
    
    window.showSettings = () => window.settingsManager?.showMainMenu();
    window.showGraphicsSettings = () => window.settingsManager?.showModule('graphics');
    window.showAudioSettings = () => window.settingsManager?.showModule('audio');
    window.showControlsSettings = () => window.settingsManager?.showModule('controls');
    window.showGameSettings = () => window.settingsManager?.showModule('game');
});

const settingsStyles = document.createElement('style');
settingsStyles.textContent = `
    .settings-quick-actions {
        margin: 25px 0;
        padding: 20px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        border: 1px solid var(--border);
    }
    
    .settings-quick-actions h3 {
        color: var(--accent);
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.2rem;
    }
    
    .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
    }
    
    .quick-action-btn {
        padding: 12px 15px;
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 500;
    }
    
    .quick-action-btn:hover {
        background: rgba(0, 255, 157, 0.1);
        border-color: var(--accent);
        transform: translateY(-2px);
    }
    
    .hotkey-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-left: 10px;
    }
    
    .hotkey {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .hotkey kbd {
        background: var(--accent);
        color: var(--primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-family: monospace;
        font-weight: bold;
    }
    
    .settings-notification.error {
        border-color: var(--danger) !important;
    }
    
    .settings-notification.error i {
        color: var(--danger);
    }
    
    @media (max-width: 768px) {
        .quick-actions-grid {
            grid-template-columns: 1fr;
        }
        
        .hotkey-list {
            flex-direction: column;
            gap: 5px;
        }
    }
`;
document.head.appendChild(settingsStyles);