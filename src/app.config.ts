export default defineAppConfig({
  pages: [
    'pages/tasks/index',
    'pages/map/index',
    'pages/report/index',
    'pages/rectify/index',
    'pages/water-quality/index',
    'pages/notifications/index',
    'pages/statistics/index',
    'pages/task-detail/index',
    'pages/problem-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '河湖长巡河',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '今日任务',
      },
      {
        pagePath: 'pages/map/index',
        text: '巡河地图',
      },
      {
        pagePath: 'pages/report/index',
        text: '问题上报',
      },
      {
        pagePath: 'pages/rectify/index',
        text: '整改跟踪',
      },
      {
        pagePath: 'pages/statistics/index',
        text: '个人统计',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '您的位置信息将用于巡河定位和打卡',
    },
  },
  requiredPrivateInfos: ['getLocation', 'onLocationChange', 'startLocationUpdate'],
})
