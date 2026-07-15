/**
 * Upload Progress Component
 * Displays upload/compression progress with visual feedback
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface UploadProgressProps {
  progress: number; // 0-100
  status: 'idle' | 'processing' | 'uploading' | 'complete' | 'error';
  message?: string;
  error?: string;
  fileName?: string;
  showPercentage?: boolean;
}

export function UploadProgress({
  progress,
  status,
  message,
  error,
  fileName,
  showPercentage = true,
}: UploadProgressProps) {
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isActive = status === 'processing' || status === 'uploading';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`space-y-2 p-4 rounded-lg border ${
        isError
          ? 'bg-red-50 border-red-200'
          : isComplete
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="text-red-600" size={16} />
          ) : isComplete ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <CheckCircle className="text-emerald-600" size={16} />
            </motion.div>
          ) : (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Loader className="text-blue-600" size={16} />
            </motion.div>
          )}

          <span
            className={`text-sm font-semibold ${
              isError ? 'text-red-700' : isComplete ? 'text-emerald-700' : 'text-blue-700'
            }`}
          >
            {isError ? 'Error' : isComplete ? 'Complete' : 'Processing...'}
          </span>
        </div>

        {showPercentage && !isError && (
          <span className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
            {progress}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isError
              ? 'bg-red-500'
              : isComplete
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* File Name */}
      {fileName && (
        <div className="text-xs text-gray-600 truncate">
          <span className="font-medium">File:</span> {fileName}
        </div>
      )}

      {/* Status Message */}
      {message && (
        <p className={`text-xs ${isError ? 'text-red-600' : 'text-blue-600'}`}>
          {message}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-100 p-2 rounded border border-red-300">
          {error}
        </div>
      )}
    </motion.div>
  );
}

export default UploadProgress;
