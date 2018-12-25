const _actions = {}
export default _actions
// let _returnedInitial = false

const _reducers = {}
export function makeReducer(actionModel) {
  const { type, reducers } = actionModel
  const _reducer = _reducers[type]
  if (_reducer) {
    return _reducer
  }

  _actions[type] = createAction(type)

  function luxReducer(state, action) {
    // if (!_returnedInitial && /^@@redux[/]INIT/.test(action.type)) {
    //   _returnedInitial = true
    //   return initialState
    // }
    if (action.type !== type) {
      return
    }

    let newState = {}
    for (const [slice, reducer] of Object.entries(reducers)) {
      const result = reducer(state[slice], action.payload)
      if (!result) {
        continue
      }
      newState = { ...newState, [slice]: { ...state[slice], ...result } }
    }

    return newState
  }

  _reducers[type] = luxReducer
  return luxReducer
}

export function createAction(type) {
  return function actionCreator(payload) {
    if (!payload) {
      payload = {}
    }
    const result = {
      type,
      payload,
    }
    return result
  }
}

let _rootReducer
export function makeRootReducer(inputObject) {
  if (_rootReducer) {
    return _rootReducer
  }
  const {
    rootReducer: providedRootReducer,
    initialState,
    ...actionModels
  } = inputObject

  function rootReducer(state = initialState, action) {
    const nextState = Object.assign({}, state)
    const stateFromReducer = providedRootReducer
      ? providedRootReducer(nextState, action)
      : nextState
    // console.log('statefrom', stateFromReducer)
    // redux actions like "@@redux/INIT" don't have payload
    const luxAction = action.payload ? action : { ...action, payload: {} }

    for (const info of Object.values(actionModels)) {
      const reducer = makeReducer(info)
      const partialState = reducer(stateFromReducer, luxAction)
      if (!partialState) {
        continue
      }
      console.log('new state', partialState)
      Object.assign(stateFromReducer, partialState)
    }
    return stateFromReducer
  }

  _rootReducer = rootReducer
  return _rootReducer
}

let _rootSaga
export function makeRootSaga(inputObject) {
  if (_rootSaga) {
    return _rootSaga
  }
  const { rootSaga: providedRootSaga, ...rest } = inputObject
  const { takeEvery, all } = require('redux-saga/effects')
  const sagas = Object.values(rest).map(info => {
    const { saga, take = takeEvery, type } = info
    if (saga) {
      const sagaWithTake = take(type, saga)
      return sagaWithTake
    }
    return undefined
  })

  function* rootSaga() {
    yield all(sagas)
  }

  _rootSaga = providedRootSaga ? providedRootSaga(sagas) : rootSaga
  return _rootSaga
}

export function init(inputObject) {
  const rootReducer = makeRootReducer(inputObject)
  const rootSaga = makeRootSaga(inputObject)
  return {
    rootReducer,
    rootSaga,
  }
}
