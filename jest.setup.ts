// jest.setup.ts
import '@testing-library/jest-dom';

// window.matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// navigator.mediaDevicesのモック
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'back-id', label: 'back camera' },
      { kind: 'videoinput', deviceId: 'default-id', label: 'default camera' },
      { kind: 'videoinput', deviceId: 'front-id', label: 'front camera' }
    ]),
    getUserMedia: jest.fn().mockImplementation((constraints) => {
      // deviceId指定があれば常に成功させる
      if (
        constraints &&
        constraints.video &&
        ((typeof constraints.video.deviceId === 'string' && constraints.video.deviceId) ||
         (constraints.video.deviceId && constraints.video.deviceId.exact))
      ) {
        return Promise.resolve({});
      }
      // それ以外も成功
      return Promise.resolve({});
    }),
  },
});
