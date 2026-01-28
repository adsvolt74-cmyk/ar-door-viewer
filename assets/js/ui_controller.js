/**
 * UI Controller - Управление пользовательским интерфейсом
 */

class UIController {
    constructor() {
        this.elements = {};
        this.currentModel = CONFIG.MODELS.default;
        this.isARActive = false;
        this.hintTimeout = null;
    }

    /**
     * Инициализация UI контроллера
     */
    init() {
        try {
            CONFIG.log('Инициализация UI контроллера');

            // Кэширование элементов DOM
            this.cacheElements();

            // Привязка обработчиков событий
            this.attachEventListeners();

            // Инициализация модальных окон
            this.initModals();

            CONFIG.log('UI контроллер инициализирован');

        } catch (error) {
            CONFIG.error('Ошибка инициализации UI:', error);
        }
    }

    /**
     * Кэширование элементов DOM
     */
    cacheElements() {
        // Экраны
        this.elements.startScreen = document.getElementById('startScreen');
        this.elements.arScreen = document.getElementById('arScreen');

        // Кнопки
        this.elements.startARBtn = document.getElementById('startARBtn');
        this.elements.exitARBtn = document.getElementById('exitARBtn');
        this.elements.screenshotBtn = document.getElementById('screenshotBtn');
        this.elements.settingsBtn = document.getElementById('settingsBtn');

        // Индикаторы и подсказки
        this.elements.statusIndicator = document.getElementById('statusIndicator');
        this.elements.statusDot = this.elements.statusIndicator?.querySelector('.status-dot');
        this.elements.statusText = document.getElementById('statusText');
        this.elements.userHint = document.getElementById('userHint');
        this.elements.hintText = document.getElementById('hintText');

        // Галерея моделей
        this.elements.modelsGallery = document.getElementById('modelsGallery');

        // Информационная панель
        this.elements.infoPanel = document.getElementById('infoPanel');
        this.elements.fpsCounter = document.getElementById('fpsCounter');
        this.elements.modelName = document.getElementById('modelName');

        // Видео и Canvas
        this.elements.videoElement = document.getElementById('videoElement');
        this.elements.arCanvas = document.getElementById('arCanvas');

        // Модальные окна
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.errorModal = document.getElementById('errorModal');
        this.elements.loadingModal = document.getElementById('loadingModal');

        // Элементы настроек
        this.elements.qualitySlider = document.getElementById('qualitySlider');
        this.elements.qualityValue = document.getElementById('qualityValue');
        this.elements.brightnessSlider = document.getElementById('brightnessSlider');
        this.elements.brightnessValue = document.getElementById('brightnessValue');
        this.elements.showDebugInfo = document.getElementById('showDebugInfo');
        this.elements.enableShadows = document.getElementById('enableShadows');

        // Элементы ошибок
        this.elements.errorMessage = document.getElementById('errorMessage');
        this.elements.errorRetryBtn = document.getElementById('errorRetryBtn');
        this.elements.errorExitBtn = document.getElementById('errorExitBtn');

        // Текст загрузки
        this.elements.loadingText = document.getElementById('loadingText');
    }

    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Кнопка запуска AR
        this.elements.startARBtn?.addEventListener('click', () => {
            this.onStartARClick();
        });

        // Кнопка выхода из AR
        this.elements.exitARBtn?.addEventListener('click', () => {
            this.onExitARClick();
        });

        // Кнопка скриншота
        this.elements.screenshotBtn?.addEventListener('click', () => {
            this.onScreenshotClick();
        });

        // Кнопка настроек
        this.elements.settingsBtn?.addEventListener('click', () => {
            this.openModal('settingsModal');
        });

