/**
 * AR Engine - Главный контроллер AR приложения
 */

class AREngine {
    constructor() {
        this.isRunning = false;
        this.animationFrameId = null;
        this.frameCount = 0;
        this.detectionFrameInterval = CONFIG.ML_DETECTION.frameInterval;
        this.currentDetection = null;
        this.performanceLevel = 'medium';
        this.qualitySettings = {};
    }

    /**
     * Инициализация AR Engine
     */
    async init() {
        try {
            CONFIG.log('Инициализация AR Engine');

            // Проверка поддержки браузером
            const support = CONFIG.checkBrowserSupport();
            if (!support.supported) {
                throw new Error(CONFIG.ERRORS.WEBGL_NOT_SUPPORTED);
            }

            // Инициализация UI контроллера
            uiController.init();
            uiController.updateModelsGallery();

            // Определение уровня производительности
            this.performanceLevel = CONFIG.getDevicePerformanceLevel();
            this.qualitySettings = CONFIG.getQualitySettings(this.performanceLevel);
            CONFIG.log('Уровень производительности:', this.performanceLevel);

            // Привязка обработчиков событий
            this.attachEventListeners();

            CONFIG.log('AR Engine инициализирован');
            return true;

        } catch (error) {
            CONFIG.error('Ошибка инициализации AR Engine:', error);
            uiController.showError(error.message);
            throw error;
        }
    }

    /**
     * Привязка обработчиков событий
     */
    attachEventListeners() {
        // Событие запуска AR
        window.addEventListener('startAR', () => this.start());

        // Событие выхода из AR
        window.addEventListener('exitAR', () => this.stop());

        // Событие скриншота
        window.addEventListener('takeScreenshot', () => this.takeScreenshot());

        // Событие выбора модели
        window.addEventListener('modelSelected', (e) => {
            this.loadDoorModel(e.detail.modelId);
        });

        // Обработка ошибок
        window.addEventListener('error', (e) => {
            CONFIG.error('Глобальная ошибка:', e.error);
        });
    }

    /**
     * Запуск AR приложения
     */
    async start() {
        try {
            CONFIG.log('Запуск AR приложения');
            uiController.showLoadingModal('Инициализация камеры...');

            // Инициализация камеры
            await cameraHandler.init(uiController.getVideoElement());
            await cameraHandler.requestAccess();

            uiController.showLoadingModal('Загрузка ML модели...');

            // Инициализация ML детектора (с обработкой ошибок)
            try {
                await mlDetector.init();
                CONFIG.log('ML детектор инициализирован');
            } catch (mlError) {
                CONFIG.warn('ML модель не загружена, используется режим без детекции');
                uiController.showHint('⚠️ Режим без автоматической детекции дверей');
            }

            uiController.showLoadingModal('Инициализация 3D сцены...');

            // Инициализация Scene Manager
            sceneManager = new SceneManager(uiController.getCanvasElement());
            sceneManager.init();

            // Загрузка модели двери по умолчанию
            await this.loadDoorModel(uiController.getCurrentModel());

            // Переключение на AR экран
            uiController.switchToARScreen();
            uiController.hideLoadingModal();

            // Запуск основного цикла
            this.isRunning = true;
            this.startRenderLoop();

            uiController.setStatus('Готово', 'success');
            uiController.showHint(CONFIG.MESSAGES.HINT_MOVE_CAMERA);

            CONFIG.log('AR приложение запущено');

        } catch (error) {
            CONFIG.error('Ошибка запуска AR:', error);
            uiController.hideLoadingModal();
            uiController.showError(error.message);
            this.cleanup();
        }
    }

    /**
     * Остановка AR приложения
     */
    stop() {
        try {
            CONFIG.log('Остановка AR приложения');

            this.isRunning = false;

            // Остановка цикла рендеринга
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            // Очистка ресурсов
            this.cleanup();

            // Переключение на стартовый экран
            uiController.switchToStartScreen();

            CONFIG.log('AR приложение остановлено');

        } catch (error) {
            CONFIG.error('Ошибка остановки AR:', error);
        }
    }

    /**
     * Основной цикл рендеринга
     */
    startRenderLoop() {
        const loop = async () => {
            if (!this.isRunning) {
                return;
            }

            try {
                // Увеличение счетчика кадров
                this.frameCount++;
                cameraHandler.incrementFrameCount();

                // Обработка ML детекции (не каждый кадр, если модель загружена)
                if (mlDetector.isReady() && cameraHandler.shouldProcessFrame(this.detectionFrameInterval)) {
                    this.currentDetection = await mlDetector.detect(
                        uiController.getVideoElement()
                    );

                    // Обновление статуса
                    if (this.currentDetection) {
                        uiController.setStatus('Проем обнаружен!', 'success');
                        uiController.hideHint();
                    } else {
                        uiController.setStatus('Ищем дверной проем...', 'loading');
                        uiController.showHint(CONFIG.MESSAGES.HINT_MOVE_CAMERA);
                    }
                } else if (!mlDetector.isReady()) {
                    // Если ML модель не загружена, показываем статус
                    uiController.setStatus('Режим без детекции', 'warning');
                }

                // Позиционирование двери
                if (this.currentDetection && sceneManager) {
                    const { width, height } = cameraHandler.getVideoDimensions();
                    sceneManager.positionDoor(this.currentDetection, width, height);
                }

                // Рендеринг сцены
                if (sceneManager) {
                    sceneManager.render();
                }

                // Обновление информационной панели
                if (this.frameCount % 30 === 0) {
                    if (sceneManager) {
                        uiController.updateFPS(sceneManager.getFPS());
                    }
                }

                // Адаптивное качество
                if (CONFIG.PERFORMANCE.adaptiveQuality && this.frameCount % 300 === 0) {
                    this.adaptQuality();
                }

            } catch (error) {
                CONFIG.error('Ошибка в цикле рендеринга:', error);
            }

            // Следующий кадр
            this.animationFrameId = requestAnimationFrame(loop);
        };

        loop();
    }

