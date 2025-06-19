// src/components/Menu.jsx
import React, { useState } from 'react';

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="menu-container">
      <div className="hamburger" onClick={toggleMenu}>
        ☰
      </div>
      {isOpen && (
        <div className="menu">
          <ul>
            <li>About Us</li>
            <li>Global Reach</li>
            <li>Services</li>
            <li>Contact</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Menu;
