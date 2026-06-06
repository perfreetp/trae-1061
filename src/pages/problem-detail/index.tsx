import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button, Image, Textarea } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import type { Problem } from '../../types'
import { problemTypeMap, statusMap } from '../../utils/mock'
import { previewImage, chooseImage } from '../../utils/media'
import { openLocation } from '../../utils/location'
import { problemStore } from '../../utils/store'
import './index.scss'

export default function ProblemDetail() {
  const router = useRouter()
  const problemId = router.params.id
  const [problem, setProblem] = useState<Problem | null>(null)
  const [showRectifyModal, setShowRectifyModal] = useState(false)
  const [rectifyDesc, setRectifyDesc] = useState('')
  const [rectifyImages, setRectifyImages] = useState<string[]>([])

  const loadData = () => {
    const found = problemStore.getById(problemId!)
    if (found) {
      setProblem(found)
    }
  }

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [problemId])

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const handleChooseRectifyImage = async () => {
    try {
      const res = await chooseImage(3 - rectifyImages.length)
      setRectifyImages(prev => [...prev, ...res])
    } catch (e) {
      console.error(e)
    }
  }

  const handleRectifySubmit = () => {
    if (!rectifyDesc.trim()) {
      Taro.showToast({ title: '请填写整改说明', icon: 'none' })
      return
    }
    if (rectifyImages.length === 0) {
      Taro.showToast({ title: '请上传整改照片', icon: 'none' })
      return
    }
    setShowRectifyModal(false)
    Taro.showLoading({ title: '提交中...' })
    setTimeout(() => {
      Taro.hideLoading()
      if (problem) {
        problemStore.submitRectify(problem.id, rectifyDesc, rectifyImages)
        loadData()
      }
      Taro.showToast({ title: '整改已提交', icon: 'success' })
    }, 1000)
  }

  const handleAssign = () => {
    Taro.showActionSheet({
      itemList: ['派单给李巡查', '派单给王保洁', '派单给赵执法'],
      success: (res) => {
        const names = ['李巡查', '王保洁', '赵执法']
        problemStore.assignProblem(problem!.id, names[res.tapIndex])
        loadData()
        Taro.showToast({ title: '派单成功', icon: 'success' })
      },
    })
  }

  const handleVerify = () => {
    Taro.showModal({
      title: '复查确认',
      content: '确认问题已整改合格？',
      success: (res) => {
        if (res.confirm && problem) {
          problemStore.verifyProblem(problem.id)
          loadData()
          Taro.showToast({ title: '复查通过', icon: 'success' })
        }
      },
    })
  }

  if (!problem) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const typeInfo = problemTypeMap[problem.type]
  const statusInfo = statusMap[problem.status]
  const overdue = isOverdue(problem.rectifyDeadline)

  return (
    <ScrollView className='problem-detail'>
      <View className='detail-header'>
        <View 
          className='type-tag'
          style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
        >
          {typeInfo.label}
        </View>
        <View 
          className={`status-tag ${overdue ? 'status-overdue' : ''}`}
          style={{ backgroundColor: overdue ? '#ff4d4f15' : `${statusInfo.color}15`, color: overdue ? '#ff4d4f' : statusInfo.color }}
        >
          {overdue ? '已超期' : statusInfo.label}
        </View>
      </View>

      <View className='info-section'>
        <Text className='section-title'>问题描述</Text>
        <Text className='description-text'>{problem.description}</Text>
        
        {problem.images.length > 0 && (
          <View className='image-list'>
            {problem.images.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                className='problem-image'
                mode='aspectFill'
                onClick={() => previewImage(problem.images, idx)}
              />
            ))}
          </View>
        )}
      </View>

      {problem.type === 'outlet' && (problem.outletType || problem.outletStatus) && (
        <View className='info-section'>
          <Text className='section-title'>排口信息</Text>
          {problem.outletType && (
            <View className='info-row'>
              <Text className='info-label'>排口类型</Text>
              <Text className='info-value'>{problem.outletType}</Text>
            </View>
          )}
          {problem.outletStatus && (
            <View className='info-row'>
              <Text className='info-label'>异常情况</Text>
              <Text className='info-value'>{problem.outletStatus === 'normal' ? '正常排水' : '异常排水'}</Text>
            </View>
          )}
        </View>
      )}

      {problem.type === 'construction' && (problem.constructionProject || problem.constructionHasApproval) && (
        <View className='info-section'>
          <Text className='section-title'>施工信息</Text>
          {problem.constructionProject && (
            <View className='info-row'>
              <Text className='info-label'>项目名称</Text>
              <Text className='info-value'>{problem.constructionProject}</Text>
            </View>
          )}
          {problem.constructionHasApproval && (
            <View className='info-row'>
              <Text className='info-label'>审批情况</Text>
              <Text className='info-value'>{problem.constructionHasApproval === 'yes' ? '有审批' : '无审批'}</Text>
            </View>
          )}
        </View>
      )}

      {problem.videos && problem.videos.length > 0 && (
        <View className='info-section'>
          <Text className='section-title'>视频证据</Text>
          <View className='video-preview'>
            <View className='video-thumbnail'>
              <Text className='play-icon'>▶️</Text>
            </View>
            <Text className='video-name'>视频文件</Text>
          </View>
        </View>
      )}

      {problem.voiceNote && (
        <View className='info-section'>
          <Text className='section-title'>语音备注</Text>
          <View className='voice-player'>
            <Text className='play-icon'>▶️</Text>
            <Text className='voice-text'>点击播放语音备注</Text>
          </View>
        </View>
      )}

      <View className='info-section'>
        <Text className='section-title'>位置信息</Text>
        <View 
          className='location-card'
          onClick={() => openLocation(problem.latitude, problem.longitude, problem.location)}
        >
          <View className='location-icon'>📍</View>
          <View className='location-info'>
            <Text className='location-text'>{problem.location}</Text>
            <Text className='location-coord'>
              {problem.latitude.toFixed(6)}, {problem.longitude.toFixed(6)}
            </Text>
          </View>
          <Text className='location-nav'>导航 →</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>所属河道</Text>
          <Text className='info-value'>{problem.riverName}</Text>
        </View>
      </View>

      <View className='info-section'>
        <Text className='section-title'>上报信息</Text>
        <View className='info-row'>
          <Text className='info-label'>上报人</Text>
          <Text className='info-value'>{problem.reporterName}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>上报时间</Text>
          <Text className='info-value'>{problem.createdAt}</Text>
        </View>
        {problem.category && (
          <View className='info-row'>
            <Text className='info-label'>问题分类</Text>
            <Text className='info-value'>{problem.category}</Text>
          </View>
        )}
      </View>

      {problem.assigneeName && (
        <View className='info-section'>
          <Text className='section-title'>整改信息</Text>
          <View className='info-row'>
            <Text className='info-label'>负责人</Text>
            <Text className='info-value'>{problem.assigneeName}</Text>
          </View>
          {problem.rectifyDeadline && (
            <View className='info-row'>
              <Text className='info-label'>整改期限</Text>
              <Text className={`info-value ${overdue ? 'text-error' : ''}`}>
                {problem.rectifyDeadline}
              </Text>
            </View>
          )}
        </View>
      )}

      {problem.rectifyDescription && (
        <View className='info-section rectify-section'>
          <Text className='section-title'>整改情况</Text>
          <Text className='description-text'>{problem.rectifyDescription}</Text>
          {problem.rectifyImages && problem.rectifyImages.length > 0 && (
            <View className='image-list'>
              {problem.rectifyImages.map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  className='problem-image'
                  mode='aspectFill'
                  onClick={() => previewImage(problem.rectifyImages!, idx)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {problem.verifiedAt && (
        <View className='info-section verified-section'>
          <Text className='section-title'>复查信息</Text>
          <View className='info-row'>
            <Text className='info-label'>复查时间</Text>
            <Text className='info-value'>{problem.verifiedAt}</Text>
          </View>
        </View>
      )}

      <View className='action-section'>
        {problem.status === 'pending' && (
          <View className='action-row'>
            <Button 
              className='action-btn primary'
              onClick={handleAssign}
            >
              派发整改
            </Button>
          </View>
        )}

        {(problem.status === 'assigned' || problem.status === 'rectifying') && (
          <View className='action-row'>
            <Button 
              className='action-btn primary'
              onClick={() => setShowRectifyModal(true)}
            >
              提交整改
            </Button>
          </View>
        )}

        {problem.status === 'completed' && (
          <View className='action-row'>
            <Button 
              className='action-btn success'
              onClick={handleVerify}
            >
              复查确认
            </Button>
          </View>
        )}

        {problem.status === 'verified' && (
          <View className='action-row'>
            <Button className='action-btn disabled' disabled>
              已完成
            </Button>
          </View>
        )}
      </View>

      {showRectifyModal && (
        <View className='modal-overlay'>
          <View className='rectify-modal'>
            <Text className='modal-title'>提交整改</Text>
            
            <View className='form-item'>
              <Text className='form-label'>整改说明</Text>
              <Textarea
                className='form-textarea'
                placeholder='请详细说明整改情况...'
                value={rectifyDesc}
                onInput={(e) => setRectifyDesc(e.detail.value)}
                maxlength={300}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>整改照片</Text>
              <View className='image-grid'>
                {rectifyImages.map((img, idx) => (
                  <Image key={idx} src={img} className='form-image' mode='aspectFill' />
                ))}
                {rectifyImages.length < 3 && (
                  <View className='image-add' onClick={handleChooseRectifyImage}>
                    <Text className='add-icon'>+</Text>
                    <Text className='add-text'>添加照片</Text>
                  </View>
                )}
              </View>
            </View>

            <View className='modal-actions'>
              <Button 
                className='modal-btn cancel'
                onClick={() => setShowRectifyModal(false)}
              >
                取消
              </Button>
              <Button 
                className='modal-btn confirm'
                onClick={handleRectifySubmit}
              >
                提交
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
