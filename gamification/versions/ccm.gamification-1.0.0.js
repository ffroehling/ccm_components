/**
 * @overview ccm component for basic gamification implementation
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
    name: 'gamification',
    version: [1,0,0],
    
    ccm: 'https://ccmjs.github.io/ccm/versions/ccm-20.7.2.js',
    /**
     * default instance configuration
     * @type {object}
     */
    config: {
      //html: {},
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
       * init is called once after all dependencies are solved 
       * and is then deleted
       */
      this.init = async () => {
      };


      /**
       * get_player_in_list returns a player in the list identified by an id
       *
       * @param {String} id : The id of the player
       *
       * @returns {Object} The player if found, null else.
       */
      this.get_player_in_list  = (id) => {
        let result =  this.players.filter(player => {
          return player.user_id == id;
        });

        if(result){
          return result[0];
        }

        return null;
      }

      /**
       * add_points_to_player adds retrieved poitns to a player
       *
       * @param {String} id : The id of the player
       * @param {Number} points : The points to add
       */
      this.add_points_to_player = (id, points) => {
        let player = this.get_player_in_list(id);

        if(player){
          player.points += points;
        }
      };

      /**
       * mode_order calculates points based on the time and correctness
       * @param {Number} answer - The percentage of the correctness
       * @param {Number} max_answer_points - Maximum amount of points for the 
       *  correct answer
       * @param {Number} max_time_points - Maximum amount of points for the 
       * being fast 
       *
       * @returns {Number} - the retrieved points
       */
      this.mode_order = (answer, time, max_answer_points, max_time_points) => {
        //the calculations is based on a simple model
        
        //points for correctness is just the percentage of the points
        //answer is given as percentage, so no problem
        let answer_points = max_answer_points * (answer/100);

        let points  = answer_points;

        //time points only matter when at least sth was right
        if(answer_points > 0){
          //time_points are based on two configured thresholds
          if(time <= this.threshold_time_fast){ //get all points when really fast
            points += max_time_points;
          }
          else{
            //calculate difference of needed time and fast 
            let over_fast_time = time - this.threshold_time_fast;

            if(over_fast_time > 5){
              over_fast_time = 5;
            }

            points = points 
              + (max_time_points - (over_fast_time * (max_time_points/5)));
          }
        }

        return points;
      }

      /**
       * mode_relax calculates mode_relax which means that only answer counts
       * @param {Number} answer - The percentage of the correctness
       * @param {Number} max_answer_points - Maximum amount of points for the 
       *  correct answer
       *
       * @returns {Number} The retrieved points which is the percentage
       * of the maximum points
       */
      this.mode_relax = (answer, max_answer_points) => {
        return  max_answer_points * (answer/100);
      }

      /*###INTERFACE SECTION FOR OTHER COMPONENTS###*/
      /**
       * calculate_points calculates given points based on
       * - the mode
       * - the answer (correctness)
       * - the needed time 
       *
       * @param {Number} answer - The percentage of the correctness
       * @param {String} mode - either 'mode_order' or 'mode_relax'
       * @param {Number} max_answer_points - Maximum amount of points for the 
       *  correct answer
       * @param {Number} max_time_points - Maximum amount of points for the 
       * being fast 
       *
       * @returns {Number} - the retrieved points
       */
      this.calculate_points = 
        (answer, mode, time, max_answer_points, max_time_points) => {

        //guards
        if(!answer && answer !== 0){
          //we can't do anything without an answer
          return;
        }

        if(!mode){
          mode = this.mode_default;
        }

        //when time is not given, this is bad, but let's use a default value
        if(!time){
          /*
           * for mode_relax or time_first it does not matter at all since
           * this is determined by the mode => so we can safely set this here 
          */
          time = 2000;
        }

        //when points or time for the question are not provided use defaults
        if(!max_answer_points){
          max_answer_points = this.default_answer_points;
        }

        if(!max_time_points){
          max_time_points = this.default_time_points;
        }


        let points = 0;

        //so let's do some logic now depending on the mode
        if(mode == 'mode_order'){
          points = 
            this.mode_order(answer, time, max_answer_points, max_time_points);
          this.last_max_points = max_answer_points + max_time_points;
        }
        else if(mode == 'mode_relax'){
          points = this.mode_relax(answer, max_answer_points);
          this.last_max_points = max_answer_points;
        }

        this.last_points = points;

        return points;
      }

      /**
       * show_last_points renders the last retrieved points of the player
       */
      this.show_last_points = () => {
        let text = '';
        if(this.last_points == this.last_max_points ){
          text = this.template.perfect;
        }
        else if(this.last_points >= (this.last_max_points * 0.8)){
          text = this.template.good;
        }
        else if(this.last_points >= (this.last_max_points * 0.5)){
          text = this.template.not_bad;
        }
        else{
          text = this.template.better;
        }

        let div =  {
          tag : 'div',
          id : 'show_points',
          inner : [
            {tag : 'h3', inner : text},
            {tag : 'p', inner : this.last_points}
          ]
        }

        let html = $.html(div);
        $.setContent(self.element, html);
      }

      /**
       * show_scoreboard renders the socreboard which is animated by css
       */
      this.show_scoreboard = () => {
        let sorted_list = 
          this.players.sort((a, b) => a.points < b.points)

        let div =  {
          tag : 'div',
          id : 'scoreboard',
          inner : [
            {tag : 'ul', inner : []}
          ]
        }

        sorted_list.forEach((player, index) => {
          if(index > 7){
            return;
          }

          let li = {
            tag : 'li',
            inner : [
              {
                tag : 'span',
                class : 'position',
                inner : (index+1).toString()
              },
              {
                tag : 'span',
                class : 'player_name',
                inner : player.username,
              },
              {
                tag : 'span',
                class : 'points',
                inner : player.points.toString(),
              }
            ]
          };

          //add to list
          div.inner[0].inner.push(li);
        });

        let html = $.html(div);
        $.setContent(self.element, html);
      }

      /**
       * set_players sets a list of all players
       *
       * @param {Array} players - the list of the players
       */
      this.set_players = (players) => {
        this.players = players;
        this.unify_config();
      }


      /*###END INTERFACE SECTION FOR OTHER COMPONENTS###*/

      /**
       * ready is called once after the initialization and is then deleted
       */
      this.ready = async () => {
        // set shortcut to help functions
        $ = self.ccm.helper;
      };

      /**
       * Unify config sets not given default configs
       */
      this.unify_config = () => {
        //initially set points of all players to zero
        this.players.forEach((player) => {
          player.points = 0;
        });

        //when no default mode is set => use mode_relax
        if(!this.default_mode){
          this.default_mode = 'mode_relax';
        }

        if(!this.threshold_time_fast){
          this.threshold_time_fast = 3;
        }

        if(!this.threshold_time_interval ){
          this.threshold_time_interval = 1;
        }
      }

      /**
       * start starts the instance
       */
      this.start = async () => {
        this.unify_config();
      };

    }

  };

  function p(){window.ccm[v].component(component)}const f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{const n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"===typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{const e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}}
}
