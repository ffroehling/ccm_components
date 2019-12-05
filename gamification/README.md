# Gamification

This component implements the gamification elements *points* and *scoreboard* and is designed for a usage with a quiz system.

Basicly you can define an array of players where you can add points to and caluclate the scoreboard.
The component is able to to a (basic but nice) visualiazation of
- the retrieved points
- the scoreboard

# Source Code
[Version 1.0.0](gamification/versions/ccm.gamifcation-1.0.0.js)


# Point calculation

For calculationg points, two modes are available:

## Mode Relax

In Relax mode, specified by the string "mode_relax", only correctness of the answer is relevant, while time does not matter. You must provide the percentage of the correctness of the answer and the maximum amount of points. The calculation is as simple as the percentage of the maximum points, which is returned. 

## Mode Order
In Mode Order, specified by the string "mode_order" correctness and time matter. While points are calculated as in mode_relax, you can get additional points for the needed time. Therefore you must provide the needed time in [s] and the maximum amount of points by time. In the config of the instance you can set a threshold value (see example config). If this threshold is not exceeded full time points are given, otherwise you can configure in which interval [s] points will be substracted. Subtraction is done in equal parts down to zero. At the moment, this is quite unflexible, because you may wish to be either more precise (e.g. [ms] unit) everywhere) or set threshold for each question. Unfortunetaly this is not possible at the moment, but will be included soon. With these improved features, a realtime quiz of multiple players becomes even more fun (since the time factor matters more).

## Usage
Start the instance, set you list of players either via config or dynamic via *set_players* function. You can add points to player by calling *add_points_to_player*. See src code for neccessary parameters, but this isn't to complicated at all. For rendering the retrieved points call *show_last_points* immediatly without parameters. Scoreboard is rendered by calling *show_scoreboard*.


