/**
 * ML Detector - Машинное обучение для детекции дверных проемов
 */

class MLDetector {
    constructor() {
        this.model = null;
        this.isLoaded = false;
        this.lastDetections = [];
        this.detectionHistory = [];
        this.maxHistoryLength = 5;
    }

    /**
     * Инициализация и загрузка ML модели
     */
    async init() {
        try {
            CONFIG.log('Инициализация ML детектора');

            // Загрузка COCO-SSD модели с таймаутом
            const loadPromise = cocoSsd.load();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Таймаут загрузки ML модели (30 сек)')), 30000)
            );

            this.model = await Promise.race([loadPromise, timeoutPromise]);
            this.isLoaded = true;

            CONFIG.log('ML модель успешно загружена');
            return true;

        } catch (error) {
            CONFIG.error('Ошибка загрузки ML модели:', error);
            // Используем упрощенный режим без ML детекции
            CONFIG.warn('Переход в режим без ML детекции');
            this.isLoaded = false;
            this.model = null;
            throw new Error(CONFIG.ERRORS.ML_INIT_FAILED);
        }
    }

    /**
     * Детекция объектов на видеокадре
     */
    async detect(videoElement) {
        if (!this.isLoaded || !this.model) {
            return null;
        }

        try {
            // Выполнение детекции
            const predictions = await this.model.estimateObjects(videoElement, {
                maxDetections: 10,
                scoreThreshold: CONFIG.ML_DETECTION.minConfidence
            });

            // Обработка результатов
            const doorwayDetections = this.filterDoorwayDetections(predictions);

            // Сохранение в историю
            this.detectionHistory.push(doorwayDetections);
            if (this.detectionHistory.length > this.maxHistoryLength) {
                this.detectionHistory.shift();
            }

            // Возврат лучшей детекции
            return this.getBestDetection(doorwayDetections);

        } catch (error) {
            CONFIG.error('Ошибка при детекции:', error);
            return null;
        }
    }

    /**
     * Фильтрация детекций для поиска дверных проемов
     */
    filterDoorwayDetections(predictions) {
        if (!predictions || predictions.length === 0) {
            return [];
        }

        return predictions
            .filter(pred => {
                // Фильтр по классу объекта
                const isRelevantClass = this.isRelevantClass(pred.class);
                if (!isRelevantClass) return false;

                // Фильтр по уверенности
                if (pred.score < CONFIG.ML_DETECTION.minConfidence) return false;

                // Получение размеров bbox
                const bbox = pred.bbox;
                const width = bbox[2];
                const height = bbox[3];

                // Фильтр по размеру
                if (width < CONFIG.ML_DETECTION.minSize || 
                    height < CONFIG.ML_DETECTION.minSize) return false;

                if (width > CONFIG.ML_DETECTION.maxSize || 
                    height > CONFIG.ML_DETECTION.maxSize) return false;

                // Фильтр по соотношению сторон (дверь выше, чем шире)
                const aspectRatio = height / width;
                if (aspectRatio < CONFIG.ML_DETECTION.minAspectRatio ||
                    aspectRatio > CONFIG.ML_DETECTION.maxAspectRatio) return false;

                return true;
            })
            .map(pred => ({
                class: pred.class,
                score: pred.score,
                bbox: {
                    x: pred.bbox[0],
                    y: pred.bbox[1],
                    width: pred.bbox[2],
                    height: pred.bbox[3]
                },
                center: {
                    x: pred.bbox[0] + pred.bbox[2] / 2,
                    y: pred.bbox[1] + pred.bbox[3] / 2
                },
                aspectRatio: pred.bbox[3] / pred.bbox[2]
            }));
    }

    /**
     * Проверка, является ли класс релевантным для дверного проема
     */
    isRelevantClass(className) {
        const relevantClasses = [
            'door',
            'window',
            'person',
            'bottle',
            'cup',
            'backpack'
        ];

        return relevantClasses.includes(className.toLowerCase());
    }

    /**
     * Получить лучшую детекцию из списка
     */
    getBestDetection(detections) {
        if (detections.length === 0) {
            return null;
        }

        // Сортировка по уверенности и размеру
        const sorted = detections.sort((a, b) => {
            const scoreWeight = 0.6;
            const sizeWeight = 0.4;

            const aScore = a.score * scoreWeight + 
                          (a.bbox.width * a.bbox.height) / 1000000 * sizeWeight;
            const bScore = b.score * scoreWeight + 
                          (b.bbox.width * b.bbox.height) / 1000000 * sizeWeight;

            return bScore - aScore;
        });

        return sorted[0];
    }

    /**
     * Сглаживание детекций между кадрами
     */
    smoothDetection(currentDetection) {
        if (!currentDetection) {
            return null;
        }

        // Если нет истории, возвращаем текущую детекцию
        if (this.lastDetections.length === 0) {
            this.lastDetections.push(currentDetection);
            return currentDetection;
        }

        // Получение последней детекции
        const lastDetection = this.lastDetections[this.lastDetections.length - 1];

        // Сглаживание позиции
        const smoothedDetection = {
            ...currentDetection,
            bbox: {
                x: this.lerp(lastDetection.bbox.x, currentDetection.bbox.x, 0.3),
                y: this.lerp(lastDetection.bbox.y, currentDetection.bbox.y, 0.3),
                width: this.lerp(lastDetection.bbox.width, currentDetection.bbox.width, 0.2),
                height: this.lerp(lastDetection.bbox.height, currentDetection.bbox.height, 0.2)
            },
            center: {
                x: this.lerp(lastDetection.center.x, currentDetection.center.x, 0.3),
                y: this.lerp(lastDetection.center.y, currentDetection.center.y, 0.3)
            }
        };

        // Сохранение в историю
        this.lastDetections.push(smoothedDetection);
        if (this.lastDetections.length > 3) {
            this.lastDetections.shift();
        }

        return smoothedDetection;
    }

    /**
     * Линейная интерполяция
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Анализ контуров для уточнения детекции (опционально)
     */
    analyzeEdges(imageData) {
        if (!CONFIG.ML_DETECTION.useEdgeDetection) {
            return null;
        }

        try {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;

            // Простой edge detection (Sobel)
            const edges = new Uint8ClampedArray(data.length);

            for (let i = 1; i < height - 1; i++) {
                for (let j = 1; j < width - 1; j++) {
                    const idx = (i * width + j) * 4;

                    // Получение значений соседних пикселей
                    const topLeft = data[((i - 1) * width + (j - 1)) * 4];
                    const top = data[((i - 1) * width + j) * 4];
                    const topRight = data[((i - 1) * width + (j + 1)) * 4];
                    const left = data[(i * width + (j - 1)) * 4];
                    const right = data[(i * width + (j + 1)) * 4];
                    const bottomLeft = data[((i + 1) * width + (j - 1)) * 4];
                    const bottom = data[((i + 1) * width + j) * 4];
                    const bottomRight = data[((i + 1) * width + (j + 1)) * 4];

                    // Sobel операторы
                    const gx = -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
                    const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;

                    const magnitude = Math.sqrt(gx * gx + gy * gy);
                    edges[idx] = Math.min(255, magnitude);
                    edges[idx + 1] = Math.min(255, magnitude);
                    edges[idx + 2] = Math.min(255, magnitude);
                    edges[idx + 3] = 255;
                }
            }

            return new ImageData(edges, width, height);

        } catch (error) {
            CONFIG.error('Ошибка анализа контуров:', error);
            return null;
        }
    }

    /**
     * Поиск вертикальных линий (для уточнения дверного проема)
     */
    findVerticalLines(imageData, threshold = 100) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        const lines = [];

        // Поиск вертикальных линий
        for (let x = 0; x < width; x++) {
            let verticalCount = 0;
            let startY = 0;

            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                const brightness = data[idx];

                if (brightness > threshold) {
                    if (verticalCount === 0) {
                        startY = y;
                    }
                    verticalCount++;
                } else {
                    if (verticalCount > height * 0.3) {
                        lines.push({
                            x: x,
                            startY: startY,
                            endY: y,
                            length: verticalCount
                        });
                    }
                    verticalCount = 0;
                }
            }
        }

        return lines;
    }

    /**
     * Получить статистику детекций
     */
    getDetectionStats() {
        if (this.detectionHistory.length === 0) {
            return null;
        }

        const allDetections = this.detectionHistory.flat();
        if (allDetections.length === 0) {
            return null;
        }

        const scores = allDetections.map(d => d.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
            totalDetections: allDetections.length,
            averageScore: avgScore,
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            detectionRate: this.detectionHistory.filter(d => d.length > 0).length / 
                          this.detectionHistory.length
        };
    }

    /**
     * Проверить, загружена ли модель
     */
    isReady() {
        return this.isLoaded && this.model !== null;
    }

    /**
     * Выгрузить модель (освобождение памяти)
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
            this.isLoaded = false;
            CONFIG.log('ML модель выгружена');
        }
    }

    /**
     * Сбросить историю детекций
     */
    resetHistory() {
        this.detectionHistory = [];
        this.lastDetections = [];
    }

    /**
     * Получить информацию о модели
     */
    getModelInfo() {
        return {
            loaded: this.isLoaded,
            model: this.model ? 'COCO-SSD' : null,
            historyLength: this.detectionHistory.length,
            lastDetectionCount: this.lastDetections.length
        };
    }
}

// Создание глобального экземпляра
const mlDetector = new MLDetector();
