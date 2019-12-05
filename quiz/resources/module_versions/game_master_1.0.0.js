/*
 * This file implements the logic at master instance
 */

var game_master = {
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
    this.behaviour = behaviour.master;
    this.template = template.master;
    this.ui = ui;
    this.user_obj = user_obj;
    this.action = action;
    this.gamification = gamification;
    this.on_finish = on_finish;

    //set syncms callback
    this.communication.on_message_receive = this.on_receive_player.bind(this);

    //prepare gamification with all players
    this.gamification.set_players(this.game.players);

    return this;
  },

  /*
   * entry point to the module
   */
  start : async function() {
    //start with first question, so set start_index to -1
    this.question_idx = -1;

    //set initial state as active
    this.state = this.STATE_ACTIVE;

    //show first question
    this.send_next_question();
  },

  /*
   * Updates the global state by sending out an action command
   *
   * @param {Number} action - The action to send
   * @param {Object} data - The data to send
   */
  send_action : async function(action, data){
      //create object
      var to_send = {
        'from' :    'master',
        'action' :  action,
        'data' : data
      };

      //send to slaves
      await this.communication.sync_out(to_send);
  },

  /*
   * Gets called when a message from a player is received
   *
   * @param {Number} type : Type of the message (see SyncMs)
   * @param {Object} msg : The message object
   * @param {String} from : Id of the sender
   */
  on_receive_player : async function (type, msg, from){
    //ignore if we don't accept messages anymore
    if(this.state == this.STATE_ACTIVE){
      return;
    }

    //get current questoin
    let question = this.get_current_question();

    //dispatch action upon question type
    if(question.mode == 'mode_first'){
        //immediatly ignore any other messages 
        this.communication.disable_sync_in();
        this.state = this.STATE_ACTIVE;

        //now get username from msg 
        let fastest = this.get_player_by_id(from);
        let fastest_name = fastest.username;

        //propagate this to other players
        await this.send_action(this.action.ACTION_SHOW_FASTEST_PLAYER, fastest);

        //show dialog if answer is correct  
        this.ui.show_master_decide_correctness(this.template, question, fastest_name)
        .then((percentage) => {
          //move to post processing of question
          let obj = {player : fastest, correctness : percentage};

          let points = this.gamification.calculate_points(
            percentage, "mode_order", 
            0, 
            question.answer_points, 
            0);

          obj.points = points;

          this.gamification.add_points_to_player(fastest.user_id, points);

          this.post_process_question([obj]);
        });
    }
    else{
      let obj = {
        player :      this.get_player_by_id(from), 
        correctness : msg.message.percentage,
        answer      : msg.message.answer_data, 
        time : msg.message.time
      }

      //calculate points for player
      let points = this.gamification.calculate_points(obj.correctness, question.mode, obj.time, question.answer_points, question.time_points);

      //add points to player
      this.gamification.add_points_to_player(obj.player.user_id, points);

      //inform player for points
      obj.points = points;

      this.received.push(obj);
      
      //when we received from any player a answer -> bien!
      if(this.received.length == this.game.players.length){
        this.communication.disable_sync_in();
        this.state = this.STATE_ACTIVE;
        this.post_process_question(this.received);
      }
    }

  },


  /*
   * called when the game is over 
   */
  finish : function() {
    this.ui.show_finish_button(this.template, this.on_finish);
  },

  /*
   * returns the current played questoin object
   */
  get_current_question : function() {
    return this.questions[this.question_idx];
  },

  /*
   * notifies players to show the next question
   */
  send_next_question : async function() {
    this.question_idx += 1;

    //If any timeout is in progress, abort this
    if(this.timeout){
      clearTimeout(this.timeout);
    }

    if(this.question_idx == this.questions.length){
      //we reached the end of questions
      this.finish();
      return;
    }

    this.received = [];

    //notify players to show the question
    await this.send_action(this.action.ACTION_SHOW_NEXT_QUESTION, this.question_idx);

    //show that question is currently prepared
    this.ui.show_state(this.template.state.question_prepare);

    //when question get's active -> show that we wait for an answer
    setTimeout(() => {
      this.state = this.STATE_WAITING_ANSWER;
      this.communication.enable_sync_in();
      this.ui.show_state(this.template.state.waiting_for_answer);

      //Handle the timeout if neccessary
      if(this.questions[this.question_idx].timeout > 0){
        //add small delay of 500ms to the timeout
        this.timeout = setTimeout(() => {
          if(this.received.length == 0){
            //show the state that nobody answered
            this.ui.show_message(this.template.messages.timeout_everyone);
          }
          else if(this.received.length == this.game.players.length){
            //everybody answered in time, so no processment is neccessary here
            return;
          }

          //disable the sync in
          this.communication.disable_sync_in();
          this.state = this.STATE_ACTIVE;

          //after another 2 seconds move on to gamification
          setTimeout(() => {
            this.post_process_question(this.received);
          }, 2000);

        }, 1000 * this.questions[this.question_idx].timeout ); 
      }
    }, 1000 * this.get_current_question().prepare_time);
  },

  /*
   * get's called after the question is played 
   * (e.g. got all answers, timeout reached, first answerd)
   *
   * @param {Array} - answer obj with correctness ordered by pace
   */
  post_process_question : function(answers){
    let question = this.get_current_question();

    if(question.mode != 'mode_first'){
      //show correct answer with own answer
      this.send_action(this.action.ACTION_SHOW_ANSWER_EVALUATION, null);

      /*
       * at master's stations we can show an overview of the answer's 
       * if we want to. Then the answers must be written aswell by the clients
       * See Interface set_given_answer for details
       * We do not support this yet.
       */

      this.ui.show_state(this.template.state.evaluate_answers);

      setTimeout(() => {
        this.post_process_gamification(answers);
      }, question.correct_answer_duration); 
    }
    else{
      this.post_process_gamification(answers);
    }
  },

  /*
   * gets called after a question is post_processed
   * It shows the retreived points and the scoreboard
   *
   * @param {Array} - answer obj with correctness ordered by pace
   */
  post_process_gamification : async function(answers){
      //Each player who has not must be added to the list with 0 points and max time
      this.game.players.forEach((player) => {
        let player_answered = false;

        answers.forEach((answer) => {
          if(player == answer.player){
            player_answered = true;
          }
        });

        if(!player_answered){
          answers.push({player : player, correctness : 0, answer : null, 
            time : 10000000, points : 0});
        }
      });

      let question = this.get_current_question();

      if(question.next =='manual'){
        await this.ui.show_next_question_dialog(this.template);
      }

      this.send_action(this.action.ACTION_SHOW_GAMIFICATION, answers);

      this.ui.show_scoreboard(this.gamification);

      setTimeout(() => {
        this.send_next_question();
      }, question.auto_next_time); 
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

    return null;
  }
}
