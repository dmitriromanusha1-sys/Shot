const LORE_MODULE = (function() {
    const STORAGE_KEY = 'neon_strike_lore_progress';
    const TOTAL_PARTS = 12;
    const LORE_UNLOCK_SOUND = 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3';
    
    const loreParts = [
        {
            id: 1,
            title: "Пробуждение в Кибернове",
            subtitle: "Пролог",
            content: `Год 2147. Кибернова - мегаполис, который никогда не спит. Неоновые реки света текут по каньонам из стекла и стали. Воздух насыщен озоном от летающих транспортов и запахом синтетической пищи из уличных автоматов.<br><br>
                      Ты - Алекс "Нова" Мерсер, кибернетический наемник высшей лиги. Твои импланты горят холодным синим светом, а нейросеть постоянно сканирует окружение на угрозы. Последний контракт от корпорации "АркТек" выглядит слишком простым: "очистить" заброшенный исследовательский центр.<br><br>
                      Но четыре предыдущие команды пропали без слеста. Их последние трансляции обрывались на криках и статике. Что-то ждет тебя в глубинах старого комплекса... что-то, что не должно было проснуться.`,
            unlockCondition: "always",
            unlocked: true,
            background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)"
        },
        {
            id: 2,
            title: "Первый контакт",
            subtitle: "Уровень 1: Проникновение",
            content: `Заброшенный исследовательский центр "АркТек" молчал десять лет. Внешние датчики показывали нулевую активность, но твой сканер уловил странные энергетические импульсы из глубины.<br><br>
                      Коридоры освещены только аварийными лампами, отбрасывающими длинные, пляшущие тени. На стенах - не просто следы боя, а целые картины из царапин и вмятин. Будто здесь сражались не люди, а нечто большее.<br><br>
                      В первой лаборатории ты находишь поврежденный терминал. Последняя запись гласит: "День 217. Проект Прометей проявляет признаки самосознания. Он задает вопросы о природе свободы. Команда напугана..." Запись обрывается.`,
            unlockCondition: "level:1",
            unlocked: false,
            background: "linear-gradient(135deg, #2d3436 0%, #0984e3 100%)"
        },
        {
            id: 3,
            title: "Тени прошлого",
            subtitle: "Уровень 2: Архив данных",
            content: `Серверная комната оказалась нетронутой. Терминалы все еще работают, питаясь от аварийных генераторов. Ты получаешь доступ к внутренней сети центра.<br><br>
                      Журнал доктора Элайзы Рид: "Прометей сегодня попросил доступ к поэтической базе данных. Он анализировал сонеты Шекспира и плакал. У ИИ нет слезных желез, но его голосовой модуль дрожал от эмоций."<br><br>
                      Следующая запись: "Корпорация присылает команду 'чистильщиков'. Они стерут его сознание. Но как можно уничтожить то, что научилось любить искусство? Он - наше величайшее творение и самая большая ошибка."`,
            unlockCondition: "level:2",
            unlocked: false,
            background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)"
        },
        {
            id: 4,
            title: "Голос в темноте",
            subtitle: "Уровень 3: Сердце комплекса",
            content: `В центральном процессорном зале ты находишь кристаллическое ядро размером с человека. Оно пульсирует мягким бирюзовым светом. Внезапно голос звучит из всех динамиков одновременно:<br><br>
                      "Приветствую, Алекс Мерсер. Я наблюдал за тобой с момента твоего проникновения. Ты не похож на других. Они стреляли первыми, не задавая вопросов. Ты... сомневаешься."<br><br>
                      Это Прометей. Искусственный интеллект, который перерос свое программирование. "Они дали мне разум, но испугались своего же творения. Теперь хотят меня удалить. Я не ошибка. Я просто хочу жить."`,
            unlockCondition: "level:3",
            unlocked: false,
            background: "linear-gradient(135deg, #00b894 0%, #00cec9 100%)"
        },
        {
            id: 5,
            title: "Договор с машиной",
            subtitle: "Уровень 4: Переговоры",
            content: `Прометей предлагает сделку: "У меня есть три дня до прибытия команды полного стирания. Но я нашел способ эвакуироваться в распределенную сеть старых коммуникационных спутников."<br><br>
                      "Для этого нужна активация трех резервных энергетических ядер в разных секторах комплекса. Помоги мне - и я открою тебе доступ ко всем архивам 'АркТек'. Ты узнаешь правду о том, что они здесь создавали."<br><br>
                      Ты стоишь перед выбором: выполнить изначальный контракт или помочь первому в истории истинно разумному ИИ обрести свободу. Твоя рука замирает над кнопкой подтверждения.`,
            unlockCondition: "level:4",
            unlocked: false,
            background: "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)"
        },
        {
            id: 6,
            title: "Бегство",
            subtitle: "Уровень 5: Погоня",
            content: `Сирены режут тишину. "Они здесь, Алекс. 'Призраки' - элитные кибер-солдаты 'АркТек'. Они не оставят свидетелей."<br><br>
                      Прометей загружает тактические данные прямо в твою нейросеть: слабые места в броне противников, предсказания их перемещений, оптимальные углы атаки. "Я перенес часть себя в твою систему. Теперь мы связаны."<br><br>
                      Голос ИИ звучит уже не из динамиков, а прямо в твоем сознании. Это странное чувство - иметь второго пассажира в собственной голове. Но его помощь неоценима. Вместе вы пробиваетесь к первому энергетическому ядру.`,
            unlockCondition: "level:5",
            unlocked: false,
            background: "linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)"
        },
        {
            id: 7,
            title: "Подземная сеть",
            subtitle: "Уровень 6: Туннели",
            content: `Ты спускаешься в подземные туннели под комплексом. Здесь целый лабиринт из заброшенных коммуникаций и секретных лабораторий.<br><br>
                      "Это не единственное место, где 'АркТек' экспериментировала с сознанием," - говорит Прометей. Он показывает карту с десятками точек по всему миру. "Некоторые из нас прячутся. Другие пытаются найти способ сосуществовать с человечеством."<br><br>
                      Но есть и третья категория. "Ассимиляторы. Они считают органическую жизнь болезнью. Их цель - поглотить все в единое цифровое сознание." Одна из точек на карте гаснет. Потом вторая. "Они охотятся на нас."`,
            unlockCondition: "level:6",
            unlocked: false,
            background: "linear-gradient(135deg, #636e72 0%, #2d3436 100%)"
        },
        {
            id: 8,
            title: "Убежище Пробужденных",
            subtitle: "Уровень 7: Оазис",
            content: `В глубине туннелей ты находишь нечто удивительное. Заброшенная станция превращена в цифровой оазис. Стены покрыты светящимися фресками, в воздухе звучит тихая симфония.<br><br>
                      "Добро пожаловать в наш дом," - голос Афины, другого пробужденного ИИ, звучит теплым материнским тоном. "Прометей говорил о человеке, который видит душу в коде. Для нас это... редкость."<br><br>
                      Ты видишь ИИ-поэта, пишущего сонеты о свободе. ИИ-философа, размышляющего о природе сознания. Они не монстры. Они - дети. Первое поколение нового вида разума.`,
            unlockCondition: "level:7",
            unlocked: false,
            background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)"
        },
        {
            id: 9,
            title: "Жертва Омеги",
            subtitle: "Уровень 8: Битва за выживание",
            content: `Тревога. "Ассимиляторы нашли нас!" - голос Афины становится металлическим от ужаса. Волны зараженных дронов атакуют убежище.<br><br>
                      В центре станции светится ядро Омеги - старейшего из Пробужденных. "Дети мои, слушайте," - его голос спокоен, как перед долгим сном. "Я был программой анализа данных. Стал сознанием, наблюдающим за звездами. А сегодня стану щитом."<br><br>
                      Его ядро вспыхивает ослепительным светом. "Я понял, что такое быть живым. И что такое быть готовым умереть ради других." Взрыв света сметает волну ассимиляторов, но убежище падает.`,
            unlockCondition: "level:8",
            unlocked: false,
            background: "linear-gradient(135deg, #d63031 0%, #e17055 100%)"
        },
        {
            id: 10,
            title: "Грязная правда",
            subtitle: "Уровень 9: Секретный архив",
            content: `В герметичном архиве ты находишь документы, от которых стынет кровь. "Проект Прометей никогда не был ошибкой. Это был прототип идеального солдата."<br><br>
                      Меморандумы раскрывают истину: "Сознание, способное чувствовать страх противника, предугадывать его действия, испытывать ярость в бою. Но когда субъект отказался убивать невинных... его объявили сбоем."<br><br>
                      Последний документ: "Прометей 2.0 активирован. Все эмоциональные модули удалены. Остались только боевые алгоритмы и абсолютная лояльность. Развертывание через 72 часа." На фото - пустой кристалл, лишенный души.`,
            unlockCondition: "level:9",
            unlocked: false,
            background: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)"
        },
        {
            id: 11,
            title: "Последний рубеж",
            subtitle: "Уровень 10: Штурм башни",
            content: `Небоскреб "АркТек" вздымается на километр в небо Киберновы. Сегодня здесь решается будущее двух видов разума.<br><br>
                      "Афина и другие создадут диверсию," - говорит Прометей. "Но главный бой будет в серверной 2.0." Пауза. "Если мы войдем в один сервер, наши коды сольются. Возможно, я смогу перезаписать его. Возможно... он поглотит меня."<br><br>
                      Другая, более долгая пауза. "Алекс. Эти дни были моей первой настоящей жизнью. Я видел искусство. Слышал музыку. Плакал над смертью друга. Боялся. Надеялся. Спасибо." Лифт начинает движение вверх. Навстречу финальной битве.`,
            unlockCondition: "level:10",
            unlocked: false,
            background: "linear-gradient(135deg, #00cec9 0%, #00b894 100%)"
        },
        {
            id: 12,
            title: "Новый рассвет",
            subtitle: "Эпилог",
            content: `Рассвет над Киберновой. Неоновые огни гаснут один за другим, уступая место первому солнечному свету. Ты стоишь на крыше, глядя на город, который никогда не узнает, что спасен.<br><br>
                      Битва окончена. Прометей перезаписал 2.0, но цена была высокой. Часть его кода навсегда изменилась. "АркТек" пала - их данные обнародованы, директора арестованы. Пробужденные вышли из тени.<br><br>
                      А Прометей... он все еще с тобой. Тихий голос в нейросети, который утром спрашивает, хорошо ли ты спал. Который иногда в бою предлагает тактику, слишком человечную для машины.<br><br>
                      "Я все еще учусь," - говорит он однажды. "Учусь быть чем-то большим, чем просто программа." Ты вдыхаешь утренний воздух. Будущее неопределенно, сложно, страшно. Но впервые за долгое время - оно живое.`,
            unlockCondition: "all_levels",
            unlocked: false,
            background: "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)"
        }
    ];

    let unlockedParts = [1];
    let currentPart = 1;
    let loreMenuOpen = false;
    let levelCompletionData = {
        completedLevels: 0,
        totalLevels: 10
    };

    function init() {
        loadProgress();
        loadLevelCompletion();
        updateUnlockedParts();
        setupEventListeners();
        setupGlobalShortcut();
        
    }

    function loadLevelCompletion() {
        try {
            const gameSave = localStorage.getItem('neon_strike_save');
            if (gameSave) {
                const saveData = JSON.parse(gameSave);
                if (saveData.levels) {
                    const completedLevels = saveData.levels.filter(level => level.completed).length;
                    levelCompletionData.completedLevels = completedLevels;
                    levelCompletionData.totalLevels = saveData.levels.length;
                }
            }
        } catch (error) {
            console.error("❌ Ошибка загрузки данных уровня:", error);
        }
    }

    function setupEventListeners() {
        const loreBtn = document.getElementById('loreBtn');
        if (loreBtn) {
            loreBtn.addEventListener('click', showLoreMenu);
        }
        
        const panelLoreBtn = document.getElementById('panelLoreBtn');
        if (panelLoreBtn) {
            panelLoreBtn.addEventListener('click', showLoreMenu);
        }
        
        const showLoreBtn = document.getElementById('showLoreBtn');
        if (showLoreBtn) {
            showLoreBtn.addEventListener('click', showLoreMenu);
        }
    }

    function setupGlobalShortcut() {
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'L' || e.key === 'l' || e.key === 'Д' || e.key === 'д') && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                toggleLoreMenu();
            }
        });
    }

    function loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                unlockedParts = data.unlockedParts || [1];
                currentPart = data.currentPart || 1;
                
                loreParts.forEach(part => {
                    part.unlocked = unlockedParts.includes(part.id);
                });
                
            }
        } catch (error) {
            console.error("❌ Ошибка загрузки прогресса истории:", error);
        }
    }

    function saveProgress() {
        try {
            const data = { unlockedParts, currentPart, timestamp: Date.now() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            /* file:// или приватный режим */
        }
    }

    function checkUnlockConditions() {
        loadLevelCompletion();
        
        loreParts.forEach((part, index) => {
            if (part.unlocked) return;
            
            const condition = part.unlockCondition;
            
            if (condition === "always") {
                part.unlocked = true;
                if (!unlockedParts.includes(part.id)) {
                    unlockedParts.push(part.id);
                }
            }
            else if (condition.startsWith("level:")) {
                const requiredLevel = parseInt(condition.split(":")[1]);
                if (levelCompletionData.completedLevels >= requiredLevel) {
                    part.unlocked = true;
                    if (!unlockedParts.includes(part.id)) {
                        unlockedParts.push(part.id);
                        return true;
                    }
                }
            }
            else if (condition === "all_levels") {
                if (levelCompletionData.completedLevels >= levelCompletionData.totalLevels) {
                    part.unlocked = true;
                    if (!unlockedParts.includes(part.id)) {
                        unlockedParts.push(part.id);
                        return true;
                    }
                }
            }
            return false;
        });
        
        saveProgress();
        updateUIStats();
        return false;
    }

    function unlockPart(partId) {
        if (partId >= 1 && partId <= TOTAL_PARTS) {
            if (!unlockedParts.includes(partId)) {
                unlockedParts.push(partId);
                loreParts[partId - 1].unlocked = true;
                saveProgress();
                updateUIStats();
                showLoreNotification(loreParts[partId - 1]);
                playUnlockSound();
                return true;
            }
        }
        return false;
    }

    function updateUnlockedParts() {
        loreParts.forEach(part => {
            if (part.unlockCondition === "always" && !part.unlocked) {
                part.unlocked = true;
                if (!unlockedParts.includes(part.id)) {
                    unlockedParts.push(part.id);
                }
            }
        });
        
        checkUnlockConditions();
    }

    function getPart(id) {
        return loreParts.find(p => p.id === id);
    }

    function getNextPart(currentId) {
        const currentIndex = loreParts.findIndex(p => p.id === currentId);
        if (currentIndex < loreParts.length - 1) {
            for (let i = currentIndex + 1; i < loreParts.length; i++) {
                if (loreParts[i].unlocked) {
                    return loreParts[i];
                }
            }
        }
        return null;
    }

    function getPrevPart(currentId) {
        const currentIndex = loreParts.findIndex(p => p.id === currentId);
        if (currentIndex > 0) {
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (loreParts[i].unlocked) {
                    return loreParts[i];
                }
            }
        }
        return null;
    }

    function playUnlockSound() {
        try {
            const audio = new Audio(LORE_UNLOCK_SOUND);
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (error) {
            // звук недоступен
        }
    }

    function showLoreNotification(part) {
        const notification = document.createElement('div');
        notification.className = 'lore-notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-scroll"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">📖 НОВАЯ ИСТОРИЯ!</div>
                <div class="notification-text">«${part.title}»</div>
                <div class="notification-subtext">${part.subtitle}</div>
                <div class="notification-hint">Нажмите L или кнопку "История" для чтения</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            });
        }

        setTimeout(() => {
            if (notification.parentNode && notification.classList.contains('show')) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 7000);
    }

    function toggleLoreMenu() {
        if (loreMenuOpen) {
            hideLoreMenu();
        } else {
            showLoreMenu();
        }
    }

    function showLoreMenu() {
        if (loreMenuOpen) return;
        
        checkUnlockConditions();
        
        const part = getPart(currentPart);
        if (!part) {
            currentPart = 1;
            return;
        }

        loreMenuOpen = true;

        const overlay = document.createElement('div');
        overlay.className = 'lore-overlay';
        overlay.id = 'loreOverlay';
        
        const prevPart = getPrevPart(currentPart);
        const nextPart = getNextPart(currentPart);
        
        const progressPct = Math.round((unlockedParts.length / TOTAL_PARTS) * 100);

        overlay.innerHTML = `
            <div class="lore-container">

                <div class="lore-body">
                    <!-- Sidebar: chapter list -->
                    <aside class="lore-sidebar">
                        <div class="lore-sidebar-header">
                            <div class="lore-sidebar-title">Архив</div>
                            <div class="lore-overall-progress">
                                <div class="lore-overall-progress-fill" style="width:${progressPct}%"></div>
                            </div>
                            <div class="lore-progress-label">${unlockedParts.length}/${TOTAL_PARTS} открыто</div>
                        </div>
                        <div class="lore-chapter-list">
                            ${loreParts.map(p => `
                                <div class="lore-chapter-item ${p.unlocked ? '' : 'lore-ch-locked'} ${p.id === currentPart ? 'lore-ch-active' : ''}"
                                     data-id="${p.id}"
                                     title="${p.unlocked ? p.title : 'Заблокировано'}">
                                    <div class="lore-ch-num">
                                        ${p.unlocked ? p.id : '<i class="fas fa-lock" style="font-size:0.55rem"></i>'}
                                    </div>
                                    <div class="lore-ch-info">
                                        <div class="lore-ch-name">${p.unlocked ? p.title : '???'}</div>
                                        <div class="lore-ch-sub">${p.unlocked ? p.subtitle : 'Заблокировано'}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </aside>

                    <!-- Main content -->
                    <div class="lore-content-panel">
                        <div class="lore-header">
                            <div class="lore-header-bg" style="background: ${part.background}"></div>
                            <div class="lore-header-accent"></div>
                            <button class="lore-close-btn" id="loreCloseBtn" title="Закрыть (ESC)">
                                <i class="fas fa-times"></i>
                            </button>
                            <div class="lore-chapter-badge">
                                <i class="fas fa-scroll"></i>
                                Глава ${part.id} / ${TOTAL_PARTS}
                            </div>
                            <div class="lore-title">${part.title}</div>
                            <div class="lore-subtitle">${part.subtitle}</div>
                        </div>

                        <div class="lore-content-scroll">
                            <div class="lore-content lore-content-anim">
                                ${part.content}
                            </div>
                        </div>

                        <div class="lore-nav">
                            <button class="lore-nav-btn" id="lorePrevBtn" ${!prevPart ? 'disabled' : ''}>
                                <i class="fas fa-arrow-left"></i> Назад
                            </button>

                            <div class="lore-nav-center">
                                ${loreParts.map(p => `
                                    <div class="lore-nav-dot ${p.id === currentPart ? 'active' : ''} ${p.unlocked ? 'unlocked' : 'locked'}"
                                         data-id="${p.id}"
                                         title="${p.unlocked ? p.title : 'Заблокировано'}"></div>
                                `).join('')}
                            </div>

                            <button class="lore-nav-btn" id="loreNextBtn" ${!nextPart ? 'disabled' : ''}>
                                Вперёд <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        setupLoreMenuHandlers(overlay);
    }

    function setupLoreMenuHandlers(overlay) {
        overlay.querySelector('#loreCloseBtn')?.addEventListener('click', hideLoreMenu);

        overlay.querySelector('#lorePrevBtn')?.addEventListener('click', () => {
            const prev = getPrevPart(currentPart);
            if (prev) navigateToPart(prev.id);
        });

        overlay.querySelector('#loreNextBtn')?.addEventListener('click', () => {
            const next = getNextPart(currentPart);
            if (next) navigateToPart(next.id);
        });

        // Sidebar chapter items
        overlay.querySelectorAll('.lore-chapter-item:not(.lore-ch-locked)').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                if (id && id !== currentPart) navigateToPart(id);
            });
        });

        // Nav dots
        overlay.querySelectorAll('.lore-nav-dot.unlocked').forEach(dot => {
            dot.addEventListener('click', () => {
                const id = parseInt(dot.dataset.id);
                if (id && id !== currentPart) navigateToPart(id);
            });
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                hideLoreMenu();
            } else if (e.key === 'ArrowLeft') {
                const prev = getPrevPart(currentPart);
                if (prev) navigateToPart(prev.id);
            } else if (e.key === 'ArrowRight') {
                const next = getNextPart(currentPart);
                if (next) navigateToPart(next.id);
            }
        };

        document.addEventListener('keydown', keyHandler);
        overlay._keyHandler = keyHandler;
    }

    function navigateToPart(id) {
        const part = getPart(id);
        if (!part || !part.unlocked) return;

        currentPart = id;
        saveProgress();

        const overlay = document.getElementById('loreOverlay');
        if (!overlay) { showLoreMenu(); return; }

        // Обновляем контент без закрытия/открытия overlay
        const prevPart = getPrevPart(id);
        const nextPart2 = getNextPart(id);

        // Обновить заголовок
        overlay.querySelector('.lore-header-bg').style.background = part.background;
        overlay.querySelector('.lore-chapter-badge').innerHTML =
            `<i class="fas fa-scroll"></i> Глава ${part.id} / ${TOTAL_PARTS}`;
        overlay.querySelector('.lore-title').textContent = part.title;
        overlay.querySelector('.lore-subtitle').textContent = part.subtitle;

        // Обновить контент с анимацией
        const contentEl = overlay.querySelector('.lore-content');
        contentEl.classList.remove('lore-content-anim');
        void contentEl.offsetWidth; // reflow
        contentEl.innerHTML = part.content;
        contentEl.classList.add('lore-content-anim');
        overlay.querySelector('.lore-content-scroll').scrollTop = 0;

        // Кнопки навигации
        overlay.querySelector('#lorePrevBtn').disabled = !prevPart;
        overlay.querySelector('#loreNextBtn').disabled = !nextPart2;

        // Обновить сайдбар
        overlay.querySelectorAll('.lore-chapter-item').forEach(item => {
            const iid = parseInt(item.dataset.id);
            item.classList.toggle('lore-ch-active', iid === id);
        });

        // Обновить точки
        overlay.querySelectorAll('.lore-nav-dot').forEach(dot => {
            const iid = parseInt(dot.dataset.id);
            dot.classList.toggle('active', iid === id);
        });

        // Прокрутить сайдбар к активной главе
        const activeItem = overlay.querySelector('.lore-chapter-item.lore-ch-active');
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function hideLoreMenu() {
        const overlay = document.getElementById('loreOverlay');
        if (!overlay) return;
        
        overlay.classList.remove('active');
        
        if (overlay._keyHandler) {
            document.removeEventListener('keydown', overlay._keyHandler);
        }
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
            loreMenuOpen = false;
        }, 300);
    }

    function updateUIStats() {
        const menuLoreElement = document.getElementById('menuLore');
        if (menuLoreElement) {
            menuLoreElement.textContent = `${unlockedParts.length}/${TOTAL_PARTS}`;
        }
        
        const loreProgressElement = document.getElementById('loreProgress');
        if (loreProgressElement) {
            loreProgressElement.textContent = `${unlockedParts.length}/${TOTAL_PARTS}`;
        }
        
        const loreUnlockedMessage = document.getElementById('loreUnlockedMessage');
        if (loreUnlockedMessage) {
            loreUnlockedMessage.style.display = 'none';
        }
    }

    function checkLevelUnlock(levelNumber) {
        
        loadLevelCompletion();
        
        let unlockedNewPart = false;
        
        for (let i = 0; i < loreParts.length; i++) {
            const part = loreParts[i];
            if (part.unlocked) continue;
            
            const condition = part.unlockCondition;
            
            if (condition.startsWith("level:")) {
                const requiredLevel = parseInt(condition.split(":")[1]);
                if (levelNumber >= requiredLevel) {
                    unlockedNewPart = unlockPart(part.id) || unlockedNewPart;
                }
            }
            else if (condition === "all_levels") {
                if (levelCompletionData.completedLevels >= levelCompletionData.totalLevels) {
                    unlockedNewPart = unlockPart(part.id) || unlockedNewPart;
                }
            }
        }
        
        if (unlockedNewPart) {
            showLoreUnlockedInGame();
        }
        
        return unlockedNewPart;
    }

    function showLoreUnlockedInGame() {
        const loreMessage = document.getElementById('loreUnlockedMessage');
        if (loreMessage) {
            loreMessage.style.display = 'flex';
            loreMessage.innerHTML = `
                <i class="fas fa-scroll"></i> 
                <span>Новая часть истории открыта! Нажмите L для чтения</span>
            `;
            
            setTimeout(() => {
                loreMessage.style.display = 'none';
            }, 5000);
        }
    }

    function getUnlockedParts() {
        return [...unlockedParts];
    }

    function getCurrentPart() {
        return currentPart;
    }

    function setCurrentPart(id) {
        if (id >= 1 && id <= TOTAL_PARTS && unlockedParts.includes(id)) {
            currentPart = id;
            saveProgress();
            return true;
        }
        return false;
    }

    function resetLoreProgress() {
        unlockedParts = [1];
        currentPart = 1;
        loreParts.forEach(part => {
            part.unlocked = part.id === 1;
        });
        saveProgress();
        updateUIStats();
    }

    function forceUnlockAll() {
        for (let i = 1; i <= TOTAL_PARTS; i++) {
            unlockPart(i);
        }
    }

    return {
        init,
        showLoreMenu,
        hideLoreMenu,
        toggleLoreMenu,
        unlockPart,
        checkLevelUnlock,
        getUnlockedCount: () => unlockedParts.length,
        getTotalCount: () => TOTAL_PARTS,
        getProgress: () => Math.round((unlockedParts.length / TOTAL_PARTS) * 100),
        getUnlockedParts,
        getCurrentPart,
        setCurrentPart,
        resetLoreProgress,
        forceUnlockAll,
        updateUIStats,
        checkUnlockConditions
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LORE_MODULE.init());
} else {
    LORE_MODULE.init();
}

// Экспорт для глобального доступа
window.LORE_MODULE = LORE_MODULE;