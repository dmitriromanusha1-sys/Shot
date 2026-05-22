class SettingsMenu {
    constructor() {
        this.isVisible = false;
        this.init();
    }
    
    init() {
        this.createUI();
        this.bindEvents();
    }
    
    createUI() {
        const html = `
            <div class="settings-overlay" id="settingsMenuOverlay">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="settings-title">
                            <i class="fas fa-cogs"></i>
                            Настройки
                        </h2>
                        <div class="settings-close" id="settingsMenuClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-grid">
                            <div class="settings-grid-item" id="settingsGraphicsBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-sliders-h"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Графика</h3>
                                    <p>Настройки качества, эффектов и производительности</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="settingsAudioBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-music"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Звук</h3>
                                    <p>Громкость, музыка и звуковые эффекты</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="settingsControlsBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-gamepad"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Управление</h3>
                                    <p>Назначение клавиш и настройки мыши</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                            
                            <div class="settings-grid-item" id="settingsGameBtn">
                                <div class="settings-item-icon">
                                    <i class="fas fa-cogs"></i>
                                </div>
                                <div class="settings-item-content">
                                    <h3>Игровые настройки</h3>
                                    <p>Сложность, эффекты и игровой процесс</p>
                                </div>
                                <div class="settings-item-arrow">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-info">
                            <div class="settings-info-item">
                                <i class="fas fa-keyboard"></i>
                                <span>Быстрые клавиши: <strong>ESC</strong> - Настройки, <strong>Ctrl+G</strong> - Графика, <strong>Ctrl+M</strong> - Звук</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    }
    
    bindEvents() {
        document.getElementById('settingsMenuClose').addEventListener('click', () => this.hide());
        
        document.getElementById('settingsGraphicsBtn').addEventListener('click', () => {
            this.hide();
            if (window.settingsManager && window.settingsManager.modules.graphics) {
                window.settingsManager.modules.graphics.showMenu();
            }
        });
        
        document.getElementById('settingsAudioBtn').addEventListener('click', () => {
            this.hide();
            if (window.settingsManager && window.settingsManager.modules.audio) {
                window.settingsManager.modules.audio.showMenu();
            }
        });
        
        document.getElementById('settingsControlsBtn').addEventListener('click', () => {
            this.hide();
            if (window.settingsManager && window.settingsManager.modules.controls) {
                window.settingsManager.modules.controls.showMenu();
            }
        });
        
        document.getElementById('settingsGameBtn').addEventListener('click', () => {
            this.hide();
            if (window.settingsManager && window.settingsManager.modules.game) {
                window.settingsManager.modules.game.showMenu();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.isVisible && !gamePaused) {
                e.preventDefault();
                this.show();
            }
        });
    }
    
    show() {
        gamePaused = true;
        this.isVisible = true;
        document.getElementById('settingsMenuOverlay').classList.add('active');
    }
    
    hide() {
        gamePaused = false;
        this.isVisible = false;
        document.getElementById('settingsMenuOverlay').classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsMenu = new SettingsMenu();
});