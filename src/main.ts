import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// 数据结构
interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

interface Record {
  id: number;
  amount: number;
  categoryId: number;
  date: string;
  note: string;
  createdAt: string;
}

interface Database {
  categories: Category[];
  records: Record[];
  nextCategoryId: number;
  nextRecordId: number;
}

let db: Database = {
  categories: [],
  records: [],
  nextCategoryId: 1,
  nextRecordId: 1,
};

// 用于撤销删除的临时存储
let deletedCategoryData: { category: Category; children: Category[] } | null = null;

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'sundaybill.json');

// 加载数据库
function loadDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      console.log('数据库加载成功');
    } else {
      initDatabase();
    }
  } catch (e) {
    console.error('加载数据库失败:', e);
    initDatabase();
  }
}

// 保存数据库
function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('保存数据库失败:', e);
  }
}

// 初始化数据库
function initDatabase() {
  const categories = [
    { name: '餐饮', subs: ['早餐', '午餐', '晚餐', '饮料', '水果', '零食', '外卖'] },
    { name: '交通', subs: ['公交', '地铁', '出租车', '加油', '停车', '高速费'] },
    { name: '居住', subs: ['房租', '房贷', '水费', '电费', '燃气费', '物业费'] },
    { name: '购物', subs: ['服装', '日用品', '化妆品', '电子产品', '书籍'] },
    { name: '娱乐', subs: ['电影', 'KTV', '旅游', '游戏', '健身'] },
    { name: '其他', subs: ['医疗', '教育', '通讯', '人情', '捐赠'] },
  ];

  db.categories = [];
  db.nextCategoryId = 1;

  for (const cat of categories) {
    const parentId = db.nextCategoryId++;
    db.categories.push({ id: parentId, name: cat.name, parentId: null });

    for (const sub of cat.subs) {
      db.categories.push({ id: db.nextCategoryId++, name: sub, parentId });
    }
  }

  db.records = [];
  db.nextRecordId = 1;

  saveDatabase();
  console.log('数据库初始化完成');
}

// 获取分类名称
function getCategoryName(categoryId: number): { categoryName: string; parentCategoryName: string } {
  const category = db.categories.find(c => c.id === categoryId);
  if (!category) return { categoryName: '未知', parentCategoryName: '未知' };

  if (category.parentId === null) {
    return { categoryName: category.name, parentCategoryName: category.name };
  }

  const parent = db.categories.find(c => c.id === category.parentId);
  return {
    categoryName: category.name,
    parentCategoryName: parent?.name || '未知',
  };
}

