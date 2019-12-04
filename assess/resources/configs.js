ccm.files[ 'configs.js' ] = {
  "water_earth" : {
    "css" : ["ccm.load", "resources/style.css"],
    "question_text" : 
    "How much liter of water exists on the earth? (answer in [10e18 liter])",
    //"correct" : 1385984600,
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
      "answer_placeholder" : "Antwort eingeben",
      "submit" : "Abgeben",
      "your_answer" : "Your answer",
      "correct_answer" : "Correct answer"
    }
  }
}
