import { connect } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import isEmpty from "lodash/isEmpty";

import Component from "./component";

const selectAuthData = (state) => state.auth && state.auth.data;
const selectEnableMyAccount = (state) => state.config?.enableMyAccount;

const selectLoggedIn = createSelector(
  [selectAuthData],
  (data) => !isEmpty(data)
);

const mapStateToProps = createStructuredSelector({
  loggedIn: selectLoggedIn,
  userData: selectAuthData,
  enableMyAccount: selectEnableMyAccount,
});

export default connect(mapStateToProps)(Component);
