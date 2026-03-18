'use client';

import { useEffect } from 'react';

import RoadmapView from '../../components/roadmap/RoadmapView';

export default function RoadmapPage() {
  useEffect(() => {
    document.title = 'Roadmap';
  }, []);

  return (
    <RoadmapView />
  );
}

