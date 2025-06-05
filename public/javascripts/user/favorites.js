class FavoritesPage {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentSort = 'recent';
        this.currentSearch = '';
        
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '/auth/login';
            return;
        }

        this.bindEvents();
        this.loadFavorites();
    }

    bindEvents() {
        // Поиск
        const searchInput = document.getElementById('favorites-search');
        const searchBtn = document.getElementById('search-btn');
        
        searchBtn?.addEventListener('click', () => {
            this.currentSearch = searchInput.value.trim();
            this.currentPage = 1;
            this.loadFavorites();
        });

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentSearch = searchInput.value.trim();
                this.currentPage = 1;
                this.loadFavorites();
            }
        });

        // Сортировка
        const sortSelect = document.getElementById('sort-select');
        sortSelect?.addEventListener('change', () => {
            this.currentSort = sortSelect.value;
            this.currentPage = 1;
            this.loadFavorites();
        });
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

            const response = await fetch(`/user/favorites?${params}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки избранного');
            }

            const data = await response.json();
            this.renderFavorites(data);
            this.updateStats(data.pagination);
            
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showError('Ошибка загрузки избранного');
        } finally {
            this.showLoading(false);
        }
    }

    renderFavorites(data) {
        const container = document.getElementById('favorites-list');
        const emptyState = document.getElementById('empty-favorites');
        const content = document.getElementById('favorites-content');

        if (!data.favorites || data.favorites.length === 0) {
            content.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        content.style.display = 'block';
        emptyState.style.display = 'none';

        container.innerHTML = data.favorites.map(favorite => `
            <div class="favorite-card" data-letter="${favorite.letter}" data-verb-id="${favorite.verbId}">
                <div class="card-content">
                    <h3 class="verb-text">${favorite.verbText}</h3>
                    <p class="verb-translation">${favorite.translation || 'Нет перевода'}</p>
                    <div class="card-meta">
                        <small>Добавлено: ${new Date(favorite.addedAt).toLocaleDateString('ru-RU')}</small>
                    </div>
                </div>
                <div class="card-actions">
                    <a href="/verbs/${favorite.letter}/${favorite.verbText}" class="btn btn-primary btn-sm">
                        <i class="fas fa-eye"></i> Открыть
                    </a>
                    <button class="btn btn-danger btn-sm remove-favorite" 
                            data-letter="${favorite.letter}" 
                            data-verb-id="${favorite.verbId}">
                        <i class="fas fa-heart-broken"></i> Удалить
                    </button>
                </div>
            </div>
        `).join('');

        // Привязываем события удаления
        container.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const letter = e.target.closest('.remove-favorite').dataset.letter;
                const verbId = parseInt(e.target.closest('.remove-favorite').dataset.verbId);
                this.removeFavorite(letter, verbId);
            });
        });

        // Рендерим пагинацию
        this.renderPagination(data.pagination);
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
        const totalCount = document.getElementById('total-count');
        if (totalCount && pagination) {
            totalCount.textContent = pagination.totalFavorites || 0;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('favorites-loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        // Можно добавить отображение ошибок
        console.error(message);
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new FavoritesPage();
}); 