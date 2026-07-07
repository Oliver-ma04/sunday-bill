/**
 * App - 周日记账应用主组件
 *
 * 功能概述：
 * - 管理应用的所有状态和业务逻辑
 * - 提供三个主要视图：记录列表、新增/编辑记录、统计页面
 * - 通过 IPC 与 Electron 主进程通信，间接操作本地 JSON 数据库
 *
 * 为什么这样设计：
 * - 单一组件管理状态便于全局数据共享（如当前日期、分类数据）
 * - 视图切换通过 view 状态实现，保持 URL 简洁
 */

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import Stats from './components/Stats';
import { Record, RecordInput, Category } from './types';
import { List, Plus, ChartPie, Export } from '@phosphor-icons/react';

/**
 * 应用视图类型：
 * - list: 主列表视图，显示当日记录和简要统计
 * - add: 新增记录视图
 * - edit: 编辑记录视图
 * - stats: 统计详情视图
 */
type View = 'list' | 'add' | 'edit' | 'stats';

/**
 * App 主组件
 *
 * 状态设计说明：
 * - currentDate: 当前查看的日期，格式 YYYY-MM-DD，初始为今天
 * - view: 当前视图状态，用于控制显示哪个页面
 * - records/categories: 从数据库加载的数据
 * - editingRecord: 当前编辑的记录，为 null 时表示新增模式
 * - dayTotal/monthTotal: 当日和当月支出总额，用于统计显示
 * - undoRecord/showUndo: 删除恢复相关状态
 */
