// ============================================
// UI MODULE
// Notifications and UI components
// ============================================

const UI = {

    // Notifications
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
        };

        notification.innerHTML = `
            ${icons[type] || ''}
            <span style="margin-left: 8px;">${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    // Loading indicator
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

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const loader = container.querySelector('.loading-indicator');
        if (loader) {
            loader.remove();
        }
    },

    // Empty state
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

    // Smooth scroll
    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    },

    // Navigation
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);
            });
        });

        window.addEventListener('scroll', () => {
            let current = '';
            const sections = document.querySelectorAll('section');

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
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
    },

    // Modal helpers
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },

    // Button loading state
    showButtonLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');

        if (btnText) btnText.style.display = 'none';
        if (spinner) spinner.style.display = 'inline-block';
        button.disabled = true;
    },

    hideButtonLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');

        if (btnText) btnText.style.display = 'inline-block';
        if (spinner) spinner.style.display = 'none';
        button.disabled = false;
    },

    // Date formatting
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    },

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

    // Initialize
    init() {
        this.initNavigation();
    },

};

window.UI = UI;
