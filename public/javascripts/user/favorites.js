class FavoritesPage {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentSort = 'recent';
        this.currentSearch = '';
        this.currentLetter = 'all';
        this.bulkMode = false;
        this.selectedFavorites = new Set();
        this.allFavorites = [];
        this.letterStats = [];
        
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '/auth/login';
            return;
        }

        this.bindEvents();
        this.loadStats();
        this.loadFavorites();
    }

    bindEvents() {
        // Поиск
        const searchInput = document.getElementById('favorites-search');
        const searchBtn = document.getElementById('search-btn');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        
        searchBtn?.addEventListener('click', () => this.performSearch());
        clearSearchBtn?.addEventListener('click', () => this.clearSearch());

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        searchInput?.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                this.clearSearch();
            }
        });

        // Сортировка
        const sortSelect = document.getElementById('sort-select');
        sortSelect?.addEventListener('change', () => {
            this.currentSort = sortSelect.value;
            this.currentPage = 1;
            this.loadFavorites();
        });

        // Массовые операции
        document.getElementById('toggle-bulk-mode')?.addEventListener('click', () => {
            this.toggleBulkMode();
        });

        document.getElementById('select-all-btn')?.addEventListener('click', () => {
            this.selectAllVisible();
        });

        document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
            this.deselectAll();
        });

        document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
            this.showBulkDeleteModal();
        });

        // Модальные окна
        this.bindModalEvents();

        // Обновление
        document.getElementById('refresh-favorites')?.addEventListener('click', () => {
            this.loadStats();
            this.loadFavorites();
        });

        // Очистка всех фильтров
        document.getElementById('clear-all-filters')?.addEventListener('click', () => {
            this.clearAllFilters();
        });
    }

    bindModalEvents() {
        // Модальное окно массового удаления
        const bulkDeleteModal = document.getElementById('bulk-delete-modal');
        const confirmBtn = document.getElementById('confirm-bulk-delete');
        
        // Закрытие модального окна
        bulkDeleteModal?.querySelectorAll('.close, .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                bulkDeleteModal.style.display = 'none';
            });
        });

        // Подтверждение удаления
        confirmBtn?.addEventListener('click', () => {
            this.performBulkDelete();
            bulkDeleteModal.style.display = 'none';
        });

        // Закрытие по клику вне модального окна
        bulkDeleteModal?.addEventListener('click', (e) => {
            if (e.target === bulkDeleteModal) {
                bulkDeleteModal.style.display = 'none';
            }
        });
    }

    performSearch() {
        const searchInput = document.getElementById('favorites-search');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        
        this.currentSearch = searchInput.value.trim();
        this.currentPage = 1;
        
        if (this.currentSearch) {
            clearSearchBtn.style.display = 'inline-flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        this.loadFavorites();
    }

    clearSearch() {
        const searchInput = document.getElementById('favorites-search');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        
        searchInput.value = '';
        this.currentSearch = '';
        this.currentPage = 1;
        clearSearchBtn.style.display = 'none';
        
        this.loadFavorites();
    }

    clearAllFilters() {
        this.clearSearch();
        this.currentLetter = 'all';
        this.currentSort = 'recent';
        
        // Обновляем UI
        document.getElementById('sort-select').value = 'recent';
        this.updateLetterButtons();
        
        this.loadFavorites();
    }

    async loadStats() {
        try {
            const response = await fetch('/user/favorites/stats', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateHeaderStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateHeaderStats(stats) {
        document.getElementById('total-favorites-count').textContent = stats.total || 0;
        document.getElementById('recent-favorites-count').textContent = stats.recentlyAdded || 0;
        document.getElementById('letter-count').textContent = stats.byLetter?.length || 0;
    }

    async loadFavorites() {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: this.currentSort
            });

            if (this.currentSearch) {
                params.append('search', this.currentSearch);
            }

            if (this.currentLetter !== 'all') {
                params.append('letter', this.currentLetter);
            }

            const response = await fetch(`/user/favorites?${params}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки избранного');
            }

            const data = await response.json();
            this.allFavorites = data.favorites;
            this.letterStats = data.letterStats || [];
            
            this.renderFavorites(data);
            this.updateStats(data.pagination);
            this.updateLetterFilter(data.letterStats);
            this.updateFilterInfo(data.filters);
            
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showError('Ошибка загрузки избранного');
        } finally {
            this.showLoading(false);
        }
    }

    updateLetterFilter(letterStats) {
        const container = document.getElementById('letter-filter-buttons');
        if (!container) return;

        // Очищаем существующие кнопки (кроме "Все")
        const allBtn = container.querySelector('[data-letter="all"]');
        container.innerHTML = '';
        container.appendChild(allBtn);

        // Добавляем кнопки для букв с глаголами
        letterStats.forEach(stat => {
            const btn = document.createElement('button');
            btn.className = `letter-btn has-verbs ${this.currentLetter === stat.letter ? 'active' : ''}`;
            btn.dataset.letter = stat.letter;
            btn.innerHTML = `${stat.letter.toUpperCase()} <span class="count">(${stat.count})</span>`;
            
            btn.addEventListener('click', () => {
                this.currentLetter = stat.letter;
                this.currentPage = 1;
                this.updateLetterButtons();
                this.loadFavorites();
            });
            
            container.appendChild(btn);
        });

        // Обновляем кнопку "Все"
        allBtn.addEventListener('click', () => {
            this.currentLetter = 'all';
            this.currentPage = 1;
            this.updateLetterButtons();
            this.loadFavorites();
        });

        this.updateLetterButtons();
    }

    updateLetterButtons() {
        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.letter === this.currentLetter);
        });
    }

    updateFilterInfo(filters) {
        const infoElement = document.getElementById('current-filter-info');
        if (!infoElement) return;

        let info = 'Показаны ';
        
        if (filters.letter !== 'all') {
            info += `глаголы на букву "${filters.letter.toUpperCase()}"`;
        } else {
            info += 'все глаголы';
        }

        if (filters.search) {
            info += ` по запросу "${filters.search}"`;
        }

        if (filters.sort === 'alphabetical') {
            info += ' (по алфавиту)';
        } else if (filters.sort === 'oldest') {
            info += ' (сначала старые)';
        }

        infoElement.textContent = info;
    }

    renderFavorites(data) {
        const container = document.getElementById('favorites-list');
        const emptyState = document.getElementById('empty-favorites');
        const noResults = document.getElementById('no-search-results');
        const content = document.getElementById('favorites-content');

        // Скрываем все состояния
        content.style.display = 'block';
        emptyState.style.display = 'none';
        noResults.style.display = 'none';

        if (!data.favorites || data.favorites.length === 0) {
            content.style.display = 'none';
            
            // Показываем подходящее пустое состояние
            if (this.currentSearch || this.currentLetter !== 'all') {
                noResults.style.display = 'block';
            } else {
                emptyState.style.display = 'block';
            }
            return;
        }

        container.innerHTML = data.favorites.map(favorite => this.renderFavoriteCard(favorite)).join('');

        // Привязываем события для карточек
        this.bindCardEvents(container);
        
        // Рендерим пагинацию
        this.renderPagination(data.pagination);
    }

    renderFavoriteCard(favorite) {
        const isSelected = this.selectedFavorites.has(`${favorite.letter}-${favorite.verbId}`);
        const checkboxHtml = this.bulkMode ? 
            `<input type="checkbox" class="card-checkbox" ${isSelected ? 'checked' : ''} 
                    data-letter="${favorite.letter}" data-verb-id="${favorite.verbId}">` : '';

        return `
            <div class="favorite-card ${isSelected ? 'selected' : ''}" 
                 data-letter="${favorite.letter}" 
                 data-verb-id="${favorite.verbId}">
                ${checkboxHtml}
                <div class="card-content">
                    <h3 class="verb-text">${favorite.verbText}</h3>
                    <p class="verb-translation">${favorite.translation || 'Перевод недоступен'}</p>
                    <div class="card-meta">
                        <div>
                            <i class="fas fa-calendar-plus"></i> 
                            Добавлено: ${new Date(favorite.addedAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div>
                            <i class="fas fa-font"></i> 
                            Буква: ${favorite.letter.toUpperCase()}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <a href="/verbs/${favorite.letter}/${favorite.verbText}" 
                       class="btn btn-primary btn-sm">
                        <i class="fas fa-eye"></i> Открыть
                    </a>
                    ${!this.bulkMode ? `
                        <button class="btn btn-danger btn-sm remove-favorite" 
                                data-letter="${favorite.letter}" 
                                data-verb-id="${favorite.verbId}">
                            <i class="fas fa-heart-broken"></i> Удалить
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    bindCardEvents(container) {
        // События удаления отдельных глаголов
        container.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const letter = e.target.closest('.remove-favorite').dataset.letter;
                const verbId = parseInt(e.target.closest('.remove-favorite').dataset.verbId);
                this.removeFavorite(letter, verbId);
            });
        });

        // События чекбоксов для массовых операций
        if (this.bulkMode) {
            container.querySelectorAll('.card-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const letter = e.target.dataset.letter;
                    const verbId = e.target.dataset.verbId;
                    const key = `${letter}-${verbId}`;
                    
                    if (e.target.checked) {
                        this.selectedFavorites.add(key);
                        e.target.closest('.favorite-card').classList.add('selected');
                    } else {
                        this.selectedFavorites.delete(key);
                        e.target.closest('.favorite-card').classList.remove('selected');
                    }
                    
                    this.updateBulkControls();
                });
            });
        }
    }

    toggleBulkMode() {
        this.bulkMode = !this.bulkMode;
        this.selectedFavorites.clear();
        
        const bulkOperations = document.getElementById('bulk-operations');
        const toggleBtn = document.getElementById('toggle-bulk-mode');
        
        if (this.bulkMode) {
            bulkOperations.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-times"></i> Отменить режим';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-outline');
        } else {
            bulkOperations.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-tasks"></i> Массовые операции';
            toggleBtn.classList.remove('btn-outline');
            toggleBtn.classList.add('btn-secondary');
        }
        
        // Перерендериваем карточки
        this.renderFavoritesFromCache();
    }

    selectAllVisible() {
        this.allFavorites.forEach(favorite => {
            const key = `${favorite.letter}-${favorite.verbId}`;
            this.selectedFavorites.add(key);
        });
        
        this.renderFavoritesFromCache();
        this.updateBulkControls();
    }

    deselectAll() {
        this.selectedFavorites.clear();
        this.renderFavoritesFromCache();
        this.updateBulkControls();
    }

    updateBulkControls() {
        const selectedCount = this.selectedFavorites.size;
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const selectedCountSpan = document.getElementById('selected-count');
        
        selectedCountSpan.textContent = selectedCount;
        bulkDeleteBtn.disabled = selectedCount === 0;
    }

    showBulkDeleteModal() {
        const modal = document.getElementById('bulk-delete-modal');
        const countText = document.getElementById('delete-count-text');
        
        countText.textContent = this.selectedFavorites.size;
        modal.style.display = 'flex';
    }

    async performBulkDelete() {
        try {
            const favoriteIds = Array.from(this.selectedFavorites).map(key => {
                const [letter, verbId] = key.split('-');
                return { letter, verbId: parseInt(verbId) };
            });

            const response = await fetch('/user/favorites/bulk-remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ favoriteIds })
            });

            if (response.ok) {
                const data = await response.json();
                this.selectedFavorites.clear();
                this.loadStats();
                this.loadFavorites();
                this.showNotification(`Удалено ${data.deletedCount} глаголов из избранного`, 'success');
            } else {
                throw new Error('Ошибка массового удаления');
            }
        } catch (error) {
            console.error('Error bulk deleting favorites:', error);
            this.showNotification('Ошибка при массовом удалении', 'error');
        }
    }

    renderFavoritesFromCache() {
        if (this.allFavorites.length > 0) {
            const container = document.getElementById('favorites-list');
            container.innerHTML = this.allFavorites.map(favorite => this.renderFavoriteCard(favorite)).join('');
            this.bindCardEvents(container);
        }
    }

    renderPagination(pagination) {
        const container = document.getElementById('favorites-pagination');
        
        if (!pagination || pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = pagination.currentPage;
        const totalPages = pagination.totalPages;
        
        let paginationHTML = '<div class="pagination">';
        
        // Предыдущая страница
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Назад
            </button>`;
        }

        // Номера страниц
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>`;
        }

        // Следующая страница
        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}">
                Вперед <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;

        // Привязываем события пагинации
        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPage = parseInt(btn.dataset.page);
                this.loadFavorites();
            });
        });
    }

    async removeFavorite(letter, verbId) {
        try {
            const response = await fetch('/user/favorites/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ letter, verbId })
            });

            if (response.ok) {
                this.loadStats();
                this.loadFavorites(); // Перезагружаем список
                this.showNotification('Глагол удален из избранного', 'success');
            } else {
                throw new Error('Ошибка удаления');
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            this.showNotification('Ошибка удаления из избранного', 'error');
        }
    }

    updateStats(pagination) {
        const totalCountElement = document.getElementById('total-count');
        if (totalCountElement && pagination) {
            totalCountElement.textContent = pagination.totalFavorites || 0;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('favorites-loading');
        const content = document.getElementById('favorites-content');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (content) content.style.display = show ? 'none' : 'block';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

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
                    border-radius: 6px;
                    color: white;
                    z-index: 1001;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
                    opacity: 0.8;
                }
                .notification-close:hover {
                    opacity: 1;
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
    console.log('DOM loaded, initializing FavoritesPage...');
    window.favoritesPage = new FavoritesPage();
}); 