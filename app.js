const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
  pingTimeout: 5000, // Thời gian chờ để server chấp nhận client đã mất kết nối (mặc định là 5000ms)
  pingInterval: 10000,
});

// Đặt tiêu đề Access-Control-Allow-Origin cho phép truy cập từ http://localhost:3000
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

let connectedClients = [];
let messages = [];
let offlineMessages = new Map(); // Sử dụng Map để lưu trữ tin nhắn khi client offline

// Xử lý kết nối từ client
io.on('connection', (socket) => {
  console.log('Client đã kết nối', socket.id);
  // connectedClients.push(socket.id); // Thêm socket.id mới vào mảng connectedClients
  socket.on('join', (clientId) => {
    const userIndex = connectedClients.findIndex(
      obj => obj?.clientId == clientId
    );
    if (
      userIndex == -1
    ) {
      connectedClients.push({ clientId, socketId: socket.id });
      io.to(socket.id).emit("fetchMessage", messages);
    } else {

      connectedClients[userIndex].socketId == socket.id;
      if (connectedClients[userIndex].isDisconnected == 1) {
        console.log('reconnect: ', socket.id);
        io.to(socket.id).emit("reconnect", messages);
        connectedClients[userIndex].isDisconnected == 0;
      }
    }
  });

  // Xử lý sự kiện khi client disconnect
  socket.on('disconnect', () => {
    const userDisconnect = connectedClients.findIndex(user => user?.socketId == socket.id);
    if (userDisconnect !== -1) {
      connectedClients[userDisconnect].isDisconnected = 1;
    }
    // Thực hiện các xử lý khác tại đây (ví dụ: cập nhật trạng thái, thông báo cho các client khác, vv.)
    // socket.on('chat message', (msg) => {
    //   console.log('chat message disconnected : ', msg);
    //   const id = socket.id;
    //   if (!offlineMessages.has(id)) {
    //     offlineMessages.set(id, []);
    //   }
    //   offlineMessages.get(id).push(msg);
    // });
  });

  socket.on('chat message', (msg) => {
    messages.push(msg);
    io.timeout(1000).emit('chat message', msg, ack => {
    });
    // Xử lý tin nhắn nhận được ở đây
  });

  socket.on('get clients', () => {
    socket.emit('client list', connectedClients);
  });

});

server.listen(4000, () => {
  console.log('Server đang lắng nghe tại cổng 4000');
});