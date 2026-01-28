"""
Яндекс.Директ API Manager
Скрипт для автоматизации управления рекламными кампаниями
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YandexDirectManager:
    """Менеджер для работы с API Яндекс.Директ"""
    
    # Основные URL API
    API_BASE_URL = "https://api.direct.yandex.com/json/v5"
    SANDBOX_URL = "https://api-sandbox.direct.yandex.com/json/v5"
    
    def __init__(self, access_token: str, use_sandbox: bool = False):
        """
        Инициализация менеджера
        
        Args:
            access_token: OAuth токен для доступа к API
            use_sandbox: Использовать sandbox окружение для тестирования
        """
        self.access_token = access_token
        self.base_url = self.SANDBOX_URL if use_sandbox else self.API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept-Language": "ru",
            "Content-Type": "application/json"
        }
        self.request_id = 0
        
    def _generate_request_id(self) -> str:
        """Генерирует уникальный ID для запроса"""
        self.request_id += 1
        return f"{datetime.now().timestamp()}-{self.request_id}"
    
    def _make_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Выполняет запрос к API
        
        Args:
            method: Название метода API
            params: Параметры запроса
            
        Returns:
            Ответ от API
        """
        url = f"{self.base_url}/{method}"
        headers = self.headers.copy()
        headers["X-Request-Id"] = self._generate_request_id()
        
        try:
            logger.info(f"Запрос к методу: {method}")
            response = requests.post(
                url,
                headers=headers,
                json=params,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"Ошибка API: {result['error']}")
                raise Exception(f"API Error: {result['error']}")
            
            logger.info(f"Успешный ответ от {method}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка при запросе: {e}")
            raise
    
    # ==================== КАМПАНИИ ====================
    
    def get_campaigns(self, 
                     fields: Optional[List[str]] = None,
                     limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Получает список кампаний
        
        Args:
            fields: Список полей для выборки
            limit: Максимальное количество результатов
            
        Returns:
            Список кампаний
        """
        if fields is None:
            fields = [
                "Id", "Name", "Status", "StatusPayment", "Type",
                "StartDate", "EndDate", "DailyBudget", "Timezone"
            ]
        
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": {},
                "FieldNames": fields,
                "Limit": limit
            }
        }
        
        result = self._make_request("campaigns", params)
        return result.get("result", {}).get("Campaigns", [])
    
    def get_campaign_by_id(self, campaign_id: int) -> Optional[Dict[str, Any]]:
        """
        Получает информацию о конкретной кампании
        
        Args:
            campaign_id: ID кампании
            
        Returns:
            Информация о кампании
        """
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": {
                    "Ids": [campaign_id]
                },
                "FieldNames": [
                    "Id", "Name", "Status", "StatusPayment", "Type",
                    "StartDate", "EndDate", "DailyBudget", "Timezone"
                ]
            }
        }
        
        result = self._make_request("campaigns", params)
        campaigns = result.get("result", {}).get("Campaigns", [])
        return campaigns[0] if campaigns else None
    
    def create_campaign(self, 
                       name: str,
                       campaign_type: str = "TEXT_CAMPAIGN",
                       daily_budget: Optional[int] = None,
                       timezone: str = "Europe/Moscow") -> Optional[int]:
        """
        Создает новую кампанию
        
        Args:
            name: Название кампании
            campaign_type: Тип кампании (TEXT_CAMPAIGN, MOBILE_APP_CAMPAIGN и т.д.)
            daily_budget: Дневной бюджет в копейках
            timezone: Часовой пояс
            
        Returns:
            ID созданной кампании
        """
        campaign = {
            "Name": name,
            "Type": campaign_type,
            "Timezone": timezone
        }
        
        if daily_budget:
            campaign["DailyBudget"] = daily_budget
        
        params = {
            "method": "add",
            "params": {
                "Campaigns": [campaign]
            }
        }
        
        result = self._make_request("campaigns", params)
        add_results = result.get("result", {}).get("AddResults", [])
        
        if add_results:
            campaign_id = add_results[0].get("Id")
            logger.info(f"Кампания создана с ID: {campaign_id}")
            return campaign_id
        
        return None
    
    def update_campaign(self, campaign_id: int, **kwargs) -> bool:
        """
        Обновляет параметры кампании
        
        Args:
            campaign_id: ID кампании
            **kwargs: Параметры для обновления (Name, DailyBudget, Status и т.д.)
            
        Returns:
            True если успешно, False иначе
        """
        campaign = {"Id": campaign_id}
        campaign.update(kwargs)
        
        params = {
            "method": "update",
            "params": {
                "Campaigns": [campaign]
            }
        }
        
        result = self._make_request("campaigns", params)
        update_results = result.get("result", {}).get("UpdateResults", [])
        
        return len(update_results) > 0
    
    def pause_campaign(self, campaign_id: int) -> bool:
        """Приостанавливает кампанию"""
        return self.update_campaign(campaign_id, Status="STOPPED")
    
    def resume_campaign(self, campaign_id: int) -> bool:
        """Возобновляет кампанию"""
        return self.update_campaign(campaign_id, Status="ENABLED")
    
    # ==================== ОБЪЯВЛЕНИЯ ====================
    
    def get_ads(self, 
               campaign_id: Optional[int] = None,
               fields: Optional[List[str]] = None,
               limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Получает список объявлений
        
        Args:
            campaign_id: ID кампании (если не указана, получает все объявления)
            fields: Список полей для выборки
            limit: Максимальное количество результатов
            
        Returns:
            Список объявлений
        """
        if fields is None:
            fields = [
                "Id", "CampaignId", "AdGroupId", "HeadlinesPart1",
                "HeadlinesPart2", "Description", "Status", "Type"
            ]
        
        selection_criteria = {}
        if campaign_id:
            selection_criteria["CampaignIdsList"] = [campaign_id]
        
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": selection_criteria,
                "FieldNames": fields,
                "Limit": limit
            }
        }
        
        result = self._make_request("ads", params)
        return result.get("result", {}).get("Ads", [])
    
    def update_ad_status(self, ad_id: int, status: str) -> bool:
        """
        Обновляет статус объявления
        
        Args:
            ad_id: ID объявления
            status: Новый статус (ENABLED, PAUSED, ARCHIVED)
            
        Returns:
            True если успешно, False иначе
        """
        params = {
            "method": "update",
            "params": {
                "Ads": [{"Id": ad_id, "Status": status}]
            }
        }
        
        result = self._make_request("ads", params)
        update_results = result.get("result", {}).get("UpdateResults", [])
        
        return len(update_results) > 0
    
    # ==================== СТАТИСТИКА ====================
    
    def get_statistics(self,
                      date_range_type: str = "LAST_7_DAYS",
                      fields: Optional[List[str]] = None,
                      campaign_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """
        Получает статистику по кампаниям
        
        Args:
            date_range_type: Период (TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS и т.д.)
            fields: Список полей для выборки
            campaign_ids: Список ID кампаний
            
        Returns:
            Статистика
        """
        if fields is None:
            fields = [
                "Date", "CampaignId", "CampaignName", "Impressions",
                "Clicks", "Cost", "Conversions", "ConversionRate"
            ]
        
        selection_criteria = {
            "DateRangeType": date_range_type
        }
        
        if campaign_ids:
            selection_criteria["CampaignIdsList"] = campaign_ids
        
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": selection_criteria,
                "FieldNames": fields,
                "OrderBy": [{"Field": "Date"}],
                "Limit": 10000
            }
        }
        
        result = self._make_request("reports", params)
        return result.get("result", [])
    
    # ==================== КЛЮЧЕВЫЕ СЛОВА ====================
    
    def get_keywords(self,
                    campaign_id: Optional[int] = None,
                    fields: Optional[List[str]] = None,
                    limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Получает список ключевых слов
        
        Args:
            campaign_id: ID кампании
            fields: Список полей для выборки
            limit: Максимальное количество результатов
            
        Returns:
            Список ключевых слов
        """
        if fields is None:
            fields = [
                "Id", "Keyword", "CampaignId", "AdGroupId",
                "Status", "Bid", "ContextBid"
            ]
        
        selection_criteria = {}
        if campaign_id:
            selection_criteria["CampaignIdsList"] = [campaign_id]
        
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": selection_criteria,
                "FieldNames": fields,
                "Limit": limit
            }
        }
        
        result = self._make_request("keywords", params)
        return result.get("result", {}).get("Keywords", [])
    
    def update_keyword_bid(self, keyword_id: int, bid: int) -> bool:
        """
        Обновляет ставку для ключевого слова
        
        Args:
            keyword_id: ID ключевого слова
            bid: Новая ставка в копейках
            
        Returns:
            True если успешно, False иначе
        """
        params = {
            "method": "update",
            "params": {
                "Keywords": [{"Id": keyword_id, "Bid": bid}]
            }
        }
        
        result = self._make_request("keywords", params)
        update_results = result.get("result", {}).get("UpdateResults", [])
        
        return len(update_results) > 0
    
    # ==================== ГРУППЫ ОБЪЯВЛЕНИЙ ====================
    
    def get_ad_groups(self,
                     campaign_id: Optional[int] = None,
                     fields: Optional[List[str]] = None,
                     limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Получает список групп объявлений
        
        Args:
            campaign_id: ID кампании
            fields: Список полей для выборки
            limit: Максимальное количество результатов
            
        Returns:
            Список групп объявлений
        """
        if fields is None:
            fields = [
                "Id", "CampaignId", "Name", "Status", "Type"
            ]
        
        selection_criteria = {}
        if campaign_id:
            selection_criteria["CampaignIdsList"] = [campaign_id]
        
        params = {
            "method": "get",
            "params": {
                "SelectionCriteria": selection_criteria,
                "FieldNames": fields,
                "Limit": limit
            }
        }
        
        result = self._make_request("adgroups", params)
        return result.get("result", {}).get("AdGroups", [])


class CampaignAutomation:
    """Класс для автоматизации управления кампаниями"""
    
    def __init__(self, manager: YandexDirectManager):
        """
        Инициализация автоматизации
        
        Args:
            manager: Экземпляр YandexDirectManager
        """
        self.manager = manager
    
    def pause_low_performing_campaigns(self, 
                                      min_ctr: float = 0.5,
                                      days: int = 7) -> List[int]:
        """
        Приостанавливает кампании с низким CTR
        
        Args:
            min_ctr: Минимальный CTR в процентах
            days: Период анализа в днях
            
        Returns:
            Список ID приостановленных кампаний
        """
        paused_campaigns = []
        
        try:
            campaigns = self.manager.get_campaigns()
            campaign_ids = [c["Id"] for c in campaigns]
            
            if not campaign_ids:
                logger.warning("Кампании не найдены")
                return paused_campaigns
            
            # Получаем статистику
            stats = self.manager.get_statistics(
                date_range_type="LAST_7_DAYS",
                campaign_ids=campaign_ids
            )
            
            # Анализируем CTR по кампаниям
            campaign_stats = {}
            for stat in stats:
                campaign_id = stat.get("CampaignId")
                impressions = stat.get("Impressions", 0)
                clicks = stat.get("Clicks", 0)
                
                if impressions > 0:
                    ctr = (clicks / impressions) * 100
                    if campaign_id not in campaign_stats:
                        campaign_stats[campaign_id] = {"ctr": 0, "count": 0}
                    
                    campaign_stats[campaign_id]["ctr"] += ctr
                    campaign_stats[campaign_id]["count"] += 1
            
            # Приостанавливаем кампании с низким CTR
            for campaign_id, stats_data in campaign_stats.items():
                avg_ctr = stats_data["ctr"] / stats_data["count"]
                
                if avg_ctr < min_ctr:
                    if self.manager.pause_campaign(campaign_id):
                        paused_campaigns.append(campaign_id)
                        logger.info(f"Кампания {campaign_id} приостановлена (CTR: {avg_ctr:.2f}%)")
        
        except Exception as e:
            logger.error(f"Ошибка при приостановке кампаний: {e}")
        
        return paused_campaigns
    
    def increase_bids_for_top_keywords(self,
                                      campaign_id: int,
                                      increase_percent: float = 10,
                                      min_conversions: int = 5) -> int:
        """
        Увеличивает ставки для лучших ключевых слов
        
        Args:
            campaign_id: ID кампании
            increase_percent: Процент увеличения ставки
            min_conversions: Минимальное количество конверсий
            
        Returns:
            Количество обновленных ключевых слов
        """
        updated_count = 0
        
        try:
            keywords = self.manager.get_keywords(campaign_id=campaign_id)
            
            for keyword in keywords:
                keyword_id = keyword.get("Id")
                current_bid = keyword.get("Bid", 0)
                
                if current_bid > 0:
                    new_bid = int(current_bid * (1 + increase_percent / 100))
                    
                    if self.manager.update_keyword_bid(keyword_id, new_bid):
                        updated_count += 1
                        logger.info(f"Ставка для ключевого слова {keyword_id} увеличена: {current_bid} -> {new_bid}")
        
        except Exception as e:
            logger.error(f"Ошибка при увеличении ставок: {e}")
        
        return updated_count
    
    def generate_report(self, campaign_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Генерирует отчет по кампаниям
        
        Args:
            campaign_ids: Список ID кампаний (если None, все кампании)
            
        Returns:
            Отчет
        """
        report = {
            "generated_at": datetime.now().isoformat(),
            "campaigns": [],
            "total_stats": {
                "impressions": 0,
                "clicks": 0,
                "cost": 0,
                "conversions": 0
            }
        }
        
        try:
            campaigns = self.manager.get_campaigns()
            
            if campaign_ids:
                campaigns = [c for c in campaigns if c["Id"] in campaign_ids]
            
            for campaign in campaigns:
                campaign_id = campaign["Id"]
                
                # Получаем статистику
                stats = self.manager.get_statistics(
                    date_range_type="LAST_30_DAYS",
                    campaign_ids=[campaign_id]
                )
                
                campaign_data = {
                    "id": campaign_id,
                    "name": campaign.get("Name"),
                    "status": campaign.get("Status"),
                    "stats": {
                        "impressions": sum(s.get("Impressions", 0) for s in stats),
                        "clicks": sum(s.get("Clicks", 0) for s in stats),
                        "cost": sum(s.get("Cost", 0) for s in stats),
                        "conversions": sum(s.get("Conversions", 0) for s in stats)
                    }
                }
                
                # Вычисляем метрики
                if campaign_data["stats"]["impressions"] > 0:
                    campaign_data["stats"]["ctr"] = (
                        campaign_data["stats"]["clicks"] / 
                        campaign_data["stats"]["impressions"] * 100
                    )
                
                if campaign_data["stats"]["clicks"] > 0:
                    campaign_data["stats"]["cpc"] = (
                        campaign_data["stats"]["cost"] / 
                        campaign_data["stats"]["clicks"]
                    )
                
                report["campaigns"].append(campaign_data)
                
                # Обновляем общую статистику
                for key in report["total_stats"]:
                    report["total_stats"][key] += campaign_data["stats"].get(key, 0)
        
        except Exception as e:
            logger.error(f"Ошибка при генерации отчета: {e}")
        
        return report


# ==================== ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ====================

def main():
    """Примеры использования"""
    
    # Замените на ваш реальный токен
    ACCESS_TOKEN = "your_access_token_here"
    
    # Инициализация менеджера (используем sandbox для тестирования)
    manager = YandexDirectManager(ACCESS_TOKEN, use_sandbox=True)
    
    try:
        # Пример 1: Получение списка кампаний
        print("\n=== Получение кампаний ===")
        campaigns = manager.get_campaigns()
        for campaign in campaigns[:5]:  # Показываем первые 5
            print(f"ID: {campaign['Id']}, Название: {campaign['Name']}, Статус: {campaign['Status']}")
        
        # Пример 2: Создание новой кампании
        print("\n=== Создание кампании ===")
        new_campaign_id = manager.create_campaign(
            name="Тестовая кампания",
            daily_budget=50000  # 500 рублей в копейках
        )
        if new_campaign_id:
            print(f"Кампания создана с ID: {new_campaign_id}")
        
        # Пример 3: Получение объявлений
        print("\n=== Получение объявлений ===")
        if campaigns:
            campaign_id = campaigns[0]["Id"]
            ads = manager.get_ads(campaign_id=campaign_id)
            print(f"Найдено объявлений: {len(ads)}")
        
        # Пример 4: Получение статистики
        print("\n=== Получение статистики ===")
        stats = manager.get_statistics(date_range_type="LAST_7_DAYS")
        print(f"Записей статистики: {len(stats)}")
        
        # Пример 5: Автоматизация
        print("\n=== Автоматизация ===")
        automation = CampaignAutomation(manager)
        
        # Генерируем отчет
        report = automation.generate_report()
        print(f"Отчет сгенерирован для {len(report['campaigns'])} кампаний")
        print(f"Общая статистика: {report['total_stats']}")
        
    except Exception as e:
        logger.error(f"Ошибка: {e}")


if __name__ == "__main__":
    main()
