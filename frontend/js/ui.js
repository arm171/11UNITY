/* ==============================================
   UI MODULE - Уведомления и UI компоненты
   ============================================== */

const UI = {
    
    // ========== УВЕДОМЛЕНИЯ ==========
    
    /**
     * Показать уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип: 'success', 'error', 'info'
     * @param {number} duration - Длительность в мс (по умолчанию 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Создаём элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Иконки для разных типов
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
        };
        
        notification.innerHTML = `
            ${icons[type] || ''}
            <span style="margin-left: 8px;">${message}</span>
        `;
        
        // Добавляем в body
        document.body.appendChild(notification);
        
        // Автоматически удаляем через duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        console.log(`📢 Notification [${type}]:`, message);
    },
    
    // ========== LOADING INDICATOR ==========
    
    /**
     * Показать индикатор загрузки
     * @param {string} containerId - ID контейнера
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
    },
    
    /**
     * Скрыть индикатор загрузки
     * @param {string} containerId - ID контейнера
     */
    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const loader = container.querySelector('.loading-indicator');
        if (loader) {
            loader.remove();
        }
    },
    
    // ========== EMPTY STATE ==========
    
    /**
     * Показать empty state
     * @param {string} containerId - ID контейнера
     * @param {string} icon - HTML иконки
     * @param {string} title - Заголовок
     * @param {string} subtitle - Подзаголовок
     */
    showEmptyState(containerId, icon, title, subtitle) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-subtitle">${subtitle}</p>
            </div>
        `;
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
    },
    
    // ========== SMOOTH SCROLL ==========
    
    /**
     * Плавная прокрутка к секции
     * @param {string} sectionId - ID секции
     */
    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    },
    
    // ========== NAVIGATION ACTIVE STATE ==========
    
    /**
     * Инициализация навигации
     */
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Клик по ссылкам
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Убираем active у всех
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Добавляем active к текущей
                link.classList.add('active');
                
                // Скроллим к секции
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);
            });
        });
        
        // Активная секция при скролле
        window.addEventListener('scroll', () => {
            let current = '';
            const sections = document.querySelectorAll('section');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.pageYOffset >= sectionTop - 150) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
        
        console.log('✅ Navigation initialized');
    },
    
    // ========== MODAL HELPERS ==========
    
    /**
     * Открыть модалку
     * @param {string} modalId - ID модалки
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Закрыть модалку
     * @param {string} modalId - ID модалки
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },
    
    // ========== FORM HELPERS ==========
    
    /**
     * Показать загрузку на кнопке
     * @param {HTMLButtonElement} button - Кнопка
     */
    showButtonLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        
        if (btnText) btnText.style.display = 'none';
        if (spinner) spinner.style.display = 'inline-block';
        button.disabled = true;
    },
    
    /**
     * Скрыть загрузку на кнопке
     * @param {HTMLButtonElement} button - Кнопка
     */
    hideButtonLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        
        if (btnText) btnText.style.display = 'inline-block';
        if (spinner) spinner.style.display = 'none';
        button.disabled = false;
    },
    
    // ========== DATE FORMATTING ==========
    
    /**
     * Форматировать дату
     * @param {string} dateString - Строка даты
     * @returns {string} - Отформатированная дата
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    },
    
    /**
     * Форматировать дату и время
     * @param {string} dateString - Строка даты
     * @returns {string} - Отформатированная дата и время
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const dateOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
        };
        return date.toLocaleDateString('en-US', dateOptions) + ' at ' + 
               date.toLocaleTimeString('en-US', timeOptions);
    },
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    
    init() {
        this.initNavigation();
        console.log('✅ UI Module initialized');
    },
    
};

// Экспортируем
window.UI = UI;

console.log('✅ UI Module loaded');