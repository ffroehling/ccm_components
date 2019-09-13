/**
 * @overview ccm component for quiz single choice question
 * @author Felix Fröhling <felix.froehling@smail.inf.h-brs.de> 2019
 * @license The MIT License (MIT)
 * @version latest (1.0.0)
 */

{

  var component  = {

    /**
     * unique component name
     * @type {string}
     */
    name: 'communication_testing',
    version: [1,0,0],
    
    ccm: './ccm-20.7.3.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {
        main: {
          inner: [
              {tag : "h1", inner : []},
              {tag : "h3", inner : 'Received instances immediatly after start'},
              {tag : "ul", inner : []},
              {tag : "h3", inner : 'Received instances with random delay'},
              {tag : "ul", inner : []},
              {tag : "h3", inner : 'Received instances with small delay'},
              {tag : "ul", inner : []}
          ]
        }
      }
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
      this.init = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
      };


      /**
       * is called once after the initialization and is then deleted
       */
      this.ready = async () => {
      };

      /*
       * Saves the dataset to the database and therefor notifies other instances
       */
      this.save = async () => {
        await this.datastore.store.set(this.dataset);
      }

      /*
       * Checks if the current iteration is finished. This is the case iff
       * 1) The instance received the message from every other instance AND
       * 2) The instance sent the own message
       */
      this.check_iter_finish = () => {
        //get's the html list index depending on the iteration
        let list_idx = (2* this.iteration) ; 

        //get the list
        let list = this.html.main.inner[list_idx].inner; 

        if((list.length == (this.total - 1)) && this.sent){
            //we sent our value AND the list is full -> next iteration
            this.iteration += 1;

            if(this.iteration > 3){
              //we are done -> display results if configured
              if(this.show_results){ //instance shall display the content
                let html = $.html(this.html.main);
                $.setContent(self.element, html);
              }
              else{ //no display wished
                $.setContent(self.element, "");
              }

            }
            else{
              //repeat the sending logic
              this.sent = false;
              setTimeout(this.write, 2000);
            }
        }
      };

      /*
       * Get's called upon dataset change notified by server
       * */
      this.onreceive = async (dataset) => {
        //get sent values of the dataset
        let rec_iteration = dataset.sent_value.iteration;
        let rec_value = dataset.sent_value.identifier;

        //first check if we received a value from a wrong iteration
        if(rec_iteration != this.iteration){
          alert(this.identifier + ': Received invalid iteration from other instance (' + rec_value + ') should be ' + this.iteration + ', but is ' + rec_iteration);
          return;
        }

        //create the list entry
        let li = {
          tag : 'li', 
          inner : rec_value
        };
       
        //get's the html list index depending on the iteration
        let list_idx = (2* this.iteration) ; 

        //get the list
        let list = this.html.main.inner[list_idx].inner; 

        //add the html
        list.push(li);

        //check if we are done
        this.check_iter_finish();
      };


      /*
       * Writes our local identifier value in the database with a delay depending on the iteration
       */
      this.write = async () => {
        //set iteration info(for error tracking) and our identifier for the test itself
        this.dataset.sent_value = {iteration : this.iteration, identifier : this.identifier};

        let send_func = async () => {
          await this.save();
          this.sent = true
          this.check_iter_finish();
        }

        //save it to db with some delay, dependening on the iteration
        if(this.iteration == 1){
          //Set delay if there's one
          send_func();
        }
        else if(this.iteration == 2){
          //do it with random delay
          setTimeout(
            send_func,
            Math.floor(Math.random() * 1000) + 10
          );
        }
        else{
          //do it with small delay (almost immediatly)
          setTimeout(
            send_func,
            10
          );
        }
      };

      /**
       * starts the instance
       */
      this.start = async () => {
        //get the dataset
        this.dataset = await $.dataset(this.datastore);

        //set the callback response
        this.datastore.store.onchange = this.onreceive.bind(this);

        //start at the first iteration
        this.iteration = 1; 

        //the instance did not sent a value yet
        this.sent = false;

        //set the header of the instance
        this.html.main.inner[0].inner = this.identifier;

        //at start, wait 2 seconds to be sure each instance is started
        setTimeout(this.write.bind(this), 2000);
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
