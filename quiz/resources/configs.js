/**
 * @configurations for a multiplayer realtime test quiz
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 */

ccm.files[ 'configs.js' ] = {
  /*
   * This section simply includes all neccessary configuration options 
   * and uses all available quiz methods
   */
  "test_quiz": { 
    /*
     * first load css file
     */
    "css": [ "ccm.load", "resources/style.css"], 

    /*
     * define a datastore where the quiz is operating on
     */
    "data": {
        "store": 
      [ "ccm.store", 
        { "name" : "ffroeh2s_quiz", 
          "url": "wss://ccm2.inf.h-brs.de", 
          "dataset" : "ffroeh2s_quiz"
        }
      ],
      key: "ffroeh2s_quiz",
    },

    /* 
     * The gamification subcomponent is required.
     * The configured values are arbitrary chosen and can be changed
     * */
    "gamification" : 
      ['ccm.instance', 
      'https://ffroehling.github.io/ccm_components/gamification/versions/ccm.gamification-1.0.0.js', {
        "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/gamification/resources/style.css'],

        /*
         * If the quiz component does not provide a mode for a question,
         * this value is assumed by default.
         *
         * mode_order and mode_relax is possible 
         * (see section question config for details)
         *
         * mode_order is default
         */
        "default_mode" : "mode_order",

        /*
         * When no maximal answer points for a specific question is assumed,
         * this value is taken
         * */
        "default_answer_points" : 100,

        /*
         * When no maximal time points for a specific question is assumed,
         * this value is taken
         * */
        "default_time_points" : 50,

        /*
         * Unit : [s]
         * When the player is faster than this defined thresholds, 100% of the
         * time points are reached
         */
        "threshold_time_fast" : 3, 

        /*
         * Unit : [s]
         * When the player does not get 100% of time_points, each <value> [s]
         * a fraction is subtracted. 
         */
        "threshold_time_interval" : 1, 

        /*
         * Template definition
         */
        "template" : {
          "perfect" : "Perfect!",
          "good" : "Very good!",
          "not_bad" : "Not bad!",
          "better" : "You can do better..."
        }
      }],

    /*
     * behaviour settings of the app 
     * with dedicated master and player sections
    */
    "behaviour" : {
      "master" : {
        /*Nothing to configure here yet*/
      },
      "player" : {
        /*Nothing to configure here yet*/
      }
    },

    /*
     * general config for all questions
     */
    "question_config" : {
      /*
       * Unit : [s]
       * specifies the time limit (after an answer cannot be given anymore)
       */
      "timeout" : 4, 

      /*
       * Unit : [s]
       * specifies the prepare time before each question (get ready...)
       */
      "prepare_time" : 3,

      /*
       * specifies the default mode of the question
       * Possible values: 
       * - time_first : 
       *   A question is shown and each player can "buzz" to give the answer.
       *   Only this player is able to receive points
       * - time_order:
       *   All players execute the same question at the same time 
       *   and retreive points based on the correctness and the time needed
       * - mode_relax:
       *   All players execute the same question at the same time 
       *   and retreive points based on the correctness only 
       */
      "mode" : "mode_first", 


      /*
       * Specifies if the master decides when to show next_question
       * or if its automatic
       *
       * possible values: 
       * - auto
       * - manual
       */
      "next" : "auto",

      /*
       * Unit : [ms]
       * Specifies how long auto next waits until showing the next question
       */
      "auto_next_time" : 7000,

      /*
       * Unit : [ms]
       * Specifies how long the correct answer is being displayed
       */
      "correct_answer_duration" : 5000
    },
  
    /* 
     * Here the actual excercises of the quiz are defined which are executed
     * in this specified order. Configuration options here override the
     * default values specified above
     * */
    "questions" : [
        {
          /*
           * Unit : [s]
           * Preparation time (see above)
           */
          "prepare_time" : 2,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 0,

          /*
           * question mode (see above)
           */
          "mode" : "mode_order", 

          /*
           * The component which executes the question
           */
          "component" : 
          [
            'ccm.instance', 
            'https://ffroehling.github.io/ccm_components/choice/versions/ccm.quiz_choice-1.0.0.js', {
              /*
               * "single" multiple choice question, where only one answer 
               * is correct
               */
              "type" : "single",

              /*
               * CSS of the component
               */
              "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/choice/resources/style.css'],

              /*
               * The actual question to be showed
               */
              "question_text" : "What's the world longest river?",
    
              /*
               * The answers to be shown
               */
              "answers": [
                {"value" : "The Nil river", "correct" : true},
                {"value" : "The Rhine", "correct" : false},
                {"value" : "The Amazon river", "correct" : false},
              ]
            }
          ],

          /*
           * Next question is shown after master said so
           */
          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 0,

          /*
           * question mode (see above)
           */
          "mode" : "mode_order", 
          "component" : 
          ['ccm.instance', 
            'https://ffroehling.github.io/ccm_components/choice/versions/ccm.quiz_choice-1.0.0.js', {
              "type" : "multiple",
              "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/choice/resources/style.css'],
              "question_text" : "Which countries belong to the European Union?",
              "answers": [
                {"value" : "Germany", "correct" : true},
                {"value" : "Ireland", "correct" : true},
                {"value" : "Russia", "correct" : false},
                {"value" : "Switzerland", "correct" : false}
              ]
          }],
          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 20,


          /*
           * question mode (see above)
           */
          "mode" : "mode_relax", 


          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/parson/versions/ccm.quiz_parson-1.0.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/parson/resources/style.css'],
            "question_text" : "Print \"Hello Paris\" to the screen by using C!",
            "elements": [
              {"value" : "return 0;", "position" : 3, "indentation" : 1},
              {"value" : "printf('Hello Paris');", "position" : 2, "indentation" : 1},
              {"value" : "int main(int argc, char** argv){", "position" : 1, "indentation" : 0} ,
              {"value" : "}", "position" : 4, "indentation" : 0}
            ]
          }],
          "next" : "auto"
        },
      {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 20,

          "answer_points" : 200,

          /*
           * question mode (see above)
           */
          "mode" : "mode_relax", 


          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/short_answer/versions/ccm.quiz_short_answer-1.0.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/short_answer/resources/style.css'],
            "question_text" : "What is the capital of Germany?",
            "correct" : ["Berlin"],

            "template" : {
              "answer_placeholder" : "Insert answer...",
              "submit" : "Submit",
              "your_answer" : "Your answer",
              "correct_answer" : "Correct answer",
              "yes" : "Yes",
              "no" : "No"
            },
          }],

          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 50,

          "answer_points" : 500,
          "time_points" : 300,

          /*
           * question mode (see above)
           */
          "mode" : "mode_order", 


          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/category/versions/ccm.quiz_category-1.0.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/category/resources/styles.css'],
            "question_text" : "Match the following countries to the right continent.",

            "categories" : [
              "Europe", "Asia", "Africa", "N. America", "S. America", "Australia"
            ],

            "items": [
              {"value" : "Germany", "correct" : "Europe"},
              {"value" : "Sweden", "correct" : "Europe"},
              {"value" : "China", "correct" : "Asia"},
              {"value" : "India", "correct" : "Asia"},
              {"value" : "Congo", "correct" : "Africa"},
              {"value" : "Egypt", "correct" : "Africa"},
              {"value" : "USA", "correct" : "N. America"},
              {"value" : "Canada", "correct" : "N. America"},
              {"value" : "Brasil", "correct" : "S. America"},
              {"value" : "Argentina", "correct" : "S. America"},
              {"value" : "Australia", "correct" : "Australia"},
              {"value" : "New Zealand", "correct" : "Australia"},
            ],

            "templates" : {
              "submit" : "Bestätigen"
            }
          }],
          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 20,


          /*
           * question mode (see above)
           */
          "mode" : "mode_relax", 


          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/assess/versions/ccm.quiz_assess-1.0.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/assess/resources/style.css'],
            "question_text" : 
            "How much liter of water exists on the earth? (answer in [10e18 liter])",
            "correct" : 1385,
            "deviation" : {
              //These numbers are chosen without any expereice just to show principle
              "best"  : 200, //When below or equal this deviation 100% is reached
              "worst" : 500//When above or equal this deviation 0 % is reached

              /*
               * In between best and worst the percentage of deviation is calculated
               * automaticly which results directly in user points
               */
            },

            "template" : {
              "answer_placeholder" : "Insert answer...",
              "submit" : "Submit",
              "your_answer" : "Your answer",
              "correct_answer" : "Correct answer"
            }
          }],
          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 4,

          /*
           * Unit : [s]
           * Timeout (see above)
           */
          "timeout" : 25,

          /*
           * question mode (see above)
           */
          "mode" : "mode_relax", 


          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/guess_picture/versions/ccm.guess_picture-1.2.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/guess_picture/resources/styles.css'],
              "lang": [ "ccm.instance", 
                "https://ccmjs.github.io/tkless-components/lang/versions/ccm.lang-1.0.0.js", 
                [ "ccm.get", "https://ffroehling.github.io/ccm_components/guess_picture/resources/configs.js", "lang" ] ],
              "picture" : {
                  "image": "https://akless.github.io/akless/resources/images/dolphin.jpg",
                  "solution": [ "Delfin", "Dolphin" ]
              },

              "interval": 1500,
              "max_width": 500,
              "size" : 4
          }],

          "next" : "auto"
        },
        {
          /*
           * Unit : [s]
           * Prepare time (see above)
           */
          "prepare_time" : 5,

          /*
           * question mode (see above)
           */
          "mode" : "mode_first", 

          /*
           * The question to be asked
           */
          "text" : 'What is the worlds biggest country by area?',
        },
  ],
  "template" : {


      /*
       * Templates for pregame
       */
      "pre_game" : {
        /*
         * Text (title) which is shown at the start of the app
         */
        "welcome" : "Welcome to the worlds brand new real time quiz!",

        /*
         * Text (subtitle) which is shown at the start of the app
         */
        "sub_welcome" : "Do you want to create a game of join an existing game?",

        /*
         * Labeling of the button for game creation
         */
        "create_game" : "Create game",

        /*
         * Labeling of the button for game begining
         */
        "begin_game" : "Start game",

        /*
         * Labeling of the button for game cancel
         */
        "cancel_game" : "Cancel game",

        /*
         * Labeling of the button for joining a game
         */
        "join_game" : "Join game",

        /*
         * Joining game description
         */
        "join_game_text" : "Select the game you want to join",

        /*
         * Shown when waiting for players joining the game. Make sure
         * to include <GAME_ID> as this gets replaced with the game id
         */
        "waiting_for_players_title" : "Waiting for players for game <GAME_ID>",

        /*
         * Shown when waiting for players joining the game. 
         */
        "waiting_for_players_text" : "When all players joined, you can start the game.",

        /*
         * Shown at player when he joined a game
         */
        "waiting_for_game_begin" : "Waiting for game to begin",

        /*
         * Shown when waiting for players joining the game. Shows the number of
         * players.
         */
        "num_players" : "Currenty <NUM_PLAYERS> are connected"
      },

      /*
       * Showed at states of syncing at the beginning
       */
      "sync" : {
        /*
         * Showed when syncms is initialized
         */
        "init" :  "Initializing...",
        "syncing_clocks" :  "Syncing clocks..."
      },

      /*
       * Master specific templates which are only shown at masters instance
       */
      "master" :{
        /*
         * State messages are shown when players see infos that master cant
         * see (due to game mechanics)
         */
        "state" : {
          /*
           * Specifies the state when the players need to answer a question
           */
          "waiting_for_answer" : "Waiting for answers...",

          /*
           * Is shown when the players see the countdown to the next question
           */
          "question_prepare" : "Showing countdown...",

          /*
           * Is shown when players see their correct answers
           */
          "evaluate_answers" : "Showing correct answers..."
        },

        /*
         * Messages are shown on specific events of the game
         */
        "messages" : {
          /*
           * messages related to mode_first mode
           */
          "time_first" : {

            /*
             * Is shown when a player pressed the "buzz" button to give an 
             * answer. Make sure the "<PLAYER>" placeholder is there, 
             * because this gets substitued by players name
             */
            "fastest_player" : "<PLAYER> was fastest"
          },

          /*
           * Is shown when nobody answerd in time
           */
          "timeout_everyone" : "Nobody answered in time!",

          /*
           * Labelling of the button for on_finish
           */
          "finish" : "Spiel beenden" 
        },

        /*
         * Texts which are related to question in some kind
         */
        'question' : {
          /*
          * Is shown when in mode_first a player gave the answer.
          * Make sure the "<PLAYER>" placeholder is there, 
          * because this gets substitued by players name
          */
          'answer_given' : '<PLAYER> answers. Is it correct?',

          /*
           * Is shown as an option for correctness in mode first
           * Is it correct -> Yes
           */
          'answer_correct' : 'Yes',

          /*
           * Is shown as an option for correctness in mode first
           * Is it correct -> No
           */
          'answer_incorrect' : 'No',


          /*
           * Is shown as an option for correctness in mode first
           * Is it correct -> Partially
           */
          'answer_part_correct' : 'Partially',

          /*
           * Is shown when master can decide to go on the the next question
           */
          'next_question' : 'Show next question'
        }
      },

      /*
       * Player specific templates
       */
      "player"  : {
        /*
         * Texts which are shown in preparation of each question
         * depending on the mode
         */
        "prepare" : {
          /*
           * Title of each prepare screen, which is always shown
           */
          "get_ready"   : "Get Ready!",

          /*
           * Subtitle which is shown if question mode is mode_first
           */
          "mode_first"  : "Be fast! Only the fastest player can answer!",

          /*
           * Subtitle which is shown if question mode is mode_order
           */
          "mode_order"  : "The faster you are, the more points you get!",

          /*
           * Subtitle which is shown if question mode is mode relax and when
           * there's no timelimit
           */
          "mode_relax_no_timeout"  : "Relax, there's no time limit.",

          /*
           * Subtitle which is shown if question mode is mode relax and when
           * there's a timelimit
           */
          "mode_relax_timeout"  : "Be aware of the timeout."
        },

        /*
         * templates which are question related in some kind
         */
        "question" : {
          /* 
           * Labelling of the buzzer of mode_first
           */
          "buzzer" : 'Buzz!'
        },

        /*
         * Messages are shown on specific events of the game
         */
        "messages" : {
          /*
           * Messages that are shown in mode_first
           */
          "mode_first" : {

            /*
             * is shown wwhen somebody else gave an answer but 
             * current player did not yet
             */
            "time_over" : "Someone else gave an answer", 

            /*
             * Is shown when another player was the fastest in mode_first 
             * Make sure the "<PLAYER>" placeholder is there, 
             * because this gets substitued by players name
             */
            "fastest_player" : "<PLAYER> was fastest and gives the answer.", 

            /*
             * Is shown when the player was the fastest
             */
            "fastest_you" : "You were the fastest and can answer now.",

            /*
             * Is shown when it's not clear yet who was the fastest.
             * This occurs when a player gives an answer. The system can't be
             * sure immediatly that the player was the fastest, because
             * someone might be faster. Therefore master decides this with
             * syncms help.
             */
            "checking_fastest"  : 'Checking who was fastest'
          },

          /*
           * When a problem is detected an error message is shown,
           * which is defined in this section
           */
          "problems" : {
            /*
             * Error in synchronization detected and waiting for next sync point
             */
            "sync" : "Error in synchronization occured. Waiting for next reentry point."
          },

          //some more general timeouts
          
          /*
           * Is shown when timeout is reached and no answer is given
           */
          "timeout" : "The time has run up :(",

          /*
           * is shown when master notified that nobody answered in time
           */
          "timeout_everyone" : "Nobody answered in time.",

          /*
           * Is shown when a player gave an answer and is waiting for the others
           */
          "waiting_question_finish" : "Waiting for other players",

          /*
           * Labelling of the button for on_finish
           */
          "finish" : "Spiel beenden" 
        }
      }
    }
  }
}
