import React from 'react';
import BombForm from './BombForm';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-red-50 to-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
        <BombForm />
        <div className="mt-8 h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
      </div>
    </div>
  );
}

export default App;