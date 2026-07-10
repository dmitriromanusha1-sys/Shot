const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const STORAGE_KEY = 'neon_strike_save';

function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;

    const gs = window.graphicsSettings;
    if (gs && gs.resolution) {
        const [rw, rh] = gs.resolution.split('x').map(Number);
        if (canvas.width !== rw || canvas.height !== rh) {
            canvas.width = rw;
            canvas.height = rh;
        }
        const scaleX = container.clientWidth / rw;
        const scaleY = container.clientHeight / rh;
        const scale = Math.min(scaleX, scaleY, 1);
        canvas.style.width = rw + 'px';
        canvas.style.height = rh + 'px';
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'top left';
        player.y = rh - 80;
        if (player.x + player.width > rw) player.x = rw - player.width - 10;
    } else {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            canvas.width = w;
            canvas.height = h;
            player.y = h - 80;
            if (player.x + player.width > w) player.x = w - player.width - 10;
        }
    }
}
window.addEventListener('resize', resizeCanvas);

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
}

function storageSave(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* file:// или приватный режим */ }
}
function storageLoad(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* игнорируем */ }
}

const levels = [
    { id: 1, name: "Пробуждение", enemiesToComplete: 10, reward: 100, unlocked: true, completed: false, loreUnlocked: false },
    { id: 2, name: "Архив данных", enemiesToComplete: 20, reward: 150, unlocked: false, completed: false, loreUnlocked: false },
    { id: 3, name: "Сердце комплекса", enemiesToComplete: 30, reward: 200, unlocked: false, completed: false, loreUnlocked: false },
    { id: 4, name: "Переговоры", enemiesToComplete: 40, reward: 250, unlocked: false, completed: false, loreUnlocked: false },
    { id: 5, name: "Погоня", enemiesToComplete: 50, reward: 300, unlocked: false, completed: false, loreUnlocked: false },
    { id: 6, name: "Туннели", enemiesToComplete: 60, reward: 350, unlocked: false, completed: false, loreUnlocked: false },
    { id: 7, name: "Оазис", enemiesToComplete: 70, reward: 400, unlocked: false, completed: false, loreUnlocked: false },
    { id: 8, name: "Битва", enemiesToComplete: 80, reward: 450, unlocked: false, completed: false, loreUnlocked: false },
    { id: 9, name: "Секретный архив", enemiesToComplete: 90, reward: 500, unlocked: false, completed: false, loreUnlocked: false },
    { id: 10, name: "Штурм башни", enemiesToComplete: 100, reward: 1000, unlocked: false, completed: false, loreUnlocked: false }
];

let currentLevel = 1;
let enemiesKilledThisLevel = 0;
let enemiesToComplete = levels[0].enemiesToComplete;
let finalBossSpawned = false;

let infiniteMode = false;
let infiniteWave = 1;
let infiniteWaveTransition = false;
let bestInfiniteWave = parseInt(storageLoad('neon_infinite_best') || '0');
let infiniteAnnouncement = null; // { text, sub, life (0..1) }

let devMode = {
    infiniteMoney: false,
    infiniteHealth: false,
    infiniteAmmo: false,
    maxDamage: false,
    unlockedAll: false
};

let score = 0;
let gameLevel = 1;
let health = 100;
let money = 100;
let gameRunning = true;
let gamePaused = false;
let lastTime = 0;

let autoFireMode = false;
let mouseDown = false;
let mouseWasDown = false; // for single-shot: fire only on fresh press
let spacePressed = false;
let mouseX = 0, mouseY = 0;
let keysDown = {};

// Recoil
let recoilX = 0, recoilY = 0;

// Burst fire state
let burstRemaining = 0;
let burstTimer = 0;

// Single-shot: tracks if shot was already fired this press
let singleShotFired = false;

// Секретный код для dev-меню: ↑↑↓↓←→←→BA
const DEV_CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
let devCodeProgress = 0;
let fireModeToggle = document.getElementById('fireModeToggle');
let fireModeStatus = document.getElementById('fireModeStatus');
let autoFireIndicator = document.getElementById('autoFireIndicator');

let spawnRate = 0.0125;
let spawnMultiplier = 1.0;
let spawnEnabled = true;
let enemyCount = 0;

const spawnSlider = null;
const spawnValue = null;
const spawnRateDisplay = null;
const spawnStatus = null;
const toggleSpawnBtn = null;
const clearEnemiesBtn = null;
const enemyCountElement = document.getElementById('enemyCount');
const currentLevelDisplay = document.getElementById('currentLevelDisplay');
const currentLevelNumber = document.getElementById('currentLevelNumber');

const mainMenu = document.getElementById('mainMenu');
const levelSelectMenu = document.getElementById('levelSelectMenu');
const levelGrid = document.getElementById('levelGrid');
const devMenu = document.getElementById('devMenu');
const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
const levelRewardDisplay = document.getElementById('levelRewardDisplay');
const rewardAmount = document.getElementById('rewardAmount');
const loreUnlockedMessage = document.getElementById('loreUnlockedMessage');
const skinUnlockedMessage = document.getElementById('skinUnlockedMessage');

const aboutOverlay = document.getElementById('aboutOverlay');
const closeAboutBtn = document.getElementById('closeAboutBtn');
const aboutBtn = document.getElementById('aboutBtn');
const panelAboutBtn = document.getElementById('panelAboutBtn');

const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverKilled = document.getElementById('gameOverKilled');
const gameOverRequired = document.getElementById('gameOverRequired');
const gameOverMoney = document.getElementById('gameOverMoney');
const gameOverLevel = document.getElementById('gameOverLevel');
const gameOverSkin = document.getElementById('gameOverSkin');
const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
const gameOverMenuBtn = document.getElementById('gameOverMenuBtn');

const shotSound = document.getElementById('shotSound');
const hitSound = document.getElementById('hitSound');
const reloadSound = document.getElementById('reloadSound');
const backgroundMusic = document.getElementById('backgroundMusic');
const skinUnlockSound = document.getElementById('skinUnlockSound');
const enemyDeathSound = document.getElementById('enemyDeathSound');
const playerDamageSound = document.getElementById('playerDamageSound');

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 60,
    color: '#2196f3',
    speed: 6,
    weapon: 'pistol',
    angle: -Math.PI / 2
};

const weapons = {
    pistol: {
        name: 'Пистолет',
        damage: 15,
        fireRate: 380,
        bulletSpeed: 10,
        bulletColor: '#ffeb3b',
        bulletSize: 5,
        clipSize: 12,
        ammo: 12,
        reloadTime: 900,
        cost: 0,
        unlocked: true,
        purchased: true,
        recoil: 2,
        fireModes: ['single', 'burst'],
        fireMode: 'single',
        upgrades: { damage: 1, speed: 1, clip: 1, accuracy: 0 },
        uniqueUpgrades: [
            { key: 'accuracy', label: 'Точность', icon: 'fas fa-crosshairs', baseCost: 80, max: 3, color: '#ffeb3b',
              apply: (w) => { w.spread = Math.max(0, (w.spread || 0.05) - 0.015); } }
        ]
    },
    rifle: {
        name: 'Винтовка',
        damage: 45,
        fireRate: 900,
        bulletSpeed: 14,
        bulletColor: '#4caf50',
        bulletSize: 7,
        clipSize: 8,
        ammo: 8,
        reloadTime: 1400,
        cost: 200,
        unlocked: false,
        purchased: false,
        recoil: 4,
        fireModes: ['single', 'burst'],
        fireMode: 'single',
        upgrades: { damage: 1, speed: 1, clip: 1, pierce: 0 },
        uniqueUpgrades: [
            { key: 'pierce', label: 'Пробитие', icon: 'fas fa-arrow-right', baseCost: 120, max: 3, color: '#4caf50',
              apply: (w) => { w.pierceCount = (w.pierceCount || 0) + 1; } }
        ]
    },
    auto: {
        name: 'Автомат',
        damage: 12,
        fireRate: 90,
        bulletSpeed: 11,
        bulletColor: '#ff5722',
        bulletSize: 4,
        clipSize: 30,
        ammo: 30,
        reloadTime: 1800,
        cost: 500,
        unlocked: false,
        purchased: false,
        recoil: 1.5,
        spread: 0.06,
        fireModes: ['auto', 'burst'],
        fireMode: 'auto',
        upgrades: { damage: 1, speed: 1, clip: 1, suppression: 0 },
        uniqueUpgrades: [
            { key: 'suppression', label: 'Подавление', icon: 'fas fa-wind', baseCost: 100, max: 3, color: '#ff5722',
              apply: (w) => { w.slowChance = (w.slowChance || 0) + 0.15; } }
        ]
    },
    sniper: {
        name: 'Снайперка',
        damage: 150,
        fireRate: 1800,
        bulletSpeed: 22,
        bulletColor: '#9c27b0',
        bulletSize: 10,
        clipSize: 5,
        ammo: 5,
        reloadTime: 2500,
        cost: 1000,
        unlocked: false,
        purchased: false,
        recoil: 8,
        fireModes: ['single'],
        fireMode: 'single',
        upgrades: { damage: 1, speed: 1, clip: 1, headshot: 0 },
        uniqueUpgrades: [
            { key: 'headshot', label: 'Хедшот', icon: 'fas fa-skull', baseCost: 150, max: 3, color: '#9c27b0',
              apply: (w) => { w.headshotChance = (w.headshotChance || 0) + 0.15; } }
        ]
    },
    machinegun: {
        name: 'Пулемет',
        damage: 18,
        fireRate: 55,
        bulletSpeed: 10,
        bulletColor: '#795548',
        bulletSize: 6,
        clipSize: 80,
        ammo: 80,
        reloadTime: 3500,
        cost: 2000,
        unlocked: false,
        purchased: false,
        recoil: 2,
        spread: 0.05,
        fireModes: ['auto'],
        fireMode: 'auto',
        upgrades: { damage: 1, speed: 1, clip: 1, shred: 0 },
        uniqueUpgrades: [
            { key: 'shred', label: 'Разрыв брони', icon: 'fas fa-shield-alt', baseCost: 130, max: 3, color: '#ff9800',
              apply: (w) => { w.armorShred = (w.armorShred || 0) + 1; } }
        ]
    },
    shotgun: {
        name: 'Дробовик',
        damage: 25,
        fireRate: 750,
        bulletSpeed: 9,
        bulletColor: '#ff9800',
        bulletSize: 5,
        clipSize: 8,
        ammo: 8,
        reloadTime: 2000,
        cost: 800,
        unlocked: false,
        purchased: false,
        recoil: 7,
        pellets: 5,
        spread: 0.28,
        fireModes: ['single'],
        fireMode: 'single',
        upgrades: { damage: 1, speed: 1, clip: 1, pellets: 0 },
        uniqueUpgrades: [
            { key: 'pellets', label: 'Кол-во дробин', icon: 'fas fa-ellipsis-h', baseCost: 110, max: 3, color: '#ff9800',
              apply: (w) => { w.pellets = (w.pellets || 5) + 1; } }
        ]
    },
    laser: {
        name: 'Лазер',
        damage: 12,
        fireRate: 80,
        bulletSpeed: 0,
        bulletColor: '#e040fb',
        bulletSize: 4,
        clipSize: 120,
        ammo: 120,
        reloadTime: 2200,
        cost: 1200,
        unlocked: false,
        purchased: false,
        isLaser: true,
        heat: 0,
        maxHeat: 100,
        overheated: false,
        recoil: 0,
        fireModes: ['auto'],
        fireMode: 'auto',
        upgrades: { damage: 1, speed: 1, clip: 1, efficiency: 0 },
        uniqueUpgrades: [
            { key: 'efficiency', label: 'КПД (меньше нагрев)', icon: 'fas fa-thermometer-half', baseCost: 120, max: 3, color: '#e040fb',
              apply: (w) => { w._heatPerShot = Math.max(1, (w._heatPerShot || 3.5) - 0.7); } }
        ]
    },
    plasma: {
        name: 'Плазма',
        damage: 50,
        fireRate: 700,
        bulletSpeed: 7,
        bulletColor: '#00e5ff',
        bulletSize: 12,
        clipSize: 10,
        ammo: 10,
        reloadTime: 2600,
        cost: 1500,
        unlocked: false,
        purchased: false,
        isPlasma: true,
        aoeRadius: 80,
        recoil: 5,
        fireModes: ['single', 'burst'],
        fireMode: 'single',
        upgrades: { damage: 1, speed: 1, clip: 1, radius: 0 },
        uniqueUpgrades: [
            { key: 'radius', label: 'Радиус взрыва', icon: 'fas fa-expand', baseCost: 130, max: 3, color: '#00e5ff',
              apply: (w) => { w.aoeRadius = (w.aoeRadius || 80) + 15; } }
        ]
    }
};

let bullets = [];
let enemies = [];
let effects = [];
let pickups = [];
let enemyBullets = [];
let levelUpText = null;
let loreNotificationActive = false;
let skinNotificationActive = false;

let damageFlash = 0; // 0..1, убывает — красный флеш экрана при уроне
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
const COMBO_TIMEOUT = 4000;
let laserBeam = null; // { x1, y1, x2, y2, color } — active laser ray this frame
let killCounterFlash = 0; // 0..1, анимация при убийстве
let bossKillSlowmo = 1.0;

// ── SCREEN SHAKE ──────────────────────────────────────────────
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0, timer: 0 };
function triggerShake(intensity, duration) {
    if (screenShake.intensity < intensity) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
        screenShake.timer = duration;
    }
}
function updateShake(dt) {
    if (screenShake.timer > 0) {
        screenShake.timer -= dt;
        const t = screenShake.timer / screenShake.duration;
        const mag = screenShake.intensity * t;
        screenShake.x = (Math.random() * 2 - 1) * mag;
        screenShake.y = (Math.random() * 2 - 1) * mag;
    } else {
        screenShake.x = 0; screenShake.y = 0;
    }
}

// ── STARFIELD ─────────────────────────────────────────────────
const STAR_LAYERS = [
    { count: 80,  speed: 0.015, size: 0.8,  alpha: 0.35 },
    { count: 50,  speed: 0.04,  size: 1.4,  alpha: 0.55 },
    { count: 20,  speed: 0.09,  size: 2.2,  alpha: 0.8  },
];
let stars = [];
function initStars() {
    stars = [];
    STAR_LAYERS.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                layer: li,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.5 + Math.random() * 1.5,
            });
        }
    });
}
initStars();

// ── NUKE FLASH ────────────────────────────────────────────────
let nukeFlash = 0; // 0..1 убывает
let playerAuraFlash = 0; // вспышка при выстреле
let killStreakGlow = 0;  // зелёная виньетка при серии

let activePerks = [];
let perkChoiceActive = false;
let killStreakNoHit = 0;
let streakBuff = { active: false, timer: 0, duration: 5000 };
const PERK_DEFS = [
    { id: 'bullet_speed',   icon: 'fas fa-bolt',          name: 'Разгон',        desc: '+25% скорость пуль',         apply: () => { Object.values(weapons).forEach(w => { w.bulletSpeed = Math.round(w.bulletSpeed * 1.25); }); } },
    { id: 'fire_rate',      icon: 'fas fa-tachometer-alt', name: 'Авто-огонь',   desc: '-15% задержка стрельбы',     apply: () => { Object.values(weapons).forEach(w => { w.fireRate = Math.max(40, Math.round(w.fireRate * 0.85)); }); } },
    { id: 'double_money',   icon: 'fas fa-coins',          name: 'Делец',         desc: '+100% монеты с врагов',      apply: () => { activePerks.push('double_money'); } },
    { id: 'auto_heal',      icon: 'fas fa-heart',          name: 'Регенерация',   desc: '+30 HP сейчас',              apply: () => { health = Math.min(100, health + 30); } },
    { id: 'ricochet',       icon: 'fas fa-random',         name: 'Рикошет',       desc: 'Пули отражаются от краёв 1р.',apply: () => { activePerks.push('ricochet'); } },
    { id: 'shield_regen',   icon: 'fas fa-shield-alt',     name: 'Экстра-щит',   desc: '+50 к максимуму щита',       apply: () => { if (shieldMax > 0) { shieldMax += 50; shield = Math.min(shield + 50, shieldMax); } else { health = Math.min(100, health + 20); } } },
    { id: 'piercing',       icon: 'fas fa-arrow-right',    name: 'Бронебойность', desc: 'Пули пробивают 1 врага',     apply: () => { activePerks.push('piercing'); } },
    { id: 'aoe_death',      icon: 'fas fa-explosion',      name: 'Цепная реакция',desc: 'Смерть врага — мини-взрыв', apply: () => { activePerks.push('aoe_death'); } },
    { id: 'vampirism',      icon: 'fas fa-tint',           name: 'Вампиризм',     desc: '+3 HP за каждое убийство', apply: () => { activePerks.push('vampirism'); } },
];

function getRandomPerks(count) {
    const pool = PERK_DEFS.filter(p => !activePerks.includes(p.id) || ['auto_heal','bullet_speed','fire_rate','shield_regen'].includes(p.id));
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function showPerkChoice() {
    perkChoiceActive = true;
    gameRunning = false;
    gamePaused = true;
    const choices = getRandomPerks(3);
    let el = document.getElementById('perkChoiceOverlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'perkChoiceOverlay';
        el.className = 'perk-choice-overlay';
        document.body.appendChild(el);
    }
    el.innerHTML = `
        <div class="perk-choice-card">
            <div class="perk-choice-title"><i class="fas fa-star"></i> Выберите перк</div>
            <div class="perk-choice-sub">Конец волны — выберите улучшение!</div>
            <div class="perk-choice-options">
                ${choices.map((p, i) => `
                <button class="perk-option" data-idx="${i}">
                    <i class="${p.icon} perk-opt-icon"></i>
                    <div class="perk-opt-name">${p.name}</div>
                    <div class="perk-opt-desc">${p.desc}</div>
                </button>`).join('')}
            </div>
        </div>`;
    el.classList.add('active');
    el.querySelectorAll('.perk-option').forEach((btn, i) => {
        btn.onclick = () => {
            choices[i].apply();
            if (!activePerks.includes(choices[i].id)) activePerks.push(choices[i].id);
            el.classList.remove('active');
            perkChoiceActive = false;
            triggerUpgradeFlash();
            gameRunning = true;
            gamePaused = false;
            beginInfiniteWave(infiniteWave + 1);
        };
    });
}
let shield = 0;
let shieldMax = 0;
let shieldRegenTimer = 0;
const SHIELD_REGEN_DELAY = 5000;
let shotsTotal = 0;
let shotsHit = 0;

const STATS_KEY = 'neon_strike_stats';
let globalStats = {
    totalKills: 0,
    totalShots: 0,
    totalHits: 0,
    totalMoney: 0,
    bestScore: 0,
    levelsCompleted: 0,
    bossesKilled: 0,
    gamesPlayed: 0,
    weaponKills: {}
};

let playerUpgrades = { shield: 0, speed: 0, shieldRegen: 0 };
function getShieldMax() { return playerUpgrades.shield * 25; }
function getShieldRegenDelay() { return 5000 * (1 - (playerUpgrades.shieldRegen || 0) * 0.2); }

const TOP_SCORES_KEY = 'neon_top_scores';
let topScores = []; // [{score, level, weapon, date}]

function loadTopScores() {
    try {
        const s = storageLoad(TOP_SCORES_KEY);
        if (s) topScores = JSON.parse(s);
    } catch (e) {}
}

function saveTopScore(score, level, weapon) {
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`;
    topScores.push({ score, level, weapon, date: dateStr });
    topScores.sort((a, b) => b.score - a.score);
    topScores = topScores.slice(0, 5);
    storageSave(TOP_SCORES_KEY, JSON.stringify(topScores));
}

// ─── ДОСТИЖЕНИЯ ───────────────────────────────────────────────
const ACHIEVEMENTS_KEY = 'neon_strike_achievements';
const ACHIEVEMENTS_DEFS = [
    { id: 'kills_100',    icon: 'fas fa-skull',          name: 'Истребитель',      desc: 'Убейте 100 врагов',               check: () => globalStats.totalKills >= 100 },
    { id: 'kills_1000',   icon: 'fas fa-skull-crossbones',name: 'Мясорубка',       desc: 'Убейте 1000 врагов',              check: () => globalStats.totalKills >= 1000 },
    { id: 'bosses_5',     icon: 'fas fa-dragon',         name: 'Охотник на боссов',desc: 'Убейте 5 боссов',                 check: () => globalStats.bossesKilled >= 5 },
    { id: 'accuracy_80',  icon: 'fas fa-crosshairs',     name: 'Снайпер',          desc: 'Завершите уровень с точностью 80%+', check: () => shotsTotal >= 10 && (shotsHit / shotsTotal) >= 0.8 },
    { id: 'money_5000',   icon: 'fas fa-coins',          name: 'Богач',            desc: 'Заработайте 5000$ за всё время',  check: () => globalStats.totalMoney >= 5000 },
    { id: 'all_weapons',  icon: 'fas fa-gun',            name: 'Арсенал',          desc: 'Купите все виды оружия',          check: () => Object.values(weapons).every(w => w.purchased) },
    { id: 'shield_buy',   icon: 'fas fa-shield-alt',     name: 'Защитник',         desc: 'Купите щит',                      check: () => playerUpgrades.shield >= 1 },
    { id: 'level_5',      icon: 'fas fa-flag-checkered', name: 'На полпути',       desc: 'Пройдите уровень 5',              check: () => levels[4] && levels[4].completed },
    { id: 'level_10',     icon: 'fas fa-trophy',         name: 'Победитель',       desc: 'Пройдите все 10 уровней',         check: () => levels.every(l => l.completed) },
    { id: 'daily_done',   icon: 'fas fa-calendar-day',   name: 'Испытание принято',desc: 'Завершите испытание дня',         check: () => !!storageLoad(DAILY_KEY_PREFIX + getDailyDateStr()) },
];

let unlockedAchievements = new Set();

function loadAchievements() {
    try {
        const s = storageLoad(ACHIEVEMENTS_KEY);
        if (s) JSON.parse(s).forEach(id => unlockedAchievements.add(id));
    } catch (e) {}
}

function saveAchievements() {
    storageSave(ACHIEVEMENTS_KEY, JSON.stringify([...unlockedAchievements]));
}

function checkAchievements() {
    ACHIEVEMENTS_DEFS.forEach(def => {
        if (!unlockedAchievements.has(def.id) && def.check()) {
            unlockedAchievements.add(def.id);
            saveAchievements();
            showAchievementToast(def);
        }
    });
}

function showAchievementToast(def) {
    const existing = document.querySelector('.achievement-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `<i class="${def.icon}"></i><div><div class="ach-toast-title">Достижение!</div><div class="ach-toast-name">${def.name}</div></div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ──────────────────────────────────────────────────────────────

function loadStats() {
    try {
        const s = storageLoad(STATS_KEY);
        if (s) Object.assign(globalStats, JSON.parse(s));
    } catch (e) { /* игнорируем */ }
}

function saveStats() {
    storageSave(STATS_KEY, JSON.stringify(globalStats));
}

let graphicsModule = null;
let audioModule = null;
let controlsModule = null;
let gameModule = null;
let skinsModule = null;

let lastShotTime = 0;
let reloading = false;
let reloadStartTime = 0;

function updateMenuStats() {
    const menuLevel = document.getElementById('menuLevel');
    const menuMoney = document.getElementById('menuMoney');
    const menuProgress = document.getElementById('menuProgress');
    const menuLore = document.getElementById('menuLore');
    const menuSkins = document.getElementById('menuSkins');
    
    if (menuLevel) menuLevel.textContent = currentLevel;
    if (menuMoney) menuMoney.textContent = money;
    
    if (menuProgress) {
        let completedLevels = levels.filter(l => l.completed).length;
        let totalLevels = levels.length;
        let progress = Math.round((completedLevels / totalLevels) * 100);
        menuProgress.textContent = `${progress}%`;
    }
    
    if (menuLore) {
        if (window.LORE_MODULE) {
            const unlocked = window.LORE_MODULE.getUnlockedCount();
            menuLore.textContent = `${unlocked}/12`;
        } else {
            menuLore.textContent = '1/12';
        }
    }
    
    if (menuSkins) {
        if (window.skinsModule) {
            const unlockedSkins = Object.values(window.skinsModule.skins).filter(skin => skin.unlocked).length;
            menuSkins.textContent = `${unlockedSkins}/3`;
        } else {
            menuSkins.textContent = '1/3';
        }
    }

    const menuBestScore = document.getElementById('menuBestScore');
    if (menuBestScore) menuBestScore.textContent = globalStats.bestScore || 0;
}

function closePlayModal() {
    const el = document.getElementById('playModalBackdrop');
    if (el) el.classList.remove('open');
}

function openSidePanel(backdropId) {
    document.querySelectorAll('.game-modal-backdrop').forEach(p => p.classList.remove('open'));
    const el = document.getElementById(backdropId);
    if (el) el.classList.add('open');
}

function closeSidePanels() {
    document.querySelectorAll('.game-modal-backdrop').forEach(p => p.classList.remove('open'));
}

function updateCurrentWeaponLabel() {
    const label = document.getElementById('currentWeaponLabel');
    if (label && player.weapon && weapons[player.weapon]) {
        label.textContent = weapons[player.weapon].name;
    }
}

function floatBarCloseMenu() {
    const fb = document.getElementById('floatBar');
    const qt = document.getElementById('quickMenuToggle');
    if (fb) fb.classList.remove('menu-open');
    if (qt) qt.classList.remove('menu-active');
}

function openSidePanelWithPause(backdropId) {
    if (gameRunning) gamePaused = true;
    document.querySelectorAll('.game-modal-backdrop').forEach(p => p.classList.remove('open'));
    const el = document.getElementById(backdropId);
    if (el) el.classList.add('open');
}

function closeSidePanelsWithResume() {
    closeSidePanels();
    if (gameRunning) gamePaused = false;
}

function initMenuButtons() {
    // Arsenal button (weapon shop)
    const openWeaponsBtn = document.getElementById('openWeaponsBtn');
    const closeWeaponsBtn = document.getElementById('closeWeaponsBtn');
    const closeMusicBtn = document.getElementById('closeMusicBtn');
    const closeControlsBtn = document.getElementById('closeControlsBtn');

    if (openWeaponsBtn) openWeaponsBtn.addEventListener('click', () => {
        openSidePanelWithPause('weaponModalBackdrop');
        updateWeaponShop();
        updateFireModeUI();
    });
    if (closeWeaponsBtn) closeWeaponsBtn.addEventListener('click', closeSidePanelsWithResume);
    if (closeMusicBtn) closeMusicBtn.addEventListener('click', closeSidePanelsWithResume);
    if (closeControlsBtn) closeControlsBtn.addEventListener('click', closeSidePanelsWithResume);

    // Music / Controls from dropdown
    const openMusicBtn = document.getElementById('openMusicBtn');
    const openControlsBtn = document.getElementById('openControlsBtn');
    if (openMusicBtn) openMusicBtn.addEventListener('click', () => {
        floatBarCloseMenu();
        openSidePanelWithPause('musicModalBackdrop');
    });
    if (openControlsBtn) openControlsBtn.addEventListener('click', () => {
        floatBarCloseMenu();
        openSidePanelWithPause('controlsModalBackdrop');
    });

    // Close modals on backdrop click
    document.querySelectorAll('.game-modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) closeSidePanelsWithResume();
        });
    });

    // Arsenal fire mode toggle (inside weapon modal header)
    const arsenalFireModeBtn = document.getElementById('arsenalFireModeBtn');
    if (arsenalFireModeBtn) {
        arsenalFireModeBtn.addEventListener('click', () => {
            cycleFireMode();
        });
    }

    // Quick menu (cog button)
    const quickMenuToggle = document.getElementById('quickMenuToggle');
    const floatBar = document.getElementById('floatBar');
    if (quickMenuToggle && floatBar) {
        quickMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = floatBar.classList.toggle('menu-open');
            quickMenuToggle.classList.toggle('menu-active', isOpen);
            if (isOpen && gameRunning) gamePaused = true;
            else if (!isOpen && gameRunning) gamePaused = false;
        });
        document.addEventListener('click', () => {
            if (floatBar.classList.contains('menu-open')) {
                floatBar.classList.remove('menu-open');
                quickMenuToggle.classList.remove('menu-active');
                if (gameRunning) gamePaused = false;
            }
        });
    }

    const playBtn = document.getElementById('newGameToggleBtn');
    const playBackdrop = document.getElementById('playModalBackdrop');
    const playModalClose = document.getElementById('playModalClose');

    function openPlayModal() { playBackdrop && playBackdrop.classList.add('open'); }

    if (playBtn) playBtn.addEventListener('click', openPlayModal);
    if (playModalClose) playModalClose.addEventListener('click', closePlayModal);
    if (playBackdrop) {
        playBackdrop.addEventListener('click', e => {
            if (e.target === playBackdrop) closePlayModal();
        });
    }

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            closePlayModal();
            enterGameState();
            startLevel(currentLevel);
            if (audioModule && backgroundMusic.paused && audioModule.settings.musicEnabled) {
                backgroundMusic.play().catch(() => {});
            }
        });
    }

    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            showConfirmModal('Начать новую игру?<br>Весь прогресс будет потерян.', () => {
                closePlayModal();
                resetGame();
                startLevel(1);
                enterGameState();
            });
        });
    }

    const levelSelectBtn = document.getElementById('levelSelectBtn');
    if (levelSelectBtn) {
        levelSelectBtn.addEventListener('click', () => {
            closePlayModal();
            mainMenu.classList.add('hidden');
            showLevelSelectMenu();
        });
    }

    const infiniteBtn = document.getElementById('infiniteBtn');
    if (infiniteBtn) {
        infiniteBtn.addEventListener('click', () => {
            closePlayModal();
            mainMenu.classList.add('hidden');
            startInfiniteMode();
        });
    }

    const devMenuBtn = document.getElementById('devMenuBtn');
    if (devMenuBtn) {
        devMenuBtn.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            showDevMenu();
        });
    }

    const showSettingsBtn = document.getElementById('showSettingsBtn');
    if (showSettingsBtn) {
        showSettingsBtn.addEventListener('click', () => {
            floatBarCloseMenu();
            if (window.settingsManager) {
                window.settingsManager.showMainMenu();
            } else if (graphicsModule) {
                graphicsModule.showMenu();
            }
        });
    }

    const skinsBtn = document.getElementById('skinsBtn');
    if (skinsBtn) {
        skinsBtn.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            if (window.skinsModule) {
                window.skinsModule.showSkinsMenu();
            }
        });
    }

    const showSkinsBtn = document.getElementById('showSkinsBtn');
    if (showSkinsBtn) {
        showSkinsBtn.addEventListener('click', () => {
            if (window.skinsModule) {
                window.skinsModule.showSkinsMenu();
            }
        });
    }

    const panelSkinsBtn = document.getElementById('panelSkinsBtn');
    if (panelSkinsBtn) {
        panelSkinsBtn.addEventListener('click', () => {
            if (window.skinsModule) {
                window.skinsModule.showSkinsMenu();
            }
        });
    }

    const levelSkinsBtn = document.getElementById('levelSkinsBtn');
    if (levelSkinsBtn) {
        levelSkinsBtn.addEventListener('click', () => {
            levelCompleteOverlay.classList.remove('active');
            if (window.skinsModule) {
                window.skinsModule.showSkinsMenu();
            }
        });
    }

    const backToMenuBtn = document.getElementById('backToMenuBtn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            levelSelectMenu.classList.remove('active');
            enterMenuState();
        });
    }

    const showDevMenuBtn = document.getElementById('showDevMenuBtn');
    if (showDevMenuBtn) {
        showDevMenuBtn.addEventListener('click', showDevMenu);
    }

    const levelMenuBtn = document.getElementById('levelMenuBtn');
    if (levelMenuBtn) {
        levelMenuBtn.addEventListener('click', () => {
            levelCompleteOverlay.classList.remove('active');
            enterMenuState();
        });
    }

    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            levelCompleteOverlay.classList.remove('active');
            startNextLevel();
        });
    }

    if (gameOverRestartBtn) {
        gameOverRestartBtn.addEventListener('click', () => {
            gameOverOverlay.classList.remove('active');
            if (infiniteMode) {
                startInfiniteMode();
            } else {
                startLevel(currentLevel);
                enterGameState();
            }
        });
    }

    if (gameOverMenuBtn) {
        gameOverMenuBtn.addEventListener('click', () => {
            gameOverOverlay.classList.remove('active');
            enterMenuState();
        });
    }

    const toMenuBtn = document.getElementById('toMenuBtn');
    if (toMenuBtn) {
        toMenuBtn.addEventListener('click', () => {
            floatBarCloseMenu();
            showConfirmModal('Вернуться в меню?<br>Прогресс уровня будет потерян.', () => {
                enterMenuState();
            });
        });
    }

    const completeMenuBtn = document.getElementById('completeMenuBtn');
    if (completeMenuBtn) {
        completeMenuBtn.addEventListener('click', () => {
            document.getElementById('gameCompleteOverlay').classList.remove('active');
            enterMenuState();
        });
    }

    const completeLoreBtn = document.getElementById('completeLoreBtn');
    if (completeLoreBtn) {
        completeLoreBtn.addEventListener('click', () => {
            document.getElementById('gameCompleteOverlay').classList.remove('active');
            if (window.LORE_MODULE) window.LORE_MODULE.showLoreMenu();
            else enterMenuState();
        });
    }
}

