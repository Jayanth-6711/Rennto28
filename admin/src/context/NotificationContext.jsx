import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { WS_BASE_URL } from "../config/Api";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem("adminNotifications");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [toast, setToast] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const wsRef = useRef(null);
    const seenIdsRef = useRef(new Set());
    const reconnectTimerRef = useRef(null);

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("adminNotifications", JSON.stringify(notifications));
        } catch (e) {
            console.warn("Storage quota exceeded", e);
        }
    }, [notifications]);

    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.6);
            });
        } catch (e) {
            console.warn("Audio not available:", e);
        }
    };

    const connect = () => {
        const wsUrl = `${WS_BASE_URL}/ws/notifications/`;

        console.log(`[WS] 📡 Attempting connection to ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] ✅ Connected successfully");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Trigger global data refresh for any relevant message
                if (data.type === "new_registration" || data.type === "table_refresh" || data.type === "property_update") {
                    triggerRefresh();
                }

                if (data.type === "new_registration") {
                    const dedupKey = `${data.message}__${data.time}`;
                    if (seenIdsRef.current.has(dedupKey)) return;
                    seenIdsRef.current.add(dedupKey);

                    const newNotif = {
                        id: Date.now(),
                        message: data.message,
                        time: data.time,
                        type: "new_registration",
                        route: "/owners",
                        routeState: { filter: "pending" },
                        read: false,
                    };

                    setNotifications(prev => {
                        const alreadyExists = prev.some(
                            n => n.message === data.message && n.time === data.time
                        );
                        if (alreadyExists) return prev;
                        return [newNotif, ...prev];
                    });

                    setToast(data.message);
                    setTimeout(() => setToast(null), 5000);
                    playNotificationSound();
                }
            } catch (err) {
                console.error("[WS] Error parsing message:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("[WS] ❌ WebSocket Error:", err);
        };

        ws.onclose = (e) => {
            if (e.code !== 1000) {
                console.warn(`[WS] ⚠️ Disconnected (code=${e.code}). Retrying in 5s...`);
                reconnectTimerRef.current = setTimeout(connect, 5000);
            } else {
                console.log("[WS] 💤 Connection closed normally");
            }
        };
    };

    useEffect(() => {
        let isMounted = true;
        let connectDelayTimer = null;

        const startConnection = () => {
            if (!isMounted) return;
            connect();
        };

        // Delay connection slightly to handle React Strict Mode double-mount
        connectDelayTimer = setTimeout(startConnection, 100);

        return () => {
            isMounted = false;
            if (connectDelayTimer) clearTimeout(connectDelayTimer);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

            const ws = wsRef.current;
            if (ws) {
                // Remove listeners before closing to avoid 'error' logs during expected unmount
                ws.onopen = null;
                ws.onmessage = null;
                ws.onerror = null;
                ws.onclose = null;

                if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
                    ws.close(1000);
                }
                wsRef.current = null;
            }
        };
    }, []);



    const clearNotifications = () => {
        setNotifications([]);
        localStorage.removeItem("adminNotifications");
        seenIdsRef.current.clear();
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    return (
        <NotificationContext.Provider value={{
            notifications,
            toast,
            clearNotifications,
            markAsRead,
            removeNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
