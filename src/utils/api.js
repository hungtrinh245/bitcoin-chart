import axios from 'axios';

const BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Lấy dữ liệu nến (kline/candlestick data) từ Binance.
 * @param {string} symbol - Cặp tiền tệ, ví dụ 'BTCUSDT'.
 * @param {string} interval - Khung thời gian, ví dụ '1m', '5m', '1h', '1d'.
 * @param {number} limit - Số lượng nến muốn lấy.
 * @returns {Array} - Mảng các đối tượng nến đã được format.
 */
export const getKlineData = async (symbol, interval, limit = 500) => {
    try {
        const response = await axios.get(`${BASE_URL}/klines`, {
            params: {
                symbol: symbol.toUpperCase(), // Đảm bảo symbol là chữ hoa
                interval,
                limit,
            },
        });
        // Chuyển đổi dữ liệu từ Binance sang định dạng lightweight-charts
        const formattedData = response.data.map(d => ({
            time: d[0] / 1000, // Binance time in milliseconds, lightweight-charts needs seconds
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            value: parseFloat(d[5]), // Volume
        }));
        return formattedData;
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu kline cho ${symbol} - ${interval}:`, error);
        return [];
    }
};

/**
 * Lấy giá hiện tại của một cặp tiền tệ.
 * @param {string} symbol - Cặp tiền tệ, ví dụ 'BTCUSDT'.
 * @returns {number} - Giá hiện tại.
 */
export const getTickerPrice = async (symbol) => {
    try {
        const response = await axios.get(`${BASE_URL}/ticker/price`, {
            params: {
                symbol: symbol.toUpperCase(),
            },
        });
        return parseFloat(response.data.price);
    } catch (error) {
        console.error(`Lỗi khi lấy giá ticker cho ${symbol}:`, error);
        return null;
    }
};