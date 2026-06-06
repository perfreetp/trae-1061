import Taro from '@tarojs/taro';

const STORAGE_KEYS = {
  USER: 'river_patrol_user',
  TASKS: 'river_patrol_tasks',
  PROBLEMS: 'river_patrol_problems',
  WATER_QUALITY: 'river_patrol_water_quality',
  NOTIFICATIONS: 'river_patrol_notifications',
  PATROL_RECORDS: 'river_patrol_records',
  OFFLINE_DATA: 'river_patrol_offline',
};

export const storage = {
  get(key: string) {
    try {
      const data = Taro.getStorageSync(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: any) {
    try {
      Taro.setStorageSync(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  remove(key: string) {
    try {
      Taro.removeStorageSync(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },
};

export const offlineStorage = {
  saveOfflineData(type: string, data: any) {
    const offlineData = storage.get(STORAGE_KEYS.OFFLINE_DATA) || {};
    if (!offlineData[type]) {
      offlineData[type] = [];
    }
    offlineData[type].push({
      ...data,
      offlineId: Date.now().toString(),
      savedAt: new Date().toISOString(),
    });
    storage.set(STORAGE_KEYS.OFFLINE_DATA, offlineData);
  },

  getOfflineData(type?: string) {
    const offlineData = storage.get(STORAGE_KEYS.OFFLINE_DATA) || {};
    if (type) {
      return offlineData[type] || [];
    }
    return offlineData;
  },

  clearOfflineData(type: string, offlineId: string) {
    const offlineData = storage.get(STORAGE_KEYS.OFFLINE_DATA) || {};
    if (offlineData[type]) {
      offlineData[type] = offlineData[type].filter(item => item.offlineId !== offlineId);
      storage.set(STORAGE_KEYS.OFFLINE_DATA, offlineData);
    }
  },
};

export default STORAGE_KEYS;
