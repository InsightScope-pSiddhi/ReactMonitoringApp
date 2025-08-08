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
import MiniHealthChart from "../components/MiniHealthChart";

const getStatusIcon = (status) => {
  if (status === "Healthy") return <Favorite color="success" />;
  if (status === "Unhealthy") return <Error color="error" />;
  return <HelpOutline color="warning" />;
};

const Ready = () => {
  const [readyData, setReadyData] = useState([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const [readyHistoryMap, setReadyHistoryMap] = useState({});

  useEffect(() => {
    const fetchServiceMetrics = async () => {
      const now = Date.now();

      await Promise.all(
        services.map(async (service) => {
          let isReady = 0;
          let readyCount = 0;

          try {
            const res = await fetch(`${service.url}/metrics`);
            const text = await res.text();

            const regex = /http_request_duration_seconds_count\{[^}]*code="200"[^}]*endpoint="\/ready"[^}]*\}\s+([\d.]+)/;
            const match = text.match(regex);

            if (match) {
              readyCount = parseFloat(match[1]);
              isReady = readyCount > 0 ? 1 : 0;
            } else {
              isReady = 0;
            }
          } catch (err) {
            isReady = 0;
            readyCount = 0;
          }

          // Store history for chart
          setReadyHistoryMap((prev) => {
            const oldHistory = prev[service.name] || [];
            const updated = [
              ...oldHistory,
              { time: now, status: isReady, count: readyCount },
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

    const fetchReady = async () => {
      const results = await Promise.all(
        services.map(async (service) => {
          try {
            const res = await fetch(`${service.url}/ready`);
            const text = await res.text(); // plain text, e.g. "Healthy" or "Unhealthy"
            return {
              ...service,
              status: text,
              error: false,
              lastChecked: new Date().toLocaleTimeString(),
            };
          } catch (error) {
            return {
              ...service,
              status: "Unhealthy",
              error: true,
              lastChecked: new Date().toLocaleTimeString(),
            };
          }
        })
      );
      setReadyData(results);
      setNextRefreshIn(30);
    };

    fetchServiceMetrics();
    fetchReady();

    const refreshInterval = setInterval(() => {
      fetchServiceMetrics();
      fetchReady();
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
        ✅ InsightScope – Service Readiness
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
        {readyData.map((service, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Grow in timeout={600}>
              <Card
                sx={{
                  height: "100%",
                  border: "2px solid",
                  borderColor:
                    service.status === "Healthy" ? "green" : "red",
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
                      Error fetching readiness data
                    </Typography>
                  ) : !service.status ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Status: {service.status}{" "}
                        {getStatusIcon(service.status)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Checked: {service.lastChecked}
                      </Typography>
                    </>
                  )}
                </CardContent>

                {/* Chart */}
                {Array.isArray(readyHistoryMap?.[service.name]) && (
                  <Box sx={{ p: 1 }}>
                    <MiniHealthChart
                      healthHistory={readyHistoryMap[service.name]}
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

export default Ready;
