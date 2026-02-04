import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
    // Only enable Socket.IO in development (localhost)
    const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1');

    if (!isLocalhost) {
        // Return a mock socket for production
        return {
            connect: () => { },
            disconnect: () => { },
            emit: () => { },
            on: () => { },
            off: () => { },
            connected: false
        };
    }

    if (!socket) {
        socket = io({
            path: '/socket.io',
            autoConnect: false,
        });
    }
    return socket;
};
