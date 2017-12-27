const amqp = require('amqplib');
const CONSTANT = require('../constant');
const express = require('express');
const bodyParser = require('body-parser');

class ServerAgent{
  constructor(){
    this.connectAmqp();
  }
  connectAmqp(){
    return amqp.connect("amqp://localhost").then((conn)=>{
      this.amqpConn = conn;
      console.log("AMQP connected! ");
      return conn.createChannel();
    }).then((channel)=>{
        this.amqpChannel = channel;
        console.log("Channel created! ");
        return channel.assertExchange(CONSTANT.QUEUE_NAME, 'fanout', {durable: false});
    });
  }
  publish(data){
    this.amqpChannel.publish(CONSTANT.QUEUE_NAME, '', new Buffer(JSON.stringify(data)));
  }
}

const serverAgent = new ServerAgent();
const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send());

app.post('/log', (req, res) =>{
  let data = req.body;
  console.log("The data is", data);
  serverAgent.publish(data);
  res.send({status: true});
});

app.listen(3030, () => console.log('Server app listening on port 3030!'))
