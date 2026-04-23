export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const RANK_VALUE = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14 }

export const generateDeck = () => {
  const deck = []
  let id = 0
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: id++, suit, rank, value: RANK_VALUE[rank] })
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

export const dealCards = (players) => {
  const deck = shuffleDeck(generateDeck())
  const hands = {}

  players.forEach((player, i) => {
    hands[player.uid] = deck.slice(i * 13, (i + 1) * 13).sort((a, b) => {
      if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
      return b.value - a.value
    })
  })

  return hands
}

export const initCallBridgeGame = (players, targetScore = 21) => {
  const hands = dealCards(players)

  const playerStates = players.map(player => ({
    uid: player.uid,
    name: player.name,
    avatar: player.avatar,
    hand: hands[player.uid],
    cardCount: 13,
    bid: null,
    tricksWon: 0,
    score: 0,
    totalScore: 0,
  }))

  return {
    players: playerStates,
    phase: 'bidding',
    currentPlayerIndex: 0,
    trumpSuit: null,
    currentTrick: [],
    leadSuit: null,
    trickHistory: [],
    round: 1,
    targetScore,
    winner: null,
    lastAction: null,
    dealerIndex: 0,
  }
}

export const processBid = (state, playerId, bid) => {
  const newState = JSON.parse(JSON.stringify(state))
  const player = newState.players.find(p => p.uid === playerId)
  const currentPlayer = newState.players[newState.currentPlayerIndex]

  if (currentPlayer.uid !== playerId) return state

  if (bid < 0 || bid > 13) return state

  player.bid = bid
  newState.lastAction = { type: 'bid', playerId, bid, timestamp: Date.now() }

  const allBid = newState.players.every(p => p.bid !== null)

  if (allBid) {
    const highBidder = newState.players.reduce((best, p) => p.bid > best.bid ? p : best)
    newState.trumpSuit = null
    newState.phase = 'trump-selection'
    newState.currentPlayerIndex = newState.players.findIndex(p => p.uid === highBidder.uid)
  } else {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
  }

  return newState
}

export const processSelectTrump = (state, playerId, suit) => {
  const newState = JSON.parse(JSON.stringify(state))
  newState.trumpSuit = suit
  newState.phase = 'playing'
  newState.currentPlayerIndex = (newState.dealerIndex + 1) % newState.players.length
  newState.lastAction = { type: 'trump', playerId, suit, timestamp: Date.now() }
  return newState
}

export const getValidPlays = (hand, leadSuit, trumpSuit) => {
  if (!leadSuit) return hand

  const followSuit = hand.filter(c => c.suit === leadSuit)
  if (followSuit.length > 0) return followSuit

  const trumpCards = hand.filter(c => c.suit === trumpSuit)
  if (trumpCards.length > 0) return trumpCards

  return hand
}

export const isValidPlay = (hand, card, leadSuit, trumpSuit) => {
  const validPlays = getValidPlays(hand, leadSuit, trumpSuit)
  return validPlays.some(c => c.id === card.id)
}

export const determineTrickWinner = (trick, leadSuit, trumpSuit) => {
  let winner = trick[0]

  for (const entry of trick) {
    const { card } = entry
    const { card: winCard } = winner

    const isTrump = card.suit === trumpSuit
    const winIsTrump = winCard.suit === trumpSuit
    const isLead = card.suit === leadSuit

    if (isTrump && !winIsTrump) {
      winner = entry
    } else if (isTrump && winIsTrump && card.value > winCard.value) {
      winner = entry
    } else if (!winIsTrump && isLead && card.value > winCard.value && card.suit === winCard.suit) {
      winner = entry
    } else if (!winIsTrump && !winIsTrump && card.suit === leadSuit && winCard.suit !== leadSuit) {
      winner = entry
    }
  }

  return winner.playerId
}

export const processPlayCard = (state, playerId, cardId) => {
  let newState = JSON.parse(JSON.stringify(state))
  const currentPlayer = newState.players[newState.currentPlayerIndex]

  if (currentPlayer.uid !== playerId) return state

  const player = newState.players.find(p => p.uid === playerId)
  const cardIndex = player.hand.findIndex(c => c.id === cardId)

  if (cardIndex === -1) return state

  const card = player.hand[cardIndex]
  const leadSuit = newState.currentTrick.length > 0 ? newState.currentTrick[0].card.suit : null

  if (!isValidPlay(player.hand, card, leadSuit, newState.trumpSuit)) return state

  player.hand.splice(cardIndex, 1)
  player.cardCount = player.hand.length

  if (!leadSuit) newState.leadSuit = card.suit

  newState.currentTrick.push({ playerId, card })
  newState.lastAction = { type: 'play', playerId, card, timestamp: Date.now() }

  if (newState.currentTrick.length === newState.players.length) {
    const winnerId = determineTrickWinner(newState.currentTrick, newState.leadSuit, newState.trumpSuit)
    const winnerPlayer = newState.players.find(p => p.uid === winnerId)
    winnerPlayer.tricksWon++

    newState.trickHistory.push({
      trick: [...newState.currentTrick],
      winner: winnerId,
    })

    newState.currentTrick = []
    newState.leadSuit = null

    const allDone = newState.players.every(p => p.hand.length === 0)

    if (allDone) {
      newState.phase = 'scoring'
      newState = calculateScores(newState)
    } else {
      newState.currentPlayerIndex = newState.players.findIndex(p => p.uid === winnerId)
    }
  } else {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
  }

  return newState
}

export const calculateScores = (state) => {
  const newState = JSON.parse(JSON.stringify(state))

  for (const player of newState.players) {
    if (player.bid === 0) {
      player.score = player.tricksWon === 0 ? 10 : -10
    } else if (player.tricksWon >= player.bid) {
      player.score = player.bid * 2 + (player.tricksWon - player.bid)
    } else {
      player.score = -(player.bid * 2)
    }
    player.totalScore = (player.totalScore || 0) + player.score
  }

  const champion = newState.players.find(p => p.totalScore >= newState.targetScore)
  if (champion) {
    newState.phase = 'finished'
    newState.winner = champion.uid
  } else {
    newState.phase = 'round-end'
  }

  return newState
}

export const startNewRound = (state) => {
  const newState = JSON.parse(JSON.stringify(state))
  const hands = dealCards(newState.players)

  newState.players = newState.players.map(player => ({
    ...player,
    hand: hands[player.uid],
    cardCount: 13,
    bid: null,
    tricksWon: 0,
    score: 0,
  }))

  newState.phase = 'bidding'
  newState.currentTrick = []
  newState.leadSuit = null
  newState.trumpSuit = null
  newState.trickHistory = []
  newState.round++
  newState.dealerIndex = (newState.dealerIndex + 1) % newState.players.length
  newState.currentPlayerIndex = (newState.dealerIndex + 1) % newState.players.length

  return newState
}

export const getSuitSymbol = (suit) => {
  return { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[suit] || ''
}

export const getSuitColor = (suit) => {
  return ['hearts', 'diamonds'].includes(suit) ? 'text-red-500' : 'text-gray-900'
}
