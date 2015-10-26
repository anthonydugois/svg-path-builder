import React from "react"

function Foot(props) {
    return (
        <div className="ad-Foot">
            <div className="ad-Foot-help">
                <div className="ad-Help">
                    <strong>Click</strong> to select a point
                </div>

                <div className="ad-Help">
                    <strong>Ctrl + Click</strong> to add a point
                </div>
            </div>

            <div className="ad-Foot-credits">
                Made by <strong>Anthony Dugois</strong> (<a href="https://twitter.com/a_dugois">@a_dugois</a>)
            </div>
        </div>
    )
}

export default Foot