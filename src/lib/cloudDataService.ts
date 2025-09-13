'use client';

/**
 * Cloud data service for Vercel hosting
 * Provides server-side backup for scheduling data
 */

export class CloudDataService {
  private static readonly API_BASE = '/api/data';
  
  /**
   * Generate a unique session ID for this browser/user
   */
  private static getSessionId(): string {
    let sessionId = localStorage.getItem('scheduling-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('scheduling-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Save data to cloud storage
   */
  static async saveToCloud(data: unknown): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const sessionId = this.getSessionId();
      
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sessionId,
          data: data
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Data saved to cloud:', result.message);
        return true;
      } else {
        console.warn('Failed to save to cloud:', response.statusText);
        return false;
      }
    } catch (error) {
      console.warn('Cloud save error:', error);
      return false;
    }
  }

  /**
   * Load data from cloud storage
   */
  static async loadFromCloud(): Promise<unknown | null> {
    if (typeof window === 'undefined') return null;

    try {
      const sessionId = this.getSessionId();
      
      const response = await fetch(`${this.API_BASE}?id=${encodeURIComponent(sessionId)}`);

      if (response.ok) {
        const result = await response.json();
        console.log('Data loaded from cloud:', result.timestamp);
        return result.data;
      } else if (response.status === 404) {
        // No data found, this is normal
        return null;
      } else {
        console.warn('Failed to load from cloud:', response.statusText);
        return null;
      }
    } catch (error) {
      console.warn('Cloud load error:', error);
      return null;
    }
  }

  /**
   * Delete data from cloud storage
   */
  static async deleteFromCloud(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const sessionId = this.getSessionId();
      
      const response = await fetch(`${this.API_BASE}?id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cloud data deleted:', result.message);
        return result.deleted;
      } else {
        console.warn('Failed to delete from cloud:', response.statusText);
        return false;
      }
    } catch (error) {
      console.warn('Cloud delete error:', error);
      return false;
    }
  }

  /**
   * Sync localStorage data to cloud
   */
  static async syncToCloud(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const exportData: Record<string, unknown> = {};
      const schedulingKeys = [
        'scheduling-results-v1',
        'scheduling-last-results-v1',
        'scheduling-state-v1',
        'calendarState',
        'theme',
        'result-folder-counter',
        'scheduling-session-id'
      ];

      // Collect data to sync
      schedulingKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            exportData[key] = JSON.parse(data);
          } catch {
            // Not JSON, store raw string (counters/ids)
            exportData[key] = data;
          }
        }
      });

      if (Object.keys(exportData).length === 0) {
        return true; // Nothing to sync
      }

      return await this.saveToCloud(exportData);
    } catch (error) {
      console.warn('Sync to cloud failed:', error);
      return false;
    }
  }

  /**
   * Restore data from cloud to localStorage
   */
  static async restoreFromCloud(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const cloudData = await this.loadFromCloud();
      if (!cloudData || typeof cloudData !== 'object') {
        return false;
      }

      const dataObject = cloudData as Record<string, unknown>;
      
      Object.entries(dataObject).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to restore ${key}:`, error);
          }
        }
      });

      console.log('Data restored from cloud');
      return true;
    } catch (error) {
      console.warn('Restore from cloud failed:', error);
      return false;
    }
  }
}