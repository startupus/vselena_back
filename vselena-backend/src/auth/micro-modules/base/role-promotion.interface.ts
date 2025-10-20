export interface RolePromotionCondition {
  id: string;
  name: string;
  description: string;
  check: (user: any) => Promise<boolean>; // Асинхронная функция для проверки условия
  apply: (user: any) => Promise<void>; // Асинхронная функция для применения изменений
}
