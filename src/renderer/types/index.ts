// 分类类型
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

// 记账记录类型
export interface Record {
  id: number;
  amount: number;
  categoryId: number;
  categoryName: string;
  parentCategoryName: string;
  date: string;
  note: string;
  createdAt: string;
}

// 新增记录输入
export interface RecordInput {
  amount: number;
  categoryId: number;
  date: string;
  note?: string;
}

// 统计数据类型
export interface Stats {
  total: number;
  byCategory: Record<string, number>;
}

// IPC API 接口
export interface ElectronAPI {
  // 记录操作
  getRecords: (date: string) => Promise<Record[]>;
  addRecord: (record: RecordInput) => Promise<Record>;
  updateRecord: (id: number, record: RecordInput) => Promise<Record>;
  deleteRecord: (id: number) => Promise<void>;
  undoDelete: () => Promise<Record | null>;

  // 分类操作
  getCategories: () => Promise<Category[]>;
  getCategoriesByParent: () => Promise<Record<number, Category[]>>;
  addCategory: (name: string, parentId: number) => Promise<Category>;
  deleteCategory: (id: number) => Promise<{ success: boolean; message: string; canUndo: boolean }>;
  undoDeleteCategory: () => Promise<{ success: boolean; message: string }>;
  addParentCategory: (name: string) => Promise<Category>;

  // 统计
  getMonthlyStats: (year: number, month: number) => Promise<Stats>;
  getDayTotal: (date: string) => Promise<number>;

  // 导出
  exportCSV: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
