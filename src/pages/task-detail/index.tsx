import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button, Textarea, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { Task } from '../../types'
import { mockTasks } from '../../utils/mock'
import './index.scss'

export default function TaskDetail() {
  const router = useRouter()
  const taskId = router.params.id
  const [task, setTask] = useState<Task | null>(null)
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [delayReason, setDelayReason] = useState('')
  const [delayDays, setDelayDays] = useState('1')

  useEffect(() => {
    const found = mockTasks.find(t => t.id === taskId)
    if (found) {
      setTask(found)
    }
  }, [taskId])

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pending: { label: '待开始', color: '#faad14' },
      inProgress: { label: '进行中', color: '#1677ff' },
      completed: { label: '已完成', color: '#52c41a' },
      delayed: { label: '已延期', color: '#722ed1' },
      overdue: { label: '已超期', color: '#ff4d4f' },
    }
    return configs[status] || configs.pending
  }

  const handleDelayApply = () => {
    if (!delayReason.trim()) {
      Taro.showToast({ title: '请填写延期原因', icon: 'none' })
      return
    }
    setShowDelayModal(false)
    Taro.showLoading({ title: '提交中...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '延期申请已提交', icon: 'success' })
    }, 1000)
  }

  if (!task) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const statusConfig = getStatusConfig(task.status)

  return (
    <ScrollView className='task-detail'>
      <View className='detail-header'>
        <View 
          className='status-tag'
          style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color }}
        >
          {statusConfig.label}
        </View>
        <Text className='task-title'>{task.title}</Text>
        <View className='task-meta'>
          <Text>📋 {task.type === 'routine' ? '日常巡查' : task.type === 'special' ? '专项检查' : '应急任务'}</Text>
        </View>
      </View>

      <View className='info-section'>
        <Text className='section-title'>基本信息</Text>
        <View className='info-row'>
          <Text className='info-label'>所属河道</Text>
          <Text className='info-value'>{task.riverName}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>河段范围</Text>
          <Text className='info-value'>{task.riverSection}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>计划里程</Text>
          <Text className='info-value'>{task.distance} km</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>开始时间</Text>
          <Text className='info-value'>{task.startTime}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>截止时间</Text>
          <Text className={`info-value ${task.status === 'overdue' ? 'text-error' : ''}`}>
            {task.endTime}
          </Text>
        </View>
      </View>

      <View className='info-section'>
        <Text className='section-title'>任务描述</Text>
        <Text className='description-text'>{task.description}</Text>
      </View>

      <View className='info-section'>
        <Text className='section-title'>打卡点 ({task.checkpoints.filter(c => c.checked).length}/{task.checkpoints.length})</Text>
        {task.checkpoints.map((cp, index) => (
          <View key={cp.id} className={`checkpoint-item ${cp.checked ? 'checked' : ''}`}>
            <View className='checkpoint-index'>{index + 1}</View>
            <View className='checkpoint-info'>
              <Text className='checkpoint-name'>{cp.name}</Text>
              <Text className='checkpoint-status'>
                {cp.checked ? `✓ 已打卡 ${cp.checkedAt}` : '未打卡'}
              </Text>
            </View>
            {cp.checked && <View className='check-icon'>✓</View>}
          </View>
        ))}
      </View>

      {task.delayApplied && (
        <View className='info-section delay-info'>
          <Text className='section-title'>延期申请</Text>
          <View className='info-row'>
            <Text className='info-label'>延期原因</Text>
            <Text className='info-value'>{task.delayReason}</Text>
          </View>
          <View className='info-row'>
            <Text className='info-label'>审批状态</Text>
            <Text className={`info-value ${task.delayApproved ? 'text-success' : 'text-warning'}`}>
              {task.delayApproved ? '已批准' : '审批中'}
            </Text>
          </View>
        </View>
      )}

      <View className='action-section'>
        {task.status === 'inProgress' && (
          <View className='action-row'>
            <Button 
              className='action-btn primary'
              onClick={() => Taro.navigateTo({ url: `/pages/map/index?taskId=${task.id}` })}
            >
              继续巡河
            </Button>
          </View>
        )}

        {task.status === 'pending' && (
          <View className='action-row'>
            <Button 
              className='action-btn primary'
              onClick={() => {
                Taro.showToast({ title: '任务已开始', icon: 'success' })
              }}
            >
              开始任务
            </Button>
          </View>
        )}

        {(task.status === 'inProgress' || task.status === 'pending') && !task.delayApplied && (
          <View className='action-row'>
            <Button 
              className='action-btn outline'
              onClick={() => setShowDelayModal(true)}
            >
              申请延期
            </Button>
          </View>
        )}

        {task.status === 'completed' && (
          <View className='action-row'>
            <Button className='action-btn disabled' disabled>
              任务已完成
            </Button>
          </View>
        )}
      </View>

      {showDelayModal && (
        <View className='modal-overlay'>
          <View className='delay-modal'>
            <Text className='modal-title'>申请延期</Text>
            
            <View className='form-item'>
              <Text className='form-label'>延期天数</Text>
              <Picker
                range={['1天', '2天', '3天', '5天', '7天']}
                onChange={(e) => setDelayDays((e.detail.value + 1).toString())}
              >
                <View className='picker-value'>{delayDays}天</View>
              </Picker>
            </View>

            <View className='form-item'>
              <Text className='form-label'>延期原因</Text>
              <Textarea
                className='form-textarea'
                placeholder='请详细说明延期原因...'
                value={delayReason}
                onInput={(e) => setDelayReason(e.detail.value)}
                maxlength={200}
              />
            </View>

            <View className='modal-actions'>
              <Button 
                className='modal-btn cancel'
                onClick={() => setShowDelayModal(false)}
              >
                取消
              </Button>
              <Button 
                className='modal-btn confirm'
                onClick={handleDelayApply}
              >
                提交申请
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
