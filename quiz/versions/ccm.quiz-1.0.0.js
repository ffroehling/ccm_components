/**
 * @overview ccm component for realtime quiz 
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
    name: 'quiz',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      html: {
        main: {
          inner: [
              {tag : "h3", id : 'question', inner : ""},
              {tag : "div", id : 'quiz_area', inner : ''}
          ]
        },
        sync_initialize : {
          inner : [
            {
              tag : 'div',
              id : 'state_wrapper',

              inner : {
                tag : "h3", class : 'state_heading', 
                id : 'state_initialize', 
                inner : "" 
              }
            }
          ]
        },
        sync_clocksync : {
          inner : [
            {
              tag : 'div',
              id : 'state_wrapper',

              inner : {
                tag : "h3", class : 'state_heading', 
                id : 'state_initialize', 
                inner : "" 
              }
            }
          ]
        }
      },

      //File dependencies
      game_selection  : ['ccm.load', 'resources/module_versions/pre_game_1.0.0.js'],
      game_master     : ['ccm.load', 'resources/module_versions/game_master_1.0.0.js'],
      game_player     : ['ccm.load', 'resources/module_versions/game_player_1.0.0.js'],
      db_pregame      : ['ccm.load', 'resources/module_versions/database_1.0.0.js'], 
      db_game         : ['ccm.load', 'resources/module_versions/database_game_1.0.0.js'],
      helper          : ['ccm.load', 'resources/module_versions/helper_1.0.0.js'],
      ui              : ['ccm.load', 'resources/module_versions/ui_1.0.0.js'],
      constants       : ['ccm.load', 'resources/module_versions/constants_1.0.0.js'],

      //syncms dependency
      syncms : ['ccm.component', 'https://ffroehling.github.io/ccm_components/syncms/src/versions/ccm.syncms-1.0.0.js'],

      //user dependency
      user: [ "ccm.instance", "https://ccmjs.github.io/akless-components/user/versions/ccm.user-8.3.1.js", [ "ccm.get", "https://ccmjs.github.io/akless-components/user/resources/configs.js", "guest" ] ],

      /*
       * default configs for syncms
       */
      syncms_config : {
        clock_sync_wait : 2000, //Delay when master starts clock syncing
        init_timeout : 5000, //Timeout for init fail (not all slaves joined)
        clock_sync_timeout : 10000, //Timeout for clock sync success
        clock_sync_iterations : 2, //Iterations for Clock syncing (Christians algorithm)
        master_init_delay : 2000, //Delay of master instance at startup
      },
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

      /*
       * Dummy function to pass not null to syncms component. Not really 
       * needed, but kept in anyways
       */
      this.syncms_message_receive = (type, message, sender) => {}

      /*
       * Build the configuration for syncms instance
       *
       * @param {Object} current_game : The current game instance 
       * @param {Boolean} master : Indicates whether this instance is master 
       * or not
       * @param {Object} user_obj : The current user object
       *
       * @returns {Object} The config for syncms
       */
      this.get_syncms_config = (current_game, master, user_obj) => {
        //build array with user_ids
        let user_ids = [];

        current_game.dataset.game.players.forEach((player) => {
          user_ids.push(player.user_id);
        });

        let config = {
          datastore : {
              store: this.data.store, 
              key: this.data.key
          },

          master : master,
          slaves : user_ids,

          //callback which is called when a message is received
          on_message_receive : this.syncms_message_receive,
        };

        //append identifier for slave
        if(!master){
          config.identifier = user_obj.user_id;
        }

        //merge config with basic config given in configuration file
        Object.assign(config, this.syncms_config);

        return config;
      }

      this.do_sync = async () => {
        return this.syncms_instance.initialize().then(() => {
          let html = $.html(self.html.sync_clocksync);
          $.setContent(this.element, html);
        })
        .then(this.syncms_instance.sync_clock)
        .then(this.syncms_instance.listener);
      }

      this.synchronize = async (master) => {
        let html = $.html(self.html.sync_initialize);
        $.setContent(this.element, html);

        if(master){
          await sleep(this.syncms_config.master_init_delay);
        }

        return this.do_sync();
      }


      this.on_finish = () => {
        //remove the button
        this.ui_instance.clear_procedure_content();
        this.ui_instance.clear_method_content();
        this.ui_instance.render();

        //restart the app
        this.start();
      };

      this.pre_game_finish = async (current_game, master, user_obj) => {
        //Get config for syncms
        let config = this.get_syncms_config(current_game, master, user_obj);

        //create instance
        this.syncms_instance = await this.syncms.instance(config);

        //start the instance
        await this.syncms_instance.start();

        //synchronize all slaves
        await this.synchronize();

        //determine game logic 
        var game = master ? game_master : game_player;
       
        //define the ui object which is handling the main ui stuff
        this.ui_instance = ui.Instance(self.ccm, this.element);

        //start game procedure depending if we're master or not
        let game_proc = game.Instance.bind(game)(self.ccm, current_game, this.syncms_instance, this.behaviour, this.questions, this.template, this.ui_instance, user_obj, action, this.gamification, this.on_finish.bind(this));

        //and start the game
        await game_proc.start();
      }

      this.unify_question_config = () => {
        //get config object
        let config = this.question_config;

        //create if not existing
        config = config || {};

        //if not existent, use defaults
        config.timeout = config.timeout || 0; //no timelimit by default
        config.prepare_time = config.prepare_time || 3000;
        config.mode = config.mode || "mode_first"; //mode_first is default mode
        config.next = config.next || "manual";
        config.correct_answer_duration = config.correct_answer_duration || 5000;
        config.auto_next_time = config.auto_next_time || 3000


        //store back global
        this.question_config = config;

        //unify questions by given config
        this.questions.forEach((question) => {
          if(!question.mode){
            question.mode = config.mode;
          }
          
          if(!question.correct_answer_duration){
            question.correct_answer_duration = config.correct_answer_duration;
          }

          if(!question.auto_next_time){
            question.auto_next_time = config.auto_next_time;
          }

          if(!question.timeout && question.timeout !== 0){
            question.timeout = config.timeout;
          }

          //When question mode is mode_first, disable timeout
          if(question.mode == "mode_first"){
            question.timeout = 0;
          }

          if(!question.prepare_time && question.prepare_time !== 0){
            question.prepare_time = config.prepare_time;
          }

          if(!question.next){
            question.next = config.next;
          }

          //build a hash of the question
          let hash = function() {
            //build configuration of quiz config
            
            let hash_config = 
              this.mode + 
              this.timeout.toString() +
              this.prepare_time.toString() +
              this.next;

            //Include component src and version
            let component_config = this.component ?
              this.component.component.url + 
              (this.component.component.version ? this.component.component.version.toString() : "")
              : "";

            //Include instance configuration
            let instance_config = this.component ? this.component.config : "";
            let text = this.text ? this.text : "";

            //build the hash and return it
            return SHA512(
              hash_config + 
              component_config + 
              instance_config +
              text
            );
          }

          //bind it
          question.hash = hash.bind(question);
        });
      }

      /*
       * Sets the template for syncms from given config
       */
      this.set_sync_template = () => {
        this.html.sync_initialize.inner[0].inner.inner = this.template.sync.init;
        this.html.sync_clocksync.inner[0].inner.inner = this.template.sync.init;
      }

      /*
       * Builds a quiz id based on the configured questions and configuration
       * options. This is needed due to checks that quiz can only be played
       * if the same quiz configuration is available at each instance
       *
       * @returns {String} - A unique hash of the configured questions
       */
      this.build_quiz_id = () => {
        let hashes = "";
        this.questions.forEach((question) => {
          hashes += question.hash();
        });

        return SHA512(hashes);
      }

      /**
       * starts the instance
       */
      this.start = async () => {
        //first do stuff we need to to at the beginning

        //Add the templates for states of synchronization
        this.set_sync_template()

        //unify question config 
        this.unify_question_config();

        //build the quiz id
        this.build_quiz_id();

        //get dataset
        let dataset = await $.dataset( this.data );

        //let user login
        await this.user.login();

        //Get username
        var user = this.user.data().user;

        //Make it available to rest of cmponent
        self.username = user;

        //hide loading indicator and show start screen
        let html = $.html(self.html.main);
        $.setContent(this.element, html);

        //create database object for game selection
        self.db = await db_game_selection.Instance.bind(db_game_selection)(self.ccm, this.data.store, dataset, SHA512);

        //create game selection instance
        var gs = game_selection.Instance.bind(game_selection)(self.ccm, self.db, this.element, self.username, this.build_quiz_id(), this.template.pre_game, this.pre_game_finish.bind(this));
        //and start it immediatly to get first screen
        gs.start();
      };

    }
  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
