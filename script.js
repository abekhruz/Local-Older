// ============================================
// ГЛАВНАЯ СТРАНИЦА: ЗАДАНИЯ + БАЛЛЫ + КАРТА + НАГРАДЫ
// ============================================

// ============================================
// ЗАДАНИЯ ДЛЯ ГЛАВНОЙ (3 карточки)
// ============================================
const HOME_TASKS = [
    {
        id: 'park',
        title: 'Уборка в парке',
        desc: 'Присоединяйтесь к субботнику в центральном парке. Соберите мусор и помогите природе.',
        reward: 50,
        current: 12,
        max: 20,
        imgClass: 'img-task-1'
    },
    {
        id: 'tree',
        title: 'Посади дерево',
        desc: 'Посадите свое дерево во дворе или на специальной аллее города.',
        reward: 100,
        current: 45,
        max: 100,
        imgClass: 'img-task-2'
    },
    {
        id: 'nobag',
        title: 'Откажись от пакета',
        desc: 'Используйте многоразовую сумку вместо пластикового пакета в магазине.',
        reward: 20,
        current: 80,
        max: 100,
        imgClass: 'img-task-3'
    }
];

// ============================================
// НАГРАДЫ ДЛЯ ГЛАВНОЙ (2 штуки)
// ============================================
const HOME_REWARDS = [
    {
        id: 'coffee10',
        icon: '☕',
        title: 'Кофейня "Green Bean"',
        desc: 'Скидка 10% за 100 баллов',
        price: 100
    },
    {
        id: 'ecobag',
        icon: '🛍️',
        title: 'Эко-Маркет',
        desc: 'Купон на 50000 сумм за 300 баллов',
        price: 300
    }
];

// ============================================
// ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ (безопасно)
// ============================================
function getSafeUser() {
    if (window.LocalOrder && typeof window.LocalOrder.getCurrentUser === 'function') {
        return window.LocalOrder.getCurrentUser();
    }
    return null;
}