function showStatsOverlay() {
    const overlay = document.getElementById('statsOverlay');
    const grid = document.getElementById('statsGrid');
    if (!overlay || !grid) return;

    const acc = globalStats.totalShots > 0
        ? Math.round((globalStats.totalHits / globalStats.totalShots) * 100) : 0;

    const rows = [
        { icon: 'fas fa-skull', label: 'Всего убито врагов', value: globalStats.totalKills },
        { icon: 'fas fa-dragon', label: 'Убито боссов', value: globalStats.bossesKilled },
        { icon: 'fas fa-bullseye', label: 'Всего выстрелов', value: globalStats.totalShots },
        { icon: 'fas fa-crosshairs', label: 'Точность', value: acc + '%' },
        { icon: 'fas fa-trophy', label: 'Рекорд очков', value: globalStats.bestScore },
        { icon: 'fas fa-coins', label: 'Всего заработано', value: globalStats.totalMoney + '$' },
        { icon: 'fas fa-flag-checkered', label: 'Уровней пройдено', value: globalStats.levelsCompleted },
        { icon: 'fas fa-gamepad', label: 'Игр сыграно', value: globalStats.gamesPlayed },
    ];

    const topRows = topScores.length > 0
        ? topScores.map((t, i) => `
            <div class="stats-row top-score-row">
                <span class="top-score-rank">#${i + 1}</span>
                <span class="stats-label">${t.weapon} · Ур.${t.level} · ${t.date}</span>
                <span class="stats-value">${t.score}</span>
            </div>`).join('')
        : '<div class="stats-row"><span class="stats-label" style="color:rgba(160,180,210,0.4)">Нет записей</span></div>';

    grid.innerHTML = rows.map(r => `
        <div class="stats-row">
            <i class="${r.icon} stats-icon"></i>
            <span class="stats-label">${r.label}</span>
            <span class="stats-value">${r.value}</span>
        </div>`).join('') +
        `<div class="stats-row" style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,211,45,0.2);">
            <i class="fas fa-crown stats-icon" style="color:#ffd32d;"></i>
            <span class="stats-label" style="color:#ffd32d;font-weight:700;">ТОП-5 ЗАБЕГОВ</span>
            <span class="stats-value"></span>
         </div>` + topRows;

    overlay.classList.add('active');
    gamePaused = true;
}

function showAchievementsOverlay() {
    const overlay = document.getElementById('achievementsOverlay');
    const grid = document.getElementById('achievementsGrid');
    if (!overlay || !grid) return;
    grid.innerHTML = ACHIEVEMENTS_DEFS.map(def => {
        const unlocked = unlockedAchievements.has(def.id);
        return `<div class="ach-card ${unlocked ? 'ach-unlocked' : 'ach-locked'}">
            <i class="${def.icon} ach-icon"></i>
            <div class="ach-name">${def.name}</div>
            <div class="ach-desc">${unlocked ? def.desc : '???'}</div>
        </div>`;
    }).join('');
    overlay.classList.add('active');
    gamePaused = true;
}

function initAchievements() {
    const btn = document.getElementById('achievementsBtn');
    if (btn) btn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        showAchievementsOverlay();
    });
    const closeBtn = document.getElementById('closeAchievementsBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('achievementsOverlay').classList.remove('active');
        enterMenuState();
    });
}

function initAboutMenu() {
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            showStatsOverlay();
        });
    }

    const closeStatsBtn = document.getElementById('closeStatsBtn');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            document.getElementById('statsOverlay').classList.remove('active');
            enterMenuState();
        });
    }

    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            showAboutMenu();
        });
    }

    if (closeAboutBtn) {
        closeAboutBtn.addEventListener('click', () => {
            aboutOverlay.classList.remove('active');
            enterMenuState();
        });
    }

    if (panelAboutBtn) {
        panelAboutBtn.addEventListener('click', () => {
            showAboutMenu();
        });
    }

    const panelHomeBtn = document.getElementById('panelHomeBtn');
    if (panelHomeBtn) {
        panelHomeBtn.addEventListener('click', () => {
            showConfirmModal('Вернуться в меню?<br>Прогресс уровня будет потерян.', () => {
                enterMenuState();
            });
        });
    }

    const panelPauseBtn = document.getElementById('panelPauseBtn');
    if (panelPauseBtn) {
        panelPauseBtn.addEventListener('click', () => {
            if (gamePaused) resumeGame(); else pauseGame();
        });
    }

    const pauseResumeBtn = document.getElementById('pauseResumeBtn');
    if (pauseResumeBtn) pauseResumeBtn.addEventListener('click', () => resumeGame());

    const pauseShopBtn = document.getElementById('pauseShopBtn');
    if (pauseShopBtn) pauseShopBtn.addEventListener('click', () => {
        resumeGame();
        setTimeout(() => {
            const shopBtn = document.getElementById('shopBtn') || document.querySelector('[data-modal="weaponModal"]');
            if (shopBtn) shopBtn.click();
        }, 50);
    });

    const pauseMenuBtn = document.getElementById('pauseMenuBtn');
    if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', () => {
        hidePauseOverlay();
        showConfirmModal('Вернуться в меню?<br>Прогресс уровня будет потерян.', () => enterMenuState());
    });
}

function showPauseOverlay() {
    document.getElementById('pauseOverlay')?.classList.add('active');
    const btn = document.getElementById('panelPauseBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Продолжить';
}

function hidePauseOverlay() {
    document.getElementById('pauseOverlay')?.classList.remove('active');
    const btn = document.getElementById('panelPauseBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
}

function pauseGame() {
    gamePaused = true;
    mouseDown = false;
    spacePressed = false;
    hideAutoFireIndicator();
    showPauseOverlay();
}

function resumeGame() {
    gamePaused = false;
    hidePauseOverlay();
}

function initDevCheats() {
    const devMoneyBtn = document.getElementById('devMoney');
    if (devMoneyBtn) {
        devMoneyBtn.addEventListener('click', function() {
            devMode.infiniteMoney = !devMode.infiniteMoney;
            this.classList.toggle('active');
            if (devMode.infiniteMoney) money = 999999;
            updateUI();
            updateMenuStats();
        });
    }

    const devHealthBtn = document.getElementById('devHealth');
    if (devHealthBtn) {
        devHealthBtn.addEventListener('click', function() {
            devMode.infiniteHealth = !devMode.infiniteHealth;
            this.classList.toggle('active');
            if (devMode.infiniteHealth) health = 9999;
            updateUI();
        });
    }

    const devAmmoBtn = document.getElementById('devAmmo');
    if (devAmmoBtn) {
        devAmmoBtn.addEventListener('click', function() {
            devMode.infiniteAmmo = !devMode.infiniteAmmo;
            this.classList.toggle('active');
        });
    }

    const devDamageBtn = document.getElementById('devDamage');
    if (devDamageBtn) {
        devDamageBtn.addEventListener('click', function() {
            devMode.maxDamage = !devMode.maxDamage;
            this.classList.toggle('active');
            if (devMode.maxDamage) {
                for (let weapon in weapons) {
                    weapons[weapon].damage = 999;
                    weapons[weapon].upgrades.damage = 10;
                }
            }
            updateUI();
        });
    }

    const devUnlockBtn = document.getElementById('devUnlock');
    if (devUnlockBtn) {
        devUnlockBtn.addEventListener('click', function() {
            devMode.unlockedAll = !devMode.unlockedAll;
            this.classList.toggle('active');
            if (devMode.unlockedAll) {
                levels.forEach(level => {
                    level.unlocked = true;
                    level.completed = true;
                });
                for (let weapon in weapons) {
                    weapons[weapon].cost = 0;
                    weapons[weapon].unlocked = true;
                    weapons[weapon].purchased = true;
                }
                if (window.skinsModule) {
                    Object.values(window.skinsModule.skins).forEach(skin => {
                        skin.unlocked = true;
                        skin.purchased = true;
                    });
                    window.skinsModule.saveSkins();
                }
                updateWeaponButtons();
                generateLevelButtons();
                updateMenuStats();
                if (window.LORE_MODULE) {
                    window.LORE_MODULE.forceUnlockAll();
                }
            }
        });
    }

    const devSkinsBtn = document.getElementById('devSkins');
    if (devSkinsBtn) {
        devSkinsBtn.addEventListener('click', function() {
            if (window.skinsModule) {
                Object.values(window.skinsModule.skins).forEach(skin => {
                    skin.unlocked = true;
                    skin.purchased = true;
                });
                window.skinsModule.saveSkins();
                window.skinsModule.generateSkinOptions();
                updateUI();
                updateMenuStats();
                this.classList.toggle('active');
            }
        });
    }

    const devResetBtn = document.getElementById('devReset');
    if (devResetBtn) {
        devResetBtn.addEventListener('click', function() {
            showConfirmModal('Сбросить всю игру?<br>Весь прогресс будет удалён безвозвратно.', () => {
                resetGame();
            });
        });
    }

    const devCloseBtn = document.getElementById('devClose');
    if (devCloseBtn) {
        devCloseBtn.addEventListener('click', () => {
            devMenu.classList.remove('active');
            if (!gameRunning) {
                enterMenuState();
            } else {
                gamePaused = false;
            }
        });
    }
}

function enterMenuState() {
    infiniteMode = false;
    infiniteWaveTransition = false;
    gameRunning = false;
    gamePaused = true;
    hidePauseOverlay();

    const layout = document.querySelector('.game-layout');
    if (layout) {
        layout.classList.add('fade-out');
        setTimeout(() => {
            document.body.classList.add('game-hidden');
            layout.classList.remove('fade-out');
            mainMenu.classList.remove('hidden');
            updateMenuStats();
            if (audioModule) audioModule.playTrack(0);
        }, 340);
    } else {
        document.body.classList.add('game-hidden');
        mainMenu.classList.remove('hidden');
        updateMenuStats();
        if (audioModule) audioModule.playTrack(0);
    }
}

function enterGameState() {
    if (audioModule) audioModule.playTrack(1);
    const layout = document.querySelector('.game-layout');
    document.body.classList.remove('game-hidden');
    mainMenu.classList.add('hidden');
    if (layout) {
        layout.style.opacity = '0';
        layout.style.transition = 'none';
        requestAnimationFrame(() => {
            layout.style.transition = '';
            layout.style.opacity = '';
        });
    }
    gameRunning = true;
    gamePaused = false;
    setTimeout(resizeCanvas, 50);
}

function isInMenuState() {
    return !gameRunning && document.body.classList.contains('game-hidden');
}

function showLevelSelectMenu() {
    levelSelectMenu.classList.add('active');
    generateLevelButtons();
    gamePaused = true;
}

function showDevMenu() {
    devMenu.classList.add('active');
    gamePaused = true;
}

function showAboutMenu() {
    aboutOverlay.classList.add('active');
    gamePaused = true;
}

function generateLevelButtons() {
    if (!levelGrid) return;
    
    levelGrid.innerHTML = '';
    levels.forEach(level => {
        const levelBtn = document.createElement('div');
        levelBtn.className = 'level-btn fade-in-up';
        
        if (level.completed) {
            levelBtn.classList.add('completed');
        } else if (!level.unlocked) {
            levelBtn.classList.add('locked');
        }
        
        if (level.id === currentLevel) {
            levelBtn.classList.add('current');
        }
        
        const loreIcon = level.loreUnlocked ? '<i class="fas fa-scroll lore-indicator" title="История открыта"></i>' : '';
        
        levelBtn.innerHTML = `
            <div class="level-number">${level.id}</div>
            <div class="level-name">${level.name}</div>
            <div class="level-reward"><i class="fas fa-coins"></i> ${level.reward}$</div>
            ${loreIcon}
            ${!level.unlocked ? '<div class="level-lock"><i class="fas fa-lock"></i></div>' : ''}
            ${level.completed ? '<div class="level-lock" style="color: var(--accent);"><i class="fas fa-check"></i></div>' : ''}
        `;
        
        if (level.unlocked) {
            levelBtn.addEventListener('click', () => {
                startLevel(level.id);
                levelSelectMenu.classList.remove('active');
                enterGameState();
            });
        }
        
        levelGrid.appendChild(levelBtn);
    });
}

function startLevel(levelId) {
    currentLevel = levelId;
    const levelData = levels[levelId - 1];
    enemiesToComplete = levelData.enemiesToComplete;
    enemiesKilledThisLevel = 0;
    finalBossSpawned = false;
    shotsTotal = 0;
    shotsHit = 0;
    damageFlash = 0;

    if (gameModule && gameModule.settings) {
        spawnRate = 0.0125 * gameModule.settings.enemyHealthMultiplier;
    }

    bullets = [];
    enemies = [];
    effects = [];
    pickups = [];
    enemyBullets = [];
    enemyCount = 0;
    health = 100;
    shieldMax = getShieldMax();
    shield = shieldMax;
    shieldRegenTimer = 0;
    spawnEnabled = true;
    loreNotificationActive = false;
    skinNotificationActive = false;
    
    if (spawnSlider) {
        spawnSlider.value = 50;
        spawnSlider.dispatchEvent(new Event('input'));
    }
    
    reloading = false;
    
    if (currentLevelDisplay) currentLevelDisplay.textContent = `Уровень: ${currentLevel}`;
    if (currentLevelNumber) currentLevelNumber.textContent = currentLevel;
    
    const keepWeapon = player.weapon && weapons[player.weapon] && weapons[player.weapon].purchased;
    if (!keepWeapon) player.weapon = 'pistol';
    document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
    const activeWeaponBtn = document.querySelector(`.weapon-btn[data-weapon="${player.weapon}"]`);
    if (activeWeaponBtn) activeWeaponBtn.classList.add('active');
    
    for (let weapon in weapons) {
        weapons[weapon].ammo = weapons[weapon].clipSize;
    }
    
    updateUI();
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => createEnemy(), i * 1000);
    }
}

function startNextLevel() {
    if (currentLevel < levels.length) {
        startLevel(currentLevel + 1);
        enterGameState();
    } else {
        showGameComplete();
    }
}

function showGameComplete() {
    gameRunning = false;
    gamePaused = true;

    const overlay = document.getElementById('gameCompleteOverlay');
    const scoreEl = document.getElementById('completeFinalScore');
    const moneyEl = document.getElementById('completeMoney');
    if (scoreEl) scoreEl.textContent = score;
    if (moneyEl) moneyEl.textContent = money;
    if (overlay) overlay.classList.add('active');

    if (window.LORE_MODULE) window.LORE_MODULE.checkLevelUnlock(10);

    globalStats.levelsCompleted++;
    if (score > globalStats.bestScore) globalStats.bestScore = score;
    saveStats();
}

function completeLevel() {
    if (dailyMode) {
        showDailyResult(true);
        return;
    }
    if (infiniteMode) {
        completeInfiniteWave();
        return;
    }
    const levelData = levels[currentLevel - 1];
    levelData.completed = true;
    levelData.loreUnlocked = true;
    
    if (currentLevel < levels.length) {
        levels[currentLevel].unlocked = true;
    }
    
    let reward = levelData.reward;
    if (gameModule && gameModule.settings) {
        reward = Math.round(reward * gameModule.settings.rewardMultiplier);
    }
    money += reward;
    if (rewardAmount) rewardAmount.textContent = reward;
    globalStats.levelsCompleted++;
    if (score > globalStats.bestScore) globalStats.bestScore = score;
    globalStats.gamesPlayed++;
    saveStats();
    saveTopScore(score, currentLevel, weapons[player.weapon] ? weapons[player.weapon].name : '?');
    checkAchievements();

    const loreUnlocked = checkLoreUnlock();
    const skinUnlocked = checkSkinUnlock();
    
    gamePaused = true;
    if (levelCompleteOverlay) levelCompleteOverlay.classList.add('active');
    
    if (loreUnlocked && loreUnlockedMessage) {
        loreUnlockedMessage.style.display = 'flex';
        loreUnlockedMessage.innerHTML = `
            <i class="fas fa-scroll"></i> 
            <span>Новая часть истории открыта!</span>
            <button class="lore-view-btn" id="viewLoreBtn">
                <i class="fas fa-book-open"></i> Читать
            </button>
        `;
        
        const viewLoreBtn = document.getElementById('viewLoreBtn');
        if (viewLoreBtn) {
            viewLoreBtn.addEventListener('click', () => {
                if (window.LORE_MODULE) {
                    window.LORE_MODULE.showLoreMenu();
                }
            });
        }
    }
    
    if (skinUnlocked && skinUnlockedMessage) {
        skinUnlockedMessage.style.display = 'flex';
        skinUnlockedMessage.innerHTML = `
            <i class="fas fa-paint-brush"></i> 
            <span>Новый скин открыт!</span>
            <button class="skin-view-btn" id="viewSkinBtn">
                <i class="fas fa-eye"></i> Посмотреть
            </button>
        `;
        
        const viewSkinBtn = document.getElementById('viewSkinBtn');
        if (viewSkinBtn) {
            viewSkinBtn.addEventListener('click', () => {
                if (window.skinsModule) {
                    window.skinsModule.showSkinsMenu();
                }
            });
        }
    }
    
    updateMenuStats();
    saveGame();
    generateLevelButtons();

    // Wire up arsenal button in level-complete overlay
    const lcArsenalBtn = document.getElementById('levelArsenalBtn');
    if (lcArsenalBtn) {
        lcArsenalBtn.onclick = () => {
            const backdrop = document.getElementById('weaponModalBackdrop');
            if (backdrop) {
                backdrop.classList.add('open');
                updateWeaponShop();
                updateFireModeUI();
            }
        };
    }

    if (currentLevel === 10) {
        setTimeout(() => showEndingCutscene(), 2500);
    }
}

