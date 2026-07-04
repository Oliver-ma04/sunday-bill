import { contextBridge, ipcRenderer } from 'electron';

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 记录操作
  getRecords: (date: string) => ipcRenderer.invoke('get-records', date),
  addRecord: (record: { amount: number; categoryId: number; date: string; note?: string }) =>
    ipcRenderer.invoke('add-record', record),
  updateRecord: (id: number, record: { amount: number; categoryId: number; date: string; note?: string }) =>
    ipcRenderer.invoke('update-record', id, record),
  deleteRecord: (id: number) => ipcRenderer.invoke('delete-record', id),
  undoDelete: () => ipcRenderer.invoke('undo-delete'),

  // 分类操作
  getCategories: () => ipcRenderer.invoke('get-categories'),
  getCategoriesByParent: () => ipcRenderer.invoke('get-categories-by-parent'),
  addCategory: (name: string, parentId: number) => ipcRenderer.invoke('add-category', name, parentId),
  deleteCategory: (id: number) => ipcRenderer.invoke('delete-category', id),
  undoDeleteCategory: () => ipcRenderer.invoke('undo-delete-category'),
  addParentCategory: (name: string) => ipcRenderer.invoke('add-parent-category', name),

  // 统计
  getMonthlyStats: (year: number, month: number) => ipcRenderer.invoke('get-monthly-stats', year, month),
  getDayTotal: (date: string) => ipcRenderer.invoke('get-day-total', date),

  // 导出
  exportCSV: () => ipcRenderer.invoke('export-csv'),
});
