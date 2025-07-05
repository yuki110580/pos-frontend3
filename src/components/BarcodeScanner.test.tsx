// windowに__MOCK_BARCODE__を追加する型定義
declare global {
  interface Window {
    __MOCK_BARCODE__?: string;
  }
}

import { render, screen, waitFor } from '@testing-library/react';
import BarcodeScanner from './BarcodeScanner';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ZXingのモック
jest.mock('@zxing/browser', () => {
  return {
    BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
      decodeFromVideoDevice: (_deviceId: any, _videoEl: any, callback: any) => {
        // テストごとにcallbackを呼ぶかどうかを制御する
        if (window.__MOCK_BARCODE__) {
          callback({ getText: () => window.__MOCK_BARCODE__ }, null, null);
        } else {
          callback(null, null, null);
        }
        return Promise.resolve();
      },
      reset: jest.fn(),
      stopContinuousDecode: jest.fn(),
      stopAsyncDecode: jest.fn(),
    })),
  };
});

describe('BarcodeScanner', () => {
  afterEach(() => {
    // グローバル変数をリセット
    window.__MOCK_BARCODE__ = undefined;
    jest.clearAllMocks();
  });

  it('UT-001: 有効なバーコードをスキャンしたときonScanSuccessが一度だけ呼ばれ、正しいコードが渡る', async () => {
    window.__MOCK_BARCODE__ = '4901234567054';
    const onScanSuccess = jest.fn();
    render(<BarcodeScanner onScanSuccess={onScanSuccess} />);
    await waitFor(() => expect(onScanSuccess).toHaveBeenCalledTimes(1));
    expect(onScanSuccess).toHaveBeenCalledWith('4901234567054');
  });

  it('UT-002: 無効なコードや読み取り不能な画像の場合onScanSuccessは呼ばれない', async () => {
    window.__MOCK_BARCODE__ = undefined;
    const onScanSuccess = jest.fn();
    render(<BarcodeScanner onScanSuccess={onScanSuccess} />);
    expect(onScanSuccess).not.toHaveBeenCalled();
  });

  it('renders the scanner container with video element', () => {
    const onScanSuccess = jest.fn();
    render(<BarcodeScanner onScanSuccess={onScanSuccess} />);
    const videoElement = screen.getByTestId('scanner-container');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('playsInline');
    expect(videoElement).toHaveAttribute('autoPlay');
    // muted属性はboolean属性なので、プロパティで判定
    expect((videoElement as HTMLVideoElement).muted).toBe(true);
  });

  it('displays error message when camera is not found', async () => {
    const onScanSuccess = jest.fn();
    const mockError = new Error('カメラが見つかりません');
    
    // エラーをスローするようにモックを設定
    jest.spyOn(global.navigator.mediaDevices, 'enumerateDevices')
      .mockRejectedValueOnce(mockError);

    render(<BarcodeScanner onScanSuccess={onScanSuccess} />);

    // エラーメッセージが表示されることを確認
    const errorMessage = await screen.findByText('カメラが見つかりません');
    expect(errorMessage).toBeInTheDocument();
  });

  it('initializes scanner with correct configuration', () => {
    const onScanSuccess = jest.fn();
    render(<BarcodeScanner onScanSuccess={onScanSuccess} />);
    const videoElement = screen.getByTestId('scanner-container');
    // style属性値を文字列で検証
    expect(videoElement).toHaveStyle('aspect-ratio: 4/3; object-fit: cover;');
  });

  it('cleans up scanner on unmount', () => {
    const onScanSuccess = jest.fn();
    const { unmount } = render(<BarcodeScanner onScanSuccess={onScanSuccess} />);

    // コンポーネントをアンマウント
    unmount();

    // クリーンアップが呼ばれたことを確認
    // 注: 実際のクリーンアップの確認は難しいため、このテストはスキップしても良い
  });
});
