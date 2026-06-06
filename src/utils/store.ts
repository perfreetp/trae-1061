import Taro from '@tarojs/taro';
import type { Problem, Task, Notification, WaterQualityRecord } from '../types';
import { mockProblems, mockTasks, mockNotifications, mockWaterQualityRecords } from './mock';

const STORAGE_KEYS = {
  PROBLEMS: 'store_problems',
  TASKS: 'store_tasks',
  NOTIFICATIONS: 'store_notifications',
  WATER_QUALITY: 'store_water_quality',
};

const initStore = () => {
  if (!Taro.getStorageSync(STORAGE_KEYS.PROBLEMS)) {
    Taro.setStorageSync(STORAGE_KEYS.PROBLEMS, JSON.stringify(mockProblems));
  }
  if (!Taro.getStorageSync(STORAGE_KEYS.TASKS)) {
    Taro.setStorageSync(STORAGE_KEYS.TASKS, JSON.stringify(mockTasks));
  }
  if (!Taro.getStorageSync(STORAGE_KEYS.NOTIFICATIONS)) {
    Taro.setStorageSync(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
  }
  if (!Taro.getStorageSync(STORAGE_KEYS.WATER_QUALITY)) {
    Taro.setStorageSync(STORAGE_KEYS.WATER_QUALITY, JSON.stringify(mockWaterQualityRecords));
  }
};

initStore();

export const problemStore = {
  getAll(): Problem[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.PROBLEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getById(id: string): Problem | undefined {
    return this.getAll().find(p => p.id === id);
  },

  add(problem: Omit<Problem, 'id' | 'createdAt'>): Problem {
    const problems = this.getAll();
    const newProblem: Problem = {
      ...problem,
      id: 'prob_' + Date.now(),
      createdAt: new Date().toLocaleString(),
    };
    problems.unshift(newProblem);
    Taro.setStorageSync(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
    return newProblem;
  },

  update(id: string, updates: Partial<Problem>): Problem | null {
    const problems = this.getAll();
    const index = problems.findIndex(p => p.id === id);
    if (index === -1) return null;
    problems[index] = { ...problems[index], ...updates };
    Taro.setStorageSync(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
    return problems[index];
  },

  assignProblem(id: string, assigneeName: string): Problem | null {
    return this.update(id, {
      status: 'assigned',
      assigneeName,
      assigneeId: 'user_' + assigneeName,
    });
  },

  submitRectify(id: string, description: string, images: string[]): Problem | null {
    return this.update(id, {
      status: 'completed',
      rectifyDescription: description,
      rectifyImages: images,
    });
  },

  verifyProblem(id: string): Problem | null {
    return this.update(id, {
      status: 'verified',
      verifiedAt: new Date().toLocaleString(),
    });
  },
};

export const taskStore = {
  getAll(): Task[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getById(id: string): Task | undefined {
    return this.getAll().find(t => t.id === id);
  },

  update(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates };
    Taro.setStorageSync(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return tasks[index];
  },

  startTask(id: string): Task | null {
    return this.update(id, { status: 'inProgress' });
  },

  checkCheckpoint(taskId: string, checkpointId: string): Task | null {
    const task = this.getById(taskId);
    if (!task) return null;
    const checkpoints = task.checkpoints.map(cp =>
      cp.id === checkpointId
        ? { ...cp, checked: true, checkedAt: new Date().toLocaleString() }
        : cp
    );
    return this.update(taskId, { checkpoints });
  },
};

export const notificationStore = {
  getAll(): Notification[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  markAsRead(id: string): Notification | null {
    const notifications = this.getAll();
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    notifications[index] = { ...notifications[index], read: true };
    Taro.setStorageSync(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return notifications[index];
  },

  markAllAsRead(): void {
    const notifications = this.getAll().map(n => ({ ...n, read: true }));
    Taro.setStorageSync(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  getUnreadCount(): number {
    return this.getAll().filter(n => !n.read).length;
  },

  add(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
    const notifications = this.getAll();
    const newNotification: Notification = {
      ...notification,
      id: 'notif_' + Date.now(),
      createdAt: new Date().toLocaleString(),
      read: false,
    };
    notifications.unshift(newNotification);
    Taro.setStorageSync(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return newNotification;
  },
};

export const waterQualityStore = {
  getAll(): WaterQualityRecord[] {
    try {
      const data = Taro.getStorageSync(STORAGE_KEYS.WATER_QUALITY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  add(record: Omit<WaterQualityRecord, 'id' | 'createdAt'>): WaterQualityRecord {
    const records = this.getAll();
    const newRecord: WaterQualityRecord = {
      ...record,
      id: 'wq_' + Date.now(),
      createdAt: new Date().toLocaleString(),
    };
    records.unshift(newRecord);
    Taro.setStorageSync(STORAGE_KEYS.WATER_QUALITY, JSON.stringify(records));
    return newRecord;
  },
};
