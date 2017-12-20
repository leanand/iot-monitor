const INFLUX_DB_NAME = 'iot_measurement';
const INFLUX_MEASUREMENT = 'machine_temperature';
const Influx = require('influx');

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: INFLUX_DB_NAME,
  schema: [
    {
      measurement: INFLUX_MEASUREMENT,
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


class ServerAgent{
  constructor(){
    this.checkDB();
    console.log("INFLUXDB is connected and DB exists");
  }

  async checkDB(){
    await influx.getDatabaseNames()
      .then(names => {
        if (!names.includes(INFLUX_DB_NAME)) {
          return influx.createDatabase(INFLUX_DB_NAME);
        }
      })
      .catch(err => {
        console.error(`Error creating Influx database!`);
      })
  }

  async writePoints(iot_no, temperature, machine_no){
    await influx.writePoints([
      {
        measurement: INFLUX_MEASUREMENT,
        tags: { machine: machine_no },
        fields: { iot_no: iot_no, temperature: temperature}
      }
    ]).catch(err =>{
      console.log("Error in writing points to INFLUXDB! ", err);
    });
  }
}

const serverAgent = new ServerAgent();

for(let i = 0; i < 100; i ++){
  ((j) => {
    setTimeout(function(){
      serverAgent.writePoints(1, j+200, 1);
    }, j * 500);
  })(i);
}
