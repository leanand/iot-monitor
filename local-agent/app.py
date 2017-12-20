import sys
import requests
import threading

class LocalAgent:

  def __init__(self, machine_no, time_interval, increment):
    self.machine_no = machine_no
    self.time_interval = time_interval
    self.current_temp = 200
    self.increment = 1
    self.incremental_value = increment
    self.set_interval(self.send_temp, time_interval)
    # self.send_temp()

  def get_temperature(self):
    if(self.increment == 1):
      self.current_temp += self.incremental_value
    else:
      self.current_temp -= self.incremental_value
    
    if(self.current_temp >= 299):
      self.increment = 0
    
    if(self.current_temp <= 200):
      self.increment = 1
    return self.current_temp

  def send_temp(self):
    print("Sending temperature log")
    r = requests.post("http://localhost:3030/log", json = {
          "machine_no" : self.machine_no,
          "iot_no": 1,
          "temperature": self.get_temperature(),
          "timestamp" : 123123123
        })
    print("Log sent")

  def set_interval(self, func, sec):
    def func_wrapper():
      self.set_interval(func, sec)
      func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t

machine_no = int(sys.argv[1])
time_interval = int(sys.argv[2])
increment = int(sys.argv[3])
localAgent = LocalAgent(machine_no, time_interval, increment)
