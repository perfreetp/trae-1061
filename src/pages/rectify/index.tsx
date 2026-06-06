import { useState } from 'react'
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Problem } from '../../types'
import { problemTypeMap, statusMap } from '../../utils/mock'
import { problemStore } from '../../utils/store'
import './index.scss'

export default function Rectify() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useDidShow(() => {
    setProblems(problemStore.getAll())
  })

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'assigned', label: '已派单' },
    { key: 'rectifying', label: '整改中' },
    { key: 'completed', label: '待复查' },
    { key: 'verified', label: '已完成' },
  ]

  const filteredProblems = activeTab === 'all'
    ? problems
    : problems.filter(p => p.status === activeTab)

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { label: status, color: '#999' }
  }

  const getTypeInfo = (type: string) => {
    return problemTypeMap[type as keyof typeof problemTypeMap] || { label: type, color: '#999' }
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const goToDetail = (problem: Problem) => {
    Taro.navigateTo({
      url: `/pages/problem-detail/index?id=${problem.id}`,
    })
  }

  const handleAssign = (problem: Problem) => {
    Taro.showActionSheet({
      itemList: ['派单给李巡查', '派单给王保洁', '派单给赵执法'],
      success: (res) => {
        const names = ['李巡查', '王保洁', '赵执法']
        problemStore.assignProblem(problem.id, names[res.tapIndex])
        setProblems(problemStore.getAll())
        Taro.showToast({ title: '派单成功', icon: 'success' })
      },
    })
  }

  const handleVerify = (problem: Problem) => {
    Taro.showModal({
      title: '复查确认',
      content: '确认问题已整改合格？',
      success: (res) => {
        if (res.confirm) {
          problemStore.verifyProblem(problem.id)
          setProblems(problemStore.getAll())
          Taro.showToast({ title: '复查通过', icon: 'success' })
        }
      },
    })
  }

  return (
    <View className='rectify-page'>
      <View className='stats-bar'>
        <View className='stat-item'>
          <Text className='stat-number'>{problems.filter(p => p.status === 'pending').length}</Text>
          <Text className='stat-label'>待处理</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-number'>{problems.filter(p => p.status === 'rectifying' || p.status === 'assigned').length}</Text>
          <Text className='stat-label'>整改中</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-number warning'>{problems.filter(p => isOverdue(p.rectifyDeadline) && p.status !== 'verified').length}</Text>
          <Text className='stat-label'>超期</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-number success'>{problems.filter(p => p.status === 'verified').length}</Text>
          <Text className='stat-label'>已完成</Text>
        </View>
      </View>

      <ScrollView className='tabs-scroll' scrollX>
        <View className='tabs'>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView className='problem-list' scrollY>
        {filteredProblems.map(problem => {
          const typeInfo = getTypeInfo(problem.type)
          const statusInfo = getStatusInfo(problem.status)
          const overdue = isOverdue(problem.rectifyDeadline)
          return (
            <View key={problem.id} className='problem-card' onClick={() => goToDetail(problem)}>
              <View className='card-header'>
                <View 
                  className='problem-type'
                  style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                >
                  {typeInfo.label}
                </View>
                <View 
                  className={`problem-status ${overdue ? 'status-overdue' : ''}`}
                  style={{ backgroundColor: overdue ? '#ff4d4f15' : `${statusInfo.color}15`, color: overdue ? '#ff4d4f' : statusInfo.color }}
                >
                  {overdue ? '已超期' : statusInfo.label}
                </View>
              </View>

              <Text className='problem-desc'>{problem.description}</Text>

              {problem.images.length > 0 && (
                <View className='problem-images'>
                  {problem.images.slice(0, 3).map((img, idx) => (
                    <Image key={idx} src={img} className='thumb-image' mode='aspectFill' />
                  ))}
                </View>
              )}

              <View className='problem-meta'>
                <View className='meta-row'>
                  <Text className='meta-icon'>📍</Text>
                  <Text className='meta-text'>{problem.location}</Text>
                </View>
                <View className='meta-row'>
                  <Text className='meta-icon'>👤</Text>
                  <Text className='meta-text'>上报人：{problem.reporterName}</Text>
                </View>
                {problem.assigneeName && (
                  <View className='meta-row'>
                    <Text className='meta-icon'>👷</Text>
                    <Text className='meta-text'>负责人：{problem.assigneeName}</Text>
                  </View>
                )}
                {problem.rectifyDeadline && (
                  <View className='meta-row'>
                    <Text className='meta-icon'>⏰</Text>
                    <Text className={`meta-text ${overdue ? 'text-error' : ''}`}>
                      截止：{problem.rectifyDeadline}
                    </Text>
                  </View>
                )}
              </View>

              <View className='card-footer'>
                <Text className='report-time'>{problem.createdAt}</Text>
                <View className='action-btns'>
                  {problem.status === 'pending' && (
                    <Button
                      className='action-btn assign'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssign(problem)
                      }}
                    >
                      派单
                    </Button>
                  )}
                  {problem.status === 'completed' && (
                    <Button
                      className='action-btn verify'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVerify(problem)
                      }}
                    >
                      复查
                    </Button>
                  )}
                  <Button
                    className='action-btn detail'
                    onClick={(e) => {
                      e.stopPropagation()
                      goToDetail(problem)
                    }}
                  >
                    详情
                  </Button>
                </View>
              </View>
            </View>
          )
        })}

        {filteredProblems.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>暂无问题记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
