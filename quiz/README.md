# Quiz component

This is a quiz component for realtime multiplayer quiz.

# Example
Click [here](example.html) and open it in multiple *windows* since there have been issues in synchronisation with only different tabs instead of windows. Once you have chosen your username you can Create a game or join an existing one. Obviously you need to create you game before joining one in the other instances. You can then start the game.

# Versions
[Version 1.0.0](versions/ccm.quiz-1.0.0.js)

# Configuration 
See [configuration](resources/configs.js) to get an idea of the needed configuration. Basicly you need to define a datastore for the communication. The gamification component is required, so you could leave it as it is. Most important you need to configure your questions based on compatible components. Have a look at the DMS of my developed components for compatible Apps. If required, you can change to defined template to your needs.

# Developing Quiz methods
If you want to develop your own quiz method, you need to implement a specific interface in your component. This interface is described below. For examples have a look at the other components. The interface isn't that complicated.

## Answer Callback
When the user is hitting "Submit" (or sth. similar) you need to notify the quizcomponent by invoking the callback "answer_callback". This is an attribute which is set by the quiz component, so you do not neccessary need to create it (however it is recommend to do so). The method takes two parameters:
* The percentage of the correctness as a number
* The answer itself as any object you can define on your own. You need to be able to parse this object later on.

## Set answer
Implement the method "set_given_answer". This function takes the given answer that you give in the callback (see above) as parameter.

## Correct answer
Implement the method "show_correct_answer". The method should show the correct solution comparing to the solution of the user. No parameters are required. Note that the given answer of the user could be overwritten by "set_given_answer" which should then be treated as the given answer. 

## Check Show feedback
Optionally you can check for the flag "show_feedback". When set to false *do not show* the correct answer described above. This is not required but helpful. 



