/**
 * QSMS Feedback System Types
 * Defines data contracts for user feedback, ratings, and diagnostic telemetry
 */

export type FeedbackCategory = 'rating' | 'bug_report' | 'feature_request' | 'general';

export type FeedbackModule = 
  | 'overall'
  | 'rework_management'
  | 'drawing_master_ocr'
  | 'docai_assistant'
  | 'ui_performance';

export interface DeviceMetadata {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  url: string;
  activeView: string;
  timestamp: string;
}

export interface FeedbackSubmission {
  id?: string;
  category: FeedbackCategory;
  module: FeedbackModule;
  rating?: number; // 1 - 5
  title?: string;
  comment: string;
  tags?: string[];
  userEmail?: string;
  userName?: string;
  userRole?: string;
  metadata?: DeviceMetadata;
  createdAt?: string;
}

export interface FeedbackStats {
  total: number;
  averageRating: number;
  byCategory: Record<FeedbackCategory, number>;
  byModule: Record<FeedbackModule, number>;
}
