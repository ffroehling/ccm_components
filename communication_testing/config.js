ccm.files[ 'config.js' ] = {
  "local" : {
    //defined datastore
    "datastore" : {
        "store": [ "ccm.store", { "name" : "ffroeh2s_communication_test",  "url": "wss://ccm2.inf.h-brs.de", "dataset" : "ffroeh2s_communication_test"}],
        "key": "ffroeh2s_communication_test"
    },

    //defined style
    "css" : ['ccm.load', './style.css']
  }
}
