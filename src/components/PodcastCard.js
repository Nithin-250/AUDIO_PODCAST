import React from 'react';

function PodcastCard({ title, description, imageUrl }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex space-x-4 hover:shadow-lg transition">
      <img
        className="w-24 h-24 rounded object-cover"
        src={imageUrl}
        alt={title}
      />
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default PodcastCard;