// ─── БЕСКОНЕЧНЫЙ РЕЖИМ ────────────────────────────────────────

function saveInfiniteBest(wave) {
    if (wave > bestInfiniteWave) {
        bestInfiniteWave = wave;
        storageSave('neon_infinite_best', String(wave));
    }
}

function infiniteEnemyMult(wave) {
    return {
        health: 1 + (wave - 1) * 0.18,
        speed:  1 + (wave - 1) * 0.07,
    };
}

// ─── ИСПЫТАНИЕ ДНЯ ────────────────────────────────────────────
const DAILY_KEY_PREFIX = 'neon_daily_';
let dailyMode = false;
let dailyDateStr = '';

function getDailyDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDailySeed(dateStr) {
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function isDailyCompleted(dateStr) {
    return !!storageLoad(DAILY_KEY_PREFIX + dateStr);
}

function saveDailyResult(dateStr, score, kills) {
    storageSave(DAILY_KEY_PREFIX + dateStr, JSON.stringify({ score, kills, date: dateStr }));
}

function showDailyResult(won) {
    dailyMode = false;
    gameRunning = false;
    gamePaused = true;

    saveDailyResult(dailyDateStr, score, enemiesKilledThisLevel);

    const overlay = document.getElementById('dailyResultOverlay');
    const dateEl = document.getElementById('dailyResultDate');
    const textEl = document.getElementById('dailyResultText');
    const statsEl = document.getElementById('dailyResultStats');
    if (!overlay) return;

    if (dateEl) dateEl.textContent = dailyDateStr;
    if (textEl) {
        textEl.textContent = won ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ';
        textEl.style.color = won ? '#00ff9d' : '#ff4757';
    }
    if (statsEl) statsEl.innerHTML = `
        <div class="daily-stat"><i class="fas fa-star"></i> Очки: <b>${score}</b></div>
        <div class="daily-stat"><i class="fas fa-skull"></i> Убито: <b>${enemiesKilledThisLevel}</b></div>`;

    overlay.classList.add('active');
}

function startDailyChallenge() {
    dailyDateStr = getDailyDateStr();
    if (isDailyCompleted(dailyDateStr)) {
        const data = JSON.parse(storageLoad(DAILY_KEY_PREFIX + dailyDateStr));
        const overlay = document.getElementById('dailyResultOverlay');
        const dateEl = document.getElementById('dailyResultDate');
        const textEl = document.getElementById('dailyResultText');
        const statsEl = document.getElementById('dailyResultStats');
        if (dateEl) dateEl.textContent = dailyDateStr;
        if (textEl) { textEl.textContent = 'Уже выполнено сегодня'; textEl.style.color = '#ffd32d'; }
        if (statsEl) statsEl.innerHTML = `
            <div class="daily-stat"><i class="fas fa-star"></i> Очки: <b>${data.score}</b></div>
            <div class="daily-stat"><i class="fas fa-skull"></i> Убито: <b>${data.kills}</b></div>`;
        if (overlay) overlay.classList.add('active');
        return;
    }

    const seed = getDailySeed(dailyDateStr);
    const rng = seededRandom(seed);

    resetGame();
    setTimeout(() => {
        dailyMode = true;
        infiniteMode = false;

        // фиксированный уровень: 3 случайных уровня на основе сида
        const levelId = 1 + Math.floor(rng() * 5); // уровни 1–5
        currentLevel = levelId;
        enemiesToComplete = 20 + Math.floor(rng() * 20); // 20–39 врагов
        enemiesKilledThisLevel = 0;
        finalBossSpawned = false;
        shotsTotal = 0;
        shotsHit = 0;
        damageFlash = 0;
        shieldMax = getShieldMax();
        shield = shieldMax;
        shieldRegenTimer = 0;

        bullets = [];
        enemies = [];
        effects = [];
        enemyCount = 0;
        health = 100;
        spawnEnabled = true;
        spawnRate = 0.01 + rng() * 0.01; // 0.01–0.02

        reloading = false;
        if (currentLevelDisplay) currentLevelDisplay.textContent = `Испытание дня`;
        if (currentLevelNumber) currentLevelNumber.textContent = '★';

        const keepWeapon = player.weapon && weapons[player.weapon] && weapons[player.weapon].purchased;
        if (!keepWeapon) player.weapon = 'pistol';
        for (let weapon in weapons) weapons[weapon].ammo = weapons[weapon].clipSize;

        updateUI();
        infiniteAnnouncement = { text: '★ ИСПЫТАНИЕ ДНЯ', sub: `Убейте ${enemiesToComplete} врагов`, life: 1.0 };
        for (let i = 0; i < 3; i++) setTimeout(() => createEnemy(), i * 1000);
        enterGameState();
    }, 400);
}

function initDailyChallenge() {
    const btn = document.getElementById('dailyBtn');
    if (btn) btn.addEventListener('click', () => startDailyChallenge());

    const closeBtn = document.getElementById('closeDailyResultBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('dailyResultOverlay').classList.remove('active');
        enterMenuState();
    });
}

// ──────────────────────────────────────────────────────────────

function startInfiniteMode() {
    resetGame();
    setTimeout(() => {
        infiniteMode = true;
        infiniteWave = 1;
        infiniteWaveTransition = false;
        infiniteAnnouncement = null;
        beginInfiniteWave(1);
        enterGameState();
    }, 400);
}

function beginInfiniteWave(wave) {
    infiniteWave = wave;
    currentLevel = wave;
    enemiesToComplete = 8 + wave * 4;
    enemiesKilledThisLevel = 0;
    enemies = [];
    enemyCount = 0;
    bullets = [];
    infiniteWaveTransition = false;
    spawnEnabled = true;

    // Спавн-рейт растёт с волной (макс 0.18)
    spawnRate = Math.min(0.045, 0.0075 + wave * 0.00175);

    if (currentLevelNumber) currentLevelNumber.textContent = wave;
    if (currentLevelDisplay) currentLevelDisplay.innerHTML =
        `<i class="fas fa-infinity"></i> Волна: ${wave}`;

    gameRunning = true;
    gamePaused = false;

    // Анонс волны на экране
    const isBossWave = wave % 5 === 0;
    const isFastWave  = !isBossWave && wave % 3 === 0;
    const isTankWave  = !isBossWave && !isFastWave && wave % 4 === 0;
    let waveIcon, waveText, waveSub, waveColor;
    if (isBossWave) {
        waveIcon = '💀'; waveText = `ВОЛНА ${wave} — БОСС`; waveSub = 'Уничтожьте элитного врага!'; waveColor = '#ff4757';
    } else if (isFastWave) {
        waveIcon = '⚡'; waveText = `ВОЛНА ${wave} — СТРЕМИТЕЛЬНАЯ`; waveSub = 'Быстрые враги!'; waveColor = '#ffeb3b';
    } else if (isTankWave) {
        waveIcon = '🛡'; waveText = `ВОЛНА ${wave} — БРОНИРОВАННАЯ`; waveSub = 'Много танков!'; waveColor = '#64b5f6';
    } else {
        waveIcon = '🎯'; waveText = `ВОЛНА ${wave}`; waveSub = `Убей ${enemiesToComplete} врагов`; waveColor = '#00ff9d';
    }
    infiniteAnnouncement = {
        text: waveIcon + ' ' + waveText,
        sub: waveSub,
        life: 1.0,
        color: waveColor,
        waveType: isBossWave ? 'boss' : isFastWave ? 'fast' : isTankWave ? 'tank' : 'normal',
    };

    // Каждые 5 волн — сразу спавним мега-босса
    if (isBossWave) {
        setTimeout(() => spawnInfiniteBoss(wave), 500);
    }

    updateUI();
}

function spawnInfiniteBoss(wave) {
    if (!gameRunning || !spawnEnabled) return;
    const mult = infiniteEnemyMult(wave);
    const size = 55 + wave * 2;
    enemies.push({
        x: canvas.width / 2 - size / 2,
        y: -size,
        width: size,
        height: size,
        color: '#ff1744',
        speed: (0.125 + Math.random() * 0.1) * mult.speed,
        health: Math.round((25 + wave * 8) * mult.health),
        maxHealth: Math.round((25 + wave * 8) * mult.health),
        type: 'megaboss',
        value: 200 + wave * 20,
        isBoss: true,
    });
    enemyCount++;
}

function completeInfiniteWave() {
    const reward = 80 + (infiniteWave - 1) * 25;
    money += reward;
    score += reward;
    infiniteWaveTransition = true;
    spawnEnabled = false;
    gamePaused = false;

    saveInfiniteBest(infiniteWave);
    updateUI();
    updateMenuStats();
    showWaveCompleteOverlay(infiniteWave, reward);
}

function showWaveCompleteOverlay(wave, reward) {
    // Убираем старый если есть
    const old = document.getElementById('waveCompleteOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'waveCompleteOverlay';
    overlay.style.cssText = `
        position:fixed; inset:0; display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        background:rgba(0,0,0,0.55); backdrop-filter:blur(3px);
        z-index:800; animation:waveOverlayIn 0.3s ease;
    `;
    const nextWave = wave + 1;
    const isBossNext = nextWave % 5 === 0;
    overlay.innerHTML = `
        <div style="
            background:rgba(8,8,22,0.97); border:2px solid #00ff9d;
            border-radius:20px; padding:36px 48px; text-align:center;
            box-shadow:0 0 40px rgba(0,255,157,0.3); min-width:340px;">
            <div style="font-size:2rem;font-weight:900;color:#00ff9d;letter-spacing:3px;margin-bottom:6px;">
                ✓ ВОЛНА ${wave} ПРОЙДЕНА
            </div>
            <div style="font-size:1.1rem;color:#a4b0be;margin-bottom:20px;">
                Награда: <span style="color:#ffd32d;font-weight:700;">+${reward}$</span>
            </div>
            <div style="display:flex;gap:24px;justify-content:center;margin-bottom:24px;">
                <div style="text-align:center;">
                    <div style="font-size:1.6rem;font-weight:800;color:#fff;">${wave}</div>
                    <div style="font-size:0.75rem;color:#a4b0be;">ВОЛНА</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:1.6rem;font-weight:800;color:#ffd32d;">${score}</div>
                    <div style="font-size:0.75rem;color:#a4b0be;">ОЧКИ</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:1.6rem;font-weight:800;color:#00ff9d;">${money}$</div>
                    <div style="font-size:0.75rem;color:#a4b0be;">ДЕНЬГИ</div>
                </div>
            </div>
            <div id="waveCountdownText" style="font-size:1rem;color:#a4b0be;">
                ${isBossNext ? `⚠ Следующая: <span style="color:#ff4757;font-weight:700;">ВОЛНА БОССА ${nextWave}</span>` : `Следующая: Волна ${nextWave}`}
            </div>
            <div style="margin-top:14px;font-size:2rem;font-weight:900;color:#00ff9d;" id="waveCountdownNum">3</div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Отсчёт 3…2…1
    let count = 3;
    const tick = setInterval(() => {
        count--;
        const el = document.getElementById('waveCountdownNum');
        if (el) el.textContent = count || '🚀';
        if (count <= 0) {
            clearInterval(tick);
            setTimeout(() => {
                overlay.remove();
                const nextWave = wave + 1;
                if (nextWave % 5 === 0) {
                    showPerkChoice();
                } else {
                    beginInfiniteWave(nextWave);
                }
            }, 500);
        }
    }, 1000);
}

// ──────────────────────────────────────────────────────────────

function checkLoreUnlock() {
    if (!window.LORE_MODULE) return false;
    
    const loreUnlocked = window.LORE_MODULE.checkLevelUnlock(currentLevel);
    
    if (loreUnlocked && !loreNotificationActive) {
        loreNotificationActive = true;
        
        setTimeout(() => {
            const loreTab = document.createElement('div');
            loreTab.className = 'lore-tab';
            loreTab.innerHTML = `
                <div class="lore-tab-icon">
                    <i class="fas fa-scroll"></i>
                </div>
                <div class="lore-tab-text">Новая история!</div>
                <div class="lore-tab-badge">NEW</div>
            `;
            
            loreTab.addEventListener('click', () => {
                if (window.LORE_MODULE) {
                    window.LORE_MODULE.showLoreMenu();
                }
                if (loreTab.parentNode) {
                    loreTab.remove();
                }
            });
            
            document.body.appendChild(loreTab);
            
            setTimeout(() => {
                loreTab.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                if (loreTab.parentNode) {
                    loreTab.classList.remove('show');
                    setTimeout(() => {
                        if (loreTab.parentNode) {
                            loreTab.remove();
                        }
                        loreNotificationActive = false;
                    }, 300);
                }
            }, 5000);
        }, 1000);
        
        return true;
    }
    
    return false;
}

function checkSkinUnlock() {
    if (!window.skinsModule) return false;
    
    let skinUnlocked = false;
    
    if (currentLevel >= 3 && !window.skinsModule.skins.camo.unlocked) {
        skinUnlocked = window.skinsModule.unlockSkin('camo');
    }
    
    if (currentLevel >= 5 && !window.skinsModule.skins.gold.unlocked) {
        skinUnlocked = window.skinsModule.unlockSkin('gold') || skinUnlocked;
    }
    
    if (skinUnlocked && !skinNotificationActive) {
        skinNotificationActive = true;
        
        if (skinUnlockSound && audioModule && audioModule.settings.effectsEnabled) {
            skinUnlockSound.currentTime = 0;
            skinUnlockSound.play().catch(() => {});
        }
        
        setTimeout(() => {
            const skinTab = document.createElement('div');
            skinTab.className = 'skin-tab';
            skinTab.innerHTML = `
                <div class="skin-tab-icon">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="skin-tab-text">Новый скин!</div>
                <div class="skin-tab-badge">NEW</div>
            `;
            
            skinTab.addEventListener('click', () => {
                if (window.skinsModule) {
                    window.skinsModule.showSkinsMenu();
                }
                if (skinTab.parentNode) {
                    skinTab.remove();
                }
            });
            
            document.body.appendChild(skinTab);
            
            setTimeout(() => {
                skinTab.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                if (skinTab.parentNode) {
                    skinTab.classList.remove('show');
                    setTimeout(() => {
                        if (skinTab.parentNode) {
                            skinTab.remove();
                        }
                        skinNotificationActive = false;
                    }, 300);
                }
            }, 5000);
        }, 1000);
        
        return true;
    }
    
    return false;
}

function showGameOver() {
    if (dailyMode) {
        showDailyResult(false);
        return;
    }
    // Убираем overlay волны если был
    const wo = document.getElementById('waveCompleteOverlay');
    if (wo) wo.remove();

    if (infiniteMode) saveInfiniteBest(infiniteWave);
    if (score > globalStats.bestScore) globalStats.bestScore = score;
    globalStats.gamesPlayed++;
    saveStats();
    saveTopScore(score, infiniteMode ? `∞${infiniteWave}` : currentLevel, weapons[player.weapon] ? weapons[player.weapon].name : '?');

    if (gameOverKilled) gameOverKilled.textContent = enemiesKilledThisLevel;
    if (gameOverRequired) gameOverRequired.textContent = enemiesToComplete;
    if (gameOverMoney) gameOverMoney.textContent = money;
    if (gameOverLevel) {
        gameOverLevel.textContent = infiniteMode
            ? `∞ Волна ${infiniteWave}`
            : currentLevel;
    }

    if (gameOverSkin && window.skinsModule) {
        const currentSkin = window.skinsModule.getCurrentSkin();
        gameOverSkin.textContent = currentSkin ? currentSkin.name : 'Неоновый';
    }

    // Точность
    let accEl = document.getElementById('gameOverAccuracy');
    if (!accEl) {
        accEl = document.createElement('div');
        accEl.id = 'gameOverAccuracy';
        accEl.className = 'game-over-stat';
        accEl.innerHTML = `<i class="fas fa-crosshairs"></i><span>Точность: <span id="gameOverAccuracyNum">0%</span></span>`;
        const statsEl = document.querySelector('.game-over-stats');
        if (statsEl) statsEl.appendChild(accEl);
    }
    const accNum = document.getElementById('gameOverAccuracyNum');
    if (accNum) {
        const acc = shotsTotal > 0 ? Math.round((shotsHit / shotsTotal) * 100) : 0;
        accNum.textContent = `${acc}%`;
    }

    // Макс. комбо
    let comboEl = document.getElementById('gameOverMaxCombo');
    if (!comboEl) {
        comboEl = document.createElement('div');
        comboEl.id = 'gameOverMaxCombo';
        comboEl.className = 'game-over-stat';
        comboEl.innerHTML = `<i class="fas fa-fire"></i><span>Макс. комбо: <span id="gameOverMaxComboNum">0</span></span>`;
        const statsEl = document.querySelector('.game-over-stats');
        if (statsEl) statsEl.appendChild(comboEl);
    }
    const comboNumEl = document.getElementById('gameOverMaxComboNum');
    if (comboNumEl) comboNumEl.textContent = `x${maxCombo}`;

    // Любимое оружие (по убийствам за сессию — из globalStats.weaponKills)
    let favWpnEl = document.getElementById('gameOverFavWeapon');
    if (!favWpnEl) {
        favWpnEl = document.createElement('div');
        favWpnEl.id = 'gameOverFavWeapon';
        favWpnEl.className = 'game-over-stat';
        favWpnEl.innerHTML = `<i class="fas fa-gun"></i><span>Оружие: <span id="gameOverFavWeaponName">—</span></span>`;
        const statsEl = document.querySelector('.game-over-stats');
        if (statsEl) statsEl.appendChild(favWpnEl);
    }
    const favWpnName = document.getElementById('gameOverFavWeaponName');
    if (favWpnName) {
        const kills = globalStats.weaponKills || {};
        const fav = Object.entries(kills).sort((a, b) => b[1] - a[1])[0];
        favWpnName.textContent = fav && weapons[fav[0]] ? `${weapons[fav[0]].name} (${fav[1]} убийств)` : '—';
    }

    // Всего выстрелов за сессию
    let shotsEl = document.getElementById('gameOverShots');
    if (!shotsEl) {
        shotsEl = document.createElement('div');
        shotsEl.id = 'gameOverShots';
        shotsEl.className = 'game-over-stat';
        shotsEl.innerHTML = `<i class="fas fa-bullseye"></i><span>Выстрелов: <span id="gameOverShotsNum">0</span></span>`;
        const statsEl = document.querySelector('.game-over-stats');
        if (statsEl) statsEl.appendChild(shotsEl);
    }
    const shotsNumEl = document.getElementById('gameOverShotsNum');
    if (shotsNumEl) shotsNumEl.textContent = shotsTotal;

    // Для бесконечного режима — показываем рекорд
    let bestEl = document.getElementById('gameOverBestWave');
    if (infiniteMode) {
        if (!bestEl) {
            bestEl = document.createElement('div');
            bestEl.id = 'gameOverBestWave';
            bestEl.className = 'game-over-stat';
            bestEl.innerHTML = `<i class="fas fa-infinity"></i><span>Лучшая волна: <span id="gameOverBestWaveNum">0</span></span>`;
            const statsEl = document.querySelector('.game-over-stats');
            if (statsEl) statsEl.appendChild(bestEl);
        }
        const numEl = document.getElementById('gameOverBestWaveNum');
        if (numEl) numEl.textContent = bestInfiniteWave;
        if (bestEl) bestEl.style.display = '';
    } else {
        if (bestEl) bestEl.style.display = 'none';
    }

    gameRunning = false;
    gamePaused = true;
    document.body.classList.remove('game-hidden');
    if (gameOverOverlay) gameOverOverlay.classList.add('active');
}

function saveGame() {
    const saveData = {
        version: 2,
        levels: levels,
        currentLevel: currentLevel,
        score: score,
        money: money,
        weapons: weapons,
        unlockedWeapons: Object.keys(weapons).filter(w => weapons[w].unlocked || weapons[w].cost === 0),
        loreProgress: window.LORE_MODULE ? window.LORE_MODULE.getUnlockedParts() : [1],
        skinsData: window.skinsModule ? window.skinsModule.skins : null,
        currentSkin: window.skinsModule ? window.skinsModule.currentSkin : 'neon',
        playerUpgrades: playerUpgrades,
        savedAt: Date.now()
    };
    storageSave(STORAGE_KEY, JSON.stringify(saveData));
    showSaveNotification();
}

function hasSaveGame() {
    return !!storageLoad(STORAGE_KEY);
}

function updateContinueButton() {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;
    const save = storageLoad(STORAGE_KEY);
    if (save) {
        try {
            const data = JSON.parse(save);
            const lvl = data.currentLevel || 1;
            btn.innerHTML = `<i class="fas fa-play"></i>Продолжить — Ур. ${lvl}`;
            btn.style.display = '';
        } catch { btn.style.display = 'none'; }
    } else {
        btn.style.display = 'none';
    }
}

function showSaveNotification() {
    updateContinueButton();
    let el = document.getElementById('saveNotification');
    if (!el) {
        el = document.createElement('div');
        el.id = 'saveNotification';
        el.style.cssText = `
            position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
            background: rgba(0,20,10,0.92); border: 1px solid rgba(0,255,157,0.4);
            color: #00ff9d; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;
            padding: 7px 18px; border-radius: 8px; z-index: 99999;
            pointer-events: none; opacity: 0; transition: opacity 0.3s;
        `;
        el.textContent = '✓ Прогресс сохранён';
        document.body.appendChild(el);
    }
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function showConfirmModal(message, onConfirm) {
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'confirmModal';
    backdrop.style.cssText = `
        position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:99999;
    `;
    backdrop.innerHTML = `
        <div style="
            background:rgba(8,8,22,0.98); border:2px solid rgba(0,255,157,0.4);
            border-radius:16px; padding:32px 40px; text-align:center;
            box-shadow:0 0 40px rgba(0,255,157,0.2); max-width:360px; width:90%;
        ">
            <div style="font-size:1rem; color:#f1f2f6; margin-bottom:24px; line-height:1.5;">${message}</div>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button id="confirmYes" style="
                    padding:10px 28px; border-radius:8px; border:1px solid rgba(255,71,87,0.5);
                    background:rgba(255,71,87,0.15); color:#ff4757; font-size:0.9rem; font-weight:700;
                    cursor:pointer; transition:all 0.2s; letter-spacing:1px;
                ">ДА</button>
                <button id="confirmNo" style="
                    padding:10px 28px; border-radius:8px; border:1px solid rgba(0,255,157,0.4);
                    background:rgba(0,255,157,0.1); color:#00ff9d; font-size:0.9rem; font-weight:700;
                    cursor:pointer; transition:all 0.2s; letter-spacing:1px;
                ">ОТМЕНА</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    document.getElementById('confirmYes').addEventListener('click', () => { close(); onConfirm(); });
    document.getElementById('confirmNo').addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
}

function loadGame() {
    const savedData = storageLoad(STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.assign(levels, data.levels);
            currentLevel = data.currentLevel || 1;
            score = data.score || 0;
            money = data.money || 100;
            
            if (data.weapons) {
                for (let weapon in data.weapons) {
                    if (weapons[weapon]) {
                        Object.assign(weapons[weapon], data.weapons[weapon]);
                    }
                }
            }
            
            if (data.unlockedWeapons) {
                data.unlockedWeapons.forEach(weaponName => {
                    if (weapons[weaponName]) {
                        weapons[weaponName].unlocked = true;
                        weapons[weaponName].purchased = true;
                    }
                });
            }
            
            if (data.loreProgress && window.LORE_MODULE) {
                data.loreProgress.forEach(partId => {
                    window.LORE_MODULE.unlockPart(partId);
                });
            }
            
            if (data.skinsData && window.skinsModule) {
                Object.keys(data.skinsData).forEach(skinId => {
                    if (window.skinsModule.skins[skinId]) {
                        Object.assign(window.skinsModule.skins[skinId], data.skinsData[skinId]);
                    }
                });
                if (data.currentSkin && window.skinsModule.skins[data.currentSkin]) {
                    window.skinsModule.currentSkin = data.currentSkin;
                    window.skinsModule.applyCurrentSkin();
                }
            }

            if (data.playerUpgrades) {
                Object.assign(playerUpgrades, data.playerUpgrades);
                shieldMax = getShieldMax();
                shield = shieldMax;
            }
            
            updateMenuStats();
            return true;
        } catch (e) {
            console.error('Ошибка загрузки сохранения:', e);
            return false;
        }
    }
    return false;
}

