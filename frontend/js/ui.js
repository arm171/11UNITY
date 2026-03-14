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
            <span style="margin-left: 8px;">${this.escapeHtml(message)}</span>
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

        const loadingText = window.I18n ? I18n.t('common.loading') : 'Loading...';
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>${loadingText}</p>
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

        // Reset inline styles set by showLoading
        container.style.display = '';
        container.style.justifyContent = '';
        container.style.alignItems = '';
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

    // Mobile Menu
    initMobileMenu() {
        const burgerBtn = document.getElementById('burger-btn');
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavClose = document.getElementById('mobile-nav-close');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

        if (!burgerBtn || !mobileNavOverlay) return;

        const closeMenu = () => {
            burgerBtn.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Toggle mobile menu
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('active');
            mobileNavOverlay.classList.toggle('active');
            document.body.style.overflow = mobileNavOverlay.classList.contains('active') ? 'hidden' : '';
        });

        // Close button inside overlay
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', closeMenu);
        }

        // Close menu when clicking a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                closeMenu();

                // Scroll to section
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);

                // Update active state
                mobileNavLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Also update desktop nav active state
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(l => {
                    l.classList.remove('active');
                    if (l.getAttribute('href') === targetId) {
                        l.classList.add('active');
                    }
                });
            });
        });

        // Close menu when clicking overlay background
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                closeMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavOverlay.classList.contains('active')) {
                closeMenu();
            }
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

    // Date formatting (delegates to I18n if available)
    formatDate(dateString) {
        if (window.I18n) {
            return I18n.formatDate(dateString);
        }
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    },

    formatDateTime(dateString) {
        if (window.I18n) {
            return I18n.formatDateTime(dateString);
        }
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

    /**
     * Escape HTML special characters to prevent XSS.
     * Always use this when inserting user-provided text into innerHTML.
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // Initialize
    init() {
        this.initNavigation();
        this.initMobileMenu();
    },

};

window.UI = UI;
