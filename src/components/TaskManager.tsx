'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  FlagIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SignalIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useCalendar } from '@/context/CalendarContext';
import { Task, TaskStatus, EventPriority } from '@/types/calendar';
import { format, isToday, isPast } from 'date-fns';

export default function TaskManager() {
  const { state, createTask, toggleTaskCompletion, dispatch } = useCalendar();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const defaultCategory = state.categories.find(cat => cat.name === 'Personal') || state.categories[0];
    
    createTask({
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: 'medium',
      category: defaultCategory,
      tags: [],
      subtasks: [],
      progress: 0,
      dependencies: [],
      attachments: [],
      reminders: [],
      createdBy: 'current-user',
      isRecurring: false,
    });

    setNewTaskTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityIcon = (priority: EventPriority) => {
    switch (priority) {
      case 'urgent': 
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      case 'high': 
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />;
      case 'medium': 
        return <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'low': 
        return <SignalIcon className="w-4 h-4 text-green-500" />;
      default: 
        return <SignalIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'in-progress': return 'text-blue-600 dark:text-blue-400';
      case 'cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const filteredTasks = state.tasks.filter(task => 
    showCompleted || task.status !== 'completed'
  );

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
  };

  // upcomingTasks intentionally removed to avoid unused variable warning

  const overdueTasks = filteredTasks.filter(task =>
    task.dueDate && isPast(task.dueDate) && task.status !== 'completed'
  );

  const todayTasks = filteredTasks.filter(task =>
    task.dueDate && isToday(task.dueDate) && task.status !== 'completed'
  );

  const TaskItem = ({ task }: { task: Task }) => {
    const isExpanded = expandedTasks.has(task.id);
    const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';
    const isDueToday = task.dueDate && isToday(task.dueDate);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          p-4 border rounded-xl transition-all duration-200 hover:shadow-md
          ${task.status === 'completed' 
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 opacity-75'
            : isOverdue
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
            : isDueToday
            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50'
            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }
        `}
      >
        <div className="flex items-start space-x-3">
          {/* Completion checkbox */}
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className={`mt-0.5 transition-colors ${
              task.status === 'completed' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
            }`}
          >
            {task.status === 'completed' ? (
              <CheckCircleSolidIcon className="w-5 h-5" />
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Task header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span className="text-sm">{getPriorityIcon(task.priority)}</span>
                <h4 className={`font-medium truncate ${
                  task.status === 'completed' 
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {task.title}
                </h4>
                {task.subtasks.length > 0 && (
                  <button
                    onClick={() => toggleTaskExpansion(task.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {task.progress > 0 && task.progress < 100 && (
                  <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
                
                <button
                  onClick={() => dispatch({ type: 'SELECT_TASK', payload: task })}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-red-500"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Task details */}
            <div className="mt-2 space-y-1">
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {task.dueDate && (
                  <div className={`flex items-center space-x-1 ${
                    isOverdue ? 'text-red-500' : isDueToday ? 'text-yellow-600' : ''
                  }`}>
                    <ClockIcon className="w-3 h-3" />
                    <span>{format(task.dueDate, 'MMM dd, HH:mm')}</span>
                    {isOverdue && <span className="font-medium">(Overdue)</span>}
                    {isDueToday && <span className="font-medium">(Today)</span>}
                  </div>
                )}
                
                {task.category && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.category.color }}
                    />
                    <span>{task.category.name}</span>
                  </div>
                )}

                <span className={`capitalize ${getStatusColor(task.status)}`}>
                  {task.status.replace('-', ' ')}
                </span>
              </div>

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subtasks */}
            {isExpanded && task.subtasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
              >
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2 py-1">
                    <button
                      className={`transition-colors ${
                        subtask.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
                      }`}
                    >
                      {subtask.completed ? (
                        <CheckCircleSolidIcon className="w-4 h-4" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )}
                    </button>
                    <span className={`text-sm ${
                      subtask.completed 
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const TaskSection = ({ title, tasks, icon }: { title: string; tasks: Task[]; icon?: React.ReactNode }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {title} ({tasks.length})
        </h3>
      </div>
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </AnimatePresence>
      {tasks.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No tasks in this section
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Task creation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Add Task
        </h2>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-0"
          />
          <button
            onClick={handleCreateTask}
            className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center w-12 h-12 flex-shrink-0 shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

  {/* Task stats */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {overdueTasks.length}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
            Overdue
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {todayTasks.length}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            Due Today
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tasksByStatus.completed.length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            Completed
          </div>
        </div>
      </div>

      {/* Show completed toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tasks
        </h2>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Show completed
          </span>
        </label>
      </div>

      {/* Priority sections */}
      {overdueTasks.length > 0 && (
        <TaskSection
          title="Overdue"
          tasks={overdueTasks}
          icon={<FlagIcon className="w-5 h-5 text-red-500" />}
        />
      )}

      {todayTasks.length > 0 && (
        <TaskSection
          title="Due Today"
          tasks={todayTasks}
          icon={<ClockIcon className="w-5 h-5 text-yellow-500" />}
        />
      )}

      <TaskSection
        title="To Do"
        tasks={tasksByStatus.todo.filter(task => !overdueTasks.includes(task) && !todayTasks.includes(task))}
      />

      <TaskSection
        title="In Progress"
        tasks={tasksByStatus['in-progress']}
      />

      {showCompleted && (
        <TaskSection
          title="Completed"
          tasks={tasksByStatus.completed}
        />
      )}
    </motion.div>
  );
}