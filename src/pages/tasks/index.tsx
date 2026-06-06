import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Task } from '../../types'
import { mockTasks } from '../../utils/mock'
import './index.scss'

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    loadTasks()
  }, [])

  useDidShow(() => {
    loadTasks()
  })

  const loadTasks = () => {
    setTasks(mockTasks)
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; className: string }> = {
      pending: { label: '待开始', color: '#faad14', className: 'status-pending' },
      inProgress: { label: '进行中', color: '#1677ff', className: 'status-inprogress' },
      completed: { label: '已完成', color: '#52c41a', className: 'status-completed' },
      delayed: { label: '已延期', color: '#722ed1', className: 'status-delayed' },
      overdue: { label: '已超期', color: '#ff4d4f', className: 'status-overdue' },
    }
    return configs[status] || configs.pending
  }

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { label: string; icon: string }> = {
      routine: { label: '日常巡查', icon: '🔄' },
      special: { label: '专项检查', icon: '📋' },
      emergency: { label: '应急任务', icon: '🚨' },
    }
    return configs[type] || configs.routine
  }

  const filteredTasks = activeTab === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === activeTab)

  const goToDetail = (task: Task) => {
    Taro.navigateTo({
      url: `/pages/task-detail/index?id=${task.id}`,
    })
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待开始' },
    { key: 'inProgress', label: '进行中' },
    { key: 'overdue', label: '已超期' },
  ]

  return (
    <View className='tasks-page'>
      <View className='header'>
        <View className='header-info'>
          <Text className='header-title'>我的任务</Text>
          <Text className='header-count'>共 {tasks.length} 个任务</Text>
        </View>
        <View 
          className='header-action'
          onClick={() => Taro.navigateTo({ url: '/pages/water-quality/index' })}
        >
          <Text className='action-icon'>💧</Text>
          <Text className='action-text'>水质记录</Text>
        </View>
      </View>

      <View className='tabs'>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
            {activeTab === tab.key && <View className='tab-indicator' />}
          </View>
        ))}
      </View>

      <ScrollView className='task-list' scrollY>
        {filteredTasks.map(task => {
          const statusConfig = getStatusConfig(task.status)
          const typeConfig = getTypeConfig(task.type)
          return (
            <View 
              key={task.id} 
              className='task-card'
              onClick={() => goToDetail(task)}
            >
              <View className='task-header'>
                <View className='task-type'>
                  <Text className='type-icon'>{typeConfig.icon}</Text>
                  <Text className='type-text'>{typeConfig.label}</Text>
                </View>
                <View className={`task-status ${statusConfig.className}`}>
                  <Text>{statusConfig.label}</Text>
                </View>
              </View>
              
              <Text className='task-title'>{task.title}</Text>
              <Text className='task-desc'>{task.description}</Text>
              
              <View className='task-meta'>
                <View className='meta-item'>
                  <Text className='meta-icon'>📍</Text>
                  <Text className='meta-text'>{task.riverSection}</Text>
                </View>
                <View className='meta-item'>
                  <Text className='meta-icon'>📏</Text>
                  <Text className='meta-text'>{task.distance} km</Text>
                </View>
                <View className='meta-item'>
                  <Text className='meta-icon'>✅</Text>
                  <Text className='meta-text'>
                    {task.checkpoints.filter(c => c.checked).length}/{task.checkpoints.length} 打卡点
                  </Text>
                </View>
              </View>

              <View className='task-time'>
                <Text className='time-label'>截止时间：</Text>
                <Text className={`time-value ${task.status === 'overdue' ? 'time-overdue' : ''}`}>
                  {task.endTime}
                </Text>
              </View>

              {task.status === 'inProgress' && (
                <View className='task-actions'>
                  <Button 
                    className='action-btn primary'
                    onClick={(e) => {
                      e.stopPropagation()
                      Taro.navigateTo({ 
                        url: `/pages/map/index?taskId=${task.id}` 
                      })
                    }}
                  >
                    开始巡河
                  </Button>
                  <Button 
                    className='action-btn outline'
                    onClick={(e) => {
                      e.stopPropagation()
                      Taro.navigateTo({ url: `/pages/task-detail/index?id=${task.id}` })
                    }}
                  >
                    查看详情
                  </Button>
                </View>
              )}

              {task.status === 'pending' && (
                <View className='task-actions'>
                  <Button 
                    className='action-btn primary'
                    onClick={(e) => {
                      e.stopPropagation()
                      const updated = tasks.map(t => 
                        t.id === task.id ? { ...t, status: 'inProgress' as const } : t
                      )
                      setTasks(updated)
                      Taro.showToast({ title: '任务已开始', icon: 'success' })
                    }}
                  >
                    开始任务
                  </Button>
                </View>
              )}
            </View>
          )
        })}

        {filteredTasks.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-icon'>📭</Text>
            <Text className='empty-text'>暂无任务</Text>
          </View>
        )}
      </ScrollView>

      <View className='quick-actions'>
        <View 
          className='quick-btn'
          onClick={() => Taro.navigateTo({ url: '/pages/report/index' })}
        >
          <Text className='quick-icon'>📝</Text>
          <Text className='quick-text'>快速上报</Text>
        </View>
        <View 
          className='quick-btn'
          onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}
        >
          <Text className='quick-icon'>🔔</Text>
          <Text className='quick-text'>通知中心</Text>
        </View>
      </View>
    </View>
  )
}
