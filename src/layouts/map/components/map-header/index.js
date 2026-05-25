import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";

import Component from "./component";

const selectLogo = (state) => state.config?.logo;

const mapStateToProps = createStructuredSelector({
  logo: selectLogo,
});

export default connect(mapStateToProps)(Component);
