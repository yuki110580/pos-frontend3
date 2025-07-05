import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockItem = {
  prd_id: 1,
  code: '4901234567054',
  name: 'テスト商品',
  price: 100,
};

describe('Homeページ・カート・購入ボタン', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: mockItem });
  });

  it('UT-003: 商品スキャン後、商品リストに表示される', async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText('バーコードを手入力');
    fireEvent.change(input, { target: { value: '4901234567054' } });
    const searchBtn = screen.getByText('検索');
    fireEvent.click(searchBtn);
    // 商品名・価格が表示されることを確認
    expect(await screen.findByDisplayValue('テスト商品')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('100円')).toBeInTheDocument();
  });

  it('UT-004: バーコード番号を直接入力して商品が追加される', async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText('バーコードを手入力');
    fireEvent.change(input, { target: { value: '4901234567054' } });
    const searchBtn = screen.getByText('検索');
    fireEvent.click(searchBtn);
    expect(await screen.findByDisplayValue('テスト商品')).toBeInTheDocument();
  });

  it('UT-005: カートが空のとき購入ボタンが無効化されている', () => {
    render(<Home />);
    const buyBtn = screen.getByText('購入');
    expect(buyBtn).toBeDisabled();
  });

  it('UT-006: 商品追加後、購入ボタンが有効化される', async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText('バーコードを手入力');
    fireEvent.change(input, { target: { value: '4901234567054' } });
    const searchBtn = screen.getByText('検索');
    fireEvent.click(searchBtn);
    // 追加ボタンをクリック
    const addBtn = await screen.findByText('追加');
    fireEvent.click(addBtn);
    const buyBtn = await screen.findByText('購入');
    await waitFor(() => expect(buyBtn).toBeEnabled());
  });
}); 