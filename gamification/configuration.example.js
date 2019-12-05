{
  //defined style with animations
  css : ['ccm.load', 'style.css'],

  //array of all players
  players : [
    { id : 'player 1', username : 'Player 1'},
    { id : 'player 2', username : 'Player 2'},
    { id : 'player 3', username : 'Player 3'}
  ],

  //default question mode if nothing's given
  default_mode : 'mode_order',

  //default point value if noth
  default_answer_points : 100, 
  default_time_points : 50,

  //threshold for time
  //[s] if answer is given before [VALUE] amount of time, 
  //all time_points are received
  threshold_time_fast : 3, 
  //[s] after threshold_time_fast is over, each [VALUE] seconds points 
  //are subtracted (in equal parts down to zero)
  threshold_time_interval : 1, 

  //Template definitions 
  template : {
    perfect : 'Perfect!',
    good : 'Very good!',
    not_bad : 'Not bad...',
    better : 'You can do better...'
  }
}
