import { useEffect, useRef } from "react";
import {
  Chart,
  TimeSeriesScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import "chartjs-adapter-luxon";
import type { Candle } from "../hooks/useWebSocket";

// Register chart components
Chart.register(
  TimeSeriesScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

interface Props {
  candles:  Candle[];
  symbol:   string;
  height?:  number;
}

export default function CandleChart({ candles, symbol, height = 420 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart
    chartRef.current?.destroy();

    const data = candles.map((c) => ({
      x: c.t,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: "candlestick" as any,
      data: {
        datasets: [{
          label: symbol,
          data,
          color: {
            up:        "#00e676",
            down:      "#ff6b6b",
            unchanged: "#94a3b8",
          },
          borderColor: {
            up:        "#00e676",
            down:      "#ff6b6b",
            unchanged: "#94a3b8",
          },
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 0 },
        interaction:         { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0d1117",
            borderColor:     "rgba(255,255,255,0.1)",
            borderWidth:     1,
            titleColor:      "#00f5c4",
            bodyColor:       "#f0f0f0",
            padding:         12,
            callbacks: {
              label: (ctx) => {
                const d = ctx.raw as any;
                return [
                  `Open:  $${d.o?.toFixed(2)}`,
                  `High:  $${d.h?.toFixed(2)}`,
                  `Low:   $${d.l?.toFixed(2)}`,
                  `Close: $${d.c?.toFixed(2)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            type:  "timeseries",
            time:  { unit: "minute", displayFormats: { minute: "h:mm a" } },
            grid:  { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color:         "rgba(240,240,240,0.35)",
              font:          { family: "DM Sans", size: 10 },
              maxTicksLimit: 8,
            },
          },
          y: {
            position: "right",
            grid:     { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color:    "rgba(240,240,240,0.35)",
              font:     { family: "DM Sans", size: 10 },
              callback: (v) => `$${Number(v).toFixed(2)}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [candles, symbol]);

  // Live update — only update last candle without full redraw
  useEffect(() => {
    if (!chartRef.current || !candles.length) return;
    const chart   = chartRef.current;
    const dataset = chart.data.datasets[0];
    const data    = dataset.data as any[];

    const last    = candles[candles.length - 1];
    const lastPoint = { x: last.t, o: last.o, h: last.h, l: last.l, c: last.c };

    if (data.length && data[data.length - 1].x === last.t) {
      // Update existing last candle
      data[data.length - 1] = lastPoint;
    } else {
      // Add new candle
      data.push(lastPoint);
      if (data.length > 390) data.shift();
    }

    chart.update("none"); // no animation for live updates
  }, [candles]);

  if (!candles.length) {
    return (
      <div style={{
        height,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        color:          "rgba(240,240,240,0.4)",
        gap:            "12px",
      }}>
        <span style={{ fontSize: "3rem" }}>🕯️</span>
        <span style={{ fontSize: "0.9rem" }}>
          {symbol ? `Waiting for ${symbol} data...` : "Select a stock to view chart"}
        </span>
      </div>
    );
  }

  return (
    <div style={{ height, position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}