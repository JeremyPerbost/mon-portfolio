import React, { useState } from "react";

function NavBar({ brand = "", links = [] }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleToggle = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const handleClose = () => setOpenDropdown(null);

  return (
    <nav className="navbar">
      <div className="nav-brand">{brand}</div>
      <div className="nav-links">
        {links.map((link) => {
          if (link.children && link.children.length) {
            return (
              <div
                key={link.label}
                className="nav-dropdown"
              >
                <button
                  className="nav-button"
                  onClick={() => handleToggle(link.label)}
                  aria-haspopup="true"
                  aria-expanded={openDropdown === link.label}
                >
                  {link.label}
                </button>
                {openDropdown === link.label && (
                  <div className="dropdown-menu">
                    {link.children.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        target={child.target || "_self"}
                        rel={child.rel || undefined}
                        onClick={handleClose}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default NavBar;
