'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  BellIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  SparklesIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useCalendar, renderCategoryIcon } from '@/context/CalendarContext';
import { 
  CalendarEvent, 
  EventFormData, 
  EventPriority, 
  EventStatus, 
  RecurrenceRule,
  Reminder
} from '@/types/calendar';
import { addMinutes } from 'date-fns';

// Import DatePicker styles
import 'react-datepicker/dist/react-datepicker.css';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
}

export default function EventModal({ isOpen, onClose, event, initialDate }: EventModalProps) {
  const { state, createEvent, dispatch } = useCalendar();
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start: initialDate || new Date(),
    end: initialDate ? addMinutes(initialDate, 60) : addMinutes(new Date(), 60),
    allDay: false,
    location: '',
    categoryId: state.categories[0]?.id || '',
    priority: 'medium' as EventPriority,
    status: 'confirmed' as EventStatus,
    attendees: [],
    tags: [],
    reminders: [],
    isPrivate: false,
    url: '',
    notes: '',
  });

  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrenceData, setRecurrenceData] = useState<RecurrenceRule>({
    frequency: 'daily',
    interval: 1,
  });

  const [newAttendee, setNewAttendee] = useState('');
  const [newTag, setNewTag] = useState('');

  // Priority options for select
  const priorityOptions = [
    { 
      value: 'low', 
      label: (
        <div className="flex items-center gap-2">
          <SignalIcon className="w-4 h-4 text-green-500" />
          <span>Low</span>
        </div>
      ), 
      color: '#10B981' 
    },
    { 
      value: 'medium', 
      label: (
        <div className="flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />
          <span>Medium</span>
        </div>
      ), 
      color: '#F59E0B' 
    },
    { 
      value: 'high', 
      label: (
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
          <span>High</span>
        </div>
      ), 
      color: '#EF4444' 
    },
    { 
      value: 'urgent', 
      label: (
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
          <span>Urgent</span>
        </div>
      ), 
      color: '#DC2626' 
    },
  ];

  // Status options
  const statusOptions = [
    { 
      value: 'confirmed', 
      label: (
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span>Confirmed</span>
        </div>
      )
    },
    { 
      value: 'tentative', 
      label: (
        <div className="flex items-center gap-2">
          <QuestionMarkCircleIcon className="w-4 h-4 text-yellow-500" />
          <span>Tentative</span>
        </div>
      )
    },
    { 
      value: 'cancelled', 
      label: (
        <div className="flex items-center gap-2">
          <XCircleIcon className="w-4 h-4 text-red-500" />
          <span>Cancelled</span>
        </div>
      )
    },
    { 
      value: 'completed', 
      label: (
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <span>Completed</span>
        </div>
      )
    },
  ];

  // Category options
  const categoryOptions = state.categories.map(cat => ({
    value: cat.id,
    label: (
      <div className="flex items-center gap-2">
        {renderCategoryIcon(cat.icon || 'UserIcon', 'w-4 h-4')}
        <span>{cat.name}</span>
      </div>
    ),
    color: cat.color,
  }));

  // Initialize form with event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        location: event.location || '',
        categoryId: event.category.id,
        priority: event.priority,
        status: event.status,
        attendees: event.attendees || [],
        tags: event.tags,
        reminders: event.reminders,
        isPrivate: event.isPrivate,
        url: event.url || '',
        notes: event.notes || '',
      });
      
      if (event.recurrence) {
        setShowRecurrence(true);
        setRecurrenceData(event.recurrence);
      }
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const category = state.categories.find(cat => cat.id === formData.categoryId)!;
    
    const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      description: formData.description,
      start: formData.start,
      end: formData.end,
      allDay: formData.allDay,
      location: formData.location,
      category,
      priority: formData.priority,
      status: formData.status,
      color: category.color,
      attendees: formData.attendees,
      reminders: formData.reminders,
      attachments: [],
      recurrence: showRecurrence ? recurrenceData : undefined,
      parentEventId: undefined,
      tags: formData.tags,
      createdBy: 'current-user',
      isPrivate: formData.isPrivate,
      url: formData.url,
      notes: formData.notes,
    };

    if (event) {
      // Update existing event
      dispatch({ type: 'UPDATE_EVENT', payload: { ...eventData, id: event.id, createdAt: event.createdAt, updatedAt: new Date() } });
    } else {
      // Create new event
      createEvent(eventData);
    }

    onClose();
  };

  const addReminder = () => {
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      type: 'notification',
      minutesBefore: 15,
    };
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder],
    }));
  };

  const removeReminder = (id: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id),
    }));
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()],
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
                        {event ? 'Edit Event' : 'Create New Event'}
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                    {/* Basic Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter event title..."
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Event description..."
                        />
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <CalendarIcon className="w-4 h-4 inline mr-1" />
                            Start Date & Time
                          </label>
                          <DatePicker
                            selected={formData.start}
                            onChange={(date) => date && setFormData(prev => ({ ...prev, start: date }))}
                            showTimeSelect={!formData.allDay}
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat={formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm"}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <ClockIcon className="w-4 h-4 inline mr-1" />
                            End Date & Time
                          </label>
                          <DatePicker
                            selected={formData.end}
                            onChange={(date) => date && setFormData(prev => ({ ...prev, end: date }))}
                            showTimeSelect={!formData.allDay}
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat={formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm"}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* All Day Toggle */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="allDay"
                          checked={formData.allDay}
                          onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          All Day Event
                        </label>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <MapPinIcon className="w-4 h-4 inline mr-1" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Event location..."
                        />
                      </div>

                      {/* Category, Priority, Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Category
                          </label>
                          <Select
                            value={categoryOptions.find(opt => opt.value === formData.categoryId)}
                            onChange={(option) => option && setFormData(prev => ({ ...prev, categoryId: option.value }))}
                            options={categoryOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Priority
                          </label>
                          <Select
                            value={priorityOptions.find(opt => opt.value === formData.priority)}
                            onChange={(option) => option && setFormData(prev => ({ ...prev, priority: option.value as EventPriority }))}
                            options={priorityOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Status
                          </label>
                          <Select
                            value={statusOptions.find(opt => opt.value === formData.status)}
                            onChange={(option) => option && setFormData(prev => ({ ...prev, status: option.value as EventStatus }))}
                            options={statusOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Advanced Options */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Advanced Options
                      </h4>

                      {/* Attendees */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <UsersIcon className="w-4 h-4 inline mr-1" />
                          Attendees
                        </label>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <input
                              type="email"
                              value={newAttendee}
                              onChange={(e) => setNewAttendee(e.target.value)}
                              placeholder="Enter email address..."
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addAttendee}
                              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {formData.attendees.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.attendees.map((email, index) => (
                                <span
                                  key={index}
                                  className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                                >
                                  <span>{email}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeAttendee(email)}
                                    className="hover:text-blue-900 dark:hover:text-blue-100"
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <TagIcon className="w-4 h-4 inline mr-1" />
                          Tags
                        </label>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add tag..."
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addTag}
                              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                                >
                                  <span>{tag}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-purple-900 dark:hover:text-purple-100"
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reminders */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <BellIcon className="w-4 h-4 inline mr-1" />
                          Reminders
                        </label>
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={addReminder}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm"
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Reminder</span>
                          </button>
                          
                          {formData.reminders.map((reminder) => (
                            <div key={reminder.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                              <select
                                value={reminder.minutesBefore}
                                onChange={(e) => updateReminder(reminder.id, { minutesBefore: parseInt(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={0}>At event time</option>
                                <option value={5}>5 minutes before</option>
                                <option value={15}>15 minutes before</option>
                                <option value={30}>30 minutes before</option>
                                <option value={60}>1 hour before</option>
                                <option value={1440}>1 day before</option>
                              </select>
                              
                              <select
                                value={reminder.type}
                                onChange={(e) => updateReminder(reminder.id, { type: e.target.value as 'email' | 'notification' | 'popup' })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="notification">Notification</option>
                                <option value="email">Email</option>
                                <option value="popup">Popup</option>
                              </select>
                              
                              <button
                                type="button"
                                onClick={() => removeReminder(reminder.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recurrence */}
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="checkbox"
                            id="recurrence"
                            checked={showRecurrence}
                            onChange={(e) => setShowRecurrence(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="recurrence" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Recurring Event
                          </label>
                        </div>

                        {showRecurrence && (
                          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Frequency
                                </label>
                                <select
                                  value={recurrenceData.frequency}
                                  onChange={(e) => setRecurrenceData(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' }))}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="yearly">Yearly</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Interval
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={recurrenceData.interval}
                                  onChange={(e) => setRecurrenceData(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Options */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            URL/Link
                          </label>
                          <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                          </label>
                          <textarea
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Additional notes..."
                          />
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="private"
                            checked={formData.isPrivate}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="private" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Private Event
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-end space-x-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {event ? 'Update Event' : 'Create Event'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}