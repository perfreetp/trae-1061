import { useState } from 'react'
import { View, Text, ScrollView, Image, Button, Textarea, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { WaterQualityRecord } from '../../types'
import { mockWaterQualityRecords, mockUser } from '../../utils/mock'
import { chooseImage, previewImage } from '../../utils/media'
import { getCurrentLocation } from '../../utils/location'
import './index.scss'

export default function WaterQuality() {
  const [records, setRecords] = useState<WaterQualityRecord[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    riverName: '清水河',
    location: '',
    temperature: '',
    pH: '',
    turbidity: '清澈',
    color: '无色',
    odor: '无异味',
    floatingObjects: false,
    oilFilm: false,
    dissolvedOxygen: '',
    ammoniaNitrogen: '',
    description: '',
    images: [] as string[],
  })

  useDidShow(() => {
    setRecords(mockWaterQualityRecords)
  })

  const handleChooseImage = async () => {
    try {
      const res = await chooseImage(3)
      setFormData(prev => ({ ...prev, images: [...prev.images, ...res] }))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = () => {
    Taro.showLoading({ title: '提交中...' })
    setTimeout(() => {
      const newRecord: WaterQualityRecord = {
        id: Date.now().toString(),
        ...formData,
        temperature: parseFloat(formData.temperature) || undefined,
        pH: parseFloat(formData.pH) || undefined,
        dissolvedOxygen: parseFloat(formData.dissolvedOxygen) || undefined,
        ammoniaNitrogen: parseFloat(formData.ammoniaNitrogen) || undefined,
        latitude: 31.2304,
        longitude: 121.4737,
        recorderId: mockUser.id,
        recorderName: mockUser.name,
        createdAt: new Date().toLocaleString(),
      }
      setRecords(prev => [newRecord, ...prev])
      setShowAddForm(false)
      Taro.hideLoading()
      Taro.showToast({ title: '记录成功', icon: 'success' })
    }, 1000)
  }

  const getWaterQualityLevel = (record: WaterQualityRecord) => {
    if (record.dissolvedOxygen && record.dissolvedOxygen >= 7.5 && record.ammoniaNitrogen && record.ammoniaNitrogen <= 0.5) {
      return { level: 'I类', color: '#52c41a' }
    }
    if (record.dissolvedOxygen && record.dissolvedOxygen >= 6 && record.ammoniaNitrogen && record.ammoniaNitrogen <= 1.0) {
      return { level: 'II类', color: '#13c2c2' }
    }
    if (record.dissolvedOxygen && record.dissolvedOxygen >= 5 && record.ammoniaNitrogen && record.ammoniaNitrogen <= 1.5) {
      return { level: 'III类', color: '#1677ff' }
    }
    return { level: 'IV类', color: '#faad14' }
  }

  return (
    <ScrollView className='water-quality-page' scrollY>
      {!showAddForm ? (
        <>
          <View className='header-card'>
            <View className='header-info'>
              <Text className='header-title'>水质监测记录</Text>
              <Text className='header-count'>共 {records.length} 条记录</Text>
            </View>
            <Button className='add-btn' onClick={() => setShowAddForm(true)}>
              + 新增记录
            </Button>
          </View>

          <View className='record-list'>
            {records.map(record => {
              const quality = getWaterQualityLevel(record)
              return (
                <View key={record.id} className='record-card'>
                  <View className='record-header'>
                    <View className='record-river'>{record.riverName}</View>
                    <View 
                      className='quality-level'
                      style={{ backgroundColor: `${quality.color}15`, color: quality.color }}
                    >
                      水质{quality.level}
                    </View>
                  </View>

                  <View className='record-location'>
                    <Text className='loc-icon'>📍</Text>
                    <Text className='loc-text'>{record.location}</Text>
                  </View>

                  <View className='record-indicators'>
                    <View className='indicator-item'>
                      <Text className='ind-label'>水温</Text>
                      <Text className='ind-value'>{record.temperature}°C</Text>
                    </View>
                    <View className='indicator-item'>
                      <Text className='ind-label'>pH值</Text>
                      <Text className='ind-value'>{record.pH}</Text>
                    </View>
                    <View className='indicator-item'>
                      <Text className='ind-label'>溶解氧</Text>
                      <Text className='ind-value'>{record.dissolvedOxygen}mg/L</Text>
                    </View>
                    <View className='indicator-item'>
                      <Text className='ind-label'>氨氮</Text>
                      <Text className='ind-value'>{record.ammoniaNitrogen}mg/L</Text>
                    </View>
                  </View>

                  <View className='record-status'>
                    <View className='status-item'>
                      <Text>浊度：{record.turbidity}</Text>
                    </View>
                    <View className='status-item'>
                      <Text>颜色：{record.color}</Text>
                    </View>
                    <View className='status-item'>
                      <Text>气味：{record.odor}</Text>
                    </View>
                  </View>

                  {record.images.length > 0 && (
                    <View className='record-images'>
                      {record.images.map((img, idx) => (
                        <Image 
                          key={idx} 
                          src={img} 
                          className='record-img' 
                          mode='aspectFill'
                          onClick={() => previewImage(record.images, idx)}
                        />
                      ))}
                    </View>
                  )}

                  {record.description && (
                    <Text className='record-desc'>{record.description}</Text>
                  )}

                  <View className='record-footer'>
                    <Text className='record-time'>{record.createdAt}</Text>
                    <Text className='record-user'>记录人：{record.recorderName}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </>
      ) : (
        <View className='add-form'>
          <View className='form-header'>
            <Text 
              className='back-btn'
              onClick={() => setShowAddForm(false)}
            >
              ← 返回
            </Text>
            <Text className='form-title'>新增水质记录</Text>
            <View style={{ width: 60 }} />
          </View>

          <View className='form-section'>
            <View className='form-item'>
              <Text className='form-label'>所属河道</Text>
              <Picker
                range={['清水河', '小清河', '东河', '西河']}
                onChange={(e) => {
                  const rivers = ['清水河', '小清河', '东河', '西河']
                  setFormData(prev => ({ ...prev, riverName: rivers[e.detail.value] }))
                }}
              >
                <View className='picker-value'>{formData.riverName}</View>
              </Picker>
            </View>

            <View className='form-item'>
              <Text className='form-label'>监测地点</Text>
              <Textarea
                className='form-input'
                placeholder='请输入监测地点描述'
                value={formData.location}
                onInput={(e) => setFormData(prev => ({ ...prev, location: e.detail.value }))}
              />
            </View>

            <View className='form-row'>
              <View className='form-item half'>
                <Text className='form-label'>水温 (°C)</Text>
                <Textarea
                  className='form-input'
                  type='digit'
                  placeholder='如12.5'
                  value={formData.temperature}
                  onInput={(e) => setFormData(prev => ({ ...prev, temperature: e.detail.value }))}
                />
              </View>
              <View className='form-item half'>
                <Text className='form-label'>pH值</Text>
                <Textarea
                  className='form-input'
                  type='digit'
                  placeholder='如7.2'
                  value={formData.pH}
                  onInput={(e) => setFormData(prev => ({ ...prev, pH: e.detail.value }))}
                />
              </View>
            </View>

            <View className='form-row'>
              <View className='form-item half'>
                <Text className='form-label'>溶解氧 (mg/L)</Text>
                <Textarea
                  className='form-input'
                  type='digit'
                  placeholder='如7.8'
                  value={formData.dissolvedOxygen}
                  onInput={(e) => setFormData(prev => ({ ...prev, dissolvedOxygen: e.detail.value }))}
                />
              </View>
              <View className='form-item half'>
                <Text className='form-label'>氨氮 (mg/L)</Text>
                <Textarea
                  className='form-input'
                  type='digit'
                  placeholder='如0.5'
                  value={formData.ammoniaNitrogen}
                  onInput={(e) => setFormData(prev => ({ ...prev, ammoniaNitrogen: e.detail.value }))}
                />
              </View>
            </View>

            <View className='form-row'>
              <View className='form-item half'>
                <Text className='form-label'>浊度</Text>
                <Picker
                  range={['清澈', '较清澈', '微浊', '浑浊']}
                  onChange={(e) => {
                    const items = ['清澈', '较清澈', '微浊', '浑浊']
                    setFormData(prev => ({ ...prev, turbidity: items[e.detail.value] }))
                  }}
                >
                  <View className='picker-value'>{formData.turbidity}</View>
                </Picker>
              </View>
              <View className='form-item half'>
                <Text className='form-label'>颜色</Text>
                <Picker
                  range={['无色', '微浊', '黄色', '褐色', '黑色']}
                  onChange={(e) => {
                    const items = ['无色', '微浊', '黄色', '褐色', '黑色']
                    setFormData(prev => ({ ...prev, color: items[e.detail.value] }))
                  }}
                >
                  <View className='picker-value'>{formData.color}</View>
                </Picker>
              </View>
            </View>

            <View className='form-item'>
              <Text className='form-label'>气味</Text>
              <Picker
                range={['无异味', '轻微异味', '明显异味', '恶臭']}
                onChange={(e) => {
                  const items = ['无异味', '轻微异味', '明显异味', '恶臭']
                  setFormData(prev => ({ ...prev, odor: items[e.detail.value] }))
                }}
              >
                <View className='picker-value'>{formData.odor}</View>
              </Picker>
            </View>

            <View className='form-item'>
              <Text className='form-label'>现场照片</Text>
              <View className='image-grid'>
                {formData.images.map((img, idx) => (
                  <Image key={idx} src={img} className='form-img' mode='aspectFill' />
                ))}
                {formData.images.length < 3 && (
                  <View className='image-add' onClick={handleChooseImage}>
                    <Text className='add-icon'>+</Text>
                    <Text className='add-text'>添加照片</Text>
                  </View>
                )}
              </View>
            </View>

            <View className='form-item'>
              <Text className='form-label'>备注说明</Text>
              <Textarea
                className='form-textarea'
                placeholder='请输入其他备注信息...'
                value={formData.description}
                onInput={(e) => setFormData(prev => ({ ...prev, description: e.detail.value }))}
                maxlength={200}
                autoHeight
              />
            </View>
          </View>

          <View className='form-footer'>
            <Button className='submit-btn' onClick={handleSubmit}>
              保存记录
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
