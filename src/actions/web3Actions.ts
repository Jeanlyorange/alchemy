import * as Arc from "@daostack/arc.js";
import promisify = require("es6-promisify");
import * as Redux from "redux";
import { Web3 } from "web3";

import { IDAOState } from '@daostack/client'
import { getProfile } from "actions/profilesActions";
import Util from "lib/util";
import { IRootState } from "reducers";
import { ActionTypes, IWeb3State } from "reducers/web3Reducer";
import { AsyncActionSequence, IAsyncAction } from "./async";

export type ConnectAction = IAsyncAction<'WEB3_CONNECT', void, IWeb3State>;

export function initializeWeb3() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function): Promise<any> => {
    dispatch({
      type: ActionTypes.WEB3_CONNECT,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: 'Connecting...',
        totalSteps: 1,
      },
    } as ConnectAction);

    let web3: Web3;

    try {
      web3 = await Arc.Utils.getWeb3();
    } catch (e) {
      console.error(e);
      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Failed to connect to web3`
        },
      } as ConnectAction);

      return;
    }

    const networkId = Number(await Arc.Utils.getNetworkId());
    let accounts: string[]
    try {
      accounts = web3.eth.accounts
    } catch (err) {
      accounts = []
      console.log(`Error getting web3.eth.accounts: ${err.message}`)
    }
    const payload: IWeb3State = {
      accounts,
      currentAccountEthBalance: 0,
      currentAccountExternalTokenBalance: 0,
      currentAccountGenBalance: 0,
      currentAccountGenStakingAllowance: 0,
      ethAccountAddress: null as string,
      networkId,
    };

    try {
      payload.ethAccountAddress = (await Arc.Utils.getDefaultAccount()).toLowerCase();
    } catch (e) {
      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: `Connected to web3, but no default account selected.`
        },
        payload
      } as ConnectAction);

      return;
    }

    const getBalance = promisify(web3.eth.getBalance);
    payload.currentAccountEthBalance = Util.fromWei(await getBalance(payload.ethAccountAddress));

    dispatch({
      type: ActionTypes.WEB3_CONNECT,
      sequence: AsyncActionSequence.Success,
      operation: {
        message: 'Connected to web3!'
      },
      payload
    } as ConnectAction);
  };
}

export function setCurrentAccount(accountAddress: string, dao: IDAOState) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const web3 = await Arc.Utils.getWeb3();

    const payload = {
      currentAccountGenBalance: 0,
      currentAccountGenStakingAllowance: 0,
      ethAccountAddress: accountAddress,
      currentAccountEthBalance: 0,
      currentAccountExternalTokenBalance: 0
    }

    const getBalance = promisify(web3.eth.getBalance);
    const balance = await getBalance(accountAddress);
    payload.currentAccountEthBalance = Util.fromWei(balance);

    let votingMachineInstance: Arc.GenesisProtocolWrapper;
    const daoAvatarAddress = dao.address
    if (daoAvatarAddress !== null) {
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const schemeParameters = await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)
      const votingMachineAddress = schemeParameters.votingMachineAddress;
      votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      // Check for external token rewards in DAO and if exists update account's balance for that token
      if (dao && dao.externalTokenAddress) {
        const externalToken = await (await Arc.Utils.requireContract("StandardToken")).at(dao.externalTokenAddress) as any;
        payload.currentAccountExternalTokenBalance = Util.fromWei(await externalToken.balanceOf(accountAddress));
      }
    } else {
      votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
    }
    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;
    payload.currentAccountGenBalance = Util.fromWei(await stakingToken.balanceOf(accountAddress));
    payload.currentAccountGenStakingAllowance = Util.fromWei(await stakingToken.allowance(accountAddress, votingMachineInstance.address));

    dispatch(getProfile(accountAddress));

    const action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);
  };
}

export function onEthBalanceChanged(balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const ethBalance = getState().web3.currentAccountEthBalance;
    if (ethBalance !== balance) {
      dispatch({
        type: ActionTypes.WEB3_ON_ETH_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onGenBalanceChanged(balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const genBalance = getState().web3.currentAccountGenBalance;
    if (genBalance !== balance) {
      dispatch({
        type: ActionTypes.WEB3_ON_GEN_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onExternalTokenBalanceChanged(balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const currentBalance = getState().web3.currentAccountExternalTokenBalance;
    if (currentBalance !== balance) {
      dispatch({
        type: ActionTypes.WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onGenStakingAllowanceChanged(balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
  const genAllowance = getState().web3.currentAccountGenStakingAllowance;
  if (genAllowance !== balance) {
      dispatch({
        type: ActionTypes.WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export type ApproveAction = IAsyncAction<ActionTypes.APPROVE_STAKING_GENS, {
  accountAddress: string
}, {
  numTokensApproved: number
}>

// Approve transfer of 100000 GENs from accountAddress to the GenesisProtocol contract for use in staking
export function approveStakingGens(daoAvatarAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const meta = { accountAddress: currentAccountAddress };

    dispatch({
      type: ActionTypes.APPROVE_STAKING_GENS,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Approving tokens for staking...`,
        totalSteps: 1
      },
      meta
    } as ApproveAction);

    try {
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
      const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
      const stakingToken = await Arc.StandardTokenFactory.at(stakingTokenAddress);
      await stakingToken.approve({spender: votingMachineAddress, amount: Util.toWei(100000)})
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.APPROVE_STAKING_GENS,
        sequence: AsyncActionSequence.Failure,
        meta,
        operation: {
          message: `Approving tokens for staking failed`
        }
      } as ApproveAction)
    }
  }
}

// GEN transfer approval confirmed
export function onApprovedStakingGens(numTokensApproved: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const meta = { accountAddress: currentAccountAddress };
    const payload = { numTokensApproved }

    dispatch({
      type: ActionTypes.APPROVE_STAKING_GENS,
      sequence: AsyncActionSequence.Success,
      operation: {
        message: `Approving tokens for staking succeeded!`,
      },
      meta,
      payload
    } as ApproveAction);
  }
}
