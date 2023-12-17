# monad23-submission

This is the code submission for Monad Oy's "koodipähkinä" at goldrush.monad.fi. See https://monad.fi/rekry/kesatyo/

Move the miner with numpad. Pick a rotation and move by picking the same key again. You cannot rotate or move towards walls to conserve movement points.

Control schema for numpad (It's obvious if you look at your keyboard.):
  N = 8,
  NE = 9,
  E = 6,
  SE = 3,
  S = 2,
  SW = 1,
  W = 4,
  NW = 7

## Requirements
- Node 18
- npm 9.5.1 ->

## Setup
Copy the `.env.sample` to `.env` and fill it with the correct information.

## Running

I used npm.
```sh
# Install dependencies
npm install

# Run script with nodemon and restart on file change
npm run dev
```
yarn should also work.
```sh
# Install dependencies
yarn install

# Run script with nodemon and restart on file change
yarn dev
```