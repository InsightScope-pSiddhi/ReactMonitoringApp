// src/components/MiniHealthChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MiniHealthChart = ({ healthHistory }) => {
  // Prepare chart data
  const data = healthHistory.map((point) => ({
    time: new Date(point.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: point.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 1]}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => (v === 1 ? "UP" : "DOWN")}
        />
        <Tooltip
          formatter={(value) => (value === 1 ? "Healthy" : "Unhealthy")}
        />
        <Line
          type="stepAfter"
          dataKey="status"
          stroke="#4caf50"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniHealthChart;