// ============================================
// РЕНДЕР ЗАДАНИЙ НА ГЛАВНОЙ
// ============================================
function renderHomeTasks() {
    const container = document.getElementById('home-tasks-grid');
    if (!container) return;

    const user = getSafeUser();
    const completed = user?.completedTasks || [];

    container.innerHTML = HOME_TASKS.map(task => {
        const isDone = completed.includes(task.id);
        const progressPercent = Math.round((task.current / task.max) * 100);

        return `
            <div class="card">
                <div class="card-img ${task.imgClass}"></div>
                <div class="card-content">
                    <h3>${task.title}</h3>
                    <p>${task.desc}</p>
                    <div class="progress-container">
                        <div class="progress-info">
                            <span>Участники</span>
                            <span>${task.current}/${task.max}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="points-reward">+${task.reward} баллов</span>
                        ${isDone
                            ? `<button class="action-btn done" disabled><i class="fa-solid fa-check"></i> Выполнено</button>`
                            : `<button class="action-btn" onclick="completeHomeTask('${task.id}')">Участвовать</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// ВЫПОЛНЕНИЕ ЗАДАНИЯ НА ГЛАВНОЙ
// ============================================
window.completeHomeTask = function(taskId) {
    const user = getSafeUser();

    if (!user) {
        alert('Войдите в аккаунт, чтобы выполнить задание');
        if (window.LocalOrder) window.LocalOrder.openAuthModal('login');
        return;
    }

    const task = HOME_TASKS.find(t => t.id === taskId);
    if (!task) return;

    // Проверка повтора
    user.completedTasks = user.completedTasks || [];
    if (user.completedTasks.includes(task.id)) {
        alert('Это задание уже выполнено');
        return;
    }

    // Начисляем баллы
    user.points = (user.points || 0) + task.reward;
    user.completedTasks.push(task.id);

    // Запись в историю
    user.taskHistory = user.taskHistory || [];
    user.taskHistory.unshift({
        taskId: task.id,
        title: task.title,
        reward: task.reward,
        date: new Date().toISOString()
    });

    // Сохраняем
    window.LocalOrder.updateUser(user);

    // Обновляем UI
    renderHomeTasks();
    updateHomeBalance();

    // Обновляем шапку
    if (typeof renderAuthArea === 'function') renderAuthArea();

    alert(`🎉 Задание "${task.title}" выполнено!\n+${task.reward} баллов`);
};

// ============================================
// БАЛАНС НА ГЛАВНОЙ
// ============================================
function updateHomeBalance() {
    const pointsEl = document.getElementById('user-points');
    if (!pointsEl) return;

    const user = getSafeUser();
    pointsEl.textContent = user?.points || 0;
}

// ============================================
// НАГРАДЫ НА ГЛАВНОЙ
// ============================================
function renderHomeRewards() {
    const container = document.getElementById('home-rewards-list');
    if (!container) return;

    const user = getSafeUser();
    const userPoints = user?.points || 0;

    container.innerHTML = HOME_REWARDS.map(r => {
        const progressPercent = Math.min((userPoints / r.price) * 100, 100);

        return `
            <div class="home-reward-item">
                <div class="home-reward-icon">${r.icon}</div>
                <div class="home-reward-info">
                    <div class="home-reward-title">${r.title}</div>
                    <div class="home-reward-partner">${r.desc}</div>
                    <div class="home-reward-progress">
                        <div class="home-reward-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
                <div class="home-reward-price">${r.price} 💎</div>
            </div>
        `;
    }).join('');
}

// ============================================
// САЙДБАР: АККОРДЕОН
// ============================================
function initSidebar() {
    const menuBlocks = document.querySelectorAll('.menu-block');
    if (!menuBlocks.length) return;

    menuBlocks.forEach(block => {
        const header = block.querySelector('.menu-item');
        if (!header) return;

        header.addEventListener('click', () => {
            menuBlocks.forEach(b => {
                if (b !== block) b.classList.remove('open');
            });

            block.classList.toggle('open');

            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            header.classList.add('active');
        });
    });
}

// ============================================
// КНОПКА "НАЙТИ ПУНКТ ПРИЕМА" — СКРОЛЛ К КАРТЕ
// ============================================
function initCtaButton() {
    const ctaBtn = document.querySelector('.cta-btn');
    const mapSection = document.querySelector('.map-container');

    if (ctaBtn && mapSection) {
        ctaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mapSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// ============================================
// КАРТА LEAFLET
// ============================================
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Проверка, не инициализирована ли карта
    if (mapContainer._leaflet_id) return;

    // Проверка, что Leaflet загружен
    if (typeof L === 'undefined') return;

    const map = L.map('map').setView([41.311151, 69.279737], 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Функция красивой метки
    function createIcon(color) {
        return L.divIcon({
            className: '',
            html: `
                <div style="
                    position: relative;
                    width: 32px;
                    height: 44px;
                    filter: drop-shadow(0 6px 6px rgba(0,0,0,0.35));
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 32px;
                        height: 32px;
                        background: radial-gradient(circle at 30% 25%, ${color}dd 0%, ${color} 45%, ${color} 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 15px;
                        color: white;
                        box-shadow: inset 0 -3px 6px rgba(0,0,0,0.15);
                    ">
                        <div style="
                            position: absolute;
                            top: 4px;
                            left: 6px;
                            width: 12px;
                            height: 8px;
                            background: rgba(255,255,255,0.55);
                            border-radius: 50%;
                            filter: blur(1.5px);
                        "></div>
                        ♻️
                    </div>
                    <div style="
                        position: absolute;
                        top: 26px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 9px solid transparent;
                        border-right: 9px solid transparent;
                        border-top: 16px solid ${color};
                    "></div>
                </div>
            `,
            iconSize: [32, 44],
            iconAnchor: [16, 44],
            popupAnchor: [0, -44]
        });
    }

    // Метки пунктов приёма
    L.marker([41.2794, 69.2032], { icon: createIcon('#4caf50') })
        .addTo(map)
        .bindPopup('<b>♻️ Фандомат (Чиланзар)</b><br>ул. Бунёдкор, 7А<br>Пластик, стекло, алюминий');

    L.marker([41.2680, 69.3121], { icon: createIcon('#2e7d32') })
        .addTo(map)
        .bindPopup('<b>♻️ Пункт приема (Мирабад)</b><br>Eski Otchopar 1, 2<br>Вторсырье, металлолом');

    L.marker([41.2215, 69.2226], { icon: createIcon('#4caf50') })
        .addTo(map)
        .bindPopup('<b>♻️ Hashar Week (Сергели)</b><br>ул. Янги Сергели, 127<br>Макулатура, ПЭТ');

    L.marker([41.1913, 69.2373], { icon: createIcon('#2e7d32') })
        .addTo(map)
        .bindPopup('<b>♻️ Узвторцветмет (Яшнабад)</b><br>Макулатура, вторсырье');

    L.marker([41.3560, 69.2880], { icon: createIcon('#4caf50') })
        .addTo(map)
        .bindPopup('<b>♻️ Пункт приема (Юнусабад)</b><br>Бумага, картон, пластик');
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Ждём загрузки auth.js (небольшая задержка)
    setTimeout(() => {
        initSidebar();
        initCtaButton();
        renderHomeTasks();
        updateHomeBalance();
        renderHomeRewards();
        initMap();
    }, 50);

    // Обновление при изменениях в других вкладках
    window.addEventListener('storage', () => {
        renderHomeTasks();
        updateHomeBalance();
        renderHomeRewards();
    });
});