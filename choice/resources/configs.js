/**
 * @configurations for executing a single choice or multiple choice question
 * @author Felix Fröhling <felix.froehling1@gmail.com> 2019
 * @license The MIT License (MIT)
 */

ccm.files[ 'configs.js' ] = {
  "single": { 
    "css" : ["ccm.load", "resources/style.css"],
    "type" : "single",

    /*
     * It is also possible to include a picture if neccessary
    "question_image" : "<SOME URL HERE>"
    */

    "question_text" : "Which answer is correct?",
    "answers": [
      {"value" : "Answer 1", "correct" : false} ,
      {"value" : "Answer 2 (correct)", "correct" : true},
      {"value" : "Answer 3", "correct" : false},
      {"value" : "Answer 4", "correct" : false}
    ]
  },
  "multiple" : {
    "css" : ["ccm.load", "resources/style.css"],
    "type" : "multiple" ,

    /*
     * It is also possible to include a picture if neccessary
    "question_image" : "<SOME URL HERE>"
    */
    "question_text" : "Which answers are correct?",
    "answers": [
      {"value" : "Answer 1", "correct" : false} ,
      {"value" : "Answer 2 (Correct)", "correct" : true},
      {"value" : "Answer 3 (Correct)", "correct" : true},
      {"value" : "Answer 4", "correct" : false}
    ]
  }
}
