// src/components/Header.jsx
import React, { useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // Icon cho theme
import { getTickerPrice, getKlineData } from '../utils/api'; // Sẽ tạo file này sau
import '../styles/Header.css'; // Sẽ tạo file này sau

function Header({
    theme,
    toggleTheme,
    intervals,
    selectedInterval,
    onIntervalChange,
    currentPrice,
    priceOneMinAgo,
    setCurrentPrice,
    setPriceOneMinAgo
}) {
    const [loadingPrice, setLoadingPrice] = useState(false);

    const fetchCurrentAndPreviousPrice = async () => {
        setLoadingPrice(true);
        try {
            // Lấy giá hiện tại
            const current = await getTickerPrice('BTCUSDT');
            setCurrentPrice(current);

            // Lấy giá cách đây 1 phút (nến đóng của nến 1 phút trước)
            // Lấy 2 nến gần nhất của khung thời gian 1 phút
            const kline1m = await getKlineData('BTCUSDT', '1m', 2);
            if (kline1m.length >= 2) {
                setPriceOneMinAgo(kline1m[0].close); // Nến trước đó
            } else if (kline1m.length === 1) {
                // Nếu chỉ có 1 nến, giá 1 phút trước có thể không có hoặc là giá đóng của nến đó
                setPriceOneMinAgo(kline1m[0].close);
            } else {
                setPriceOneMinAgo(null); // Không có dữ liệu
            }
        } catch (error) {
            console.error('Lỗi khi lấy giá:', error);
            setCurrentPrice(null);
            setPriceOneMinAgo(null);
        } finally {
            setLoadingPrice(false);
        }
    };

    return (
        <header className={`header ${theme}`}>
            <div className="logo">
                <h1>Bitcoin Chart</h1>
            </div>
            <div className="controls">
                <div className="interval-buttons">
                    {intervals.map(intervalOption => (
                        <button
                            key={intervalOption}
                            className={`interval-button ${selectedInterval === intervalOption ? 'active' : ''}`}
                            onClick={() => onIntervalChange(intervalOption)}
                        >
                            {intervalOption}
                        </button>
                    ))}
                </div>
                <div className="price-info">
                    <button onClick={fetchCurrentAndPreviousPrice} disabled={loadingPrice}>
                        {loadingPrice ? 'Đang tải...' : 'Lấy giá hiện tại & 1 phút trước'}
                    </button>
                    {currentPrice && (
                        <span>Giá hiện tại: **{currentPrice.toFixed(2)}$**</span>
                    )}
                    {priceOneMinAgo && (
                        <span>Giá 1 phút trước: **{priceOneMinAgo.toFixed(2)}$**</span>
                    )}
                </div>
                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <FaSun /> : <FaMoon />}
                </button>
            </div>
        </header>
    );
}

export default React.memo(Header); // Sử dụng React.memo để tối ưu re-render