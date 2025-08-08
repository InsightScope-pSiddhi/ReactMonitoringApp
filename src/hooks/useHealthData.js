// src/hooks/useHealthData.js
import { useState, useEffect } from "react";
import services from "../config/services";

export default function useHealthData() {
  const [healthHistoryMap, setHealthHistoryMap] = useState({});
  const [lastCounts, setLastCounts] = useState({});

  useEffect(() => {
    const fetchMetrics = async () => {
      const now = Date.now();

      await Promise.all(
        services.map(async (service) => {
          let status = 0; // default: down
          let currentCount = null;

          try {
            const res = await fetch(`${service.url}/metrics`);
            const text = await res.text();

            const regex =
              /http_request_duration_seconds_count\{[^}]*endpoint="\/health"[^}]*code="200"[^}]*\}\s+([\d.]+)/;

            const match = text.match(regex);
            if (match) {
              currentCount = parseFloat(match[1]);
              const lastCount = lastCounts[service.name];

              if (lastCount != null && currentCount > lastCount) {
                status = 1; // up
              }
            }
          } catch (err) {
            status = 0;
          }

          setLastCounts((prev) => ({
            ...prev,
            [service.name]: currentCount,
          }));

          setHealthHistoryMap((prev) => {
            const oldHistory = prev[service.name] || [];
            const updated = [...oldHistory, { time: now, status }];
            const fifteenMinutesAgo = now - 15 * 60 * 1000;

            return {
              ...prev,
              [service.name]: updated.filter((p) => p.time >= fifteenMinutesAgo),
            };
          });
        })
      );
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // every minute
    return () => clearInterval(interval);
  }, [lastCounts]);

  return healthHistoryMap;
}
