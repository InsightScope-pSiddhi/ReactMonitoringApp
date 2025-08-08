import React, { useEffect, useState } from "react";
import services from "../config/services";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Box,
  Grow,
  Stack,
} from "@mui/material";
import { Favorite, Error, HelpOutline, AccessTime } from "@mui/icons-material";
import useHealthData from "../hooks/useHealthData";
import MiniHealthChart from "../components/MiniHealthChart";

const getStatusIcon = (status) => {
  if (status === "Healthy") return <Favorite color="success" />;
  if (status === "Unhealthy") return <Error color="error" />;
  return <HelpOutline color="warning" />;
};

const Health = () => {
  const [healthData, setHealthData] = useState([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [healthHistoryMap, setHealthHistoryMap] = useState({});

  useEffect(() => {
    const fetchServiceMetrics = async () => {
      const now = Date.now();

      await Promise.all(
        services.map(async (service) => {
          let isHealthy = 0;
          let healthCount = 0;

          console.log(`🔍 Checking ${service.name} /metrics...`);

          try {
            const res = await fetch(`${service.url}/metrics`);
            console.log(`✅ Fetch successful for ${service.name}`);

            const text = await res.text();
            console.log(`📄 Metrics text from ${service.name}:\n`, text);

            const regex = /http_request_duration_seconds_count\{[^}]*code="200"[^}]*endpoint="\/health"[^}]*\}\s+([\d.]+)/;


            const match = text.match(regex);
            console.log(`🔎 Regex match for ${service.name}:`, match);

            if (match) {
              healthCount = parseFloat(match[1]); // ✅ keep the real count
              console.log(`📊 ${service.name} /health count value:`, healthCount);
              isHealthy = healthCount > 0 ? 1 : 0;
            } else {
              console.log(`⚠️ No matching /health metric found for ${service.name}`);
              isHealthy = 0;
            }

            console.log(
              `${service.name} /health metric final status:`,
              isHealthy ? "UP" : "DOWN"
            );
          } catch (err) {
            console.error(`❌ Error fetching metrics for ${service.name}:`, err);
            isHealthy = 0;
            healthCount = 0;
          }

          // ✅ Update history with both status & count
          setHealthHistoryMap((prev) => {
            const oldHistory = prev[service.name] || [];
            const updated = [
              ...oldHistory,
              { time: now, status: isHealthy, count: healthCount },
            ];

            const fifteenMinutesAgo = now - 15 * 60 * 1000;
            const filtered = updated.filter(
              (point) => point.time >= fifteenMinutesAgo
            );

            return {
              ...prev,
              [service.name]: filtered,
            };
          });

          return null;
        })
      );
    };

    const fetchHealth = async () => {
      const results = await Promise.all(
        services.map(async (service) => {
          try {
            const res = await fetch(`${service.url}/health`);
            const data = await res.json();
            return {
              ...service,
              data,
              error: false,
              lastChecked: new Date().toLocaleTimeString(),
            };
          } catch (error) {
            return {
              ...service,
              data: null,
              error: true,
              lastChecked: new Date().toLocaleTimeString(),
            };
          }
        })
      );
      setHealthData(results);
      setNextRefreshIn(30);
    };

    fetchServiceMetrics();
    fetchHealth();

    const refreshInterval = setInterval(() => {
      fetchServiceMetrics();
      fetchHealth();
    }, 30000);

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        bgcolor: "#000000ff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h3" align="center" gutterBottom fontWeight="bold" color="white">
        🩺 InsightScope – Service Health
      </Typography>

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1}
        mb={4}
      >
        <AccessTime color="primary" />
        <Typography variant="h6" color="white">
          Next Check In: {nextRefreshIn}s
        </Typography>
      </Stack>

      <Grid container spacing={4} justifyContent="center" alignItems="stretch">
        {healthData.map((service, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Grow in timeout={600}>
              <Card
                sx={{
                  height: "100%",
                  border: "2px solid",
                  borderColor:
                    service.data?.status === "Healthy" ? "green" : "red",
                  boxShadow: 5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "scale(1.03)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {service.name}
                  </Typography>

                  {service.error ? (
                    <Typography color="error">
                      Error fetching health data
                    </Typography>
                  ) : !service.data ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Status: {service.data.status}{" "}
                        {getStatusIcon(service.data.status)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {service.data.totalDuration}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Checked: {service.lastChecked}
                      </Typography>

                      <Box mt={2}>
                        <Typography variant="body2" fontWeight="bold">
                          Dependencies:
                        </Typography>
                        <ul>
                          {Object.entries(service.data.entries || {}).map(
                            ([key, value], idx) => (
                              <li key={idx}>
                                {key}: {value.status}
                              </li>
                            )
                          )}
                        </ul>
                      </Box>
                    </>
                  )}
                </CardContent>

                {/* Graph at bottom */}
                {Array.isArray(healthHistoryMap?.[service.name]) && (
                  <Box sx={{ p: 1 }}>
                    <MiniHealthChart
                      healthHistory={healthHistoryMap[service.name]}
                    />
                  </Box>
                )}
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Health;
