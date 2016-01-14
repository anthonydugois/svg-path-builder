import React, { Component, PropTypes } from "react"
import { findDOMNode } from "react-dom"
import { connect } from "react-redux"
import Grid from "Grid"
import Shape from "Shape"
import "./styles"

import {
  addPoint,
  activatePoint,
} from "../../src/actions/points"

function getStyles(props) {
  const {
    width,
    height,
  } = props.builder

  return {
    width,
    height,
  }
}

const mapStateToProps = (state) => {
  const {
    builder,
    paths,
    points,
  } = state

  const activePath = Object.keys(paths).reduce(
    (acc, pathId) => {
      if (paths[pathId].isActive) {
        return paths[pathId]
      }

      return acc
    },
    {}
  )

  return {
    builder,
    paths,
    activePath,
    points,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onOverviewClick: (pathId, code, x, y, parameters) =>
      dispatch(addPoint(pathId, code, x, y, parameters)),
    onPointClick: (pathId, pointId) =>
      dispatch(activatePoint(pathId, pointId)),
  }
}

class Overview extends Component {
  handleOverviewClick = (e) => {
    const {
      builder,
      activePath,
    } = this.props

    const { left, top } = findDOMNode(this).getBoundingClientRect()

    let x = Math.round(e.clientX - left)
    let y = Math.round(e.clientY - top)

    // grid snaping
    if (builder.grid.snapToGrid) {
      x = builder.grid.size * Math.round(x / builder.grid.size)
      y = builder.grid.size * Math.round(y / builder.grid.size)
    }

    this.props.onOverviewClick(activePath.id, "L", x, y, {})
  };

  renderShape = (path) => {
    return (
      <Shape
        key={ path.id }
        path={ path }
        points={ path.points.map((id) => this.props.points[id]) }
        onPointClick={ (pointId) =>
          this.props.onPointClick(this.props.activePath.id, pointId) } />
    )
  };

  render() {
    const {
      builder,
      paths,
    } = this.props

    return (
      <svg
        className="ad-Overview"
        style={ getStyles(this.props) }
        onClick={ this.handleOverviewClick }>
        <Grid
          width={ builder.width }
          height={ builder.height }
          grid={ builder.grid } />

        { Object.keys(paths).map((id) => this.renderShape(paths[id])) }
      </svg>
    )
  }
}

Overview.propTypes = {
  onOverviewClick: PropTypes.func.isRequired,
  onPointClick: PropTypes.func.isRequired,
  builder: PropTypes.object.isRequired,
  paths: PropTypes.object.isRequired,
  points: PropTypes.object.isRequired,
  activePath: PropTypes.object.isRequired,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Overview)