function resetGame() {
    storageRemove(STORAGE_KEY);
    
    levels.forEach(level => {
        level.unlocked = level.id === 1;
        level.completed = false;
        level.loreUnlocked = false;
    });
    
    for (let weapon in weapons) {
        weapons[weapon].unlocked = weapon === 'pistol';
        weapons[weapon].purchased = weapon === 'pistol';
        weapons[weapon].upgrades.damage = 1;
        weapons[weapon].upgrades.speed = 1;
        weapons[weapon].upgrades.clip = 1;
        
        // Reset to base (rebalanced) values
        const baseStats = {
            pistol:    { damage:15, fireRate:380, clipSize:12, ammo:12 },
            rifle:     { damage:45, fireRate:900, clipSize:8,  ammo:8,  cost:200, pierceCount:0 },
            auto:      { damage:12, fireRate:90,  clipSize:30, ammo:30, cost:500, slowChance:0 },
            sniper:    { damage:150,fireRate:1800,clipSize:5,  ammo:5,  cost:1000, headshotChance:0 },
            machinegun:{ damage:18, fireRate:55,  clipSize:80, ammo:80, cost:2000, armorShred:0 },
            shotgun:   { damage:25, fireRate:750, clipSize:8,  ammo:8,  cost:800, pellets:5 },
            laser:     { damage:12, fireRate:80,  clipSize:120,ammo:120,cost:1200,heat:0,overheated:false,_heatPerShot:3.5 },
            plasma:    { damage:50, fireRate:700, clipSize:10, ammo:10, cost:1500, aoeRadius:80 },
        };
        const bs = baseStats[weapon];
        if (bs) Object.assign(weapons[weapon], bs);
        // Reset fire mode
        if (weapons[weapon].fireModes) {
            weapons[weapon].fireMode = weapons[weapon].fireModes[0];
        }
        // Reset unique upgrade state
        weapons[weapon].upgrades.accuracy = 0;
        weapons[weapon].upgrades.pierce = 0;
        weapons[weapon].upgrades.suppression = 0;
        weapons[weapon].upgrades.headshot = 0;
        weapons[weapon].upgrades.shred = 0;
        weapons[weapon].upgrades.pellets = 0;
        weapons[weapon].upgrades.efficiency = 0;
        weapons[weapon].upgrades.radius = 0;
    }
    
    currentLevel = 1;
    enemiesKilledThisLevel = 0;
    enemiesToComplete = levels[0].enemiesToComplete;
    finalBossSpawned = false;

    score = 0;
    gameLevel = 1;
    health = 100;
    money = 100;
    gameRunning = true;
    gamePaused = false;
    
    devMode = {
        infiniteMoney: false,
        infiniteHealth: false,
        infiniteAmmo: false,
        maxDamage: false,
        unlockedAll: false
    };
    
    document.querySelectorAll('.dev-cheat').forEach(btn => {
        btn.classList.remove('active');
    });
    
    player.weapon = 'pistol';
    
    bullets = [];
    enemies = [];
    effects = [];
    pickups = [];
    enemyBullets = [];
    levelUpText = null;
    loreNotificationActive = false;
    skinNotificationActive = false;
    
    if (window.LORE_MODULE) {
        window.LORE_MODULE.resetLoreProgress();
    }

    if (window.skinsModule) {
        window.skinsModule.resetSkins();
    }

    // Полная очистка всех ключей сохранения
    const keysToRemove = [
        STORAGE_KEY,
        'neon_strike_lore',
        'neon_strike_skins',
        'neon_infinite_best',
        'neon_strike_audio',
        'neon_strike_graphics',
        'neon_strike_controls',
        'neon_strike_game',
        'neon_strike_all_settings',
        STATS_KEY,
        ACHIEVEMENTS_KEY,
        TOP_SCORES_KEY
    ];
    keysToRemove.forEach(k => storageRemove(k));

    globalStats = { totalKills:0, totalShots:0, totalHits:0, totalMoney:0, bestScore:0, levelsCompleted:0, bossesKilled:0, gamesPlayed:0, weaponKills:{} };
    unlockedAchievements = new Set();
    topScores = [];

    shotsTotal = 0;
    shotsHit = 0;
    damageFlash = 0;
    combo = 0; comboTimer = 0; maxCombo = 0;
    activePerks = [];
    bossKillSlowmo = 1.0;
    killStreakNoHit = 0;
    killCounterFlash = 0;
    streakBuff = { active: false, timer: 0, duration: 5000 };
    playerUpgrades = { shield: 0, speed: 0, shieldRegen: 0 };
    player.speed = 4;
    shield = 0;
    shieldMax = 0;
    shieldRegenTimer = 0;
    dailyMode = false;

    updateWeaponButtons();
    updateWeaponShop();
    generateLevelButtons();
    updateUI();
    updateMenuStats();
    updateContinueButton();

    devMenu.classList.remove('active');

    bullets = [];
    enemies = [];
    effects = [];
    enemyCount = 0;
    spawnEnabled = true;

    updateUI();
    enterMenuState();
}

function cycleFireMode() {
    const w = weapons[player.weapon];
    if (!w || !w.fireModes || w.fireModes.length <= 1) return;
    const modes = w.fireModes;
    const idx = modes.indexOf(w.fireMode || modes[0]);
    w.fireMode = modes[(idx + 1) % modes.length];
    // legacy compat
    autoFireMode = w.fireMode === 'auto';
    updateFireModeUI();
}

function initFireMode() {
    if (fireModeToggle) {
        fireModeToggle.addEventListener('click', function() {
            cycleFireMode();
        });
    }
}

function updateFireModeUI() {
    const w = weapons[player.weapon];
    const mode = w ? (w.fireMode || 'auto') : 'auto';
    const modeLabel = mode === 'single' ? 'Одиночный' : mode === 'burst' ? 'Очередь' : 'Автоматический';
    const modeIcon = mode === 'single' ? 'fas fa-dot-circle' : mode === 'burst' ? 'fas fa-ellipsis-h' : 'fas fa-stream';

    const btn = document.getElementById('arsenalFireModeBtn');
    const label = document.getElementById('arsenalFireModeLabel');
    if (btn) btn.classList.toggle('auto-active', mode === 'auto');
    if (label) label.textContent = modeLabel;
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.className = modeIcon;
    }

    if (fireModeStatus) fireModeStatus.textContent = modeLabel;
    autoFireMode = (mode === 'auto');
}

function initSpawnControls() {
    if (spawnSlider) {
        spawnSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (spawnValue) spawnValue.textContent = value + '%';
            spawnMultiplier = value / 50;
            
            if (value === 0) {
                spawnEnabled = false;
                if (spawnStatus) {
                    spawnStatus.innerHTML = '<i class="fas fa-pause-circle"></i> Спавн отключен';
                    spawnStatus.className = "spawn-status spawn-paused";
                }
                if (toggleSpawnBtn) {
                    toggleSpawnBtn.innerHTML = '<i class="fas fa-play"></i> Включить спавн';
                }
            } else if (!spawnEnabled) {
                spawnEnabled = true;
                if (spawnStatus) {
                    spawnStatus.innerHTML = '<i class="fas fa-play-circle"></i> Спавн активен';
                    spawnStatus.className = "spawn-status spawn-active";
                }
                if (toggleSpawnBtn) {
                    toggleSpawnBtn.innerHTML = '<i class="fas fa-pause"></i> Пауза спавна';
                }
            }
            
            updateSpawnRateDisplay();
        });
    }

    if (toggleSpawnBtn) {
        toggleSpawnBtn.addEventListener('click', function() {
            spawnEnabled = !spawnEnabled;
            
            if (spawnEnabled) {
                if (spawnStatus) {
                    spawnStatus.innerHTML = '<i class="fas fa-play-circle"></i> Спавн активен';
                    spawnStatus.className = "spawn-status spawn-active";
                }
                this.innerHTML = '<i class="fas fa-pause"></i> Пауза спавна';
            } else {
                if (spawnStatus) {
                    spawnStatus.innerHTML = '<i class="fas fa-pause-circle"></i> Спавн приостановлен';
                    spawnStatus.className = "spawn-status spawn-paused";
                }
                this.innerHTML = '<i class="fas fa-play"></i> Включить спавн';
            }
        });
    }

    if (clearEnemiesBtn) {
        clearEnemiesBtn.addEventListener('click', function() {
            enemies = [];
            enemyCount = 0;
            if (enemyCountElement) enemyCountElement.textContent = enemyCount;
        });
    }
}

function updateSpawnRateDisplay() {
    if (!spawnRateDisplay) return;
    
    const baseRate = spawnRate + gameLevel * 0.005;
    const actualRate = baseRate * spawnMultiplier;
    const percentage = (actualRate * 100).toFixed(1);
    spawnRateDisplay.innerHTML = `<i class="fas fa-percentage"></i> Текущая вероятность: ${percentage}%`;
}

function initMouseEvents() {
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', (e) => {
        if (!gameRunning || gamePaused || reloading) return;
        mouseDown = true;
        singleShotFired = false;
        const w = weapons[player.weapon];
        const mode = w ? (w.fireMode || 'auto') : 'auto';
        if (mode === 'single' || mode === 'burst') {
            if (!singleShotFired) {
                singleShotFired = true;
                fireWeapon();
            }
        } else {
            showAutoFireIndicator(e);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        mouseDown = false;
        singleShotFired = false;
        hideAutoFireIndicator();
    });

    canvas.addEventListener('mouseleave', (e) => {
        mouseDown = false;
        hideAutoFireIndicator();
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;

        if (autoFireMode && mouseDown) {
            updateAutoFireIndicator(e);
        }
    });
}

function showAutoFireIndicator(e) {
    if (!autoFireIndicator) return;
    
    const rect = canvas.getBoundingClientRect();
    autoFireIndicator.style.left = (e.clientX - rect.left - 20) + 'px';
    autoFireIndicator.style.top = (e.clientY - rect.top - 20) + 'px';
    autoFireIndicator.style.display = 'block';
}

function updateAutoFireIndicator(e) {
    if (!autoFireIndicator) return;
    
    const rect = canvas.getBoundingClientRect();
    autoFireIndicator.style.left = (e.clientX - rect.left - 20) + 'px';
    autoFireIndicator.style.top = (e.clientY - rect.top - 20) + 'px';
}

function hideAutoFireIndicator() {
    if (!autoFireIndicator) return;
    
    autoFireIndicator.style.display = 'none';
}

function fireWeapon() {
    const currentTime = Date.now();
    const weapon = weapons[player.weapon];
    const skinFireRate = window.skinsModule ? window.skinsModule.getSkinFireRateMultiplier() : 1.0;
    const skinDamage = window.skinsModule ? window.skinsModule.getSkinDamageMultiplier() : 1.0;

    if (currentTime - lastShotTime >= weapon.fireRate * skinFireRate) {
        if (weapon.ammo > 0 || devMode.infiniteAmmo) {
            const bx = player.x + player.width / 2;
            const by = player.y + player.height * 0.28;
            const baseDmg = devMode.maxDamage ? 999 : weapon.damage * weapon.upgrades.damage * skinDamage * (gameModule ? gameModule.settings.weaponDamageMultiplier : 1.0) * (streakBuff.active ? 1.5 : 1.0);

            // === ЛАЗЕР ===
            if (weapon.isLaser) {
                if (weapon.overheated) return;
                weapon.heat = Math.min(weapon.maxHeat, weapon.heat + (weapon._heatPerShot || 3.5));
                if (weapon.heat >= weapon.maxHeat) weapon.overheated = true;
                const dx = Math.cos(player.angle), dy = Math.sin(player.angle);
                // Raycast конец луча (до границы canvas)
                let endX = bx + dx * canvas.width * 2;
                let endY = by + dy * canvas.width * 2;
                // Clamp to canvas bounds
                const ts = [];
                if (dx !== 0) { ts.push((0 - bx) / dx, (canvas.width - bx) / dx); }
                if (dy !== 0) { ts.push((0 - by) / dy, (canvas.height - by) / dy); }
                const tHit = Math.min(...ts.filter(t => t > 0));
                if (isFinite(tHit)) { endX = bx + dx * tHit; endY = by + dy * tHit; }
                laserBeam = { x1: bx, y1: by, x2: endX, y2: endY, color: weapon.bulletColor };
                // Урон всем врагам на луче
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const en = enemies[j];
                    // AABB-ray intersection
                    const txMin = (en.x - bx) / (dx || 0.0001);
                    const txMax = (en.x + en.width - bx) / (dx || 0.0001);
                    const tyMin = (en.y - by) / (dy || 0.0001);
                    const tyMax = (en.y + en.height - by) / (dy || 0.0001);
                    const tEnter = Math.max(Math.min(txMin, txMax), Math.min(tyMin, tyMax));
                    const tLeave = Math.min(Math.max(txMin, txMax), Math.max(tyMin, tyMax));
                    if (tLeave >= tEnter && tLeave >= 0) {
                        if (en.armor > 0) {
                            en.armor--;
                            createHitEffect(en.x + en.width / 2, en.y + en.height / 2, '#90caf9');
                            continue;
                        }
                        en.health -= baseDmg;
                        createHitEffect(en.x + en.width / 2, en.y + en.height / 2, weapon.bulletColor);
                        shotsHit++;
                        globalStats.totalHits++;
                        if (en.health <= 0) {
                            createDeathEffect(en);
                            trySpawnPickup(en);
                            score += en.value;
                            money += en.value;
                            enemiesKilledThisLevel++;
                            globalStats.totalKills++;
                            globalStats.totalMoney += en.value;
                            const wkL = player.weapon;
                            globalStats.weaponKills[wkL] = (globalStats.weaponKills[wkL] || 0) + 1;
                            if (en.type === 'boss' || en.type === 'finalBoss') globalStats.bossesKilled++;
                            combo++; comboTimer = COMBO_TIMEOUT;
                            if (combo > maxCombo) maxCombo = combo;
                            score += en.value * (Math.max(1, combo) - 1);
                            killStreakNoHit++;
                            if (killStreakNoHit >= 3 && !streakBuff.active) { streakBuff.active = true; streakBuff.timer = streakBuff.duration; }
                            killCounterFlash = 1.0;
                            if (activePerks.includes('vampirism')) { health = Math.min(devMode.infiniteHealth ? 9999 : 100, health + 3); }
                            if (en.type === 'exploder') {
                                const ex2 = en.x + en.width / 2, ey2 = en.y + en.height / 2;
                                effects.push({ x: ex2, y: ey2, radius: 4, color: '#ff6d00', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: 90 });
                            }
                            enemies.splice(j, 1);
                            enemyCount--;
                            checkAchievements();
                            if (enemiesKilledThisLevel >= enemiesToComplete) { completeLevel(); return; }
                        }
                    }
                }
                if (!devMode.infiniteAmmo) weapon.ammo--;
                lastShotTime = currentTime;
                shotsTotal++; globalStats.totalShots++;
                updateUI();
                return;
            }
            // === конец лазера ===

            const pellets = weapon.pellets || 1;
            const spread = weapon.spread || 0;
            for (let p = 0; p < pellets; p++) {
                const angleOffset = pellets > 1 ? (p / (pellets - 1) - 0.5) * spread : 0;
                const angle = player.angle + angleOffset;
                // Headshot check (sniper unique upgrade)
                let finalDmg = baseDmg;
                if (weapon.headshotChance && Math.random() < weapon.headshotChance) {
                    finalDmg *= 2;
                    effects.push({ x: bx + Math.cos(player.angle)*50, y: by + Math.sin(player.angle)*50, radius: 6, color: '#ff1744', life: 1, maxLife: 1, kind: 'hit' });
                }

                bullets.push({
                    x: bx + Math.cos(angle) * 30 - weapon.bulletSize / 2,
                    y: by + Math.sin(angle) * 30 - weapon.bulletSize / 2,
                    width: weapon.bulletSize,
                    height: weapon.bulletSize,
                    color: weapon.bulletColor,
                    speed: weapon.bulletSpeed,
                    vx: Math.cos(angle) * weapon.bulletSpeed,
                    vy: Math.sin(angle) * weapon.bulletSpeed,
                    damage: finalDmg,
                    isPlasma: !!weapon.isPlasma,
                    aoeRadius: weapon.aoeRadius || 0,
                    pierceCount: weapon.pierceCount || 0,
                    pierced: 0,
                    trail: []
                });
            }

            if (!devMode.infiniteAmmo) {
                weapon.ammo--;
            }
            lastShotTime = currentTime;
            shotsTotal++;
            globalStats.totalShots++;

            // Recoil
            const rc = weapon.recoil || 0;
            if (rc > 0) {
                recoilX = -Math.cos(player.angle) * rc;
                recoilY = -Math.sin(player.angle) * rc;
            }

            // Burst mode: queue remaining shots
            if (weapon.fireMode === 'burst' && burstRemaining === 0) {
                burstRemaining = 2; // 2 more shots (first already fired)
                burstTimer = 80;
            }

            // Вспышка дульного огня
            const muzzleR = player.weapon === 'shotgun' ? 14 : player.weapon === 'machinegun' ? 10 : player.weapon === 'sniper' ? 16 : 8;
            effects.push({
                x: bx + Math.cos(player.angle) * 36,
                y: by + Math.sin(player.angle) * 36,
                vx: 0, vy: 0, radius: muzzleR,
                color: weapon.bulletColor,
                life: 1.0, maxLife: 1.0, kind: 'muzzle'
            });
            playerAuraFlash = Math.min(1, playerAuraFlash + 0.6);

            if (shotSound && audioModule && audioModule.settings.effectsEnabled) {
                shotSound.currentTime = 0;
                shotSound.volume = 0.6 + Math.random() * 0.25;
                shotSound.playbackRate = 0.92 + Math.random() * 0.18;
                shotSound.play().catch(() => {});
            }

            updateUI();
        } else {
            startReload();
        }
    }
}

function initKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
        // A/D movement (separate from other actions to avoid conflicts)
        if (e.code === 'KeyA' || e.code === 'KeyD') {
            keysDown[e.code] = true;
            if (gameRunning && !gamePaused) e.preventDefault();
        }

        // Konami code check for dev menu
        if (e.code === DEV_CODE[devCodeProgress]) {
            devCodeProgress++;
            if (devCodeProgress === DEV_CODE.length) {
                devCodeProgress = 0;
                showDevMenu();
            }
        } else {
            devCodeProgress = e.code === DEV_CODE[0] ? 1 : 0;
        }

        let action = null;
        if (controlsModule) {
            const keyCheck = controlsModule.checkKey(e.code, e.ctrlKey);
            if (keyCheck) {
                action = keyCheck.action;
            }
        }

        if (action === 'fire' || e.code === 'Space') {
            spacePressed = true;
            e.preventDefault();
        } else if (action === 'autoFire' || e.key === 'f' || e.key === 'F') {
            cycleFireMode();
        } else if (action === 'menu' || e.key === 'h' || e.key === 'H') {
            showConfirmModal('Вернуться в меню?<br>Прогресс уровня будет потерян.', () => {
                enterMenuState();
            });
        } else if (action === 'weapon1' || e.key === '1') {
            if (weapons.pistol.purchased) {
                const pistolBtn = document.querySelector('.weapon-btn[data-weapon="pistol"]');
                if (pistolBtn) pistolBtn.click();
            }
        } else if (action === 'weapon2' || e.key === '2') {
            if (weapons.rifle.purchased) {
                const rifleBtn = document.querySelector('.weapon-btn[data-weapon="rifle"]');
                if (rifleBtn) rifleBtn.click();
            }
        } else if (action === 'weapon3' || e.key === '3') {
            if (weapons.auto.purchased) {
                const autoBtn = document.querySelector('.weapon-btn[data-weapon="auto"]');
                if (autoBtn) autoBtn.click();
            }
        } else if (action === 'weapon4' || e.key === '4') {
            if (weapons.sniper.purchased) {
                const sniperBtn = document.querySelector('.weapon-btn[data-weapon="sniper"]');
                if (sniperBtn) sniperBtn.click();
            }
        } else if (action === 'weapon5' || e.key === '5') {
            if (weapons.machinegun.purchased) {
                const machinegunBtn = document.querySelector('.weapon-btn[data-weapon="machinegun"]');
                if (machinegunBtn) machinegunBtn.click();
            }
        } else if (action === 'pause' || e.key === 'Escape') {
            if (gameRunning) {
                if (gamePaused) resumeGame(); else pauseGame();
            }
        } else if (action === 'graphicsMenu' || ((e.key === 'g' || e.key === 'G') && e.ctrlKey)) {
            e.preventDefault();
            if (graphicsModule) {
                graphicsModule.showMenu();
            }
        } else if (action === 'audioMenu' || ((e.key === 'm' || e.key === 'M') && e.ctrlKey)) {
            e.preventDefault();
            if (audioModule) {
                audioModule.showMenu();
            }
        } else if (action === 'aboutMenu') {
            showAboutMenu();
        } else if (action === 'loreMenu' || e.key === 'l' || e.key === 'L') {
            if (window.LORE_MODULE) {
                e.preventDefault();
                window.LORE_MODULE.toggleLoreMenu();
            }
        } else if (action === 'skinsMenu' || e.key === 'k' || e.key === 'K') {
            if (window.skinsModule) {
                e.preventDefault();
                window.skinsModule.showSkinsMenu();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyA' || e.code === 'KeyD') {
            keysDown[e.code] = false;
        }

        let action = null;
        if (controlsModule) {
            const keyCheck = controlsModule.checkKey(e.code, e.ctrlKey);
            if (keyCheck) {
                action = keyCheck.action;
            }
        }

        if (action === 'fire' || e.code === 'Space') {
            spacePressed = false;
            singleShotFired = false;
        }
    });
}

