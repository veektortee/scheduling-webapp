'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  IoCloseSharp,
  IoRocketSharp,
  IoTerminalSharp,
  IoDesktopSharp,
  IoPlaySharp,
  IoFolderOpenSharp
} from 'react-icons/io5';
import { SiApple, SiLinux } from 'react-icons/si';

interface LocalSolverGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'windows' | 'mac' | 'linux';
}

export default function LocalSolverGuideModal({ isOpen, onClose, platform }: LocalSolverGuideModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const getPlatformIcon = () => {
    switch (platform) {
      case 'windows':
        return <IoDesktopSharp className="w-8 h-8 text-blue-500" />;
      case 'mac':
        return <SiApple className="w-8 h-8 text-gray-700 dark:text-gray-300" />;
      case 'linux':
        return <SiLinux className="w-8 h-8 text-yellow-600" />;
      default:
        return <IoDesktopSharp className="w-8 h-8 text-blue-500" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'windows': return 'Windows';
      case 'mac': return 'macOS';
      case 'linux': return 'Linux';
      default: return 'Your System';
    }
  };

  const getStartScript = () => {
    switch (platform) {
      case 'windows': return 'start_local_solver.bat';
      case 'mac': 
      case 'linux': 
      default: return 'start_local_solver.sh';
    }
  };

  const getInstructions = () => {
    const startScript = getStartScript();
    
    switch (platform) {
      case 'windows':
        return [
          {
            title: "Find Downloaded Files",
            description: `Locate ${startScript} in your Downloads folder`,
            icon: <IoFolderOpenSharp className="w-6 h-6 text-blue-500" />,
            details: [
              `Look for: ${startScript}`,
              "Usually in Downloads folder"
            ]
          },
          {
            title: "Double-Click to Start",
            description: `Double-click ${startScript} to launch the server`,
            icon: <IoPlaySharp className="w-6 h-6 text-green-500" />,
            details: [
              "A command window will open",
              "Keep it open while using webapp"
            ]
          },
          {
            title: "Use Local Mode",
            description: "Return here and select 'Local' for 10-100x faster solving",
            icon: <IoRocketSharp className="w-6 h-6 text-purple-500" />,
            details: [
              "Select 'Local' instead of 'Serverless'",
              "Click 'Check Local Mode Setup' to verify"
            ]
          }
        ];
      
      case 'mac':
      case 'linux':
      default:
        return [
          {
            title: "Open Terminal",
            description: "Navigate to Downloads folder in Terminal",
            icon: <IoTerminalSharp className="w-6 h-6 text-gray-700 dark:text-gray-300" />,
            details: [
              "Open Terminal app",
              "Type: cd ~/Downloads"
            ]
          },
          {
            title: "Make Executable & Run",
            description: `Make script executable and run it`,
            icon: <IoPlaySharp className="w-6 h-6 text-green-500" />,
            details: [
              `chmod +x ${startScript}`,
              `./${startScript}`
            ]
          },
          {
            title: "Use Local Mode",
            description: "Return here and select 'Local' for faster solving",
            icon: <IoRocketSharp className="w-6 h-6 text-purple-500" />,
            details: [
              "Select 'Local' instead of 'Serverless'",
              "Keep Terminal open while using webapp"
            ]
          }
        ];
    }
  };

  const instructions = getInstructions();

  const handleNext = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleGotIt = () => {
    setCurrentStep(0);
    onClose();
    // Restart the webpage to refresh the interface
    window.location.reload();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 max-w-lg w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {getPlatformIcon()}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Setup Guide
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getPlatformName()} - Ready to start!
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
          >
            <IoCloseSharp className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {instructions.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / instructions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
              {instructions[currentStep].icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {instructions[currentStep].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {instructions[currentStep].description}
              </p>
            </div>
          </div>

          {/* Step Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <ul className="space-y-2">
              {instructions[currentStep].details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {instructions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentStep 
                    ? 'bg-blue-500' 
                    : index < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentStep === instructions.length - 1 ? (
            <button
              onClick={handleGotIt}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold transition-all duration-200 hover:scale-105"
            >
             Done ! <br></br> I Have Executed The File
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-semibold transition-all duration-200 hover:scale-105"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}