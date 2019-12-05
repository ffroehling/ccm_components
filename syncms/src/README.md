# SyncMS Component

This component implements syncms logic, which can be used in any distributed system. 
Have a look at https://ieeexplore.ieee.org/document/1181396 for details.

# General info
The component does not provide any UI interface, since its only purpose is the synchronized message transmittment. 

The component distinguishs between *master* and *slave* instances. One message group (determined via datastore) requires exact ONE MASTER. The number of slaves is arbitrary.
The master instance can sync out, and slave instances are able to sync in (see referenced paper if you don't understand this). The only implemented sync_in algorithm is "max_wait".

# Setup
Setup the configuration for syncms at each instance. Most important, you need to tell syncms a *common datastore*, where messages can be exchanged between instances in the ccm way. 
Secondly you need to provide a list of all slaves with a *unique identifier* for each slave in the configuration. 
See the attached example configuration to see how to do this and what you need to configure. There are several other configuration options, which are mostly timeouts for several events. It's best to use the default values here. An explanation is given in the source code at the very beginning (see config section).

At each instance you must then first call *initialize*, then *clock_sync* and finally *listener*. 
Each of these functions returns a promise which resolves, if the operation was successfull.

## Initialize 
Checks if all slaves are connected.

## Clock Sync
Call this only if the previous returned promise resolved! 
Synchronizes the clock between the instances

## Listener 
Call this only if the previous returned promises resolved! 
Listens for messages on the network and notifies you, by your defined callback. These messages are synchronized by symcs-algorithm.

## Usage
At any time your master instance can now sync out an arbitrary object, by calling *sync_out*. The slaves will get notified.
Also, at any time the slaves can sync_in an arbitrary object by calling *sync_in*. 
Notice that the master instance WILL NOT receive the message (and deliver it to your application) unless you enabled sync_in. 
You can enable sync_in by calling *enable_sync_in* and disable it again with *disable_sync_in*.


# Example configuration
See configuration.example.js for an example configuration.
