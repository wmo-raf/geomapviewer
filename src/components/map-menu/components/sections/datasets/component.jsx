import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import isEmpty from "lodash/isEmpty";
import cx from "classnames";

import NoContent from "@/components/ui/no-content";
import Icon from "@/components/ui/icon";
import LayerToggle from "@/components/map/components/legend/components/layer-toggle";

import Basemaps from "@/components/basemaps";

import DatasetSection from "./dataset-section";
import CategoriesMenu from "./categories-menu";
import LoginForm from "@/components/forms/login";

import { deburrUpper } from "@/utils/strings";

import searchIcon from "@/assets/icons/search.svg?sprite";
import closeIcon from "@/assets/icons/close.svg?sprite";

import "./styles.scss";

class Datasets extends PureComponent {
  state = { filter: "" };

  componentDidUpdate(prevProps) {
    if (prevProps.datasetCategory !== this.props.datasetCategory) {
      this.setState({ filter: "" });
    }
  }

  matchesFilter = (d) => {
    const { filter } = this.state;
    if (!filter || !filter.trim()) return true;
    const term = deburrUpper(filter.trim());
    return (
      (d.name && deburrUpper(d.name).includes(term)) ||
      (d.summary && deburrUpper(d.summary).includes(term)) ||
      (d.description && deburrUpper(d.description).includes(term))
    );
  };

  handleFilterChange = (e) => {
    this.setState({ filter: e.target.value });
  };

  clearFilter = () => {
    this.setState({ filter: "" });
  };

  handleFilterKeyDown = (e) => {
    if (e.key === "Escape" && this.state.filter) {
      e.stopPropagation();
      this.clearFilter();
    }
  };

  renderFilter() {
    const { filter } = this.state;
    return (
      <div className="layers-filter">
        <Icon icon={searchIcon} className="layers-filter__search-icon" />
        <input
          type="text"
          className="layers-filter__input"
          placeholder="Filter layers"
          value={filter}
          onChange={this.handleFilterChange}
          onKeyDown={this.handleFilterKeyDown}
        />
        {filter && (
          <button
            type="button"
            className="layers-filter__clear"
            onClick={this.clearFilter}
            aria-label="Clear filter"
          >
            <Icon icon={closeIcon} className="layers-filter__clear-icon" />
          </button>
        )}
      </div>
    );
  }

