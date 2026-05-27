import React, {Component, createRef} from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Icon from '@/components/ui/icon'
import MapHeaderSearch from '@/layouts/map/components/map-header-search'
import MapHeaderUser from '@/layouts/map/components/map-header-user'

import menuIcon from '@/assets/icons/menu.svg?sprite'
import closeIcon from '@/assets/icons/close.svg?sprite'

import './styles.scss'

class MapHeader extends Component {
  static propTypes = {
    logo: PropTypes.shape({
      imageUrl: PropTypes.string,
      linkUrl: PropTypes.string,
      external: PropTypes.bool,
    }),
    navigation: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        external: PropTypes.bool,
      })
    ),
  }

  static defaultProps = {
    navigation: [],
  }

  state = {menuOpen: false}

  menuRef = createRef()

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  handleClickOutside = (e) => {
    if (
      this.state.menuOpen &&
      this.menuRef.current &&
      !this.menuRef.current.contains(e.target)
    ) {
      this.setState({menuOpen: false})
    }
  }

  toggleMobileMenu = () => {
    this.setState((s) => ({menuOpen: !s.menuOpen}))
  }

  closeMobileMenu = () => {
    this.setState({menuOpen: false})
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

  renderNavItems() {
    const {navigation} = this.props

    if (!navigation || !navigation.length) return null

    return navigation.map((item) => (
      <li key={`${item.label}-${item.url}`} className="map-header__nav-item">
        <a
          href={item.url}
          className="map-header__nav-link"
          onClick={this.closeMobileMenu}
          {...(item.external && {
            target: '_blank',
            rel: 'noopener noreferrer',
          })}
        >
          {item.label}
        </a>
      </li>
    ))
  }

  render() {
    const {navigation} = this.props
    const {menuOpen} = this.state
    const hasNav = navigation && navigation.length > 0

    return (
      <header className="c-map-header">
        <nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="map-header__brand">{this.renderLogo()}</div>
          {hasNav && (
            <div className="map-header__nav-wrapper" ref={this.menuRef}>
              <button
                type="button"
                className="map-header__burger"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={this.toggleMobileMenu}
              >
                <Icon
                  icon={menuOpen ? closeIcon : menuIcon}
                  className="map-header__burger-icon"
                />
              </button>
              <ul className={cx('map-header__nav', {open: menuOpen})}>
                {this.renderNavItems()}
              </ul>
            </div>
          )}
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
