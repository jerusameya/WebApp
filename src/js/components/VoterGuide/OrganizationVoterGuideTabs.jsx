import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LoadingWheel from '../LoadingWheel';
import OrganizationActions from '../../actions/OrganizationActions';
import OrganizationStore from '../../stores/OrganizationStore';
import SettingsAccount from '../Settings/SettingsAccount';
import VoterGuideActions from '../../actions/VoterGuideActions';
import VoterGuideBallot from './VoterGuideBallot';
import VoterGuideFollowers from './VoterGuideFollowers';
import VoterGuideFollowing from './VoterGuideFollowing';
import VoterGuidePositions from './VoterGuidePositions';
import VoterGuideStore from '../../stores/VoterGuideStore';
import VoterStore from '../../stores/VoterStore';
import { arrayContains } from '../../utils/textFormat';

export default class OrganizationVoterGuideTabs extends Component {
  static propTypes = {
    activeRoute: PropTypes.string,
    organizationWeVoteId: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
  };

  // static getDerivedStateFromProps (props, state) {
  //   const { defaultTabItem } = state;
  //   // console.log('Friends getDerivedStateFromProps defaultTabItem:', defaultTabItem, ', this.props.params.tabItem:', props.params.tabItem);
  //   // We only redirect when in mobile mode (when "displayFriendsTabs()" is true), a tab param has not been passed in, and we have a defaultTab specified
  //   // This solves an edge case where you re-click the Friends Footer tab when you are in the friends section
  //   if (displayFriendsTabs() && props.params.tabItem === undefined && defaultTabItem) {
  //     historyPush(`/friends/${defaultTabItem}`);
  //   }
  //   return null;
  // }

