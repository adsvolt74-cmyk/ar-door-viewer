#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Игра "Морской бой" - консольная версия
Игрок против компьютера на поле 6x6
"""

import random
import sys
from typing import List, Tuple, Optional, Set


class Ship:
    """Класс для представления корабля"""
    
    def __init__(self, size: int):
        """
        Инициализация корабля
        
        Args:
            size: размер корабля (1, 2 или 3)
        """
        self.size = size
        self.positions: List[Tuple[int, int]] = []
        self.hits: Set[Tuple[int, int]] = set()
    
    def place(self, x: int, y: int, horizontal: bool):
        """
        Размещает корабль на поле
        
        Args:
            x: координата X (0-5)
            y: координата Y (0-5)
            horizontal: True если горизонтально, False если вертикально
        """
        self.positions = []
        if horizontal:
            for i in range(self.size):
                self.positions.append((x + i, y))
        else:
            for i in range(self.size):
                self.positions.append((x, y + i))
    
    def hit(self, x: int, y: int) -> bool:
        """
        Регистрирует попадание в корабль
        
        Args:
            x: координата X
            y: координата Y
            
        Returns:
            True если попадание в корабль, False иначе
        """
        if (x, y) in self.positions:
            self.hits.add((x, y))
            return True
        return False
    
    def is_sunk(self) -> bool:
        """Проверяет, потоплен ли корабль"""
        return len(self.hits) == self.size
    
    def contains(self, x: int, y: int) -> bool:
        """Проверяет, находится ли координата в корабле"""
        return (x, y) in self.positions


class Board:
    """Класс для управления игровым полем"""
    
    SIZE = 6
    SHIP_SIZES = [3, 2, 2, 1, 1, 1]  # Размеры кораблей
    
    def __init__(self):
        """Инициализация игрового поля"""
        self.ships: List[Ship] = []
        self.shots: Set[Tuple[int, int]] = set()
        self._initialize_ships()
    
    def _initialize_ships(self):
        """Инициализирует список кораблей"""
        self.ships = [Ship(size) for size in self.SHIP_SIZES]
    
    def can_place_ship(self, size: int, x: int, y: int, horizontal: bool) -> bool:
        """
        Проверяет возможность размещения корабля
        
        Args:
            size: размер корабля
            x: координата X
            y: координата Y
            horizontal: горизонтальное ли размещение
            
        Returns:
            True если можно разместить, False иначе
        """
        # Проверка границ поля
        if horizontal:
            if x + size > self.SIZE or y >= self.SIZE:
                return False
        else:
            if x >= self.SIZE or y + size > self.SIZE:
                return False
        
        # Получаем все клетки, которые займет корабль
        ship_cells = set()
        if horizontal:
            for i in range(size):
                ship_cells.add((x + i, y))
        else:
            for i in range(size):
                ship_cells.add((x, y + i))
        
        # Проверяем, не пересекаются ли с существующими кораблями
        for ship in self.ships:
            if not ship.positions:
                continue
            for cell in ship_cells:
                if cell in ship.positions:
                    return False
        
        # Проверяем буферную зону (соседние клетки)
        buffer_cells = set()
        for sx, sy in ship_cells:
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    nx, ny = sx + dx, sy + dy
                    if 0 <= nx < self.SIZE and 0 <= ny < self.SIZE:
                        buffer_cells.add((nx, ny))
        
        # Проверяем, что буферная зона не пересекается с другими кораблями
        for ship in self.ships:
            if not ship.positions:
                continue
            for cell in ship.positions:
                if cell in buffer_cells and cell not in ship_cells:
                    return False
        
        return True
    
    def place_ship(self, ship_index: int, x: int, y: int, horizontal: bool) -> bool:
        """
        Размещает корабль на поле
        
        Args:
            ship_index: индекс корабля в списке
            x: координата X
            y: координата Y
            horizontal: горизонтальное ли размещение
            
        Returns:
            True если успешно размещен, False иначе
        """
        ship = self.ships[ship_index]
        if self.can_place_ship(ship.size, x, y, horizontal):
            ship.place(x, y, horizontal)
            return True
        return False
    
    def auto_place_ships(self):
        """Автоматически расставляет все корабли на поле"""
        for i, ship in enumerate(self.ships):
            placed = False
            attempts = 0
            max_attempts = 100
            
            while not placed and attempts < max_attempts:
                x = random.randint(0, self.SIZE - 1)
                y = random.randint(0, self.SIZE - 1)
                horizontal = random.choice([True, False])
                
                if self.place_ship(i, x, y, horizontal):
                    placed = True
                
                attempts += 1
            
            if not placed:
                # Если не удалось разместить, пересоздаем поле
                self.__init__()
                self.auto_place_ships()
                return
    
    def shoot(self, x: int, y: int) -> Tuple[bool, str]:
        """
        Обрабатывает выстрел по полю
        
        Args:
            x: координата X
            y: координата Y
            
        Returns:
            Кортеж (попадание, сообщение)
        """
        if (x, y) in self.shots:
            return False, "Вы уже стреляли в эту клетку!"
        
        self.shots.add((x, y))
        
        # Проверяем попадание в корабль
        for ship in self.ships:
            if ship.hit(x, y):
                if ship.is_sunk():
                    return True, f"Попадание! Корабль потоплен!"
                else:
                    return True, "Попадание!"
        
        return True, "Промах!"
    
    def all_ships_sunk(self) -> bool:
        """Проверяет, все ли корабли потоплены"""
        return all(ship.is_sunk() for ship in self.ships)
    
    def display(self, hide_ships: bool = False) -> str:
        """
        Отображает игровое поле
        
        Args:
            hide_ships: скрывать ли корабли (для поля противника)
            
        Returns:
            Строка с отображением поля
        """
        result = "   A B C D E F\n"
        
        for y in range(self.SIZE):
            result += f"{y + 1}  "
            for x in range(self.SIZE):
                cell = "~"  # По умолчанию неизвестная клетка
                
                # Проверяем, был ли выстрел в эту клетку
                if (x, y) in self.shots:
                    # Проверяем, есть ли корабль в этой клетке
                    hit = False
                    for ship in self.ships:
                        if (x, y) in ship.hits:
                            cell = "X"
                            hit = True
                            break
                    
                    if not hit:
                        cell = "•"  # Промах
                elif not hide_ships:
                    # Показываем корабли на своем поле
                    for ship in self.ships:
                        if ship.contains(x, y):
                            cell = "■"
                            break
                
                result += cell + " "
            
            result += "\n"
        
        return result
    
    def get_ship_count(self) -> int:
        """Возвращает количество оставшихся кораблей"""
        return sum(1 for ship in self.ships if not ship.is_sunk())


class Game:
    """Класс для управления игровым процессом"""
    
    def __init__(self):
        """Инициализация игры"""
        self.player_board = Board()
        self.computer_board = Board()
        self.current_turn = "player"
        self.game_over = False
        self.winner = None
    
    def setup(self):
        """Инициализирует игру"""
        print("\n" + "="*50)
        print("Добро пожаловать в игру 'Морской бой'!")
        print("="*50)
        print("\nРасставляю корабли...\n")
        
        self.player_board.auto_place_ships()
        self.computer_board.auto_place_ships()
        
        print("Корабли расставлены!")
        print("\nВаше поле:")
        print(self.player_board.display(hide_ships=False))
        print("\nПолучите информацию о вводе координат:")
        print("Введите координаты в формате: буква (A-F) + цифра (1-6)")
        print("Примеры: A1, C4, F6\n")
    
    def parse_coordinates(self, coord_str: str) -> Optional[Tuple[int, int]]:
        """
        Парсит строку координат
        
        Args:
            coord_str: строка с координатами (например, "A1")
            
        Returns:
            Кортеж (x, y) или None если некорректный ввод
        """
        coord_str = coord_str.strip().upper()
        
        if len(coord_str) != 2:
            return None
        
        col = coord_str[0]
        row = coord_str[1]
        
        if col not in "ABCDEF" or row not in "123456":
            return None
        
        x = ord(col) - ord('A')
        y = int(row) - 1
        
        return (x, y)
    
    def player_turn(self):
        """Обрабатывает ход игрока"""
        print("\n" + "-"*50)
        print("ВАШ ХОД")
        print("-"*50)
        
        print("\nПоле противника:")
        print(self.computer_board.display(hide_ships=True))
        
        while True:
            try:
                coord_input = input("Введите координаты выстрела (например, A1): ")
                coords = self.parse_coordinates(coord_input)
                
                if coords is None:
                    print("Некорректный ввод! Используйте формат: буква (A-F) + цифра (1-6)")
                    continue
                
                x, y = coords
                
                if (x, y) in self.computer_board.shots:
                    print("Вы уже стреляли в эту клетку! Выберите другую.")
                    continue
                
                break
            except KeyboardInterrupt:
                print("\n\nИгра прервана.")
                sys.exit(0)
            except Exception as e:
                print(f"Ошибка: {e}")
                continue
        
        hit, message = self.computer_board.shoot(x, y)
        print(f"\nВыстрел по {coord_input}: {message}")
        
        if self.computer_board.all_ships_sunk():
            self.game_over = True
            self.winner = "player"
            return
        
        # Если попадание, игрок ходит еще раз
        if hit and message != "Промах!":
            print("\nВы получаете дополнительный ход!")
            input("Нажмите Enter для продолжения...")
            self.player_turn()
        else:
            self.current_turn = "computer"
            input("Нажмите Enter для хода компьютера...")
    
    def computer_turn(self):
        """Обрабатывает ход компьютера"""
        print("\n" + "-"*50)
        print("ХОД КОМПЬЮТЕРА")
        print("-"*50)
        
        # Простой AI - случайные выстрелы
        while True:
            x = random.randint(0, 5)
            y = random.randint(0, 5)
            
            if (x, y) not in self.player_board.shots:
                break
        
        col = chr(ord('A') + x)
        row = y + 1
        coord_str = f"{col}{row}"
        
        hit, message = self.player_board.shoot(x, y)
        print(f"\nКомпьютер стреляет по {coord_str}: {message}")
        
        if self.player_board.all_ships_sunk():
            self.game_over = True
            self.winner = "computer"
            return
        
        # Если попадание, компьютер ходит еще раз
        if hit and message != "Промах!":
            print("\nКомпьютер получает дополнительный ход!")
            input("Нажмите Enter для продолжения...")
            self.computer_turn()
        else:
            self.current_turn = "player"
            input("Нажмите Enter для вашего хода...")
    
    def display_status(self):
        """Отображает текущий статус игры"""
        print("\n" + "="*50)
        print("СТАТУС ИГРЫ")
        print("="*50)
        print(f"Ваши корабли: {self.player_board.get_ship_count()} осталось")
        print(f"Корабли противника: {self.computer_board.get_ship_count()} осталось")
    
    def play(self):
        """Основной игровой цикл"""
        self.setup()
        
        while not self.game_over:
            self.display_status()
            
            if self.current_turn == "player":
                self.player_turn()
            else:
                self.computer_turn()
        
        # Игра закончилась
        print("\n" + "="*50)
        print("ИГРА ОКОНЧЕНА!")
        print("="*50)
        
        if self.winner == "player":
            print("\n🎉 ПОЗДРАВЛЯЕМ! ВЫ ПОБЕДИЛИ! 🎉")
            print("\nВы потопили все корабли противника!")
        else:
            print("\n💀 ВАМИ ПОБЕЖДЕН КОМПЬЮТЕР 💀")
            print("\nКомпьютер потопил все ваши корабли.")
        
        print("\nПоле противника (финальное):")
        print(self.computer_board.display(hide_ships=True))
        
        print("\nВаше поле (финальное):")
        print(self.player_board.display(hide_ships=False))


def main():
    """Главная функция"""
    try:
        game = Game()
        game.play()
    except KeyboardInterrupt:
        print("\n\nИгра прервана пользователем.")
        sys.exit(0)
    except Exception as e:
        print(f"\nОшибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
