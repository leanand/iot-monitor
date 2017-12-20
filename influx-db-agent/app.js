const Influx = require('influx');
const CONSTANT = require('../constant');
const amqp = require('amqplib');

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: CONSTANT.INFLUX_DB_NAME,
  schema: [
    {
      measurement: CONSTANT.INFLUX_MEASUREMENT,
      fields: {
        iot_no: Influx.FieldType.INTEGER,
        temperature: Influx.FieldType.INTEGER
      },
      tags: [
        'machine'
      ]
    }
  ]
})


class InfluxDBAgent{
  constructor(){
    this.checkDB().then(()=>{
      return this.connectAmqp();
    });
  }

  async connectAmqp(){
    return amqp.connect("amqp://localhost").then((conn)=>{
      this.amqpConn = conn;
      console.log("AMQP connected! ");
      return conn.createChannel();
    }).then((channel)=>{
        this.amqpChannel = channel;
        console.log("Channel created! ");
        return channel.assertQueue(CONSTANT.QUEUE_NAME);
    }).then(()=>{
      return this.consumeMsg();
    });

  }

  async checkDB(){
    return influx.getDatabaseNames()
      .then(names => {
        if (!names.includes(CONSTANT.INFLUX_DB_NAME)) {
          return influx.createDatabase(CONSTANT.INFLUX_DB_NAME);
        }
      }).then(()=>{
        console.log("INFLUXDB is connected and DB exists");
      }).catch(err => {
        console.error(`Error creating Influx database! : ${err}`);
      });
  }

  async consumeMsg(){
    console.log("Waiting for message");
    return this.amqpChannel.consume(CONSTANT.QUEUE_NAME, (msg)=>{
      if(msg != null){
        let content = msg.content.toString();
        let data = JSON.parse(content);
        console.log("The message received is ", data);

        this.writePoints(data.iot_no, data.temperature, data.machine_no, data.timestamp);
      }
    });
  }

  writePoints(iot_no, temperature, machine_no, timestamp){
    return influx.writePoints([
      {
        measurement: CONSTANT.INFLUX_MEASUREMENT,
        tags: { machine: machine_no },
        fields: { iot_no: iot_no, temperature: temperature}
        // timestamp: timestamp
      }
    ]).catch(err =>{
      console.log("Error in writing points to INFLUXDB! ", err);
    });
  }
}

const influxDBAgent = new InfluxDBAgent();
/*amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'hello';

    ch.assertQueue(q, {durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, function(msg) {
      console.log(" [x] Received %s", msg.content.toString());
    }, {noAck: true});
  });

});*/