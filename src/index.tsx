import * as Arc from '@daostack/arc.js';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faFacebook, faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import axios from "axios";
import BigNumber from "bignumber.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import { App } from "./App";
import { getLocalContractAddresses } from './lib/util'

import "./assets/styles/global.scss";

async function initializeArcJs() {
  console.time('InitalizeArcJs')
  Arc.ConfigService.set("estimateGas", true);
  Arc.ConfigService.set("txDepthRequiredForConfirmation", { kovan: 0, live: 0});
  // the address in migration.json are created by npm run setup-env in the daostack/migration submodule
  // TODO: these are the local testing addresses, we should provide a way to get addresses for staging, prodution
  // const deployedContractAddresses = require(`../config/migration.json`)
  const deployedContractAddresses = getLocalContractAddresses()
  await Arc.InitializeArcJs({
    deployedContractAddresses,
    watchForAccountChanges: true,
    filter: {
      AbsoluteVote: true,
      ContributionReward: true,
      DaoCreator: true,
      GenesisProtocol: true,
      SchemeRegistrar: true
    }
  });

  const web3 = await Arc.Utils.getWeb3();
  Arc.ConfigService.set("gasPriceAdjustment", async (defaultGasPrice: BigNumber) => {
    try {
      const network = await Arc.Utils.getNetworkName();
      if (network.toLowerCase() === 'live') {
        const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
        // the api gives results if 10*Gwei
        const gasPrice = response.data.fast / 10;
        return web3.toWei(gasPrice, 'gwei');
      } else {
        return defaultGasPrice;
      }
    } catch (e) {
      return defaultGasPrice;
    }
  })

  Arc.AccountService.subscribeToAccountChanges(() => {
    window.location.reload()
  });

  // Arc.LoggingService.logLevel = Arc.LogLevel.all;

  if (Arc.ContractWrappers.AbsoluteVote === undefined) {
    const msg = `Arc.js could not find all DAOStack contracts -- are you sure they are deployed in the current network?\n(Arc.ContractWrappers.AbsoluteVote is undefined)`
    throw Error(msg)
  }
  Arc.ContractWrappers.AbsoluteVote.contract.constructor.synchronization_timeout = 0;
  Arc.ContractWrappers.ContributionReward.contract.constructor.synchronization_timeout = 0;
  Arc.ContractWrappers.DaoCreator.contract.constructor.synchronization_timeout = 0;
  Arc.ContractWrappers.GenesisProtocol.contract.constructor.synchronization_timeout = 0;
  //Arc.ContractWrappers.GlobalConstraintRegistrar.contract.constructor.synchronization_timeout = 0;
  Arc.ContractWrappers.SchemeRegistrar.contract.constructor.synchronization_timeout = 0;

  console.timeEnd('InitalizeArcJs')
}

async function renderApp() {
  initializeArcJs()
  // Add icons we want to use from FontAwesome
  library.add(faGithub, faTwitter, faFacebook)

  ReactDOM.render(
    <AppContainer>
      <App />
    </AppContainer>,
    document.querySelector("#root"),
  )
}

if (module.hot) {
  module.hot.accept()
  renderApp()
} else {
  renderApp()
}
