/**
 * Generate Models - Генерация тестовых 3D-моделей дверей
 * Этот скрипт создает простые модели дверей в формате GLB
 */

class ModelGenerator {
    /**
     * Генерация классической двери
     */
    static generateClassicDoor() {
        const scene = new THREE.Scene();

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
    static generateModernDoor() {
        const scene = new THREE.Scene();

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
    static generateGlassDoor() {
        const scene = new THREE.Scene();

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
     * Экспорт сцены в GLB формат
     */
    static async exportToGLB(scene, filename) {
        try {
            // Динамическая загрузка GLTFExporter
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/exporters/GLTFExporter.js';
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    const exporter = new THREE.GLTFExporter();
                    
                    exporter.parse(
                        scene,
                        (gltf) => {
                            const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            link.click();
                            URL.revokeObjectURL(url);
                            resolve();
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            throw error;
        }
    }

    /**
     * Генерация всех моделей
     */
    static async generateAllModels() {
        try {
            console.log('Генерация тестовых моделей...');

            const models = [
                { name: 'door_classic.glb', generator: this.generateClassicDoor },
                { name: 'door_modern.glb', generator: this.generateModernDoor },
                { name: 'door_glass.glb', generator: this.generateGlassDoor }
            ];

            for (const model of models) {
                console.log(`Генерация ${model.name}...`);
                const scene = model.generator();
                await this.exportToGLB(scene, model.name);
                console.log(`${model.name} готов к скачиванию`);
            }

            console.log('Все модели сгенерированы!');

        } catch (error) {
            console.error('Ошибка при генерации моделей:', error);
        }
    }
}

// Функция для запуска генерации из консоли
function generateDoorModels() {
    ModelGenerator.generateAllModels();
}

console.log('Для генерации моделей выполните: generateDoorModels()');
