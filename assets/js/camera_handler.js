/**
 * Camera Handler - Управление доступом к камере устройства
 */

class CameraHandler {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.isActive = false;
        this.frameCount = 0;
    }

    /**
     * Инициализация обработчика камеры
     */
    async init(videoElement) {
        this.videoElement = videoElement;
        CONFIG.log('Инициализация обработчика камеры');
    }

    /**
     * Запрос доступа к камере и запуск видеопотока
     */
    async requestAccess() {
        try {
            CONFIG.log('Запрос доступа к камере');

            // Проверка поддержки API
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia не поддерживается браузером');
            }

            // Получение видеопотока
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: CONFIG.CAMERA,
                audio: false
            });

            // Привязка потока к видео элементу
            this.videoElement.srcObject = this.stream;

            // Ожидание загрузки метаданных видео
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    CONFIG.log('Метаданные видео загружены');
                    this.videoElement.play().catch(reject);
                    resolve();
                };
                this.videoElement.onerror = reject;
                // Таймаут на случай зависания
                setTimeout(() => reject(new Error('Таймаут загрузки видео')), 5000);
            });

            this.isActive = true;
            CONFIG.log('Видеопоток успешно запущен');
            return true;

        } catch (error) {
            CONFIG.error('Ошибка доступа к камере:', error);
            this.handleCameraError(error);
            throw error;
        }
    }

    /**
     * Обработка ошибок камеры
     */
    handleCameraError(error) {
        let errorMessage = CONFIG.ERRORS.UNKNOWN_ERROR;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = CONFIG.ERRORS.CAMERA_DENIED;
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = CONFIG.ERRORS.CAMERA_NOT_FOUND;
        } else if (error.message.includes('getUserMedia')) {
            errorMessage = CONFIG.ERRORS.CAMERA_NOT_FOUND;
        }

        CONFIG.error('Ошибка камеры:', errorMessage);
        return errorMessage;
    }

    /**
     * Остановка видеопотока
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
            this.isActive = false;
            CONFIG.log('Видеопоток остановлен');
        }
    }

    /**
     * Получить текущий кадр видео как Canvas
     */
    getFrameCanvas() {
        if (!this.videoElement || !this.isActive) {
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0);

        return canvas;
    }

    /**
     * Получить текущий кадр как ImageData
     */
    getFrameImageData() {
        const canvas = this.getFrameCanvas();
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Получить размеры видео
     */
    getVideoDimensions() {
        if (!this.videoElement) {
            return { width: 0, height: 0 };
        }

        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    }

    /**
     * Получить соотношение сторон видео
     */
    getAspectRatio() {
        const { width, height } = this.getVideoDimensions();
        return width / height;
    }

    /**
     * Проверить, активна ли камера
     */
    isRunning() {
        return this.isActive && this.stream !== null;
    }

    /**
     * Получить информацию о камере
     */
    async getCameraInfo() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');

            return {
                count: cameras.length,
                devices: cameras.map(cam => ({
                    id: cam.deviceId,
                    label: cam.label || 'Неизвестная камера'
                }))
            };
        } catch (error) {
            CONFIG.error('Ошибка получения информации о камере:', error);
            return { count: 0, devices: [] };
        }
    }

    /**
     * Переключиться на другую камеру
     */
    async switchCamera(deviceId) {
        try {
            this.stop();

            const constraints = {
                video: {
                    ...CONFIG.CAMERA,
                    deviceId: { exact: deviceId }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;

            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    this.isActive = true;
                    resolve();
                };
            });

            CONFIG.log('Камера переключена на:', deviceId);
            return true;

        } catch (error) {
            CONFIG.error('Ошибка переключения камеры:', error);
            throw error;
        }
    }

    /**
     * Получить текущий видеопоток
     */
    getStream() {
        return this.stream;
    }

    /**
     * Получить видео элемент
     */
    getVideoElement() {
        return this.videoElement;
    }

    /**
     * Увеличить счетчик кадров
     */
    incrementFrameCount() {
        this.frameCount++;
    }

    /**
     * Получить счетчик кадров
     */
    getFrameCount() {
        return this.frameCount;
    }

    /**
     * Сбросить счетчик кадров
     */
    resetFrameCount() {
        this.frameCount = 0;
    }

    /**
     * Проверить, нужно ли обрабатывать текущий кадр
     */
    shouldProcessFrame(interval) {
        return this.frameCount % interval === 0;
    }

    /**
     * Получить разрешение видео
     */
    getResolution() {
        const { width, height } = this.getVideoDimensions();
        return `${width}x${height}`;
    }

    /**
     * Получить информацию о видеопотоке
     */
    getStreamInfo() {
        if (!this.stream) {
            return null;
        }

        const videoTrack = this.stream.getVideoTracks()[0];
        if (!videoTrack) {
            return null;
        }

        const settings = videoTrack.getSettings();
        const capabilities = videoTrack.getCapabilities();

        return {
            active: videoTrack.enabled,
            label: videoTrack.label,
            settings: {
                width: settings.width,
                height: settings.height,
                frameRate: settings.frameRate,
                facingMode: settings.facingMode
            },
            capabilities: {
                width: capabilities.width,
                height: capabilities.height,
                frameRate: capabilities.frameRate,
                facingMode: capabilities.facingMode
            }
        };
    }

    /**
     * Установить разрешение видео
     */
    async setResolution(width, height) {
        try {
            if (!this.stream) {
                throw new Error('Видеопоток не активен');
            }

            const videoTrack = this.stream.getVideoTracks()[0];
            if (!videoTrack) {
                throw new Error('Видеотрек не найден');
            }

            await videoTrack.applyConstraints({
                video: {
                    width: { ideal: width },
                    height: { ideal: height }
                }
            });

            CONFIG.log(`Разрешение установлено: ${width}x${height}`);
            return true;

        } catch (error) {
            CONFIG.error('Ошибка установки разрешения:', error);
            return false;
        }
    }

    /**
     * Получить поддерживаемые разрешения
     */
    async getSupportedResolutions() {
        try {
            if (!this.stream) {
                return [];
            }

            const videoTrack = this.stream.getVideoTracks()[0];
            if (!videoTrack) {
                return [];
            }

            const capabilities = videoTrack.getCapabilities();
            const resolutions = [];

            if (capabilities.width && capabilities.height) {
                const widths = capabilities.width.max ? 
                    [640, 800, 1024, 1280, 1920] : 
                    [640, 1280];
                
                widths.forEach(w => {
                    if (w <= (capabilities.width.max || 1920)) {
                        resolutions.push({
                            width: w,
                            height: Math.round(w / (16/9))
                        });
                    }
                });
            }

            return resolutions;

        } catch (error) {
            CONFIG.error('Ошибка получения поддерживаемых разрешений:', error);
            return [];
        }
    }
}

// Создание глобального экземпляра
const cameraHandler = new CameraHandler();
