// ============================================
// СТРАНИЦА ПРОФИЛЯ
// ============================================

const POINTS_PER_KG = {
    plastic: 30,
    paper: 20,
    glass: 15,
    batteries: 40,
    clothes: 25
};

const CATEGORY_NAMES = {
    plastic: { name: 'Пластик', emoji: '🧴' },
    paper: { name: 'Бумага', emoji: '📄' },
    glass: { name: 'Стекло', emoji: '🍾' },
    batteries: { name: 'Батарейки', emoji: '🔋' },
    clothes: { name: 'Одежда', emoji: '👕' }
};

document.addEventListener('DOMContentLoaded', () => {
    const user = window.LocalOrder.getCurrentUser();

    // Если не залогинен — редирект
    if (!user) {
        alert('Войдите в аккаунт, чтобы открыть профиль');
        window.location.href = 'index.html';
        return;
    }

    // ============================================
    // 1. ЗАПОЛНЕНИЕ ПРОФИЛЯ
    // ============================================
    document.getElementById('profile-avatar').textContent = user.avatar || '🌱';
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-points').textContent = user.points || 0;

    // Дата регистрации
    if (user.registeredAt) {
        const regDate = new Date(user.registeredAt);
        document.getElementById('profile-since').textContent = regDate.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    } else {
        document.getElementById('profile-since').textContent = 'недавно';
    }

    // ============================================
    // 2. ИСТОРИЯ СДАЧ
    // ============================================
    renderHistory(user);

    // ============================================
    // 3. МОДАЛКА СДАЧИ
    // ============================================
    const recycleModal = document.getElementById('recycle-modal');
    const btnRecycle = document.getElementById('btn-recycle');

    btnRecycle.addEventListener('click', () => {
        recycleModal.classList.add('open');
        document.getElementById('recycle-error').textContent = '';
    });

    document.getElementById('recycle-close').addEventListener('click', () => {
        recycleModal.classList.remove('open');
    });

    recycleModal.addEventListener('click', (e) => {
        if (e.target === recycleModal) recycleModal.classList.remove('open');
    });

    // Отправка формы сдачи
    document.getElementById('recycle-submit').addEventListener('click', () => {
        const category = document.getElementById('recycle-category').value;
        const weight = parseFloat(document.getElementById('recycle-weight').value);
        const err = document.getElementById('recycle-error');

        if (!weight || weight <= 0) {
            err.textContent = 'Укажите корректный вес';
            return;
        }
        if (weight > 1000) {
            err.textContent = 'Слишком большой вес (макс. 1000 кг)';
            return;
        }

        const points = Math.round(weight * POINTS_PER_KG[category]);

        // Обновляем пользователя
        const freshUser = window.LocalOrder.getCurrentUser();
        freshUser.points = (freshUser.points || 0) + points;
        freshUser.history = freshUser.history || [];
        freshUser.history.unshift({
            category,
            weight,
            points,
            date: new Date().toISOString()
        });

        window.LocalOrder.updateUser(freshUser);

        // Обновляем UI
        document.getElementById('profile-points').textContent = freshUser.points;
        renderHistory(freshUser);

        // Обновляем шапку (баллы в меню)
        if (typeof renderAuthArea === 'function') {
            renderAuthArea();
        }

        // Закрываем модалку
        recycleModal.classList.remove('open');
        document.getElementById('recycle-weight').value = 1;

        // Уведомление
        const cat = CATEGORY_NAMES[category];
        alert(`✅ ${cat.emoji} Сдано ${weight} кг.\n+${points} баллов!`);
    });

    // Кнопка "Мои задания" — переход на страницу заданий
    document.getElementById('btn-tasks').addEventListener('click', () => {
        window.location.href = 'tasks.html';
    });

    // ============================================
    // 4. РЕФЕРАЛЬНАЯ СИСТЕМА
    // ============================================
    setupReferralBlock(user);

    // ============================================
    // 5. СТАТИСТИКА (дополнительные метрики)
    // ============================================
    renderStats(user);
});

