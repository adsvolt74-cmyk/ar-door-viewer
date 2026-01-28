# Яндекс.Директ API Manager - Полное руководство

## Содержание
1. [Введение](#введение)
2. [Установка и настройка](#установка-и-настройка)
3. [Получение OAuth токена](#получение-oauth-токена)
4. [Основные компоненты](#основные-компоненты)
5. [Примеры использования](#примеры-использования)
6. [API методы](#api-методы)
7. [Автоматизация](#автоматизация)
8. [Обработка ошибок](#обработка-ошибок)
9. [Лучшие практики](#лучшие-практики)

---

## Введение

Яндекс.Директ API Manager - это Python-библиотека для автоматизации управления рекламными кампаниями в Яндекс.Директ. Она предоставляет удобный интерфейс для работы с основными операциями:

- **Управление кампаниями** - создание, обновление, приостановка
- **Управление объявлениями** - получение, обновление статуса
- **Управление ключевыми словами** - получение, обновление ставок
- **Получение статистики** - анализ производительности
- **Автоматизация** - автоматическое управление на основе метрик

---

## Установка и настройка

### 1. Требования

```bash
Python 3.7+
requests>=2.25.0
python-dotenv>=0.19.0
```

### 2. Установка зависимостей

```bash
pip install requests python-dotenv
```

### 3. Структура файлов

```
project/
├── yandex_direct_manager.py      # Основной класс менеджера
├── yandex_direct_config.py       # Конфигурация
├── yandex_direct_examples.py     # Примеры использования
├── .env                          # Переменные окружения
└── reports/                      # Директория для отчетов
```

### 4. Создание файла .env

Создайте файл `.env` в корневой директории проекта:

```env
# Яндекс.Директ API
YANDEX_DIRECT_TOKEN=your_access_token_here

# Окружение (development, production, testing)
ENVIRONMENT=development

# Использовать sandbox для тестирования
USE_SANDBOX=True

# Логирование
LOG_LEVEL=INFO
LOG_FILE=yandex_direct.log

# Таймауты
REQUEST_TIMEOUT=30
RETRY_ATTEMPTS=3
RETRY_DELAY=5
```

---

## Получение OAuth токена

### Шаг 1: Регистрация приложения

1. Перейдите на https://oauth.yandex.ru/
2. Нажмите "Создать новое приложение"
3. Заполните форму:
   - **Название**: Ваше приложение
   - **Описание**: Описание приложения
   - **Платформа**: Веб-сервис
   - **Redirect URI**: `http://localhost:8080/callback`

### Шаг 2: Получение Client ID и Client Secret

После создания приложения вы получите:
- **Client ID** (ID приложения)
- **Client Secret** (пароль приложения)

### Шаг 3: Получение Authorization Code

Откройте в браузере:

```
https://oauth.yandex.ru/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:8080/callback
```

Вы будете перенаправлены на страницу с кодом авторизации.

### Шаг 4: Обмен кода на токен

```bash
curl -X POST https://oauth.yandex.ru/token \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Ответ будет содержать `access_token` - это и есть ваш OAuth токен.

### Шаг 5: Сохранение токена

Сохраните полученный токен в файл `.env`:

```env
YANDEX_DIRECT_TOKEN=your_access_token_here
```

---

## Основные компоненты

### YandexDirectManager

Основной класс для работы с API Яндекс.Директ.

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config

# Инициализация
manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)
```

### CampaignAutomation

Класс для автоматизации управления кампаниями.

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)
```

### Config

Конфигурация приложения с поддержкой разных окружений.

```python
from yandex_direct_config import config

# Доступ к параметрам конфигурации
token = config.YANDEX_DIRECT_TOKEN
use_sandbox = config.USE_SANDBOX
automation_config = config.AUTOMATION_CONFIG
```

---

## Примеры использования

### Пример 1: Получение списка кампаний

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=True
)

# Получаем все кампании
campaigns = manager.get_campaigns()

for campaign in campaigns:
    print(f"ID: {campaign['Id']}")
    print(f"Название: {campaign['Name']}")
    print(f"Статус: {campaign['Status']}")
    print(f"Дневной бюджет: {campaign.get('DailyBudget', 'N/A')}")
    print("---")
```

### Пример 2: Создание новой кампании

```python
# Создаем новую кампанию
campaign_id = manager.create_campaign(
    name="Моя новая кампания",
    campaign_type="TEXT_CAMPAIGN",
    daily_budget=100000,  # 1000 рублей в копейках
    timezone="Europe/Moscow"
)

if campaign_id:
    print(f"Кампания создана с ID: {campaign_id}")
```

### Пример 3: Обновление кампании

```python
# Обновляем дневной бюджет
success = manager.update_campaign(
    campaign_id=123456,
    DailyBudget=150000  # 1500 рублей
)

if success:
    print("Кампания обновлена")
```

### Пример 4: Приостановка и возобновление кампании

```python
# Приостанавливаем кампанию
manager.pause_campaign(campaign_id=123456)

# Возобновляем кампанию
manager.resume_campaign(campaign_id=123456)
```

### Пример 5: Получение объявлений

```python
# Получаем объявления для конкретной кампании
ads = manager.get_ads(campaign_id=123456)

for ad in ads:
    print(f"ID: {ad['Id']}")
    print(f"Статус: {ad['Status']}")
    print(f"Тип: {ad.get('Type', 'N/A')}")
```

### Пример 6: Обновление статуса объявления

```python
# Приостанавливаем объявление
manager.update_ad_status(ad_id=987654, status="PAUSED")

# Включаем объявление
manager.update_ad_status(ad_id=987654, status="ENABLED")
```

### Пример 7: Получение ключевых слов

```python
# Получаем ключевые слова для кампании
keywords = manager.get_keywords(campaign_id=123456)

for keyword in keywords:
    print(f"ID: {keyword['Id']}")
    print(f"Слово: {keyword.get('Keyword', 'N/A')}")
    print(f"Ставка: {keyword.get('Bid', 'N/A')}")
```

### Пример 8: Обновление ставок

```python
# Увеличиваем ставку для ключевого слова
current_bid = 5000  # 50 рублей
new_bid = int(current_bid * 1.1)  # Увеличиваем на 10%

manager.update_keyword_bid(keyword_id=555555, bid=new_bid)
```

### Пример 9: Получение статистики

```python
# Получаем статистику за последние 7 дней
stats = manager.get_statistics(
    date_range_type="LAST_7_DAYS",
    campaign_ids=[123456, 789012]
)

for stat in stats:
    print(f"Дата: {stat.get('Date')}")
    print(f"Показы: {stat.get('Impressions', 0)}")
    print(f"Клики: {stat.get('Clicks', 0)}")
    print(f"Затраты: {stat.get('Cost', 0)}")
```

### Пример 10: Генерация отчета

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)

# Генерируем отчет по всем кампаниям
report = automation.generate_report()

print(f"Кампаний: {len(report['campaigns'])}")
print(f"Всего показов: {report['total_stats']['impressions']}")
print(f"Всего кликов: {report['total_stats']['clicks']}")
print(f"Всего затрат: {report['total_stats']['cost']}")
```

---

## API методы

### Методы кампаний

| Метод | Описание | Параметры |
|-------|---------|-----------|
| `get_campaigns()` | Получить список кампаний | `fields`, `limit` |
| `get_campaign_by_id(id)` | Получить кампанию по ID | `campaign_id` |
| `create_campaign()` | Создать новую кампанию | `name`, `campaign_type`, `daily_budget`, `timezone` |
| `update_campaign()` | Обновить кампанию | `campaign_id`, `**kwargs` |
| `pause_campaign(id)` | Приостановить кампанию | `campaign_id` |
| `resume_campaign(id)` | Возобновить кампанию | `campaign_id` |

### Методы объявлений

| Метод | Описание | Параметры |
|-------|---------|-----------|
| `get_ads()` | Получить список объявлений | `campaign_id`, `fields`, `limit` |
| `update_ad_status()` | Обновить статус объявления | `ad_id`, `status` |

### Методы ключевых слов

| Метод | Описание | Параметры |
|-------|---------|-----------|
| `get_keywords()` | Получить список ключевых слов | `campaign_id`, `fields`, `limit` |
| `update_keyword_bid()` | Обновить ставку | `keyword_id`, `bid` |

### Методы статистики

| Метод | Описание | Параметры |
|-------|---------|-----------|
| `get_statistics()` | Получить статистику | `date_range_type`, `fields`, `campaign_ids` |

### Методы групп объявлений

| Метод | Описание | Параметры |
|-------|---------|-----------|
| `get_ad_groups()` | Получить список групп | `campaign_id`, `fields`, `limit` |

---

## Автоматизация

### Приостановка кампаний с низким CTR

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)

# Приостанавливаем кампании с CTR < 0.5%
paused_campaigns = automation.pause_low_performing_campaigns(
    min_ctr=0.5,
    days=7
)

print(f"Приостановлено кампаний: {len(paused_campaigns)}")
```

### Увеличение ставок для лучших ключевых слов

```python
# Увеличиваем ставки на 10%
updated_count = automation.increase_bids_for_top_keywords(
    campaign_id=123456,
    increase_percent=10,
    min_conversions=5
)

print(f"Обновлено ключевых слов: {updated_count}")
```

### Генерация отчета

```python
# Генерируем отчет
report = automation.generate_report(campaign_ids=[123456, 789012])

# Сохраняем в JSON
import json
with open('report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
```

---

## Обработка ошибок

### Базовая обработка

```python
from yandex_direct_manager import YandexDirectManager

manager = YandexDirectManager(access_token="token")

try:
    campaigns = manager.get_campaigns()
except Exception as e:
    print(f"Ошибка: {e}")
```

### Обработка с логированием

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    campaigns = manager.get_campaigns()
except Exception as e:
    logger.error(f"Ошибка при получении кампаний: {e}")
```

### Обработка с повторными попытками

```python
import time

def retry_operation(func, max_attempts=3, delay=5):
    """Повторяет операцию при ошибке"""
    for attempt in range(max_attempts):
        try:
            return func()
        except Exception as e:
            if attempt < max_attempts - 1:
                logger.warning(f"Попытка {attempt + 1} не удалась, повтор через {delay}с...")
                time.sleep(delay)
            else:
                logger.error(f"Все попытки исчерпаны: {e}")
                raise

# Использование
campaigns = retry_operation(lambda: manager.get_campaigns())
```

---

## Лучшие практики

### 1. Использование Sandbox для тестирования

```python
# Для разработки и тестирования
manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=True
)

# Для продакшена
manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=False
)
```

### 2. Управление токенами

```python
# Никогда не коммитьте токены в git
# Используйте переменные окружения
import os
token = os.getenv("YANDEX_DIRECT_TOKEN")

# Или используйте .env файл
from dotenv import load_dotenv
load_dotenv()
token = os.getenv("YANDEX_DIRECT_TOKEN")
```

### 3. Логирование

```python
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('yandex_direct.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

### 4. Обработка лимитов API

```python
# API имеет лимиты на количество запросов
# Добавляйте задержки между запросами
import time

campaigns = manager.get_campaigns()
for campaign in campaigns:
    # Обработка кампании
    time.sleep(0.1)  # 100ms задержка
```

### 5. Кэширование результатов

```python
from functools import lru_cache
import time

class CachedManager:
    def __init__(self, manager):
        self.manager = manager
        self.cache = {}
        self.cache_time = {}
    
    def get_campaigns_cached(self, ttl=3600):
        """Получить кампании с кэшированием (TTL в секундах)"""
        cache_key = 'campaigns'
        
        if cache_key in self.cache:
            if time.time() - self.cache_time[cache_key] < ttl:
                return self.cache[cache_key]
        
        campaigns = self.manager.get_campaigns()
        self.cache[cache_key] = campaigns
        self.cache_time[cache_key] = time.time()
        
        return campaigns
```

### 6. Валидация данных

```python
def validate_campaign_data(name, daily_budget):
    """Валидирует данные кампании"""
    if not name or len(name) < 3:
        raise ValueError("Название кампании должно быть не менее 3 символов")
    
    if daily_budget < 100:
        raise ValueError("Дневной бюджет должен быть не менее 100 копеек")
    
    return True

# Использование
try:
    validate_campaign_data("Моя кампания", 100000)
    campaign_id = manager.create_campaign(
        name="Моя кампания",
        daily_budget=100000
    )
except ValueError as e:
    logger.error(f"Ошибка валидации: {e}")
```

### 7. Мониторинг и алерты

```python
def check_campaign_health(manager, campaign_id, min_ctr=0.5):
    """Проверяет здоровье кампании"""
    stats = manager.get_statistics(
        campaign_ids=[campaign_id],
        date_range_type="LAST_7_DAYS"
    )
    
    total_impressions = sum(s.get('Impressions', 0) for s in stats)
    total_clicks = sum(s.get('Clicks', 0) for s in stats)
    
    if total_impressions > 0:
        ctr = (total_clicks / total_impressions) * 100
        
        if ctr < min_ctr:
            logger.warning(f"Низкий CTR для кампании {campaign_id}: {ctr:.2f}%")
            return False
    
    return True
```

---

## Запуск примеров

### Запуск всех примеров

```bash
python yandex_direct_examples.py
```

### Запуск отдельного примера

```python
from yandex_direct_examples import YandexDirectExamples

examples = YandexDirectExamples()
examples.example_1_manage_campaigns()
examples.example_4_get_statistics()
examples.example_6_generate_report()
```

---

## Поддержка и документация

- [Официальная документация Яндекс.Директ API](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)
- [OAuth в Яндексе](https://yandex.ru/dev/id/doc/ru/concepts/oauth-overview)
- [Примеры кода](https://github.com/yandex-direct/api-examples)

---

## Лицензия

MIT License

---

## Автор

Создано для автоматизации управления рекламными кампаниями в Яндекс.Директ.
