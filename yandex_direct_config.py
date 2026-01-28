"""
Конфигурация для Яндекс.Директ API Manager
"""

import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()


class Config:
    """Базовая конфигурация"""
    
    # API токен (получить можно на https://oauth.yandex.ru/)
    YANDEX_DIRECT_TOKEN = os.getenv(
        "YANDEX_DIRECT_TOKEN",
        "your_access_token_here"
    )
    
    # Использовать sandbox для тестирования
    USE_SANDBOX = os.getenv("USE_SANDBOX", "True").lower() == "true"
    
    # Логирование
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "yandex_direct.log")
    
    # Таймауты
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
    RETRY_ATTEMPTS = int(os.getenv("RETRY_ATTEMPTS", "3"))
    RETRY_DELAY = int(os.getenv("RETRY_DELAY", "5"))
    
    # Лимиты
    MAX_CAMPAIGNS_PER_REQUEST = 10000
    MAX_ADS_PER_REQUEST = 10000
    MAX_KEYWORDS_PER_REQUEST = 10000
    
    # Параметры автоматизации
    AUTOMATION_CONFIG = {
        # Минимальный CTR для кампаний (в процентах)
        "min_ctr": 0.5,
        
        # Период анализа для статистики (в днях)
        "analysis_period": 7,
        
        # Процент увеличения ставок
        "bid_increase_percent": 10,
        
        # Минимальное количество конверсий для увеличения ставок
        "min_conversions": 5,
        
        # Максимальная ставка (в копейках)
        "max_bid": 1000000,
        
        # Минимальная ставка (в копейках)
        "min_bid": 100,
    }
    
    # Параметры отчетов
    REPORT_CONFIG = {
        # Период по умолчанию
        "default_period": "LAST_30_DAYS",
        
        # Формат вывода (json, csv, excel)
        "output_format": "json",
        
        # Директория для сохранения отчетов
        "output_dir": "./reports",
    }


class DevelopmentConfig(Config):
    """Конфигурация для разработки"""
    USE_SANDBOX = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    """Конфигурация для продакшена"""
    USE_SANDBOX = False
    LOG_LEVEL = "INFO"


class TestingConfig(Config):
    """Конфигурация для тестирования"""
    USE_SANDBOX = True
    LOG_LEVEL = "DEBUG"


# Выбор конфигурации в зависимости от окружения
ENV = os.getenv("ENVIRONMENT", "development").lower()

if ENV == "production":
    config = ProductionConfig()
elif ENV == "testing":
    config = TestingConfig()
else:
    config = DevelopmentConfig()
