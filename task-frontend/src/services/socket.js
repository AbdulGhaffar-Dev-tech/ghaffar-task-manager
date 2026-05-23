import { io } from 'socket.io-client';

let socket;

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://task-manager-production-30e0.up.railway.app'; // 👈 Your live Railway URL (No /api suffix)
export const initiateSocketConnection = (user) => {
  if (!user) return null;

  // Safely resolve the user ID regardless of payload structure
  const rawUserId = user.id || user._id || (user.user && (user.user.id || user.user._id));
  
  if (!rawUserId) {
    console.error('❌ Socket Initialization Error: No valid user ID found in payload.');
    return null;
  }

  const sanitizedUserId = String(rawUserId).trim();

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      secure: true // Crucial for production HTTPS/WSS layers
    });
    console.log(`🔌 Attempting to establish socket connection at: ${SOCKET_URL}`);
  }
  
  // Register standard and admin rooms on connection execution
  if (socket.connected) {
    registerRooms(socket, sanitizedUserId, user.role || (user.user && user.user.role));
  } else {
    socket.once('connect', () => {
      console.log(`✅ Socket connected successfully! Assigned ID: ${socket.id}`);
      registerRooms(socket, sanitizedUserId, user.role || (user.user && user.user.role));
    });
  }
  
  return socket;
};

// Helper function to safely subscribe users to their correct channels
const registerRooms = (socketInstance, userId, role) => {
  console.log(`🔗 Handshake sent to lock user into personal channel: ${userId}`);
  socketInstance.emit('join', userId);

  if (role === 'admin') {
    console.log("🔒 Handshake sent to secure admin broadcast room access");
    socketInstance.emit('join_admin_room');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('❌ Disconnecting socket streaming links...');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;