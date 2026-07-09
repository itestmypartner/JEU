import { io, type Socket } from 'socket.io-client';
import { getAccessToken, refreshAccessToken } from './api.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_URL, {
    // Fonction d'auth : appelée à CHAQUE (re)connexion → toujours le token courant.
    auth: (cb) => cb({ token: getAccessToken() ?? token }),
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  // Sur échec de connexion (souvent un token expiré après une mise en veille du
  // serveur), on rafraîchit le token : la prochaine tentative automatique de
  // reconnexion réutilisera un token valide via la fonction `auth` ci-dessus.
  socket.on('connect_error', () => {
    void refreshAccessToken();
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
