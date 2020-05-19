import { cmd } from 'elm-ts/lib'
import { Cmd } from 'elm-ts/lib/Cmd'
import { Html } from 'elm-ts/lib/React'
import { perform } from 'elm-ts/lib/Task'
import { Task } from 'fp-ts/lib/Task'
import * as React from 'react'
import { assertNever } from './assertNever'

// Model
export type Player = 'player1'  | 'player2'
type Point = 'Love' | 'Fifteen' | 'Thirty'


type PointsData = { type: 'PointsData', player1: Point, player2: Point }
type FourtyData = { type: 'FourtyData', player: Player, otherPlayerPoints: Point }
type AdventageData = { type: 'AdventageData', player: Player }
type DeuceData = { type: 'Deuce' }
type GameData = { type: 'GameData', player: Player }

type Score = 
  | PointsData
  | FourtyData
  | AdventageData
  | DeuceData
  | GameData

export type Model = { score: Score, lastPointWonBy: Player | null }

const initialModel: Model = {
  score: { type: 'PointsData', player1: 'Love', player2: 'Love' },
  lastPointWonBy: null,
}

export const init: [Model, Cmd<Action>] = [
  initialModel,
  cmd.none
]
  
const increasePoints = (point: Point): Point | null => {
  switch (point) {
    case 'Love': return 'Fifteen';
    case 'Fifteen': return 'Thirty';
    case 'Thirty': return null;
    default: return assertNever(point);
  }
}

const findOtherPlayer = (playerWhoWonPoint: Player): Player => playerWhoWonPoint === 'player1' ? 'player2' : 'player1';


const pointDataFunction = (playerWhoWonPoint: Player, score: PointsData): Score => {
  const newPlayersPoints = increasePoints(score[playerWhoWonPoint])
  if (newPlayersPoints != null) return ({ ...score, [playerWhoWonPoint]: newPlayersPoints })
  return {
    type: 'FourtyData',
    player: playerWhoWonPoint,
    otherPlayerPoints: score[findOtherPlayer(playerWhoWonPoint)]
  }
}

const fourtyDataFunction = (playerWhoWonPoint: Player, score: FourtyData): Score => {
  if (score.player === playerWhoWonPoint) return { type: 'GameData', player: playerWhoWonPoint }
  const newOtherPlayerPoints = increasePoints(score.otherPlayerPoints)

  if (newOtherPlayerPoints != null) return { ...score, type: 'FourtyData', otherPlayerPoints: newOtherPlayerPoints }
  return { type: 'Deuce' }
}

const deuceDataFunction = (playerWhoWon: Player): Score => ({ type: 'AdventageData', player: playerWhoWon})

const advantageDataFunction = (playerWhoWon: Player, score: AdventageData): Score => {
  if (score.player === playerWhoWon) return { type: 'GameData', player: playerWhoWon }
  return { type: 'Deuce' }
}

const playPoint = (player: Player, model: Model): Model => {
  const { score } = model

  switch(score.type) {
    case 'PointsData': return {
      score: pointDataFunction(player, score),
      lastPointWonBy: player,
    };
    case 'FourtyData': return {
      score: fourtyDataFunction(player, score),
      lastPointWonBy: player,
    }
    case 'Deuce': return {
      score: deuceDataFunction(player),
      lastPointWonBy: player,
    }
    case 'AdventageData': return {
      score: advantageDataFunction(player, score),
      lastPointWonBy: player,
    };
    case 'GameData': return initialModel;
    default: return assertNever(score);
  }
}


const pointsToString = (points: Point): string => {
  switch(points) {
    case 'Love': return '0';
    case 'Fifteen': return '15';
    case 'Thirty': return '30';
    default: return assertNever(points);
  }
}


const generateOutput = (player: Player, model: Model): string => {
  const { score } = model;
  switch(score.type) {
    case 'PointsData': return pointsToString(score[player]);
    case 'FourtyData': return score.player === player ? '40' : pointsToString(score.otherPlayerPoints);
    case 'Deuce': return 'Deuce';
    case 'AdventageData': return score.player === player ? 'Adventage' : '_';
    case 'GameData': return score.player === player ? 'Winner' : 'Loser';
    default: return assertNever(score);  
  }
}

const generatePlayer = ():Player => Math.random() > 0.5 ? 'player1' : 'player2';
const generatePlayerTask: Task<Player> = new Task(() => Promise.resolve(generatePlayer()));


// UPDATE
type Action = 
  | { type: 'NextPoint' }
  | { type: 'WinPoint', player: Player }
  ;

export const update = (action: Action, model: Model): [Model, Cmd<Action>] => {
  switch(action.type) {
    case 'NextPoint': return [
      model,
      perform(generatePlayerTask, player => ({ type: 'WinPoint', player }))
    ];
    case 'WinPoint': {
      const newModel = playPoint(action.player, model);
      return [
          newModel,
          cmd.none
      ];
    }
    default: return assertNever(action); 
  }
}


// View
export const view = (model: Model): Html<Action> => dispatch => (
  <div>
    <div>
      <h1>Tennis game</h1>
      <h2>Player one: {generateOutput('player1', model)}</h2>
      <h2>Player two: {generateOutput('player2', model)}</h2>
    </div>
    <button onClick={ () => dispatch({ type: 'NextPoint' }) }>Next point</button>
  </div>
)