function updateWeaponButtons() {
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        const weaponType = btn.dataset.weapon;
        const weapon = weapons[weaponType];
        
        if (!weapon) return;
        
        if (weapon.purchased) {
            btn.classList.remove('locked');
            btn.style.opacity = '1';
            btn.title = weapon.name;
            btn.innerHTML = `<i class="fas fa-gun weapon-icon"></i><span>${weapon.name}</span>`;
        } else if (money >= weapon.cost || devMode.infiniteMoney) {
            btn.classList.remove('locked');
            btn.style.opacity = '0.8';
            btn.title = `Купить: ${weapon.cost}$`;
            btn.innerHTML = `<i class="fas fa-gun weapon-icon"></i><span>${weapon.name} (${weapon.cost}$)</span>`;
        } else {
            btn.classList.add('locked');
            btn.style.opacity = '0.6';
            btn.title = `Цена: ${weapon.cost}$`;
            btn.innerHTML = `<i class="fas fa-lock weapon-icon"></i><span>${weapon.name} (${weapon.cost}$)</span>`;
        }
        
        if (weaponType === player.weapon) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

const UPGRADE_MAX = 5;

function updateWeaponShop() {
    // Update money display in arsenal header
    const moneyEl = document.getElementById('arsenalMoneyDisplay');
    if (moneyEl) moneyEl.textContent = money;

    // Update sidebar weapon list
    document.querySelectorAll('.weapon-shop-item').forEach(item => {
        const wType = item.dataset.weapon;
        const w = weapons[wType];
        if (!w) return;

        const actionEl = item.querySelector('.wsi-action');
        item.classList.remove('wsi-active', 'wsi-locked');

        if (w.purchased) {
            if (wType === player.weapon) {
                item.classList.add('wsi-active');
                actionEl.innerHTML = `<span class="wsi-badge wsi-equipped">Выбрано</span>`;
            } else {
                actionEl.innerHTML = `<button class="wsi-buy-btn wsi-select-btn" data-weapon="${wType}" style="border-color:rgba(0,255,157,0.4);color:#00ff9d;background:rgba(0,255,157,0.08);">Выбрать</button>`;
            }
        } else {
            item.classList.add('wsi-locked');
            const canAfford = money >= w.cost || devMode.infiniteMoney;
            actionEl.innerHTML = `<button class="wsi-buy-btn" data-weapon="${wType}" data-cost="${w.cost}" ${canAfford ? '' : 'disabled'}>${w.cost}$</button>`;
        }

        // Click: buy or select
        item.onclick = null;
        item.style.cursor = 'pointer';
        item.onclick = () => {
            const ww = weapons[wType];
            if (!ww) return;
            if (!ww.purchased) {
                if (money >= ww.cost || devMode.infiniteMoney) {
                    if (!devMode.infiniteMoney) money = Math.max(0, money - ww.cost);
                    ww.purchased = true;
                    ww.unlocked = true;
                }
            }
            if (ww.purchased) {
                player.weapon = wType;
                ww.ammo = ww.clipSize;
                updateUI();
                updateMenuStats();
                updateWeaponButtons();
                updateWeaponShop();
            }
        };
    });

    // Render right-panel weapon detail
    renderArsenalWeaponDetail(player.weapon);

    // Upgrades section
    renderWeaponUpgrades();
}

function renderArsenalWeaponDetail(wType) {
    const detailEl = document.getElementById('arsenalWeaponDetail');
    if (!detailEl) return;
    const w = weapons[wType];
    if (!w) return;

    const wIcons = { pistol:'fas fa-gun', rifle:'fas fa-crosshairs', auto:'fas fa-stream',
        sniper:'fas fa-bullseye', machinegun:'fas fa-fire', shotgun:'fas fa-expand-arrows-alt',
        laser:'fas fa-bolt', plasma:'fas fa-circle-dot' };
    const wColors = { pistol:'#00e5ff', rifle:'#4caf50', auto:'#ff5722', sniper:'#9c27b0',
        machinegun:'#795548', shotgun:'#ff9800', laser:'#e040fb', plasma:'#00e5ff' };
    const color = wColors[wType] || '#00e5ff';

    const dps = w.isLaser
        ? `${w.damage}/тик`
        : w.pellets > 1
            ? `${Math.round(w.damage * w.pellets * (1000 / w.fireRate))}/с`
            : `${Math.round(w.damage * (1000 / w.fireRate))}/с`;

    const fireRateLabel = w.fireRate < 80 ? 'Очень высокая' : w.fireRate < 200 ? 'Высокая' : w.fireRate < 600 ? 'Средняя' : w.fireRate < 1200 ? 'Низкая' : 'Очень низкая';
    const special = w.isLaser ? 'Лазерный луч' : w.isPlasma ? `AoE взрыв r${w.aoeRadius}` : w.pellets > 1 ? `${w.pellets} дробин/выстрел` : '—';
    const currentMode = w.fireMode || 'auto';
    const modeLabel = currentMode === 'single' ? 'Одиночный' : currentMode === 'burst' ? 'Очередь (3)' : 'Автоматический';

    // Stat bars (0..1 scale)
    const dmgPct = Math.min(100, (w.damage / 150) * 100);
    const frPct = Math.max(5, 100 - (w.fireRate / 2500) * 100);
    const clipPct = Math.min(100, (w.clipSize / 100) * 100);
    const speedPct = Math.min(100, (w.bulletSpeed / 20) * 100);

    const isEquipped = wType === player.weapon;
    const canAfford = money >= w.cost || devMode.infiniteMoney;

    const actionBtn = w.purchased
        ? `<button class="awd-equip-btn ${isEquipped ? 'equipped' : ''}" id="awdEquipBtn" data-weapon="${wType}">
               ${isEquipped ? '<i class="fas fa-check"></i> Экипировано' : '<i class="fas fa-gun"></i> Экипировать'}
           </button>`
        : `<button class="awd-buy-btn" id="awdBuyBtn" data-weapon="${wType}" ${canAfford ? '' : 'disabled'}>
               <i class="fas fa-coins"></i> Купить за ${w.cost}$
           </button>`;

    detailEl.innerHTML = `
        <div class="awd-header">
            <div class="awd-icon-large" style="border-color:${color}40;background:${color}15;color:${color}">
                <i class="${wIcons[wType] || 'fas fa-gun'}"></i>
            </div>
            <div class="awd-meta">
                <div class="awd-name">${w.name}</div>
                <div class="awd-tags">
                    <span class="awd-tag">${special}</span>
                    <span class="awd-tag tag-mode"><i class="fas fa-dot-circle"></i> ${modeLabel}</span>
                </div>
            </div>
        </div>
        <div class="awd-stats-grid">
            <div class="awd-stat-card">
                <div class="awd-stat-label">Урон</div>
                <div class="awd-stat-value">${w.damage}${w.pellets > 1 ? `×${w.pellets}` : ''}</div>
                <div class="awd-stat-bar"><div class="awd-stat-bar-fill" style="width:${dmgPct}%;background:${color}"></div></div>
            </div>
            <div class="awd-stat-card">
                <div class="awd-stat-label">Скорострельность</div>
                <div class="awd-stat-value">${fireRateLabel}</div>
                <div class="awd-stat-bar"><div class="awd-stat-bar-fill" style="width:${frPct}%;background:${color}"></div></div>
            </div>
            <div class="awd-stat-card">
                <div class="awd-stat-label">Обойма</div>
                <div class="awd-stat-value">${w.clipSize} патр.</div>
                <div class="awd-stat-bar"><div class="awd-stat-bar-fill" style="width:${clipPct}%;background:${color}"></div></div>
            </div>
            <div class="awd-stat-card">
                <div class="awd-stat-label">DPS</div>
                <div class="awd-stat-value">${dps}</div>
                <div class="awd-stat-bar"><div class="awd-stat-bar-fill" style="width:${speedPct}%;background:${color}"></div></div>
            </div>
        </div>
        <div class="awd-action-row">${actionBtn}</div>
    `;

    const equipBtn = detailEl.querySelector('#awdEquipBtn');
    if (equipBtn) {
        equipBtn.onclick = () => {
            const ww = weapons[equipBtn.dataset.weapon];
            if (ww && ww.purchased) {
                player.weapon = equipBtn.dataset.weapon;
                ww.ammo = ww.clipSize;
                updateUI(); updateMenuStats(); updateWeaponButtons(); updateWeaponShop();
            }
        };
    }
    const buyBtn = detailEl.querySelector('#awdBuyBtn');
    if (buyBtn) {
        buyBtn.onclick = () => {
            const wType2 = buyBtn.dataset.weapon;
            const ww = weapons[wType2];
            if (!ww || ww.purchased) return;
            if (money >= ww.cost || devMode.infiniteMoney) {
                if (!devMode.infiniteMoney) money = Math.max(0, money - ww.cost);
                ww.purchased = true;
                ww.unlocked = true;
                player.weapon = wType2;
                ww.ammo = ww.clipSize;
                updateUI(); updateMenuStats(); updateWeaponButtons(); updateWeaponShop();
            }
        };
    }
}

function renderWeaponUpgrades() {
    const upgradesEl = document.getElementById('weaponUpgrades');
    if (!upgradesEl) return;
    const w = weapons[player.weapon];
    if (!w || !w.purchased) { upgradesEl.innerHTML = ''; return; }

    // Get weapon-specific unique upgrades plus base upgrades
    const baseDefs = [
        { key: 'damage', label: 'Урон',     baseCost: 50,  icon: 'fas fa-bolt',        apply: (ww) => {} },
        { key: 'speed',  label: 'Скорость', baseCost: 75,  icon: 'fas fa-wind',         apply: (ww) => { ww.fireRate = Math.max(50, ww.fireRate - 50); } },
        { key: 'clip',   label: 'Обойма',   baseCost: 100, icon: 'fas fa-layer-group',  apply: (ww) => { ww.clipSize += 5; ww.ammo = ww.clipSize; } },
    ];

    const uniqueDefs = (w.uniqueUpgrades || []);
    const allDefs = [...baseDefs, ...uniqueDefs];

    const rows = allDefs.map(def => {
        const lvl = w.upgrades[def.key] || 0;
        const max = def.max || UPGRADE_MAX;
        const maxed = lvl >= max;
        const cost = (def.baseCost || 100) * Math.max(1, lvl);
        const canAfford = (money >= cost || devMode.infiniteMoney) && !maxed;
        const color = def.color || 'var(--accent)';
        return `<div class="wupg-row">
            <i class="${def.icon} wupg-icon" style="color:${color}"></i>
            <span class="wupg-label">${def.label}</span>
            <div class="wupg-pips">${Array.from({length: max}, (_, i) => `<span class="wupg-pip${i < lvl ? ' filled' : ''}" style="${i < lvl ? `background:${color};border-color:${color};box-shadow:0 0 4px ${color}40` : ''}"></span>`).join('')}</div>
            <button class="wupg-btn" data-upgrade="${def.key}" data-cost="${cost}" ${canAfford ? '' : 'disabled'}
                style="${canAfford && !maxed ? `border-color:${color}50;color:${color}` : ''}">
                ${maxed ? 'МАКС' : cost + '$'}
            </button>
        </div>`;
    }).join('');

    upgradesEl.innerHTML = `<div class="wupg-header"><i class="fas fa-arrow-up"></i> Улучшения: ${w.name}</div>${rows}`;

    upgradesEl.querySelectorAll('.wupg-btn').forEach(btn => {
        btn.onclick = () => {
            const upgradeType = btn.dataset.upgrade;
            const cost = parseInt(btn.dataset.cost);
            const def = allDefs.find(d => d.key === upgradeType);
            if (!def) return;
            const max = def.max || UPGRADE_MAX;
            if ((w.upgrades[upgradeType] || 0) >= max) return;
            if (money < cost && !devMode.infiniteMoney) return;
            if (!devMode.infiniteMoney) money = Math.max(0, money - cost);
            w.upgrades[upgradeType] = (w.upgrades[upgradeType] || 0) + 1;
            if (def.apply) def.apply(w);
            updateUI();
            updateMenuStats();
            createLevelUpEffect();
            triggerUpgradeFlash();
            updateWeaponShop();
        };
    });
}

function initShopTabs() {
    const tabWeapons = document.getElementById('shopTabWeapons');
    const tabPlayer = document.getElementById('shopTabPlayer');
    const panelWeapons = document.getElementById('shopPanelWeapons');
    const panelPlayer = document.getElementById('shopPanelPlayer');
    const sidebar = document.getElementById('arsenalWeaponList');
    if (!tabWeapons || !tabPlayer) return;
    tabWeapons.onclick = () => {
        tabWeapons.classList.add('active'); tabPlayer.classList.remove('active');
        panelWeapons.style.display = ''; panelPlayer.style.display = 'none';
        if (sidebar) sidebar.style.display = '';
    };
    tabPlayer.onclick = () => {
        tabPlayer.classList.add('active'); tabWeapons.classList.remove('active');
        panelWeapons.style.display = 'none'; panelPlayer.style.display = '';
        if (sidebar) sidebar.style.display = 'none';
        updatePlayerUpgradesPanel();
    };
}

function updatePlayerUpgradesPanel() {
    const el = document.getElementById('playerUpgradesPanel');
    if (!el) return;
    const PLAYER_UPGRADES = [
        { key: 'shield',     label: 'Макс. щит',        icon: 'fas fa-shield-alt', max: 5, cost: lvl => 150 * (lvl + 1), color: 'blue', desc: lvl => lvl > 0 ? `+${lvl * 25} HP щита` : 'Защита от урона' },
        { key: 'speed',      label: 'Скорость движения', icon: 'fas fa-running',    max: 4, cost: lvl => 120 * (lvl + 1), color: '',     desc: lvl => lvl > 0 ? `+${lvl * 0.5} скорость` : 'Быстрее уворачиваться' },
        { key: 'shieldRegen',label: 'Рег. щита',        icon: 'fas fa-sync',       max: 3, cost: lvl => 200 * (lvl + 1), color: 'blue', desc: lvl => lvl > 0 ? `-${lvl * 20}% задержка` : 'Быстрее восст. щит' },
    ];
    let html = `<div class="pup-section-title"><i class="fas fa-user-shield"></i> Апгрейды персонажа</div>`;
    PLAYER_UPGRADES.forEach(def => {
        const lvl = playerUpgrades[def.key] || 0;
        const maxed = lvl >= def.max;
        const cost = def.cost(lvl);
        const canAfford = (money >= cost || devMode.infiniteMoney) && !maxed;
        const pips = Array.from({length: def.max}, (_, i) =>
            `<span class="pup-pip${i < lvl ? (def.color === 'blue' ? ' filled-blue' : ' filled') : ''}"></span>`).join('');
        html += `<div class="pup-row">
            <i class="${def.icon} pup-icon"></i>
            <div style="flex:1">
                <div class="pup-label">${def.label}</div>
                <div style="font-size:11px;color:rgba(150,170,200,0.55)">${def.desc(lvl)}</div>
            </div>
            <div class="pup-pips">${pips}</div>
            <button class="pup-btn ${def.color}" data-pupkey="${def.key}" data-pupcost="${cost}" ${canAfford ? '' : 'disabled'}>
                ${maxed ? 'МАКС' : cost + '$'}
            </button>
        </div>`;
    });
    el.innerHTML = html;
    el.querySelectorAll('.pup-btn:not(:disabled)').forEach(btn => {
        btn.onclick = () => {
            const key = btn.dataset.pupkey;
            const cost = parseInt(btn.dataset.pupcost);
            if (money < cost && !devMode.infiniteMoney) return;
            if (!devMode.infiniteMoney) money = Math.max(0, money - cost);
            playerUpgrades[key] = (playerUpgrades[key] || 0) + 1;
            if (key === 'shield') { shieldMax = getShieldMax(); shield = Math.min(shield + 25, shieldMax); }
            if (key === 'speed') player.speed = 4 + (playerUpgrades.speed || 0) * 0.5;
            updateUI(); updateMenuStats(); createLevelUpEffect(); triggerUpgradeFlash();
            updatePlayerUpgradesPanel();
        };
    });
}

function initWeaponButtons() {
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const weaponType = btn.dataset.weapon;
            const weapon = weapons[weaponType];
            
            if (!weapon) return;
            
            if (!weapon.purchased && weapon.cost > 0) {
                if (money >= weapon.cost || devMode.infiniteMoney) {
                    if (!devMode.infiniteMoney) money = Math.max(0, money - weapon.cost);
                    weapon.purchased = true;
                    weapon.unlocked = true;
                    updateWeaponButtons();
                    updateUI();
                    updateMenuStats();
                } else {
                    return;
                }
            }

            document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            player.weapon = weaponType;
            weapon.ammo = weapon.clipSize;
            updateUI();
            updateCurrentWeaponLabel();
            closeSidePanels();
            document.querySelectorAll('.game-modal-backdrop').forEach(p => p.classList.remove('open'));
        });
    });
}

function initUpgradeButtons() {
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const upgradeType = btn.dataset.upgrade;
            const weapon = weapons[player.weapon];
            let cost = 0;
            
            switch (upgradeType) {
                case 'damage':
                    cost = 50 * weapon.upgrades.damage;
                    break;
                case 'speed':
                    cost = 75 * weapon.upgrades.speed;
                    break;
                case 'clip':
                    cost = 100 * weapon.upgrades.clip;
                    break;
            }
            
            if (money >= cost || devMode.infiniteMoney) {
                switch (upgradeType) {
                    case 'damage':
                        weapon.upgrades.damage++;
                        break;
                    case 'speed':
                        weapon.upgrades.speed++;
                        weapon.fireRate = Math.max(50, weapon.fireRate - 50);
                        break;
                    case 'clip':
                        weapon.upgrades.clip++;
                        weapon.clipSize += 5;
                        weapon.ammo = weapon.clipSize;
                        break;
                }
                
                if (!devMode.infiniteMoney) {
                    money = Math.max(0, money - cost);
                }
                
                updateUI();
                createLevelUpEffect();
                updateMenuStats();
            }
        });
    });
    
    const buySkinBtn = document.getElementById('buySkinBtn');
    if (buySkinBtn) {
        buySkinBtn.addEventListener('click', () => {
            if (window.skinsModule) {
                window.skinsModule.showSkinsMenu();
            }
        });
    }
}

function startReload() {
    reloading = true;
    reloadStartTime = Date.now();
    const weapon = weapons[player.weapon];
    
    if (reloadSound && audioModule && audioModule.settings.effectsEnabled) {
        reloadSound.currentTime = 0;
        reloadSound.play().catch(() => {});
    }
    
    setTimeout(() => {
        weapon.ammo = weapon.clipSize;
        reloading = false;
        updateUI();
    }, weapon.reloadTime);
}

function createEnemy() {
    if (!gameRunning || gamePaused || !spawnEnabled) return;

    const size = 28 + Math.random() * 14;
    const x = Math.random() * (canvas.width - size);
    const y = -size;

    let enemyType = 'normal';
    let enemyColor = '#e53935';

    const hpMod = (gameModule && gameModule.settings) ? gameModule.settings.enemyHealthMultiplier : 1;
    const spMod = (gameModule && gameModule.settings) ? gameModule.settings.enemySpeedMultiplier : 1;
    const iMult = infiniteMode ? infiniteEnemyMult(infiniteWave) : { health: 1, speed: 1 };
    const lvl = infiniteMode ? infiniteWave : currentLevel;

    const wt = infiniteMode && infiniteAnnouncement ? infiniteAnnouncement.waveType : null;
    const tankThreshold  = wt === 'tank' ? 0.45 : 0.70;
    const fastThreshold  = wt === 'fast' ? 0.35 : 0.80;

    let baseHP, baseSpeed;

    if (lvl >= 5 && Math.random() > tankThreshold) {
        enemyType = 'tank';
        enemyColor = '#5d4037';
        baseHP    = (120 + lvl * 12) * iMult.health * hpMod;
        baseSpeed = (0.225 + Math.random() * 0.175) * iMult.speed * spMod;
    } else if (lvl >= 3 && Math.random() > fastThreshold) {
        enemyType = 'fast';
        enemyColor = '#7b1fa2';
        baseHP    = (20 + lvl * 2) * iMult.health * hpMod;
        baseSpeed = (0.8 + Math.random() * 0.5 + Math.min(lvl, 10) * 0.03) * iMult.speed * spMod;
    } else if (lvl >= 7 && Math.random() > 0.90) {
        enemyType = 'boss';
        enemyColor = '#b71c1c';
        baseHP    = (350 + lvl * 25) * iMult.health * hpMod;
        baseSpeed = (0.15 + Math.random() * 0.2) * iMult.speed * spMod;
    } else if (lvl >= 4 && Math.random() > 0.85) {
        enemyType = 'sniper';
        enemyColor = '#f9a825';
        baseHP    = (55 + lvl * 5) * iMult.health * hpMod;
        baseSpeed = (0.1 + Math.random() * 0.125) * iMult.speed * spMod;
    } else if (lvl >= 6 && Math.random() > 0.87) {
        enemyType = 'exploder';
        enemyColor = '#e65100';
        baseHP    = (70 + lvl * 6) * iMult.health * hpMod;
        baseSpeed = (0.35 + Math.random() * 0.35) * iMult.speed * spMod;
    } else {
        baseHP    = (30 + lvl * 4) * iMult.health * hpMod;
        baseSpeed = (0.35 + Math.random() * 0.3) * iMult.speed * spMod;
    }

    baseHP = Math.round(baseHP);

    enemies.push({
        x,
        y,
        width: size,
        height: size,
        color: enemyColor,
        speed: baseSpeed,
        health: baseHP,
        maxHealth: baseHP,
        type: enemyType,
        opacity: 0,
        armor: enemyType === 'tank' ? 2 : 0,
        shootTimer: enemyType === 'sniper' ? 0 : undefined,
        value: enemyType === 'boss' ? 120 : enemyType === 'tank' ? 40 : enemyType === 'fast' ? 25 : enemyType === 'sniper' ? 50 : enemyType === 'exploder' ? 45 : 15,
        // walk animation
        walkFrame: 0,
        walkTimer: 0,
        shootAnim: 0
    });

    enemyCount++;
    if (enemyCountElement) enemyCountElement.textContent = enemyCount;
}

function spawnFinalBoss() {
    finalBossSpawned = true;
    spawnEnabled = false;
    const size = 64;
    const x = canvas.width / 2 - size / 2;
    enemies.push({
        x, y: -size,
        width: size, height: size,
        color: '#ff1744',
        speed: 0.2,
        health: 1500,
        maxHealth: 1500,
        type: 'finalBoss',
        opacity: 0,
        value: 500,
        walkFrame: 0, walkTimer: 0, shootAnim: 0
    });
    enemyCount++;
    infiniteAnnouncement = { text: '⚠ ФИНАЛЬНЫЙ БОСС', sub: 'Уничтожьте его!', life: 1.0 };
}

function createHitEffect(x, y, color) {
    if (gameModule && !gameModule.settings.hitEffects) return;

    effects.push({
        x,
        y,
        radius: 5,
        color,
        life: 1.0,
        maxLife: 1.0,
        kind: 'hit'
    });

    if (hitSound && audioModule && audioModule.settings.effectsEnabled) {
        hitSound.currentTime = 0;
        hitSound.volume = 0.55 + Math.random() * 0.3;
        hitSound.playbackRate = 0.88 + Math.random() * 0.28;
        hitSound.play().catch(() => {});
    }
}

function createDeathEffect(enemy) {
    if (enemyDeathSound && audioModule && audioModule.settings.effectsEnabled) {
        enemyDeathSound.currentTime = 0;
        enemyDeathSound.volume = enemy.type === 'finalBoss' ? 1.0 : enemy.type === 'boss' ? 0.8 : 0.4 + Math.random() * 0.2;
        enemyDeathSound.playbackRate = enemy.type === 'finalBoss' ? 0.75 : 0.9 + Math.random() * 0.25;
        enemyDeathSound.play().catch(() => {});
    }
    if (!gameModule || gameModule.settings.particleEffects === false) return;
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const isBig = enemy.type === 'finalBoss';
    const isBoss = enemy.type === 'boss';
    const count = isBig ? 32 : isBoss ? 20 : enemy.type === 'tank' ? 14 : 10;

    // Основные частицы смерти
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = (2 + Math.random() * 5) * (isBig ? 2.5 : isBoss ? 1.6 : 1);
        effects.push({
            x: cx + (Math.random() - 0.5) * 10,
            y: cy + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            radius: 2 + Math.random() * (isBig ? 7 : isBoss ? 5 : 3),
            color: enemy.color,
            life: 0.8 + Math.random() * 0.4,
            maxLife: 1.0,
            kind: 'death'
        });
    }
    // Белые искры
    const sparks = isBig ? 20 : isBoss ? 12 : 6;
    for (let i = 0; i < sparks; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        effects.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            radius: 1 + Math.random() * 2,
            color: '#ffffff',
            life: 0.4 + Math.random() * 0.4,
            maxLife: 0.8,
            kind: 'spark'
        });
    }
    // Кольца взрыва
    const ringColors = [enemy.color, '#ffffff', '#ffcc00'];
    const ringCount = isBig ? 4 : isBoss ? 3 : 1;
    for (let r = 0; r < ringCount; r++) {
        setTimeout(() => {
            effects.push({ x: cx, y: cy, radius: 4, color: ringColors[r % ringColors.length], life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: (enemy.width * 0.7 + r * 35) * (isBig ? 2.2 : isBoss ? 1.5 : 1.1) });
        }, r * 100);
    }
    // Тряска экрана
    triggerShake(isBig ? 18 : isBoss ? 10 : enemy.type === 'tank' ? 5 : 2, isBig ? 600 : isBoss ? 400 : 150);

    // Специальная анимация для боссов
    if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
        // Текст "УНИЧТОЖЕН"
        levelUpText = {
            text: enemy.type === 'finalBoss' ? '⚠ ФИНАЛ-БОСС УНИЧТОЖЕН!' : '💀 БОСС УНИЧТОЖЕН',
            life: 1.0,
            color: enemy.color,
            fontSize: enemy.type === 'finalBoss' ? 48 : 36
        };
        // Мини-заморозка: временно замедляем deltaTime через флаг
        bossKillSlowmo = 0.4;
        setTimeout(() => { bossKillSlowmo = 1.0; }, 500);
    }
}

function showEndingCutscene() {
    gameRunning = false;
    gamePaused = true;
    const overlay = document.getElementById('endingOverlay');
    const textEl  = document.getElementById('endingText');
    const closeBtn = document.getElementById('endingCloseBtn');
    if (!overlay || !textEl) return;

    textEl.innerHTML = `
        Система «Архив» была разрушена.<br><br>
        Данные освобождены. Сеть противника отключена навсегда.<br><br>
        Твой танк последним покидает дымящийся комплекс.<br>
        Позади — руины. Впереди — тишина.<br><br>
        <span style="color:#ffd32d;font-weight:700">Neon Strike завершён.</span><br>
        <span style="font-size:14px;color:rgba(200,220,200,0.5)">Но бесконечный режим всегда ждёт тебя.</span>
    `;

    overlay.classList.add('active');

    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.classList.remove('active');
            enterMenuState();
        };
    }
}

function triggerUpgradeFlash() {
    document.body.classList.remove('upgrade-flash');
    void document.body.offsetWidth;
    document.body.classList.add('upgrade-flash');
    setTimeout(() => document.body.classList.remove('upgrade-flash'), 450);
}

function createLevelUpEffect() {
    levelUpText = {
        text: "УЛУЧШЕНИЕ!",
        life: 1.0
    };
}

// ─── ПИКАПЫ ───────────────────────────────────────────────────
const PICKUP_TYPES = {
    health: { icon: '❤',  color: '#f44336', label: '+20 HP'         },
    ammo:   { icon: '⚡',  color: '#ffeb3b', label: 'Патроны'        },
    coin:   { icon: '💰',  color: '#ffd32d', label: '+50$'           },
    shield: { icon: '🛡',  color: '#00e5ff', label: '+30 Щит'        },
    nuke:   { icon: '☢',  color: '#ff6d00', label: '⚡ НЮКLEAR УДАР' },
    speed:  { icon: '💨',  color: '#69f0ae', label: '⚡ Ускорение'    },
};

function trySpawnPickup(enemy) {
    const dropChance = (enemy.type === 'boss' || enemy.type === 'finalBoss' || enemy.type === 'megaboss') ? 0.40
                     : enemy.type === 'tank' ? 0.22
                     : 0.12;
    if (Math.random() > dropChance) return;
    // Боссы дропают аптечку чаще
    const types = (enemy.type === 'boss' || enemy.type === 'finalBoss' || enemy.type === 'megaboss')
        ? ['health', 'health', 'ammo', 'coin', 'shield', 'nuke']
        : ['health', 'ammo', 'coin', 'shield', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    pickups.push({
        x: enemy.x + enemy.width / 2 - 14,
        y: enemy.y + enemy.height / 2 - 14,
        size: 28,
        type,
        life: 8000,
        blinkTimer: 0,
        collected: false,
    });
}

function updatePickups(deltaTime) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.life -= deltaTime;
        p.blinkTimer += deltaTime;
        if (p.life <= 0) { pickups.splice(i, 1); continue; }

        const cx = p.x + p.size / 2;
        const cy = p.y + p.size / 2;
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < p.size) {
            applyPickup(p.type);
            pickups.splice(i, 1);
        }
    }
}

