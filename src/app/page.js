"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import axios from "axios";

export default function Home() {
  const [product, setProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [popup, setPopup] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerTimeoutRef = useRef(null);

  const handleScan = useCallback(async (code) => {
    setIsScannerOpen(false);  // 読み取り後にスキャナーを閉じる
    try {
      setError("");
      const barcodeInt = parseInt(code, 10);
      if (isNaN(barcodeInt)) {
        setError("無効なバーコードです");
        return;
      }
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/item/${barcodeInt}`);
      if (res.data) {
        setProduct(res.data);
      } else {
        setProduct(null);
        setError("商品が見つかりません");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        if (err.response.status === 404) {
          setProduct(null);
          setError("商品が見つかりません");
        } else {
          setError(`エラー: ${err.response.status} - ${err.response.data}`);
        }
      } else if (err.request) {
        setError("サーバーに接続できません。バックエンドが起動しているか確認してください。");
      } else {
        setError(`エラーが発生しました: ${err.message}`);
      }
    }
  }, []);

  const handleManualBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      await handleScan(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleManualBarcodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setManualBarcode(value);
  };

  const addToCart = () => {
    if (product && product.prd_id) {
      setCart([...cart, { ...product, qty: 1 }]);
      setProduct(null);
    }
  };

  const handlePurchase = async () => {
    try {
      setError("");
      const purchaseData = {
        emp_cd: "EMP001",
        items: cart.map(item => ({
          prd_id: item.prd_id,
          code: item.code.toString(),
          name: item.name,
          price: item.price
        }))
      };
      console.log("送信データ:", purchaseData);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/purchase`, purchaseData);
      console.log("レスポンス:", res.data);
      if (res.data.success) {
        setPopup({
          total: res.data.total,
          total_ex_tax: res.data.total_ex_tax
        });
        setCart([]);
      } else {
        setError("購入処理に失敗しました");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(`エラー: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError("サーバーに接続できません。バックエンドが起動しているか確認してください。");
      } else {
        setError(`エラーが発生しました: ${err.message}`);
      }
    }
  };

  const handleClosePopup = () => {
    setPopup(null);
    setProduct(null);
    setManualBarcode("");
  };

  const openScanner = useCallback(() => {
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
    }
    setIsScannerOpen(false);
    scannerTimeoutRef.current = setTimeout(() => {
      setIsScannerOpen(true);
    }, 100);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 w-80">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <button
          className="w-full bg-blue-200 text-lg font-bold py-2 rounded mb-4"
          onClick={openScanner}
        >
          スキャン（カメラ）
        </button>
        <form onSubmit={handleManualBarcodeSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-white border border-gray-300 text-center py-2 rounded"
              value={manualBarcode}
              onChange={handleManualBarcodeChange}
              placeholder="バーコードを手入力"
              pattern="[0-9]*"
              inputMode="numeric"
            />
            <button
              type="submit"
              className="bg-blue-200 px-4 py-2 rounded font-bold"
            >
              検索
            </button>
          </div>
        </form>
        <div className="mb-2">
          <input
            className="w-full bg-gray-200 text-center py-2 rounded mb-2"
            value={product?.code || ""}
            readOnly
            placeholder="バーコード"
          />
          <input
            className="w-full bg-gray-200 text-center py-2 rounded mb-2"
            value={product?.name || ""}
            readOnly
            placeholder="商品名"
          />
          <input
            className="w-full bg-gray-200 text-center py-2 rounded"
            value={product?.price ? `${product.price}円` : ""}
            readOnly
            placeholder="価格"
          />
        </div>
        <button
          className="w-full bg-blue-200 text-lg font-bold py-2 rounded mb-4"
          onClick={addToCart}
          disabled={!product}
        >
          追加
        </button>
        <div className="mb-4">
          <h2 className="text-center font-bold mb-2">購入リスト</h2>
          <div className="bg-white border border-gray-300 rounded p-2 text-sm min-h-[80px]">
            {cart.length === 0 ? (
              <div className="text-gray-400 text-center">商品がありません</div>
            ) : (
              cart.map((item, i) => (
                <div key={i}>
                  {item.name} x1 {item.price}円 {item.price}円
                </div>
              ))
            )}
          </div>
        </div>
        <button
          className="w-full bg-blue-200 text-lg font-bold py-2 rounded"
          onClick={handlePurchase}
          disabled={cart.length === 0}
        >
          購入
        </button>
      </div>
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">バーコードスキャン</h2>
              <button
                onClick={closeScanner}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <BarcodeScanner onScanSuccess={handleScan} />
          </div>
        </div>
      )}
      {popup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4 text-center">購入完了</h2>
            <div className="space-y-2 mb-6">
              <p className="text-right">合計金額（税抜）: {popup.total_ex_tax.toLocaleString()}円</p>
              <p className="text-right font-bold text-lg">合計金額: {popup.total.toLocaleString()}円</p>
            </div>
            <button
              className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600"
              onClick={handleClosePopup}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
