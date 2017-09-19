import * as ActionTypes from 'constants/arcConstants'

export interface IDaoState {
  avatarAddress: string,
  controllerAddress: string,
  name: string,
  members: number,
  rank: number,
  promotedAmount: number,
  reputationAddress: string,
  reputationCount: number,
  tokenAddress: string,
  tokenCount: number
  tokenName: string,
  tokenSymbol: string
 }

export interface IArcState {
  controllerAddress: string,
  controllerInstance: any
  daoList: { [key : string] : IDaoState },
  genesisAddress: string,
  isCorrectChain: boolean,
  simpleICOAddress: string
 }

export const initialState : IArcState = {
  controllerAddress: null,
  controllerInstance: null,
  daoList: {},
  genesisAddress: null,
  isCorrectChain: false,
  simpleICOAddress: null
}

const arcReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.ARC_INITIALIZATION_PENDING: {
      return state;
    }

    case ActionTypes.ARC_INITIALIZATION_FULFILLED: {
      return {...state, ...action.payload };
    }

    case ActionTypes.ARC_INITIALIZATION_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_PENDING: {
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_FULFILLED: {
      return {...state, daoList: action.payload };
    }

    case ActionTypes.ARC_GET_DAOS_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_GET_DAO: {
      return state;
    }

    case ActionTypes.ARC_GET_DAO_FULFILLED: {
      let daoList = state.daoList;
      daoList[action.payload.avatarAddress] = action.payload;
      return {...state, daoList: daoList};
    }

    case ActionTypes.ARC_GET_DAO_REJECTED: {
      return state;
    }

    default: {
      return state;
    }
  }
}

export default arcReducer;