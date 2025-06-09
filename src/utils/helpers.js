/**
 * Tính toán đường trung bình động đơn giản (Simple Moving Average - SMA).
 * @param {Array<number>} data - Mảng các giá trị đóng.
 * @param {number} period - Chu kỳ tính toán.
 * @returns {Array<number|undefined>} - Mảng các giá trị SMA, với undefined cho các điểm đầu tiên.
 */
export const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i >= period - 1) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
            sma.push(sum / period);
        } else {
            sma.push(undefined);
        }
    }
    return sma;
};

/**
 * Tính toán đường trung bình động lũy thừa (Exponential Moving Average - EMA).
 * @param {Array<number>} data - Mảng các giá trị đóng.
 * @param {number} period - Chu kỳ tính toán.
 * @returns {Array<number|undefined>} - Mảng các giá trị EMA, với undefined cho các điểm đầu tiên.
 */
export const calculateEMA = (data, period) => {
    const ema = new Array(data.length).fill(undefined);
    if (data.length === 0) return ema;

    const multiplier = 2 / (period + 1);

    // Điểm EMA đầu tiên thường được tính bằng SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    ema[period - 1] = sum / period;

    // Tính EMA cho các điểm tiếp theo
    for (let i = period; i < data.length; i++) {
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    return ema;
};

/**
 * Tính toán Chỉ số sức mạnh tương đối (Relative Strength Index - RSI).
 * @param {Array<number>} closes - Mảng các giá đóng.
 * @param {number} period - Chu kỳ (mặc định 14).
 * @returns {Array<number|undefined>} - Mảng các giá trị RSI.
 */
export const calculateRSI = (closes, period = 14) => {
    const rsi = new Array(closes.length).fill(undefined);
    if (closes.length < period) return rsi;

    let avgGain = 0;
    let avgLoss = 0;

    // Tính gain/loss ban đầu
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) avgGain += change;
        else avgLoss -= change;
    }
    avgGain /= period;
    avgLoss /= period;

    const rs = avgLoss === 0 ? (avgGain === 0 ? 0 : Infinity) : avgGain / avgLoss;
    rsi[period - 1] = 100 - (100 / (1 + rs));

    // Tính toán cho các điểm còn lại
    for (let i = period; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        let currentGain = 0;
        let currentLoss = 0;
        if (change > 0) currentGain = change;
        else currentLoss = -change;

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

        const currentRS = avgLoss === 0 ? (avgGain === 0 ? 0 : Infinity) : avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + currentRS));
    }
    return rsi;
};

/**
 * Tính toán Đường trung bình động hội tụ phân kỳ (Moving Average Convergence Divergence - MACD).
 * @param {Array<number>} closes - Mảng các giá đóng.
 * @param {number} fastPeriod - Chu kỳ EMA nhanh (mặc định 12).
 * @param {number} slowPeriod - Chu kỳ EMA chậm (mặc định 26).
 * @param {number} signalPeriod - Chu kỳ đường tín hiệu (mặc định 9).
 * @returns {Object} - Đối tượng chứa macd line, signal line và histogram.
 */
export const calculateMACD = (closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const macdResult = {
        macd: new Array(closes.length).fill(undefined),
        signal: new Array(closes.length).fill(undefined),
        histogram: new Array(closes.length).fill(undefined),
    };
    if (closes.length < slowPeriod) return macdResult;

    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);

    for (let i = 0; i < closes.length; i++) {
        if (fastEMA[i] !== undefined && slowEMA[i] !== undefined) {
            macdResult.macd[i] = fastEMA[i] - slowEMA[i];
        }
    }

    // Lọc bỏ undefined để tính signal line
    const filteredMacdLine = macdResult.macd.filter(val => val !== undefined);
    const signalLineRaw = calculateEMA(filteredMacdLine, signalPeriod);

    // Map signalLineRaw trở lại độ dài ban đầu
    let signalIdx = 0;
    for (let i = 0; i < macdResult.macd.length; i++) {
        if (macdResult.macd[i] !== undefined) {
            macdResult.signal[i] = signalLineRaw[signalIdx];
            signalIdx++;
        }
    }

    // Tính toán Histogram
    for (let i = 0; i < closes.length; i++) {
        if (macdResult.macd[i] !== undefined && macdResult.signal[i] !== undefined) {
            macdResult.histogram[i] = macdResult.macd[i] - macdResult.signal[i];
        }
    }

    return macdResult;
};