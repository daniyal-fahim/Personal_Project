import amqp from "amqplib";

let channel;

const initRabbitMQ = async () => {
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue('stock_updates', { durable: true });
};

const sendToQueue = (message) => {
  if (channel) {
    channel.sendToQueue('stock_updates', Buffer.from(message), { persistent: true });
  }
};

const consumeQueue = (callback) => {
  if (channel) {
    channel.consume('stock_updates', callback);
  }
};

export { initRabbitMQ, sendToQueue, consumeQueue };
