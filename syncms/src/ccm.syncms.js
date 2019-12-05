/**
 * @overview ccm component for syncms implementation
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 * @reference https://ieeexplore.ieee.org/document/1181396
 */

{

  var component  = {

    /**
     * unique component name
     * @type {string}
     */
    name: 'syncms',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {},
      //Before the clock sync process starts, the master waits this time of seconds to write the start command. This is to be sure, that all slaves have enough time to get to the same state
      clock_sync_wait : 2000,

      //When receiving a clock sync start command from master, the clocks must be synchronized for EVERY SLAVE after this amount of time. Otherwise clock sync fails on every slave
      clocksync_timeout : 8000,

      //With this delay the slaves are sending their current local clock on clock sync. Therefore it defines the interval value for clock sync
      clock_sync_cycle_delay : 1000,

      //Amount of iterations for clock sync (how often is the local clock of the slaves sent)
      clock_sync_iterations : 2,

      //Master checks after this amount of time if he received anything he needs for clock sync (slave info). If it is NOT THERE (e.g. missing data for a slave) clock_sync will be rejected at master
      master_clock_sync_finish : 5000,

      //Time when the initalization must be completed, otherwise the promise rejects
      init_timeout : 5000,

      //Time that the master waits before starting the initalizatin
      init_wait : 2000,
    },

    /**
     * for creating instances of this component
     * @constructor
     */
    Instance: function () {

      "use strict";

      /**
       * own reference for inner functions
       * @type {Instance}
       */
      const self = this;

      /**
       * shortcut to help functions
       * @type {Object.<string,function>}
       */
      let $;

      /* ### CONSTANTS DEFINITIONS ### */

      //Message receive codes for 
      
      //message properly synced outslave
      var MESSAGE_SYNC_OUT = 1;   

      //message which should not be there, therefore not synced
      var MESSAGE_SYNC_IN = 2;    

      //message from other slave not synced
      var MESSAGE_CLIENT = 3;     

      //message which should not be there, therefore not synced
      var MESSAGE_UNKNOWN = 4;    

      /* ### END CONSTANTS DEFINITIONS ### */

      /**
       * init is called once after all dependencies are solved and is then deleted
       */
      this.init = async () => {};

      /**
       * ready is called once after the initialization and is then deleted
       */
      this.ready = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
      };

      /*
       * save saves a dataset to the datastore
       * TODO: Param defintion here
       * @param {Object} dataset - The dataset to be saved or null for default
       */
      this.save = async (dataset) => {
        if(!dataset){
          dataset = this.dataset;
        }

        await this.datastore.store.set(dataset);
      },


      /**
       * check_slave_join checks if all defined slaves are connected
       * / answered to master request
       * @returns {Boolean} - true if all slaves are connected, false otherwise
       */
      this.check_slave_join = () => {
        if((this.slaves_initialized > -1) && this.slaves_initialized < (this.slaves.length - 1)){
          this.slaves_initialized++;
          return false;
        }
        else {
          this.slaves_initialized = -1; //no more initalilzation needed
          this.resolve(0);
          return true;
        }
      },


      /**
       * getSynchronizedTime gives the synchronizes global system time
       * @param offset {Date} - any offset which is substracted from the time
       * @returns the global system time
       */
      this.getSynchronizedTime = (offset) => {

        if(this.master){ //Masters time is valid for the whole system so for the master node itself
          return new Date().getTime();
        }
        else if(offset){ //returns a time object with subtracted offset which can be used to get the sended time of a message
          return (new Date().getTime() - this.time_diff) - this.offset;
        }
        else { //returns masters time
          return new Date().getTime() + this.time_diff;
        }
      }

      /*#####SECTION TESTING#####*/

      /**
       * getExpectedTransmitTimes returns a list of all slaves, where
       * each slave object has the expected transmit time set.
       * This is beeing used for testing services only
       * @returns {Array} - List of slaves with expected transmi time
       */
      this.getExpectedTransmitTimes = () =>{
        return this.dataset.syncms.slaves;
      }

      /**
       * getLastWaitingTime returns the time the instance waited until 
       * delivery of the last master packet to the parent application.
       * This is beeing used for testing services only
       * @returns {Number} - Last waiting time in [ms]
       */
      this.getLastWaitingTime = () => {
        return this.last_wait;
      }

      /**
       * getSyncInfo returns the syncrhonization info for a slave instance
       * This is beeing used for testing services only
       */
      this.getSyncInfo = () => {
        return {
          time_diff : this.time_diff,
          time_transmit : this.time_offset
        };
      }

      /*#####END SECTION TESTING#####*/


      /**
       * onchange_slave_initalization is called at a slave instance when the 
       * instance is in init-state and a message from another instance arrives
       * @param {Object} dataset - the updated dataset
       */
      this.onchange_slave_initalization = async (dataset) => {
        //set our own dataset
        if(!dataset.syncms.init_active){
          //ignore any non master messages
          return;
        }


        this.dataset = await $.dataset(dataset);
        //delete(this.dataset.syncms.init_active);

        this.dataset.syncms.value = this.identifier;

        if(this.needs_initialization){
          this.needs_initialization = false;

          //ping pong the message
          await this.save();

          //also check if global sync is now established
          this.check_slave_join();
          return;
        }
        else if(! this.check_slave_join()){
          return;
        }
      }

      /**
       * onchange_master_initalization is called at master instance when
       * instance is in init-state and a message from another instance has 
       * been received
       * @param {Object} dataset - the updated dataset
       */
      this.onchange_master_initalization = ds => {
        this.check_slave_join();
      }


      /**
       * onchange_master_clock_sync is called at master instance when
       * instance is in clock_sync-state and a message from another instance has 
       * been received
       * @param {Object} dataset - the updated dataset
       */
      this.onchange_master_clock_sync = async (dataset) => {
        //dataset = await $.dataset(dataset);

        //get current time in milliseconds
        var current_time = new Date().getTime();

        //Only one new slave at a time can occur
        for (var slave_id in dataset.syncms.slaves) {
          if(dataset.syncms.slaves[slave_id].timestamp && !(this.cs_synchronized_slaves.indexOf(slave_id) > -1)){
            dataset.syncms.slaves[slave_id].current_time = current_time;

            //dataset.syncms.slaves[slave_id].random_value = Math.floor((Math.random() * 1000) + 1);;
            //number of received items
            var num_received = this.dataset.syncms.slaves[slave_id].times_received || 0;

            //update it in datastructure
            this.dataset.syncms.slaves[slave_id].times_received = num_received + 1;

            //get round trip time
            var rtt =  current_time - (this.cs_timestamp + (num_received * 1000));

            //calculate half rtt
            var offset = Math.round(rtt/2);

            //add this to our transfer times for sync_out information
            this.transfer_times.push(offset);

            //get clock difference from slave time
            //get slave time and add
            var slave_time = dataset.syncms.slaves[slave_id].timestamp;   //timestamp from slaves clock at sending time
            var difference = current_time - (slave_time + offset);

            //store this in global dataset, which will be saved when all slaves answered
            if(!this.dataset.syncms.slaves[slave_id].offsets){
              this.dataset.syncms.slaves[slave_id].offsets = [];
              this.dataset.syncms.slaves[slave_id].time_diffs = [];
            }

            this.dataset.syncms.slaves[slave_id].offsets.push(offset);
            this.dataset.syncms.slaves[slave_id].time_diffs.push(difference);

            //add to synchronized slaves
            if(num_received == this.clock_sync_iterations){
              this.cs_synchronized_slaves.push(slave_id);
            }

            break; 
          }
        };

        if(this.cs_synchronized_slaves.length == this.slaves.length){
          //Clock sync is finished => handle this and notify slaves

          //disable messaging
          this.datastore.store.onchange = null;

          //notify the slaves with theier values
          await this.save(); 

          //resolve the promise
          this.resolve();
        }
      }

      /**
       * onchange_slave_clock_sync is called at slave instance when
       * instance is in clocksync-state and a message from another instance has 
       * been received
       * @param {Object} dataset - the updated dataset
       */
      this.onchange_slave_clock_sync = async (dataset) => {
          /*
           * To distinguish beetwenn master and slave message we can use the 
           * clocksync flag. If it's a master message, there's clocksync 
           * attribute. Ignore all slave messages.
           */
          if(!dataset.syncms.clocksync){
            return;
          }

          if(dataset.syncms.slaves[this.identifier].offsets){
            dataset.syncms.slaves[this.identifier].offsets.sort(
              (a, b) => a - b);
            dataset.syncms.slaves[this.identifier].time_diffs.sort(
              (a, b) => a - b);

            let length = dataset.syncms.slaves[this.identifier]
              .time_diffs.length;
            let median_idx = Math.floor(length / 2);

            this.time_offset = Math.max.apply(Math, dataset.syncms
              .slaves[this.identifier].offsets);
            this.time_diff = dataset.syncms.slaves[this.identifier]
              .time_diffs[median_idx]; //Get this in dependency of num of syncs

            this.datastore.store.onchange = null;
            this.resolve();

            return;
          }
          else if(!this.clock_sended){
            this.clock_sended = true;

            //write local time to object
            //this.dataset.syncms.slaves[this.identifier].timestamp = 
            //new Date().getTime();

            var counter = 0;

            var send_clock = async () => {
              let start = new Date().getTime();
              this.dataset.syncms.slaves[this.identifier].timestamp = 
                new Date().getTime() ; 
              this.dataset.syncms.slaves[this.identifier].sender = 
                this.identifier;
             
              await this.save();
              counter += 1;


              //test have shown a delay of 35ms, but there's need to 
              //investigate further
              if(counter <= this.clock_sync_iterations){
                setTimeout(send_clock, this.clock_sync_cycle_delay - 35); 
              }
              let end = new Date().getTime();

            };

            send_clock();
          }
      }

      /*#####SECTION INTERFACE#####*/

      /*
       * sync_clock syncs the clock of all slaves with master slave by 
       * Cristian's algorithm. 
       * see http://www.springerlink.com/content/j5250h34013874jv/
       *
       * @returns {Promise} which resolves iff clock sync succeeds and rejects
       * otherwise
       */
      this.sync_clock = async () => {
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;

          let timeout = 0;


          if(this.master){
            //set timeout value
            timeout = this.clock_sync_timeout + this.clock_sync_wait;

            /*
             * Master send's out first synchronisation command after some time
             * This is, to be sure that all slaves are state updated to clock sync
             * If not neccessary, clock_sync_wait can be set to zero
             */
            setTimeout(async () => {
              //initalize array for transfer times used for sync_out
              this.transfer_times = [];

              this.datastore.store.onchange = this.onchange_master_clock_sync;

              this.dataset.syncms.clocksync = {}; //dummy object, just to write something in the database. Slaved can identify the master message upon this obj
              this.cs_synchronized_slaves = []; //each handled slave will be stored in this array

              this.cs_timestamp = new Date().getTime();    
              await this.save(); //This notifies slaves about master is measuring time now

              //Add success handler after the time
              setTimeout(async () => {

                //When all rtts have been received it should be fine
                var success = true;

                for(var i = 0; i < this.dataset.syncms.slaves.length; i++){
                  if(this.dataset.syncms.slaves[i].offsets.length != this.slaves.length){
                    success = false;
                    break;
                  }
                }

                if(!success){
                  this.datastore.store.onchange = null;
                  this.reject('Clock sync not finished in time');    
                }
              }, this.master_clock_sync_finish); 

            }, this.clock_sync_wait); 
          }
          else {
            this.clock_sended = 0;
            this.datastore.store.onchange = this.onchange_slave_clock_sync;

            timeout = this.clock_sync_timeout;
            //this.dataset_original = JSON.parse(JSON.stringify(this.dataset));

            setTimeout(() => {

              /*
               * TODO Problem: We need this in order to disable a failed 
               * clock sync, but unfortunately this destroys any application, 
               * as onchange is null then and no messages are received. 
               * What todo? For now, we leave it commented out, as there's
               * not better alternative. Let's try it.
               *
               * this.datastore.store.onchange = null;
              */

              if(!this.time_diff){ 
                this.reject('Clock sync not finished in time');    
              }
            }, this.clock_sync_timeout);
          }
        });
      },

      /**
       * initialize is the entry point for any application, so it should be 
       * called first. It initializes the instance and checks, if all 
       * instances are connected.
       *
       * @returns Promise wich resolves iff all instances are connected
       * or fails otherwise after a specified timeout
       */
      this.initialize = async () => {
        return new Promise(async (resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        
          //Num of slaves whih are initialized
          this.slaves_initialized = 0;

          //if master -> initialize syncms object
          if(this.master){
            //Create item for each slave in datastore
            var obj = {};

            this.slaves.forEach(function(item){
              obj[item] = {id : item}; 
            });

            //create syncms obj
            this.dataset.syncms = {};

            //set this for write out
            this.dataset.syncms.slaves = obj;

            //set flag
            this.dataset.syncms.init_active = true;

            //set our onchange method
            this.datastore.store.onchange = this.onchange_master_initalization;

            //init sync_in var
            this.sync_in_active = false;

            //Algorithm:
            //save this -> This notifies slaves which just invoke the save method WITHOUT modifying data
            //Reason: We can count the numbers of saves and if they are equal to num slaves we know each slave joined this syncms instance
            setTimeout(async () => {
              await this.save();
            }, this.init_wait);
          }
          else {
            this.needs_initialization = true; //indicate that we are not connected yet
            this.datastore.store.onchange = this.onchange_slave_initalization;
          }

          //handle case that initalization failed
          if(this.init_timeout){
            setTimeout( () => {
              /*
               * condition: when not all slaves joined syncms
               * note: we cannot call check_slave_join here, as this would increase the counter
              */
              if((this.slaves_initialized > -1) && this.slaves_initialized < (this.slaves.length - 1)){
                this.reject('Initalization failed'); //this.slaves.length - this.slaves_initialized);
              }
            }, this.init_timeout);
          }
        });
      },

      /*
       * enable_sync_in enables sync in flag of master. Only if this flag is
       * set, sync in is possible.
       */
      this.enable_sync_in = async () => {
        if(this.master){
          this.sync_in_active = true;
          this.receive_queue = [];
        }
      }

      /*
       * disable_sync_in disables sync in flag of master.
       * Therefore no more messages are accepted. Also, the receive-queue is
       * cleared.
       */
      this.disable_sync_in = async () => {
        if(this.master){
          this.sync_in_active = false;
          this.receive_queue = null;
        }
      }

      /*
       * sync_out Syncs out a message_obj. If resolve_immediatly is not set, 
       * the promise resolves when all slaves got the message,
       * otherwise it resolves immediatly
       *
       * @param {Object} message_obj - The object that needs to be transmitted
       * @param {Boolean} resolve_immediatly -  When false, the promise
       * resolves when the message is synced out at every slave. When true
       * it resolves immediatly
       *
       * @returns {Promise} which resolves on success and fails on errors
       *
       */
      this.sync_out = async (message_obj, resolve_immediatly) => {
        return new Promise(async (resolve, reject) => {

          if(!this.master){
            reject('Only Master is allowed to do sync out');
            return;
          }

          let max_transfer = Math.max(...this.transfer_times) + 0;  

          var send_obj = {
            'from' : 'master',
            'deliver' : this.getSynchronizedTime() + max_transfer,
            'message' : message_obj
          }

          this.dataset.syncms.message = send_obj;

          //logs

          //Save which finally notifies slave
          await this.save();

          //resolve the promise whether now or when all slaves got the message
          if(resolve_immediatly){
            resolve();
          }
          else{
            /*TODO: Maybe we should consider taking overhead of setTimeout
             * into account. For now it is fine this way*/
            setTimeout( () => {
              resolve();
            }, max_transfer);
          }
        });
      }

      /*
       * sync_out Syncs out a message_obj. If resolve_immediatly is not set, 
       * the promise resolves when all slaves got the message,
       * otherwise it resolves immediatly
       *
       * @param {Object} message_obj - The object that needs to be synced in
       *
       * @returns {Promise} which resolves on success and fails on errors
       *
       */
      this.sync_in = async (message_obj) => {
        return new Promise(async (resolve, reject) => {
          //only slaves are allowed to sync in
          if(this.master){
            reject('Only Slaves are allowed to do sync in');
            return;
          }

          let send_obj = {   
            'from' : this.identifier,
            'send_timestamp' : this.getSynchronizedTime(),
            'message' : message_obj
          }

          //set message object
          this.dataset.syncms.message = send_obj;

          //Deliver message
          await this.save()

          //resolve promise
          resolve();
        });
      }

      /*#####END SECTION INTERFACE#####*/

      /*
       *deliver_queue pops the received messages by fifo and calls sync in
       callback.
       */
      this.deliver_queue = () => {

        /* The Following section MUST only be executed once at a time
         * Reason: 
         *  deliver_queue get's invoked upon every sync_in message receive
         *  So, if multiple events running on the loop and some bad luck
         *  it might happen that a message is delivered twice, when it
         *  wasn't removed from the list at time of process change(scheduling)
         *  Also the order could be broken because of this.
         *
         *  Therefore we need a simple locking mechanism
         */

        //wait previous lock and then aquire lock
        while(this.deliver_lock){}
        this.deliver_lock = true;

        if(this.receive_queue.length > 0){
          //just unlock anyways
          let msg = this.receive_queue.shift();  

          this.deliver_lock = false;

          
          if(msg != null){
            this.on_message_receive(MESSAGE_SYNC_IN, msg.message, msg.from);
            return;
          }
        }
        else{
          this.deliver_lock = false;
        }

      }

      /**
       * on_receive_master is called when the master instance receives a message
       * @param {Object} dataset - the updated dataset
       */
      this.on_receive_master = async (dataset) => {
        var rec = dataset.syncms.message;

        if(!(rec && rec['from'])){
          /*this is a message we didn't get from a syncms instance, 
            or sth is completely wrong*/
          
          //deliver this to the specified callback
          if(this.on_message_receive){
            this.on_message_receive(MESSAGE_UNKNOWN, dataset);
            return;
          }
        }

        //cancel when sync in not in progress
        if(!this.sync_in_active){
          return;
        }


        /*from now on we can syncin the message */
        
        //first push message in queue
        this.receive_queue.push(rec)

        let sending_time = rec.send_timestamp; //time the slave sent the message
        let max_transfer = Math.max(...this.transfer_times); //max rtt/2

        let waiting_period = this.getSynchronizedTime() - sending_time;


        if(waiting_period >= max_transfer){
          //we can deliver this this right now
          this.deliver_queue();
        }
        else {
          //wait the difference and then do it
          setTimeout(() => {
            this.deliver_queue();
          }, max_transfer - waiting_period);
        }
      }

      /**
       * on_receive_slave is called when a slave instance receives a message
       * @param {Object} dataset - the updated dataset
       */
      this.on_receive_slave = async (dataset) => {
        var rec = dataset.syncms.message;

        //first check that message seems to be valid
        if(!(rec && rec['from'])){
          /*this is a message we didn't get from a syncms instance, 
            or sth is completely wrong*/
          
          //deliver this to the specified callback
          if(this.on_message_receive){
            this.on_message_receive(MESSAGE_UNKNOWN, dataset);
            return;
          }
        }

        if(rec['from'] == 'master'){
            //message needs to get synced
            let deliver = rec['deliver'];
            let wait = deliver - this.getSynchronizedTime();
            
            this.last_wait = wait;

            if(wait > 0){
              setTimeout(() => {

                //resolve
                if(this.on_message_receive){
                  this.on_message_receive(MESSAGE_SYNC_OUT, rec.message, 'master');
                  return;
                }
              }, wait);
            }
            else{
              
              //resolve
              if(this.on_message_receive){
                this.on_message_receive(MESSAGE_SYNC_OUT, rec.message, 'master');
                return;
              }
            }
        }
        else{
            if(this.on_message_receive){
              this.on_message_receive(MESSAGE_CLIENT, rec.message, rec.from);
              return;
            }
        }
      }


      /**
       * listener sets the instance for production running, after init
       * Call this only if init and clock_sync succeeded
       *
       * @returns {Promise} which resolves always
       */
      this.listener = () => {
        return new Promise((resolve, reject) => {
          if(this.master){
            this.datastore.store.onchange = this.on_receive_master.bind(this);
          }
          else{
            this.datastore.store.onchange = this.on_receive_slave.bind(this);
          }

          resolve();
        });
      }

      /**
       * start starts the instance
       */
      this.start = async () => {
        //first load dataset
        this.dataset = await $.dataset(this.datastore);
      };
    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
