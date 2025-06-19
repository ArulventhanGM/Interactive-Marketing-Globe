// src/components/GlobeApp.jsx
import React, { useState } from 'react';
import Globe from './Globe';
import Menu from './Menu';
import Footer from './Footer';

const GlobeApp = () => {
  const [filters, setFilters] = useState({ category: 'all', year: 'all' });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">GlobalTech Solutions</div>
        <Menu />
      </header>

      {/* Achievement Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Filter by Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="award">Awards</option>
            <option value="innovation">Innovation</option>
            <option value="sustainability">Sustainability</option>
            <option value="operational">Operational</option>
            <option value="partnership">Partnership</option>
            <option value="social">Social Impact</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by Year:</label>
          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
        <div className="stats-summary">
          <span>Total Achievements: 18</span>
          <span>Locations: 6</span>
        </div>
      </div>

      <main className="main-content">
        <Globe filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default GlobeApp;
