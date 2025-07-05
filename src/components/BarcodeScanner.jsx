"use client";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onScanSuccess }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        // 既存のスキャナーをクリーンアップ
        if (codeReaderRef.current) {
          try {
            await codeReaderRef.current.stopAsyncDecode();
          } catch (err) {
            console.warn("クリーンアップエラー:", err);
          }
        }

        // 新しいスキャナーを作成
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        // カメラデバイスを取得
        const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = videoInputDevices.filter(device => device.kind === 'videoinput');
        
        if (!videoDevices || videoDevices.length === 0) {
          throw new Error("カメラが見つかりません");
        }

        // バックカメラを優先的に使用
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes("back") || 
          device.label.toLowerCase().includes("リア")
        );
        const selectedDeviceId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;

        if (!mounted) return;

        // スキャン開始
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (!mounted) return;

            if (result) {
              const code = result.getText();
              console.log("スキャン成功:", code);
              onScanSuccess(code);
            }
            if (error && error.name !== "NotFoundException") {
              console.warn("スキャンエラー:", error);
            }
          }
        );
      } catch (err) {
        console.error("スキャナー起動エラー:", err);
        setError(err.message);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.stopAsyncDecode();
        } catch (err) {
          console.warn("クリーンアップエラー:", err);
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full flex flex-col items-center">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      ) : (
        <div className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-xl shadow-lg">
            <video
              ref={videoRef}
              data-testid="scanner-container"
              className="w-full h-auto"
              style={{
                aspectRatio: "4/3",
                objectFit: "cover",
              }}
              playsInline
              muted
              autoPlay
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-gray-700 font-medium mb-1">
              バーコードをスキャンエリアに合わせてください
            </div>
            <div className="text-sm text-gray-500">
              自動的に読み取られます
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
