'use client';

import { useState } from 'react';
import { useScheduling } from '@/context/SchedulingContext';
import { 
  IoSettingsSharp,
  IoStatsChartSharp,
  IoSpeedometerSharp,
  IoTimerSharp
} from 'react-icons/io5';

export default function ConfigTab() {
  const { state, dispatch } = useScheduling();
  const { case: schedulingCase } = state;
  const [weightsJson, setWeightsJson] = useState(
    JSON.stringify(schedulingCase.constants.weights, null, 2)
  );
  const [objectiveJson, setObjectiveJson] = useState(
    JSON.stringify(schedulingCase.constants.objective, null, 2)
  );

  const updateSolverConfig = (field: string, value: number) => {
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        constants: {
          ...schedulingCase.constants,
          solver: {
            ...schedulingCase.constants.solver,
            [field]: value,
          },
        },
      },
    });
  };

  const updateRunConfig = (field: string, value: string | number) => {
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        run: {
          ...schedulingCase.run,
          [field]: value,
        },
      },
    });
  };

  const applyAdvancedConfig = () => {
    try {
      const weights = JSON.parse(weightsJson);
      const objective = JSON.parse(objectiveJson);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          constants: {
            ...schedulingCase.constants,
            weights,
            objective,
          },
        },
      });

      alert('Configuration applied successfully!');
    } catch { // Fixed ESLint unused error variable
      alert('Invalid JSON format. Please check your configuration.');
    }
  };

  const resetToDefaults = () => {
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        constants: {
          solver: {
            max_time_in_seconds: 125999.99999999999,
            phase1_fraction: 0.4,
            relative_gap: 0.00001,
            num_threads: 16
          },
          weights: {
            hard: {
              slack_consec: 1
            },
            soft: {}
          },
          objective: {
            hard: 1,
            soft: 1,
            fair: 0
          }
        },
      },
    });
    setWeightsJson(JSON.stringify({
      hard: { slack_consec: 1 },
      soft: {}
    }, null, 2));
    setObjectiveJson(JSON.stringify({
      hard: 1,
      soft: 1,
      fair: 0
    }, null, 2));
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <IoSettingsSharp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Max Time</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {schedulingCase.constants.solver.max_time_in_seconds}s
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <IoStatsChartSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Phase 1</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(schedulingCase.constants.solver.phase1_fraction * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <IoSettingsSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Weights</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(schedulingCase.constants.weights).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-800/50 p-6 hover-glow hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <IoSpeedometerSharp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Objectives</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Object.keys(schedulingCase.constants.objective).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Solver Configuration */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover-glow">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IoSettingsSharp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Solver Configuration
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <IoTimerSharp className="w-4 h-4" />
              <span>Max Time (seconds)</span>
            </label>
            <input
              type="number"
              value={schedulingCase.constants.solver.max_time_in_seconds}
              onChange={(e) => updateSolverConfig('max_time_in_seconds', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
              placeholder="e.g., 350"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Maximum solver runtime</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Phase 1 Fraction
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={schedulingCase.constants.solver.phase1_fraction}
              onChange={(e) => updateSolverConfig('phase1_fraction', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 0.4"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Phase 1 time fraction (0-1)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relative Gap
            </label>
            <input
              type="number"
              step="0.00001"
              min="0"
              max="1"
              value={schedulingCase.constants.solver.relative_gap}
              onChange={(e) => updateSolverConfig('relative_gap', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 0.01"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimization gap tolerance</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Threads
            </label>
            <input
              type="number"
              min="1"
              max="64"
              value={schedulingCase.constants.solver.num_threads}
              onChange={(e) => updateSolverConfig('num_threads', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 8"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Parallel processing threads</p>
          </div>
        </div>
      </div>

      {/* Run Defaults */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Run Defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Output Directory
            </label>
            <input
              type="text"
              value={schedulingCase.run.out}
              onChange={(e) => updateRunConfig('out', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              k (Solutions)
            </label>
            <input
              type="number"
              value={schedulingCase.run.k}
              onChange={(e) => updateRunConfig('k', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seed
            </label>
            <input
              type="number"
              value={schedulingCase.run.seed}
              onChange={(e) => updateRunConfig('seed', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time (minutes)
            </label>
            <input
              type="number"
              value={schedulingCase.run.time}
              onChange={(e) => updateRunConfig('time', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Advanced Configuration (JSON)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weights Configuration
            </label>
            <textarea
              value={weightsJson}
              onChange={(e) => setWeightsJson(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter weights JSON configuration..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objective Configuration
            </label>
            <textarea
              value={objectiveJson}
              onChange={(e) => setObjectiveJson(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter objective JSON configuration..."
            />
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={applyAdvancedConfig}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg"
          >
            Apply Configuration
          </button>
          
          <button
            onClick={resetToDefaults}
            className="px-6 py-2 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-lg hover:from-gray-600 hover:to-slate-700 transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Configuration Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Solver Settings</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <div>Time Limit: {schedulingCase.constants.solver.max_time_in_seconds}s</div>
              <div>Threads: {schedulingCase.constants.solver.num_threads}</div>
              <div>Gap: {schedulingCase.constants.solver.relative_gap}</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Objective Weights</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <div>Hard: {schedulingCase.constants.objective.hard}</div>
              <div>Soft: {schedulingCase.constants.objective.soft}</div>
              <div>Fair: {schedulingCase.constants.objective.fair}</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Run Configuration</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <div>Output: {schedulingCase.run.out}</div>
              <div>Solutions (k): {schedulingCase.run.k}</div>
              <div>Variety (L): {schedulingCase.run.L}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">Configuration Help</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Solver Settings:</strong> Control the optimization algorithm behavior</p>
          <p><strong>Weights:</strong> Define the importance of different constraints (hard vs soft)</p>
          <p><strong>Objectives:</strong> Balance between constraint satisfaction and fairness</p>
          <p><strong>Advanced JSON:</strong> Direct configuration for complex constraint definitions</p>
        </div>
      </div>
    </div>
  );
}
