/*
 * This file implements the logic at player instances
 */

var game_player = {
  /*
   * Definied state constants
   */
  //means that master is doing sth and does not accept messages
  STATE_ACTIVE : 1, 

  //means that master is waiting for answers to come in
  STATE_WAITING_ANSWER : 2, 

  /*
   * Constructor
   *
   * @param{Object} ccm - The ccm Object
   * @param{Object} game - The game database Object
   * @param{CCM Instance} communication - The syncms instance
   * @param{Object} behaviour - Object with specific configurations (not used yet)
   * @param{Array} questions - List of all defined questions
   * @param{Object} template - Defined template object
   * @param{Object} ui - The ui module
   * @param{Object} user_object - The current user object
   * @param{action} user_object - The shared constants object
   * @param{CCM Instance} gamification -  The gamification instance
   * @param{Function} on_finish - Callback when a game is over
   */
  Instance : function(ccm, game, communication, behaviour, questions, template, ui, user_obj, action, gamification, on_finish) { 

    this.ccm = ccm;
    this.game_obj = game;
    this.game = game.dataset.game;
    this.questions = questions;
    this.communication = communication;
    this.behaviour = behaviour.player;
    this.template = template.player;
    this.ui = ui;
    this.user_obj = user_obj;
    this.action = action;
    this.gamification = gamification;
    this.on_finish = on_finish;

    //prepare gamification
    this.gamification.set_players(this.game.players);

    this.communication.on_message_receive = this.on_receive.bind(this);

    return this;
  },

  /*
   * entry point to the module
   */
  start : function() {
    //start with first question
    this.question_idx = 0;
    this.state = this.STATE_IDLE;
  },

  finish : function() {
    this.ui.show_finish_button(this.template, this.on_finish);
  },


  /*
   * is called when a message is received by syncms
   *
   * @param {Number} type : Type of the message (see SyncMs)
   * @param {Object} msg : The message object
   * @param {String} from : Id of the sender
   */
  on_receive : function(type, msg, from){
    if(msg.from == 'master'){
      this.dispatch_master_action(msg);
    }
    else{
      //receiving sth from player here. 
      //ignore if we are only interested in master actions
      if(this.state == this.STATE_IDLE){
        return;
      }

      //dispatch otherwise
      this.dispatch_player_message(msg);
    }
  },

  /*
   * When a message from master is received -> dispatch it here
   *
   * @param {Object} msg : The message object
   */
  dispatch_master_action : async function(msg){

    if(msg.action == this.action.ACTION_SHOW_NEXT_QUESTION){
      await this.action_show_question(msg);
    }
    else if(msg.action == this.action.ACTION_SHOW_FASTEST_PLAYER){
      await this.action_show_fastest_player(msg);
    }
    else if(msg.action == this.action.ACTION_SHOW_TIMEOUT){
      //Master sent that nobody answered in time
      //=> Show the dialog
      this.show_message(this.template.messages.timeout_everyone);
      this.state = this.STATE_IDLE;
    }
    else if(msg.action == this.action.ACTION_SHOW_ANSWER_EVALUATION){
      this.ui.show_correct_answer();
    }
    else if(msg.action == this.action.ACTION_SHOW_GAMIFICATION){
      await this.action_show_gamification(msg);
    }
  },

  /*
   * dispatches the action if a message from another player is received
   * based on current question mode
   *
   * @param {Object} msg : The message object
   */
  dispatch_player_message : async function(msg){
    //when we are in idle, only master messages are accepted
    if(this.state == this.STATE_IDLE){
      return;
    }

    //check current question mode
    if(this.get_current_question().mode == 'mode_first'){ 
      //Means that only first answer is accepted in system, but only if it is 100% correct
      await this.handle_player_message_time_first(msg); 
    }
  },

  /*
   * Syncs in a message by the master (See SyncMS)
   *
   * @param {Object} msg : The message to be synced in
   */
  sync_in : async function(message) {
      let to_send = {
        'from' : this.user_obj.id, 
        'message' : message
      }

      //send answer to master
      await this.communication.sync_in(to_send);
  },

  /*
   * returns the current played questoin object
   */
  get_current_question : function(){
    return this.questions[this.question_idx];
  },

  /*
   * Shows the next question based on a received message
   *
   * @param {Object} msg : The received message object
   */
  action_show_question : async function(msg){
      this.question_idx = msg.data;
      let question = this.get_current_question();

      if(question.prepare_time > 0){
        await this.ui.prepare_question(this.template, question);
      }

      //dispatch upon mode of the question:
      if(question.mode == 'mode_first'){
        //here master set's our points so we don't need to measure time
        this.show_question_time = null; 

        //set state
        this.state = this.STATE_WAITING_ANSWER;        

        //and show buzzer
        await ui.show_question_buzzer(this.template, question)
        .then(() => {
          //user clicked
          if(this.state == this.STATE_WAITING_ANSWER){
            //user clicked: 
            //we can now send this to master when nobody else was faster (indicated via state)
            this.sync_in(null);
            this.ui.show_message(this.template.messages.mode_first.checking_fastest);
            this.state = this.STATE_IDLE;
          }
        });

        //nothing left todo
        return;
      }
      else{
        this.show_question_time = new Date().getTime();
        let instance = question.component;

        //bind the callback
        instance.answer_callback = this.on_answer.bind(this);
        
        //show method
        await this.ui.show_method(instance);
    
        //show timeout if needed
        if(question.timeout > 0){
          this.ui.show_timeout(question.timeout, () => {
            this.ui.show_message(this.template.messages.timeout);
          });
        }

        this.state = this.STATE_WAITING_ANSWER;
      }
  },

  /*
   * Shows the fastest player based on a received message
   *
   * @param {Object} msg : The received message object
   */
  action_show_fastest_player : async function(msg){
      let fastest_id = msg.data.user_id;

      if(fastest_id == this.user_obj.user_id){
        //show that we were the fastest
        this.ui.show_message(this.template.messages.mode_first.fastest_you);
      }
      else{
        let fastest_name = msg.data.username;

        this.ui.show_message(this.template.messages.mode_first.fastest_player.replace('<PLAYER>', fastest_name));
        
      }

      //wait for next action
      this.state = this.STATE_IDLE;
  },

  /*
   * Shows gamificatoin stuff based on a received message
   * @param {Object} msg : The received message object
   */
  action_show_gamification : async function(msg){
    let question = this.get_current_question();
    
    //first set all points of players
    var our_entry, our_points = 0;

    msg.data.forEach((result) => {
        if(result.player.user_id == this.user_obj.user_id){
          our_entry = result;
        }
        else{
          this.gamification.add_points_to_player(result.player.user_id, result.points || 0);
        }
    });

    our_points = our_entry ? our_entry.points : 0;

    //Hacky but working
    this.gamification.last_points = our_points;

    this.gamification.add_points_to_player(this.user_obj.user_id, our_points);

    //Hacky but working
    if(question.mode != 'mode_first'){
      this.gamification.last_max_points = 
        (question.answer_points || this.gamification.default_answer_points) +
        (question.time_points || this.gamification.default_time_points);
    }
    else{
      this.gamification.last_max_points = 
        (question.answer_points || this.gamification.default_answer_points);
    }

    //Now show our points for some seconds
    this.ui.show_points(this.gamification);

    //Now show scoreboard
    setTimeout(()=>{
      this.ui.show_scoreboard(this.gamification);

      if(this.question_idx == (this.questions.length - 1)){
        this.finish();
      }
    }, 2000); 

  },

  /*
   * Called when a message from another player comes in 
   * AND question mode is time_first
   */
  handle_player_message_time_first : async function(msg){
      if(this.state == this.STATE_WAITING_ANSWER){
        /* User has not answered yet, but someone did*/
        //wait for further commands from master
        this.state = this.STATE_IDLE;

        //show message
        this.ui.show_message(this.template.messages.mode_first.time_over);
      }
      else {
        //we gave an answer, somebody else gave an answer. Let master decide who was faster
        //=> nothing todo here as an action message should arrive soon
      }
  },


  /*
   * is called when the user gave an anser
   *
   * @param {Number} percentage - The percentage of the correctness
   * @param {Object} answer - The given answer
   *
   */
  on_answer : function(percentage, answer) {
    //send the answer to master message
    let obj = {answer_data : answer, percentage : percentage};

    if(this.show_question_time){
      //add needed time if neccessary
      this.needed_time = new Date().getTime() - this.show_question_time; 

      obj.time = this.needed_time;
    }

    this.sync_in(obj);

    //wait for next action from master
    this.state = this.STATE_IDLE; 

    //Hide the timeout indicator
    this.ui.stopTimeoutInterval();

    //show the waiting message
    this.ui.show_state(this.template.messages.waiting_question_finish);
  },

  /*
   * get a player by id
   *
   * @param {String} id : The id of the player
   *
   * @returns {Object} - The player by the given id or null if not found
   */
  get_player_by_id : function(id){
    let player = this.game.players;
    for(var i = 0; i < player.length; i++){
      if(player[i].user_id == id){
        return player[i];
      }
    }
  }
}

