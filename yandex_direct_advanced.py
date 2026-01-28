"""
Продвинутые примеры использования Яндекс.Директ API Manager
Специфические сценарии и кейсы
"""

import json
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from yandex_direct_manager import YandexDirectManager, CampaignAutomation
from yandex_direct_config import config
import logging

logger = logging.getLogger(__name__)


class AdvancedYandexDirectScenarios:
    """Продвинутые сценарии использования API"""
    
    def __init__(self):
        """Инициализация"""
        self.manager = YandexDirectManager(
            access_token=config.YANDEX_DIRECT_TOKEN,
            use_sandbox=config.USE_SANDBOX
        )
        self.automation = CampaignAutomation(self.manager)
    
    # ==================== СЦЕНАРИЙ 1: АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ ====================
    
    def analyze_campaign_performance(self, campaign_id: int) -> Dict:
        """
        Анализирует производительность кампании за последние 30 дней
        
        Args:
            campaign_id: ID кампании
            
        Returns:
            Словарь с анализом
        """
        print(f"\n📊 Анализ производительности кампании {campaign_id}")
        
        try:
            # Получаем информацию о кампании
            campaign = self.manager.get_campaign_by_id(campaign_id)
            if not campaign:
                print(f"Кампания {campaign_id} не найдена")
                return {}
            
            # Получаем статистику за последние 30 дней
            stats = self.manager.get_statistics(
                date_range_type="LAST_30_DAYS",
                campaign_ids=[campaign_id]
            )
            
            # Анализируем данные
            analysis = {
                "campaign_id": campaign_id,
                "campaign_name": campaign.get("Name"),
                "analysis_date": datetime.now().isoformat(),
                "period": "LAST_30_DAYS",
                "metrics": {
                    "total_impressions": 0,
                    "total_clicks": 0,
                    "total_cost": 0,
                    "total_conversions": 0,
                    "avg_ctr": 0,
                    "avg_cpc": 0,
                    "avg_cpa": 0,
                    "conversion_rate": 0
                },
                "daily_breakdown": [],
                "trends": {
                    "impressions_trend": "stable",
                    "clicks_trend": "stable",
                    "cost_trend": "stable"
                }
            }
            
            # Суммируем метрики
            for stat in stats:
                analysis["metrics"]["total_impressions"] += stat.get("Impressions", 0)
                analysis["metrics"]["total_clicks"] += stat.get("Clicks", 0)
                analysis["metrics"]["total_cost"] += stat.get("Cost", 0)
                analysis["metrics"]["total_conversions"] += stat.get("Conversions", 0)
                
                # Добавляем дневной разбор
                analysis["daily_breakdown"].append({
                    "date": stat.get("Date"),
                    "impressions": stat.get("Impressions", 0),
                    "clicks": stat.get("Clicks", 0),
                    "cost": stat.get("Cost", 0),
                    "conversions": stat.get("Conversions", 0)
                })
            
            # Вычисляем средние метрики
            if analysis["metrics"]["total_impressions"] > 0:
                analysis["metrics"]["avg_ctr"] = (
                    analysis["metrics"]["total_clicks"] / 
                    analysis["metrics"]["total_impressions"] * 100
                )
            
            if analysis["metrics"]["total_clicks"] > 0:
                analysis["metrics"]["avg_cpc"] = (
                    analysis["metrics"]["total_cost"] / 
                    analysis["metrics"]["total_clicks"]
                )
            
            if analysis["metrics"]["total_conversions"] > 0:
                analysis["metrics"]["avg_cpa"] = (
                    analysis["metrics"]["total_cost"] / 
                    analysis["metrics"]["total_conversions"]
                )
                analysis["metrics"]["conversion_rate"] = (
                    analysis["metrics"]["total_conversions"] / 
                    analysis["metrics"]["total_clicks"] * 100
                )
            
            # Выводим результаты
            print(f"  Название: {campaign.get('Name')}")
            print(f"  Статус: {campaign.get('Status')}")
            print(f"\n  Метрики за 30 дней:")
            print(f"    Показы: {analysis['metrics']['total_impressions']}")
            print(f"    Клики: {analysis['metrics']['total_clicks']}")
            print(f"    CTR: {analysis['metrics']['avg_ctr']:.2f}%")
            print(f"    CPC: {analysis['metrics']['avg_cpc']:.2f}")
            print(f"    Затраты: {analysis['metrics']['total_cost']}")
            print(f"    Конверсии: {analysis['metrics']['total_conversions']}")
            print(f"    CPA: {analysis['metrics']['avg_cpa']:.2f}")
            print(f"    Conversion Rate: {analysis['metrics']['conversion_rate']:.2f}%")
            
            return analysis
        
        except Exception as e:
            logger.error(f"Ошибка при анализе кампании: {e}")
            return {}
    
    # ==================== СЦЕНАРИЙ 2: ОПТИМИЗАЦИЯ СТАВОК ====================
    
    def optimize_bids_by_performance(self, 
                                    campaign_id: int,
                                    top_percent: float = 20,
                                    bottom_percent: float = 20) -> Dict:
        """
        Оптимизирует ставки на основе производительности ключевых слов
        
        Args:
            campaign_id: ID кампании
            top_percent: Процент увеличения ставок для лучших
            bottom_percent: Процент уменьшения ставок для худших
            
        Returns:
            Результаты оптимизации
        """
        print(f"\n⚡ Оптимизация ставок для кампании {campaign_id}")
        
        try:
            keywords = self.manager.get_keywords(campaign_id=campaign_id)
            
            if not keywords:
                print("Ключевые слова не найдены")
                return {"updated": 0, "increased": 0, "decreased": 0}
            
            # Сортируем по производительности (по ставке)
            sorted_keywords = sorted(keywords, key=lambda x: x.get("Bid", 0), reverse=True)
            
            total_keywords = len(sorted_keywords)
            top_count = max(1, int(total_keywords * top_percent / 100))
            bottom_count = max(1, int(total_keywords * bottom_percent / 100))
            
            results = {
                "campaign_id": campaign_id,
                "total_keywords": total_keywords,
                "updated": 0,
                "increased": 0,
                "decreased": 0,
                "changes": []
            }
            
            # Увеличиваем ставки для лучших
            for keyword in sorted_keywords[:top_count]:
                keyword_id = keyword.get("Id")
                current_bid = keyword.get("Bid", 0)
                
                if current_bid > 0:
                    new_bid = int(current_bid * 1.15)  # Увеличиваем на 15%
                    
                    if self.manager.update_keyword_bid(keyword_id, new_bid):
                        results["updated"] += 1
                        results["increased"] += 1
                        results["changes"].append({
                            "keyword_id": keyword_id,
                            "action": "increased",
                            "old_bid": current_bid,
                            "new_bid": new_bid
                        })
            
            # Уменьшаем ставки для худших
            for keyword in sorted_keywords[-bottom_count:]:
                keyword_id = keyword.get("Id")
                current_bid = keyword.get("Bid", 0)
                
                if current_bid > 100:  # Минимальная ставка
                    new_bid = max(100, int(current_bid * 0.85))  # Уменьшаем на 15%
                    
                    if self.manager.update_keyword_bid(keyword_id, new_bid):
                        results["updated"] += 1
                        results["decreased"] += 1
                        results["changes"].append({
                            "keyword_id": keyword_id,
                            "action": "decreased",
                            "old_bid": current_bid,
                            "new_bid": new_bid
                        })
            
            print(f"  Всего ключевых слов: {total_keywords}")
            print(f"  Увеличено ставок: {results['increased']}")
            print(f"  Уменьшено ставок: {results['decreased']}")
            print(f"  Всего обновлено: {results['updated']}")
            
            return results
        
        except Exception as e:
            logger.error(f"Ошибка при оптимизации ставок: {e}")
            return {"updated": 0, "increased": 0, "decreased": 0}
    
    # ==================== СЦЕНАРИЙ 3: ЭКСПОРТ В CSV ====================
    
    def export_campaigns_to_csv(self, filename: str = "campaigns_export.csv") -> bool:
        """
        Экспортирует информацию о кампаниях в CSV
        
        Args:
            filename: Имя файла для экспорта
            
        Returns:
            True если успешно, False иначе
        """
        print(f"\n📥 Экспорт кампаний в {filename}")
        
        try:
            campaigns = self.manager.get_campaigns()
            
            if not campaigns:
                print("Кампании не найдены")
                return False
            
            # Получаем статистику для каждой кампании
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'ID', 'Название', 'Статус', 'Тип', 'Дневной бюджет',
                    'Часовой пояс', 'Дата начала', 'Дата окончания'
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                
                for campaign in campaigns:
                    writer.writerow({
                        'ID': campaign.get('Id'),
                        'Название': campaign.get('Name'),
                        'Статус': campaign.get('Status'),
                        'Тип': campaign.get('Type'),
                        'Дневной бюджет': campaign.get('DailyBudget', 'N/A'),
                        'Часовой пояс': campaign.get('Timezone'),
                        'Дата начала': campaign.get('StartDate', 'N/A'),
                        'Дата окончания': campaign.get('EndDate', 'N/A')
                    })
            
            print(f"✓ Экспортировано кампаний: {len(campaigns)}")
            print(f"✓ Файл сохранен: {filename}")
            return True
        
        except Exception as e:
            logger.error(f"Ошибка при экспорте: {e}")
            return False
    
    # ==================== СЦЕНАРИЙ 4: МОНИТОРИНГ БЮДЖЕТА ====================
    
    def monitor_budget_spending(self) -> Dict:
        """
        Мониторит расходование бюджета по кампаниям
        
        Returns:
            Информация о расходовании бюджета
        """
        print(f"\n💰 Мониторинг расходования бюджета")
        
        try:
            campaigns = self.manager.get_campaigns()
            stats = self.manager.get_statistics(date_range_type="TODAY")
            
            # Группируем статистику по кампаниям
            campaign_stats = {}
            for stat in stats:
                campaign_id = stat.get("CampaignId")
                if campaign_id not in campaign_stats:
                    campaign_stats[campaign_id] = {
                        "cost": 0,
                        "impressions": 0,
                        "clicks": 0
                    }
                
                campaign_stats[campaign_id]["cost"] += stat.get("Cost", 0)
                campaign_stats[campaign_id]["impressions"] += stat.get("Impressions", 0)
                campaign_stats[campaign_id]["clicks"] += stat.get("Clicks", 0)
            
            # Анализируем расходование
            budget_report = {
                "date": datetime.now().isoformat(),
                "campaigns": [],
                "total_daily_budget": 0,
                "total_spent_today": 0,
                "total_remaining": 0
            }
            
            for campaign in campaigns:
                campaign_id = campaign.get("Id")
                daily_budget = campaign.get("DailyBudget", 0)
                spent_today = campaign_stats.get(campaign_id, {}).get("cost", 0)
                remaining = daily_budget - spent_today
                spent_percent = (spent_today / daily_budget * 100) if daily_budget > 0 else 0
                
                budget_report["campaigns"].append({
                    "id": campaign_id,
                    "name": campaign.get("Name"),
                    "daily_budget": daily_budget,
                    "spent_today": spent_today,
                    "remaining": remaining,
                    "spent_percent": spent_percent,
                    "status": "⚠️ Перерасход" if remaining < 0 else "✓ В норме"
                })
                
                budget_report["total_daily_budget"] += daily_budget
                budget_report["total_spent_today"] += spent_today
            
            budget_report["total_remaining"] = (
                budget_report["total_daily_budget"] - 
                budget_report["total_spent_today"]
            )
            
            # Выводим результаты
            print(f"  Всего дневной бюджет: {budget_report['total_daily_budget']}")
            print(f"  Потрачено сегодня: {budget_report['total_spent_today']}")
            print(f"  Осталось: {budget_report['total_remaining']}")
            print(f"\n  По кампаниям:")
            
            for campaign in budget_report["campaigns"]:
                print(f"    {campaign['name']}: {campaign['spent_percent']:.1f}% "
                      f"({campaign['spent_today']}/{campaign['daily_budget']})")
            
            return budget_report
        
        except Exception as e:
            logger.error(f"Ошибка при мониторинге бюджета: {e}")
            return {}
    
    # ==================== СЦЕНАРИЙ 5: СРАВНЕНИЕ КАМПАНИЙ ====================
    
    def compare_campaigns(self, campaign_ids: List[int]) -> Dict:
        """
        Сравнивает производительность нескольких кампаний
        
        Args:
            campaign_ids: Список ID кампаний для сравнения
            
        Returns:
            Сравнительный анализ
        """
        print(f"\n📈 Сравнение {len(campaign_ids)} кампаний")
        
        try:
            comparison = {
                "date": datetime.now().isoformat(),
                "campaigns": [],
                "best_by_metric": {}
            }
            
            # Получаем статистику для каждой кампании
            for campaign_id in campaign_ids:
                campaign = self.manager.get_campaign_by_id(campaign_id)
                stats = self.manager.get_statistics(
                    date_range_type="LAST_7_DAYS",
                    campaign_ids=[campaign_id]
                )
                
                if not campaign:
                    continue
                
                # Суммируем метрики
                total_impressions = sum(s.get("Impressions", 0) for s in stats)
                total_clicks = sum(s.get("Clicks", 0) for s in stats)
                total_cost = sum(s.get("Cost", 0) for s in stats)
                total_conversions = sum(s.get("Conversions", 0) for s in stats)
                
                ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
                cpc = (total_cost / total_clicks) if total_clicks > 0 else 0
                
                campaign_data = {
                    "id": campaign_id,
                    "name": campaign.get("Name"),
                    "status": campaign.get("Status"),
                    "impressions": total_impressions,
                    "clicks": total_clicks,
                    "ctr": ctr,
                    "cpc": cpc,
                    "cost": total_cost,
                    "conversions": total_conversions
                }
                
                comparison["campaigns"].append(campaign_data)
            
            # Находим лучшие по каждой метрике
            if comparison["campaigns"]:
                comparison["best_by_metric"]["ctr"] = max(
                    comparison["campaigns"],
                    key=lambda x: x["ctr"]
                )["name"]
                
                comparison["best_by_metric"]["cpc"] = min(
                    comparison["campaigns"],
                    key=lambda x: x["cpc"] if x["cpc"] > 0 else float('inf')
                )["name"]
                
                comparison["best_by_metric"]["conversions"] = max(
                    comparison["campaigns"],
                    key=lambda x: x["conversions"]
                )["name"]
            
            # Выводим результаты
            print(f"\n  Сравнение за последние 7 дней:")
            print(f"  {'Кампания':<30} {'CTR':<10} {'CPC':<10} {'Конверсии':<10}")
            print(f"  {'-'*60}")
            
            for campaign in comparison["campaigns"]:
                print(f"  {campaign['name']:<30} "
                      f"{campaign['ctr']:.2f}%{'':<6} "
                      f"{campaign['cpc']:.2f}{'':<6} "
                      f"{campaign['conversions']:<10}")
            
            print(f"\n  Лучшие показатели:")
            for metric, campaign_name in comparison["best_by_metric"].items():
                print(f"    {metric}: {campaign_name}")
            
            return comparison
        
        except Exception as e:
            logger.error(f"Ошибка при сравнении кампаний: {e}")
            return {}
    
    # ==================== СЦЕНАРИЙ 6: АВТОМАТИЧЕСКОЕ РАСПИСАНИЕ ====================
    
    def schedule_daily_optimization(self) -> Dict:
        """
        Выполняет ежедневную оптимизацию кампаний
        
        Returns:
            Результаты оптимизации
        """
        print(f"\n🔄 Ежедневная оптимизация кампаний")
        
        try:
            results = {
                "timestamp": datetime.now().isoformat(),
                "actions": []
            }
            
            # Получаем все кампании
            campaigns = self.manager.get_campaigns()
            
            for campaign in campaigns:
                campaign_id = campaign.get("Id")
                campaign_name = campaign.get("Name")
                
                # Анализируем производительность
                analysis = self.analyze_campaign_performance(campaign_id)
                
                if not analysis:
                    continue
                
                # Если CTR слишком низкий, приостанавливаем
                if analysis["metrics"]["avg_ctr"] < 0.3:
                    if self.manager.pause_campaign(campaign_id):
                        results["actions"].append({
                            "campaign_id": campaign_id,
                            "campaign_name": campaign_name,
                            "action": "paused",
                            "reason": f"Low CTR: {analysis['metrics']['avg_ctr']:.2f}%"
                        })
                
                # Если CTR хороший, оптимизируем ставки
                elif analysis["metrics"]["avg_ctr"] > 1.0:
                    opt_results = self.optimize_bids_by_performance(campaign_id)
                    results["actions"].append({
                        "campaign_id": campaign_id,
                        "campaign_name": campaign_name,
                        "action": "optimized",
                        "keywords_updated": opt_results.get("updated", 0)
                    })
            
            print(f"\n✓ Выполнено действий: {len(results['actions'])}")
            return results
        
        except Exception as e:
            logger.error(f"Ошибка при ежедневной оптимизации: {e}")
            return {"timestamp": datetime.now().isoformat(), "actions": []}


