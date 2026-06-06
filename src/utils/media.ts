import Taro from '@tarojs/taro';

export const chooseImage = (count: number = 9): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Taro.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        resolve(res.tempFilePaths);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        reject(error);
      },
    });
  });
};

export const chooseVideo = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    Taro.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (error) => {
        console.error('选择视频失败:', error);
        reject(error);
      },
    });
  });
};

let recorderManager: any = null;

export const startRecording = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!recorderManager) {
        recorderManager = Taro.getRecorderManager();
      }
      recorderManager.start({
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'mp3',
      });
      resolve();
    } catch (error) {
      console.error('开始录音失败:', error);
      reject(error);
    }
  });
};

export const stopRecording = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!recorderManager) {
        reject(new Error('录音管理器未初始化'));
        return;
      }
      recorderManager.onStop((res) => {
        resolve(res.tempFilePath);
      });
      recorderManager.onError((error) => {
        reject(error);
      });
      recorderManager.stop();
    } catch (error) {
      console.error('停止录音失败:', error);
      reject(error);
    }
  });
};

export const playAudio = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const innerAudioContext = Taro.createInnerAudioContext();
      innerAudioContext.src = filePath;
      innerAudioContext.onEnded(() => {
        resolve();
      });
      innerAudioContext.onError((error) => {
        reject(error);
      });
      innerAudioContext.play();
    } catch (error) {
      console.error('播放音频失败:', error);
      reject(error);
    }
  });
};

export const previewImage = (urls: string[], current: number = 0) => {
  Taro.previewImage({
    urls,
    current: urls[current],
  });
};
