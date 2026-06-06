import { useState } from 'react'
import { View, Text, ScrollView, Button, Image, Canvas } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { mockStatistics, mockUser } from '../../utils/mock'
import './index.scss'

export default function Statistics() {
  const [stats, setStats] = useState(mockStatistics)
  const [activeChart, setActiveChart] = useState('trend')

  useDidShow(() => {
    setStats(mockStatistics)
  })

  const completionRate = stats.totalProblems > 0 
    ? Math.round((stats.completedProblems / stats.totalProblems) * 100)
    : 0

  const generateReport = () => {
    Taro.showLoading({ title: '生成报告中...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showModal({
        title: '报告已生成',
        content: '月度履职报告已生成，是否查看？',
        confirmText: '查看报告',
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '报告预览', icon: 'success' })
          }
        },
      })
    }, 1500)
  }

  const getHeatmapColor = (count: number) => {
    if (count >= 10) return 'rgba(255, 77, 79, 0.8)'
    if (count >= 7) return 'rgba(250, 173, 20, 0.8)'
    if (count >= 4) return 'rgba(22, 119, 255, 0.8)'
    return 'rgba(82, 196, 26, 0.8)'
  }

  return (
    <ScrollView className='statistics-page' scrollY>
      <View className='user-card'>
        <View className='user-avatar'>
          <Text className='avatar-text'>{mockUser.name.charAt(0)}</Text>
        </View>
        <View className='user-info'>
          <Text className='user-name'>{mockUser.name}</Text>
          <Text className='user-role'>{mockUser.role === 'riverChief' ? '乡镇河湖长' : '巡查员'}</Text>
          <Text className='user-dept'>{mockUser.department}</Text>
        </View>
      </View>

      <View className='stats-overview'>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalPatrols}</Text>
          <Text className='overview-label'>巡查次数</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalDistance}</Text>
          <Text className='overview-label'>巡查里程(km)</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalProblems}</Text>
          <Text className='overview-label'>上报问题</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value success'>{completionRate}%</Text>
          <Text className='overview-label'>整改完成率</Text>
        </View>
      </View>

      <View className='warning-card'>
        <View className='warning-icon'>⚠️</View>
        <View className='warning-content'>
          <Text className='warning-title'>超期问题提醒</Text>
          <Text className='warning-text'>您有 {stats.overdueProblems} 个问题已超期未整改，请及时处理</Text>
        </View>
      </View>

      <View className='chart-section'>
        <View className='section-header'>
          <Text className='section-title'>数据统计</Text>
          <View className='chart-tabs'>
            <Text
              className={`chart-tab ${activeChart === 'trend' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('trend')}
            >
              巡查趋势
            </Text>
            <Text
              className={`chart-tab ${activeChart === 'type' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('type')}
            >
              问题分类
            </Text>
            <Text
              className={`chart-tab ${activeChart === 'heatmap' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('heatmap')}
            >
              热力图
            </Text>
          </View>
        </View>

        {activeChart === 'trend' && (
          <View className='chart-container'>
            <View className='chart-legend'>
              <View className='legend-item'>
                <View className='legend-color patrol' />
                <Text>巡查次数</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color distance' />
                <Text>巡查里程(km)</Text>
              </View>
            </View>
            <View className='bar-chart'>
              {stats.monthlyPatrols.map((item, index) => (
                <View key={index} className='bar-group'>
                  <View className='bars'>
                    <View 
                      className='bar bar-count'
                      style={{ height: `${(item.count / 30) * 100}%` }}
                    >
                      <Text className='bar-value'>{item.count}</Text>
                    </View>
                    <View 
                      className='bar bar-distance'
                      style={{ height: `${(item.distance / 100) * 100}%` }}
                    >
                      <Text className='bar-value'>{item.distance}</Text>
                    </View>
                  </View>
                  <Text className='bar-label'>{item.month.slice(-2)}月</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeChart === 'type' && (
          <View className='chart-container'>
            <View className='pie-chart'>
              <View className='pie-center'>
                <Text className='pie-total'>{stats.totalProblems}</Text>
                <Text className='pie-label'>问题总数</Text>
              </View>
            </View>
            <View className='type-list'>
              {stats.problemTypes.map((item, index) => (
                <View key={index} className='type-item'>
                  <View 
                    className='type-color' 
                    style={{ 
                      backgroundColor: [
                        '#faad14', '#1677ff', '#ff4d4f', '#722ed1', '#eb2f96', '#8c8c8c'
                      ][index % 6] 
                    }} 
                  />
                  <Text className='type-name'>{item.type}</Text>
                  <Text className='type-count'>{item.count}</Text>
                  <Text className='type-percent'>
                    {Math.round((item.count / stats.totalProblems) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeChart === 'heatmap' && (
          <View className='chart-container'>
            <View className='heatmap-container'>
              <View className='heatmap-map'>
                <Text className='map-placeholder'>
                  🗺️ 地图热力图
                </Text>
                {stats.heatmapData.map((item, index) => (
                  <View
                    key={index}
                    className='heat-point'
                    style={{
                      left: `${((item.longitude - 121.45) * 500}%`,
                      top: `${(31.26 - item.latitude) * 500}%`,
                      backgroundColor: getHeatmapColor(item.count),
                      width: `${20 + item.count * 2}px`,
                      height: `${20 + item.count * 2}px`,
                    }}
                  >
                    <Text className='point-count'>{item.count}</Text>
                  </View>
                ))}
              </View>
              <View className='heatmap-legend'>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(82, 196, 26, 0.8)' }} />
                  <Text>少 (1-3)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(22, 119, 255, 0.8)' }} />
                  <Text>中 (4-6)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(250, 173, 20, 0.8)' }} />
                  <Text>多 (7-9)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(255, 77, 79, 0.8)' }} />
                  <Text>很多 (10+)</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className='report-section'>
        <Text className='section-title'>月度履职报告</Text>
        <View className='report-card'>
          <View className='report-icon'>📊</View>
          <View className='report-info'>
            <Text className='report-title'>2024年1月履职报告</Text>
            <Text className='report-desc'>包含巡查统计、问题分析、整改情况等</Text>
          </View>
          <Button className='report-btn' onClick={generateReport}>
            生成报告
          </Button>
        </View>
      </View>

      <View className='quick-stats'>
        <Text className='section-title'>快速统计</Text>
        <View className='quick-grid'>
          <View className='quick-item'>
            <Text className='quick-icon'>🏆</Text>
            <Text className='quick-label'>本月排名</Text>
            <Text className='quick-value'>第 3 名</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>📅</Text>
            <Text className='quick-label'>本月巡查</Text>
            <Text className='quick-value'>22 次</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>📍</Text>
            <Text className='quick-label'>打卡完成率</Text>
            <Text className='quick-value'>98%</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>⏱️</Text>
            <Text className='quick-label'>平均时长</Text>
            <Text className='quick-value'>2.5h</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
