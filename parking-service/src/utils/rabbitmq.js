const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'parking.events';
const DLX_NAME = 'dlx.parking.events';

let channel = null;
let connection = null;

const connect = async () => {
    try {
        if (!connection) {
            connection = await amqp.connect(RABBITMQ_URL);
            connection.on('error', (err) => {
                console.error('[RabbitMQ] Connection error', err);
                connection = null;
                channel = null;
            });
            connection.on('close', () => {
                console.error('[RabbitMQ] Connection closed');
                connection = null;
                channel = null;
                setTimeout(connect, 5000); // Reconnect attempt
            });
        }
        if (!channel) {
            channel = await connection.createChannel();
            
            // Setup DLX
            await channel.assertExchange(DLX_NAME, 'topic', { durable: true });
            
            // Setup Main Exchange
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
            
            console.log('[RabbitMQ] Connected and channel created');
        }
    } catch (err) {
        console.error('[RabbitMQ] Failed to connect', err);
        setTimeout(connect, 5000);
    }
};

const publishEvent = async (routingKey, data) => {
    if (!channel) {
        await connect();
    }
    try {
        const payload = JSON.stringify(data);
        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(payload));
        console.log(`[RabbitMQ] Published event ${routingKey}`);
    } catch (err) {
        console.error(`[RabbitMQ] Error publishing event ${routingKey}`, err);
    }
};

const subscribeEvent = async (routingKey, queueName, callback) => {
    if (!channel) {
        await connect();
    }
    try {
        const dlqName = `dlq.${queueName}`;
        
        // Assert DLQ
        await channel.assertQueue(dlqName, { durable: true });
        await channel.bindQueue(dlqName, DLX_NAME, routingKey);

        // Assert Main Queue with DLX configuration
        await channel.assertQueue(queueName, {
            durable: true,
            deadLetterExchange: DLX_NAME,
            deadLetterRoutingKey: routingKey
        });
        
        await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);
        
        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`[RabbitMQ] Received event ${routingKey} on queue ${queueName}`);
                    await callback(data);
                    channel.ack(msg);
                } catch (err) {
                    console.error(`[RabbitMQ] Error processing message on queue ${queueName}:`, err);
                    // Reject message and do not requeue -> send to DLQ
                    channel.nack(msg, false, false);
                }
            }
        });
        console.log(`[RabbitMQ] Subscribed to ${routingKey} on queue ${queueName}`);
    } catch (err) {
        console.error(`[RabbitMQ] Error subscribing to ${routingKey}`, err);
    }
};

module.exports = {
    connect,
    publishEvent,
    subscribeEvent
};
