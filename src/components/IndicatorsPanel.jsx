import React from 'react';

function IndicatorsPanel({
    showRSI, setShowRSI,
    showMACD, setShowMACD,
    showEMA, setShowEMA,
    showSMA, setShowSMA
}) {
    return (
        <div className="indicators-panel">
            <h3>Chỉ báo kỹ thuật</h3>
            <label>
                <input
                    type="checkbox"
                    checked={showRSI}
                    onChange={() => setShowRSI(prev => !prev)}
                />
                RSI (14)
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={showMACD}
                    onChange={() => setShowMACD(prev => !prev)}
                />
                MACD (12, 26, 9)
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={showEMA}
                    onChange={() => setShowEMA(prev => !prev)}
                />
                EMA (20)
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={showSMA}
                    onChange={() => setShowSMA(prev => !prev)}
                />
                SMA (20)
            </label>
        </div>
    );
}

export default React.memo(IndicatorsPanel);