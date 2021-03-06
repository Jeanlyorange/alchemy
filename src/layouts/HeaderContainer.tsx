import { IDAOState } from '@daostack/client'
import Util from "lib/util";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { IAccountState, newAccount } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from 'reducers/notifications'
import { IProfileState } from "reducers/profilesReducer";

import * as uiActions from "actions/uiActions";
import * as web3Actions from "actions/web3Actions";
import { arc } from "arc";
import AccountBalances from "components/Account/AccountBalances";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import * as css from "./App.scss";

interface IStateProps {
  accounts: string[];
  currentAccountProfile: IProfileState;
  currentAccount: IAccountState;
  dao: IDAOState;
  ethAccountAddress: string | null;
  networkId: number;
  pageURL: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = ownProps.dao
  return {
    dao,
    ethAccountAddress: state.web3.ethAccountAddress,
    pageURL: ownProps.location.pathname
  };
};

interface IDispatchProps {
  setCurrentAccount: typeof web3Actions.setCurrentAccount;
  showNotification: typeof showNotification;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  setCurrentAccount: web3Actions.setCurrentAccount,
  onApprovedStakingGens: web3Actions.onApprovedStakingGens,
  onEthBalanceChanged: web3Actions.onEthBalanceChanged,
  onExternalTokenBalanceChanged: web3Actions.onExternalTokenBalanceChanged,
  onGenBalanceChanged: web3Actions.onGenBalanceChanged,
  onGenStakingAllowanceChanged: web3Actions.onGenStakingAllowanceChanged,
  showNotification,
  showTour: uiActions.showTour
};

type IProps = IStateProps & IDispatchProps;

class HeaderContainer extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    this.copyAddress = this.copyAddress.bind(this);
  }

  public async componentDidMount() {
    const {
      dao,
      ethAccountAddress,
      setCurrentAccount
    } = this.props;

    if (dao) {
      await setCurrentAccount(ethAccountAddress, dao);
    }
  }

  public copyAddress(e: any) {
    const { showNotification, ethAccountAddress } = this.props;
    Util.copyToClipboard(ethAccountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
    e.preventDefault();
  }

  public handleChangeAccount = (e: any) => {
    const selectElement = ReactDOM.findDOMNode(this.refs.accountSelectNode) as HTMLSelectElement;
    const newAddress = selectElement.value;
    if (this.props.dao) {
      this.props.setCurrentAccount(newAddress, this.props.dao);
    }
  }

  public handleClickTour = (e: any) => {
    const { showTour } = this.props;
    showTour();
  }

  public render() {
    let {
      currentAccount,
      currentAccountProfile,
      dao,
      ethAccountAddress,
      networkId,
      pageURL,
    } = this.props;

    const daoAvatarAddress = dao.address
    if (!currentAccount) {
      currentAccount = newAccount(daoAvatarAddress, ethAccountAddress);
    }

    const isProfilePage = pageURL.includes("profile");

    return(
      <div>
        <div className={css.notice}>
          <div>
            <img src="/assets/images/Icon/Alert.svg"/>
            Alchemy and Arc are in Alpha. There will be BUGS! All reputation accumulated will be reset. We don't guarantee complete security. <b>**Play at your own risk**</b>
          </div>
          <a className={css.reportBugs} href="mailto:bugs@daostack.io">REPORT BUGS</a>
        </div>
        <nav className={css.header}>
          <div className={css.menu}>
            <img src="/assets/images/Icon/Menu.svg"/>
            <div className={css.menuWrapper}>
              <div className={css.backgroundBlock}></div>
              <ul>
                <li><Link to='/'>Home</Link></li>
                { (process.env.NODE_ENV === 'production')
                  ? <li><a href='https://alchemy.daostack.io/dao/0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1'>Genesis Alpha</a></li>
                  : <li><Link to='/daos'>View DAOs</Link></li>
                }
                <li><a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target='_blank'>FAQ</a></li>
                <li><a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target='_blank'>Alchemy 101</a></li>
                <li><a href="https://www.daostack.io/" target='_blank'>About DAOstack</a></li>
                <li><a href="https://t.me/joinchat/BMgbsAxOJrZhu79TKB7Y8g" target='_blank'>Get involved</a></li>
                <li>
                  <a>Buy GEN</a>
                  <ul>
                    <li><h2>EXCHANGES</h2></li>
                    <li><a href="https://slow.trade" target="_blank"><img src="https://slow.trade/favicon-32x32.png"/> Slow Trade</a></li>
                    <li><a href="https://idex.market/eth/gen" target="_blank"><img src="/assets/images/Exchanges/idex.png"/> IDEX</a></li>
                    <li><a href="https://ddex.io/trade/GEN-ETH" target="_blank"><img src="/assets/images/Exchanges/ddex.png"/> DDEX</a></li>
                    <li><a href="https://forkdelta.github.io/#!/trade/0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/forkdelta.png"/> Forkdelta</a></li>
                    <li><a href="https://etherdelta.com/#0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/etherdelta.png"/> Etherdelta</a></li>
                    <li><a href="https://www.hotbit.io/exchange?symbol=GEN_ETH" target="_blank"><img src="/assets/images/Exchanges/hotbit.png"/> Hotbit</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className={css.logoContainer}>
            <Link className={css.alchemyLogo} to="/"><img src="/assets/images/alchemy-logo-white.svg"/></Link>
            <span className={css.version}><em>Alchemy {Util.networkName(networkId)}</em> <span> v.{VERSION}</span></span>
          </div>
          <div className={css.headerRight}>
            <Link className={css.profileLink} to={"/profile/" + ethAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>{currentAccountProfile && currentAccountProfile.name ? "EDIT PROFILE" : "CREATE PROFILE"}</Link>
            <div className={css.accountInfo}>
              <div className={css.accountImage}>
                <AccountImage accountAddress={ethAccountAddress} />
              </div>
              <div className={css.holdings}>
                <div className={css.pointer}></div>
                <div className={css.walletDetails}>
                  <div className={css.profileName}><AccountProfileName accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} /></div>
                  <div className={css.holdingsLabel}>Your wallet</div>
                  <div className={css.copyAddress} style={{cursor: 'pointer'}} onClick={this.copyAddress}>
                    <span>{ethAccountAddress.slice(0, 40)}</span>
                    <img src="/assets/images/Icon/Copy-white.svg"/>
                    <div className={css.fade}></div>
                  </div>
                </div>
                <AccountBalances dao={dao} address={ethAccountAddress} />
              </div>
            </div>
            { dao && !isProfilePage
              ? <button className={css.openTour} onClick={this.handleClickTour}><img src="/assets/images/Tour/TourButton.svg"/></button>
              : ""
            }
          </div>
        </nav>
      </div>
    );
  }
}

const ConnectedHeaderContainer = connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);

export default (props: { daoAddress: string, location: any}) => {
    if (props.daoAddress) {
      return <Subscribe observable={arc.dao(props.daoAddress).state}>{(state: IObservableState<IDAOState>) => {
          if (state.isLoading) {
            return null
          } else if (state.error) {
              return <div>{state.error}</div>
          } else {
            return <ConnectedHeaderContainer {...props} dao={state.data} />
          }
        }
      }</Subscribe>
  } else {
    return <ConnectedHeaderContainer dao={undefined} {...props }/>
  }
}
