import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = (userId) => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'] // Forces persistent connection modes
    });
    console.log('Connecting socket...');
  }
  
  if (userId) {
    socket.emit('join', userId);
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;