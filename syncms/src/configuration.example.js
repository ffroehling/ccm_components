/*####GENERAL CONFIG#####*/
"datastore" : {
    "store": [ "ccm.store", { "name" : "SOME_STORE",  "url": "SOME_URL", "dataset" : "SOME_DATASET}],
    "key": "SOME_KEY",
},

"slaves" : [
  "Slave 1",
  "Slave 2",
  "Slave 3",
  "Slave 4",
  "Slave 5",
  "Slave 6",
  "Slave 7",
  "Slave 8"
],

//config values
"clock_sync_wait" : 4000,
"init_timeout" : 5000,
"clock_sync_timeout" : 40000,
"clock_sync_iterations" : 5,
"clock_sync_cycle_delay" : 1000,
"init_timeout" : 7000
/*####END GENERAL CONFIG#####*/

/*####MASTER ONLY#####*/
"master" : true
/*####END MASTER ONLY#####*/

/*####SLAVE ONLY#####*/

"master" : false,
//Of course Slave 1 is only an example. Use the slave-id of the instance here.
"identifier" : "Slave 1" 

/*####SLAVE ONLY#####*/
