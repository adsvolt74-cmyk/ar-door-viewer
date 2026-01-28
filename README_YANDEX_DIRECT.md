# Яндекс.Директ API Manager

Полнофункциональная Python-библиотека для автоматизации управления рекламными кампаниями в Яндекс.Директ.

## 🚀 Возможности

- ✅ **Управление кампаниями** - создание, обновление, приостановка, возобновление
- ✅ **Управление объявлениями** - получение, обновление статуса
- ✅ **Управление ключевыми словами** - получение, обновление ставок
- ✅ **Получение статистики** - анализ производительности кампаний
- ✅ **Автоматизация** - автоматическое управление на основе метрик
- ✅ **Генерация отчетов** - подробные отчеты по кампаниям
- ✅ **Sandbox окружение** - безопасное тестирование без реальных затрат
- ✅ **Обработка ошибок** - надежная обработка исключений и повторные попытки
- ✅ **Логирование** - подробное логирование всех операций

## 📋 Требования

- Python 3.7+
- requests >= 2.25.0
- python-dotenv >= 0.19.0

## 🔧 Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd yandex-direct-manager
```

### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка окружения

Скопируйте файл `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и добавьте ваш OAuth токен:

```env
YANDEX_DIRECT_TOKEN=your_access_token_here
USE_SANDBOX=True
```

## 🔑 Получение OAuth токена

1. Перейдите на https://oauth.yandex.ru/
2. Создайте новое приложение
3. Получите `access_token`
4. Добавьте токен в файл `.env`

Подробные инструкции см. в [YANDEX_DIRECT_API_GUIDE.md](YANDEX_DIRECT_API_GUIDE.md#получение-oauth-токена)

## 📚 Структура проекта

```
yandex-direct-manager/
├── yandex_direct_manager.py      # Основной класс менеджера API
├── yandex_direct_config.py       # Конфигурация приложения
├── yandex_direct_examples.py     # Примеры использования
├── YANDEX_DIRECT_API_GUIDE.md    # Полное руководство
├── QUICKSTART_YANDEX_DIRECT.md   # Быстрый старт
├── README_YANDEX_DIRECT.md       # Этот файл
├── requirements.txt              # Зависимости
├── .env.example                  # Шаблон переменных окружения
└── reports/                      # Директория для отчетов
```

## 🚀 Быстрый старт

### Получение списка кампаний

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

campaigns = manager.get_campaigns()
for campaign in campaigns:
    print(f"{campaign['Name']} (ID: {campaign['Id']})")
```

### Создание новой кампании

```python
campaign_id = manager.create_campaign(
    name="Моя новая кампания",
    daily_budget=100000,  # 1000 рублей
    timezone="Europe/Moscow"
)
print(f"Кампания создана: {campaign_id}")
```

### Получение статистики

```python
stats = manager.get_statistics(
    date_range_type="LAST_7_DAYS",
    campaign_ids=[123456]
)

for stat in stats:
    print(f"Дата: {stat['Date']}, Показы: {stat['Impressions']}, Клики: {stat['Clicks']}")
```

### Автоматизация

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)

# Приостанавливаем кампании с низким CTR
paused = automation.pause_low_performing_campaigns(min_ctr=0.5)

# Увеличиваем ставки для лучших ключевых слов
updated = automation.increase_bids_for_top_keywords(
    campaign_id=123456,
    increase_percent=10
)

# Генерируем отчет
report = automation.generate_report()
```

## 📖 Документация

### Основные классы

#### YandexDirectManager

Основной класс для работы с API Яндекс.Директ.

**Методы:**
- `get_campaigns()` - получить список кампаний
- `create_campaign()` - создать новую кампанию
- `update_campaign()` - обновить кампанию
- `pause_campaign()` - приостановить кампанию
- `resume_campaign()` - возобновить кампанию
- `get_ads()` - получить объявления
- `update_ad_status()` - обновить статус объявления
- `get_keywords()` - получить ключевые слова
- `update_keyword_bid()` - обновить ставку
- `get_statistics()` - получить статистику
- `get_ad_groups()` - получить группы объявлений

#### CampaignAutomation

Класс для автоматизации управления кампаниями.

**Методы:**
- `pause_low_performing_campaigns()` - приостановить неэффективные кампании
- `increase_bids_for_top_keywords()` - увеличить ставки для лучших ключевых слов
- `generate_report()` - генерировать отчет

### Конфигурация

Все параметры конфигурации находятся в файле `yandex_direct_config.py` и могут быть переопределены через переменные окружения в файле `.env`.

**Основные параметры:**
- `YANDEX_DIRECT_TOKEN` - OAuth токен
- `USE_SANDBOX` - использовать sandbox окружение
- `LOG_LEVEL` - уровень логирования
- `REQUEST_TIMEOUT` - таймаут запросов
- `AUTOMATION_CONFIG` - параметры автоматизации

## 💡 Примеры использования

### Пример 1: Управление кампаниями

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

# Получаем все кампании
campaigns = manager.get_campaigns()
print(f"Всего кампаний: {len(campaigns)}")

# Создаем новую кампанию
new_id = manager.create_campaign(
    name="Тестовая кампания",
    daily_budget=50000
)

# Обновляем кампанию
manager.update_campaign(new_id, DailyBudget=100000)

# Приостанавливаем кампанию
manager.pause_campaign(new_id)

# Возобновляем кампанию
manager.resume_campaign(new_id)
```

### Пример 2: Работа с объявлениями

```python
# Получаем объявления
ads = manager.get_ads(campaign_id=123456)

for ad in ads:
    print(f"ID: {ad['Id']}, Статус: {ad['Status']}")

# Обновляем статус объявления
manager.update_ad_status(ad_id=987654, status="PAUSED")
```

### Пример 3: Управление ключевыми словами

```python
# Получаем ключевые слова
keywords = manager.get_keywords(campaign_id=123456)

for keyword in keywords:
    print(f"Слово: {keyword['Keyword']}, Ставка: {keyword['Bid']}")

# Обновляем ставку
manager.update_keyword_bid(keyword_id=555555, bid=5000)
```

### Пример 4: Анализ статистики

```python
# Получаем статистику за последние 30 дней
stats = manager.get_statistics(
    date_range_type="LAST_30_DAYS",
    campaign_ids=[123456, 789012]
)

total_impressions = sum(s.get('Impressions', 0) for s in stats)
total_clicks = sum(s.get('Clicks', 0) for s in stats)
total_cost = sum(s.get('Cost', 0) for s in stats)

ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
cpc = (total_cost / total_clicks) if total_clicks > 0 else 0

print(f"Показы: {total_impressions}")
print(f"Клики: {total_clicks}")
print(f"CTR: {ctr:.2f}%")
print(f"CPC: {cpc:.2f}")
```

### Пример 5: Генерация отчета

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)
report = automation.generate_report()

print(f"Кампаний: {len(report['campaigns'])}")
print(f"Всего показов: {report['total_stats']['impressions']}")
print(f"Всего кликов: {report['total_stats']['clicks']}")
print(f"Всего затрат: {report['total_stats']['cost']}")

# Сохраняем в JSON
import json
with open('report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
```

## 🔍 Запуск примеров

Запустите все примеры:

```bash
python yandex_direct_examples.py
```

Или запустите отдельный пример:

```python
from yandex_direct_examples import YandexDirectExamples

examples = YandexDirectExamples()
examples.example_1_manage_campaigns()
examples.example_4_get_statistics()
examples.example_6_generate_report()
```

## ⚙️ Обработка ошибок

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    campaigns = manager.get_campaigns()
except Exception as e:
    logger.error(f"Ошибка при получении кампаний: {e}")
```

## 🛡️ Лучшие практики

### 1. Используйте Sandbox для тестирования

```python
manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=True  # Для разработки
)
```

### 2. Никогда не коммитьте токены

```bash
# Добавьте в .gitignore
echo ".env" >> .gitignore
```

### 3. Используйте логирование

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### 4. Добавляйте задержки между запросами

```python
import time

