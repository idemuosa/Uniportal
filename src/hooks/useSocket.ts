import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (userId: string | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_room', userId);

    newSocket.on('notification', (data: { title: string, message: string, type: string }) => {
      toast[data.type === 'error' ? 'error' : 'success'](data.title, {
        description: data.message,
      });
    });

    newSocket.on('payment_verified', (data: { transactionId: string }) => {
      toast.success('Payment Verified!', {
        description: `Reference: ${data.transactionId}`,
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  return socket;
};
