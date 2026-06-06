import { useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Notification } from '../../types'
import { mockNotifications } from '../../utils/mock'
import './index.scss'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useDidShow(() => {
    setNotifications(mockNotifications)
  })

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'task', label: '任务通知' },
    { key: 'problem', label: '问题通知' },
    { key: 'urgent', label: '紧急通知' },
    { key: 'system', label: '系统通知' },
  ]

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeTab)

  const unreadCount = notifications.filter(n => !n.read).length

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; label: string; color: string }> = {
      task: { icon: '📋', label: '任务通知', color: '#1677ff' },
      problem: { icon: '⚠️', label: '问题通知', color: '#faad14' },
      urgent: { icon: '🚨', label: '紧急通知', color: '#ff4d4f' },
      system: { icon: '🔔', label: '系统通知', color: '#722ed1' },
    }
    return configs[type] || configs.system
  }

  const handleRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    Taro.showToast({ title: '已全部标为已读', icon: 'success' })
  }

  const handleNotificationClick = (notification: Notification) => {
    handleRead(notification.id)
    if (notification.relatedId) {
      if (notification.type === 'task') {
        Taro.navigateTo({ url: `/pages/task-detail/index?id=${notification.relatedId}` })
      } else if (notification.type === 'problem') {
        Taro.navigateTo({ url: `/pages/problem-detail/index?id=${notification.relatedId}` })
      }
    }
  }

  return (
    <View className='notifications-page'>
      <View className='header'>
        <View className='header-info'>
          <Text className='header-title'>通知中心</Text>
          {unreadCount > 0 && (
            <View className='unread-badge'>{unreadCount}条未读</View>
          )}
        </View>
        {unreadCount > 0 && (
          <Text className='mark-all' onClick={handleMarkAllRead}>
            全部已读
          </Text>
        )}
      </View>

      <ScrollView className='tabs-scroll' scrollX>
        <View className='tabs'>
          {tabs.map(tab => {
            const count = tab.key === 'all' 
              ? notifications.length 
              : notifications.filter(n => n.type === tab.key).length
            return (
              <View
                key={tab.key}
                className={`tab-item ${activeTab === tab.key ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text>{tab.label}</Text>
                {count > 0 && <Text className='tab-count'>{count}</Text>}
              </View>
            )
          })}
        </View>
      </ScrollView>

      <ScrollView className='notification-list' scrollY>
        {filteredNotifications.map(notification => {
          const typeConfig = getTypeConfig(notification.type)
          return (
            <View
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <View 
                className='notification-icon'
                style={{ backgroundColor: `${typeConfig.color}15` }}
              >
                <Text>{typeConfig.icon}</Text>
              </View>
              <View className='notification-content'>
                <View className='notification-header'>
                  <Text className='notification-title'>{notification.title}</Text>
                  {!notification.read && <View className='read-dot' />}
                </View>
                <Text className='notification-text'>{notification.content}</Text>
                <Text className='notification-time'>{notification.createdAt}</Text>
              </View>
            </View>
          )
        })}

        {filteredNotifications.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-icon'>🔔</Text>
            <Text className='empty-text'>暂无通知</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
