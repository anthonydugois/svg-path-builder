import React, { Component, PropTypes } from "react"
import { connect } from "react-redux"
import Button from "Button"
import Tabs from "Tabs"
import TabList from "Tabs/TabList"
import Tab from "Tabs/Tab"
import TabPanel from "Tabs/TabPanel"
import "./styles"

class Sidebar extends Component {
  render() {
    return (
      <div className="ad-Sidebar">
        <Tabs selected={ 0 }>
          <TabList>
            <Tab>
              <Button
                icon="paths"
                type="tab">
                Paths
              </Button>
            </Tab>
            <Tab>
              <Button
                icon="settings"
                type="tab">
                Settings
              </Button>
            </Tab>
          </TabList>

          <TabPanel><div>Hello!</div></TabPanel>
          <TabPanel><div>World!</div></TabPanel>
        </Tabs>
      </div>
    )
  }
}

Sidebar.propTypes = {}

export default connect((state) => state)(Sidebar)
