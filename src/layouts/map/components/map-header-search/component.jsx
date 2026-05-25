import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import debounce from "lodash/debounce";

import Icon from "@/components/ui/icon";
import { deburrUpper } from "@/utils/strings";
import { fetchGeocodeNominatim } from "@/services/geocoding";
import { cancelToken } from "@/utils/request";

import searchIcon from "@/assets/icons/search.svg?sprite";
import closeIcon from "@/assets/icons/close.svg?sprite";
import locationIcon from "@/assets/icons/location.svg?sprite";
import layersIcon from "@/assets/icons/layers.svg?sprite";

import "./styles.scss";

const MAX_LOCATIONS = 10;
const MAX_DATASETS = 10;

class MapHeaderSearch extends Component {
  state = {
    query: "",
    locations: [],
    loading: false,
    open: false,
  };

  containerRef = createRef();

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    this.debouncedSearch.cancel();
    if (this.searchFetch) {
      this.searchFetch.cancel("Component unmounted");
    }
  }

  handleClickOutside = (e) => {
    if (
      this.containerRef.current &&
      !this.containerRef.current.contains(e.target)
    ) {
      this.setState({ open: false });
    }
  };

  debouncedSearch = debounce((value) => {
    if (this.searchFetch) {
      this.searchFetch.cancel("Cancelling previous search");
    }
    this.searchFetch = cancelToken();
    fetchGeocodeNominatim(value, this.props.lang, this.searchFetch.token)
      .then((locations) => {
        this.setState({ locations: locations || [], loading: false });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }, 400);

  handleChange = (e) => {
    const value = e.target.value;
    const trimmed = value.trim();
    if (trimmed) {
      this.setState({ query: value, open: true, loading: true });
      this.debouncedSearch(trimmed);
    } else {
      this.debouncedSearch.cancel();
      if (this.searchFetch) {
        this.searchFetch.cancel("Search cleared");
      }
      this.setState({ query: value, locations: [], loading: false, open: true });
    }
  };

  handleClear = () => {
    this.debouncedSearch.cancel();
    if (this.searchFetch) {
      this.searchFetch.cancel("Search cleared");
    }
    this.setState({ query: "", locations: [], loading: false, open: false });
  };

  handleFocus = () => {
    if (this.state.query) {
      this.setState({ open: true });
    }
  };

  handleClickLocation = (loc) => {
    this.props.handleClickLocation(loc);
    this.setState({ open: false });
  };

  handleClickDataset = (dataset) => {
    this.props.onToggleDataset(dataset);
    this.setState({ open: false });
  };

  getFilteredDatasets() {
    const { datasets } = this.props;
    const { query } = this.state;
    const term = deburrUpper(query.trim());
    if (!term || !datasets) return [];
    return datasets
      .filter(
        (d) =>
          (d.name && deburrUpper(d.name).includes(term)) ||
          (d.localeName && deburrUpper(d.localeName).includes(term)) ||
          (d.description && deburrUpper(d.description).includes(term))
      )
      .slice(0, MAX_DATASETS);
  }

  renderDropdown() {
    const { query, locations, loading, open } = this.state;

    if (!open || !query.trim()) return null;

    const filteredDatasets = this.getFilteredDatasets();
    const hasLocations = locations && locations.length > 0;
    const hasDatasets = filteredDatasets.length > 0;
    const isEmpty = !loading && !hasLocations && !hasDatasets;

    return (
      <div className="map-header-search__dropdown">
        {hasLocations && (
          <div className="dropdown-section">
            <div className="dropdown-section__title">Go to&hellip;</div>
            <ul className="dropdown-list">
              {locations.slice(0, MAX_LOCATIONS).map((loc) => (
                <li key={`${loc.id}-${loc.place_name}`}>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => this.handleClickLocation(loc)}
                  >
                    <Icon
                      icon={locationIcon}
                      className="dropdown-item__icon"
                    />
                    <span className="dropdown-item__label">
                      {loc.place_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasDatasets && (
          <div className="dropdown-section">
            <div className="dropdown-section__title">Add map data</div>
            <ul className="dropdown-list">
              {filteredDatasets.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={cx("dropdown-item", { active: d.active })}
                    onClick={() => this.handleClickDataset(d)}
                  >
                    <Icon icon={layersIcon} className="dropdown-item__icon" />
                    <span className="dropdown-item__label">
                      {d.localeName || d.name}
                    </span>
                    {d.active && (
                      <span className="dropdown-item__hint">on map</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {loading && !hasLocations && !hasDatasets && (
          <div className="dropdown-empty">Searching&hellip;</div>
        )}
        {isEmpty && (
          <div className="dropdown-empty">No results for &ldquo;{query}&rdquo;</div>
        )}
      </div>
    );
  }

  render() {
    const { query, loading } = this.state;

    return (
      <div className="c-map-header-search" ref={this.containerRef}>
        <div
          className={cx("map-header-search__input-wrapper", { loading })}
        >
          <Icon icon={searchIcon} className="map-header-search__search-icon" />
          <input
            type="text"
            className="map-header-search__input"
            placeholder="Search locations and datasets"
            value={query}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
          />
          {query && (
            <button
              type="button"
              className="map-header-search__clear"
              onClick={this.handleClear}
              aria-label="Clear search"
            >
              <Icon icon={closeIcon} className="map-header-search__clear-icon" />
            </button>
          )}
        </div>
        {this.renderDropdown()}
      </div>
    );
  }
}

MapHeaderSearch.propTypes = {
  datasets: PropTypes.array,
  lang: PropTypes.string,
  handleClickLocation: PropTypes.func.isRequired,
  onToggleDataset: PropTypes.func.isRequired,
};

MapHeaderSearch.defaultProps = {
  datasets: [],
  lang: "en",
};

export default MapHeaderSearch;
