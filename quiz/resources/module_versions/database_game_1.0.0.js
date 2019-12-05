/*
 * A db_game object holds a datastore for a specific game and implements
 * game specific logic
 */

var db_game = {
  /*
   * Constructor
   * @param {Object} ccm - The ccm object
   * @param {String} id - The id of the game
   * @param {Date} created - Timestamp of game creation
   * @param {Object} db - db dataset object of all games (held by database object)
   * @param {String} quiz_id - The unique hash from the configuration
   * @param {Boolean} master - Master or slave instance
   */

  Instance : async function(ccm, id, created, db, quiz_id, master){ 
    //set instance variables
    this.ccm = ccm;
    this.id = id;
    this.created = created;
    this.db = db;
    this.quiz_id = quiz_id;
    
    //create store
    await this.create_store(id, master);

    //init data when we are master 
    if(master){
      this.dataset.game = {};
      this.dataset.game.id = id;
      this.dataset.game.created = Date.now();
      this.dataset.game.running = false;
      this.dataset.game.players = [];

      //save config serverside
      await this.save();
    }

    //set our callback to undefined
    this.db_callback = undefined;

    //return our object
    return this;
  },

  /*
   * Saves the current dataset to db (and send therefore a message)
   */
  save : async function() {
    await this.store.set(this.dataset);
  },

  /*
   * creates the new datastore based on the old one 
   * (changing dataset, but we want to decouple)
   */
  create_store : async function(id, master){
    this.store = await this.ccm.store( {
      name : this.db.store.name,
      key : this.db.store.name + '_' + id,
      dataset : this.db.store.name + '_' + id,
      url : this.db.store.url,
      onchange: this.on_db_update.bind(this)
    });

    /*
     * When master -> initialize the database
     */
    if(master){
      await this.store.set({
        key : this.db.store.name + '_' + id,
        value : {}
      });

      this.dataset = await this.store.get(this.store.name + '_' + id);
    }
    else{
      this.dataset = await this.store.get(this.store.name + '_' + id);
    }
  },

  /*
   * gets called when the database is updated
   *
   * @param {Object} data : the updated dataset
   */
  on_db_update : function(data){

    this.dataset = data;

    if(this.db_callback){
      this.db_callback(this.dataset);
    }
  },

  /*
   * sets a callback for changed data (msg receive)
   *
   * @param {Function} callback - The callback to call on any message
   */
  set_db_callback : function(callback){
    this.db_callback = callback;
  },

  /*
   * delte the game (e.g. abort it)
   */
  drop_game : function(){
    this.store.del(this.dataset.key);    
    this.store.onchange = null;
    this.db_callback = null;
  }
}
