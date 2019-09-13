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
    
    ccm: './ccm/versions/ccm-20.7.2.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {
        main: {
          inner: [
              {tag : "h3", inner : 'Received instances without time delay'},
              {tag : "ul", inner : []},
              {tag : "h3", inner : 'Received instances with time delay'},
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
       * Get's called upon dataset change notified by server
       * */
      this.onreceive = async (dataset) => {

        let li = {
          tag : 'li', 
          inner : dataset.sended_value
        };

        if(!this.time_delay){
          this.html.main.inner[1].inner.push(li);

          if(this.html.main.inner[1].inner.length == (this.total-1)){
            /*
             * we received anything without delay 
              -> trigger now the communication with delay
            */
            this.send_delay(); 
          }
        }
        else{
          this.html.main.inner[3].inner.push(li);

          if(this.html.main.inner[3].inner.length == (this.total-1)){
            /*
             * we received anything with delay 
              -> trigger now the rendering of the result
            */
            if(this.show_results){
              let html = $.html(this.html.main);
              $.setContent(self.element, html);
            }
            else{
              $.setContent(self.element, "");
            }
          }
        }
      };

      /*
       * Set's the flag for delay action and retriggers the transmission
       */
      this.send_delay = () => {
        this.time_delay = true;

        //again wait five seconds for all instances to be synchronus
        setTimeout(this.write.bind(this), 5000);
      };


      /*
       * Writes our local identifier value in the database
       * if this.delay is set, there's a random delay before saving
       */
      this.write = async () => {
        //set the value
        this.dataset.sended_value = this.identifier;

        //save it to db
        if(this.time_delay){
          //Set delay if there's one
          setTimeout(async () => {
            await this.datastore.store.set(this.dataset);
          }, Math.floor((Math.random() * 1000) + 50));
        }
        else{
            //else do it immediatly
            await this.datastore.store.set(this.dataset);
        }
      };

      /**
       * starts the instance
       */
      this.start = async () => {
        this.dataset = await $.dataset(this.datastore);
        this.datastore.store.onchange = this.onreceive.bind(this);
        this.time_delay = false;

        //at start, wait 5 seconds to be sure each instance is started
        setTimeout(this.write.bind(this), 5000);
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
