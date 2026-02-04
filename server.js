import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store active users per quotation: { quotationId: { socketId: userData } }
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    socket.on('join_quotation', ({ quotationId, user }) => {
      socket.join(`quotation_${quotationId}`);

      // Store user data
      if (!activeUsers.has(quotationId)) {
        activeUsers.set(quotationId, new Map());
      }
      activeUsers.get(quotationId).set(socket.id, {
        uid: user.uid,
        firstName: user.firstName,
        photoURL: user.photoURL,
        email: user.email
      });

      // Get all active users for this quotation
      const usersInRoom = Array.from(activeUsers.get(quotationId).values());

      // Notify everyone in the room about active users
      io.to(`quotation_${quotationId}`).emit('users_in_quotation', usersInRoom);

      console.log(`User ${user.firstName} joined quotation_${quotationId}`);
    });

    socket.on('leave_quotation', (quotationId) => {
      socket.leave(`quotation_${quotationId}`);

      // Remove user from active users
      if (activeUsers.has(quotationId)) {
        activeUsers.get(quotationId).delete(socket.id);

        // Notify remaining users
        const usersInRoom = Array.from(activeUsers.get(quotationId).values());
        io.to(`quotation_${quotationId}`).emit('users_in_quotation', usersInRoom);

        // Clean up empty quotations
        if (activeUsers.get(quotationId).size === 0) {
          activeUsers.delete(quotationId);
        }
      }

      console.log(`Socket ${socket.id} left quotation_${quotationId}`);
    });

    socket.on('update_quotation', (data) => {
      // Broadcast to everyone else in the room
      const { quotationId, ...changes } = data;
      socket.to(`quotation_${quotationId}`).emit('quotation_updated', changes);
    });

    socket.on('user_typing', ({ quotationId, field, user }) => {
      socket.to(`quotation_${quotationId}`).emit('user_typing_indicator', {
        field,
        user: {
          firstName: user.firstName,
          photoURL: user.photoURL
        }
      });
    });

    socket.on('user_focus', ({ quotationId, field, user }) => {
      socket.to(`quotation_${quotationId}`).emit('user_focus_change', {
        field,
        user: {
          uid: user.uid,
          firstName: user.firstName,
          photoURL: user.photoURL,
          color: user.color || '#3b82f6' // Default to blue if no color
        },
        isFocused: true
      });
    });

    socket.on('user_blur', ({ quotationId, field, user }) => {
      socket.to(`quotation_${quotationId}`).emit('user_focus_change', {
        field,
        user: { uid: user.uid },
        isFocused: false
      });
    });

    socket.on('disconnect', () => {
      // Remove user from all quotations
      activeUsers.forEach((users, quotationId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);

          // Notify remaining users
          const usersInRoom = Array.from(users.values());
          io.to(`quotation_${quotationId}`).emit('users_in_quotation', usersInRoom);

          // Clean up empty quotations
          if (users.size === 0) {
            activeUsers.delete(quotationId);
          }
        }
      });

      console.log('Client disconnected', socket.id);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io ready`);
  });
});