def main():
    """Главная функция"""
    scenarios = AdvancedYandexDirectScenarios()
    
    print("\n" + "="*60)
    print("ПРОДВИНУТЫЕ СЦЕНАРИИ ЯНДЕКС.ДИРЕКТ API")
    print("="*60)
    
    try:
        # Получаем кампании для примеров
        campaigns = scenarios.manager.get_campaigns()
        
        if not campaigns:
            print("Кампании не найдены")
            return
        
        campaign_id = campaigns[0]["Id"]
        
        # Сценарий 1: Анализ производительности
        scenarios.analyze_campaign_performance(campaign_id)
        
        # Сценарий 2: Оптимизация ставок
        scenarios.optimize_bids_by_performance(campaign_id)
        
        # Сценарий 3: Экспорт в CSV
        scenarios.export_campaigns_to_csv()
        
        # Сценарий 4: Мониторинг бюджета
        scenarios.monitor_budget_spending()
        
        # Сценарий 5: Сравнение кампаний
        if len(campaigns) > 1:
            campaign_ids = [c["Id"] for c in campaigns[:3]]
            scenarios.compare_campaigns(campaign_ids)
        
        # Сценарий 6: Ежедневная оптимизация
        scenarios.schedule_daily_optimization()
        
    except Exception as e:
        logger.error(f"Ошибка: {e}")
    
    print("\n" + "="*60)
    print("ВСЕ СЦЕНАРИИ ЗАВЕРШЕНЫ")
    print("="*60)


if __name__ == "__main__":
    main()
