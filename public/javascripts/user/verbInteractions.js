// Класс для работы с пользовательскими действиями на глаголах
class VerbInteractions {
    constructor() {
        this.token = localStorage.getItem('token');
        this.isAuthenticated = !!this.token;
        this.favoriteStatuses = new Map(); // Кэш статусов избранного
        this.userLists = []; // Кэш списков пользователя
        
        this.init();
    }

    init() {
        console.log('VerbInteractions init:', { 
            token: this.token ? 'Present' : 'Missing', 
            isAuthenticated: this.isAuthenticated 
        });
        
        if (this.isAuthenticated) {
            this.showUserActions();
            this.loadUserLists();
            this.bindEvents();
            this.loadFavoriteStatuses();
        } else {
            console.log('User not authenticated, hiding user actions');
            this.hideUserActions();
        }
    }

    // Показать кнопки пользователя на всех карточках
    showUserActions() {
        console.log('Showing user actions...');
        const userActionElements = document.querySelectorAll('.card-user-actions, .card-user-actions-back');
        console.log('Found user action elements:', userActionElements.length);
        userActionElements.forEach(element => {
            element.style.display = 'block';
        });
    }

    // Скрыть кнопки пользователя на всех карточках
    hideUserActions() {
        const userActionElements = document.querySelectorAll('.card-user-actions, .card-user-actions-back');
        userActionElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    // Привязка событий
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="toggle-favorite"]')) {
                e.preventDefault();
                this.handleFavoriteToggle(e.target.closest('[data-action="toggle-favorite"]'));
            }
            
            if (e.target.closest('[data-action="add-to-list"]')) {
                e.preventDefault();
                this.handleAddToList(e.target.closest('[data-action="add-to-list"]'));
            }
        });
    }

    // Загрузить списки пользователя
    async loadUserLists() {
        try {
            const response = await fetch('/user/lists', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.userLists = data.lists || [];
            }
        } catch (error) {
            console.error('Error loading user lists:', error);
        }
    }

    // Валидация данных карточки глагола
    validateCardData(card) {
        const letter = card.dataset.letter;
        const verbId = card.dataset.verbId;
        const verbText = card.dataset.verb;

        if (!letter || !verbText) {
            throw new Error('Недостаточно данных о глаголе');
        }

        if (!verbId || verbId === 'undefined' || verbId === 'null') {
            throw new Error('Идентификатор глагола не найден');
        }

        const parsedVerbId = parseInt(verbId);
        if (isNaN(parsedVerbId) || parsedVerbId < 0) {
            throw new Error('Неверный идентификатор глагола');
        }

        return {
            letter: letter.toLowerCase(),
            verbId: parsedVerbId,
            verbText: verbText.toLowerCase()
        };
    }

    // Загрузить статусы избранного для всех видимых глаголов
    async loadFavoriteStatuses() {
        const cards = document.querySelectorAll('.card[data-verb]');
        const validVerbs = [];

        // Валидируем и собираем данные о глаголах
        for (const card of cards) {
            try {
                const verbData = this.validateCardData(card);
                validVerbs.push(verbData);
            } catch (error) {
                console.warn('Пропускаем карточку глагола:', error.message, card);
                continue;
            }
        }

        if (validVerbs.length === 0) return;

        try {
            // Проверяем статус избранного для всех валидных глаголов
            const promises = validVerbs.map(verb => 
                this.checkFavoriteStatus(verb.letter, verb.verbId, verb.verbText)
            );
            
            await Promise.all(promises);
            this.updateFavoriteUI();
        } catch (error) {
            console.error('Error loading favorite statuses:', error);
        }
    }

    // Проверить статус избранного для конкретного глагола
    async checkFavoriteStatus(letter, verbId, verbText) {
        try {
            const response = await fetch(`/user/favorites/check?letter=${letter}&verbId=${verbId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const key = `${letter}-${verbId}`;
                this.favoriteStatuses.set(key, data.isFavorite);
            } else {
                console.warn(`Failed to check favorite status for ${verbText}:`, response.status);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    }

    // Обновить UI кнопок избранного
    updateFavoriteUI() {
        const cards = document.querySelectorAll('.card[data-verb]');
        cards.forEach(card => {
            try {
                const { letter, verbId } = this.validateCardData(card);
                const key = `${letter}-${verbId}`;
                const isFavorite = this.favoriteStatuses.get(key);
                
                if (isFavorite !== undefined) {
                    const favoriteButtons = card.querySelectorAll('[data-action="toggle-favorite"]');
                    favoriteButtons.forEach(btn => {
                        const icon = btn.querySelector('i');
                        const text = btn.querySelector('.btn-text');
                        
                        if (isFavorite) {
                            btn.classList.add('active');
                            if (icon) icon.className = 'fas fa-heart';
                            if (text) text.textContent = 'Убрать из избранного';
                            btn.title = 'Убрать из избранного';
                        } else {
                            btn.classList.remove('active');
                            if (icon) icon.className = 'far fa-heart';
                            if (text) text.textContent = 'В избранное';
                            btn.title = 'Добавить в избранное';
                        }
                    });
                }
            } catch (error) {
                console.warn('Ошибка обновления UI для карточки:', error.message);
            }
        });
    }

    // Обработка переключения избранного
    async handleFavoriteToggle(button) {
        const card = button.closest('.card');
        
        try {
            const { letter, verbId, verbText } = this.validateCardData(card);
            const key = `${letter}-${verbId}`;
            const isFavorite = this.favoriteStatuses.get(key);
            
            // Показываем состояние загрузки
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.disabled = true;

            let response;
            if (isFavorite) {
                // Удаляем из избранного
                response = await fetch('/user/favorites/remove', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ letter, verbId })
                });
            } else {
                // Добавляем в избранное
                response = await fetch('/user/favorites/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ letter, verbId, verbText })
                });
            }

            if (response.ok) {
                // Обновляем статус в кэше
                this.favoriteStatuses.set(key, !isFavorite);
                this.updateFavoriteUI();
                
                // Показываем уведомление
                this.showNotification(
                    isFavorite ? 'Глагол удален из избранного' : 'Глагол добавлен в избранное',
                    'success'
                );
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера (${response.status})`);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showNotification(
                error.message || 'Произошла ошибка при обработке избранного', 
                'error'
            );
        } finally {
            // Восстанавливаем кнопку
            button.disabled = false;
            this.updateFavoriteUI(); // Восстановит правильный вид кнопки
        }
    }

    // Обработка добавления в список
    async handleAddToList(button) {
        const card = button.closest('.card');
        
        try {
            const { letter, verbId, verbText } = this.validateCardData(card);
            
            if (this.userLists.length === 0) {
                this.showNotification('У вас нет списков. Создайте список сначала.', 'warning');
                return;
            }

            // Показываем модальное окно выбора списка
            this.showListSelectionModal(letter, verbId, verbText);
        } catch (error) {
            console.error('Error handling add to list:', error);
            this.showNotification(
                error.message || 'Ошибка при добавлении в список', 
                'error'
            );
        }
    }

    // Показать модальное окно выбора списка
    showListSelectionModal(letter, verbId, verbText) {
        // Создаем модальное окно динамически
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить "${verbText}" в список</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="lists-selection">
                        ${this.userLists.length > 0 ? 
                            this.userLists.map(list => `
                                <div class="list-option" data-list-id="${list._id}">
                                    <span class="list-name">${list.name}</span>
                                    <span class="list-count">${list.itemCount || 0} глаголов</span>
                                </div>
                            `).join('') :
                            '<p>У вас пока нет списков. <a href="/user/lists">Создать первый список</a></p>'
                        }
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary close-modal">Отмена</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики событий для модального окна
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Обработчик выбора списка
        modal.querySelectorAll('.list-option').forEach(option => {
            option.addEventListener('click', async () => {
                const listId = option.dataset.listId;
                await this.addVerbToList(listId, letter, verbId, verbText);
                document.body.removeChild(modal);
            });
        });
    }

    // Добавить глагол в конкретный список
    async addVerbToList(listId, letter, verbId, verbText) {
        try {
            const response = await fetch(`/user/lists/${listId}/verbs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ letter, verbId, verbText })
            });

            if (response.ok) {
                this.showNotification('Глагол добавлен в список', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка добавления в список');
            }
        } catch (error) {
            console.error('Error adding to list:', error);
            this.showNotification(error.message || 'Произошла ошибка', 'error');
        }
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Добавляем стили если их нет
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 16px;
                    border-radius: 4px;
                    color: white;
                    z-index: 1000;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { background-color: #28a745; }
                .notification-error { background-color: #dc3545; }
                .notification-warning { background-color: #ffc107; color: #212529; }
                .notification-info { background-color: #007bff; }
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Добавляем на страницу
        document.body.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        const autoRemove = setTimeout(() => {
            notification.remove();
        }, 5000);

        // Удаление по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.remove();
        });
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing VerbInteractions...');
    window.verbInteractions = new VerbInteractions();
}); 