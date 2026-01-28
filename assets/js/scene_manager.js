/**
 * Scene Manager - Управление Three.js сценой и 3D-рендерингом
 */

class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.doorModel = null;
        this.doorGroup = null;
        this.lights = {};
        this.isInitialized = false;
        this.modelCache = new Map();
        this.animationId = null;
        this.frameCount = 0;
        this.fps = 0;
        this.lastTime = Date.now();
    }

    /**
     * Инициализация Three.js сцены
     */
    init() {
        try {
            CONFIG.log('Инициализация Three.js сцены');

            // Создание сцены
            this.scene = new THREE.Scene();
            this.scene.background = null; // Прозрачный фон

            // Создание камеры
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;
            const aspect = width / height;

            this.camera = new THREE.PerspectiveCamera(
                CONFIG.THREE_CAMERA.fov,
                aspect,
                CONFIG.THREE_CAMERA.near,
                CONFIG.THREE_CAMERA.far
            );

            this.camera.position.set(
                CONFIG.THREE_CAMERA.position.x,
                CONFIG.THREE_CAMERA.position.y,
                CONFIG.THREE_CAMERA.position.z
            );

            // Создание рендерера
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                alpha: CONFIG.RENDERER.alpha,
                antialias: CONFIG.RENDERER.antialias,
                preserveDrawingBuffer: true
            });

            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(CONFIG.RENDERER.pixelRatio);
            this.renderer.shadowMap.enabled = CONFIG.RENDERER.shadows;
            this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

            // Настройка освещения
            this.setupLights();

            // Создание группы для двери
            this.doorGroup = new THREE.Group();
            this.scene.add(this.doorGroup);

            // Обработчик изменения размера окна
            window.addEventListener('resize', () => this.onWindowResize());

            this.isInitialized = true;
            CONFIG.log('Three.js сцена инициализирована');

            return true;

        } catch (error) {
            CONFIG.error('Ошибка инициализации Three.js:', error);
            throw error;
        }
    }

    /**
     * Настройка освещения сцены
     */
    setupLights() {
        // Окружающий свет
        const ambientLight = new THREE.AmbientLight(
            CONFIG.LIGHTING.ambientColor,
            CONFIG.LIGHTING.ambientIntensity
        );
        this.scene.add(ambientLight);
        this.lights.ambient = ambientLight;

        // Направленный свет
        const directionalLight = new THREE.DirectionalLight(
            CONFIG.LIGHTING.directionalColor,
            CONFIG.LIGHTING.directionalIntensity
        );

        directionalLight.position.set(
            CONFIG.LIGHTING.directionalPosition.x,
            CONFIG.LIGHTING.directionalPosition.y,
            CONFIG.LIGHTING.directionalPosition.z
        );

        if (CONFIG.RENDERER.shadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = CONFIG.RENDERER.shadowMapSize;
            directionalLight.shadow.mapSize.height = CONFIG.RENDERER.shadowMapSize;
            directionalLight.shadow.camera.far = 50;
        }

        this.scene.add(directionalLight);
        this.lights.directional = directionalLight;

        CONFIG.log('Освещение настроено');
    }

    /**
     * Загрузка 3D-модели двери (процедурная генерация)
     */
    async loadDoorModel(modelId) {
        try {
            CONFIG.log('Генерация модели:', modelId);

            // Проверка кэша
            if (this.modelCache.has(modelId)) {
                CONFIG.log('Модель загружена из кэша');
                return this.modelCache.get(modelId);
            }

            // Процедурная генерация модели
            let model;
            
            switch(modelId) {
                case 'door_classic':
                    model = this.generateClassicDoor();
                    break;
                case 'door_modern':
                    model = this.generateModernDoor();
                    break;
                case 'door_glass':
                    model = this.generateGlassDoor();
                    break;
                default:
                    model = this.generateClassicDoor();
            }

            // Оптимизация модели
            this.optimizeModel(model);

            // Кэширование
            if (CONFIG.MODELS.cacheModels) {
                this.modelCache.set(modelId, model);

                // Ограничение размера кэша
                if (this.modelCache.size > CONFIG.MODELS.maxCachedModels) {
                    const firstKey = this.modelCache.keys().next().value;
                    this.modelCache.delete(firstKey);
                }
            }

            CONFIG.log('Модель успешно сгенерирована');
            return model;

        } catch (error) {
            CONFIG.error('Ошибка генерации модели:', error);
            throw new Error(CONFIG.ERRORS.MODEL_LOAD_FAILED);
        }
    }

    /**
     * Генерация классической двери
     */
    generateClassicDoor() {
        const scene = new THREE.Group();

        // Дверной проем (рама)
        const frameGeometry = new THREE.BoxGeometry(1, 2.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            metalness: 0.3,
            roughness: 0.7
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.05;
        scene.add(frame);

        // Дверное полотно
        const doorGeometry = new THREE.BoxGeometry(0.9, 2, 0.05);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0xD2691E,
            metalness: 0.2,
            roughness: 0.6
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.z = 0.05;
        scene.add(door);

        // Дверная ручка
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0.3, 0, 0.1);
        scene.add(handle);

        // Панели на двери
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0522D,
            metalness: 0.1,
            roughness: 0.8
        });

        for (let i = 0; i < 2; i++) {
            const panelGeometry = new THREE.BoxGeometry(0.7, 0.8, 0.02);
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(0, 0.5 - i * 1, 0.06);
            scene.add(panel);
        }

        return scene;
    }

    /**
     * Генерация современной двери
     */
    generateModernDoor() {
        const scene = new THREE.Group();

        // Дверной проем (рама)
        const frameGeometry = new THREE.BoxGeometry(1, 2.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.05;
        scene.add(frame);

        // Дверное полотно (минималистичное)
        const doorGeometry = new THREE.BoxGeometry(0.9, 2, 0.04);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5,
            metalness: 0.3,
            roughness: 0.4
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.z = 0.05;
        scene.add(door);

        // Современная ручка (минималистичная)
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.2);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0,
            metalness: 0.9,
            roughness: 0.1
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0.35, 0, 0.12);
        scene.add(handle);

        // Горизонтальные линии (дизайн)
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0,
            metalness: 0.2,
            roughness: 0.6
        });

        for (let i = 0; i < 3; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.01);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(0, -0.6 + i * 0.6, 0.06);
            scene.add(line);
        }

        return scene;
    }

    /**
     * Генерация стеклянной двери
     */
    generateGlassDoor() {
        const scene = new THREE.Group();

        // Дверной проем (рама)
        const frameGeometry = new THREE.BoxGeometry(1, 2.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.6,
            roughness: 0.4
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.05;
        scene.add(frame);

        // Стеклянное полотно
        const glassGeometry = new THREE.BoxGeometry(0.85, 1.95, 0.03);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xB0E0E6,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.z = 0.05;
        scene.add(glass);

        // Металлическая ручка для стеклянной двери
        const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.95,
            roughness: 0.05
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0.35, 0, 0.1);
        scene.add(handle);

        // Горизонтальные разделители (имитация стекла)
        const dividerMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });

        for (let i = 0; i < 2; i++) {
            const dividerGeometry = new THREE.BoxGeometry(0.85, 0.02, 0.02);
            const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
            divider.position.set(0, -0.5 + i * 1, 0.06);
            scene.add(divider);
        }

        return scene;
    }

    /**
     * Оптимизация загруженной модели
     */
    optimizeModel(model) {
        let geometryCount = 0;
        let materialCount = 0;

        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Оптимизация геометрии
                if (child.geometry) {
                    child.geometry.computeBoundingBox();
                    child.geometry.computeVertexNormals();
                    geometryCount++;
                }

                // Оптимизация материала
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            this.optimizeMaterial(mat);
                        });
                        materialCount += child.material.length;
                    } else {
                        this.optimizeMaterial(child.material);
                        materialCount++;
                    }
                }

                // Включение теней
                if (CONFIG.RENDERER.shadows) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });

        CONFIG.log(`Модель оптимизирована: ${geometryCount} геометрий, ${materialCount} материалов`);
    }

    /**
     * Оптимизация материала
     */
    optimizeMaterial(material) {
        if (!material) return;

        // Отключение ненужных свойств
        material.side = THREE.DoubleSide;

        // Оптимизация текстур
        if (material.map) {
            material.map.minFilter = THREE.LinearFilter;
            material.map.magFilter = THREE.LinearFilter;
        }
    }

    /**
     * Установка модели двери в сцену
     */
    setDoorModel(model) {
        try {
            // Удаление старой модели
            if (this.doorModel) {
                this.doorGroup.remove(this.doorModel);
                this.doorModel = null;
            }

            // Клонирование модели для избежания конфликтов
            this.doorModel = model.clone();

            // Добавление в группу
            this.doorGroup.add(this.doorModel);

            CONFIG.log('Модель двери установлена в сцену');

        } catch (error) {
            CONFIG.error('Ошибка установки модели:', error);
            throw error;
        }
    }

    /**
     * Позиционирование двери в дверном проеме
     */
    positionDoor(detection, videoWidth, videoHeight) {
        if (!this.doorModel || !detection) {
            return;
        }

        try {
            const bbox = detection.bbox;

            // Преобразование координат из 2D в 3D
            const x = (bbox.x + bbox.width / 2) / videoWidth * 2 - 1;
            const y = -(bbox.y + bbox.height / 2) / videoHeight * 2 + 1;

            // Оценка расстояния на основе размера проема
            const sizeRatio = (bbox.width + bbox.height) / (videoWidth + videoHeight);
            const distance = 5 - sizeRatio * 3;

            // Позиционирование
            const targetPosition = {
                x: x * 3,
                y: y * 2,
                z: Math.max(1, distance)
            };

            // Сглаживание позиции
            this.doorGroup.position.lerp(
                new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
                CONFIG.SMOOTHING.positionAlpha
            );

            // Масштабирование под размер проема
            const scale = (bbox.width / videoWidth) * 3;
            const targetScale = Math.max(0.5, Math.min(2, scale));

            this.doorGroup.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                CONFIG.SMOOTHING.scaleAlpha
            );

        } catch (error) {
            CONFIG.error('Ошибка позиционирования двери:', error);
        }
    }

    /**
     * Масштабирование модели
     */
    scaleDoor(scale) {
        if (this.doorGroup) {
            this.doorGroup.scale.set(scale, scale, scale);
        }
    }

    /**
     * Поворот модели
     */
    rotateDoor(x, y, z) {
        if (this.doorGroup) {
            this.doorGroup.rotation.x = x;
            this.doorGroup.rotation.y = y;
            this.doorGroup.rotation.z = z;
        }
    }

    /**
     * Изменение яркости модели
     */
    setBrightness(brightness) {
        if (this.lights.ambient) {
            this.lights.ambient.intensity = brightness;
        }
        if (this.lights.directional) {
            this.lights.directional.intensity = brightness * 0.8;
        }
    }

    /**
     * Рендеринг сцены
     */
    render() {
        if (!this.isInitialized || !this.renderer) {
            return;
        }

        this.renderer.render(this.scene, this.camera);
        this.updateFPS();
    }

    /**
     * Обновление FPS счетчика
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    /**
     * Получить текущий FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Обработчик изменения размера окна
     */
    onWindowResize() {
        if (!this.camera || !this.renderer) {
            return;
        }

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        CONFIG.log(`Размер окна изменен: ${width}x${height}`);
    }

    /**
     * Получить скриншот сцены
     */
    takeScreenshot() {
        try {
            const dataUrl = this.renderer.domElement.toDataURL('image/png');
            return dataUrl;
        } catch (error) {
            CONFIG.error('Ошибка создания скриншота:', error);
            return null;
        }
    }

    /**
     * Очистка сцены
     */
    clear() {
        if (this.doorGroup) {
            this.doorGroup.clear();
        }
        if (this.scene) {
            this.scene.clear();
        }
    }

    /**
     * Выгрузка ресурсов
     */
    dispose() {
        try {
            // Очистка моделей
            this.modelCache.forEach((model) => {
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            });
            this.modelCache.clear();

            // Очистка сцены
            this.clear();

            // Выгрузка рендерера
            if (this.renderer) {
                this.renderer.dispose();
            }

            this.isInitialized = false;
            CONFIG.log('Scene Manager выгружен');

        } catch (error) {
            CONFIG.error('Ошибка выгрузки Scene Manager:', error);
        }
    }

    /**
     * Получить информацию о сцене
     */
    getSceneInfo() {
        return {
            initialized: this.isInitialized,
            fps: this.fps,
            modelCacheSize: this.modelCache.size,
            doorModelLoaded: this.doorModel !== null,
            rendererSize: {
                width: this.renderer?.domElement.width,
                height: this.renderer?.domElement.height
            }
        };
    }

    /**
     * Проверить инициализацию
     */
    isReady() {
        return this.isInitialized && this.renderer !== null;
    }
}

// Создание глобального экземпляра
let sceneManager = null;
