import "./styles"

import React, { Component, PropTypes } from "react"
import mapActionsToKeys from "react-keybindings"
import Grid from "Grid"
import Shape from "Shape"
import * as KeyActionTypes from "../../src/constants/KeyActionTypes"
import * as ObjectTypes from "../../src/constants/ObjectTypes"
import ZOOM_SCALE from "../../src/constants/ZoomScale"

class Overview extends Component {
  constructor(props) {
    super(props)

    this.draggedPoint = null
    this.draggedObject = null
    this.mouseDownCoords = [0, 0]
  }

  state = {
    isDragging: false,
    coords: [0, 0],
    localPoints: this.props.pointsById,
    zoom: 1,
  };

  componentDidMount() {
    this.overview.focus()

    document.addEventListener("mousemove", this.handleMouseMove)
    document.addEventListener("mouseup", this.handleMouseUp)
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleMouseMove)
    document.removeEventListener("mouseup", this.handleMouseUp)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ localPoints: nextProps.pointsById })
  }

  snap = (n) => this.props.activePoints.length <= 1 ?
    this.props.gridStep * Math.round(n / this.props.gridStep) : n;

  getCoords = (e) => {
    const { zoom } = this.state
    const { left, top } = this.svg.getBoundingClientRect()

    const x = Math.round(e.clientX - left) / zoom
    const y = Math.round(e.clientY - top) / zoom

    return [+x.toFixed(0), +y.toFixed(0)]
  };

  getComputedCoords = (e) => this.getCoords(e).map(this.snap);

  handleMouseDown = (e, draggedPoint, draggedObject) => {
    this.draggedPoint = draggedPoint
    this.draggedObject = draggedObject
    this.mouseDownCoords = this.getCoords(e)

    this.setLocalPoints(this.mouseDownCoords)
  };

  handleMouseUp = (e) => {
    if (this.state.isDragging) {
      const { activePoints } = this.props
      const coords = this.getComputedCoords(e)
      const dx = coords[0] - this.mouseDownCoords[0]
      const dy = coords[1] - this.mouseDownCoords[1]

      switch (this.draggedObject) {
      case ObjectTypes.PATH:
      case ObjectTypes.POINT:
        if (dx !== 0 || dy !== 0) {
          this.props.onPointsPositionChange(activePoints, dx, dy, this.snap)
        }
        break

      case ObjectTypes.POINT_ANCHOR_1:
        this.props.onParametersChange(this.draggedPoint, {
          x1: coords[0],
          y1: coords[1],
        })
        break

      case ObjectTypes.POINT_ANCHOR_2:
        this.props.onParametersChange(this.draggedPoint, {
          x2: coords[0],
          y2: coords[1],
        })
        break
      }

      this.setState({ isDragging: false })
    }
  };

  handleMouseMove = (e) => {
    const coords = this.getComputedCoords(e)

    if (this.state.isDragging) {
      e.preventDefault()
      this.setLocalPoints(coords)
    } else {
      this.setState({ coords })
    }
  };

  setLocalPoints(coords) {
    this.setState({
      coords,
      localPoints: this.getLocalPoints(coords),
      isDragging: true,
    })
  }

  getLocalPoints(coords) {
    switch (this.draggedObject) {
    case ObjectTypes.PATH:
    case ObjectTypes.POINT:
      return this.movePoints(
        coords[0] - this.state.coords[0],
        coords[1] - this.state.coords[1]
      )

    case ObjectTypes.POINT_ANCHOR_1:
      return this.moveFirstAnchor(coords)

    case ObjectTypes.POINT_ANCHOR_2:
      return this.moveSecondAnchor(coords)

    default:
      return this.state.localPoints
    }
  }

  movePoints(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      return Object.keys(this.state.localPoints).reduce(
        (acc, key) => {
          const point = this.state.localPoints[key]

          return {
            ...acc,
            [point.id]: !this.props.activePoints.includes(point.id) ? point : {
              ...point,
              x: this.snap(point.x + dx),
              y: this.snap(point.y + dy),
              parameters: {
                ...point.parameters,
                ...typeof point.parameters.x1 !== "undefined"
                  && { x1: point.parameters.x1 + dx },
                ...typeof point.parameters.y1 !== "undefined"
                  && { y1: point.parameters.y1 + dy },
                ...typeof point.parameters.x2 !== "undefined"
                  && { x2: point.parameters.x2 + dx },
                ...typeof point.parameters.y2 !== "undefined"
                  && { y2: point.parameters.y2 + dy },
              },
            },
          }
        },
        {}
      )
    }

    return this.state.localPoints
  }

  moveFirstAnchor([x1, y1]) {
    const point = this.state.localPoints[this.draggedPoint]

    return {
      ...this.state.localPoints,
      [point.id]: {
        ...point,
        parameters: { ...point.parameters, x1, y1 },
      },
    }
  }

  moveSecondAnchor([x2, y2]) {
    const point = this.state.localPoints[this.draggedPoint]

    return {
      ...this.state.localPoints,
      [point.id]: {
        ...point,
        parameters: { ...point.parameters, x2, y2 },
      },
    }
  }

  handleOverviewMouseDown = (e) => {
    const {
      keyActions,
      activePaths,
      activePoints,
    } = this.props

    // if CTRL is pressed, add a point to the active path or create a path
    // else deactivate all objects in the overview
    if (keyActions.includes(KeyActionTypes.CTRL)) {
      e.preventDefault()

      const [x, y] = this.getComputedCoords(e)

      if (activePaths.length === 1) {
        this.props.onOverviewCreatePoint(activePaths[0], "L", x, y, {})
      } else {
        this.props.onOverviewCreatePath(x, y)
      }
    } else if (activePaths.length > 0 || activePoints.length > 0) {
      this.props.onDeactivate(activePaths, activePoints)
    }
  };

  // scroll horizontally if CTRL is pressed
  handleWheel = (e) => {
    if (this.props.keyActions.includes(KeyActionTypes.CTRL)) {
      e.preventDefault()
      this.overview.scrollLeft += e.deltaY
    }
  };

  handleKeyDown = (e) => {
    const {
      keyActions,
      settings,
      activePoints,
    } = this.props

    // zoom feature
    const currentZoom = ZOOM_SCALE.indexOf(this.state.zoom)

    if (keyActions.includes(KeyActionTypes.OVERVIEW_ZOOM_PLUS)) {
      e.preventDefault()

      if (currentZoom < ZOOM_SCALE.length - 1) {
        this.setState({ zoom: ZOOM_SCALE[currentZoom + 1] })
      }
    }

    if (keyActions.includes(KeyActionTypes.OVERVIEW_ZOOM_MINUS)) {
      e.preventDefault()

      if (currentZoom > 0) {
        this.setState({ zoom: ZOOM_SCALE[currentZoom - 1] })
      }
    }

    if (activePoints.length > 0) {
      // delete points
      if (keyActions.includes(KeyActionTypes.OVERVIEW_DEL)) {
        e.preventDefault()
        this.props.onOverviewDelete(activePoints)
      }

      // x increment
      if (keyActions.includes(KeyActionTypes.OVERVIEW_LEFT)) {
        e.preventDefault()
        const dx = -(settings.gridSnap ?
          settings.gridSize : settings.keyboardIncrement)
        this.props.onPointsPositionChange(activePoints, dx, 0)
      }

      if (keyActions.includes(KeyActionTypes.OVERVIEW_RIGHT)) {
        e.preventDefault()
        const dx = settings.gridSnap ?
          settings.gridSize : settings.keyboardIncrement
        this.props.onPointsPositionChange(activePoints, dx, 0)
      }

      // y increment
      if (keyActions.includes(KeyActionTypes.OVERVIEW_UP)) {
        e.preventDefault()
        const dy = -(settings.gridSnap ?
          settings.gridSize : settings.keyboardIncrement)
        this.props.onPointsPositionChange(activePoints, 0, dy)
      }

      if (keyActions.includes(KeyActionTypes.OVERVIEW_DOWN)) {
        e.preventDefault()
        const dy = settings.gridSnap ?
          settings.gridSize : settings.keyboardIncrement
        this.props.onPointsPositionChange(activePoints, 0, dy)
      }
    }
  };

  renderShape = (key) => {
    const {
      onActivate,
      onDeactivate,
      keyActions,
      settings,
      pathsById,
      pointsById,
      activePaths,
      activePoints,
    } = this.props

    const {
      isDragging,
      localPoints,
      zoom,
    } = this.state

    return (
      <Shape
        key={ key }
        onActivate={ onActivate }
        onDeactivate={ onDeactivate }
        keyActions={ keyActions }
        path={ pathsById[key] }
        settings={ settings }
        globalPoints={ pointsById }
        activePaths={ activePaths }
        activePoints={ activePoints }
        isDragging={ isDragging }
        localPoints={ localPoints }
        zoom={ zoom }
        onMouseDown={ this.handleMouseDown } />
    )
  };

  render() {
    const { project, settings } = this.props
    const { zoom } = this.state

    return (
      <div
        ref={ (overview) => this.overview = overview }
        className="ad-Overview"
        tabIndex={ 1 }
        onWheel={ this.handleWheel }
        onKeyDown={ this.handleKeyDown }>
        <div className="ad-Overview-rendering">
          <svg
            ref={ (svg) => this.svg = svg }
            className="ad-Overview-svg"
            width={ project.width * zoom }
            height={ project.height * zoom }
            viewBox={ `0 0 ${ project.width } ${ project.height }` }
            onMouseDown={ this.handleOverviewMouseDown }>
            { settings.gridShow && (
              <Grid
                zoom={ zoom }
                project={ project }
                settings={ settings } />
            ) }

            { project.paths.map(this.renderShape) }
          </svg>
        </div>
      </div>
    )
  }
}

