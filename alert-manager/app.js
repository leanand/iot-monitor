const amqp = require('amqplib');
const CONSTANT = require('../constant');
const twilio = require('twilio');

class AlertManager{
  constructor(){
    this.connectAmqp();
    this.twiloClient = new twilio(CONSTANT.ACCOUNTSID, CONSTANT.AUTHTOKEN);
  }

  connectAmqp(){
    return amqp.connect("amqp://localhost").then((conn)=>{
      this.amqpConn = conn;
      console.log("AMQP connected! ");
      return conn.createChannel();
    }).then((channel)=>{
        this.amqpChannel = channel;
        console.log("Channel created! ");
        channel.assertExchange(CONSTANT.QUEUE_NAME, 'fanout', {durable: false});
        return channel.assertQueue('', {exclusive: true});
    }).then((queue)=>{
      this.amqpChannel.bindQueue(queue.queue, CONSTANT.QUEUE_NAME, '');
      return this.consumeMsg(queue.queue);
    });
  }

  async consumeMsg(queueName){
    console.log("Waiting for message");
    return this.amqpChannel.consume(queueName, (msg)=>{
      if(msg != null){
        let content = msg.content.toString();
        let data = JSON.parse(content);
        console.log("The message received is ", data);
        this.checkAlert(data);
        // this.writePoints(data.iot_no, data.temperature, data.machine_no, data.timestamp);
      }
    });
  }

  checkAlert(data){
    if(data.temperature >= 299){
      this.sendMessage(data);
    }
  }

  sendMessage(data){
    let Msg = `Alert: Temperature above the limit Machine: ${data.machine_no}, Temp: ${data.temperature}`;
    this.twiloClient.messages.create({
      body: Msg,
      to: '+16073041349',  // Text this number
      from: '+15752632996' // From a valid Twilio number
    })
    .then((message) => {
      console.log("Message sent!"); 
    });
  }
}

const alertManager = new AlertManager();