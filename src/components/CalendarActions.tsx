'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useCalendar } from '@/context/CalendarContext';
import { useScheduling } from '@/context/SchedulingContext';
import { generateUntilYear } from '@/lib/scheduling';
import { format } from 'date-fns';

interface CalendarActionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarActions({ isOpen, onClose }: CalendarActionsProps) {
  const { state, exportCalendar, importCalendar } = useCalendar();
  const [importData, setImportData] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'stats'>('export');

  const handleExport = async () => {
    try {
      const data = await exportCalendar();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed');
    }
  };

  const handleImport = async () => {
    try {
      const result = await importCalendar(importData);
      if (result.success) {
        alert(`Successfully imported ${result.eventsAdded} events!`);
        setImportData('');
        onClose();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Import failed: Invalid data format');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const stats = {
    totalEvents: state.events.length,
    totalTasks: state.tasks.length,
    completedTasks: state.tasks.filter(task => task.status === 'completed').length,
    upcomingEvents: state.events.filter(event => event.start > new Date()).length,
    todayEvents: state.events.filter(event => {
      const today = new Date();
      return format(event.start, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    }).length,
  };

  const { dispatch: schedulingDispatch } = useScheduling();

  const handleRegenerateCalendar = () => {
    const generated = generateUntilYear(2070);
    schedulingDispatch({ type: 'GENERATE_DAYS', payload: generated });
    alert('Calendar regenerated for the next 12 months');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl sm:max-w-2xl transform overflow-hidden bg-white dark:bg-gray-800 shadow-2xl transition-all sm:rounded-2xl rounded-t-2xl h-full sm:h-auto sm:my-12">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
                    Calendar Actions
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex sm:flex-row flex-row sm:space-x-8 space-x-4 px-4 sm:px-6 overflow-x-auto">
                    {[
                      { key: 'export', label: 'Export', icon: DocumentArrowDownIcon },
                      { key: 'import', label: 'Import', icon: DocumentArrowUpIcon },
                      { key: 'stats', label: 'Statistics', icon: CalendarDaysIcon },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key as 'export' | 'import' | 'stats')}
                        className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === key
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {activeTab === 'export' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Export Calendar Data
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Export your events, tasks, and categories to a JSON file for backup or sharing.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          Export will include:
                        </h5>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• {state.events.length} events</li>
                          <li>• {state.tasks.length} tasks</li>
                          <li>• {state.categories.length} categories</li>
                          <li>• All event details, reminders, and recurrence rules</li>
                        </ul>
                      </div>

                      <button
                        onClick={handleExport}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors btn-mobile"
                        aria-label="Export Calendar"
                      >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Export Calendar</span>
                      </button>
                      <div className="mt-3">
                        <button
                          onClick={handleRegenerateCalendar}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                          <CalendarDaysIcon className="w-5 h-5" />
                          <span>Regenerate Calendar (to 2070)</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'import' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Import Calendar Data
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Import events and tasks from a previously exported JSON file.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select file to import:
                          </label>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleFileImport}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                            aria-label="Select calendar JSON file to import"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Or paste JSON data:
                          </label>
                          <textarea
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            rows={6}
                            placeholder="Paste your exported JSON data here..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          />
                        </div>

                        <button
                          onClick={handleImport}
                          disabled={!importData.trim()}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors btn-mobile"
                          aria-label="Import Calendar"
                        >
                          <DocumentArrowUpIcon className="w-5 h-5" />
                          <span>Import Calendar</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'stats' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Calendar Statistics
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Overview of your calendar activity and data.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
                          <CalendarDaysIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.totalEvents}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Total Events
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
                          <ClockIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {stats.totalTasks}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Total Tasks
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.upcomingEvents}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            Upcoming Events
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 text-center">
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {stats.todayEvents}
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Today&apos;s Events
                          </div>
                        </div>
                      </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                          Task Completion Rate
                        </h5>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all duration-500"
                              style={{
                                width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {stats.completedTasks} of {stats.totalTasks} tasks completed
                        </p>
                      </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                          Categories
                        </h5>
                        <div className="space-y-2">
                          {state.categories.map((category) => {
                            const categoryEvents = state.events.filter(event => event.category.id === category.id);
                            return (
                              <div key={category.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {category.name}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {categoryEvents.length}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}