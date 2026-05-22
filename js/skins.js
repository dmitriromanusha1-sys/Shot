/**
 * МОДУЛЬ СКИНОВ ДЛЯ ОРУЖИЯ
 */

const SKINS_STORAGE_KEY = 'neon_strike_skins';

class SkinsModule {
    constructor() {
        this.skins = {
            neon: {
                id: 'neon',
                name: 'Неоновый',
                description: 'Базовый неоновый стиль. Сверкает в темноте.',
                price: 0,
                unlocked: true,
                purchased: true,
                color: '#00ff9d',
                bulletColor: '#00ff9d',
                bulletEffect: 'neon',
                stats: { damage: 1.0, fireRate: 1.0 }
            },
            gold: {
                id: 'gold',
                name: 'Золотой',
                description: 'Роскошный стиль. +10% к урону.',
                price: 500,
                unlocked: false,
                purchased: false,
                color: '#ffd700',
                bulletColor: '#ffd700',
                bulletEffect: 'gold',
                stats: { damage: 1.1, fireRate: 1.0 }
            },
            camo: {
                id: 'camo',
                name: 'Камуфляж',
                description: 'Маскировка. +15% к скорости стрельбы.',
                price: 750,
                unlocked: false,
                purchased: false,
                color: '#556b2f',
                bulletColor: '#6b8e23',
                bulletEffect: 'camo',
                stats: { damage: 1.0, fireRate: 0.85 }
            },
            plasma: {
                id: 'plasma',
                name: 'Плазменный',
                description: 'Электрический разряд. +20% к скорости пуль.',
                price: 1000,
                unlocked: false,
                purchased: false,
                color: '#7b2fff',
                bulletColor: '#bf7fff',
                bulletEffect: 'plasma',
                stats: { damage: 1.0, fireRate: 1.0 }
            },
            shadow: {
                id: 'shadow',
                name: 'Тень',
                description: 'Стелс-броня. +8% урон, +12% скорость.',
                price: 1500,
                unlocked: false,
                purchased: false,
                color: '#1a1a2e',
                bulletColor: '#ff2244',
                bulletEffect: 'shadow',
                stats: { damage: 1.08, fireRate: 0.88 }
            }
        };
        
        this.currentSkin = 'neon';
        this.skinElements = {};
        this.skinIndicator = null;
        this.skinsMenu = null;
        
        this.init();
    }
    
    init() {
        this.loadSkins();
        this.createSkinElements();
        this.createSkinIndicator();
        this.createSkinsMenu();
        this.applyCurrentSkin();
        
    }
    
