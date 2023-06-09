import { connect } from "react-redux";

import Component from "./component";

const mapStateToProps = ({ countryData }, { type, isos }) => ({
  ...(!!isos && {
    tooltipDesc:
      countryData.countries &&
      countryData.countries
        .filter((c) => isos.includes(c.value))
        .map((c) => c.label)
        .join(", "),
  }),
});

export default connect(mapStateToProps, null)(Component);
