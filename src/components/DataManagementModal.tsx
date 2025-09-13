'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PersistentStorage } from '@/lib/persistentStorage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataManagementModal({ isOpen, onClose }: DataManagementModalProps) {
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [storageInfo, setStorageInfo] = useState(PersistentStorage.getStorageInfo());
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'storage' | 'cleanup'>('storage');

  const handleExport = () => {
    const data = PersistentStorage.exportSchedulingData();
    setExportData(data);
    
    // Also download as file
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduling-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importData.trim()) return;
    
    const success = PersistentStorage.importSchedulingData(importData);
    if (success) {
      alert('Data imported successfully! Please refresh the page to see the changes.');
      setImportData('');
    } else {
      alert('Failed to import data. Please check the JSON format.');
    }
  };

  const handleCleanup = () => {
    PersistentStorage.cleanup();
    setStorageInfo(PersistentStorage.getStorageInfo());
    alert('Cleanup completed! Expired data has been removed.');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all scheduling data? This cannot be undone.')) {
      ['scheduling-results-v1', 'scheduling-last-results-v1'].forEach(key => {
        PersistentStorage.remove(key);
      });
      setStorageInfo(PersistentStorage.getStorageInfo());
      alert('All scheduling data has been cleared.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Management
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="flex space-x-1 mt-4">
            {[
              { key: 'storage', label: 'Storage Info', icon: InformationCircleIcon },
              { key: 'export', label: 'Export', icon: CloudArrowDownIcon },
              { key: 'import', label: 'Import', icon: CloudArrowUpIcon },
              { key: 'cleanup', label: 'Cleanup', icon: TrashIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'export' | 'import' | 'storage' | 'cleanup')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Storage Information
              </h3>
              
              {storageInfo.available ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Storage Used
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {storageInfo.usedMB} MB / {storageInfo.totalMB} MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(storageInfo.percentage || 0, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {storageInfo.percentage}% used
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>• Scheduling results are automatically cleaned after 24 hours</p>
                    <p>• Data persists across browser sessions and page refreshes</p>
                    <p>• Use Export/Import for backup and migration</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Local storage is not available in this browser.
                </p>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Export Data
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export your scheduling results and settings for backup or migration to another device.
              </p>
              
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <CloudArrowDownIcon className="w-5 h-5" />
                <span>Export & Download</span>
              </button>
              
              {exportData && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exported Data (also downloaded as file):
                  </label>
                  <textarea
                    value={exportData}
                    readOnly
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm font-mono resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Import Data
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import previously exported scheduling data. This will overwrite existing data.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste JSON data:
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your exported JSON data here..."
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-mono resize-none"
                />
              </div>
              
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Import Data</span>
              </button>
            </div>
          )}

          {activeTab === 'cleanup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Data Cleanup
              </h3>
              
              <div className="space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Automatic Cleanup
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Expired data (older than 24 hours) is automatically removed when the app loads.
                  </p>
                  <button
                    onClick={handleCleanup}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Clean Expired Data Now</span>
                  </button>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                    Clear All Data
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                    Permanently remove all scheduling results and settings. This cannot be undone.
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Clear All Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}