    createSkinElements() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Создаем элементы для каждого скина
        Object.keys(this.skins).forEach(skinId => {
            const skinElement = document.createElement('div');
            skinElement.className = `player-skin ${skinId}`;
            skinElement.id = `player-skin-${skinId}`;
            skinElement.style.display = 'none';
            
            if (skinId === 'gold') {
                const barrel = document.createElement('div');
                barrel.className = 'barrel';
                skinElement.appendChild(barrel);
            }
            
            if (skinId === 'camo') {
                const scope = document.createElement('div');
                scope.className = 'scope';
                skinElement.appendChild(scope);
            }
            
            canvas.parentElement.appendChild(skinElement);
            this.skinElements[skinId] = skinElement;
        });
    }
    
    createSkinIndicator() {
        this.skinIndicator = document.createElement('div');
        this.skinIndicator.className = 'skin-indicator';
        this.skinIndicator.title = 'Сменить скин (K)';
        this.skinIndicator.innerHTML = '<div class="skin-indicator-icon"><i class="fas fa-paint-brush"></i></div>';
        
        this.skinIndicator.addEventListener('click', () => {
            this.showSkinsMenu();
        });
        
        document.body.appendChild(this.skinIndicator);
    }
    
    createSkinsMenu() {
        this.skinsMenu = document.createElement('div');
        this.skinsMenu.className = 'skins-menu';
        this.skinsMenu.innerHTML = `
            <h2 class="skins-title"><i class="fas fa-paint-brush"></i> ВЫБОР СКИНА</h2>
            <div class="skins-grid" id="skinsGrid"></div>
            <button class="menu-btn" id="closeSkinsBtn" style="width: 250px; margin: 0 auto; display: block;">
                <i class="fas fa-times"></i> Закрыть
            </button>
        `;
        
        document.body.appendChild(this.skinsMenu);
        
        const closeBtn = document.getElementById('closeSkinsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSkinsMenu();
            });
        }
        
        // Закрытие по клику вне меню
        this.skinsMenu.addEventListener('click', (e) => {
            if (e.target === this.skinsMenu) {
                this.hideSkinsMenu();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.skinsMenu.classList.contains('active')) {
                this.hideSkinsMenu();
            }
        });
        
        this.generateSkinOptions();
    }
    
    generateSkinOptions() {
        const skinsGrid = document.getElementById('skinsGrid');
        if (!skinsGrid) return;
        
        skinsGrid.innerHTML = '';
        
        Object.values(this.skins).forEach(skin => {
            const skinOption = document.createElement('div');
            skinOption.className = `skin-option fade-in-up`;
            
            if (skin.purchased && this.currentSkin === skin.id) {
                skinOption.classList.add('selected');
            }
            
            if (!skin.unlocked) {
                skinOption.classList.add('locked');
            }
            
            const damageBonus = skin.stats.damage !== 1.0
                ? `<div class="skin-stat"><i class="fas fa-bolt"></i> Урон: +${(skin.stats.damage * 100 - 100).toFixed(0)}%</div>` : '';
            const fireRateBonus = skin.stats.fireRate !== 1.0
                ? `<div class="skin-stat"><i class="fas fa-tachometer-alt"></i> Скорость: +${((1/skin.stats.fireRate) * 100 - 100).toFixed(0)}%</div>` : '';

            skinOption.innerHTML = `
                <div class="skin-preview player-skin ${skin.id}">
                    <div class="barrel-wrap"></div>
                    <div class="turret"></div>
                </div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-description">${skin.description}</div>
                <div class="skin-price">
                    ${skin.purchased
                        ? '<i class="fas fa-check"></i> Приобретён'
                        : `<i class="fas fa-coins"></i> ${skin.price}$`}
                </div>
                ${damageBonus}${fireRateBonus}
            `;
            
            if (skin.unlocked) {
                skinOption.addEventListener('click', () => {
                    if (!skin.purchased) {
                        this.purchaseSkin(skin.id);
                    } else {
                        this.selectSkin(skin.id);
                    }
                });
            }
            
            skinsGrid.appendChild(skinOption);
        });
    }
    
    showSkinsMenu() {
        if (this.skinsMenu) {
            this.skinsMenu.classList.add('active');
            this.generateSkinOptions();
            
            if (typeof gamePaused !== 'undefined') {
                gamePaused = true;
            }
        }
    }
    
    hideSkinsMenu() {
        if (this.skinsMenu) {
            this.skinsMenu.classList.remove('active');

            if (typeof isInMenuState === 'function' && isInMenuState()) {
                if (typeof enterMenuState === 'function') enterMenuState();
            } else if (typeof gamePaused !== 'undefined') {
                gamePaused = false;
            }
        }
    }
    
    purchaseSkin(skinId) {
        const skin = this.skins[skinId];
        if (!skin || skin.purchased || !skin.unlocked) return;
        
        if (typeof money !== 'undefined' && money >= skin.price) {
            money -= skin.price;
            skin.purchased = true;
            
            this.selectSkin(skinId);
            this.generateSkinOptions();
            
            if (typeof updateUI === 'function') {
                updateUI();
            }
            
            if (typeof updateMenuStats === 'function') {
                updateMenuStats();
            }
            
            this.saveSkins();
            this.showNotification(`Скин "${skin.name}" приобретен!`);
        } else {
            this.showNotification(`Недостаточно денег! Нужно ${skin.price}$`, 'error');
        }
    }
    
    selectSkin(skinId) {
        const skin = this.skins[skinId];
        if (!skin || !skin.purchased) return;
        
        this.currentSkin = skinId;
        this.applyCurrentSkin();
        this.generateSkinOptions();
        this.saveSkins();
        
        this.showNotification(`Скин "${skin.name}" выбран!`);
    }
    
    applyCurrentSkin() {
        Object.values(this.skinElements).forEach(element => {
            if (element) element.style.display = 'none';
        });

        const currentElement = this.skinElements[this.currentSkin];
        if (currentElement) {
            currentElement.style.display = 'block';
            currentElement.classList.add('active');
        }

        const skin = this.skins[this.currentSkin];
        if (skin && typeof player !== 'undefined') {
            player.color = skin.color;
        }

        this.applySkinBonuses();
    }
    
    updateSkinPosition() {
        const player = window.gameInstance ? window.gameInstance.player : null;
        if (!player || !this.skinElements[this.currentSkin]) return;
        
        const skinElement = this.skinElements[this.currentSkin];
        skinElement.style.left = player.x + 'px';
        skinElement.style.top = player.y + 'px';
        
        // Анимация при стрельбе
        const weapon = weapons ? weapons[player.weapon] : null;
        if (weapon && weapon.ammo > 0 && (mouseDown || spacePressed)) {
            skinElement.style.transform = 'translateY(-3px)';
            setTimeout(() => {
                skinElement.style.transform = 'translateY(0)';
            }, 50);
        }
    }
    
    applySkinBonuses() {
        const skin = this.skins[this.currentSkin];
        if (!skin || typeof weapons === 'undefined' || typeof player === 'undefined') return;

        const currentWeapon = weapons[player.weapon];
        if (currentWeapon) {
            currentWeapon.bulletColor = skin.bulletColor;
        }
    }

    getSkinDamageMultiplier() {
        return this.skins[this.currentSkin]?.stats?.damage ?? 1.0;
    }

    getSkinFireRateMultiplier() {
        return this.skins[this.currentSkin]?.stats?.fireRate ?? 1.0;
    }
    
    update() {}
    
    unlockSkin(skinId) {
        const skin = this.skins[skinId];
        if (skin && !skin.unlocked) {
            skin.unlocked = true;
            this.saveSkins();
            this.showNotification(`Новый скин "${skin.name}" разблокирован!`);
            return true;
        }
        return false;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `skin-notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        const iconColor = type === 'success' ? 'var(--accent)' : 'var(--danger)';
        
        notification.innerHTML = `
            <div class="skin-notification-icon" style="color: ${iconColor}">
                <i class="${icon}"></i>
            </div>
            <div class="skin-notification-content">
                <div class="skin-notification-title">${type === 'success' ? 'Скин разблокирован!' : 'Ошибка'}</div>
                <div class="skin-notification-text">${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    saveSkins() {
        try {
            localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify({
                skins: this.skins,
                currentSkin: this.currentSkin
            }));
        } catch (e) { /* file:// или приватный режим */ }
    }
    
    loadSkins() {
        const savedData = localStorage.getItem(SKINS_STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Загружаем скины
                if (data.skins) {
                    Object.keys(data.skins).forEach(skinId => {
                        if (this.skins[skinId]) {
                            Object.assign(this.skins[skinId], data.skins[skinId]);
                        }
                    });
                }
                
                // Загружаем текущий скин
                if (data.currentSkin && this.skins[data.currentSkin]) {
                    this.currentSkin = data.currentSkin;
                }
            } catch (e) {
                console.error('Ошибка загрузки скинов:', e);
            }
        }
    }
    
    getCurrentSkin() {
        return this.skins[this.currentSkin];
    }
    
    // Методы для интеграции с основной игрой
    integrateWithGame() {
        // Интеграция с системой сохранения
        if (typeof saveGame === 'function') {
            const originalSaveGame = saveGame;
            saveGame = () => {
                originalSaveGame();
                this.saveSkins();
            };
        }
        
        // Интеграция с системой сброса
        if (typeof resetGame === 'function') {
            const originalResetGame = resetGame;
            resetGame = () => {
                originalResetGame();
                this.resetSkins();
            };
        }
        
        // Горячая клавиша для меню скинов (K)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л') {
                e.preventDefault();
                this.showSkinsMenu();
            }
        });
        
        // Автоматическая разблокировка скинов при достижении уровней
        if (typeof currentLevel !== 'undefined') {
            this.checkLevelUnlocks();
        }
    }
    
    checkLevelUnlocks() {
        if (currentLevel >= 3 && !this.skins.gold.unlocked) {
            this.unlockSkin('gold');
        }
        if (currentLevel >= 5 && !this.skins.camo.unlocked) {
            this.unlockSkin('camo');
        }
        if (currentLevel >= 7 && !this.skins.plasma.unlocked) {
            this.unlockSkin('plasma');
        }
        if (currentLevel >= 9 && !this.skins.shadow.unlocked) {
            this.unlockSkin('shadow');
        }
    }
    
    resetSkins() {
        this.skins = {
            neon: {
                id: 'neon',
                name: 'Неоновый',
                description: 'Базовый неоновый стиль. Сверкает в темноте.',
                price: 0,
                unlocked: true,
                purchased: true,
                color: '#00ff9d',
                bulletColor: '#00ff9d',
                bulletEffect: 'neon',
                stats: { damage: 1.0, fireRate: 1.0 }
            },
            gold: {
                id: 'gold',
                name: 'Золотой',
                description: 'Роскошный стиль. +10% к урону.',
                price: 500,
                unlocked: false,
                purchased: false,
                color: '#ffd700',
                bulletColor: '#ffd700',
                bulletEffect: 'gold',
                stats: { damage: 1.1, fireRate: 1.0 }
            },
            camo: {
                id: 'camo',
                name: 'Камуфляж',
                description: 'Маскировка. +15% к скорости стрельбы.',
                price: 750,
                unlocked: false,
                purchased: false,
                color: '#556b2f',
                bulletColor: '#6b8e23',
                bulletEffect: 'camo',
                stats: { damage: 1.0, fireRate: 0.85 }
            },
            plasma: {
                id: 'plasma',
                name: 'Плазменный',
                description: 'Электрический разряд. +20% к скорости пуль.',
                price: 1000,
                unlocked: false,
                purchased: false,
                color: '#7b2fff',
                bulletColor: '#bf7fff',
                bulletEffect: 'plasma',
                stats: { damage: 1.0, fireRate: 1.0 }
            },
            shadow: {
                id: 'shadow',
                name: 'Тень',
                description: 'Стелс-броня. +8% урон, +12% скорость.',
                price: 1500,
                unlocked: false,
                purchased: false,
                color: '#1a1a2e',
                bulletColor: '#ff2244',
                bulletEffect: 'shadow',
                stats: { damage: 1.08, fireRate: 0.88 }
            }
        };
        
        this.currentSkin = 'neon';
        this.saveSkins();
        this.applyCurrentSkin();
        this.generateSkinOptions();
    }
}

// Инициализация модуля при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.skinsModule = new SkinsModule();
    
    // Интеграция с основной игрой
    setTimeout(() => {
        if (window.skinsModule) {
            window.skinsModule.integrateWithGame();
        }
    }, 1000);
});