import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import services from "../config/services";

export default function Metrics() {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [metrics, setMetrics] = useState({
    rps: null,
    failureRate: null,
    memory: null,
    lastUpdated: null,
  });

  const parseMetrics = (text) => {
    const lines = text.split("\n");
    const getMetricValue = (name, filterFn) => {
      const match = lines.find((line) => {
        return line.startsWith(name) && (!filterFn || filterFn(line));
      });
      if (!match) return null;
      const parts = match.trim().split(" ");
      return parseFloat(parts[parts.length - 1]);
    };

    const total = getMetricValue("http_request_duration_seconds_count");
    const failures4xx = getMetricValue("http_request_duration_seconds_count", (l) =>
      l.includes('code="404"') || l.includes('code="400"')
    );
    const failures5xx = getMetricValue("http_request_duration_seconds_count", (l) =>
      l.includes('code="500"')
    );
    const memoryBytes = getMetricValue("process_working_set_bytes");

    const failureCount = (failures4xx || 0) + (failures5xx || 0);
    const failureRate = total && total > 0 ? (failureCount / total) * 100 : 0;

    return {
      rps: total || 0,
      failureRate,
      memory: memoryBytes ? memoryBytes / 1024 / 1024 : null,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  };

  const fetchMetrics = async (service) => {
    try {
      const res = await fetch(`${service.url}/metrics`);
      const text = await res.text();
      console.log("Raw metrics:\n", text);
      setMetrics(parseMetrics(text));
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setMetrics({
        rps: null,
        failureRate: null,
        memory: null,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    fetchMetrics(selectedService);
    const interval = setInterval(() => {
      fetchMetrics(selectedService);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedService]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          background: "#1e1e1e",
          color: "white",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Services</h3>
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => setSelectedService(service)}
            style={{
              padding: "8px",
              background:
                selectedService.name === service.name ? "#007acc" : "#333",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {service.name}
          </button>
        ))}
      </div>

      {/* Metrics Viewer */}
      <div
        style={{
          flex: 1,
          background: "#121212",
          color: "#d4d4d4",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        <h2>{selectedService.name} - Live Metrics</h2>
        {metrics.lastUpdated && (
          <small style={{ color: "#aaa" }}>
            Last updated: {metrics.lastUpdated}
          </small>
        )}

        {/* Requests/sec */}
        <div style={{ textAlign: "center" }}>
          <motion.div
            style={{
              fontSize: "2em",
              color: "#4cafef",
              fontWeight: "bold",
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {metrics.rps !== null ? `${metrics.rps.toFixed(0)} req/sec` : "N/A"}
          </motion.div>
          <p style={{ color: "#888" }}>
            Number of HTTP requests handled by the service per second.
          </p>
        </div>

        {/* Failure Rate Gauge */}
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#333"
                strokeWidth="15"
                fill="none"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                stroke="#ff5252"
                strokeWidth="15"
                fill="none"
                strokeDasharray={565}
                strokeDashoffset={
                  metrics.failureRate !== null
                    ? 565 - (565 * metrics.failureRate) / 100
                    : 565
                }
                strokeLinecap="round"
                initial={false}
                animate={{
                  strokeDashoffset:
                    metrics.failureRate !== null
                      ? 565 - (565 * metrics.failureRate) / 100
                      : 565,
                }}
                transition={{ duration: 1 }}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "1.2em",
              }}
            >
              {metrics.failureRate !== null
                ? `${metrics.failureRate.toFixed(2)}%`
                : "N/A"}
            </div>
          </div>
          <p style={{ color: "#888" }}>
            Percentage of requests resulting in 4xx or 5xx errors.
          </p>
        </div>

        {/* Memory Usage */}
        <div style={{ textAlign: "center" }}>
          <AnimatePresence>
            <motion.div
              key={metrics.memory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "1.5em",
                color: "#90ee90",
              }}
            >
              {metrics.memory !== null
                ? `${metrics.memory.toFixed(2)} MB`
                : "N/A"}
            </motion.div>
          </AnimatePresence>
          <p style={{ color: "#888" }}>
            Current working set memory usage of the service.
          </p>
        </div>
      </div>
    </div>
  );
}
