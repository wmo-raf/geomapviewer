import { connect } from "react-redux";

import { setMapSettings } from "@/components/map/actions";
import {
  getCapAlertActive,
  getCapAlertGeometry,
} from "@/components/map/selectors";

import Component from "./component";

const mapStateToProps = (state) => ({
  capAlertActive: getCapAlertActive(state),
  capAlertGeometry: getCapAlertGeometry(state),
  capConfig: state.config && state.config.capConfig,
  loggedIn: state.auth && state.auth.data && state.auth.data.loggedIn,
});

export default connect(mapStateToProps, { setMapSettings })(Component);
