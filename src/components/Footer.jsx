// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="social-links">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
      <div className="company-info">
        <p>&copy; 2025 MNC Corporation. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
