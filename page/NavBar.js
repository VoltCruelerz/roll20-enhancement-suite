import React from "react";

class NavBar extends React.Component {
    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-light">
                <ul className="navbar-nav">
                <li className="nav-item">
                        <a className="nav-link" href="/">Landing</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/features.html">Features</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/about.html">About</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="https://github.com/SSStormy/roll20-enhancement-suite">GitHub</a>
                    </li>
                </ul>
            </nav>
        )
    }
}

export default NavBar;