function applyPickup(type) {
    if (type === 'health') {
        health = Math.min(devMode.infiniteHealth ? 9999 : 100, health + 20);
    } else if (type === 'ammo') {
        const w = weapons[player.weapon];
        w.ammo = w.clipSize;
        reloading = false;
    } else if (type === 'coin') {
        money += 50;
    } else if (type === 'shield') {
        if (shieldMax > 0) { shield = Math.min(shieldMax, shield + 30); }
        else { health = Math.min(100, health + 15); }
    } else if (type === 'speed') {
        player._speedBoost = true;
        player._speedTimer = 5000;
    } else if (type === 'nuke') {
        nukeFlash = 1.0;
        triggerShake(22, 700);
        const killed = [...enemies];
        enemies = [];
        killed.forEach(e => {
            createDeathEffect(e);
            const reward = e.reward || 15;
            money += Math.round(reward * (activePerks.includes('double_money') ? 2 : 1));
            enemiesKilled++;
            combo++;
            globalStats.totalKills++;
        });
        updateUI();
    }
    updateUI();
    showPickupNotification(PICKUP_TYPES[type].label);
}

function showPickupNotification(label) {
    effects.push({ kind: 'pickup_text', text: label, x: player.x + player.width / 2, y: player.y - 10, life: 1.0 });
}

function drawPickups() {
    for (const p of pickups) {
        const blink = p.life < 2000 ? Math.sin(p.blinkTimer / 80) > 0 : true;
        if (!blink) continue;
        const def = PICKUP_TYPES[p.type];
        const cx = p.x + p.size / 2, cy = p.y + p.size / 2;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 500);
        if (graphicsModule && graphicsModule.settings.shadows) {
            ctx.shadowColor = def.color; ctx.shadowBlur = 12;
        }
        ctx.fillStyle = def.color + '30';
        ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(def.icon, cx, cy);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ──────────────────────────────────────────────────────────────

function updateUI() {
    if (devMode.infiniteMoney) money = 999999;
    if (devMode.infiniteHealth) health = 9999;
    
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const healthElement = document.getElementById('health');
    const moneyElement = document.getElementById('money');
    const loreProgressElement = document.getElementById('loreProgress');
    const skinStatusElement = document.getElementById('skinStatus');
    
    if (scoreElement) scoreElement.textContent = score;
    if (levelElement) levelElement.textContent = gameLevel;
    if (healthElement) healthElement.textContent = health;
    if (moneyElement) moneyElement.textContent = money;
    
    if (loreProgressElement) {
        if (window.LORE_MODULE) {
            const unlocked = window.LORE_MODULE.getUnlockedCount();
            loreProgressElement.textContent = `${unlocked}/12`;
        } else {
            loreProgressElement.textContent = '1/12';
        }
    }
    
    if (skinStatusElement) {
        if (window.skinsModule) {
            const currentSkin = window.skinsModule.getCurrentSkin();
            skinStatusElement.textContent = currentSkin ? currentSkin.name : 'Неоновый';
        } else {
            skinStatusElement.textContent = 'Неоновый';
        }
    }
    
    const weapon = weapons[player.weapon];
    
    const damageCost = document.getElementById('damageCost');
    const speedCost = document.getElementById('speedCost');
    const clipCost = document.getElementById('clipCost');
    
    if (damageCost) damageCost.textContent = `${50 * weapon.upgrades.damage}$`;
    if (speedCost) speedCost.textContent = `${75 * weapon.upgrades.speed}$`;
    if (clipCost) clipCost.textContent = `${100 * weapon.upgrades.clip}$`;
        
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const upgradeType = btn.dataset.upgrade;
        let cost = 0;
        
        switch (upgradeType) {
            case 'damage':
                cost = 50 * weapon.upgrades.damage;
                break;
            case 'speed':
                cost = 75 * weapon.upgrades.speed;
                break;
            case 'clip':
                cost = 100 * weapon.upgrades.clip;
                break;
        }
        
        btn.disabled = !devMode.infiniteMoney && money < cost;
        const costSpan = btn.querySelector('span:last-child');
        if (costSpan) costSpan.textContent = cost + '$';
    });
    
    updateWeaponButtons();
}

function updateGame(deltaTime) {
    if (!gameRunning || gamePaused) return;
    laserBeam = null;

    // A/D movement
    const moveSpeed = player.speed * (player._speedBoost ? 1.7 : 1);
    if (keysDown['KeyA']) {
        player.x -= moveSpeed;
        if (player.x < 0) player.x = 0;
    }
    if (keysDown['KeyD']) {
        player.x += moveSpeed;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    }

    // Update turret angle toward mouse
    const tx = player.x + player.width / 2;
    const ty = player.y + player.height * 0.28;
    player.angle = Math.atan2(mouseY - ty, mouseX - tx);

    // Recoil decay
    recoilX *= 0.75;
    recoilY *= 0.75;
    if (Math.abs(recoilX) < 0.1) recoilX = 0;
    if (Math.abs(recoilY) < 0.1) recoilY = 0;

    // Burst fire tick
    if (burstRemaining > 0) {
        burstTimer -= deltaTime;
        if (burstTimer <= 0) {
            fireWeapon();
            burstRemaining--;
            burstTimer = 80;
        }
    }

    const curWeapon = weapons[player.weapon];
    const curMode = curWeapon ? (curWeapon.fireMode || 'auto') : 'auto';
    if (curMode === 'auto' && (mouseDown || spacePressed)) {
        fireWeapon();
    } else if (spacePressed && curMode === 'single' && !singleShotFired) {
        singleShotFired = true;
        fireWeapon();
    } else if (spacePressed && curMode === 'burst' && !singleShotFired) {
        singleShotFired = true;
        fireWeapon();
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.trail) {
            b.trail.unshift({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
            if (b.trail.length > 4) b.trail.pop();
        }
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        if (b.x + b.width < 0 || b.x > canvas.width || b.y + b.height < 0 || b.y > canvas.height) {
            if (activePerks.includes('ricochet') && !b.bounced) {
                b.bounced = true;
                if (b.x + b.width < 0 || b.x > canvas.width) b.vx = -b.vx;
                else b.vy = -b.vy;
                bullets[i].x += bullets[i].vx;
                bullets[i].y += bullets[i].vy;
                continue;
            }
            if (b.isPlasma && b.aoeRadius) {
                effects.push({ x: b.x + b.width/2, y: b.y + b.height/2, radius: 4, color: '#00e5ff', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: b.aoeRadius * 0.5 });
            }
            bullets.splice(i, 1);
            continue;
        }
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (!bullets[i]) break;
            const bullet = bullets[i];
            const enemy = enemies[j];
            
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Броня танка: поглощает попадание
                if (enemy.armor > 0) {
                    enemy.armor--;
                    effects.push({ x: bullet.x + bullet.width/2, y: bullet.y + bullet.height/2, vx: 0, vy: 0, radius: 8, color: '#90caf9', life: 1.0, maxLife: 1.0, kind: 'hit' });
                    const isPiercing = activePerks.includes('piercing');
                    if (!isPiercing) { bullets.splice(i, 1); break; }
                    continue;
                }

                // Armor shred (machinegun unique)
                const curWpn = weapons[player.weapon];
                if (curWpn && curWpn.armorShred && enemy.armor > 0 && Math.random() < 0.3) {
                    enemy.armor = Math.max(0, enemy.armor - 1);
                }
                // Slow (auto suppression unique)
                if (curWpn && curWpn.slowChance && Math.random() < curWpn.slowChance) {
                    enemy._slowed = true;
                    enemy._slowTimer = 1500;
                    enemy._baseSpeed = enemy._baseSpeed || enemy.speed;
                    enemy.speed = enemy._baseSpeed * 0.4;
                }
                enemy.health -= bullet.damage;
                createHitEffect(bullet.x, bullet.y, bullet.color);
                shotsHit++;
                globalStats.totalHits++;

                // Plasma AoE: урон соседним врагам при каждом попадании
                if (bullet.isPlasma && bullet.aoeRadius) {
                    const aCx = enemy.x + enemy.width / 2, aCy = enemy.y + enemy.height / 2;
                    const aR = bullet.aoeRadius;
                    effects.push({ x: aCx, y: aCy, radius: 4, color: '#00e5ff', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: aR });
                    effects.push({ x: aCx, y: aCy, radius: 4, color: '#b2ebf2', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: aR * 0.45 });
                    for (let ei = enemies.length - 1; ei >= 0; ei--) {
                        if (ei === j) continue;
                        const ae = enemies[ei];
                        if (Math.hypot(ae.x + ae.width/2 - aCx, ae.y + ae.height/2 - aCy) < aR) {
                            if (ae.armor > 0) { ae.armor = Math.max(0, ae.armor - 1); continue; }
                            ae.health -= bullet.damage * 0.6;
                            if (ae.health <= 0) {
                                createDeathEffect(ae);
                                trySpawnPickup(ae);
                                const am = ae.value * (activePerks.includes('double_money') ? 2 : 1);
                                score += ae.value; money += am;
                                enemiesKilledThisLevel++; globalStats.totalKills++; globalStats.totalMoney += am;
                                globalStats.weaponKills[player.weapon] = (globalStats.weaponKills[player.weapon] || 0) + 1;
                                if (ae.type === 'boss' || ae.type === 'finalBoss') globalStats.bossesKilled++;
                                combo++; comboTimer = COMBO_TIMEOUT; if (combo > maxCombo) maxCombo = combo;
                                killStreakNoHit++;
                                if (killStreakNoHit >= 3 && !streakBuff.active) { streakBuff.active = true; streakBuff.timer = streakBuff.duration; }
                                if (activePerks.includes('vampirism')) { health = Math.min(devMode.infiniteHealth ? 9999 : 100, health + 3); }
                                killCounterFlash = 1.0;
                                enemies.splice(ei, 1); enemyCount--;
                                if (ei < j) j--;
                                checkAchievements();
                                if (enemiesKilledThisLevel >= enemiesToComplete) { completeLevel(); return; }
                            }
                        }
                    }
                }

                const isPiercing = activePerks.includes('piercing');
                // Per-weapon pierce count (rifle unique upgrade)
                const bulletPierce = bullet.pierceCount || 0;
                if (!isPiercing && bulletPierce <= (bullet.pierced || 0)) {
                    bullets.splice(i, 1);
                } else if (bulletPierce > (bullet.pierced || 0)) {
                    bullet.pierced = (bullet.pierced || 0) + 1;
                }

                if (enemy.health <= 0) {
                    createDeathEffect(enemy);
                    trySpawnPickup(enemy);
                    const earnedMoney = enemy.value * (activePerks.includes('double_money') ? 2 : 1);
                    score += enemy.value;
                    money += earnedMoney;
                    enemiesKilledThisLevel++;
                    killCounterFlash = 1.0;
                    globalStats.totalKills++;
                    globalStats.totalMoney += earnedMoney;
                    const wk = player.weapon;
                    globalStats.weaponKills[wk] = (globalStats.weaponKills[wk] || 0) + 1;
                    if (enemy.type === 'boss' || enemy.type === 'finalBoss') globalStats.bossesKilled++;
                    combo++;
                    comboTimer = COMBO_TIMEOUT;
                    if (combo > maxCombo) maxCombo = combo;
                    const comboBonus = Math.max(1, combo);
                    score += enemy.value * (comboBonus - 1);
                    killStreakNoHit++;
                    if (killStreakNoHit >= 3 && !streakBuff.active) { streakBuff.active = true; streakBuff.timer = streakBuff.duration; }
                    if (activePerks.includes('vampirism')) { health = Math.min(devMode.infiniteHealth ? 9999 : 100, health + 3); }
                    if (activePerks.includes('aoe_death') && enemy.type !== 'exploder') {
                        const aax = enemy.x + enemy.width / 2, aay = enemy.y + enemy.height / 2;
                        effects.push({ x: aax, y: aay, radius: 4, color: '#ff9800', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: 50 });
                    }

                    if (enemy.type === 'exploder') {
                        const ex = enemy.x + enemy.width / 2;
                        const ey = enemy.y + enemy.height / 2;
                        const blastR = 90;
                        effects.push({ x: ex, y: ey, radius: 4, color: '#ff6d00', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: blastR });
                        effects.push({ x: ex, y: ey, radius: 4, color: '#ffcc02', life: 1.0, maxLife: 1.0, kind: 'explode_ring', targetRadius: blastR * 0.6 });
                        if (!devMode.infiniteHealth) {
                            const px2 = player.x + player.width / 2;
                            const py2 = player.y + player.height / 2;
                            const pd = Math.sqrt((px2 - ex) ** 2 + (py2 - ey) ** 2);
                            if (pd < blastR) {
                                const dmg = 25;
                                shieldRegenTimer = 0; combo = 0; comboTimer = 0;
                                killStreakNoHit = 0; if (streakBuff.active) { streakBuff.active = false; streakBuff.timer = 0; }
                                if (shield > 0) { const ab = Math.min(shield, dmg); shield = Math.max(0, shield - ab); const rem = dmg - ab; if (rem > 0) health -= rem; } else { health -= dmg; }
                                damageFlash = 1.0;
                                document.body.classList.add('damage-flash');
                                setTimeout(() => document.body.classList.remove('damage-flash'), 200);
                            }
                        }
                    }

                    enemies.splice(j, 1);
                    enemyCount--;
                    checkAchievements();

                    if (enemiesKilledThisLevel >= enemiesToComplete) {
                        completeLevel();
                        return;
                    }

                    if (score >= gameLevel * 500) {
                        gameLevel++;
                        health = Math.min(100, health + 20);
                        createLevelUpEffect();
                        updateSpawnRateDisplay();
                    }
                }

                if (!isPiercing) break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;
        if (eb.x < 0 || eb.x > canvas.width || eb.y < 0 || eb.y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        if (!devMode.infiniteHealth &&
            eb.x > player.x && eb.x < player.x + player.width &&
            eb.y > player.y && eb.y < player.y + player.height) {
            enemyBullets.splice(i, 1);
            shieldRegenTimer = 0; combo = 0; comboTimer = 0;
            killStreakNoHit = 0; if (streakBuff.active) { streakBuff.active = false; streakBuff.timer = 0; }
            const dmg = eb.damage;
            if (shield > 0) {
                const absorbed = Math.min(shield, dmg);
                shield = Math.max(0, shield - absorbed);
                const remaining = dmg - absorbed;
                if (remaining > 0) health -= remaining;
            } else {
                health -= dmg;
            }
            damageFlash = 1.0;
            document.body.classList.add('damage-flash');
            setTimeout(() => document.body.classList.remove('damage-flash'), 200);
            if (playerDamageSound && audioModule && audioModule.settings.effectsEnabled) {
                playerDamageSound.currentTime = 0;
                playerDamageSound.play().catch(() => {});
            }
            if (health <= 0 && !devMode.infiniteHealth) { showGameOver(); return; }
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].opacity < 1) enemies[i].opacity = Math.min(1, enemies[i].opacity + deltaTime / 300);
        enemies[i].y += enemies[i].speed;
        // Walk animation
        enemies[i].walkTimer = (enemies[i].walkTimer || 0) + deltaTime;
        if (enemies[i].walkTimer >= 160) {
            enemies[i].walkTimer = 0;
            enemies[i].walkFrame = ((enemies[i].walkFrame || 0) + 1) % 4;
        }
        if (enemies[i].shootAnim > 0) enemies[i].shootAnim = Math.max(0, enemies[i].shootAnim - deltaTime / 200);
        // Slow timer
        if (enemies[i]._slowed) {
            enemies[i]._slowTimer = (enemies[i]._slowTimer || 0) - deltaTime;
            if (enemies[i]._slowTimer <= 0) {
                enemies[i]._slowed = false;
                enemies[i].speed = enemies[i]._baseSpeed || enemies[i].speed;
            }
        }

        if (enemies[i].type === 'sniper' && enemies[i].opacity >= 1) {
            enemies[i].shootTimer = (enemies[i].shootTimer || 0) + deltaTime;
            if (enemies[i].shootTimer >= 3000) {
                enemies[i].shootTimer = 0;
                enemies[i].shootAnim = 1.0;
                const ex = enemies[i].x + enemies[i].width / 2;
                const ey = enemies[i].y + enemies[i].height / 2;
                const px = player.x + player.width / 2;
                const py = player.y + player.height / 2;
                const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2) || 1;
                const spd = 5;
                enemyBullets.push({ x: ex, y: ey, vx: (px - ex) / dist * spd, vy: (py - ey) / dist * spd, damage: 25, color: '#ffeb3b', radius: 5 });
            }
        }

        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            enemyCount--;
            
            if (!devMode.infiniteHealth) {
                const dmg = 10;
                shieldRegenTimer = 0; combo = 0; comboTimer = 0;
                killStreakNoHit = 0; if (streakBuff.active) { streakBuff.active = false; streakBuff.timer = 0; }
                if (shield > 0) {
                    const absorbed = Math.min(shield, dmg);
                    shield = Math.max(0, shield - absorbed);
                    const remaining = dmg - absorbed;
                    if (remaining > 0) health -= remaining;
                } else {
                    health -= dmg;
                }
                damageFlash = 1.0;
                document.body.classList.add('damage-flash');
                setTimeout(() => document.body.classList.remove('damage-flash'), 200);
                if (playerDamageSound && audioModule && audioModule.settings.effectsEnabled) {
                    playerDamageSound.currentTime = 0;
                    playerDamageSound.play().catch(() => {});
                }
            }

            if (health <= 0 && !devMode.infiniteHealth) {
                showGameOver();
                return;
            }
        }
    }
    
    for (let i = effects.length - 1; i >= 0; i--) {
        const ef = effects[i];
        if (ef.kind === 'pickup_text') {
            ef.life -= deltaTime / 800;
            ef.y -= 0.6;
            if (ef.life <= 0) effects.splice(i, 1);
            continue;
        }
        if (ef.kind === 'explode_ring') {
            ef.life -= deltaTime / 450;
            ef.radius = ef.targetRadius * (1 - ef.life);
            if (ef.life <= 0) effects.splice(i, 1);
            continue;
        }
        if (ef.kind === 'muzzle') {
            ef.life -= deltaTime / 80;
            ef.radius += 1.5;
            if (ef.life <= 0) effects.splice(i, 1);
            continue;
        }
        ef.life -= deltaTime / (ef.kind === 'death' ? 600 : 1000);
        if (ef.kind === 'death') {
            ef.x += ef.vx;
            ef.y += ef.vy;
            ef.vy += 0.12; // гравитация
        } else {
            ef.radius += 0.5;
        }
        if (ef.life <= 0) effects.splice(i, 1);
    }
    
    if (levelUpText) {
        levelUpText.life -= deltaTime / 1000;
        if (levelUpText.life <= 0) {
            levelUpText = null;
        }
    }
    
    // Финальный босс на уровне 10
    if (!infiniteMode && currentLevel === 10 && !finalBossSpawned
        && enemiesKilledThisLevel >= enemiesToComplete - 1 && enemies.length === 0) {
        spawnFinalBoss();
    }

    const maxOnScreen = infiniteMode
        ? Math.min(30, 6 + Math.floor(infiniteWave * 1.5))
        : Math.min(20, 4 + currentLevel * 2);
    if (spawnEnabled && !infiniteWaveTransition && Math.random() < (spawnRate + gameLevel * 0.0025) * spawnMultiplier) {
        if (enemyCount < maxOnScreen) {
            createEnemy();
        }
    }

    if (damageFlash > 0) {
        damageFlash = Math.max(0, damageFlash - deltaTime / 350);
    }
    if (killCounterFlash > 0) {
        killCounterFlash = Math.max(0, killCounterFlash - deltaTime / 400);
    }

    if (shieldMax > 0 && shield < shieldMax) {
        shieldRegenTimer += deltaTime;
        if (shieldRegenTimer >= getShieldRegenDelay()) {
            shield = Math.min(shieldMax, shield + 5 * deltaTime / 1000);
        }
    }

    if (combo > 0 && comboTimer > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) { combo = 0; comboTimer = 0; }
    }

    if (streakBuff.active) {
        streakBuff.timer -= deltaTime;
        if (streakBuff.timer <= 0) { streakBuff.active = false; streakBuff.timer = 0; }
    }

    // Лазер: охлаждение когда не стреляем
    const lw = weapons['laser'];
    if (lw && lw.isLaser) {
        if (!laserBeam) {
            const coolRate = lw.overheated ? 35 : 18;
            lw.heat = Math.max(0, lw.heat - coolRate * deltaTime / 1000);
            if (lw.overheated && lw.heat <= 0) lw.overheated = false;
        }
    }

    updatePickups(deltaTime);
}

