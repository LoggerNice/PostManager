'use client';

import ProjectGanttChart from './projectGantt/ProjectGanttChart';

export default function ProjectsGanttChart() {
    const handleProjectClick = (project: any) => {
        // Можно добавить логику для обработки клика по проекту
        console.log('Clicked project:', project);
    };

    return (
        <ProjectGanttChart 
            onProjectClick={handleProjectClick}
            className="w-full"
        />
    );
}
