{ 
    "css": [ "ccm.load", "https://ffroehling.github.io/ccm_components/quiz/resources/style.css"], 

    "data": {
        "store": 
      [ "ccm.store", 
        { "name" : "ffroeh2s_example_quiz", 
          "url": "wss://ccm2.inf.h-brs.de", 
          "dataset" : "ffroeh2s_example_quiz"
        }
      ],
      "key": "ffroeh2s_example_quiz"
    },

    "gamification" : 
      ["ccm.instance", 
      "https://ffroehling.github.io/ccm_components/gamification/versions/ccm.gamification-1.0.0.js", {
        "css" : ["ccm.load", "https://ffroehling.github.io/ccm_components/gamification/resources/style.css"],

        "default_mode" : "mode_order",
        "default_answer_points" : 100,
        "default_time_points" : 50,
        "threshold_time_fast" : 3, 
        "threshold_time_interval" : 1, 

        "template" : {
          "perfect" : "Perfect!",
          "good" : "Very good!",
          "not_bad" : "Not bad!",
          "better" : "You can do better..."
        }
      }],

    "behaviour" : {
      "master" : {},
      "player" : {}
    },

    "question_config" : {
      "timeout" : 4, 
      "prepare_time" : 3,
      "mode" : "mode_first", 
      "next" : "auto",
      "auto_next_time" : 7000,
      "correct_answer_duration" : 5000
    },

    "questions" : [
        {

          "prepare_time" : 2,
          "timeout" : 0,
          "mode" : "mode_order", 

          "component" : 
          [
            'ccm.instance', 
            'https://ffroehling.github.io/ccm_components/choice/versions/ccm.quiz_choice-1.0.0.js', {

              "type" : "single",
              "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/choice/resources/style.css'],
              "question_text" : "What's the world longest river?",
    
              "answers": [
                {"value" : "The Nil river", "correct" : true},
                {"value" : "The Rhine", "correct" : false},
                {"value" : "The Amazon river", "correct" : false},
              ]
            }
          ],

          "next" : "auto"
        },
        {
          "prepare_time" : 4,
          "timeout" : 0,

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
          "prepare_time" : 4,
          "timeout" : 20,
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
          "prepare_time" : 4,
          "timeout" : 20,
          "answer_points" : 200,
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
          "prepare_time" : 4,
          "timeout" : 50,
          "answer_points" : 500,
          "time_points" : 300,
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
          "prepare_time" : 4,
          "timeout" : 20,
          "mode" : "mode_relax", 
          "component" : ['ccm.instance', 'https://ffroehling.github.io/ccm_components/assess/versions/ccm.quiz_assess-1.0.0.js', {
            "css" : ['ccm.load', 'https://ffroehling.github.io/ccm_components/assess/resources/style.css'],
            "question_text" : 
            "How much liter of water exists on the earth? (answer in [10e18 liter])",
            "correct" : 1385,
            "deviation" : {
              "best"  : 200, 
              "worst" : 500
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
          "prepare_time" : 4,
          "timeout" : 25,
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
          "prepare_time" : 5,
          "mode" : "mode_first", 
          "text" : 'What is the worlds biggest country by area?',
        },
  ],

  "template" : {

      "pre_game" : {
        "welcome" : "Welcome to the worlds brand new real time quiz!",
        "sub_welcome" : "Do you want to create a game of join an existing game?",
        "create_game" : "Create game",
        "begin_game" : "Start game",
        "cancel_game" : "Cancel game",
        "join_game" : "Join game",
        "join_game_text" : "Select the game you want to join",
        "waiting_for_players_title" : "Waiting for players for game <GAME_ID>",
        "waiting_for_players_text" : "When all players joined, you can start the game.",
        "waiting_for_game_begin" : "Waiting for game to begin",
        "num_players" : "Currenty <NUM_PLAYERS> are connected"
      },

      "sync" : {
        "init" :  "Initializing...",
        "syncing_clocks" :  "Syncing clocks..."
      },

      "master" :{

        "state" : {
          "waiting_for_answer" : "Waiting for answers...",
          "question_prepare" : "Showing countdown...",
          "evaluate_answers" : "Showing correct answers..."
        },

        "messages" : {
          "time_first" : {
            "fastest_player" : "<PLAYER> was fastest"
          },
          "timeout_everyone" : "Nobody answered in time!",
          "finish" : "Spiel beenden" 
        },

        'question' : {
          'answer_given' : '<PLAYER> answers. Is it correct?',
          'answer_correct' : 'Yes',
          'answer_incorrect' : 'No',
          'answer_part_correct' : 'Partially',
          'next_question' : 'Show next question'
        }
      },
      "player"  : {
        "prepare" : {
          "get_ready"   : "Get Ready!",
          "mode_first"  : "Be fast! Only the fastest player can answer!",
          "mode_order"  : "The faster you are, the more points you get!",
          "mode_relax_no_timeout"  : "Relax, there's no time limit.",
          "mode_relax_timeout"  : "Be aware of the timeout."
        },

        "question" : {
          "buzzer" : 'Buzz!'
        },

        "messages" : {
          "mode_first" : {
            "time_over" : "Someone else gave an answer", 
            "fastest_player" : "<PLAYER> was fastest and gives the answer.", 
            "fastest_you" : "You were the fastest and can answer now.",
            "checking_fastest"  : 'Checking who was fastest'
          },

          "problems" : {
            "sync" : "Error in synchronization occured. Waiting for next reentry point."
          },

          "timeout" : "The time has run up :(",
          "timeout_everyone" : "Nobody answered in time.",
          "waiting_question_finish" : "Waiting for other players",
          "finish" : "Spiel beenden" 
        }
      }
  }
}
