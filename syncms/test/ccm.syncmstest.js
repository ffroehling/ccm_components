/**
 * @overview ccm component for syncms implementation
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 */

{

  var component  = {

    /**
     * unique component name
     * @type {string}
     */
    name: 'syncmstest',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {},
      //syncms : ['ccm.component', '../src/ccm.syncms-1.0.0.js']
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

      /**
       * init is called once after all dependencies are solved and is then deleted
       */
      this.init = async () => {};

      /**
       * is called once after the initialization and is then deleted
       */
      this.ready = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
      };

      this.handle_master_message = (msg) =>{
          this.show_message('Answering master requests...');

          //get synchronized local time  
          let t_save = this.syncms.getSynchronizedTime();

          //get waiting time for the message
          let t_wait = this.syncms.getLastWaitingTime();

          //get receive time
          let t_receive = t_save - t_wait;

          //build t_transmit
          let t_transmit = t_receive - msg.send_time;
          
          //build t_dev
          let t_dev = t_transmit - msg.slaves[this.syncms.identifier];

          //build the response
          let response = {
            sender : this.syncms.identifier,
            t_dev : t_dev
          };

          //and sync in
          this.syncms.sync_in(response);

          this.iterations += 1;

          if((this.iterations + 1)== this.test_iterations){
            this.show_message('Finished. You can get the results at master instance');
          }
      };

      this.handle_slave_message = (from, msg) =>  {
        let slave = msg.sender;
        let t_dev = msg.t_dev;

        //check if we already received it
        if(!this.result_data[slave]){
          this.result_data[slave] = [];
        }

        //add to results
        this.result_data[slave].push(t_dev);

        //check if we received all slave info, then we can go to the next iteration
        if(this.iteration_finished()){
          this.sync_out_test_packet();
        }
        else{
          this.log('Iteration is not finished yet');
        }
      };

      this.iteration_finished = () => {
        for(var i = 0; i < this.syncms.slaves.length; i++){
          let slave = this.syncms.slaves[i];
          if(!this.result_data[slave] || 
            !(this.result_data[slave].length == (this.iterations + 1))){
            return false;
          }
        }

        return true;
      }

      this.on_message = (type, msg, from) => {
        if(from == 'master'){
          this.handle_master_message(msg);
        }
        else if (this.master){
          this.log('Got sth from client');
          this.handle_slave_message(from, msg);
        }
      }


      this.log = (message) => {
        /*if(this.syncms.identifier){
          console.log('SLAVE ' + this.syncms.identifier + ': ' + message);
        }
        else{
          console.log('MASTER: ' + message);
        }*/
      };

      this.sync_out_test_packet = async (repeat) => {
        //this.log('syncing out test packet')
        this.iterations += 1;

        if(this.iterations < this.test_iterations){

          //sync out packet with expected transmit time for all slaves
          let to_send = {
            send_time : this.syncms.getSynchronizedTime(),
            slaves : {}
          };

          //get packet info
          let slaves = this.syncms.dataset.syncms.slaves;

          //Calculate the time_values
          Object.keys(slaves).forEach((slave) => {
            //e_transmit is avg time of measured transmit
            let e_transmit = 
              slaves[slave].offsets.reduce((a,b) => a + b, 0) 
              / slaves[slave].offsets.length;

            
            to_send.slaves[slave] = Math.round(e_transmit);
          });
          

          //and sync out the packet
          await this.syncms.sync_out(to_send);
        }
        else{
          //test finished
          this.show_message('Finished!');
          this.show_results();
        }
      };

      this.show_results = () => {
        let table = {
          tag : 'table',
          inner : [
            {
              tag : 'tr',
              inner :  [
                {
                  tag : 'th',
                  inner : 'Slave'
                },
                {
                  tag : 'th',
                  inner : 'Minimum t_dev [ms]'
                },
                {
                  tag : 'th',
                  inner : 'Median t_dev [ms]'
                },
                {
                  tag : 'th',
                  inner : 'Maximum t_dev [ms]'
                },
              ]
            }
          ]
        };

        Object.keys(this.result_data).forEach((s) => {
          let slave = this.result_data[s];
          let slave_number = parseInt(s.split(" ")[1]);
          let node = 0;

          if(slave_number <= (this.syncms.slaves.length/3)){
            node = "K1"; 
          }
          else if(slave_number <= 2*(this.syncms.slaves.length/3)){
            node = "K2";
          }
          else{
            node = "K3";
          }

          if(!this.nodes[node]){
            this.nodes[node] = []
          }

          //Add values to the node list
          this.nodes[node] = this.nodes[node].concat(slave);

          //calculate min max and median
          let t_dev_min = Math.min(...slave);
          let t_dev_max = Math.max(...slave);
          let t_dev_med = slave.sort((a,b) => a - b)[Math.floor(slave.length / 2)];

          
          //now append the row to the table
          let row = {
            tag : 'tr',
            inner : [
              {
                  tag : 'td',
                  inner : s,
                  class : 'slave_name'
                },
                {
                  tag : 'td',
                  inner : t_dev_min,
                  class : Math.abs(t_dev_min) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'
                },
                {
                  tag : 'td',
                  inner : t_dev_med,
                  class : Math.abs(t_dev_med) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'
                },
                {
                  tag : 'td',
                  inner : t_dev_max,
                  class : Math.abs(t_dev_max) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'
                },
            ]
          }

          //add to table
          table.inner.push(row);
        });

        //build the nodes:
        for(var n in this.nodes){
          let node = this.nodes[n];

          let t_dev_min = Math.min(...node); 
          let t_dev_max = Math.max(...node); 
          let t_dev_med = node.sort((a,b) => a - b)[Math.floor(node.length / 2)];

          let row = {
            tag : 'tr',
            inner : [
              {
                  tag : 'td',
                  inner : n,
                  class : 'node_name'
                },
                {
                  tag : 'td',
                  inner : t_dev_min,
                  class : Math.abs(t_dev_min) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'
                },
                {
                  tag : 'td',
                  inner : t_dev_med,
                  class : Math.abs(t_dev_med) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'

                },
                {
                  tag : 'td',
                  inner : t_dev_max,
                  class : Math.abs(t_dev_max) <= this.tresholds.t_dev ? 'measure_fine' : 'measure_fail'
                },
            ]
          }
          table.inner.push(row);
        }
        
        //build legend
        let legend  = {
          tag : 'div',
          id : 'legend',
          inner : [
            {
              tag : 'p',
              inner : 't_dev : Deviation of expected message transmit time to real transmit time'
            }
          ]
        }

        //build json copy object
        let json = {
          tag : 'textarea',
          id : 'json',
          inner : JSON.stringify(this.result_data),
        };

        //build whole html
        let html_obj = {
          tag : 'div',
          inner : [table, legend, json]
        };

        //and display
        let html = $.html(html_obj);
        $.setContent(self.element, html);
      }

      this.show_message = (message) => {
        let msg = {
          tag : 'h3',
          id : 'message',
          inner : message
        }

        let html = $.html(msg);

        $.setContent(self.element, html);
      }

      /**
       * starts the instance
       */
      this.start = async () => {
        //Set all slaves in syncms instance
        this.syncms.slaves = [];
        for (var i = 0; i < this.total; i++){
          this.syncms.slaves.push('Slave ' + (i+1));
        }

        //set callback
        this.syncms.on_message_receive = this.on_message.bind(this);

        //is not needed but let's transpose falsy undefined to false for slaves
        if(!this.master){
          this.master = false;
        }

        this.syncms.master = this.master;
        this.syncms.identifier = this.identifier;

        this.show_message('Preparing');

        try{
          //start syncms
          await this.syncms.start();

          //then init
          await this.syncms.initialize();

          this.show_message('Syncing');

          //synchronize clock
          await this.syncms.sync_clock();

          //set listener
          await this.syncms.listener();

          this.show_message('Waiting');
        }
        catch(err){
          this.show_message('Error occured: ' + err + '. Syncing not possible');
          return;
        }


        this.iterations = -1;
        this.failed_iterations = 0;
        this.failed_iteration_data = [];

        if(this.master){
          setTimeout( () => {
            this.nodes = {};
            this.slaves = {};
            this.show_message('Measuring');
            this.result_data = {};
            this.syncms.enable_sync_in();
            this.sync_out_test_packet();
          }, 4000);
        }
      };
    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
