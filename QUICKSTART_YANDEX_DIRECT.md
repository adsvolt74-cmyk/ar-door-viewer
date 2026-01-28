# Быстрый старт - Яндекс.Директ API Manager

## За 5 минут до первого запроса

### Шаг 1: Установка зависимостей

```bash
pip install -r requirements.txt
```

### Шаг 2: Получение OAuth токена

1. Перейдите на https://oauth.yandex.ru/
2. Создайте новое приложение
3. Получите `access_token`

### Шаг 3: Настройка окружения

Скопируйте файл `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и добавьте ваш токен:

```env
YANDEX_DIRECT_TOKEN=your_access_token_here
USE_SANDBOX=True
```

### Шаг 4: Первый запрос

Создайте файл `test_api.py`:

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config

# Инициализация
manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

# Получаем кампании
campaigns = manager.get_campaigns()

print(f"Найдено кампаний: {len(campaigns)}")
for campaign in campaigns[:5]:
    print(f"  - {campaign['Name']} (ID: {campaign['Id']})")
```

Запустите:

```bash
python test_api.py
```

---

## Основные операции

### Получение кампаний

```python
campaigns = manager.get_campaigns()
```

### Создание кампании

```python
campaign_id = manager.create_campaign(
    name="Моя кампания",
    daily_budget=100000  # 1000 рублей
)
```

### Обновление кампании

```python
manager.update_campaign(
    campaign_id=123456,
    DailyBudget=150000
)
```

### Приостановка кампании

```python
manager.pause_campaign(campaign_id=123456)
```

### Получение объявлений

```python
ads = manager.get_ads(campaign_id=123456)
```

### Получение ключевых слов

```python
keywords = manager.get_keywords(campaign_id=123456)
```

### Обновление ставки

```python
manager.update_keyword_bid(keyword_id=555555, bid=5000)
```

### Получение статистики

```python
stats = manager.get_statistics(
    date_range_type="LAST_7_DAYS",
    campaign_ids=[123456]
)
```

### Генерация отчета

```python
from yandex_direct_manager import CampaignAutomation

automation = CampaignAutomation(manager)
report = automation.generate_report()
```

---

## Примеры использования

### Пример 1: Список всех кампаний с статистикой

```python
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

automation = CampaignAutomation(manager)
report = automation.generate_report()

for campaign in report['campaigns']:
    print(f"Кампания: {campaign['name']}")
    print(f"  Показы: {campaign['stats']['impressions']}")
    print(f"  Клики: {campaign['stats']['clicks']}")
    print(f"  CTR: {campaign['stats'].get('ctr', 0):.2f}%")
    print(f"  Затраты: {campaign['stats']['cost']}")
```

### Пример 2: Автоматическое увеличение ставок

```python
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

automation = CampaignAutomation(manager)

# Увеличиваем ставки на 10% для первой кампании
campaigns = manager.get_campaigns()
if campaigns:
    updated = automation.increase_bids_for_top_keywords(
        campaign_id=campaigns[0]['Id'],
        increase_percent=10
    )
    print(f"Обновлено ключевых слов: {updated}")
```

### Пример 3: Приостановка неэффективных кампаний

```python
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

automation = CampaignAutomation(manager)

# Приостанавливаем кампании с CTR < 0.5%
paused = automation.pause_low_performing_campaigns(min_ctr=0.5)
print(f"Приостановлено кампаний: {len(paused)}")
```

### Пример 4: Экспорт статистики в JSON

```python
import json
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

automation = CampaignAutomation(manager)
report = automation.generate_report()

# Сохраняем в JSON
with open('report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print("Отчет сохранен в report.json")
```

---

## Обработка ошибок

```python
from yandex_direct_manager import YandexDirectManager
from yandex_direct_config import config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

manager = YandexDirectManager(
    access_token=config.YANDEX_DIRECT_TOKEN,
    use_sandbox=config.USE_SANDBOX
)

try:
    campaigns = manager.get_campaigns()
except Exception as e:
    logger.error(f"Ошибка при получении кампаний: {e}")
```

---

## Тестирование с Sandbox

Для безопасного тестирования используйте sandbox окружение:

```env
USE_SANDBOX=True
```

В sandbox вы можете:
- Создавать и удалять кампании без реальных затрат
- Тестировать все операции API
- Разрабатывать и отлаживать код

Когда будете готовы к продакшену:

```env
USE_SANDBOX=False
```

---

## Полезные ссылки

- [Полное руководство](YANDEX_DIRECT_API_GUIDE.md)
- [Примеры использования](yandex_direct_examples.py)
- [Официальная документация API](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)
- [OAuth в Яндексе](https://yandex.ru/dev/id/doc/ru/concepts/oauth-overview)

---

## Часто задаваемые вопросы

### Q: Как получить OAuth токен?
A: Перейдите на https://oauth.yandex.ru/, создайте приложение и получите токен.

### Q: Можно ли тестировать без реальных затрат?
A: Да, используйте `USE_SANDBOX=True` в файле `.env`.

### Q: Какие операции поддерживаются?
A: Управление кампаниями, объявлениями, ключевыми словами, получение статистики и автоматизация.

### Q: Как обработать ошибки?
A: Используйте try-except блоки и логирование (см. примеры выше).

### Q: Где найти полную документацию?
A: В файле [YANDEX_DIRECT_API_GUIDE.md](YANDEX_DIRECT_API_GUIDE.md).

---

## Поддержка

Если у вас возникли проблемы:

1. Проверьте, что токен правильно установлен в `.env`
2. Убедитесь, что используется правильное окружение (sandbox/production)
3. Посмотрите логи в файле `yandex_direct.log`
4. Обратитесь к [официальной документации](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)

---

Готово! Теперь вы можете начать использовать Яндекс.Директ API Manager.
