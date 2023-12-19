import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Message, NoWayOutState, Rotation } from './types.js'
import { message } from './utils/message.js'
import * as readlineSync from 'readline-sync'
import { getWalls } from './utils/walls.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'

/**Control schema for numpad.*/
enum NumpadDirection {
  N = 8,
  NE = 9,
  E = 6,
  SE = 3,
  S = 2,
  SW = 1,
  W = 4,
  NW = 7,
}

/**Convert numpad direction to game Rotation.*/
const toGameRotation = (direction: NumpadDirection): Rotation => {
  switch (direction) {
    case NumpadDirection.N:
      return 0
    case NumpadDirection.NE:
      return 45
    case NumpadDirection.E:
      return 90
    case NumpadDirection.SE:
      return 135
    case NumpadDirection.S:
      return 180
    case NumpadDirection.SW:
      return 225
    case NumpadDirection.W:
      return 270
    case NumpadDirection.NW:
      return 315
    default:
      break
  }
}

/**Listen to user input for next player action.*/
const getPlayerAction = (gameState: NoWayOutState): Action => {
  const { player, square } = gameState
  const { rotation } = player

  const walls = getWalls(square)
  let newRotation: Rotation
  let numpadDirection: NumpadDirection
  let userInput: string 

  // Ask user for input until they choose a direction without a wall.
  while (true) {
    userInput = readlineSync.keyIn('Waiting for user input...', {
      hideEchoBack: true,
      mask: '',
      limit: '12346789',
    })
    numpadDirection = parseInt(userInput)
    newRotation = toGameRotation(numpadDirection)

    // Break out from loop if user picks a rotation without a wall.
    if (!walls[newRotation]) {
      break
    }
  }

  // Check if player wants to rotate or move forward.
  if (rotation !== newRotation) {
    // Player picked a new direction, rotate player.
    return {
      action: 'rotate',
      rotation: newRotation || 0,
    }
  } else {
    // Player chose old direction, move forward.
    return {
      action: 'move',
    }
  }
}

const createGame = async (levelId: string, token: string) => {
  const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })

  if (!res.ok) {
    console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`)
    return null
  }

  return res.json() as any as GameInstance // Can be made safer
}

const main = async () => {
  const token = process.env['PLAYER_TOKEN'] ?? ''
  const levelId = process.env['LEVEL_ID'] ?? ''

  console.info(`Choose direction with numpad: 8 = up, 6 = right, 2 = down, etc.
            \n\nConfirm move with choosing the same direction again.
            \n\nDiagonal moves are also allowed.`)

  const game = await createGame(levelId, token)
  if (!game) return

  const url = `https://${frontend_base}/?id=${game.entityId}`
  console.log(`Game at ${url}`)
  await open(url) // Remove this if you don't want to open the game in browser

  await new Promise((f) => setTimeout(f, 2000))
  const ws = new WebSocket(`wss://${backend_base}/${token}/`)

  ws.addEventListener('open', () => {
    ws.send(message('sub-game', { id: game.entityId }))
  })

  ws.addEventListener('message', ({ data }) => {
    const [action, payload] = JSON.parse(data.toString()) as Message<'game-instance'>

    if (action !== 'game-instance') {
      console.log([action, payload])
      return
    }

    // New game tick arrived!
    const gameState = JSON.parse(payload['gameState']) as NoWayOutState
    const commands = getPlayerAction(gameState)

    setTimeout(() => {
      ws.send(message('run-command', { gameId: game.entityId, payload: commands }))
    }, 100)
  })
}

await main()
