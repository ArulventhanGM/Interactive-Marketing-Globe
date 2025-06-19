export const COMPANY_LOCATIONS = [
  {
    id: 'nyc',
    name: 'New York City HQ',
    country: 'United States',
    coordinates: [-74.006, 40.7128],
    achievements: [
      {
        title: 'Global Innovation Center',
        description: 'Established in 2020, driving technological advancements',
        year: 2020,
        media: {
          type: 'image',
          url: '/assets/nyc-innovation.jpg'
        }
      }
    ]
  },
  {
    id: 'tokyo',
    name: 'Tokyo Innovation Hub',
    country: 'Japan',
    coordinates: [139.6917, 35.6895],
    achievements: [
      {
        title: 'AI Research Breakthrough',
        description: 'Leading AI research and development in Asia-Pacific',
        year: 2022,
        media: {
          type: 'video',
          url: '/assets/tokyo-ai-research.mp4'
        }
      }
    ]
  },
  // Add more locations as needed
];

export const getLocationById = (id) => 
  COMPANY_LOCATIONS.find(location => location.id === id);
