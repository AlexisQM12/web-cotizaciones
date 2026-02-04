import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io({
            path: '/socket.io',
            autoConnect: false,
        });
    }
    return socket;
};
