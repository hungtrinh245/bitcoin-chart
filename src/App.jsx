import { useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import ChartContainer from './components/ChartContainer';
import IndicatorsPanel from './components/IndicatorsPanel';
function App() {
 
 const [theme, setTheme] = useState('dark'); // 'dark' hoặc 'light'
    const [interval, setInterval] = useState('1h'); // Khung thời gian mặc định là 1 giờ
    const [showRSI, setShowRSI] = useState(false);
    const [showMACD, setShowMACD] = useState(false);
    const [showEMA, setShowEMA] = useState(false);
    const [showSMA, setShowSMA] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [priceOneMinAgo, setPriceOneMinAgo] = useState(null);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    }, []);

    const handleIntervalChange = useCallback((newInterval) => {
        setInterval(newInterval);
    }, []);

       const handleDragEnd = useCallback(() => {
         console.log("Kéo đến cuối, cần load thêm dữ liệu cũ hơn!");
    }, []);

     useEffect(() => {
        document.body.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f0f2f5';
        document.body.style.color = theme === 'dark' ? '#ffffff' : '#333333';
    }, [theme]);
   return (
        <div className={`app ${theme}`}>
            <Header
                theme={theme}
                toggleTheme={toggleTheme}
                intervals={INTERVALS}
                selectedInterval={interval}
                onIntervalChange={handleIntervalChange}
                currentPrice={currentPrice}
                priceOneMinAgo={priceOneMinAgo}
                setCurrentPrice={setCurrentPrice}
                setPriceOneMinAgo={setPriceOneMinAgo}
            />
            <div className="main-content">
                <IndicatorsPanel
                    showRSI={showRSI} setShowRSI={setShowRSI}
                    showMACD={showMACD} setShowMACD={setShowMACD}
                    showEMA={showEMA} setShowEMA={setShowEMA}
                    showSMA={showSMA} setShowSMA={setShowSMA}
                />
                <ChartContainer
                    theme={theme}
                    interval={interval}
                    onDragEnd={handleDragEnd}
                    showRSI={showRSI}
                    showMACD={showMACD}
                    showEMA={showEMA}
                    showSMA={showSMA}
                />
            </div>
        </div>
    );
}

export default App