  renderLoginWindow() {
    return (
      <div className="login-header">
        <h3 className="title-login">Please log in</h3>
        <p>Log in is required so you can view datasets in this section</p>
        <LoginForm className="my-account-login" simple narrow />
      </div>
    );
  }
  render() {
    const {
      isDesktop,
      datasetCategory,
      datasetCategories,
      menuSection,
      datasets,
      subCategories,
      onToggleLayer,
      setModalMetaSettings,
      setMenuSettings,
      onToggleSubCategoryCollapse,
      onToggleGroupOption,
      id: sectionId,
      subCategoryGroupsSelected,
      loggedIn,
    } = this.props;

    const activeDatasetCategory =
      datasetCategory &&
      datasetCategories.find((c) => c.category === datasetCategory);

    const { loginRequired } = activeDatasetCategory || {};

    return (
      <div className="c-datasets">
        {!isDesktop &&
          menuSection &&
          !datasetCategory &&
          datasetCategories &&
          datasetCategories.length && (
            <div>
              <Basemaps />
              <CategoriesMenu
                categories={datasetCategories}
                onSelectCategory={setMenuSettings}
              />
            </div>
          )}

        {loginRequired && !loggedIn ? (
          this.renderLoginWindow()
        ) : (
          <>
            {menuSection && datasetCategory && (
              <Fragment>
                {this.renderFilter()}
                {(() => {
                  const isFiltering =
                    this.state.filter && this.state.filter.trim().length > 0;
                  let renderedCount = 0;

                  if (subCategories) {
                    const subCategoryNodes = subCategories
                      .map((subCat) => {
                        const groupKey = `${sectionId}-${subCat.id}`;
                        let selectedGroup = subCategoryGroupsSelected[groupKey];
                        if (
                          !selectedGroup &&
                          subCat.group_options &&
                          !!subCat.group_options.length
                        ) {
                          const defaultGroup =
                            subCat.group_options.find((o) => o.default) ||
                            subCat.group_options[0];
                          selectedGroup = defaultGroup.value;
                        }

                        const groupedDatasets = (subCat.datasets || []).filter(
                          (d) => {
                            if (
                              d.group &&
                              subCat.group_options &&
                              !!subCat.group_options.length
                            ) {
                              return d.group === selectedGroup;
                            }
                            return true;
                          }
                        );

                        const visibleDatasets = groupedDatasets.filter(
                          this.matchesFilter
                        );

                        // when filtering, hide subcategories with no matches
                        if (isFiltering && visibleDatasets.length === 0) {
                          return null;
                        }

                        renderedCount += visibleDatasets.length;

                        return (
                          <DatasetSection
                            key={subCat.slug}
                            sectionId={sectionId}
                            {...subCat}
                            onToggleCollapse={onToggleSubCategoryCollapse}
                          >
                            {subCat.group_options && !isFiltering && (
                              <div className="group-options-wrapper">
                                {subCat.group_options_title && (
                                  <div className="group-options-title">
                                    {subCat.group_options_title}
                                  </div>
                                )}
                                <div className="group-options">
                                  {subCat.group_options.map((groupOption) => (
                                    <div
                                      key={groupOption.value}
                                      className={cx("group-option", {
                                        active:
                                          groupOption.value === selectedGroup,
                                      })}
                                      onClick={() => {
                                        onToggleGroupOption(
                                          groupKey,
                                          groupOption.value
                                        );
                                      }}
                                    >
                                      {groupOption.label}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!isEmpty(visibleDatasets) ? (
                              visibleDatasets.map((d) => (
                                <LayerToggle
                                  key={d.id}
                                  className="dataset-toggle"
                                  data={{ ...d, dataset: d.id }}
                                  onToggle={onToggleLayer}
                                  onInfoClick={setModalMetaSettings}
                                  showSubtitle
                                  category={datasetCategory}
                                />
                              ))
                            ) : (
                              <NoContent
                                className="no-datasets"
                                message="No datasets available"
                              />
                            )}
                          </DatasetSection>
                        );
                      })
                      .filter(Boolean);

                    if (isFiltering && renderedCount === 0) {
                      return (
                        <NoContent
                          className="no-datasets"
                          message="No layers match your filter"
                        />
                      );
                    }

                    return subCategoryNodes;
                  }

                  const visibleDatasets = (datasets || []).filter(
                    this.matchesFilter
                  );

                  if (isFiltering && visibleDatasets.length === 0) {
                    return (
                      <NoContent
                        className="no-datasets"
                        message="No layers match your filter"
                      />
                    );
                  }

                  return visibleDatasets.map((d, i) => (
                    <LayerToggle
                      key={d.id}
                      tabIndex={i}
                      className="dataset-toggle"
                      data={{ ...d, dataset: d.id }}
                      onToggle={onToggleLayer}
                      onInfoClick={setModalMetaSettings}
                      category={datasetCategory}
                    />
                  ));
                })()}
              </Fragment>
            )}
          </>
        )}
      </div>
    );
  }
}

Datasets.propTypes = {
  name: PropTypes.string,
  datasets: PropTypes.array,
  onToggleLayer: PropTypes.func,
  setModalMetaSettings: PropTypes.func,
  subCategories: PropTypes.array,
  selectedCountries: PropTypes.array,
  countries: PropTypes.array,
  setMenuSettings: PropTypes.func,
  countriesWithoutData: PropTypes.array,
  setMapSettings: PropTypes.func,
  activeDatasets: PropTypes.array,
  categories: PropTypes.array,
  category: PropTypes.string,
  section: PropTypes.string,
  isDesktop: PropTypes.bool,
  handleRemoveCountry: PropTypes.func,
  handleAddCountry: PropTypes.func,
  datasetCategory: PropTypes.string,
  datasetCategories: PropTypes.array,
  menuSection: PropTypes.string,
};

export default Datasets;
