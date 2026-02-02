// ============================================
// I18N MODULE
// Internationalization support
// ============================================

const I18n = {
    // Current language
    currentLang: 'en',

    // Supported languages configuration
    languages: {
        en: { name: 'English', nativeName: 'English', dir: 'ltr' },
        hy: { name: 'Armenian', nativeName: 'Հայերdelays', dir: 'ltr' },
        ru: { name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
        ge: { name: 'Georgian', nativeName: 'ქართული', dir: 'ltr' }
    },

    // All translations (populated from locale files)
    translations: {},

    // Storage key
    STORAGE_KEY: '11unity_language',

    // Initialize i18n
    init() {
        // Load saved language or detect from browser
        const savedLang = localStorage.getItem(this.STORAGE_KEY);
        const browserLang = navigator.language.split('-')[0];

        this.currentLang = savedLang ||
            (this.languages[browserLang] ? browserLang : 'en');

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Apply translations to static content
        this.applyTranslations();

        // Create language switcher
        this.createLanguageSwitcher();
    },

    // Register translations for a language
    registerTranslations(lang, translations) {
        this.translations[lang] = translations;
    },

    // Get translation with parameter support
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        // Traverse nested keys
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }

        // Fallback to English
        if (value === undefined && this.currentLang !== 'en') {
            value = this.translations['en'];
            for (const k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    console.warn(`[i18n] Missing translation: ${key}`);
                    value = key;
                    break;
                }
            }
        }

        // If still undefined, return key
        if (value === undefined) {
            console.warn(`[i18n] Missing translation: ${key}`);
            return key;
        }

        // Handle parameters like {count}, {name}
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{(\w+)\}/g, (match, paramName) => {
                return params[paramName] !== undefined ? params[paramName] : match;
            });
        }

        return value;
    },

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    },

    // Switch language
    setLanguage(lang) {
        if (!this.languages[lang]) {
            console.warn(`[i18n] Language ${lang} not supported`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem(this.STORAGE_KEY, lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Apply translations to DOM
        this.applyTranslations();

        // Update switcher display
        const currentLangSpan = document.getElementById('current-lang-name');
        if (currentLangSpan) {
            currentLangSpan.textContent = this.languages[lang].nativeName;
        }

        // Update active state in dropdown
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Trigger custom event for dynamic content
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang }
        }));
    },

    // Apply translations to static HTML elements
    applyTranslations() {
        // Elements with data-i18n attribute (text content)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Elements with data-i18n-placeholder (input placeholders)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Elements with data-i18n-title (title attribute)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Elements with data-i18n-html (innerHTML - use sparingly)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = this.t(key);
        });
    },

    // Create language switcher UI
    createLanguageSwitcher() {
        // Check if already exists
        if (document.getElementById('language-switcher')) {
            return;
        }

        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.id = 'language-switcher';

        switcher.innerHTML = `
            <button class="lang-btn" id="lang-btn">
                <i class="fas fa-globe"></i>
                <span id="current-lang-name">${this.languages[this.currentLang].nativeName}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="lang-dropdown" id="lang-dropdown">
                ${Object.entries(this.languages).map(([code, info]) => `
                    <button class="lang-option ${code === this.currentLang ? 'active' : ''}"
                            data-lang="${code}">
                        ${info.nativeName}
                    </button>
                `).join('')}
            </div>
        `;

        // Insert before nav-actions
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            navActions.parentNode.insertBefore(switcher, navActions);
        }

        // Event listeners
        const langBtn = document.getElementById('lang-btn');
        const langDropdown = document.getElementById('lang-dropdown');

        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = btn.getAttribute('data-lang');
                this.setLanguage(lang);
                langDropdown.classList.remove('active');
            });
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });
    },

    // Date formatting with locale support
    formatDate(dateString, options = {}) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const localeMap = {
            en: 'en-US',
            hy: 'hy-AM',
            ru: 'ru-RU',
            ge: 'ka-GE'
        };

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        return date.toLocaleDateString(
            localeMap[this.currentLang] || 'en-US',
            { ...defaultOptions, ...options }
        );
    },

    // DateTime formatting with locale support
    formatDateTime(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const localeMap = {
            en: 'en-US',
            hy: 'hy-AM',
            ru: 'ru-RU',
            ge: 'ka-GE'
        };

        const locale = localeMap[this.currentLang] || 'en-US';

        const dateStr = date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const timeStr = date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Use localized connector
        const connector = this.t('common.at');
        return `${dateStr} ${connector} ${timeStr}`;
    },

    // Format time only
    formatTime(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const localeMap = {
            en: 'en-US',
            hy: 'hy-AM',
            ru: 'ru-RU',
            ge: 'ka-GE'
        };

        return date.toLocaleTimeString(localeMap[this.currentLang] || 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format number with locale
    formatNumber(num) {
        if (typeof num !== 'number') return num;

        const localeMap = {
            en: 'en-US',
            hy: 'hy-AM',
            ru: 'ru-RU',
            ge: 'ka-GE'
        };

        return num.toLocaleString(localeMap[this.currentLang] || 'en-US');
    }
};

window.I18n = I18n;
