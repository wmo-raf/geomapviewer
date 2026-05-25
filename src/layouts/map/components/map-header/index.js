import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";

import Component from "./component";

const selectLogo = (state) => state.config?.logo;
const selectNavigation = (state) => state.config?.navigation || [];

const mapStateToProps = createStructuredSelector({
  logo: selectLogo,
  navigation: selectNavigation,
});

export default connect(mapStateToProps)(Component);
