import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'

import MapHeaderSearch from '@/layouts/map/components/map-header-search'
import MapHeaderUser from '@/layouts/map/components/map-header-user'

import './styles.scss'

class MapHeader extends PureComponent {
  static propTypes = {
    logo: PropTypes.shape({
      imageUrl: PropTypes.string,
      linkUrl: PropTypes.string,
      external: PropTypes.bool,
    }),
  }

  renderLogo() {
    const {logo} = this.props
    const {imageUrl, linkUrl, external} = logo || {}

    if (!imageUrl) return null

    const img = (
      <img src={imageUrl} alt="Logo" className="map-header__logo-image"/>
    )

    if (!linkUrl) {
      return <span className="map-header__logo">{img}</span>
    }

    return (
      <a
        href={linkUrl}
        className="map-header__logo"
        {...(external && {target: '_blank', rel: 'noopener noreferrer'})}
      >
        {img}
      </a>
    )
  }

  render() {
    return (
      <header className="c-map-header">
        <nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="map-header__brand">{this.renderLogo()}</div>
          <div className="map-header__search">
            <MapHeaderSearch/>
          </div>
          <div className="map-header__actions">
            <MapHeaderUser/>
          </div>
        </nav>
      </header>
    )
  }
}

export default MapHeader