        // Слайдеры настроек
        this.elements.qualitySlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.qualityValue.textContent = Math.round(value * 100) + '%';
            this.onQualityChange(value);
        });

        this.elements.brightnessSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.brightnessValue.textContent = Math.round(value * 100) + '%';
            this.onBrightnessChange(value);
        });

        // Чекбоксы
        this.elements.showDebugInfo?.addEventListener('change', (e) => {
            CONFIG.UI.showDebugInfo = e.target.checked;
            this.toggleDebugInfo(e.target.checked);
        });

        this.elements.enableShadows?.addEventListener('change', (e) => {
            CONFIG.RENDERER.shadows = e.target.checked;
            if (sceneManager) {
                sceneManager.renderer.shadowMap.enabled = e.target.checked;
            }
        });

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Кнопки ошибок
        this.elements.errorRetryBtn?.addEventListener('click', () => {
            this.closeModal('errorModal');
            this.onStartARClick();
        });

        this.elements.errorExitBtn?.addEventListener('click', () => {
            this.closeModal('errorModal');
            this.switchToStartScreen();
        });

        // Закрытие модалей при клике вне содержимого
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    /**
     * Инициализация модальных окон
     */
    initModals() {
        // Скрытие всех модалей по умолчанию
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Обработчик клика на кнопку "Запустить AR"
     */
    onStartARClick() {
        CONFIG.log('Нажата кнопка запуска AR');
        this.showLoadingModal('Инициализация AR...');
        
        // Отправка события для главного контроллера
        window.dispatchEvent(new CustomEvent('startAR'));
    }

    /**
     * Обработчик клика на кнопку "Выход"
     */
    onExitARClick() {
        CONFIG.log('Нажата кнопка выхода из AR');
        window.dispatchEvent(new CustomEvent('exitAR'));
    }

    /**
     * Обработчик клика на кнопку скриншота
     */
    onScreenshotClick() {
        CONFIG.log('Нажата кнопка скриншота');
        window.dispatchEvent(new CustomEvent('takeScreenshot'));
    }

    /**
     * Обработчик изменения качества
     */
    onQualityChange(value) {
        CONFIG.RENDERER.pixelRatio = value;
        if (sceneManager && sceneManager.renderer) {
            sceneManager.renderer.setPixelRatio(value);
        }
    }

    /**
     * Обработчик изменения яркости
     */
    onBrightnessChange(value) {
        if (sceneManager) {
            sceneManager.setBrightness(value);
        }
    }

    /**
     * Переключение на стартовый экран
     */
    switchToStartScreen() {
        this.elements.startScreen?.classList.add('active');
        this.elements.arScreen?.classList.remove('active');
        this.isARActive = false;
    }

    /**
     * Переключение на AR экран
     */
    switchToARScreen() {
        this.elements.startScreen?.classList.remove('active');
        this.elements.arScreen?.classList.add('active');
        this.isARActive = true;
    }

    /**
     * Обновление статуса
     */
    setStatus(text, type = 'loading') {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = text;
        }

        if (this.elements.statusDot) {
            this.elements.statusDot.classList.remove('success', 'error');
            if (type === 'success') {
                this.elements.statusDot.classList.add('success');
            } else if (type === 'error') {
                this.elements.statusDot.classList.add('error');
            }
        }
    }

    /**
     * Показать подсказку пользователю
     */
    showHint(text, duration = CONFIG.UI.hintDuration) {
        if (!CONFIG.UI.showHints) return;

        if (this.elements.hintText) {
            this.elements.hintText.textContent = text;
        }

        if (this.elements.userHint) {
            this.elements.userHint.classList.remove('hidden');
        }

        // Автоскрытие подсказки
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
        }

        this.hintTimeout = setTimeout(() => {
            if (this.elements.userHint) {
                this.elements.userHint.classList.add('hidden');
            }
        }, duration);
    }

    /**
     * Скрыть подсказку
     */
    hideHint() {
        if (this.elements.userHint) {
            this.elements.userHint.classList.add('hidden');
        }
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
        }
    }

    /**
     * Обновить галерею моделей
     */
    updateModelsGallery() {
        if (!this.elements.modelsGallery) return;

        this.elements.modelsGallery.innerHTML = '';

        CONFIG.MODELS.available.forEach(model => {
            const item = document.createElement('div');
            item.className = 'model-item';
            if (model.id === this.currentModel) {
                item.classList.add('active');
            }

            item.innerHTML = `<span>${model.icon}</span>`;
            item.title = model.name;

            item.addEventListener('click', () => {
                this.selectModel(model.id);
            });

            this.elements.modelsGallery.appendChild(item);
        });
    }

    /**
     * Выбрать модель
     */
    selectModel(modelId) {
        this.currentModel = modelId;
        this.updateModelsGallery();

        // Обновление информационной панели
        const model = CONFIG.getModelById(modelId);
        if (this.elements.modelName && model) {
            this.elements.modelName.textContent = model.name;
        }

        // Отправка события
        window.dispatchEvent(new CustomEvent('modelSelected', {
            detail: { modelId }
        }));
    }

    /**
     * Обновить FPS счетчик
     */
    updateFPS(fps) {
        if (this.elements.fpsCounter) {
            this.elements.fpsCounter.textContent = fps;
        }
    }

    /**
     * Показать информационную панель
     */
    showInfoPanel() {
        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.add('visible');
        }
    }

    /**
     * Скрыть информационную панель
     */
    hideInfoPanel() {
        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.remove('visible');
        }
    }

    /**
     * Переключить видимость информационной панели
     */
    toggleDebugInfo(show) {
        if (show) {
            this.showInfoPanel();
        } else {
            this.hideInfoPanel();
        }
    }

    /**
     * Открыть модальное окно
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Закрыть модальное окно
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Показать модальное окно загрузки
     */
    showLoadingModal(text = 'Загрузка...') {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
        this.openModal('loadingModal');
    }

    /**
     * Скрыть модальное окно загрузки
     */
    hideLoadingModal() {
        this.closeModal('loadingModal');
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        this.openModal('errorModal');
    }

    /**
     * Скрыть ошибку
     */
    hideError() {
        this.closeModal('errorModal');
    }

    /**
     * Показать статус индикатора
     */
    showStatusIndicator() {
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.style.display = 'flex';
        }
    }

    /**
     * Скрыть статус индикатора
     */
    hideStatusIndicator() {
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.style.display = 'none';
        }
    }

    /**
     * Получить текущую выбранную модель
     */
    getCurrentModel() {
        return this.currentModel;
    }

    /**
     * Проверить, активен ли AR режим
     */
    isARMode() {
        return this.isARActive;
    }

    /**
     * Получить элемент видео
     */
    getVideoElement() {
        return this.elements.videoElement;
    }

    /**
     * Получить элемент canvas
     */
    getCanvasElement() {
        return this.elements.arCanvas;
    }
}

// Создание глобального экземпляра
const uiController = new UIController();