// ============================================
// РЕНДЕР ИСТОРИИ СДАЧ
// ============================================
function renderHistory(user) {
    const container = document.getElementById('history-list');
    if (!container) return;

    const history = user.history || [];

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>Пока ничего не сдано</p>
                <span>Нажмите "Сдать вторсырьё", чтобы начать</span>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(item => {
        const cat = CATEGORY_NAMES[item.category] || { name: 'Прочее', emoji: '♻️' };
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="history-item">
                <div class="history-icon">${cat.emoji}</div>
                <div class="history-info">
                    <div class="history-title">${cat.name}</div>
                    <div class="history-meta">${item.weight} кг · ${dateStr}</div>
                </div>
                <div class="history-points">+${item.points} 💎</div>
            </div>
        `;
    }).join('');
}

// ============================================
// РЕФЕРАЛЬНАЯ СИСТЕМА
// ============================================
function setupReferralBlock(user) {
    // Обновляем данные пользователя
    const freshUser = window.LocalOrder.getCurrentUser();

    if (!freshUser.refCode) {
        // Если у старого пользователя нет кода — генерируем
        const clean = (freshUser.name || 'USER').replace(/[^a-zA-Zа-яА-Я]/g, '').slice(0, 4).toUpperCase() || 'ECO';
        const num = Math.floor(1000 + Math.random() * 9000);
        freshUser.refCode = clean + num;
        freshUser.invitedFriends = freshUser.invitedFriends || [];
        window.LocalOrder.updateUser(freshUser);
    }

    const refCode = freshUser.refCode;

    // Отображаем код
    const codeEl = document.getElementById('my-ref-code');
    if (codeEl) codeEl.textContent = refCode;

    // Формируем ссылку
    const baseURL = window.location.href.replace(/[^/]*$/, 'index.html');
    const inviteLink = `${baseURL}?ref=${refCode}`;

    const linkInput = document.getElementById('invite-link');
    if (linkInput) linkInput.value = inviteLink;

    // Кнопка копирования
    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const input = document.getElementById('invite-link');
            input.select();
            input.setSelectionRange(0, 99999);

            // Современный API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(input.value).then(() => showCopied(copyBtn));
            } else {
                // Fallback для старых браузеров
                document.execCommand('copy');
                showCopied(copyBtn);
            }
        });
    }

    // Статистика приглашений
    const invited = freshUser.invitedFriends || [];
    const countEl = document.getElementById('invited-count');
    const bonusEl = document.getElementById('invited-bonus');

    if (countEl) countEl.textContent = invited.length;
    if (bonusEl) bonusEl.textContent = invited.length * 200;
}

function showCopied(btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Скопировано!';
    btn.style.background = '#4caf50';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
}

// ============================================
// ДОПОЛНИТЕЛЬНАЯ СТАТИСТИКА
// ============================================
function renderStats(user) {
    const statsContainer = document.getElementById('profile-stats');
    if (!statsContainer) return;

    const history = user.history || [];

    // Считаем общий вес и сдачи
    const totalWeight = history.reduce((sum, h) => sum + (h.weight || 0), 0);
    const totalItems = history.length;
    const uniqueCategories = new Set(history.map(h => h.category)).size;

    // Любимая категория
    const categoryCount = {};
    history.forEach(h => {
        categoryCount[h.category] = (categoryCount[h.category] || 0) + h.weight;
    });
    let favCategory = null;
    let maxWeight = 0;
    Object.entries(categoryCount).forEach(([cat, weight]) => {
        if (weight > maxWeight) {
            maxWeight = weight;
            favCategory = cat;
        }
    });

    const favCatInfo = favCategory ? CATEGORY_NAMES[favCategory] : null;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">⚖️</div>
            <div class="stat-value">${totalWeight.toFixed(1)} кг</div>
            <div class="stat-label">Всего сдано</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value">${totalItems}</div>
            <div class="stat-label">Сдач</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">♻️</div>
            <div class="stat-value">${uniqueCategories}/5</div>
            <div class="stat-label">Категорий</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">${favCatInfo ? favCatInfo.emoji : '❓'}</div>
            <div class="stat-value">${favCatInfo ? favCatInfo.name : '—'}</div>
            <div class="stat-label">Любимая</div>
        </div>
    `;
}