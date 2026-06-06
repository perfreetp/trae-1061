import { useState, useEffect } from 'react'
import { View, Text, Textarea, Button, Image, ScrollView, Picker, Radio } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { ProblemType } from '../../types'
import { chooseImage, chooseVideo, startRecording, stopRecording, previewImage } from '../../utils/media'
import { getCurrentLocation } from '../../utils/location'
import { problemTypeMap, garbageCategories, mockUser } from '../../utils/mock'
import { offlineStorage } from '../../utils/storage'
import './index.scss'

export default function Report() {
  const router = useRouter()
  const [problemType, setProblemType] = useState<ProblemType>('garbage')
  const [garbageCategory, setGarbageCategory] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [video, setVideo] = useState('')
  const [voiceNote, setVoiceNote] = useState('')
  const [recording, setRecording] = useState(false)
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, address: '' })
  const [locationText, setLocationText] = useState('正在定位...')
  const [riverName, setRiverName] = useState('清水河')
  const [showOfflineSave, setShowOfflineSave] = useState(false)

  useEffect(() => {
    initLocation()
  }, [])

  const initLocation = async () => {
    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setLocationText(`已定位 (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`)
    } catch (e) {
      setLocationText('定位失败，请手动输入位置')
    }
  }

  const handleChooseImage = async () => {
    try {
      const res = await chooseImage(9 - images.length)
      setImages(prev => [...prev, ...res])
    } catch (e) {
      console.error('选择图片失败', e)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleChooseVideo = async () => {
    try {
      const res = await chooseVideo()
      setVideo(res)
    } catch (e) {
      console.error('选择视频失败', e)
    }
  }

  const handleRecord = async () => {
    if (recording) {
      try {
        const filePath = await stopRecording()
        setVoiceNote(filePath)
        setRecording(false)
        Taro.showToast({ title: '录音完成', icon: 'success' })
      } catch (e) {
        setRecording(false)
        Taro.showToast({ title: '录音失败', icon: 'error' })
      }
    } else {
      try {
        await startRecording()
        setRecording(true)
      } catch (e) {
        Taro.showToast({ title: '启动录音失败', icon: 'error' })
      }
    }
  }

  const handlePreviewImage = (index: number) => {
    previewImage(images, index)
  }

  const validateForm = (): boolean => {
    if (!description.trim()) {
      Taro.showToast({ title: '请填写问题描述', icon: 'none' })
      return false
    }
    if (images.length === 0 && !video) {
      Taro.showToast({ title: '请至少上传一张图片或视频', icon: 'none' })
      return false
    }
    if (location.latitude === 0) {
      Taro.showToast({ title: '请获取定位信息', icon: 'none' })
      return false
    }
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    Taro.showLoading({ title: '提交中...' })

    const problemData = {
      type: problemType,
      category: problemType === 'garbage' ? garbageCategory : undefined,
      description,
      images,
      video,
      voiceNote,
      latitude: location.latitude,
      longitude: location.longitude,
      location: locationText,
      riverName,
      reporterId: mockUser.id,
      reporterName: mockUser.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setTimeout(() => {
      Taro.hideLoading()
      Taro.showModal({
        title: '提交成功',
        content: '问题已成功上报，我们会尽快处理',
        showCancel: false,
        success: () => {
          resetForm()
          Taro.switchTab({ url: '/pages/tasks/index' })
        },
      })
    }, 1500)
  }

  const handleOfflineSave = () => {
    if (!validateForm()) return

    const problemData = {
      type: problemType,
      category: problemType === 'garbage' ? garbageCategory : undefined,
      description,
      images,
      video,
      voiceNote,
      latitude: location.latitude,
      longitude: location.longitude,
      location: locationText,
      riverName,
      reporterId: mockUser.id,
      reporterName: mockUser.name,
      isOffline: true,
    }

    offlineStorage.saveOfflineData('problems', problemData)
    Taro.showToast({ title: '已保存到离线', icon: 'success' })
    resetForm()
  }

  const resetForm = () => {
    setProblemType('garbage')
    setGarbageCategory('')
    setDescription('')
    setImages([])
    setVideo('')
    setVoiceNote('')
    setRecording(false)
  }

  const problemTypes: { key: ProblemType; icon: string }[] = [
    { key: 'garbage', icon: '🗑️' },
    { key: 'float', icon: '🌊' },
    { key: 'outlet', icon: '🚰' },
    { key: 'construction', icon: '🏗️' },
    { key: 'sewage', icon: '💧' },
    { key: 'illegal', icon: '🚫' },
    { key: 'other', icon: '📋' },
  ]

  return (
    <ScrollView className='report-page' scrollY>
      <View className='section'>
        <Text className='section-title'>问题类型</Text>
        <View className='type-grid'>
          {problemTypes.map(item => (
            <View
              key={item.key}
              className={`type-item ${problemType === item.key ? 'type-active' : ''}`}
              onClick={() => setProblemType(item.key)}
            >
              <Text className='type-icon'>{item.icon}</Text>
              <Text className='type-label'>{problemTypeMap[item.key].label}</Text>
            </View>
          ))}
        </View>
      </View>

      {problemType === 'garbage' && (
        <View className='section'>
          <Text className='section-title'>垃圾类型分类</Text>
          <View className='category-grid'>
            {garbageCategories.map(cat => (
              <View
                key={cat.id}
                className={`category-item ${garbageCategory === cat.name ? 'category-active' : ''}`}
                onClick={() => setGarbageCategory(cat.name)}
              >
                <Text className='category-icon'>{cat.icon}</Text>
                <Text className='category-label'>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {problemType === 'outlet' && (
        <View className='section'>
          <Text className='section-title'>排口信息</Text>
          <View className='form-item'>
            <Text className='form-label'>排口类型</Text>
            <Picker
              range={['雨水口', '污水口', '合流口']}
              onChange={(e) => console.log(e.detail.value)}
            >
              <View className='picker-value'>请选择排口类型</View>
            </Picker>
          </View>
          <View className='form-item'>
            <Text className='form-label'>异常情况</Text>
            <View className='radio-group'>
              <Radio.Group onChange={(e) => console.log(e.detail.value)}>
                <Radio value='normal'>正常排水</Radio>
                <Radio value='abnormal'>异常排水</Radio>
              </Radio.Group>
            </View>
          </View>
        </View>
      )}

      {problemType === 'construction' && (
        <View className='section'>
          <Text className='section-title'>施工信息</Text>
          <View className='form-item'>
            <Text className='form-label'>项目名称</Text>
            <Textarea
              className='form-input'
              placeholder='请输入施工项目名称'
              maxlength={50}
            />
          </View>
          <View className='form-item'>
            <Text className='form-label'>是否有审批</Text>
            <View className='radio-group'>
              <Radio.Group onChange={(e) => console.log(e.detail.value)}>
                <Radio value='yes'>有审批</Radio>
                <Radio value='no'>无审批</Radio>
              </Radio.Group>
            </View>
          </View>
        </View>
      )}

      <View className='section'>
        <Text className='section-title'>问题描述</Text>
        <Textarea
          className='description-input'
          placeholder='请详细描述问题情况，包括位置、程度等信息...'
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className='char-count'>{description.length}/500</Text>
      </View>

      <View className='section'>
        <Text className='section-title'>拍照取证</Text>
        <View className='image-grid'>
          {images.map((img, index) => (
            <View key={index} className='image-item'>
              <Image
                src={img}
                className='image-preview'
                onClick={() => handlePreviewImage(index)}
                mode='aspectFill'
              />
              <View className='image-remove' onClick={() => handleRemoveImage(index)}>
                <Text>×</Text>
              </View>
            </View>
          ))}
          {images.length < 9 && (
            <View className='image-add' onClick={handleChooseImage}>
              <Text className='add-icon'>+</Text>
              <Text className='add-text'>添加图片</Text>
            </View>
          )}
        </View>
      </View>

      <View className='section'>
        <Text className='section-title'>视频上传</Text>
        {video ? (
          <View className='video-preview'>
            <View className='video-thumbnail'>
              <Text className='play-icon'>▶️</Text>
            </View>
            <Text className='video-name'>已选择视频</Text>
            <Text className='video-remove' onClick={() => setVideo('')}>删除</Text>
          </View>
        ) : (
          <View className='video-upload' onClick={handleChooseVideo}>
            <Text className='upload-icon'>🎬</Text>
            <Text className='upload-text'>点击上传视频（最长60秒）</Text>
          </View>
        )}
      </View>

      <View className='section'>
        <Text className='section-title'>语音备注</Text>
        <View className='voice-section'>
          <View
            className={`voice-btn ${recording ? 'recording' : ''}`}
            onClick={handleRecord}
          >
            <Text className='voice-icon'>{recording ? '🔴' : '🎤'}</Text>
            <Text className='voice-text'>
              {recording ? '录音中...点击结束' : '点击开始录音'}
            </Text>
          </View>
          {voiceNote && (
            <View className='voice-result'>
              <Text className='voice-play'>▶️ 播放录音</Text>
              <Text className='voice-delete' onClick={() => setVoiceNote('')}>删除</Text>
            </View>
          )}
        </View>
      </View>

      <View className='section'>
        <Text className='section-title'>位置信息</Text>
        <View className='location-info'>
          <Text className='location-icon'>📍</Text>
          <Text className='location-text'>{locationText}</Text>
          <Text className='location-refresh' onClick={initLocation}>刷新</Text>
        </View>
        <View className='form-item'>
          <Text className='form-label'>所属河道</Text>
          <Picker
            range={['清水河', '小清河', '东河', '西河']}
            onChange={(e) => {
              const rivers = ['清水河', '小清河', '东河', '西河']
              setRiverName(rivers[e.detail.value])
            }}
          >
            <View className='picker-value'>{riverName}</View>
          </Picker>
        </View>
      </View>

      <View className='submit-section'>
        <Button className='submit-btn offline' onClick={handleOfflineSave}>
          📴 离线保存
        </Button>
        <Button className='submit-btn primary' onClick={handleSubmit}>
          提交上报
        </Button>
      </View>
    </ScrollView>
  )
}
