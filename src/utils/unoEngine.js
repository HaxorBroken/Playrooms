export const COLORS = ['red', 'blue', 'green', 'yellow']
export const SPECIAL_VALUES = ['skip', 'reverse', 'draw2']
export const WILD_VALUES = ['wild', 'wild4']

export const generateDeck = () => {
  const deck = []
  let id = 0

  for (const color of COLORS) {
    deck.push({ id: id++, color, value: '0', type: 'number' })

    for (const value of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      deck.push({ id: id++, color, value, type: 'number' })
      deck.push({ id: id++, color, value, type: 'number' })
    }

    for (const value of SPECIAL_VALUES) {
      deck.push({ id: id++, color, value, type: 'special' })
      deck.push({ id: id++, color, value, type: 'special' })
    }
  }

  for (const value of WILD_VALUES) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: id++, color: 'wild', value, type: 'wild' })
    }
  }

  return deck
}

export const shuffleDeck = (deck) => {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const dealCards = (deck, playerCount, cardsEach = 7) => {
  const shuffled = shuffleDeck(deck)
  const hands = Array.from({ length: playerCount }, () => [])

  for (let i = 0; i < cardsEach * playerCount; i++) {
    hands[i % playerCount].push(shuffled[i])
  }

  let deckIndex = cardsEach * playerCount

  let topCard = shuffled[deckIndex]
  deckIndex++

  while (topCard.type === 'wild') {
    topCard = shuffled[deckIndex]
    deckIndex++
  }

  const remaining = shuffled.slice(deckIndex)

  return { hands, topCard, remaining }
}

export const isPlayable = (card, topCard, currentColor, pendingDrawCount) => {
  if (pendingDrawCount > 0) {
    if (pendingDrawCount > 0) {
      if (card.value === 'draw2' && topCard.value === 'draw2') return true
      if (card.value === 'wild4') return true
      return false
    }
  }

  if (card.type === 'wild') return true
  if (card.color === currentColor) return true
  if (card.value === topCard.value) return true

  return false
}

export const getPlayableCards = (hand, topCard, currentColor, pendingDrawCount) => {
  return hand.filter(card => isPlayable(card, topCard, currentColor, pendingDrawCount))
}

export const applyCardEffect = (state, playedCard, chosenColor) => {
  const { players, currentPlayerIndex, direction, drawPile, pendingDrawCount } = state
  const playerCount = players.length
  let nextPlayerIndex = currentPlayerIndex
  let newDirection = direction
  let newPendingDraw = 0
  let skipNext = false
  let stackedDraw = pendingDrawCount || 0

  if (playedCard.value === 'skip') {
    skipNext = true
  } else if (playedCard.value === 'reverse') {
    if (playerCount === 2) {
      skipNext = true
    } else {
      newDirection = direction === 1 ? -1 : 1
    }
  } else if (playedCard.value === 'draw2') {
    newPendingDraw = stackedDraw + 2
  } else if (playedCard.value === 'wild4') {
    newPendingDraw = stackedDraw + 4
  }

  const advance = (from, skip) => {
    let next = (from + newDirection + playerCount) % playerCount
    if (skip) next = (next + newDirection + playerCount) % playerCount
    return next
  }

  nextPlayerIndex = advance(currentPlayerIndex, skipNext)

  const newColor = playedCard.type === 'wild' ? chosenColor : playedCard.color

  return {
    currentPlayerIndex: nextPlayerIndex,
    direction: newDirection,
    currentColor: newColor,
    pendingDrawCount: newPendingDraw,
  }
}

export const initUnoGame = (players) => {
  const deck = generateDeck()
  const { hands, topCard, remaining } = dealCards(deck, players.length)

  const playerStates = players.map((player, i) => ({
    uid: player.uid,
    name: player.name,
    avatar: player.avatar,
    hand: hands[i],
    cardCount: hands[i].length,
    saidUno: false,
    unoViolation: false,
  }))

  return {
    players: playerStates,
    drawPile: remaining,
    discardPile: [topCard],
    topCard,
    currentColor: topCard.color,
    currentPlayerIndex: 0,
    direction: 1,
    pendingDrawCount: 0,
    phase: 'playing',
    winner: null,
    lastAction: null,
    turnStartTime: Date.now(),
  }
}

export const drawFromPile = (drawPile, discardPile, count) => {
  let pile = [...drawPile]
  const drawn = []

  for (let i = 0; i < count; i++) {
    if (pile.length === 0) {
      const discard = [...discardPile]
      const top = discard.pop()
      pile = shuffleDeck(discard)
      discardPile = [top]
    }
    if (pile.length > 0) {
      drawn.push(pile.pop())
    }
  }

  return { drawn, newDrawPile: pile, newDiscardPile: discardPile }
}

export const validateMove = (state, playerId, card, chosenColor) => {
  const currentPlayer = state.players[state.currentPlayerIndex]

  if (currentPlayer.uid !== playerId) {
    return { valid: false, reason: 'Not your turn' }
  }

  const playerState = state.players.find(p => p.uid === playerId)
  if (!playerState) return { valid: false, reason: 'Player not found' }

  const hasCard = playerState.hand.some(c => c.id === card.id)
  if (!hasCard) return { valid: false, reason: 'Card not in hand' }

  if (!isPlayable(card, state.topCard, state.currentColor, state.pendingDrawCount)) {
    return { valid: false, reason: 'Card is not playable' }
  }

  if (card.type === 'wild' && !chosenColor && state.players.find(p => p.uid === playerId)?.hand.length > 1) {
    return { valid: false, reason: 'Must choose a color for wild card' }
  }

  return { valid: true }
}

export const processPlayCard = (state, playerId, cardId, chosenColor) => {
  const newState = JSON.parse(JSON.stringify(state))
  const playerIndex = newState.players.findIndex(p => p.uid === playerId)
  const player = newState.players[playerIndex]

  const cardIndex = player.hand.findIndex(c => c.id === cardId)
  const card = player.hand[cardIndex]

  player.hand.splice(cardIndex, 1)
  player.cardCount = player.hand.length
  player.saidUno = false

  newState.discardPile.push(card)
  newState.topCard = card

  if (player.hand.length === 0) {
    newState.phase = 'finished'
    newState.winner = playerId
    return newState
  }

  const effects = applyCardEffect(newState, card, chosenColor)
  Object.assign(newState, effects)

  newState.lastAction = { type: 'play', playerId, card, chosenColor, timestamp: Date.now() }
  newState.turnStartTime = Date.now()

  return newState
}

export const processDrawCard = (state, playerId) => {
  const newState = JSON.parse(JSON.stringify(state))
  const playerIndex = newState.players.findIndex(p => p.uid === playerId)
  const player = newState.players[playerIndex]

  const drawCount = newState.pendingDrawCount > 0 ? newState.pendingDrawCount : 1

  const { drawn, newDrawPile, newDiscardPile } = drawFromPile(
    newState.drawPile,
    newState.discardPile,
    drawCount
  )

  player.hand.push(...drawn)
  player.cardCount = player.hand.length
  newState.drawPile = newDrawPile
  newState.discardPile = newDiscardPile
  newState.pendingDrawCount = 0

  const playerCount = newState.players.length
  newState.currentPlayerIndex = (newState.currentPlayerIndex + newState.direction + playerCount) % playerCount
  newState.lastAction = { type: 'draw', playerId, count: drawCount, timestamp: Date.now() }
  newState.turnStartTime = Date.now()

  return newState
}

export const processSayUno = (state, playerId) => {
  const newState = JSON.parse(JSON.stringify(state))
  const player = newState.players.find(p => p.uid === playerId)

  if (player && player.hand.length === 1) {
    player.saidUno = true
    newState.lastAction = { type: 'uno', playerId, timestamp: Date.now() }
  }

  return newState
}

export const processUnoChallenge = (state, challengerId, targetId) => {
  const newState = JSON.parse(JSON.stringify(state))
  const target = newState.players.find(p => p.uid === targetId)

  if (target && target.hand.length === 1 && !target.saidUno) {
    const { drawn, newDrawPile, newDiscardPile } = drawFromPile(
      newState.drawPile,
      newState.discardPile,
      2
    )
    target.hand.push(...drawn)
    target.cardCount = target.hand.length
    newState.drawPile = newDrawPile
    newState.discardPile = newDiscardPile
    newState.lastAction = { type: 'uno-challenge', challengerId, targetId, success: true, timestamp: Date.now() }
  } else {
    newState.lastAction = { type: 'uno-challenge', challengerId, targetId, success: false, timestamp: Date.now() }
  }

  return newState
}

export const getCardColorClass = (color) => {
  const map = {
    red: 'from-red-600 to-red-800 border-red-400',
    blue: 'from-blue-600 to-blue-800 border-blue-400',
    green: 'from-green-600 to-green-800 border-green-400',
    yellow: 'from-yellow-500 to-yellow-700 border-yellow-400',
    wild: 'from-gray-700 to-gray-900 border-gray-500',
  }
  return map[color] || map.wild
}

export const getCardTextColor = (color) => {
  return color === 'yellow' ? 'text-yellow-900' : 'text-white'
}

export const getCardSymbol = (value) => {
  const map = {
    skip: '⊘',
    reverse: '⇄',
    draw2: '+2',
    wild: '★',
    wild4: '+4',
  }
  return map[value] || value
}
