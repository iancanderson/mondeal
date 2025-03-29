# Mondeal

Testing with cards on top of deck:

```
TOP_CARDS=SLY_DEAL,FORCED_DEAL npm run dev
```

## Done

- Playing properties
- Playing money
- Playing actions as money
- Sly Deal
- Pass Go
- Deal Breaker
- Players shouldn't be able to cancel rent
- Rent cards!
- Just Say No
- 2-color property wildcards (in addition to the "any color" wild card)
- Bug: when a player does "Just Say No", and it cancels the current player's last action for their turn, the next person's turn should start automatically.
- Don't allow players to pay rent with cards from their hand
- House
- Hotel
- Forced Deal
- Debt Collector
- Sly Deal said "no one has properties to steal" when they did.
- Remove ability to cancel out of a forced deal. Game gets stuck otherwise
- When 1 player pays the rent, it doesn't let anyone else pay rent, but the game cant continue because it's waiting for everyone to pay rent.
- Debt collector didn't give an opportunity to use Just Say No
- It's My Birthday
- Double The Rent
- Player has to discard down to 7 cards at end of turn
- Debt Collector should let the person with the debt select how to pay, not the collector.
- Allow player to auto-rejoin the game if they accidentally refresh the page, instead of making everyone quit the game.
- If a user has disconnected from a game, they should see it in the lobby to rejoin it
- Playing forced deal

## TODO

- expire games after an hour or something
- Show modal to allow user to enter name if they click to join a game with a blank name