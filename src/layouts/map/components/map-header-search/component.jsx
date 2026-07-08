import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import debounce from "lodash/debounce";

import Icon from "@/components/ui/icon";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";
import { deburrUpper } from "@/utils/strings";
import { parseCoordinate } from "@/utils/location";
import { fetchGeocodeNominatim } from "@/services/geocoding";
import { cancelToken } from "@/utils/request";

import searchIcon from "@/assets/icons/search.svg?sprite";
import closeIcon from "@/assets/icons/close.svg?sprite";
import locationIcon from "@/assets/icons/location.svg?sprite";

import "./styles.scss";

const MAX_LOCATIONS = 10;
const MAX_DATASETS = 10;

class MapHeaderSearch extends Component {
  state = {
    query: "",
    locations: [],
    coordinate: null,
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
    fetchGeocodeNominatim(
      value,
      this.props.lang,
      this.props.bounds,
      this.searchFetch.token
    )
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

    if (!trimmed) {
      this.debouncedSearch.cancel();
      if (this.searchFetch) {
        this.searchFetch.cancel("Search cleared");
      }
      this.setState({
        query: value,
        locations: [],
        coordinate: null,
        loading: false,
        open: true,
      });
      return;
    }

    const coordinate = parseCoordinate(trimmed);

    if (coordinate) {
      this.debouncedSearch.cancel();
      if (this.searchFetch) {
        this.searchFetch.cancel("Coordinate detected");
      }
      this.setState({
        query: value,
        coordinate,
        locations: [],
        loading: false,
        open: true,
      });
      return;
    }

    this.setState({
      query: value,
      coordinate: null,
      open: true,
      loading: true,
    });
    this.debouncedSearch(trimmed);
  };

  handleClear = () => {
    this.debouncedSearch.cancel();
    if (this.searchFetch) {
      this.searchFetch.cancel("Search cleared");
    }
    this.setState({
      query: "",
      locations: [],
      coordinate: null,
      loading: false,
      open: false,
    });
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

  handleClickCoordinate = () => {
    const { coordinate } = this.state;
    if (!coordinate) return;
    this.props.handleClickCoordinate(coordinate);
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
          (d.summary && deburrUpper(d.summary).includes(term))
      )
      .slice(0, MAX_DATASETS);
  }

  renderDropdown() {
    const { query, locations, loading, open, coordinate } = this.state;

    if (!open || !query.trim()) return null;

    if (coordinate) {
      const { lat, lng } = coordinate;
      return (
        <div className="map-header-search__dropdown">
          <div className="dropdown-section">
            <div className="dropdown-section__title">Go to coordinate</div>
            <ul className="dropdown-list">
              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={this.handleClickCoordinate}
                >
                  <Icon
                    icon={locationIcon}
                    className="dropdown-item__icon"
                  />
                  <span className="dropdown-item__label">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      );
    }

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
                <li key={d.id} className="dropdown-dataset">
                  <LayerToggle
                    className="dropdown-dataset__toggle"
                    data={{
                      ...d,
                      name: d.localeName || d.name,
                      dataset: d.id,
                    }}
                    onToggle={this.props.onToggleDataset}
                    onInfoClick={this.props.onInfoClick}
                    showSubtitle
                  />
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
            placeholder="Search locations, coordinates and datasets"
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
  bounds: PropTypes.array,
  handleClickLocation: PropTypes.func.isRequired,
  handleClickCoordinate: PropTypes.func.isRequired,
  onToggleDataset: PropTypes.func.isRequired,
  onInfoClick: PropTypes.func.isRequired,
};

MapHeaderSearch.defaultProps = {
  datasets: [],
  lang: "en",
};

export default MapHeaderSearch;
