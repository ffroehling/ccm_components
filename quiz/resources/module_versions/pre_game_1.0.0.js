var game_selection = {
  /*
   * creates an instance for game_selection and returns this
   * Parameters: 
   *  - ccs: is the global ccm object (with helpers, etc)
   *  - db : is an db object which handles ccm stores, and updates as a seperate abstraction layer
   *  - element : the dom element where content get's rendered to
   *  - username : Given username of player
   *  - on_finish : a callback function which is triggered when a game starts
   *    - parameter then are
   *      - game_id : The id of the game
   *      - store_name : The store_name of the according game
   *      - master : Boolean, indicating if current instance is master of game, slave else
   *
   */
  Instance : function(ccm, db, element, username, quiz_id, template, on_finish) { 
    this.ccm = ccm;
    this.db = db;
    this.element = element;
    this.username = username;
    this.quiz_id = quiz_id;
    this.template = template;
    this.on_finish = on_finish;

    return this;
  },

  /*
   * The entry point to this module
   */
  start : function (){
    this.show_start_screen();
  },

  /*
   * Renders the first visible screen to user (selection to create or join a game)
   */
  show_start_screen  : function () {
    //create tag
    let dialog = {
      tag: 'div',
      id : 'start_dialog',
      inner : [
        {tag : 'h3', id : 'welcome_header', inner : this.template.welcome},
        {tag : 'p', id : "welcome_sub", inner : this.template.sub_welcome},
        {tag : 'button', class : 'action_button', onclick: this.create_game.bind(this),  inner : this.template.create_game},
        {tag : 'button', class : 'action_button', onclick: this.join_game.bind(this),    inner : this.template.join_game}
      ]
    };

    //render and append
    let html = this.ccm.helper.html(dialog);
    this.ccm.helper.setContent(this.element, html);
  },

  /*
   * Event listener when user wants to create a game
   */
  create_game : async function (event) {
    event.preventDefault();

    /*
     * create game database object and set this as current_game
     */
    var game = await this.db.create_game(this.quiz_id); 
    this.current_game = game; 

    //show master waiting page
    this.render_master_waiting(game);
      
    //check that players are connected
    this.check_players_connected();
  },

  /*
   * renders a page that master is waiting for players to join
   *
   * @param {Object} g : The current game object
   */
  render_master_waiting(g){
    /*
     * first set db callback to this function so we get notified 
     * on any new user connecting
     */
    this.current_game.set_db_callback(this.render_master_waiting.bind(this));

    /*
     * Unify access layer in this function
     */
    var game = g.game ? g.game : g.dataset.game;

    //build the html
    let waiting_page = {
      tag: 'div',
      class : 'waiting_dialog',
      inner : [
        {tag : 'h3', inner : this.template.waiting_for_players_title
          .replace('<GAME_ID>', game.id)},
        {tag : 'p', inner : this.template.waiting_for_players_text},
        {tag : 'p', inner : this.template.num_players.replace("<NUM_PLAYERS>",
        game.players.length)},
        {tag : 'ul', inner : []},
        {tag : 'button', onclick: this.begin_game.bind(this),  inner : 
          this.template.begin_game},
        {tag : 'button', onclick: this.cancel_game.bind(this), inner : 
          this.template.cancel_game}
      ]
    };

    //Add all connected players
    let players = this.render_connected_players(game);   
    waiting_page.inner[3].inner = players;

    //and finally render the content
    let html = this.ccm.helper.html(waiting_page);
    this.ccm.helper.setContent(this.element, html);
  },

  /*
   * returns an array with html elements of all connected players
   *
   * @param {Object} game : The current game object
   */
  render_connected_players : function(game) {
    let result = [];

    game.players.forEach(function(player){
      let entry = {tag : 'li', class : 'item_connected_player', inner : player.username};
      result.push(entry);

    });

    return result;
  },

  /*
   *
   * This method writes regulary (all 5 seconds) a last_seen_timestamp by master
   * The players can check therefore that master is still alivive or otherwise leave the game
   * Originally, the players are also writing a last_seen timestamp to be able
   * to check if they left without further notice. As this leeds to problems, it 
   * is deactivated, but the code is kept. Also the function name remains for this.
   */
  check_players_connected : function(){
    this.interval = setInterval( 
      () => {
        var now = Date.now()

        //Update own timestamp
        this.current_game.dataset.game.master_last_seen = now;
 
        //Check each players timestamp
        /*this.current_game.dataset.game.players.forEach((player) => {
          if((now - player.last_seen) > 12000){
            //remove player
            this.current_game.dataset.game.players.splice(
            this.current_game.dataset.game.players.indexOf(player), 1);

            //update view
            this.render_master_waiting(this.current_game);
          }
        });*/

        //save
        this.current_game.save();
      }, 5000);
  },


  /*
   * Is called when the master begins the game
   */
  begin_game : async function(event) {
    event.preventDefault();

    if(this.current_game.dataset.game.players.length > 0 ){ 
      /*
       * Potentally here's a race condition when players want to join or leave, 
       * but we cannot do sth about it (without high efford), so lets just risk
       */

      //remove from available list
      await this.db.remove_game();

      //notify players
      this.current_game.dataset.game.running = true;
      await this.current_game.save();

      //stop intervals and callbacks
      this.stopInterval(); 
      this.current_game.set_db_callback(null); 

      //switch to game logic
      this.on_finish(this.current_game, true, null);
    }
    else{
      alert("No players joined, game can't be started now");
    }
  },

  /*
   * is called when the master cancels the current game
   */
  cancel_game : function (event) {
    event.preventDefault();

    //first stop interval
    this.stopInterval();

    //delete game object
    this.current_game.drop_game();
    this.current_game = null;

    //remove from list
    this.db.remove_game();

    //show start screen
    this.show_start_screen();
  },

  /*
   * Event listener when user wants to join a game to get the latest games
   */
  join_game : function(event){
    if(event.preventDefault)
      event.preventDefault(); 

    //First set db data update callback to this to update the joining screen
    this.db.set_db_callback(this.join_game.bind(this));

    //rendering div
    let joining_page = {
      tag: 'div',
      class : 'joining_dialo',
      inner : [
          {tag : 'h3', inner : this.template.join_game},
          {tag : 'p', inner : this.template.join_game_text},
          {tag : 'ul', id : 'game_list', inner : [
        ]}
      ]
    };

    //get all available games
    var games = this.db.dataset.games; 

    //Add them to render list
    for(var game in games){
      var g = games[game];

      //Make sure that just matching quiz show up in the list
      if(g.quiz_id == this.quiz_id){
          let g_tag = {tag : 'li', onclick : this.join(g).bind(this), 
            class : 'join_game_item', inner: 'ID: ' + g.id};
          joining_page.inner[2].inner.push(g_tag);
      };
    }

    //finally render
    let html = this.ccm.helper.html(joining_page);
    this.ccm.helper.setContent(this.element, html);
  },

  /*
   * Is called when the user wants to join a specific game
   *
   * @param {Object} game : The current game object
   */
  join : function(game){
    return async function(event){
      event.preventDefault();

      //generate unique random id of the user 
      let user_id = SHA512(this.username + (Math.random() * 10000000000));

      //build the user object
      this.user_obj = {
        user_id : user_id, 
        username : this.username, 
        last_seen : Date.now()};

      //create game database object
      this.current_game = await db_game.Instance.bind(db_game)
        (this.ccm, game.id, game.created, this.db, game.app_id, false);

      //add to player list and save this
      this.current_game.dataset.game.players.push(this.user_obj);
      await this.current_game.save();

      //render waiting page
      this.render_player_waiting();

      //Check that master didn't leave
      this.check_master_connected();
    }
  },

  /*
   * Renders a waiting dialog for a joined player and gets called on any
   * update of the game database
   */
  render_player_waiting : function(){
    /*
     * first set db callback to this function so we get 
     * notified on any new user connecting
     */
    this.current_game.set_db_callback(this.render_player_waiting.bind(this));

    //get current game
    var game = this.current_game.dataset.game;

    //When game has been started, cancel watchings and call finish method 
    if(game.running){
      this.stopInterval();
      this.on_finish(this.current_game, false, this.user_obj);

      return;
    }

    //build the waiting page
    let waiting_page = {
      tag: 'div',
      class : 'waiting_dialog',
      inner : [
        {tag : 'h3', inner : this.template.waiting_for_game_begin},
        {tag : 'p', inner : this.template.num_players.replace("<NUM_PLAYERS>", game.players.length)},
        {tag : 'ul', inner : []}
      ]
    };

    //add all connected players
    let players = this.render_connected_players(game);   
    waiting_page.inner[2].inner = players;

    //render it
    let html = this.ccm.helper.html(waiting_page);
    this.ccm.helper.setContent(this.element, html);
  },

  /*
   * checks if master is still connected to the game
   */
  check_master_connected : function (){
    //Regullary check it
    this.interval = setInterval(() => {
      //get current timestamp
      var now = Date.now()

      //get current game
      var game = this.current_game.dataset.game;

      /*master is updating timestmap every 5 seconds, 
       * so lets say after 12 seconds master is out
       */
      if(game && now - game.master_last_seen > 12000){ 
        //master left game -> delete game object
        delete this.db.dataset.games[this.current_game.id];

        //unset db change callbacks
        this.db.set_db_callback(undefined);
        this.current_game.set_db_callback(null);

        //delete local vars
        delete this.user_obj;
        delete this.current_game;

        //Stop this interval
        this.stopInterval();

        //render start page
        this.show_start_screen()
      }
      else{
        /*
         * INFORMATION:
         * As noted above the player information is deactivated, but the code is kept
         */
        
        /*
         * //update own timestamp
        /*var idx = -1;
        this.current_game.dataset.game.players.forEach((player) => {

          if(player.user_id == this.user_obj.user_id){ 
            
            idx = this.current_game.dataset.game.players.indexOf(player);
          }
        });
  
        //Now update
        if(idx > -1){
          this.current_game.dataset.game.players[idx].last_seen = now;
        }*/
      }

      this.current_game.save();
    }, 5000);
  },

  //clears the specified interval
  stopInterval : function(){
    clearInterval(this.interval);
  }
}

