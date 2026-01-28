/**
 * Скрипт для увеличения изображений при клике
 * Работает с компонентом: node widget-markdown widget mark111 css39
 * 
 * Функциональность:
 * - Клик на изображение открывает полноэкранный просмотр
 * - Закрытие по крестику, клику вне изображения или Escape
 * - Плавные анимации
 */

(function() {
    'use strict';

    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageZoom);
    } else {
        initImageZoom();
    }

    function initImageZoom() {
        // Находим контейнер с классом mark111 (компонент markdown)
        const markdownContainer = document.querySelector('.mark111 .root');
        
        if (!markdownContainer) {
            console.warn('Контейнер .mark111 .root не найден');
            return;
        }

        // Создаем модальное окно для увеличения
        const zoomModal = createZoomModal();
        document.body.appendChild(zoomModal);

        // Получаем все изображения внутри параграфов в контейнере
        const images = markdownContainer.querySelectorAll('p img');

        if (images.length === 0) {
            console.warn('Изображения в контейнере .mark111 не найдены');
            return;
        }

        // Добавляем обработчики для каждого изображения
        images.forEach((img, index) => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                openZoomModal(zoomModal, this.src, this.alt);
            });
        });

        // Обработчики закрытия модального окна
        setupModalHandlers(zoomModal);

        console.log(`Инициализирован zoom для ${images.length} изображений`);
    }

    /**
     * Создает модальное окно для увеличения изображений
     */
    function createZoomModal() {
        const modal = document.createElement('div');
        modal.className = 'zoom-modal';
        modal.id = 'zoomModal';
        modal.innerHTML = `
            <span class="zoom-modal-close" id="closeZoom">&times;</span>
            <div class="zoom-modal-content">
                <img id="zoomImage" src="" alt="">
            </div>
        `;

        // Добавляем стили если их еще нет
        if (!document.getElementById('zoomModalStyles')) {
            const style = document.createElement('style');
            style.id = 'zoomModalStyles';
            style.textContent = getModalStyles();
            document.head.appendChild(style);
        }

        return modal;
    }

    /**
     * Возвращает CSS стили для модального окна
     */
    function getModalStyles() {
        return `
            .zoom-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.85);
                animation: fadeIn 0.3s ease;
                align-items: center;
                justify-content: center;
            }

            .zoom-modal.active {
                display: flex;
            }

            .zoom-modal.hiding {
                animation: fadeOut 0.3s ease;
            }

            .zoom-modal-content {
                max-width: 90vw;
                max-height: 90vh;
                animation: zoomIn 0.3s ease;
                position: relative;
            }

            .zoom-modal.hiding .zoom-modal-content {
                animation: zoomOut 0.3s ease;
            }

            .zoom-modal-content img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .zoom-modal-close {
                position: absolute;
                top: 20px;
                right: 30px;
                color: white;
                font-size: 40px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.3s ease, transform 0.3s ease;
                z-index: 10001;
                user-select: none;
                line-height: 1;
            }

            .zoom-modal-close:hover {
                color: #ccc;
                transform: scale(1.1);
            }

            .zoom-modal-close:active {
                transform: scale(0.95);
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }

            @keyframes zoomIn {
                from {
                    transform: scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes zoomOut {
                from {
                    transform: scale(1);
                    opacity: 1;
                }
                to {
                    transform: scale(0.8);
                    opacity: 0;
                }
            }

            /* Для мобильных устройств */
            @media (max-width: 768px) {
                .zoom-modal-close {
                    top: 10px;
                    right: 15px;
                    font-size: 30px;
                }

                .zoom-modal-content {
                    max-width: 95vw;
                    max-height: 95vh;
                }
            }
        `;
    }

    /**
     * Открывает модальное окно с изображением
     */
    function openZoomModal(modal, imageSrc, imageAlt) {
        const zoomImage = modal.querySelector('#zoomImage');
        zoomImage.src = imageSrc;
        zoomImage.alt = imageAlt;
        
        modal.classList.remove('hiding');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Закрывает модальное окно
     */
    function closeZoomModal(modal) {
        modal.classList.add('hiding');
        
        // Ждем завершения анимации перед скрытием
        setTimeout(() => {
            modal.classList.remove('active');
            modal.classList.remove('hiding');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    /**
     * Настраивает обработчики событий для модального окна
     */
    function setupModalHandlers(modal) {
        const closeBtn = modal.querySelector('#closeZoom');

        // Закрытие по крестику
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeZoomModal(modal);
        });

        // Закрытие при клике вне изображения
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeZoomModal(modal);
            }
        });

        // Закрытие при нажатии Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeZoomModal(modal);
            }
        });

        // Закрытие при нажатии на мобильном устройстве вне изображения
        if (window.innerWidth <= 768) {
            modal.addEventListener('touchstart', function(e) {
                if (e.target === modal) {
                    closeZoomModal(modal);
                }
            });
        }
    }

})();
