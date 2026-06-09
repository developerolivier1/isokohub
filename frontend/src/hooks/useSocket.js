import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      query: { userId: user?._id, tenantId: user?.tenantId },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user?._id, user?.tenantId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  return { socket: socketRef.current, emit, on };
}
