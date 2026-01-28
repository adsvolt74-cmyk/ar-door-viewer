"""
Примеры использования Яндекс.Директ API Manager
Практические сценарии автоматизации
"""

import json
from datetime import datetime, timedelta
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config
import logging

logger = logging.getLogger(__name__)


class YandexDirectExamples:
    """Примеры использования API"""
    
    def __init__(self):
        """Инициализация примеров"""
        self.manager = YandexDirectManager(
            access_token=config.YANDEX_DIRECT_TOKEN,
            use_sandbox=config.USE_SANDBOX
        )
        self.automation = CampaignAutomation(self.manager)
    
    # ==================== ПРИМЕР 1: УПРАВЛЕНИЕ КАМПАНИЯМИ ====================
    
    def example_1_manage_campaigns(self):
        """
        Пример 1: Получение, создание и обновление кампаний
        """
        print("\n" + "="*60)
        print("ПРИМЕР 1: Управление кампаниями")
        print("="*60)
        
        try:
            # Получаем все кампании
            print("\n1. Получение списка кампаний...")
            campaigns = self.manager.get_campaigns()
            print(f"Найдено кампаний: {len(campaigns)}")
            
            for campaign in campaigns[:3]:
                print(f"  - ID: {campaign['Id']}, Название: {campaign['Name']}, "
                      f"Статус: {campaign['Status']}")
            
            # Создаем новую кампанию
            print("\n2. Создание новой кампании...")
            new_campaign_id = self.manager.create_campaign(
                name="Автоматическая кампания " + datetime.now().strftime("%Y-%m-%d %H:%M"),
                campaign_type="TEXT_CAMPAIGN",
                daily_budget=100000,  # 1000 рублей
                timezone="Europe/Moscow"
            )
            
            if new_campaign_id:
                print(f"✓ Кампания создана с ID: {new_campaign_id}")
                
                # Получаем информацию о созданной кампании
                campaign_info = self.manager.get_campaign_by_id(new_campaign_id)
                if campaign_info:
                    print(f"  Название: {campaign_info['Name']}")
                    print(f"  Статус: {campaign_info['Status']}")
                    print(f"  Дневной бюджет: {campaign_info.get('DailyBudget', 'N/A')}")
                
                # Обновляем кампанию
                print("\n3. Обновление кампании...")
                if self.manager.update_campaign(
                    new_campaign_id,
                    DailyBudget=150000  # 1500 рублей
                ):
                    print(f"✓ Кампания {new_campaign_id} обновлена")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 1: {e}")
    
    # ==================== ПРИМЕР 2: УПРАВЛЕНИЕ ОБЪЯВЛЕНИЯМИ ====================
    
    def example_2_manage_ads(self):
        """
        Пример 2: Получение и управление объявлениями
        """
        print("\n" + "="*60)
        print("ПРИМЕР 2: Управление объявлениями")
        print("="*60)
        
        try:
            # Получаем кампании
            campaigns = self.manager.get_campaigns()
            
            if not campaigns:
                print("Кампании не найдены")
                return
            
            campaign_id = campaigns[0]["Id"]
            print(f"\nИспользуем кампанию: {campaigns[0]['Name']} (ID: {campaign_id})")
            
            # Получаем объявления
            print("\n1. Получение объявлений...")
            ads = self.manager.get_ads(campaign_id=campaign_id)
            print(f"Найдено объявлений: {len(ads)}")
            
            for ad in ads[:3]:
                print(f"  - ID: {ad['Id']}, Статус: {ad['Status']}, "
                      f"Тип: {ad.get('Type', 'N/A')}")
            
            # Обновляем статус объявлений
            if ads:
                print("\n2. Обновление статуса объявления...")
                ad_id = ads[0]["Id"]
                current_status = ads[0]["Status"]
                new_status = "PAUSED" if current_status == "ENABLED" else "ENABLED"
                
                if self.manager.update_ad_status(ad_id, new_status):
                    print(f"✓ Статус объявления {ad_id} изменен на {new_status}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 2: {e}")
    
    # ==================== ПРИМЕР 3: РАБОТА С КЛЮЧЕВЫМИ СЛОВАМИ ====================
    
    def example_3_manage_keywords(self):
        """
        Пример 3: Получение и управление ключевыми словами
        """
        print("\n" + "="*60)
        print("ПРИМЕР 3: Управление ключевыми словами")
        print("="*60)
        
        try:
            # Получаем кампании
            campaigns = self.manager.get_campaigns()
            
            if not campaigns:
                print("Кампании не найдены")
                return
            
            campaign_id = campaigns[0]["Id"]
            print(f"\nИспользуем кампанию: {campaigns[0]['Name']} (ID: {campaign_id})")
            
            # Получаем ключевые слова
            print("\n1. Получение ключевых слов...")
            keywords = self.manager.get_keywords(campaign_id=campaign_id)
            print(f"Найдено ключевых слов: {len(keywords)}")
            
            for keyword in keywords[:5]:
                print(f"  - ID: {keyword['Id']}, Слово: {keyword.get('Keyword', 'N/A')}, "
                      f"Ставка: {keyword.get('Bid', 'N/A')}")
            
            # Обновляем ставки
            if keywords:
                print("\n2. Обновление ставок...")
                keyword_id = keywords[0]["Id"]
                current_bid = keywords[0].get("Bid", 0)
                
                if current_bid > 0:
                    new_bid = int(current_bid * 1.1)  # Увеличиваем на 10%
                    
                    if self.manager.update_keyword_bid(keyword_id, new_bid):
                        print(f"✓ Ставка для ключевого слова {keyword_id} "
                              f"увеличена: {current_bid} -> {new_bid}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 3: {e}")
    
    # ==================== ПРИМЕР 4: ПОЛУЧЕНИЕ СТАТИСТИКИ ====================
    
    def example_4_get_statistics(self):
        """
        Пример 4: Получение и анализ статистики
        """
        print("\n" + "="*60)
        print("ПРИМЕР 4: Получение статистики")
        print("="*60)
        
        try:
            # Получаем кампании
            campaigns = self.manager.get_campaigns()
            
            if not campaigns:
                print("Кампании не найдены")
                return
            
            campaign_ids = [c["Id"] for c in campaigns[:5]]
            print(f"\nПолучаем статистику для {len(campaign_ids)} кампаний...")
            
            # Получаем статистику за последние 7 дней
            print("\n1. Статистика за последние 7 дней...")
            stats = self.manager.get_statistics(
                date_range_type="LAST_7_DAYS",
                campaign_ids=campaign_ids
            )
            
            print(f"Записей статистики: {len(stats)}")
            
            # Анализируем статистику
            total_impressions = 0
            total_clicks = 0
            total_cost = 0
            
            for stat in stats[:5]:
                impressions = stat.get("Impressions", 0)
                clicks = stat.get("Clicks", 0)
                cost = stat.get("Cost", 0)
                
                total_impressions += impressions
                total_clicks += clicks
                total_cost += cost
                
                ctr = (clicks / impressions * 100) if impressions > 0 else 0
                cpc = (cost / clicks) if clicks > 0 else 0
                
                print(f"  Дата: {stat.get('Date')}, "
                      f"Показы: {impressions}, Клики: {clicks}, "
                      f"CTR: {ctr:.2f}%, CPC: {cpc:.2f}")
            
            # Общая статистика
            print("\n2. Общая статистика:")
            avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
            avg_cpc = (total_cost / total_clicks) if total_clicks > 0 else 0
            
            print(f"  Всего показов: {total_impressions}")
            print(f"  Всего кликов: {total_clicks}")
            print(f"  Средний CTR: {avg_ctr:.2f}%")
            print(f"  Средний CPC: {avg_cpc:.2f}")
            print(f"  Общие затраты: {total_cost}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 4: {e}")
    
    # ==================== ПРИМЕР 5: АВТОМАТИЗАЦИЯ ====================
    
    def example_5_automation(self):
        """
        Пример 5: Автоматизация управления кампаниями
        """
        print("\n" + "="*60)
        print("ПРИМЕР 5: Автоматизация")
        print("="*60)
        
        try:
            # Приостанавливаем кампании с низким CTR
            print("\n1. Приостановка кампаний с низким CTR...")
            min_ctr = config.AUTOMATION_CONFIG["min_ctr"]
            paused = self.automation.pause_low_performing_campaigns(min_ctr=min_ctr)
            
            if paused:
                print(f"✓ Приостановлено кампаний: {len(paused)}")
                for campaign_id in paused:
                    print(f"  - Кампания {campaign_id}")
            else:
                print("Кампаний для приостановки не найдено")
            
            # Увеличиваем ставки для лучших ключевых слов
            print("\n2. Увеличение ставок для лучших ключевых слов...")
            campaigns = self.manager.get_campaigns()
            
            if campaigns:
                campaign_id = campaigns[0]["Id"]
                increase_percent = config.AUTOMATION_CONFIG["bid_increase_percent"]
                
                updated = self.automation.increase_bids_for_top_keywords(
                    campaign_id=campaign_id,
                    increase_percent=increase_percent
                )
                
                print(f"✓ Обновлено ключевых слов: {updated}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 5: {e}")
    
    # ==================== ПРИМЕР 6: ГЕНЕРАЦИЯ ОТЧЕТА ====================
    
    def example_6_generate_report(self):
        """
        Пример 6: Генерация подробного отчета
        """
        print("\n" + "="*60)
        print("ПРИМЕР 6: Генерация отчета")
        print("="*60)
        
        try:
            print("\nГенерируем отчет по всем кампаниям...")
            report = self.automation.generate_report()
            
            print(f"\nОтчет сгенерирован: {report['generated_at']}")
            print(f"Кампаний в отчете: {len(report['campaigns'])}")
            
            # Выводим информацию по каждой кампании
            print("\nДетали по кампаниям:")
            for campaign in report['campaigns'][:5]:
                print(f"\n  Кампания: {campaign['name']} (ID: {campaign['id']})")
                print(f"    Статус: {campaign['status']}")
                print(f"    Показы: {campaign['stats'].get('impressions', 0)}")
                print(f"    Клики: {campaign['stats'].get('clicks', 0)}")
                print(f"    CTR: {campaign['stats'].get('ctr', 0):.2f}%")
                print(f"    CPC: {campaign['stats'].get('cpc', 0):.2f}")
                print(f"    Затраты: {campaign['stats'].get('cost', 0)}")
                print(f"    Конверсии: {campaign['stats'].get('conversions', 0)}")
            
            # Общая статистика
            print("\nОбщая статистика:")
            total = report['total_stats']
            print(f"  Всего показов: {total['impressions']}")
            print(f"  Всего кликов: {total['clicks']}")
            print(f"  Всего затрат: {total['cost']}")
            print(f"  Всего конверсий: {total['conversions']}")
            
            # Сохраняем отчет в JSON
            report_filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            print(f"\n✓ Отчет сохранен в файл: {report_filename}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 6: {e}")
    
    # ==================== ПРИМЕР 7: РАБОТА С ГРУППАМИ ОБЪЯВЛЕНИЙ ====================
    
    def example_7_manage_ad_groups(self):
        """
        Пример 7: Получение информации о группах объявлений
        """
        print("\n" + "="*60)
        print("ПРИМЕР 7: Управление группами объявлений")
        print("="*60)
        
        try:
            # Получаем кампании
            campaigns = self.manager.get_campaigns()
            
            if not campaigns:
                print("Кампании не найдены")
                return
            
            campaign_id = campaigns[0]["Id"]
            print(f"\nИспользуем кампанию: {campaigns[0]['Name']} (ID: {campaign_id})")
            
            # Получаем группы объявлений
            print("\n1. Получение групп объявлений...")
            ad_groups = self.manager.get_ad_groups(campaign_id=campaign_id)
            print(f"Найдено групп объявлений: {len(ad_groups)}")
            
            for ad_group in ad_groups[:5]:
                print(f"  - ID: {ad_group['Id']}, Название: {ad_group.get('Name', 'N/A')}, "
                      f"Статус: {ad_group['Status']}")
        
        except Exception as e:
            logger.error(f"Ошибка в примере 7: {e}")
    
    # ==================== ЗАПУСК ВСЕХ ПРИМЕРОВ ====================
    
    def run_all_examples(self):
        """Запускает все примеры"""
        print("\n" + "="*60)
        print("ЯНДЕКС.ДИРЕКТ API - ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ")
        print("="*60)
        
        examples = [
            ("Управление кампаниями", self.example_1_manage_campaigns),
            ("Управление объявлениями", self.example_2_manage_ads),
            ("Управление ключевыми словами", self.example_3_manage_keywords),
            ("Получение статистики", self.example_4_get_statistics),
            ("Автоматизация", self.example_5_automation),
            ("Генерация отчета", self.example_6_generate_report),
            ("Управление группами объявлений", self.example_7_manage_ad_groups),
        ]
        
        for i, (name, example_func) in enumerate(examples, 1):
            try:
                example_func()
            except Exception as e:
                print(f"\n✗ Ошибка в примере {i} ({name}): {e}")
            
            # Небольшая задержка между примерами
            import time
            time.sleep(1)
        
        print("\n" + "="*60)
        print("ВСЕ ПРИМЕРЫ ЗАВЕРШЕНЫ")
        print("="*60)


def main():
    """Главная функция"""
    examples = YandexDirectExamples()
    
    # Запускаем все примеры
    examples.run_all_examples()
    
    # Или запускаем отдельные примеры:
    # examples.example_1_manage_campaigns()
    # examples.example_4_get_statistics()
    # examples.example_6_generate_report()


if __name__ == "__main__":
    main()