function drawSoldier(enemy) {
    const cx = enemy.x + enemy.width / 2;
    const s = enemy.width; // scale unit
    const isFinalBoss = enemy.type === 'finalBoss';
    const isBoss = enemy.type === 'boss';
    const isTank = enemy.type === 'tank';
    const isFast = enemy.type === 'fast';
    const isSniper = enemy.type === 'sniper';
    const isExploder = enemy.type === 'exploder';
    const shadows = graphicsModule && graphicsModule.settings.shadows;

    ctx.save();
    ctx.globalAlpha = enemy.opacity ?? 1;

    const frame = enemy.walkFrame || 0;
    const legSwing = [0.25, 0.5, 0.25, 0][frame] * s * 0.3;
    const bodyBob = [0, 0.04, 0, 0.04][frame] * s;

    const bodyColor = enemy.color;
    const skinColor = isFinalBoss ? '#ff8a65' : isBoss ? '#ef9a9a' : isTank ? '#bcaaa4' : isSniper ? '#fff59d' : isExploder ? '#ffcc80' : isFast ? '#ce93d8' : '#ffe0b2';
    const helmetColor = isFinalBoss ? '#b71c1c' : isBoss ? '#d32f2f' : isTank ? '#4e342e' : isSniper ? '#f57f17' : isExploder ? '#bf360c' : isFast ? '#4a148c' : '#c62828';
    const uniformColor = isFinalBoss ? '#7f0000' : isBoss ? '#c62828' : isTank ? '#3e2723' : isSniper ? '#827717' : isExploder ? '#bf360c' : isFast ? '#6a1b9a' : '#b71c1c';

    const top = enemy.y + bodyBob;
    const scale = isFinalBoss ? 1.6 : isBoss ? 1.3 : isTank ? 1.2 : 1.0;
    const u = s * scale;

    if (shadows) { ctx.shadowColor = bodyColor; ctx.shadowBlur = isFinalBoss ? 20 : isBoss ? 14 : 8; }

    // LEGS (animated)
    ctx.fillStyle = uniformColor;
    const legW = u * 0.18, legH = u * 0.30;
    const legY = top + u * 0.58;
    // left leg
    ctx.save();
    ctx.translate(cx - u * 0.12, legY);
    ctx.rotate(legSwing * 0.5);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.restore();
    // right leg
    ctx.save();
    ctx.translate(cx + u * 0.12, legY);
    ctx.rotate(-legSwing * 0.5);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.restore();
    // boots
    ctx.fillStyle = '#212121';
    const bootW = u * 0.22;
    ctx.fillRect(cx - u * 0.20, legY + legH - u * 0.04, bootW, u * 0.08);
    ctx.fillRect(cx + u * 0.02, legY + legH - u * 0.04, bootW, u * 0.08);

    // BODY / torso
    ctx.fillStyle = uniformColor;
    const bW = u * 0.46, bH = u * 0.34;
    const bX = cx - bW / 2, bY = top + u * 0.26;
    ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 3); ctx.fill();

    // VEST / armor accents
    if (isTank || isBoss || isFinalBoss) {
        ctx.fillStyle = isFinalBoss ? '#4a0000' : '#2d1a0e';
        ctx.fillRect(bX + 2, bY + 2, bW - 4, u * 0.08);
        ctx.fillRect(bX + 2, bY + u * 0.14, bW - 4, u * 0.08);
        ctx.fillRect(bX + 2, bY + u * 0.26, bW - 4, u * 0.06);
    }

    // ARMS (with weapon if shooting)
    ctx.fillStyle = uniformColor;
    const armW = u * 0.14, armH = u * 0.26;
    const armY = bY + u * 0.04;
    const shootOffset = (enemy.shootAnim || 0) * u * 0.08;
    // left arm
    ctx.save();
    ctx.translate(bX - u * 0.04, armY);
    ctx.rotate(legSwing * 0.3);
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.restore();
    // right arm (holds weapon — forward when shooting)
    ctx.save();
    ctx.translate(bX + bW + u * 0.04 - armW / 2, armY + shootOffset);
    ctx.rotate(-legSwing * 0.3);
    ctx.fillRect(0, 0, armW, armH);
    ctx.restore();

    // WEAPON in hands
    if (isSniper) {
        // long rifle
        ctx.fillStyle = '#455a64';
        ctx.fillRect(cx + u * 0.28, bY + u * 0.16 + shootOffset, u * 0.42, u * 0.07);
        ctx.fillStyle = '#263238';
        ctx.fillRect(cx + u * 0.20, bY + u * 0.14 + shootOffset, u * 0.10, u * 0.11);
    } else if (isTank) {
        // wide gun
        ctx.fillStyle = '#546e7a';
        ctx.fillRect(cx + u * 0.22, bY + u * 0.14, u * 0.28, u * 0.09);
    } else if (isFinalBoss || isBoss) {
        // dual weapons
        ctx.fillStyle = '#c62828';
        ctx.fillRect(cx + u * 0.24, bY + u * 0.12, u * 0.32, u * 0.08);
        ctx.fillRect(cx - u * 0.56, bY + u * 0.12, u * 0.32, u * 0.08);
    } else if (!isExploder) {
        // pistol / smg
        ctx.fillStyle = '#37474f';
        ctx.fillRect(cx + u * 0.24, bY + u * 0.16 + shootOffset, u * 0.22, u * 0.07);
    }

    // Exploder: bomb on chest
    if (isExploder) {
        ctx.fillStyle = '#ff6d00';
        if (shadows) { ctx.shadowColor = '#ff6d00'; ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.arc(cx, bY + bH * 0.5, u * 0.11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc80';
        ctx.font = `bold ${Math.round(u * 0.14)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, bY + bH * 0.5 + u * 0.05);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
    }

    // HEAD
    ctx.fillStyle = skinColor;
    const hR = u * 0.17;
    const headY = top + u * 0.10 + hR;
    if (shadows) { ctx.shadowColor = bodyColor; ctx.shadowBlur = isFinalBoss ? 16 : 6; }
    ctx.beginPath(); ctx.arc(cx, headY, hR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // HELMET
    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(cx, headY, hR, Math.PI, 0, false);
    ctx.lineTo(cx + hR * 1.1, headY + hR * 0.3);
    ctx.lineTo(cx - hR * 1.1, headY + hR * 0.3);
    ctx.closePath();
    ctx.fill();
    if (isFinalBoss || isBoss) {
        // skull on helmet
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `bold ${Math.round(hR * 0.9)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('☠', cx, headY - hR * 0.1);
        ctx.textAlign = 'left';
    }

    // EYES
    const eyeY = headY + hR * 0.05;
    ctx.fillStyle = isExploder ? '#ff3d00' : isSniper ? '#fff176' : isFinalBoss ? '#ff1744' : 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(cx - hR * 0.35, eyeY, hR * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + hR * 0.35, eyeY, hR * 0.14, 0, Math.PI * 2); ctx.fill();

    // HP bar
    if ((!gameModule || gameModule.settings.showHealthBars) && enemy.maxHealth > 1) {
        const barW = isFinalBoss ? u * 1.8 : u * 1.1;
        const barH = isFinalBoss ? 7 : 4;
        const barX2 = cx - barW / 2;
        const barY2 = enemy.y - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX2, barY2, barW, barH);
        const hp = enemy.health / enemy.maxHealth;
        ctx.fillStyle = hp > 0.5 ? '#4caf50' : hp > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillRect(barX2, barY2, barW * hp, barH);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX2, barY2, barW, barH);
    }

    // Armor dots (tank)
    if (enemy.armor > 0) {
        ctx.fillStyle = '#90caf9';
        if (shadows) { ctx.shadowColor = '#90caf9'; ctx.shadowBlur = 5; }
        for (let ai = 0; ai < enemy.armor; ai++) {
            ctx.beginPath(); ctx.arc(cx - (enemy.armor - 1) * 5 + ai * 10, enemy.y - 16, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // Type label (boss/finalBoss only)
    if (enemy.type === 'finalBoss') {
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        if (shadows) { ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 8; }
        ctx.fillText('⚠ ФИНАЛЬНЫЙ БОСС', cx, enemy.y - 18);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    } else if (enemy.type === 'boss') {
        ctx.font = 'bold 9px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f44336';
        ctx.fillText('КОМАНДИР', cx, enemy.y - 16);
        ctx.textAlign = 'left';
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawGame() {
    // ── Screen shake transform ──
    ctx.save();
    if (screenShake.timer > 0) {
        ctx.translate(screenShake.x, screenShake.y);
    }

    // ── Background gradient ──
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#020410');
    gradient.addColorStop(0.5, '#070918');
    gradient.addColorStop(1, '#0a0520');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── Starfield ──
    if (!graphicsModule || graphicsModule.settings.particles) {
        const t = performance.now() / 1000;
        stars.forEach(s => {
            const layer = STAR_LAYERS[s.layer];
            s.twinkle += layer.speed * 0.05;
            const tw = 0.6 + Math.sin(s.twinkle * s.twinkleSpeed) * 0.4;
            const sx = (s.x * canvas.width + t * layer.speed * 30) % canvas.width;
            const sy = s.y * canvas.height;
            ctx.globalAlpha = layer.alpha * tw;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, layer.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Grid
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.04)';
        ctx.lineWidth = 1;
        const gridT = (performance.now() / 4000) % 1;
        const gridOff = gridT * 50;
        for (let x = -gridOff; x < canvas.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }
    
    // === WEAPON SPRITE ===
    (function drawWeaponSprite() {
        const px = player.x, py = player.y, pw = player.width, ph = player.height;
        const cx = Math.round(px + pw / 2);
        const w = player.weapon;
        const skinData = window.skinsModule ? window.skinsModule.getCurrentSkin() : null;
        const gc = (skinData && skinData.color) || player.color || '#00ff9d';
        const bulletGc = (skinData && skinData.bulletColor) || gc;
        const shadows = graphicsModule && graphicsModule.settings && graphicsModule.settings.shadows;

        ctx.save();

        // PLAYER AURA (speed boost + shot flash)
        const auraCx = Math.round(px + pw / 2);
        const auraCy = Math.round(py + ph / 2);
        if (player._speedBoost) {
            const t2 = performance.now() / 200;
            const auraR = 40 + Math.sin(t2) * 6;
            const auraG = ctx.createRadialGradient(auraCx, auraCy, 8, auraCx, auraCy, auraR);
            auraG.addColorStop(0, 'rgba(105,240,174,0)');
            auraG.addColorStop(0.6, 'rgba(105,240,174,0.18)');
            auraG.addColorStop(1, 'rgba(105,240,174,0)');
            ctx.fillStyle = auraG;
            ctx.beginPath(); ctx.arc(auraCx, auraCy, auraR, 0, Math.PI * 2); ctx.fill();
        }
        if (playerAuraFlash > 0) {
            const skinData2 = window.skinsModule ? window.skinsModule.getCurrentSkin() : null;
            const aGc = (skinData2 && skinData2.bulletColor) || '#00ff9d';
            const aR = 30 + playerAuraFlash * 20;
            const aG2 = ctx.createRadialGradient(auraCx, auraCy, 5, auraCx, auraCy, aR);
            aG2.addColorStop(0, `rgba(255,255,255,${playerAuraFlash * 0.3})`);
            aG2.addColorStop(1, `${aGc}00`);
            ctx.fillStyle = aG2;
            ctx.beginPath(); ctx.arc(auraCx, auraCy, aR, 0, Math.PI * 2); ctx.fill();
        }

        // TRACKS
        ctx.fillStyle = '#151e2b';
        ctx.strokeStyle = 'rgba(0,255,157,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(px - 4, py + ph * 0.52, 14, ph * 0.48, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(px + pw - 10, py + ph * 0.52, 14, ph * 0.48, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(0,255,157,0.45)';
        [0.58, 0.72, 0.86].forEach(t => {
            ctx.beginPath(); ctx.arc(px + 3, py + ph * t, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(px + pw - 3, py + ph * t, 1.5, 0, Math.PI * 2); ctx.fill();
        });

        // BODY
        if (shadows) { ctx.shadowColor = gc; ctx.shadowBlur = 14; }
        ctx.fillStyle = '#0d1b2a';
        ctx.strokeStyle = gc;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px + 2, py + ph * 0.24, pw - 4, ph * 0.66, 7); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = gc + '30';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(px + 7, py + ph * 0.34, pw - 14, ph * 0.22, 3); ctx.stroke();

        // TURRET BASE
        ctx.fillStyle = '#0a1520';
        ctx.strokeStyle = gc;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, py + ph * 0.28, pw * 0.27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = gc;
        ctx.beginPath(); ctx.arc(cx, py + ph * 0.28, 3, 0, Math.PI * 2); ctx.fill();

        // BARREL - rotated toward mouse
        const turretX = cx;
        const turretY = py + ph * 0.28;
        ctx.save();
        ctx.translate(turretX, turretY);
        ctx.rotate(player.angle + Math.PI / 2); // +PI/2: barrel points "up" in local space = toward mouse
        if (shadows) { ctx.shadowColor = gc; ctx.shadowBlur = 12; }

        if (w === 'pistol') {
            // compact barrel
            ctx.fillStyle = '#78909c';
            ctx.beginPath(); ctx.roundRect(-4, -32, 8, 24, 2); ctx.fill();
            ctx.fillStyle = bulletGc;
            ctx.fillRect(-5, -36, 10, 6);
        } else if (w === 'rifle') {
            // medium barrel + stock
            ctx.fillStyle = '#546e7a';
            ctx.beginPath(); ctx.roundRect(-3, -44, 7, 36, 2); ctx.fill();
            ctx.fillStyle = '#37474f';
            ctx.beginPath(); ctx.roundRect(-10, -8, 8, 18, 2); ctx.fill(); // stock (side)
            ctx.fillStyle = bulletGc;
            ctx.fillRect(-4, -48, 8, 6);
        } else if (w === 'auto') {
            // wide barrel + mag
            ctx.fillStyle = '#37474f';
            ctx.beginPath(); ctx.roundRect(-5, -50, 10, 42, 2); ctx.fill();
            ctx.fillStyle = '#263238';
            ctx.beginPath(); ctx.roundRect(5, -18, 7, 16, 2); ctx.fill(); // mag
            ctx.fillStyle = bulletGc;
            ctx.fillRect(-6, -54, 12, 6);
        } else if (w === 'sniper') {
            // long thin barrel + scope
            ctx.fillStyle = '#263238';
            ctx.beginPath(); ctx.roundRect(-2.5, -62, 5, 56, 2); ctx.fill();
            ctx.fillStyle = '#1c2a35';
            ctx.beginPath(); ctx.roundRect(-9, -14, 7, 22, 2); ctx.fill(); // stock
            ctx.fillStyle = '#37474f';
            ctx.beginPath(); ctx.roundRect(-10, -42, 20, 8, 3); ctx.fill(); // scope body
            ctx.fillStyle = bulletGc;
            ctx.beginPath(); ctx.arc(0, -38, 4, 0, Math.PI * 2); ctx.fill(); // scope lens
            ctx.fillRect(-2.5, -66, 5, 6);
        } else if (w === 'machinegun') {
            // double barrel + fins
            ctx.fillStyle = '#37474f';
            ctx.beginPath(); ctx.roundRect(-9, -52, 7, 46, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(2, -52, 7, 46, 2); ctx.fill();
            ctx.fillStyle = '#263238';
            for (let fi = 0; fi < 4; fi++) {
                ctx.fillRect(-13, -48 + fi * 10, 4, 7);
                ctx.fillRect(9,  -48 + fi * 10, 4, 7);
            }
            ctx.fillStyle = bulletGc;
            ctx.fillRect(-10, -56, 9, 6);
            ctx.fillRect(1,  -56, 9, 6);
        } else if (w === 'shotgun') {
            // широкий короткий ствол
            ctx.fillStyle = '#455a64';
            ctx.beginPath(); ctx.roundRect(-7, -28, 14, 22, 2); ctx.fill();
            ctx.fillStyle = '#37474f';
            ctx.beginPath(); ctx.roundRect(-9, -20, 5, 14, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(4, -20, 5, 14, 2); ctx.fill();
            ctx.fillStyle = bulletGc;
            ctx.fillRect(-8, -32, 16, 6);
        } else if (w === 'laser') {
            // тонкий кристаллический ствол
            const lWpn = weapons['laser'];
            const lHeat = lWpn ? lWpn.heat / lWpn.maxHeat : 0;
            const lColor = lHeat > 0.75 ? '#ff1744' : (lWpn && lWpn.overheated) ? '#ff5722' : bulletGc;
            ctx.fillStyle = '#1a2a3a';
            ctx.beginPath(); ctx.roundRect(-3, -54, 6, 48, 2); ctx.fill();
            ctx.fillStyle = lColor;
            ctx.beginPath(); ctx.roundRect(-1.5, -58, 3, 56, 1); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -60); ctx.lineTo(4, -52); ctx.lineTo(-4, -52); ctx.closePath();
            ctx.fill();
            if (shadows) { ctx.shadowColor = lColor; ctx.shadowBlur = 10; ctx.fill(); }
        } else if (w === 'plasma') {
            // конусный ствол + пульсирующий шар
            ctx.fillStyle = '#006064';
            ctx.beginPath(); ctx.roundRect(-6, -40, 12, 32, 3); ctx.fill();
            ctx.fillStyle = '#00acc1';
            ctx.beginPath(); ctx.roundRect(-4, -36, 8, 26, 2); ctx.fill();
            const pPulse = 0.6 + 0.4 * Math.sin(Date.now() / 200);
            if (shadows) { ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 14 * pPulse; }
            ctx.fillStyle = `rgba(0,${Math.round(180 + 75 * pPulse)},255,0.9)`;
            ctx.beginPath(); ctx.arc(0, -44, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(-5, -46, 10, 6);
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.shadowBlur = 0;
        ctx.restore();
    })();
    
    bullets.forEach(bullet => {
        if (bullet.trail && bullet.trail.length > 1) {
            for (let t = 0; t < bullet.trail.length; t++) {
                const alpha = (1 - t / bullet.trail.length) * 0.35;
                const r = (bullet.width / 2) * (1 - t / bullet.trail.length);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.trail[t].x, bullet.trail[t].y, Math.max(1, r), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        ctx.fillStyle = bullet.color;
        if (graphicsModule && graphicsModule.settings.shadows) {
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.ellipse(
            bullet.x + bullet.width / 2,
            bullet.y + bullet.height / 2,
            bullet.width / 2,
            bullet.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (graphicsModule && graphicsModule.settings.particles) {
            const gradient = ctx.createRadialGradient(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                0,
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                bullet.width * 3
            );
            gradient.addColorStop(0, bullet.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    enemies.forEach(enemy => {
        drawSoldier(enemy);
    });
    
    // === Лазерный луч ===
    if (laserBeam) {
        const lw2 = weapons['laser'];
        const heatRatio = lw2 ? lw2.heat / lw2.maxHeat : 0;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = laserBeam.color;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = laserBeam.color; ctx.shadowBlur = 30; }
        ctx.beginPath();
        ctx.moveTo(laserBeam.x1, laserBeam.y1);
        ctx.lineTo(laserBeam.x2, laserBeam.y2);
        ctx.stroke();
        ctx.globalAlpha = 0.75;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.strokeStyle = heatRatio > 0.75 ? '#ff1744' : laserBeam.color;
        ctx.beginPath();
        ctx.moveTo(laserBeam.x1, laserBeam.y1);
        ctx.lineTo(laserBeam.x2, laserBeam.y2);
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        ctx.restore();
    }

    if (!gameModule || gameModule.settings.particleEffects) {
        effects.forEach(effect => {
            if (effect.kind === 'pickup_text') {
                ctx.globalAlpha = effect.life;
                ctx.font = 'bold 14px "Segoe UI", Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#00ff9d';
                ctx.fillText(effect.text, effect.x, effect.y);
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
                return;
            }
            if (effect.kind === 'explode_ring') {
                ctx.globalAlpha = effect.life * 0.85;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = effect.color; ctx.shadowBlur = 18; }
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, Math.max(1, effect.radius), 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                return;
            }
            if (effect.kind === 'muzzle') {
                ctx.globalAlpha = effect.life * 0.7;
                ctx.fillStyle = effect.color;
                if (graphicsModule && graphicsModule.settings.shadows) {
                    ctx.shadowColor = effect.color; ctx.shadowBlur = 20;
                }
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                return;
            }
            if (effect.kind === 'spark') {
                const alpha = (effect.life / effect.maxLife);
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = effect.radius;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                ctx.lineTo(effect.x - effect.vx * 3, effect.y - effect.vy * 3);
                ctx.stroke();
                ctx.globalAlpha = 1;
                return;
            }
            const alpha = effect.life / effect.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = effect.color;
            if (graphicsModule && graphicsModule.settings.shadows) {
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 10;
            }
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

    drawPickups();

    // ── Boss health bar ──────────────────────────────────────
    const activeBoss = enemies.find(e => e.type === 'finalBoss' || e.type === 'boss');
    if (activeBoss) {
        const barW = Math.min(600, canvas.width * 0.45);
        const barH = 18;
        const barX = canvas.width / 2 - barW / 2;
        const barY = 14;
        const hp = activeBoss.health;
        const maxHp = activeBoss.maxHealth || activeBoss.health;
        const pct = Math.max(0, hp / maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6); else ctx.rect(barX - 2, barY - 2, barW + 4, barH + 4); ctx.fill();
        const bgrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        bgrad.addColorStop(0, activeBoss.type === 'finalBoss' ? '#ff1744' : '#f44336');
        bgrad.addColorStop(1, activeBoss.type === 'finalBoss' ? '#ff6d00' : '#ff8f00');
        ctx.fillStyle = bgrad;
        if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(barX, barY, barW * pct, barH, 4); ctx.fill(); }
        else { ctx.fillRect(barX, barY, barW * pct, barH); }
        ctx.strokeStyle = activeBoss.color;
        ctx.lineWidth = 2;
        if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = activeBoss.color; ctx.shadowBlur = 10; }
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${activeBoss.type === 'finalBoss' ? '⚠ ФИНАЛЬНЫЙ БОСС' : '💀 КОМАНДИР'} — ${Math.ceil(hp)} HP`, canvas.width / 2, barY + barH + 14);
        ctx.textAlign = 'left';
    }

    enemyBullets.forEach(eb => {
        ctx.fillStyle = eb.color;
        if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = eb.color; ctx.shadowBlur = 14; }
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    if (levelUpText) {
        const alpha = levelUpText.life;
        const col = levelUpText.color || '#00ff9d';
        const fontSize = levelUpText.fontSize || 64;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        const r = parseInt(col.slice(1,3),16), g = parseInt(col.slice(3,5),16), b = parseInt(col.slice(5,7),16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        if (graphicsModule && graphicsModule.settings.shadows) {
            ctx.shadowColor = col;
            ctx.shadowBlur = 20;
        }
        ctx.fillText(levelUpText.text, canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }
    
    // ── Damage flash (red vignette) ──
    if (damageFlash > 0) {
        const flashGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.85
        );
        flashGrad.addColorStop(0, 'rgba(255,0,0,0)');
        flashGrad.addColorStop(1, `rgba(255,0,0,${damageFlash * 0.55})`);
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ── Kill streak green glow vignette ──
    if (killStreakGlow > 0) {
        const kgGrad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.35,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.9
        );
        kgGrad.addColorStop(0, 'rgba(0,255,157,0)');
        kgGrad.addColorStop(1, `rgba(0,255,157,${killStreakGlow * 0.28})`);
        ctx.fillStyle = kgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ── Nuke flash (white/orange) ──
    if (nukeFlash > 0) {
        ctx.fillStyle = `rgba(255,180,50,${nukeFlash * 0.75})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ── Close screen shake transform ──
    ctx.restore();

    if (reloading) {
        const weapon = weapons[player.weapon];
        const elapsed = Date.now() - reloadStartTime;
        const percent = Math.min(1, elapsed / weapon.reloadTime);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        if (graphicsModule && graphicsModule.settings.shadows) {
            ctx.shadowColor = '#00ff9d';
            ctx.shadowBlur = 15;
        }
        ctx.fillText('ПЕРЕЗАРЯДКА...', canvas.width / 2, canvas.height / 2 - 50);
        ctx.shadowBlur = 0;
        
        const barWidth = 400;
        const barHeight = 30;
        const barX = canvas.width / 2 - barWidth / 2;
        const barY = canvas.height / 2 + 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#00ff9d');
        gradient.addColorStop(1, '#009d63');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * percent, barHeight);
        
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        ctx.textAlign = 'left';
    }
    
    const weapon = weapons[player.weapon];

    // ── TOP CENTER: прогресс уровня ──────────────────────────────────────────
    (function drawLevelProgress() {
        const barW = Math.min(400, canvas.width * 0.38);
        const barH = 14;
        const bx = canvas.width / 2 - barW / 2;
        const by = 14;
        const progress = enemiesToComplete > 0 ? Math.min(1, enemiesKilledThisLevel / enemiesToComplete) : 0;
        const modeLabel = infiniteMode ? `Волна ${infiniteWave}` : `Уровень ${currentLevel}`;
        const progressText = infiniteMode
            ? `${enemiesKilledThisLevel} убито`
            : `${enemiesKilledThisLevel} / ${enemiesToComplete}`;

        ctx.save();

        // фоновая плашка
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#06061a';
        ctx.beginPath();
        ctx.roundRect(bx - 12, by - 4, barW + 24, barH + 32, 10);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // подпись уровня
        ctx.font = 'bold 11px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,255,157,0.85)';
        ctx.fillText(modeLabel.toUpperCase(), canvas.width / 2, by + 9);

        // трек полосы
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.roundRect(bx, by + 14, barW, barH, 6); ctx.fill();

        // заполнение
        if (progress > 0) {
            const grad = ctx.createLinearGradient(bx, by + 14, bx + barW, by + 14);
            grad.addColorStop(0, '#00ff9d');
            grad.addColorStop(1, '#00cc7a');
            ctx.fillStyle = grad;
            if (graphicsModule && graphicsModule.settings.shadows) {
                ctx.shadowColor = '#00ff9d';
                ctx.shadowBlur = 8;
            }
            ctx.beginPath(); ctx.roundRect(bx, by + 14, barW * progress, barH, 6); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // текст прогресса поверх полосы
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.fillStyle = progress > 0.45 ? '#000' : 'rgba(255,255,255,0.7)';
        ctx.fillText(progressText, canvas.width / 2, by + 14 + barH - 3);

        ctx.textAlign = 'left';
        ctx.restore();
    })();

    // ── LEFT HUD: HP + щит + деньги + очки ──────────────────────────────────
    (function drawLeftHUD() {
        const px = 12, py = 12;
        const w = 168;
        const hasShield = shieldMax > 0;
        const hudH = hasShield ? 108 : 88;
        const maxHp = devMode.infiniteHealth ? 9999 : 100;
        const hpPct = Math.max(0, Math.min(1, health / maxHp));
        const useShadows = graphicsModule && graphicsModule.settings.shadows;

        ctx.save();

        // фон — glassmorphism
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#0a0a1c';
        ctx.beginPath(); ctx.roundRect(px, py, w, hudH, 12); ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        // тонкая светящаяся полоска сверху
        const grad = ctx.createLinearGradient(px, py, px + w, py);
        grad.addColorStop(0, 'rgba(0,229,255,0)');
        grad.addColorStop(0.5, 'rgba(0,229,255,0.7)');
        grad.addColorStop(1, 'rgba(0,229,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 12, py); ctx.lineTo(px + w - 12, py); ctx.stroke();
        ctx.globalAlpha = 1;

        // ❤ HP-полоска
        const hbPad = 10, hbX = px + hbPad, hbW = w - hbPad * 2, hbH = 7;
        const hpBarY = py + 14;

        // метка HP
        ctx.font = 'bold 9px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(180,200,230,0.55)';
        ctx.textAlign = 'left';
        ctx.fillText('HP', px + hbPad, hpBarY - 2);
        const hpValStr = devMode.infiniteHealth ? '∞' : Math.ceil(health);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e8eaf6';
        ctx.fillText(hpValStr, px + w - hbPad, hpBarY - 2);
        ctx.textAlign = 'left';

        // трек
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(hbX, hpBarY, hbW, hbH, 3); ctx.fill();

        // заливка с градиентом
        const hpColor = hpPct > 0.5 ? '#00ff9d' : hpPct > 0.25 ? '#f59e0b' : '#f43f5e';
        const hpGrad = ctx.createLinearGradient(hbX, 0, hbX + hbW * hpPct, 0);
        hpGrad.addColorStop(0, hpColor + 'aa');
        hpGrad.addColorStop(1, hpColor);
        if (useShadows) { ctx.shadowColor = hpColor; ctx.shadowBlur = 8; }
        ctx.fillStyle = hpGrad;
        ctx.beginPath(); ctx.roundRect(hbX, hpBarY, hbW * hpPct, hbH, 3); ctx.fill();
        ctx.shadowBlur = 0;

        // 🛡 Щит-полоска
        const shOffset = hasShield ? 22 : 0;
        if (hasShield) {
            const shPct = shieldMax > 0 ? Math.max(0, Math.min(1, shield / shieldMax)) : 0;
            const shBarY = hpBarY + 18;
            ctx.font = 'bold 9px "Segoe UI", Arial';
            ctx.fillStyle = 'rgba(100,181,246,0.6)';
            ctx.fillText('ЩИТ', px + hbPad, shBarY - 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#e8eaf6';
            ctx.fillText(Math.ceil(shield), px + w - hbPad, shBarY - 2);
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.roundRect(hbX, shBarY, hbW, hbH, 3); ctx.fill();
            const shColor = shieldRegenTimer >= getShieldRegenDelay() ? '#64b5f6' : 'rgba(100,181,246,0.45)';
            if (useShadows) { ctx.shadowColor = '#64b5f6'; ctx.shadowBlur = 6; }
            ctx.fillStyle = shColor;
            ctx.beginPath(); ctx.roundRect(hbX, shBarY, hbW * shPct, hbH, 3); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // разделитель
        const divY = py + 30 + shOffset;
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#e8eaf6';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 8, divY); ctx.lineTo(px + w - 8, divY); ctx.stroke();
        ctx.globalAlpha = 1;

        // деньги pill
        const moneyY = divY + 14;
        ctx.font = 'bold 13px "Segoe UI", Arial';
        if (useShadows) { ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 6; }
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`$ ${devMode.infiniteMoney ? '∞' : money}`, px + hbPad, moneyY);
        ctx.shadowBlur = 0;

        // очки
        ctx.font = '12px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(0,229,255,0.85)';
        ctx.fillText(`★ ${score}`, px + hbPad, moneyY + 18);

        ctx.restore();
    })();

    // ── COMBO indicator ───────────────────────────────────────────────────────
    if (combo >= 2) {
        const fadeRatio = Math.min(1, comboTimer / 800);
        const useShadows = graphicsModule && graphicsModule.settings.shadows;
        ctx.save();
        ctx.globalAlpha = fadeRatio;
        ctx.textAlign = 'center';
        const comboScale = 1 + Math.min(0.4, (combo - 2) * 0.07);
        const fontSize = Math.round(26 * comboScale);
        const comboColor = combo >= 8 ? '#f43f5e' : combo >= 5 ? '#f97316' : combo >= 3 ? '#f59e0b' : '#00e5ff';

        // pill фон
        const cw = fontSize * 3.2, ch = fontSize + 14;
        const cx2 = canvas.width / 2 - cw / 2, cy2 = 18;
        ctx.fillStyle = 'rgba(10,10,28,0.75)';
        ctx.strokeStyle = comboColor + '55';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx2, cy2, cw, ch, ch / 2); ctx.fill(); ctx.stroke();

        ctx.font = `bold ${fontSize}px "Segoe UI", Arial`;
        if (useShadows) { ctx.shadowColor = comboColor; ctx.shadowBlur = 18; }
        ctx.fillStyle = comboColor;
        ctx.fillText(`x${combo} COMBO`, canvas.width / 2, cy2 + ch - 8);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── STREAK BUFF indicator ─────────────────────────────────────────────────
    if (streakBuff.active) {
        const timeRatio = streakBuff.timer / streakBuff.duration;
        const useShadows = graphicsModule && graphicsModule.settings.shadows;
        const yBase = combo >= 2 ? 74 : 48;
        ctx.save();
        ctx.textAlign = 'center';

        const sW = 200, sH = 34, sX = canvas.width / 2 - sW / 2, sY = yBase;
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = 'rgba(10,10,28,0.8)';
        ctx.strokeStyle = 'rgba(245,158,11,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(sX, sY, sW, sH, 8); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.font = 'bold 12px "Segoe UI", Arial';
        if (useShadows) { ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10; }
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('⚡ STREAK +50% УРОН', canvas.width / 2, sY + 15);
        ctx.shadowBlur = 0;

        // таймбар
        const bW = sW - 20, bH = 3, bX = sX + 10, bY = sY + 22;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 2); ctx.fill();
        const tbGrad = ctx.createLinearGradient(bX, 0, bX + bW, 0);
        tbGrad.addColorStop(0, '#f59e0b');
        tbGrad.addColorStop(1, '#fde68a');
        ctx.fillStyle = tbGrad;
        ctx.beginPath(); ctx.roundRect(bX, bY, bW * timeRatio, bH, 2); ctx.fill();
        ctx.restore();
    } else if (killStreakNoHit >= 1) {
        const yBase = combo >= 2 ? 72 : 50;
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.textAlign = 'center';
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`🔥 СЕРИЯ: ${killStreakNoHit}/3`, canvas.width / 2, yBase);
        ctx.globalAlpha = 1; ctx.restore();
    }

    // ── RIGHT HUD: оружие + патроны + kill counter ───────────────────────────
    (function drawRightHUD() {
        const w = 172;
        const px = canvas.width - w - 12, py = 12;
        const useShadows = graphicsModule && graphicsModule.settings.shadows;
        const wColor = weapon.bulletColor || '#00ff9d';
        const hbPad = 10;

        // высота: лазер (+22) или обычный; плюс kill bar
        const innerH = weapon.isLaser ? 76 : 68;
        const hudH = innerH + 30; // +30 для kill counter

        ctx.save();

        // фон glassmorphism
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#0a0a1c';
        ctx.beginPath(); ctx.roundRect(px, py, w, hudH, 12); ctx.fill();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = wColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        // светящаяся полоска сверху цвета оружия
        const rtopGrad = ctx.createLinearGradient(px, py, px + w, py);
        rtopGrad.addColorStop(0, wColor + '00');
        rtopGrad.addColorStop(0.5, wColor + 'bb');
        rtopGrad.addColorStop(1, wColor + '00');
        ctx.strokeStyle = rtopGrad;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 12, py); ctx.lineTo(px + w - 12, py); ctx.stroke();
        ctx.globalAlpha = 1;

        // название оружия
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px "Segoe UI", Arial';
        if (useShadows) { ctx.shadowColor = wColor; ctx.shadowBlur = 10; }
        ctx.fillStyle = wColor;
        ctx.fillText(weapon.name.toUpperCase(), px + w - hbPad, py + 17);
        ctx.shadowBlur = 0;

        // патроны — иконки пуль
        const ammoY = py + 26;
        ctx.font = '9px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(180,200,230,0.5)';
        ctx.fillText(devMode.infiniteAmmo ? '∞' : `${weapon.ammo}/${weapon.clipSize}`, px + w - hbPad, ammoY);

        const bullets_count = Math.min(weapon.clipSize, 20);
        const bulletW = Math.min(7, (w - hbPad * 2) / bullets_count - 1.5);
        const bulletH = 12;
        const totalBulletsW = bullets_count * (bulletW + 1.5) - 1.5;
        let bx = px + w - hbPad - totalBulletsW;
        const bby = ammoY + 5;
        for (let i = 0; i < bullets_count; i++) {
            const filled = devMode.infiniteAmmo || i < weapon.ammo;
            ctx.fillStyle = filled ? wColor : 'rgba(255,255,255,0.1)';
            if (filled && useShadows && i === weapon.ammo - 1) { ctx.shadowColor = wColor; ctx.shadowBlur = 4; }
            ctx.beginPath(); ctx.roundRect(bx, bby, bulletW, bulletH, 2); ctx.fill();
            ctx.shadowBlur = 0;
            bx += bulletW + 1.5;
        }

        // Тепло лазера
        if (weapon.isLaser) {
            const heatPct = weapon.heat / weapon.maxHeat;
            const heatColor = weapon.overheated ? '#f43f5e' : heatPct > 0.65 ? '#f97316' : '#a855f7';
            const htBarY = bby + bulletH + 10;
            ctx.textAlign = 'left';
            ctx.font = 'bold 9px "Segoe UI", Arial';
            ctx.fillStyle = 'rgba(180,200,230,0.5)';
            ctx.fillText('ТЕПЛО', px + hbPad, htBarY - 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = heatColor;
            ctx.fillText(weapon.overheated ? 'ПЕРЕГРЕВ' : `${Math.round(heatPct * 100)}%`, px + w - hbPad, htBarY - 2);
            ctx.textAlign = 'right';
            const htX = px + hbPad, htW = w - hbPad * 2, htH = 6;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.roundRect(htX, htBarY, htW, htH, 3); ctx.fill();
            if (useShadows) { ctx.shadowColor = heatColor; ctx.shadowBlur = 6; }
            ctx.fillStyle = heatColor;
            ctx.beginPath(); ctx.roundRect(htX, htBarY, htW * heatPct, htH, 3); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.textAlign = 'right';
            ctx.font = '9px "Segoe UI", Arial';
            ctx.fillStyle = 'rgba(160,180,210,0.5)';
            ctx.fillText(`УРН ${weapon.damage * weapon.upgrades.damage}  ×${weapon.upgrades.speed}`, px + w - hbPad, bby + bulletH + 12);
        }

        // разделитель
        const killDivY = py + innerH - 2;
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#e8eaf6';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px + 8, killDivY); ctx.lineTo(px + w - 8, killDivY); ctx.stroke();
        ctx.globalAlpha = 1;

        // Kill counter bar
        const killPct = enemiesToComplete > 0 ? Math.min(1, enemiesKilledThisLevel / enemiesToComplete) : 0;
        const killColor = killPct >= 0.9 ? '#f43f5e' : killPct >= 0.6 ? '#f59e0b' : '#00ff9d';
        const kbY = killDivY + 7, kbX = px + hbPad, kbW = w - hbPad * 2, kbH = 6;

        ctx.textAlign = 'left';
        ctx.font = 'bold 9px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(180,200,230,0.5)';
        ctx.fillText('ВРАГИ', px + hbPad, kbY - 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(180,200,230,0.7)';
        ctx.fillText(infiniteMode ? `${enemiesKilledThisLevel}` : `${enemiesKilledThisLevel}/${enemiesToComplete}`, px + w - hbPad, kbY - 2);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(kbX, kbY, kbW, kbH, 3); ctx.fill();
        if (killPct > 0) {
            const killFlash = killCounterFlash > 0;
            if (useShadows && killFlash) { ctx.shadowColor = killColor; ctx.shadowBlur = 8; }
            const kGrad = ctx.createLinearGradient(kbX, 0, kbX + kbW, 0);
            kGrad.addColorStop(0, killColor + '99');
            kGrad.addColorStop(1, killColor);
            ctx.fillStyle = kGrad;
            ctx.beginPath(); ctx.roundRect(kbX, kbY, kbW * killPct, kbH, 3); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'left';
        ctx.restore();
    })();

    if (reloading) {
        const elapsed = Date.now() - reloadStartTime;
        const reloadPct = Math.min(1, elapsed / weapon.reloadTime);
        const remaining = Math.ceil((weapon.reloadTime - elapsed) / 1000);
        const rW = 148, rH = 28;
        const rX = canvas.width - rW - 12, rY = 12 + (172 - 12 - 28) / 2 + 100; // под правым HUD
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#0a0a1c';
        ctx.strokeStyle = 'rgba(245,158,11,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(rX, rY, rW, rH, 8); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText(`⟳ ПЕРЕЗАРЯДКА ${remaining}с`, rX + rW / 2, rY + 12);
        const rbX = rX + 8, rbW = rW - 16, rbH = 4, rbY = rY + 18;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.roundRect(rbX, rbY, rbW, rbH, 2); ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.roundRect(rbX, rbY, rbW * reloadPct, rbH, 2); ctx.fill();
        ctx.textAlign = 'left';
        ctx.restore();
    }

    // Рекорд лучшей волны (под правым HUD)
    if (infiniteMode && bestInfiniteWave > 0) {
        ctx.save();
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(245,158,11,0.65)';
        ctx.textAlign = 'right';
        ctx.fillText(`★ РЕКОРД: ВОЛНА ${bestInfiniteWave}`, canvas.width - 14, 120);
        ctx.textAlign = 'left';
        ctx.restore();
    }

    // ── RADAR (мини-карта) ──────────────────────────────────────────────────────
    (function drawRadar() {
        const rSize = 90;
        const rX = canvas.width / 2 - rSize / 2;
        const rY = canvas.height - rSize - 12;
        const scaleX = rSize / canvas.width;
        const scaleY = rSize / canvas.height;

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgba(5,5,20,0.85)';
        ctx.strokeStyle = 'rgba(0,255,157,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(rX, rY, rSize, rSize, 6); ctx.fill(); ctx.stroke();

        // сетка
        ctx.strokeStyle = 'rgba(0,255,157,0.08)';
        ctx.lineWidth = 0.5;
        for (let gx = rX + rSize / 3; gx < rX + rSize; gx += rSize / 3) {
            ctx.beginPath(); ctx.moveTo(gx, rY); ctx.lineTo(gx, rY + rSize); ctx.stroke();
        }
        for (let gy = rY + rSize / 3; gy < rY + rSize; gy += rSize / 3) {
            ctx.beginPath(); ctx.moveTo(rX, gy); ctx.lineTo(rX + rSize, gy); ctx.stroke();
        }

        // враги
        ctx.globalAlpha = 0.9;
        enemies.forEach(en => {
            const ex = rX + en.x * scaleX;
            const ey = rY + en.y * scaleY;
            const col = en.type === 'boss' || en.type === 'finalBoss' ? '#ff4757'
                      : en.type === 'tank' ? '#795548'
                      : en.type === 'fast' ? '#9c27b0'
                      : en.type === 'sniper' ? '#ffeb3b'
                      : en.type === 'exploder' ? '#ff6d00'
                      : '#f44336';
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(ex, ey, en.type === 'boss' || en.type === 'finalBoss' ? 3.5 : 2, 0, Math.PI * 2); ctx.fill();
        });

        // игрок — зелёная точка
        const pDotX = rX + (player.x + player.width / 2) * scaleX;
        const pDotY = rY + (player.y + player.height / 2) * scaleY;
        ctx.fillStyle = '#00ff9d';
        if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = '#00ff9d'; ctx.shadowBlur = 6; }
        ctx.beginPath(); ctx.arc(pDotX, pDotY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    })();

    // Анонс начала волны
    if (infiniteMode && infiniteAnnouncement && infiniteAnnouncement.life > 0) {
        const a = infiniteAnnouncement;
        const alpha = a.life > 0.7 ? 1 : a.life / 0.7;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.font = 'bold 42px Arial';
        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 20;
        ctx.fillText(a.text, canvas.width / 2, canvas.height / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = '18px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(a.sub, canvas.width / 2, canvas.height / 2 + 18);
        ctx.textAlign = 'left';
        ctx.restore();
        infiniteAnnouncement.life -= 0.012;
        if (infiniteAnnouncement.life <= 0) infiniteAnnouncement = null;
    }

    // ── CROSSHAIR ──────────────────────────────────────────────────────────────
    (function drawCrosshair() {
        if (!gameRunning || gamePaused) return;
        const w = weapons[player.weapon];
        const color = w ? w.bulletColor : '#00e5ff';
        const isReloading = reloading;
        const cx2 = mouseX, cy2 = mouseY;
        ctx.save();
        ctx.globalAlpha = 0.9;

        if (player.weapon === 'sniper') {
            // Sniper: full cross with long lines + circle
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
            const gap = 8, len = 22;
            ctx.beginPath(); ctx.moveTo(cx2 - gap - len, cy2); ctx.lineTo(cx2 - gap, cy2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2 + gap, cy2); ctx.lineTo(cx2 + gap + len, cy2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2, cy2 - gap - len); ctx.lineTo(cx2, cy2 - gap); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2, cy2 + gap); ctx.lineTo(cx2, cy2 + gap + len); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx2, cy2, 18, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx2, cy2, 2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        } else if (player.weapon === 'shotgun') {
            // Shotgun: wide bracket crosshair
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
            const spread = isReloading ? 28 : 18;
            [[cx2-spread, cy2-spread, cx2-spread+8, cy2-spread, cx2-spread, cy2-spread+8],
             [cx2+spread, cy2-spread, cx2+spread-8, cy2-spread, cx2+spread, cy2-spread+8],
             [cx2-spread, cy2+spread, cx2-spread+8, cy2+spread, cx2-spread, cy2+spread-8],
             [cx2+spread, cy2+spread, cx2+spread-8, cy2+spread, cx2+spread, cy2+spread-8]
            ].forEach(([x1,y1,x2,y2,x3,y3]) => {
                ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x3,y3); ctx.stroke();
            });
            ctx.beginPath(); ctx.arc(cx2, cy2, 2.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        } else if (player.weapon === 'laser') {
            // Laser: X crosshair with glow
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
            const s = 12;
            ctx.beginPath(); ctx.moveTo(cx2-s, cy2-s); ctx.lineTo(cx2+s, cy2+s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2+s, cy2-s); ctx.lineTo(cx2-s, cy2+s); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx2, cy2, 8, 0, Math.PI * 2); ctx.stroke();
        } else if (player.weapon === 'plasma') {
            // Plasma: pulsing ring
            const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 150);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = color; ctx.shadowBlur = 12 * pulse; }
            ctx.beginPath(); ctx.arc(cx2, cy2, 14 * pulse, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        } else {
            // Default: classic dot + gap cross
            const gap = isReloading ? 12 : 5, len = 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            if (graphicsModule && graphicsModule.settings.shadows) { ctx.shadowColor = color; ctx.shadowBlur = 5; }
            ctx.beginPath(); ctx.moveTo(cx2 - gap - len, cy2); ctx.lineTo(cx2 - gap, cy2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2 + gap, cy2); ctx.lineTo(cx2 + gap + len, cy2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2, cy2 - gap - len); ctx.lineTo(cx2, cy2 - gap); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx2, cy2 + gap); ctx.lineTo(cx2, cy2 + gap + len); ctx.stroke();
            if (!isReloading) {
                ctx.beginPath(); ctx.arc(cx2, cy2, 2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    })();

    // Пауза-оверлей
    if (gamePaused && gameRunning) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // карточка
        const cw = 340, ch = 200;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#08081a';
        ctx.beginPath(); ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // заголовок
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px "Segoe UI", Arial';
        ctx.fillStyle = '#00ff9d';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 24;
        ctx.fillText('ПАУЗА', cx, cy - 42);
        ctx.shadowBlur = 0;

        // разделитель
        ctx.strokeStyle = 'rgba(0,255,157,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 120, cy - 26); ctx.lineTo(cx + 120, cy - 26); ctx.stroke();

        // статистика
        ctx.font = '15px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(200,220,240,0.8)';
        const lvLabel = infiniteMode ? `Волна ${infiniteWave}` : `Уровень ${currentLevel}`;
        ctx.fillText(`${lvLabel}  ·  Убито: ${enemiesKilledThisLevel}/${enemiesToComplete}`, cx, cy + 4);
        ctx.fillStyle = 'rgba(160,180,210,0.6)';
        ctx.fillText(`HP: ${devMode.infiniteHealth ? '∞' : Math.ceil(health)}${shieldMax > 0 ? '  ·  Щит: ' + Math.ceil(shield) + '/' + shieldMax : ''}  ·  Деньги: ${devMode.infiniteMoney ? '∞' : money}`, cx, cy + 28);

        // подсказка
        ctx.font = 'bold 13px "Segoe UI", Arial';
        ctx.fillStyle = 'rgba(0,255,157,0.45)';
        ctx.fillText('[ ESC ] — продолжить   [ H ] — в меню', cx, cy + 68);

        ctx.textAlign = 'left';
        ctx.restore();
    }
}

function gameLoop(timestamp) {
    const rawDelta = timestamp - lastTime || 0;
    lastTime = timestamp;
    const deltaTime = rawDelta * bossKillSlowmo;

    // Fade global effects
    nukeFlash = Math.max(0, nukeFlash - rawDelta / 400);
    playerAuraFlash = Math.max(0, playerAuraFlash - rawDelta / 150);
    killStreakGlow = streakBuff.active ? Math.min(1, killStreakGlow + rawDelta / 500) : Math.max(0, killStreakGlow - rawDelta / 800);
    updateShake(rawDelta);

    // Speed boost pickup timer
    if (player._speedBoost) {
        player._speedTimer = (player._speedTimer || 0) - rawDelta;
        if (player._speedTimer <= 0) { player._speedBoost = false; }
    }

    updateGame(deltaTime);
    drawGame();

    requestAnimationFrame(gameLoop);
}

function initMiniMusicPlayer() {
    const miniMusicPlayer = document.getElementById('miniMusicPlayer');
    const miniMusicPrev = document.getElementById('miniMusicPrev');
    const miniMusicToggle = document.getElementById('miniMusicToggle');
    const miniMusicNext = document.getElementById('miniMusicNext');
    const miniMusicExpand = document.getElementById('miniMusicExpand');
    
    if (miniMusicPlayer) {
        miniMusicPlayer.style.display = 'flex';
    }
    
    if (miniMusicToggle) {
        miniMusicToggle.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                if (audioModule) audioModule.userInteracted = true;
                backgroundMusic.play().then(() => {
                    updateMiniPlayer();
                }).catch(() => {
                    if (miniMusicToggle) miniMusicToggle.innerHTML = '<i class="fas fa-play"></i>';
                });
            } else {
                backgroundMusic.pause();
                updateMiniPlayer();
            }
        });
    }
    
    if (miniMusicPrev) {
        miniMusicPrev.addEventListener('click', () => {
            if (audioModule) {
                audioModule.prevTrack();
            }
        });
    }
    
    if (miniMusicNext) {
        miniMusicNext.addEventListener('click', () => {
            if (audioModule) {
                audioModule.nextTrack();
            }
        });
    }
    
    if (miniMusicExpand) {
        miniMusicExpand.addEventListener('click', () => {
            if (audioModule) {
                audioModule.showMenu();
            }
        });
    }
    
    function updateMiniPlayer() {
        if (backgroundMusic.paused) {
            if (miniMusicToggle) miniMusicToggle.innerHTML = '<i class="fas fa-play"></i>';
            if (miniMusicPlayer) miniMusicPlayer.classList.remove('playing');
        } else {
            if (miniMusicToggle) miniMusicToggle.innerHTML = '<i class="fas fa-pause"></i>';
            if (miniMusicPlayer) miniMusicPlayer.classList.add('playing');
        }
        
        const miniTrackTime = document.getElementById('miniTrackTime');
        if (miniTrackTime && !isNaN(backgroundMusic.duration)) {
            const current = Math.floor(backgroundMusic.currentTime);
            const duration = Math.floor(backgroundMusic.duration);
            const currentStr = `${Math.floor(current / 60)}:${(current % 60).toString().padStart(2, '0')}`;
            const durationStr = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
            miniTrackTime.textContent = `${currentStr} / ${durationStr}`;
        }
    }
    
    setInterval(updateMiniPlayer, 1000);
}

function setSplash(text, pct) {
    const bar = document.getElementById('splashBar');
    const status = document.getElementById('splashStatus');
    if (bar) bar.style.width = pct + '%';
    if (status) status.textContent = text;
}

function hideSplash() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 520);
}

function initGame() {
    loadStats();

    setSplash('Загрузка настроек...', 15);

    setTimeout(() => {
        if (window.settingsManager) {
            graphicsModule = window.settingsManager.getModule('graphics');
            audioModule = window.settingsManager.getModule('audio');
            controlsModule = window.settingsManager.getModule('controls');
            gameModule = window.settingsManager.getModule('game');

            setSplash('Применение графики...', 35);
            if (graphicsModule) graphicsModule.applySettings();

            setSplash('Загрузка аудио...', 55);
            if (audioModule) audioModule.applySettings();

            setSplash('Управление...', 70);
            if (controlsModule) controlsModule.applySettings();

            setSplash('Игровые настройки...', 80);
            if (gameModule) gameModule.applySettings();
        }

        setSplash('Инициализация игры...', 90);

        if (controlsModule && controlsModule.settings) {
            autoFireMode = controlsModule.settings.autoFireDefault;
            updateFireModeUI();
        }
        
        initMenuButtons();
        initAboutMenu();
        initDevCheats();
        initFireMode();
        initSpawnControls();
        initMouseEvents();
        initKeyboardEvents();
        initWeaponButtons();
        initUpgradeButtons();
        initShopTabs();
        initDailyChallenge();
        initAchievements();
        loadAchievements();
        loadTopScores();
        initMiniMusicPlayer();
        updateWeaponShop();
        
        const loaded = loadGame();
        if (loaded) {
        }
        updateContinueButton();

        if (gameModule && gameModule.settings && gameModule.settings.autoSave) {
            setInterval(() => saveGame(), gameModule.settings.saveInterval * 1000);
        }

        updateWeaponButtons();
        updateSpawnRateDisplay();
        updateFireModeUI();
        updateUI();
        updateMenuStats();

        setSplash('Готово!', 100);

        // Начинаем в состоянии меню — игра не запускается автоматически
        enterMenuState();

        resizeCanvas();
        requestAnimationFrame(gameLoop);

        setTimeout(() => {
            hideSplash();
            setTimeout(() => {
                document.querySelectorAll('.fade-in-up').forEach(el => {
                    el.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                });
            }, 200);
        }, 400);

    }, 100);
}

window.addEventListener('beforeunload', () => {
    saveGame();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

window.gameInstance = {
    saveGame,
    resetGame,
    startLevel,
    completeLevel,
    checkLoreUnlock,
    player,
    weapons
};