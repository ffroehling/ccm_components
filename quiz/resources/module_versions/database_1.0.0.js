/*
 * This is a database object which abstracts access to ccm data store
 * It is used to get all available games or create new ones
 */

var db_game_selection = {
  /*
   * Constructor
   * @param {Object} ccm - The ccm object
   * @param {Object} store - The configured datastore
   * @param {Object} dataset - The configured dataset
   * @param {Function} hash - A hash function
   */
  Instance : function(ccm, store, dataset, hash){ 
    this.ccm = ccm;
    this.store = store;
    this.dataset = dataset;
    this.hash = hash;

    this.prepare_database();

    //Initially we have no db_callback event
    this.db_callback = undefined;

    return this;
  },

  /*
   * Saves the current dataset to db (and send therefore a message)
   */
  save : async function() {
    await this.store.set(this.dataset);
  },

  /*
   * prepares the database object by creating neccessary attributs 
   * and setting onchange callbacks
   */
  prepare_database : async function() {
    if(!this.dataset.games){
      this.dataset.games = {};
      await this.save(); //save new configuration
    }

    //Callback on any changes to a function here
    this.store.onchange = this.on_db_update.bind(this);
  },

  /*
   * creates a game database object
   * @param {String} id - The id of the game
   * @param {Date} created - Timestamp of game creation
   * @param {String} quiz_id - The unique hash from the configuration
   *
   * @returns {Object} - The game database object
   */
  create_game_db : async function(id, created, quiz_id){
    var game = await db_game.Instance.bind(db_game)
    (this.ccm, id, created, this, quiz_id, true);

    return game;
  },

  /*
   * Creates a game 
   * @param {String} quiz_id - The unique hash from the configuration
   *
   * @returns {Object} - A game database object holding the game
   */
  create_game : async function (quiz_id) {
    var id = 0;

    //Generate id with 5 digits
    do{
      id = Math.floor(Math.random() * 100000);    
    }while( id < 10000 || this.dataset.games[id.toString()] );
    
    //set this attribute
    this.game_id = id;

    //create a game object with attributes
    let game = {};
    game.id = id;
    game.created = Date.now();
    game.quiz_id = quiz_id;

    //add to game store
    this.dataset.games[id.toString()] = game;

    //save database
    await this.save();

    //now create according db and return it
    return await this.create_game_db(id, game.created, this.store, quiz_id);
  },

  /*
   * removes the current specified game from the database
   */
  remove_game : async function(){
    delete this.dataset.games[this.game_id];
    await this.save();
  },

  
  /*
   * gets called when the database is updated
   *
   * @param {Object} data : the updated dataset
   */
  on_db_update : async function(data) {
    //Update local datastore etc.
    this.dataset = data;

    //call callback function
    if(this.db_callback) {
      this.db_callback(this.dataset);
    }
  },

  /*
   * sets a callback for changed data (msg receive)
   *
   * @param {Function} callback - The callback to call on any message
   */
  set_db_callback : function (callback) {
    this.db_callback = callback;
  }
}