    /**
     * Загрузка модели двери
     */
    async loadDoorModel(modelId) {
        try {
            CONFIG.log('Загрузка модели:', modelId);
            uiController.showLoadingModal('Загрузка модели...');

            // Проверка наличия модели в конфигурации
            const modelInfo = CONFIG.getModelById(modelId);
            if (!modelInfo) {
                throw new Error('Модель не найдена в конфигурации');
            }

            // Генерация модели (процедурная генерация вместо загрузки файла)
            const model = await sceneManager.loadDoorModel(modelId);

            // Установка модели в сцену
            sceneManager.setDoorModel(model);

            // Обновление информационной панели
            uiController.selectModel(modelId);

            uiController.hideLoadingModal();
            CONFIG.log('Модель успешно загружена');

        } catch (error) {
            CONFIG.error('Ошибка загрузки модели:', error);
            uiController.hideLoadingModal();
            uiController.showError(CONFIG.ERRORS.MODEL_LOAD_FAILED);
        }
    }

    /**
     * Адаптивное качество на основе FPS
     */
    adaptQuality() {
        if (!sceneManager) return;

        const fps = sceneManager.getFPS();
        const { fpsThresholds } = CONFIG.PERFORMANCE;

        let newLevel = this.performanceLevel;

        if (fps < fpsThresholds.low) {
            newLevel = 'low';
        } else if (fps < fpsThresholds.medium) {
            newLevel = 'medium';
        } else if (fps >= fpsThresholds.high) {
            newLevel = 'high';
        }

        if (newLevel !== this.performanceLevel) {
            CONFIG.log('Изменение уровня качества:', newLevel);
            this.performanceLevel = newLevel;
            this.qualitySettings = CONFIG.getQualitySettings(newLevel);

            // Применение новых настроек
            this.applyQualitySettings();
        }
    }

    /**
     * Применение настроек качества
     */
    applyQualitySettings() {
        if (!sceneManager) return;

        const settings = this.qualitySettings;

        // Применение масштаба рендера
        if (sceneManager.renderer) {
            sceneManager.renderer.setPixelRatio(settings.pixelRatio);
        }

        // Применение интервала ML детекции
        this.detectionFrameInterval = settings.mlInterval;

        // Применение теней
        if (sceneManager.renderer) {
            sceneManager.renderer.shadowMap.enabled = settings.shadows;
        }

        CONFIG.log('Настройки качества применены');
    }

    /**
     * Создание скриншота
     */
    takeScreenshot() {
        try {
            if (!sceneManager) {
                uiController.showError('Сцена не инициализирована');
                return;
            }

            const dataUrl = sceneManager.takeScreenshot();
            if (!dataUrl) {
                throw new Error('Ошибка создания скриншота');
            }

            // Скачивание скриншота
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `ar-door-${Date.now()}.png`;
            link.click();

            uiController.showHint('Скриншот сохранен!', 2000);
            CONFIG.log('Скриншот создан');

        } catch (error) {
            CONFIG.error('Ошибка создания скриншота:', error);
            uiController.showError('Ошибка при создании скриншота');
        }
    }

    /**
     * Очистка ресурсов
     */
    cleanup() {
        try {
            CONFIG.log('Очистка ресурсов');

            // Остановка камеры
            if (cameraHandler) {
                cameraHandler.stop();
            }

            // Выгрузка ML модели
            if (mlDetector) {
                mlDetector.dispose();
            }

            // Выгрузка Scene Manager
            if (sceneManager) {
                sceneManager.dispose();
                sceneManager = null;
            }

            // Сброс счетчиков
            this.frameCount = 0;
            this.currentDetection = null;

            CONFIG.log('Ресурсы очищены');

        } catch (error) {
            CONFIG.error('Ошибка при очистке ресурсов:', error);
        }
    }

    /**
     * Получить информацию о состоянии
     */
    getStatus() {
        return {
            running: this.isRunning,
            frameCount: this.frameCount,
            performanceLevel: this.performanceLevel,
            detectionActive: this.currentDetection !== null,
            cameraActive: cameraHandler?.isRunning(),
            mlReady: mlDetector?.isReady(),
            sceneReady: sceneManager?.isReady()
        };
    }

    /**
     * Получить информацию о производительности
     */
    getPerformanceInfo() {
        return {
            fps: sceneManager?.getFPS() || 0,
            performanceLevel: this.performanceLevel,
            qualitySettings: this.qualitySettings,
            cameraResolution: cameraHandler?.getResolution(),
            sceneInfo: sceneManager?.getSceneInfo()
        };
    }
}

// Создание глобального экземпляра
let arEngine = null;

/**
 * Инициализация приложения при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        CONFIG.log('Инициализация приложения');

        // Создание AR Engine
        arEngine = new AREngine();
        await arEngine.init();

        CONFIG.log('Приложение готово к работе');

    } catch (error) {
        CONFIG.error('Критическая ошибка при инициализации:', error);
        uiController.showError(CONFIG.ERRORS.UNKNOWN_ERROR);
    }
});

/**
 * Очистка при закрытии страницы
 */
window.addEventListener('beforeunload', () => {
    if (arEngine) {
        arEngine.cleanup();
    }
});

/**
 * Обработка видимости страницы
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Страница скрыта - остановить AR
        if (arEngine && arEngine.isRunning) {
            arEngine.stop();
        }
    }
});
