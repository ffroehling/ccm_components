# CCM-Communication-Tester

## Introduction

This is CCM-Component which tests the communication between several CCM-Instances via a level-3-datastore. 

### Communication in CCM
In CCM the only way of exchaning data between several instances is to use a Level-3-Datastore. For this, each instance opens a connection to a serverside interface to store data in a database (Mongo-DB). The serverpoint and the dataset to connect to are required configuration options for each instance. Upon saving the dataset on client side (instance), it will be updated on serverside aswell, which is done by the ccm-framework. If there's is an addition "onchange"-callback provided, the server informs every other connected instance about the updated dataset. This enables a realtime crossdomain communicatoin between several instances of CCM-Components.

### Testing of the communication
 Using the serverside database as a communication medium is not the best from a effiency point of view, but unfortunately there is no alternative. Also it works quite well in the first place. The main reason for this componeent is a strange behaviour in the messaging system, that noticed while developing another CCM-Component, where it is important to get updates as soon as possible.   
In this project a ran into a bug which was randomly occuring. I sent messages from every instance as a broadcast (because there's no other way) to all other instances, expecting to receive the same message once at every instance. This was NOT the case. I did receive messages at every other instance, but unfortunately some messages occured multiple times while other messages didn't occur at all. Having said this, i first thought of a bug in my sending or receiving implementation and tracked it down to the core. As a result, i think that the messages are getting mixed up at the serverside. When i have eight instances where each instance is sending exactly one message (store it in the db) i expect 7 messages at each other instance, each with the unique content from it's origin. Each instance does indeed receive SEVEN messages, but with the content is NOT UNIQUE. For example, the message of instances X occurs 3 times at all other instances, the message of instance Y occurs 4 times at all other instances and the messages of every instance is LOST. It is not just delayed, the message is indeed completely lost.   I further noticed that this happens more likely if more instances are included AND if the instances are sending their messages almost at the same time.

# Testing Algorithm
As a result, i wrote this small ccm-component which is testing for exactly this case. In the html file i defined 8 instances of the component, each with a unique identifier. The algorithm of the component consists of three iterations where in each iteration simply data is exchanged between all instances. The only difference inbetween the iterations is the time of sending (storing) of the data at each instance. Each instance writes its unique identifier ONCE PER ITERATION. In each iteration all instances receive the messages from each other instance (the identifier of the sender) and write it to a local list, indicating that we received the message from this specific instance. At the end of the third iteration the lists are simply printed to the screen. To be sure that all instances are synchronus at the same iteration a delay of 2 seconds is introduced between the iterations. For technical reasons, it is required to send the iteration aswell, but this is only to be sure that the instances are synchronus.

## First iteration
Immediatly after the start of the instances the instances are writing their uniuqe identifier without any delay. Note that there are huge delays anyway, because of the loading and starting time of the instances which are caused by the browser.

## Second iteration
Each instance waits a random amount of time (50ms - 1000ms) before sending their unique value.

## Third iteration
Each instance sends their value with a really small delay (10ms), so almost immediatly. Note that here is NO ADDITIONAL DELAY of the loading and starting of the components (as in the first iteration).

# Examination

## Expected results
If anything is working correctly in the communication system i would expect to receive each message once at each instance. For example, the list of "instance 3" in each iteration would be  
* Instance 1
* Instance 2
* Instance 4
* Instance 5
* Instance 6
* Instance 7
* Instance 8

## Results
In the first two iterations everything is correct most of the time. There're some exceptions in the second iterations, most likely if the random waiting time of the instances is too close to each other. Anyways, in the third iteration the messages are completely upset most of the time. For example, instance 3 received

* Instance 8
* Instance 5
* Instance 5
* Instance 5
* Instance 5
* Instance 5
* Instance 5

So the message from instance 5 is received 6 times, the message from instance 8 is received correctly and all other messages are lost. This confirms the bug i was searching for.
Note that other instances are receiving (in some cases just almost) the same, incorrect messages. Concluding this, i think that at serverside some bad magic is happening and messages, which arriving almost at the same time, are mixed up.

# Usage and reproduction

To use this component and execute the test simply clone this repository, open the html file and wait for the test to finish (which should take around 6 seconds).

# Neccesary action
We need to find and fix the bug on the serverside as this is a huge barrier for time critical applications (as my application is).
