import { useState, useEffect, useRef } from 'react'
import { View, Text, Button, Map } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { Checkpoint } from '../../types'
import { getCurrentLocation, checkInRadius, calculateTotalDistance, openLocation } from '../../utils/location'
import { mockTasks } from '../../utils/mock'
import './index.scss'

export default function PatrolMap() {
  const router = useRouter()
  const taskId = router.params.taskId
  const [currentLocation, setCurrentLocation] = useState({ latitude: 31.2304, longitude: 121.4737 })
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([])
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [patrolling, setPatrolling] = useState(false)
  const [startTime, setStartTime] = useState<string>('')
  const [distance, setDistance] = useState(0)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [nearbyCheckpoint, setNearbyCheckpoint] = useState<Checkpoint | null>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (taskId) {
      const task = mockTasks.find(t => t.id === taskId)
      if (task) {
        setCheckpoints(task.checkpoints)
      }
    }
    initLocation()
  }, [taskId])

  const initLocation = async () => {
    try {
      const loc = await getCurrentLocation()
      setCurrentLocation(loc)
    } catch (e) {
      console.error('获取位置失败', e)
    }
  }

  const startPatrol = () => {
    setPatrolling(true)
    setStartTime(new Date().toLocaleString())
    setRoutePoints([currentLocation])
    Taro.showToast({ title: '开始巡河', icon: 'success' })
  }

  const endPatrol = () => {
    Taro.showModal({
      title: '确认结束',
      content: '确定要结束本次巡河吗？',
      success: (res) => {
        if (res.confirm) {
          setPatrolling(false)
          Taro.showToast({ title: '巡河结束', icon: 'success' })
        }
      },
    })
  }

  const handleLocationChange = (e) => {
    if (!patrolling) return
    const { latitude, longitude } = e.detail
    const newPoint = { latitude, longitude }
    setCurrentLocation(newPoint)
    setRoutePoints(prev => {
      const updated = [...prev, newPoint]
      setDistance(calculateTotalDistance(updated))
      return updated
    })
    checkNearbyCheckpoint(latitude, longitude)
  }

  const checkNearbyCheckpoint = (lat, lon) => {
    const unchecked = checkpoints.filter(c => !c.checked)
    for (const cp of unchecked) {
      if (checkInRadius(lat, lon, cp.latitude, cp.longitude, 50)) {
        setNearbyCheckpoint(cp)
        setShowCheckinModal(true)
        break
      }
    }
  }

  const handleCheckin = () => {
    if (!nearbyCheckpoint) return
    setCheckpoints(prev => prev.map(cp => 
      cp.id === nearbyCheckpoint.id 
        ? { ...cp, checked: true, checkedAt: new Date().toLocaleString() }
        : cp
    ))
    setShowCheckinModal(false)
    Taro.vibrateShort()
    Taro.showToast({ title: '打卡成功', icon: 'success' })
  }

  const goToReport = () => {
    Taro.navigateTo({
      url: `/pages/report/index?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}`,
    })
  }

  const markers = [
    ...checkpoints.map(cp => ({
      id: cp.id,
      latitude: cp.latitude,
      longitude: cp.longitude,
      iconPath: cp.checked 
        ? 'https://img.icons8.com/color/48/checked--v1.png'
        : 'https://img.icons8.com/color/48/map-pin.png',
      width: 32,
      height: 32,
      callout: {
        content: cp.name + (cp.checked ? '✓' : ''),
        color: cp.checked ? '#52c41a' : '#1677ff',
        fontSize: 12,
        borderRadius: 8,
        bgColor: '#fff',
        padding: 8,
        display: 'ALWAYS',
      },
    })),
  ]

  const polyline = routePoints.length > 1 ? [{
    points: routePoints,
    color: '#1677ff',
    width: 4,
  }] : []

  return (
    <View className='map-page'>
      <Map
        id='patrolMap'
        ref={mapRef}
        className='map-container'
        latitude={currentLocation.latitude}
        longitude={currentLocation.longitude}
        scale={15}
        showLocation
        markers={markers}
        polyline={polyline}
        onLocationChange={handleLocationChange}
      />

      <View className='info-panel'>
        <View className='info-row'>
          <View className='info-item'>
            <Text className='info-label'>巡河里程</Text>
            <Text className='info-value'>{distance.toFixed(2)} km</Text>
          </View>
          <View className='info-item'>
            <Text className='info-label'>打卡点</Text>
            <Text className='info-value'>
              {checkpoints.filter(c => c.checked).length}/{checkpoints.length}
            </Text>
          </View>
          <View className='info-item'>
            <Text className='info-label'>用时</Text>
            <Text className='info-value'>
              {startTime ? (Date.now() - new Date(startTime).getTime()) / 1000 / 60 | 0 : 0} min
            </Text>
          </View>
        </View>
      </View>

      <View className='action-panel'>
        {!patrolling ? (
          <Button className='action-btn start-btn' onClick={startPatrol}>
            开始巡河
          </Button>
        ) : (
          <View className='action-row'>
            <Button className='action-btn report-btn' onClick={goToReport}>
              📝 上报问题
            </Button>
            <Button className='action-btn end-btn' onClick={endPatrol}>
              结束巡河
            </Button>
          </View>
        )}
      </View>

      {checkpoints.length > 0 && (
        <View className='checkpoints-panel'>
          <Text className='panel-title'>打卡点列表</Text>
          {checkpoints.map(cp => (
            <View key={cp.id} className={`checkpoint-item ${cp.checked ? 'checked' : ''}`}>
              <View className='checkpoint-icon'>
                {cp.checked ? '✅' : '📍'}
              </View>
              <View className='checkpoint-info'>
                <Text className='checkpoint-name'>{cp.name}</Text>
                <Text className='checkpoint-time'>
                  {cp.checked ? cp.checkedAt : '未打卡'}
                </Text>
              </View>
              {!cp.checked && (
                <Text 
                  className='checkpoint-nav'
                  onClick={() => openLocation(cp.latitude, cp.longitude, cp.name)}
                >
                  导航
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {showCheckinModal && (
        <View className='modal-overlay'>
          <View className='checkin-modal'>
            <Text className='modal-title'>📍 到达打卡点</Text>
            <Text className='modal-name'>{nearbyCheckpoint?.name}</Text>
            <View className='modal-actions'>
              <Button className='modal-btn cancel' onClick={() => setShowCheckinModal(false)}>
                取消
              </Button>
              <Button className='modal-btn confirm' onClick={handleCheckin}>
                确认打卡
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
