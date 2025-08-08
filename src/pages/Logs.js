import React, { useState, useEffect, useRef } from "react";
import services from "../config/services";

export default function Logs() {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const logEndRef = useRef(null);

  const fetchLogs = async (service) => {
    setLoading(true);
    try {
      const res = await fetch(`${service.url}/logs`);
      const text = await res.text();
      setLogs(text || "No logs available.");
    } catch (err) {
      setLogs(`Error fetching logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 3 seconds for the selected service
  useEffect(() => {
    fetchLogs(selectedService);
    const interval = setInterval(() => {
      fetchLogs(selectedService);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [selectedService]);

  // Auto-scroll to bottom when logs change
//   useEffect(() => {
//     if (logEndRef.current) {
//       logEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [logs]);

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

      {/* Logs viewer */}
      <div
        style={{
          flex: 1,
          background: "#121212",
          color: "#d4d4d4",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        <h3>{selectedService.name} Logs</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              background: "#1e1e1e",
              padding: "10px",
              borderRadius: "4px",
              margin: 0,
            }}
          >
            {logs}
            <div ref={logEndRef} />
          </pre>
        )}
      </div>
    </div>
  );
}
