import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import RecordList from './components/RecordList';
import RecordForm from './components/RecordForm';
import Stats from './components/Stats';
import { Record, RecordInput, Category } from './types';
import { List, Plus, ChartPie, Export } from '@phosphor-icons/react';

type View = 'list' | 'add' | 'edit' | 'stats';

function App() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [view, setView] = useState<View>('list');
  const [records, setRecords] = useState<Record[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesByParent, setCategoriesByParent] = useState<{[key: number]: Category[]}>({});
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [dayTotal, setDayTotal] = useState(0);
  const [undoRecord, setUndoRecord] = useState<Record | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Staggered entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    const cats = await window.electronAPI.getCategories();
    setCategories(cats);
    const byParent = await window.electronAPI.getCategoriesByParent();
    setCategoriesByParent(byParent);
  }, []);

  // Load records
  const loadRecords = useCallback(async () => {
    const recs = await window.electronAPI.getRecords(currentDate);
    setRecords(recs);
  }, [currentDate]);

  // Load day total
  const loadDayTotal = useCallback(async () => {
    const total = await window.electronAPI.getDayTotal(currentDate);
    setDayTotal(total);
  }, [currentDate]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (view === 'list') {
      loadRecords();
      loadDayTotal();
    }
  }, [view, currentDate, loadRecords, loadDayTotal]);

  // Add record
  const handleAddRecord = async (input: RecordInput) => {
    await window.electronAPI.addRecord(input);
    loadRecords();
    loadDayTotal();
    setView('list');
  };

  // Update record
  const handleUpdateRecord = async (id: number, input: RecordInput) => {
    await window.electronAPI.updateRecord(id, input);
    loadRecords();
    loadDayTotal();
    setEditingRecord(null);
    setView('list');
  };

  // Delete record
  const handleDeleteRecord = async (id: number) => {
    const recordToDelete = records.find(r => r.id === id);
    if (confirm('确定要删除这条记录吗？')) {
      await window.electronAPI.deleteRecord(id);
      loadRecords();
      loadDayTotal();

      // Show undo button
      if (recordToDelete) {
        setUndoRecord(recordToDelete);
        setShowUndo(true);
        setTimeout(() => setShowUndo(false), 5000);
      }
    }
  };

  // Undo delete
  const handleUndo = async () => {
    const restored = await window.electronAPI.undoDelete();
    if (restored) {
      loadRecords();
      loadDayTotal();
    }
    setShowUndo(false);
    setUndoRecord(null);
  };

  // Edit record
  const handleEditRecord = (record: Record) => {
    setEditingRecord(record);
    setView('edit');
  };

  // Start adding
  const handleStartAdd = () => {
    const parents = categories.filter(c => c.parentId === null);
    if (parents.length > 0) {
      setSelectedParentId(parents[0].id);
    }
    setView('add');
  };

  // Export CSV
  const handleExportCSV = async () => {
    const csv = await window.electronAPI.exportCSV();
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sundaybill_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get parent categories
  const parentCategories = categories.filter(c => c.parentId === null);

  // Render current view
  const renderContent = () => {
    switch (view) {
      case 'add':
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
        return editingRecord ? (
          <div className="form-full">
            <RecordForm
              record={editingRecord}
              categories={categories}
              categoriesByParent={categoriesByParent}
              selectedParentId={editingRecord.categoryId}
              onSelectParent={() => {}}
              onSubmit={(input) => handleUpdateRecord(editingRecord.id, input)}
              onCancel={() => { setEditingRecord(null); setView('list'); }}
            />
          </div>
        ) : null;
      case 'stats':
        return (
          <div className="stats-full">
            <Stats date={currentDate} />
          </div>
        );
      default:
        return (
          <>
            <div className="record-panel">
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
                      <div className="summary-amount">¥{dayTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <RecordList
                records={records}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
              />
            </div>
            <div className="stats-panel">
              <Stats date={currentDate} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <Header title="周日记账" />
        <div className="tab-bar">
          <button
            className={`tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={20} weight={view === 'list' ? 'fill' : 'regular'} />
            <span>记录</span>
          </button>
          <button
            className={`tab ${view === 'add' ? 'active' : ''}`}
            onClick={handleStartAdd}
          >
            <Plus size={20} weight={view === 'add' ? 'fill' : 'regular'} />
            <span>新增</span>
          </button>
          <button
            className={`tab ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            <ChartPie size={20} weight={view === 'stats' ? 'fill' : 'regular'} />
            <span>统计</span>
          </button>
        </div>
      </div>

      <div className="main-area">
        <DateSelector date={currentDate} onChange={setCurrentDate} dayTotal={dayTotal} />
        <div className="content">
          {renderContent()}
        </div>
      </div>

      {/* Undo snackbar */}
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
