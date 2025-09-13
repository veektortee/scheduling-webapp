'use client';

/**
 * Persistent storage utilities for scheduling webapp
 * Handles localStorage with expiration, data migration, and Vercel compatibility
 */

export interface StorageData {
  timestamp: string;
  version: string;
  data: unknown;
}

export class PersistentStorage {
  private static readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly STORAGE_VERSION = '1.0';

  /**
   * Save data to localStorage with expiration
   */
  static save(key: string, data: unknown): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const storageData: StorageData = {
        timestamp: new Date().toISOString(),
        version: this.STORAGE_VERSION,
        data: data
      };
      
      localStorage.setItem(key, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
      return false;
    }
  }

  /**
   * Load data from localStorage with expiration check
   */
  static load<T>(key: string, maxAgeMs: number = this.DEFAULT_EXPIRY): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsedData: StorageData = JSON.parse(stored);
      
      // Check expiration
      const age = Date.now() - new Date(parsedData.timestamp).getTime();
      if (age > maxAgeMs) {
        this.remove(key);
        return null;
      }

      return parsedData.data as T;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all expired data from localStorage
   */
  static cleanup(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const stored = localStorage.getItem(key);
          if (!stored) continue;

          const parsedData: StorageData = JSON.parse(stored);
          if (parsedData.timestamp) {
            const age = Date.now() - new Date(parsedData.timestamp).getTime();
            if (age > this.DEFAULT_EXPIRY) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // If parsing fails, it might be old format data
          continue;
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired localStorage entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }

  /**
   * Export all scheduling-related data for backup/migration
   */
  static exportSchedulingData(): string {
    if (typeof window === 'undefined') return '{}';

    const exportData: Record<string, unknown> = {};
    const schedulingKeys = [
      'scheduling-results-v1',
      'scheduling-last-results-v1',
      'calendarState',
      'theme'
    ];

    try {
      schedulingKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          exportData[key] = JSON.parse(data);
        }
      });

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export scheduling data:', error);
      return '{}';
    }
  }

  /**
   * Import scheduling data from backup
   */
  static importSchedulingData(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const importData = JSON.parse(jsonData);
      
      Object.entries(importData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      console.log('Successfully imported scheduling data');
      return true;
    } catch (error) {
      console.error('Failed to import scheduling data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo() {
    if (typeof window === 'undefined') {
      return { available: false, used: 0, total: 0 };
    }

    try {
      const used = JSON.stringify(localStorage).length;
      const total = 5 * 1024 * 1024; // Approximate 5MB limit

      return {
        available: true,
        used: used,
        total: total,
        percentage: Math.round((used / total) * 100),
        usedMB: Math.round(used / 1024 / 1024 * 100) / 100,
        totalMB: Math.round(total / 1024 / 1024)
      };
    } catch (error) {
      console.warn('Failed to get storage info:', error);
      return { available: false, used: 0, total: 0 };
    }
  }
}

// Auto-cleanup on module load (runs once per session)
if (typeof window !== 'undefined') {
  // Cleanup expired data on app load
  setTimeout(() => PersistentStorage.cleanup(), 1000);
}