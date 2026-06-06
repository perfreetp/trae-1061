import Taro from '@tarojs/taro';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    Taro.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: (error) => {
        console.error('获取位置失败:', error);
        reject(error);
      },
    });
  });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 1000) / 1000;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

export const calculateTotalDistance = (
  points: { latitude: number; longitude: number }[]
): number => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return Math.round(total * 100) / 100;
};

export const openLocation = (latitude: number, longitude: number, name?: string) => {
  Taro.openLocation({
    latitude,
    longitude,
    name: name || '位置',
    scale: 18,
  });
};

export const checkInRadius = (
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radius: number = 50
): boolean => {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon) * 1000;
  return distance <= radius;
};