// 获取记录
function getRecords(date: string) {
  return db.records
    .filter(r => r.date === date)
    .map(r => {
      const { categoryName, parentCategoryName } = getCategoryName(r.categoryId);
      return { ...r, categoryName, parentCategoryName };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 添加记录
function addRecord(record: { amount: number; categoryId: number; date: string; note?: string }) {
  const newRecord: Record = {
    id: db.nextRecordId++,
    amount: record.amount,
    categoryId: record.categoryId,
    date: record.date,
    note: record.note || '',
    createdAt: new Date().toISOString(),
  };

  db.records.push(newRecord);
  saveDatabase();

  const { categoryName, parentCategoryName } = getCategoryName(newRecord.categoryId);
  return { ...newRecord, categoryName, parentCategoryName };
}

// 更新记录
function updateRecord(id: number, record: { amount: number; categoryId: number; date: string; note?: string }) {
  const index = db.records.findIndex(r => r.id === id);
  if (index === -1) return null;

  db.records[index] = {
    ...db.records[index],
    amount: record.amount,
    categoryId: record.categoryId,
    date: record.date,
    note: record.note || '',
  };

  saveDatabase();

  const { categoryName, parentCategoryName } = getCategoryName(db.records[index].categoryId);
  return { ...db.records[index], categoryName, parentCategoryName };
}

// 获取所有分类
function getCategories() {
  return db.categories;
}

// 按父分类分组获取分类
function getCategoriesByParent() {
  const map: Record<number, Category[]> = {};

  for (const cat of db.categories) {
    if (cat.parentId !== null) {
      if (!map[cat.parentId]) {
        map[cat.parentId] = [];
      }
      map[cat.parentId].push(cat);
    }
  }

  return map;
}

// 添加自定义分类
function addCategory(name: string, parentId: number) {
  const newCategory: Category = {
    id: db.nextCategoryId++,
    name,
    parentId,
  };
  db.categories.push(newCategory);
  saveDatabase();
  return newCategory;
}

// 删除分类（可以删除一级分类及其所有子分类，也可以删除子分类）
function deleteCategory(id: number): { success: boolean; message: string; canUndo: boolean } {
  const category = db.categories.find(c => c.id === id);
  if (!category) {
    return { success: false, message: '分类不存在', canUndo: false };
  }

  // 如果是一级分类，检查是否有记录使用该分类或其子分类
  if (category.parentId === null) {
    // 获取所有子分类
    const children = db.categories.filter(c => c.parentId === id);
    const childIds = children.map(c => c.id);
    const allCategoryIds = [id, ...childIds];

    // 检查是否有记录使用这些分类
    const hasRecords = db.records.some(r => allCategoryIds.includes(r.categoryId));
    if (hasRecords) {
      return { success: false, message: '该分类已有记录使用，无法删除', canUndo: false };
    }

    // 保存删除的数据用于撤销（30秒有效期）
    deletedCategoryData = {
      category: { ...category },
      children: children.map(c => ({ ...c }))
    };

    // 删除一级分类及其所有子分类
    db.categories = db.categories.filter(c => c.parentId !== id && c.id !== id);
    saveDatabase();
    return { success: true, message: '删除成功', canUndo: true };
  }

  // 子分类：检查是否有记录使用该分类
  const hasRecords = db.records.some(r => r.categoryId === id);
  if (hasRecords) {
    return { success: false, message: '该分类已有记录使用，无法删除', canUndo: false };
  }

  const index = db.categories.findIndex(c => c.id === id);
  if (index !== -1) {
    // 保存删除的数据用于撤销
    deletedCategoryData = {
      category: { ...category },
      children: []
    };

    db.categories.splice(index, 1);
    saveDatabase();
    return { success: true, message: '删除成功', canUndo: true };
  }
  return { success: false, message: '删除失败', canUndo: false };
}

// 撤销删除分类
function undoDeleteCategory(): { success: boolean; message: string } {
  if (!deletedCategoryData) {
    return { success: false, message: '没有可撤销的删除' };
  }

  try {
    // 恢复一级分类
    const existingParent = db.categories.find(c => c.id === deletedCategoryData!.category.id);
    if (!existingParent) {
      db.categories.push(deletedCategoryData!.category);
    }

    // 恢复子分类
    for (const child of deletedCategoryData!.children) {
      const existingChild = db.categories.find(c => c.id === child.id);
      if (!existingChild) {
        db.categories.push(child);
      }
    }

    // 更新 nextCategoryId
    const maxId = Math.max(...db.categories.map(c => c.id), 0);
    db.nextCategoryId = maxId + 1;

    deletedCategoryData = null;
    saveDatabase();
    return { success: true, message: '已撤销删除' };
  } catch (e) {
    return { success: false, message: '撤销失败' };
  }
}

// 添加一级分类
function addParentCategory(name: string): Category {
  const newCategory: Category = {
    id: db.nextCategoryId++,
    name: name.trim(),
    parentId: null,
  };
  db.categories.push(newCategory);
  saveDatabase();
  return newCategory;
}

// 获取月度统计
function getMonthlyStats(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const monthRecords = db.records.filter(r => r.date >= startDate && r.date <= endDate);

  const byCategory: Record<string, number> = {};
  let total = 0;

  for (const record of monthRecords) {
    const { parentCategoryName } = getCategoryName(record.categoryId);
    byCategory[parentCategoryName] = (byCategory[parentCategoryName] || 0) + record.amount;
    total += record.amount;
  }

  return { total, byCategory };
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 700,
    minWidth: 380,
    minHeight: 600,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 创建菜单
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 Sunday记账',
              message: 'Sunday记账 v1.0.0',
              detail: '一款简洁高效的记账应用',
            });
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

// 获取当日支出总额
function getDayTotal(date: string) {
  const dayRecords = db.records.filter(r => r.date === date);
  return dayRecords.reduce((sum, r) => sum + r.amount, 0);
}

// CSV 单元格转义：防止 CSV 注入攻击
// 如果单元格包含逗号、引号、换行或以 =/@/+/- 开头，需要用双引号包裹
// 双引号本身需要转义为两个双引号
function escapeCSVCell(cell: string | number): string {
  const str = String(cell);
  const needsQuoting = str.includes(',') || str.includes('"') || str.includes('\n') ||
    str.startsWith('=') || str.startsWith('@') || str.startsWith('+') || str.startsWith('-');
  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 导出CSV
function exportCSV() {
  const headers = ['日期', '一级分类', '二级分类', '金额', '备注', '创建时间'];
  const rows = db.records.map(r => {
    const { categoryName, parentCategoryName } = getCategoryName(r.categoryId);
    return [r.date, parentCategoryName, categoryName, r.amount.toFixed(2), r.note, r.createdAt];
  });

  const csv = [headers, ...rows].map(row => row.map(cell => escapeCSVCell(cell)).join(',')).join('\n');
  return csv;
}

// 撤销删除
let lastDeletedRecord: Record | null = null;

function deleteRecord(id: number) {
  const index = db.records.findIndex(r => r.id === id);
  if (index !== -1) {
    lastDeletedRecord = { ...db.records[index] };
    db.records.splice(index, 1);
    saveDatabase();
  }
}

function undoDelete() {
  if (lastDeletedRecord) {
    db.records.push(lastDeletedRecord);
    const restored = { ...lastDeletedRecord };
    lastDeletedRecord = null;
    saveDatabase();
    return restored;
  }
  return null;
}

// 注册IPC处理程序
function setupIPC() {
  // 获取指定日期的记录
  ipcMain.handle('get-records', (_, date: string) => {
    // 验证日期格式 YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('无效的日期格式');
    }
    return getRecords(date);
  });

  // 添加记录
  ipcMain.handle('add-record', (_, record: { amount: number; categoryId: number; date: string; note?: string }) => {
    // 验证金额：必须为正数
    if (typeof record.amount !== 'number' || record.amount <= 0 || isNaN(record.amount)) {
      throw new Error('金额必须为正数');
    }
    // 验证分类ID必须存在
    const category = db.categories.find(c => c.id === record.categoryId);
    if (!category) {
      throw new Error('无效的分类');
    }
    // 验证日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
      throw new Error('无效的日期格式');
    }
    return addRecord(record);
  });

  // 更新记录
  ipcMain.handle('update-record', (_, id: number, record: { amount: number; categoryId: number; date: string; note?: string }) => {
    // 验证ID
    if (typeof id !== 'number' || id <= 0) {
      throw new Error('无效的记录ID');
    }
    // 验证金额
    if (typeof record.amount !== 'number' || record.amount <= 0 || isNaN(record.amount)) {
      throw new Error('金额必须为正数');
    }
    // 验证分类
    const category = db.categories.find(c => c.id === record.categoryId);
    if (!category) {
      throw new Error('无效的分类');
    }
    // 验证日期
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
      throw new Error('无效的日期格式');
    }
    return updateRecord(id, record);
  });

  // 删除记录
  ipcMain.handle('delete-record', (_, id: number) => {
    if (typeof id !== 'number' || id <= 0) {
      throw new Error('无效的记录ID');
    }
    return deleteRecord(id);
  });

  ipcMain.handle('undo-delete', () => undoDelete());
  ipcMain.handle('get-categories', () => getCategories());
  ipcMain.handle('get-categories-by-parent', () => getCategoriesByParent());

  // 添加分类
  ipcMain.handle('add-category', (_, name: string, parentId: number) => {
    // 验证名称不为空
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('分类名称不能为空');
    }
    // 验证父分类存在
    const parent = db.categories.find(c => c.id === parentId);
    if (!parent) {
      throw new Error('无效的父分类');
    }
    return addCategory(name.trim(), parentId);
  });

  // 删除分类
  ipcMain.handle('delete-category', (_, id: number) => {
    if (typeof id !== 'number' || id <= 0) {
      throw new Error('无效的分类ID');
    }
    return deleteCategory(id);
  });

  ipcMain.handle('undo-delete-category', () => undoDeleteCategory());

  // 添加一级分类
  ipcMain.handle('add-parent-category', (_, name: string) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('分类名称不能为空');
    }
    return addParentCategory(name.trim());
  });

  // 获取月度统计
  ipcMain.handle('get-monthly-stats', (_, year: number, month: number) => {
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      throw new Error('无效的年份');
    }
    if (typeof month !== 'number' || month < 1 || month > 12) {
      throw new Error('无效的月份');
    }
    return getMonthlyStats(year, month);
  });

  // 获取当日总额
  ipcMain.handle('get-day-total', (_, date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('无效的日期格式');
    }
    return getDayTotal(date);
  });

  ipcMain.handle('export-csv', () => exportCSV());
}

app.on('ready', () => {
  loadDatabase();
  setupIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
