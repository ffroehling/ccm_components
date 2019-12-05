
ccm.files[ 'syncmstest.config.js' ] = {
  "local" : {
    "syncms" : ['ccm.instance', '../src/ccm.syncms-1.0.0.js', {
        //some attributes for quiz component itself here
        "datastore" : {
            "store": [ "ccm.store", { "name" : "ffroeh2s_syncmstest",  "url": "wss://ccm2.inf.h-brs.de", "dataset" : "ffroeh2s_syncmstest"}],
            "key": "ffroeh2s_syncmstest",
        },

        /*"slaves" : [
          'Slave 1',
          'Slave 2',
          'Slave 3',
          'Slave 4',
          'Slave 5',
          'Slave 6',
          'Slave 7',
          'Slave 8'
        ],*/

        //config values
        "clock_sync_wait" : 4000,
        "init_timeout" : 5000,
        "clock_sync_timeout" : 40000,
        "clock_sync_iterations" : 5,
        "clock_sync_cycle_delay" : 1000,
        "init_timeout" : 7000
      }
    ],
    'css' : ['ccm.load', 'style.css'],
    'master' : false,
    'test_iterations' : 15,
    'iteration_timeout' : 60000,
    'tresholds' : {
      //Deviation of expected transmit time to real transmit time
      't_dev' : 1000
    }
  }
}