  constructor (props) {
    super(props);
    this.state = {
      activeRoute: '',
      organization: {},
      organizationWeVoteId: '',
      voter: {},
      voterGuideFollowedList: [],
      voterGuideFollowersList: [],
      scrollDownValue: 0,
    };

    this.voterGuideBallotReference = {};
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount () {
    // console.log('OrganizationVoterGuideTabs, componentDidMount, organizationWeVoteId: ', this.props.organizationWeVoteId);
    this.organizationStoreListener = OrganizationStore.addListener(this.onOrganizationStoreChange.bind(this));
    this.voterGuideStoreListener = VoterGuideStore.addListener(this.onVoterGuideStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    OrganizationActions.organizationsFollowedRetrieve();
    VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(this.props.organizationWeVoteId);
    VoterGuideActions.voterGuideFollowersRetrieve(this.props.organizationWeVoteId);
    VoterGuideActions.voterGuidesRecommendedByOrganizationRetrieve(this.props.organizationWeVoteId, VoterStore.electionId());
    // Positions for this organization, for this voter / election
    OrganizationActions.positionListForOpinionMaker(this.props.organizationWeVoteId, true); // Needed for friends
    // Positions for this organization, NOT including for this voter / election
    OrganizationActions.positionListForOpinionMaker(this.props.organizationWeVoteId, false, true);
    // New call for all positions
    OrganizationActions.positionListForOpinionMaker(this.props.organizationWeVoteId, false, false);

    // console.log('OrganizationVoterGuideTabs, componentDidMount, this.props.activeRoute: ', this.props.activeRoute);
    this.setState({
      activeRoute: this.props.activeRoute || 'ballot',
      organizationWeVoteId: this.props.organizationWeVoteId,
      organization: OrganizationStore.getOrganizationByWeVoteId(this.props.organizationWeVoteId),
      pathname: this.props.location.pathname,
      voter: VoterStore.getVoter(),
    });

    window.addEventListener('scroll', this.handleScroll);
    document.body.scrollTop = this.state.scrollDownValue;
  }

  componentWillReceiveProps (nextProps) {
    // console.log('OrganizationVoterGuideTabs, componentWillReceiveProps');
    // When a new organization is passed in, update this component to show the new data
    // let different_election = this.state.current_google_civic_election_id !== VoterStore.electionId();
    const { organizationWeVoteId } = this.state;
    const differentOrganization = organizationWeVoteId !== nextProps.organizationWeVoteId;
    if (differentOrganization) {
      // console.log('OrganizationVoterGuideTabs, componentWillReceiveProps differentOrganization');
      OrganizationActions.organizationsFollowedRetrieve();
      VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(nextProps.organizationWeVoteId);
      VoterGuideActions.voterGuideFollowersRetrieve(nextProps.organizationWeVoteId);
      VoterGuideActions.voterGuidesRecommendedByOrganizationRetrieve(nextProps.organizationWeVoteId, VoterStore.electionId());
      // DALE 2017-12-24 Causes too much churn when here
      // Positions for this organization, for this voter / election
      // OrganizationActions.positionListForOpinionMaker(nextProps.organizationWeVoteId, true);
      // Positions for this organization, NOT including for this voter / election
      // OrganizationActions.positionListForOpinionMaker(nextProps.organizationWeVoteId, false, true);
      // New call for all positions
      OrganizationActions.positionListForOpinionMaker(this.props.organizationWeVoteId, false, false);
      this.setState({
        organizationWeVoteId: nextProps.organizationWeVoteId,
        organization: OrganizationStore.getOrganizationByWeVoteId(nextProps.organizationWeVoteId),
      });
    }
    // console.log('OrganizationVoterGuideTabs, componentWillReceiveProps, nextProps.activeRoute: ', nextProps.activeRoute);
    if (nextProps.activeRoute) {
      this.setState({
        activeRoute: nextProps.activeRoute,
      });
    }
    this.setState({
      pathname: nextProps.location.pathname,
    });
  }

  // 2019-09-29 Dale: I'm having trouble getting the first voter guide page to display Ballot items without this commented out
  // shouldComponentUpdate (nextProps, nextState) {
  //   if (this.state.activeRoute !== nextState.activeRoute) {
  //     // console.log('shouldComponentUpdate: this.state.activeRoute', this.state.activeRoute, ', nextState.activeRoute', nextState.activeRoute);
  //     return true;
  //   }
  //   if (this.state.organizationWeVoteId !== nextState.organizationWeVoteId) {
  //     // console.log('shouldComponentUpdate: this.state.organizationWeVoteId', this.state.organizationWeVoteId, ', nextState.organizationWeVoteId', nextState.organizationWeVoteId);
  //     return true;
  //   }
  //   if (this.state.location !== nextState.location) {
  //     // console.log('shouldComponentUpdate: this.state.location', this.state.location, ', nextState.location', nextState.location);
  //     return true;
  //   }
  //   if (this.state.pathname !== nextState.pathname) {
  //     // console.log('shouldComponentUpdate: this.state.pathname', this.state.pathname, ', nextState.pathname', nextState.pathname);
  //     return true;
  //   }
  //   // console.log('shouldComponentUpdate no changes');
  //   return false;
  // }

  componentWillUnmount () {
    this.organizationStoreListener.remove();
    this.voterGuideStoreListener.remove();
    this.voterStoreListener.remove();
    window.removeEventListener('scroll', this.handleScroll);
  }

  onVoterGuideStoreChange () {
    // console.log('OrganizationVoterGuideTabs, onVoterGuideStoreChange, organization: ', this.state.organization);
    const { organization_we_vote_id: organizationWeVoteId } = this.state.organization;
    this.setState({
      voterGuideFollowedList: VoterGuideStore.getVoterGuidesFollowedByOrganization(organizationWeVoteId),
      voterGuideFollowersList: VoterGuideStore.getVoterGuidesFollowingOrganization(organizationWeVoteId),
    });
  }

  onOrganizationStoreChange () {
    const { organizationWeVoteId } = this.state;
    // console.log('OrganizationVoterGuideTabs onOrganizationStoreChange, organizationWeVoteId: ', organizationWeVoteId);
    this.setState({
      organization: OrganizationStore.getOrganizationByWeVoteId(organizationWeVoteId),
    });
  }

  onVoterStoreChange () {
    this.setState({
      voter: VoterStore.getVoter(),
    });
  }

  handleScroll () {
    this.setState({ scrollDownValue: window.scrollY });
    // console.log('Scrolling', window.scrollY);
  }

  switchTab (destinationTab) {
    const availableTabsArray = ['ballot', 'following', 'followers', 'positions'];
    if (arrayContains(destinationTab, availableTabsArray)) {
      this.setState({
        activeRoute: destinationTab,
      });
      // This is an expensive action as it reloads quite a bit of data from the API server
      const currentUrl = this.state.pathname;
      const arrayLength = availableTabsArray.length;
      let modifiedUrl = this.state.pathname;
      let formerTabLength = 0;
      let formerTabLengthWithSlash = 0;
      for (let i = 0; i < arrayLength; i++) {
        // Remove any values in availableTabsArray from the end of the URL
        if (currentUrl.endsWith(availableTabsArray[i])) {
          formerTabLength = availableTabsArray[i].length;
          formerTabLengthWithSlash = formerTabLength + 1;
          modifiedUrl = currentUrl.slice(0, -formerTabLengthWithSlash);
          // break;
        }
      }
      modifiedUrl = `${modifiedUrl}/${destinationTab}`;
      // eslint-disable-next-line no-restricted-globals
      history.pushState({
        id: `tabs-${modifiedUrl}`,
      }, '', `${modifiedUrl}`);
    }
  }

  render () {
    document.body.scrollTop = this.state.scrollDownValue;
    const { activeRoute, organizationWeVoteId, pathname, voter } = this.state;
    if (!pathname || !activeRoute || !organizationWeVoteId || !voter) {
      return <div>{LoadingWheel}</div>;
    }

    let lookingAtSelf = false;
    if (this.state.voter) {
      lookingAtSelf = this.state.voter.linked_organization_we_vote_id === organizationWeVoteId;
    }
    let followingTitleLong = '';
    let followingTitleShort = '';
    let followersTitle = '';
    let voterGuideFollowersList = this.state.voterGuideFollowersList || [];
    if (this.state.voter.linked_organization_we_vote_id === organizationWeVoteId) {
      // If looking at your own voter guide, filter out your own entry as a follower
      voterGuideFollowersList = voterGuideFollowersList.filter(oneVoterGuide => (oneVoterGuide.organization_we_vote_id !== this.state.voter.linked_organization_we_vote_id ? oneVoterGuide : null));
    }
    if (lookingAtSelf) {
      followingTitleLong = this.state.voterGuideFollowedList.length === 0 ?
        'Following' : `Following ${this.state.voterGuideFollowedList.length}`;
      followingTitleShort = 'Following';
      followersTitle = voterGuideFollowersList.length === 0 ?
        'Followers' : `${voterGuideFollowersList.length} Followers`;
    } else {
      followingTitleLong = this.state.voterGuideFollowedList.length === 0 ?
        'Following' : `Following ${this.state.voterGuideFollowedList.length}`;
      followingTitleShort = 'Following';
      followersTitle = voterGuideFollowersList.length === 0 ?
        'Followers' : `${voterGuideFollowersList.length} Followers`;
    }

    let voterGuideComponentToDisplay = null;
    // console.log('activeRoute:', activeRoute);
    switch (activeRoute) {
      default:
      case 'ballot':
        voterGuideComponentToDisplay = (
          <VoterGuideBallot
            organizationWeVoteId={organizationWeVoteId}
            activeRoute={activeRoute}
            location={this.props.location}
            params={this.props.params}
            ref={(ref) => { this.voterGuideBallotReference = ref; }}
          />
        );
        break;
      case 'positions':
        voterGuideComponentToDisplay = (
          <>
            { lookingAtSelf && !this.state.voter.is_signed_in ?
              <SettingsAccount /> :
              null }
            <VoterGuidePositions
              activeRoute={activeRoute}
              location={this.props.location}
              organizationWeVoteId={organizationWeVoteId}
              params={this.props.params}
            />
          </>
        );
        break;
      case 'following':
        voterGuideComponentToDisplay = <VoterGuideFollowing organization={this.state.organization} />;
        break;
      case 'followers':
        voterGuideComponentToDisplay = <VoterGuideFollowers organization={this.state.organization} />;
        break;
    }

    return (
      <div className="">
        <div className="tabs__tabs-container-wrap">
          <div className="tabs__tabs-container d-print-none">
            <ul className="nav tabs__tabs">
              <li className="tab-item">
                <a // eslint-disable-line
                  onClick={() => this.switchTab('ballot')}
                  className={activeRoute === 'ballot' ? 'tab tab-active' : 'tab tab-default'}
                >
                  <span className="u-show-mobile">Your Ballot</span>
                  <span className="u-show-desktop-tablet">From Your Ballot</span>
                </a>
              </li>

              <li className="tab-item">
                <a // eslint-disable-line
                  onClick={() => this.switchTab('positions')}
                  className={activeRoute === 'positions' ? 'tab tab-active' : 'tab tab-default'}
                >
                  <span className="u-show-mobile">All</span>
                  <span className="u-show-desktop-tablet">All Endorsements</span>
                </a>
              </li>

              <li className="tab-item">
                <a // eslint-disable-line
                  onClick={() => this.switchTab('following')}
                  className={activeRoute === 'following' ? 'tab tab-active' : 'tab tab-default'}
                >
                  <span>
                    <span className="d-none d-sm-block">{followingTitleLong}</span>
                    <span className="d-block d-sm-none">{followingTitleShort}</span>
                  </span>
                </a>
              </li>

              <li className="tab-item">
                <a // eslint-disable-line
                  onClick={() => this.switchTab('followers')}
                  className={activeRoute === 'followers' ? 'tab tab-active' : 'tab tab-default'}
                >
                  <span>{followersTitle}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        {voterGuideComponentToDisplay}
      </div>
    );
  }
}