Overview.propTypes = {
  onActivate: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onOverviewCreatePath: PropTypes.func.isRequired,
  onOverviewCreatePoint: PropTypes.func.isRequired,
  onOverviewDelete: PropTypes.func.isRequired,
  onPointsPositionChange: PropTypes.func.isRequired,
  onParametersChange: PropTypes.func.isRequired,
  keyActions: PropTypes.array.isRequired,
  project: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  pointsById: PropTypes.object.isRequired,
  pathsById: PropTypes.object.isRequired,
  gridStep: PropTypes.number.isRequired,
  activePaths: PropTypes.array.isRequired,
  activePoints: PropTypes.array.isRequired,
}

export default mapActionsToKeys({
  [KeyActionTypes.CTRL]: "ctrl",
  [KeyActionTypes.SHIFT]: "shift",
  [KeyActionTypes.OVERVIEW_DEL]: "delete",
  [KeyActionTypes.OVERVIEW_UP]: "up",
  [KeyActionTypes.OVERVIEW_DOWN]: "down",
  [KeyActionTypes.OVERVIEW_LEFT]: "left",
  [KeyActionTypes.OVERVIEW_RIGHT]: "right",
  [KeyActionTypes.OVERVIEW_ZOOM_PLUS]: ["ctrl", 107],
  [KeyActionTypes.OVERVIEW_ZOOM_MINUS]: ["ctrl", 109],
})(Overview)