function App() {
  // 当前查看的日期，格式 YYYY-MM-DD，初始值设为今天
  // 为什么用函数式初始化：避免每次渲染都创建新 Date 对象
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // 当前视图状态：list | add | edit | stats
  const [view, setView] = useState<View>('list');

  // 当日记账记录列表
  const [records, setRecords] = useState<Record[]>([]);

  // 所有分类数据
  const [categories, setCategories] = useState<Category[]>([]);

  // 按父分类分组的分类映射表
  // key: 父分类ID, value: 该父分类下的所有子分类
  const [categoriesByParent, setCategoriesByParent] = useState<{[key: number]: Category[]}>({});

  // 当前正在编辑的记录，为 null 表示当前是新增模式
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  // 新增记录时，当前选中的一级分类ID
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  // 当日支出总额（从主进程获取）
  const [dayTotal, setDayTotal] = useState(0);

  // 当月支出总额（从主进程获取）
  const [monthTotal, setMonthTotal] = useState(0);

  // 被删除的记录副本，用于撤销操作
  const [undoRecord, setUndoRecord] = useState<Record | null>(null);

  // 是否显示撤销提示条
  const [showUndo, setShowUndo] = useState(false);

  // 页面加载动画状态（用于入场动画）
  const [isLoaded, setIsLoaded] = useState(false);

  // 页面加载时的入场动画
  // 为什么用 50ms 延迟：让 CSS transition 有机会触发，产生淡入效果
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 从主进程加载分类数据
  // 分类数据相对稳定，整个应用生命周期内只需加载一次
  const loadCategories = useCallback(async () => {
    const cats = await window.electronAPI.getCategories();
    setCategories(cats);
    const byParent = await window.electronAPI.getCategoriesByParent();
    setCategoriesByParent(byParent);
  }, []);

  // 从主进程加载指定日期的记账记录
  // 依赖 currentDate：切换日期时需要重新加载
  const loadRecords = useCallback(async () => {
    const recs = await window.electronAPI.getRecords(currentDate);
    setRecords(recs);
  }, [currentDate]);

  // 从主进程获取当日支出总额
  const loadDayTotal = useCallback(async () => {
    const total = await window.electronAPI.getDayTotal(currentDate);
    setDayTotal(total);
  }, [currentDate]);

  // 从主进程获取当月支出总额
  // 需要从 currentDate 中解析出年月，因为 IPC 只接受这两个参数
  const loadMonthTotal = useCallback(async () => {
    const [year, month] = currentDate.split('-');
    const stats = await window.electronAPI.getMonthlyStats(parseInt(year), parseInt(month));
    setMonthTotal(stats.total);
  }, [currentDate]);

  // 初始化时加载分类数据
  // 放在独立 useEffect 中确保只在挂载时执行一次
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 当视图或日期变化时，重新加载记录和统计数据
  // 为什么只在 view === 'list' 时加载：其他视图不需要显示这些数据
  useEffect(() => {
    if (view === 'list') {
      loadRecords();
      loadDayTotal();
      loadMonthTotal();
    }
  }, [view, currentDate, loadRecords, loadDayTotal, loadMonthTotal]);

  // 新增记账记录
  // 提交流程：调用 API → 刷新数据 → 切换回列表视图
  const handleAddRecord = async (input: RecordInput) => {
    await window.electronAPI.addRecord(input);
    // 新增成功后刷新当前日期的记录和统计
    loadRecords();
    loadDayTotal();
    loadMonthTotal();
    setView('list');
  };

  // 更新记账记录
  // 与新增的区别：需要传入记录ID，且完成后要清除编辑状态
  const handleUpdateRecord = async (id: number, input: RecordInput) => {
    await window.electronAPI.updateRecord(id, input);
    loadRecords();
    loadDayTotal();
    loadMonthTotal();
    setEditingRecord(null); // 清除编辑状态
    setView('list');
  };

  // 删除记账记录
  // 设计决策：删除前先保存记录副本，支持 5 秒内的撤销操作
  const handleDeleteRecord = async (id: number) => {
    const recordToDelete = records.find(r => r.id === id);
    if (confirm('确定要删除这条记录吗？')) {
      await window.electronAPI.deleteRecord(id);
      loadRecords();
      loadDayTotal();

      // 保存删除的记录用于撤销，并显示撤销提示
      // 5 秒后自动隐藏提示条（用户没有点击撤销）
      if (recordToDelete) {
        setUndoRecord(recordToDelete);
        setShowUndo(true);
        setTimeout(() => setShowUndo(false), 5000);
      }
    }
  };

  // 撤销最近一次删除
  // 为什么需要这个功能：防止用户误删后的数据丢失
  const handleUndo = async () => {
    const restored = await window.electronAPI.undoDelete();
    if (restored) {
      loadRecords();
      loadDayTotal();
    }
    setShowUndo(false);
    setUndoRecord(null);
  };

  // 进入编辑模式
  // 保存要编辑的记录到状态，然后切换到编辑视图
  const handleEditRecord = (record: Record) => {
    setEditingRecord(record);
    setView('edit');
  };

  // 进入新增模式
  // 初始化时自动选中第一个一级分类，提供更好的默认体验
  const handleStartAdd = () => {
    const parents = categories.filter(c => c.parentId === null);
    if (parents.length > 0) {
      setSelectedParentId(parents[0].id);
    }
    setView('add');
  };

  // 导出 CSV 文件
  // 工作流程：获取 CSV 数据 → 创建 Blob → 生成下载链接 → 触发下载 → 清理
  const handleExportCSV = async () => {
    const csv = await window.electronAPI.exportCSV();
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 文件名格式：sundaybill_YYYY-MM-DD.csv
    link.download = `sundaybill_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    // 释放 URL 对象，避免内存泄漏
    URL.revokeObjectURL(url);
  };

  // 提取所有一级分类（父分类）
  // 用途：新增记录时需要获取一级分类列表供用户选择
  const parentCategories = categories.filter(c => c.parentId === null);

  /**
   * 根据当前视图状态渲染对应内容
   *
   * 为什么不直接写在 JSX 里：
   * - JSX 中使用条件渲染会使结构复杂难读
   * - 提取成独立函数让主 JSX 更清晰
   */
  const renderContent = () => {
    switch (view) {
      case 'add':
        // 新增视图：显示空白表单
        return (
          <div className="form-full">
            <RecordForm
              categories={categories}
              categoriesByParent={categoriesByParent}
              selectedParentId={selectedParentId}
              onSelectParent={setSelectedParentId}
              onSubmit={handleAddRecord}
              onCancel={() => setView('list')}
              onCategoryAdded={loadCategories}
              onCategoryDeleted={loadCategories}
            />
          </div>
        );

      case 'edit':
        // 编辑视图：显示预填充了数据的表单
        return editingRecord ? (
          <div className="form-full">
            <RecordForm
              record={editingRecord}
              categories={categories}
              categoriesByParent={categoriesByParent}
              selectedParentId={editingRecord.categoryId}
              onSubmit={(input) => handleUpdateRecord(editingRecord.id, input)}
              onCancel={() => { setEditingRecord(null); setView('list'); }}
            />
          </div>
        ) : null;

      case 'stats':
        // 统计视图：全屏显示统计图表
        return (
          <div className="stats-full">
            <Stats date={currentDate} />
          </div>
        );

      default:
        // 默认（列表视图）：左侧记录列表 + 右侧简要统计
        return (
          <>
            <div className="record-panel">
              {/* 顶部汇总卡片：显示当日支出和本月支出 */}
              <div className="summary-cards-row">
                <div className="summary-card">
                  <div className="summary-header">
                    <div>
                      <div className="summary-label">当日支出</div>
                      <div className="summary-amount">¥{dayTotal.toFixed(2)}</div>
                    </div>
                    <div className="summary-actions">
                      <button className="summary-btn" onClick={handleExportCSV} title="导出CSV">
                        <Export size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="summary-card secondary">
                  <div className="summary-header">
                    <div>
                      <div className="summary-label">本月统计</div>
                      <div className="summary-amount">¥{monthTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 记录列表 */}
              <RecordList
                records={records}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
              />
            </div>

            {/* 右侧统计面板 */}
            <div className="stats-panel">
              <Stats date={currentDate} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="app">
      {/* 左侧边栏：包含标题和底部导航 */}
      <div className="sidebar">
        <Header title="周日记账" />
        <div className="tab-bar">
          {/* 记录列表 tab */}
          <button
            className={`tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={20} weight={view === 'list' ? 'fill' : 'regular'} />
            <span>记录</span>
          </button>

          {/* 新增记录 tab */}
          <button
            className={`tab ${view === 'add' ? 'active' : ''}`}
            onClick={handleStartAdd}
          >
            <Plus size={20} weight={view === 'add' ? 'fill' : 'regular'} />
            <span>新增</span>
          </button>

          {/* 统计 tab */}
          <button
            className={`tab ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            <ChartPie size={20} weight={view === 'stats' ? 'fill' : 'regular'} />
            <span>统计</span>
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="main-area">
        {/* 顶部日期选择器，显示当前日期和当日总额 */}
        <DateSelector date={currentDate} onChange={setCurrentDate} dayTotal={dayTotal} />

        {/* 动态内容区域，根据 view 状态渲染不同页面 */}
        <div className="content">
          {renderContent()}
        </div>
      </div>

      {/* 撤销提示条：删除记录后显示，5秒后自动消失 */}
      {showUndo && (
        <div className="undo-snackbar">
          <span>记录已删除</span>
          <button onClick={handleUndo}>撤销</button>
        </div>
      )}
    </div>
  );
}

export default App;