campaigns = manager.get_campaigns()
for campaign in campaigns:
    # Обработка
    time.sleep(0.1)  # 100ms задержка
```

### 5. Валидируйте данные

```python
def validate_campaign_data(name, daily_budget):
    if not name or len(name) < 3:
        raise ValueError("Название должно быть не менее 3 символов")
    if daily_budget < 100:
        raise ValueError("Бюджет должен быть не менее 100 копеек")
```

## 📊 Поддерживаемые операции

| Операция | Метод | Статус |
|----------|-------|--------|
| Получение кампаний | `get_campaigns()` | ✅ |
| Создание кампании | `create_campaign()` | ✅ |
| Обновление кампании | `update_campaign()` | ✅ |
| Приостановка кампании | `pause_campaign()` | ✅ |
| Возобновление кампании | `resume_campaign()` | ✅ |
| Получение объявлений | `get_ads()` | ✅ |
| Обновление объявления | `update_ad_status()` | ✅ |
| Получение ключевых слов | `get_keywords()` | ✅ |
| Обновление ставки | `update_keyword_bid()` | ✅ |
| Получение статистики | `get_statistics()` | ✅ |
| Получение групп объявлений | `get_ad_groups()` | ✅ |
| Автоматизация | `CampaignAutomation` | ✅ |

## 🔗 Полезные ссылки

- [Полное руководство](YANDEX_DIRECT_API_GUIDE.md)
- [Быстрый старт](QUICKSTART_YANDEX_DIRECT.md)
- [Официальная документация API](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)
- [OAuth в Яндексе](https://yandex.ru/dev/id/doc/ru/concepts/oauth-overview)
- [Примеры кода](https://github.com/yandex-direct/api-examples)

## ❓ Часто задаваемые вопросы

**Q: Как получить OAuth токен?**
A: Перейдите на https://oauth.yandex.ru/, создайте приложение и получите токен.

**Q: Можно ли тестировать без реальных затрат?**
A: Да, используйте `USE_SANDBOX=True` в файле `.env`.

**Q: Какие операции поддерживаются?**
A: Управление кампаниями, объявлениями, ключевыми словами, получение статистики и автоматизация.

**Q: Как обработать ошибки?**
A: Используйте try-except блоки и логирование.

**Q: Где найти полную документацию?**
A: В файле [YANDEX_DIRECT_API_GUIDE.md](YANDEX_DIRECT_API_GUIDE.md).

## 📝 Лицензия

MIT License

## 👨‍💻 Автор

Создано для автоматизации управления рекламными кампаниями в Яндекс.Директ.

## 🤝 Поддержка

Если у вас возникли проблемы:

1. Проверьте, что токен правильно установлен в `.env`
2. Убедитесь, что используется правильное окружение (sandbox/production)
3. Посмотрите логи в файле `yandex_direct.log`
4. Обратитесь к [официальной документации](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)

---

**Готово! Начните использовать Яндекс.Директ API Manager прямо сейчас.**

Для быстрого старта см. [QUICKSTART_YANDEX_DIRECT.md](QUICKSTART_YANDEX_DIRECT.md)
