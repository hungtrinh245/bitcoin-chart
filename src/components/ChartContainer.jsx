import React, { useCallback, useEffect, useRef, useState } from "react";

const ChartContainer = ({ theme, interval, onDragEnd, showRSI, showMACD, showEMA, showSMA }) => {
    const chartContainerRef = useRef();
    const chart = useRef(null);
    const candlestickSeries = useRef(null);
    const volumeSeries = useRef(null);
    const rsiSeries = useRef(null);
    const macdLineSeries = useRef(null);
    const macdSignalSeries = useRef(null);
    const macdHistogramSeries = useRef(null); // Để hiển thị cột histogram của MACD
    const emaSeries = useRef(null);
    const smaSeries = useRef(null);

    const [chartData, setChartData] = useState([]); // Lưu trữ toàn bộ dữ liệu nến để tính toán indicators


    const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const gridColor = theme === 'dark' ? '#333333' : '#e0e0e0';
    const crosshairColor = theme === 'dark' ? '#758696' : '#9B9B9B';
    const borderDefaultColor = theme === 'dark' ? '#333333' : '#e0e0e0';

     // Hook WebSocket cho dữ liệu real-time
    const { message: wsMessage } = useWebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${interval.toLowerCase()}`);

    // Hàm khởi tạo biểu đồ
    const initializeChart = useCallback(() => {
        if (!chartContainerRef.current) return;

        // Xóa biểu đồ cũ nếu đã tồn tại để tránh lỗi
        if (chart.current) {
            chart.current.remove();
        }

        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                backgroundColor,
                textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            rightPriceScale: {
                borderColor: borderDefaultColor,
            },
            timeScale: {
                borderColor: borderDefaultColor,
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 10, // Khoảng cách giữa các nến
            },
            crosshair: {
                mode: 0, // Normal
                vertLine: {
                    color: crosshairColor,
                    width: 0.5,
                    style: 0,
                    visible: true,
                    labelVisible: true,
                },
                horzLine: {
                    color: crosshairColor,
                    width: 0.5,
                    style: 0,
                    visible: true,
                    labelVisible: true,
                },
            },
        });

        // Add Series cho Candlestick
        candlestickSeries.current = chart.current.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Add Series cho Volume (Histogram)
        volumeSeries.current = chart.current.addHistogramSeries({
            priceScaleId: 'volume', // Đặt id riêng cho thang giá
            color: '#7C899C',
            lineWidth: 2,
            priceFormat: {
                type: 'volume',
            },
            overlay: true, // Hiển thị trên cùng một cửa sổ với nến
            scaleMargins: {
                top: 0.7, // 70% dành cho nến
                bottom: 0, // 30% dành cho volume
            },
        });

        // Cấu hình thang giá cho Volume
        chart.current.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.7,
                bottom: 0,
            },
            borderVisible: false,
        });

        // Thêm các series cho Indicator
        rsiSeries.current = chart.current.addLineSeries({
            color: 'blue',
            lineWidth: 1,
            priceScaleId: 'rsi-scale', // Thang giá riêng cho RSI
            visible: showRSI
        });
        macdLineSeries.current = chart.current.addLineSeries({
            color: 'green',
            lineWidth: 1,
            priceScaleId: 'macd-scale', // Thang giá riêng cho MACD
            visible: showMACD
        });
        macdSignalSeries.current = chart.current.addLineSeries({
            color: 'orange',
            lineWidth: 1,
            priceScaleId: 'macd-scale',
            visible: showMACD
        });
        macdHistogramSeries.current = chart.current.addHistogramSeries({
            priceScaleId: 'macd-scale',
            color: '#7C899C', // Màu mặc định
            visible: showMACD,
        });
        emaSeries.current = chart.current.addLineSeries({
            color: 'purple',
            lineWidth: 1,
            visible: showEMA
        });
        smaSeries.current = chart.current.addLineSeries({
            color: 'brown',
            lineWidth: 1,
            visible: showSMA
        });

        // Cấu hình thang giá riêng cho RSI và MACD
        chart.current.priceScale('rsi-scale').applyOptions({
            position: 'left',
            visible: showRSI,
        });
        chart.current.priceScale('macd-scale').applyOptions({
            position: 'left',
            visible: showMACD,
        });

        // Responsive chart
        const handleResize = () => {
            if (chart.current && chartContainerRef.current) {
                chart.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };
        window.addEventListener('resize', handleResize);


      
        chart.current.timeScale().subscribeVisibleLogicalRangeChange(newVisibleLogicalRange => {
            
            if (newVisibleLogicalRange && newVisibleLogicalRange.from !== null && newVisibleLogicalRange.to !== null) {
                const totalBars = candlestickSeries.current.data().length;
                if (newVisibleLogicalRange.from <= totalBars * 0.1 && totalBars > 0) { // Nếu còn 10% dữ liệu cũ
                    onDragEnd(); // Gọi hàm cha để xử lý việc load thêm data
                }
            }
        });


          return () => {
            window.removeEventListener('resize', handleResize);
            if (chart.current) {
                chart.current.remove();
            }
        };
    }, [backgroundColor, textColor, gridColor, borderDefaultColor, crosshairColor, showRSI, showMACD, showEMA, showSMA, onDragEnd]);

    // Fetch dữ liệu lịch sử khi interval thay đổi hoặc lần đầu render
    useEffect(() => {
        const fetchAndSetInitialData = async () => {
            const data = await getKlineData('BTCUSDT', interval, 500); // Lấy 500 nến ban đầu
            setChartData(data); // Lưu vào state để tính indicators

            if (candlestickSeries.current && volumeSeries.current) {
                candlestickSeries.current.setData(data);
                volumeSeries.current.setData(data.map(d => ({
                    time: d.time,
                    value: d.value,
                    color: d.open > d.close ? 'rgba(239, 83, 80, 0.5)' : 'rgba(38, 166, 154, 0.5)' // Màu volume theo nến
                })));
                chart.current.timeScale().fitContent(); // Tự động fit biểu đồ khi có dữ liệu mới
            }
        };

        initializeChart(); // Khởi tạo biểu đồ mỗi khi dependencies thay đổi (theme, interval, indicator visibility)
        fetchAndSetInitialData();

    }, [interval, initializeChart]); // Thêm initializeChart vào dependency array

    // Cập nhật dữ liệu từ WebSocket
    useEffect(() => {
        if (wsMessage && wsMessage.e === 'kline' && candlestickSeries.current && volumeSeries.current) {
            const kline = wsMessage.k;

            // Kiểm tra xem nến hiện tại đã kết thúc hay chưa
            const isCandleClosed = kline.x; // 'x' là true nếu nến đã đóng

            const newCandle = {
                time: kline.t / 1000, // Binance time in milliseconds, lightweight-charts needs seconds
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
            };
            const newVolume = {
                time: kline.t / 1000,
                value: parseFloat(kline.v),
                color: parseFloat(kline.o) > parseFloat(kline.c) ? 'rgba(239, 83, 80, 0.5)' : 'rgba(38, 166, 154, 0.5)'
            };

            candlestickSeries.current.update(newCandle);
            volumeSeries.current.update(newVolume);

            // Cập nhật chartData để tính toán lại indicators
            setChartData(prevData => {
                const lastCandleTime = prevData.length > 0 ? prevData[prevData.length - 1].time : 0;
                let updatedData;

                if (newCandle.time > lastCandleTime) {
                    // Nếu là nến mới (thời gian lớn hơn nến cuối cùng)
                    updatedData = [...prevData, { ...newCandle, value: newVolume.value }];
                } else if (newCandle.time === lastCandleTime) {
                    // Nếu là nến đang chạy (thời gian trùng với nến cuối cùng)
                    updatedData = prevData.map(d => d.time === newCandle.time ? { ...newCandle, value: newVolume.value } : d);
                } else {
                    // Trường hợp dữ liệu cũ hơn hoặc lỗi (ít xảy ra với stream)
                    updatedData = prevData;
                }

                // Giới hạn số lượng nến để tối ưu hiệu suất, ví dụ 1000 nến
                if (updatedData.length > 1000) {
                    updatedData = updatedData.slice(updatedData.length - 1000);
                }
                return updatedData;
            });
        }
    }, [wsMessage]);

    // Cập nhật dữ liệu indicator khi chartData hoặc tùy chọn indicator thay đổi
    useEffect(() => {
        if (!chartData.length) return;

        const closePrices = chartData.map(d => d.close);
        const times = chartData.map(d => d.time);

        // RSI
        if (showRSI) {
            const rsiValues = calculateRSI(closePrices, 14);
            rsiSeries.current.setData(rsiValues.map((val, index) => ({ time: times[index], value: val })));
            chart.current.priceScale('rsi-scale').applyOptions({ visible: true });
        } else {
            rsiSeries.current.setData([]);
            chart.current.priceScale('rsi-scale').applyOptions({ visible: false });
        }

        // MACD
        if (showMACD) {
            const macdResult = calculateMACD(closePrices, 12, 26, 9);
            macdLineSeries.current.setData(macdResult.macd.map((val, index) => ({ time: times[index], value: val })));
            macdSignalSeries.current.setData(macdResult.signal.map((val, index) => ({ time: times[index], value: val })));
            macdHistogramSeries.current.setData(macdResult.histogram.map((val, index) => ({
                time: times[index],
                value: val,
                color: val >= 0 ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)' // Màu histogram theo giá trị
            })));
            chart.current.priceScale('macd-scale').applyOptions({ visible: true });
        } else {
            macdLineSeries.current.setData([]);
            macdSignalSeries.current.setData([]);
            macdHistogramSeries.current.setData([]);
            chart.current.priceScale('macd-scale').applyOptions({ visible: false });
        }

        // EMA
        if (showEMA) {
            const emaValues = calculateEMA(closePrices, 20); // Ví dụ EMA 20
            emaSeries.current.setData(emaValues.map((val, index) => ({ time: times[index], value: val })));
        } else {
            emaSeries.current.setData([]);
        }

        // SMA
        if (showSMA) {
            const smaValues = calculateSMA(closePrices, 20); // Ví dụ SMA 20
            smaSeries.current.setData(smaValues.map((val, index) => ({ time: times[index], value: val })));
        } else {
            smaSeries.current.setData([]);
        }

    }, [chartData, showRSI, showMACD, showEMA, showSMA]);


    return (
        <div ref={chartContainerRef} className="chart-container">
            {/* Đây là nơi biểu đồ sẽ được render */}
        </div>
    );
};

export default React.memo(ChartContainer);