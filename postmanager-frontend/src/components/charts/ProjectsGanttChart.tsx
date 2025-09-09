'use client';
import { useRouter } from 'next/navigation';
import ProjectGanttChart from './projectGantt/ProjectGanttChart';

export default function ProjectsGanttChart() {
    const router = useRouter();
    
    const handleProjectClick = (project: any) => {
        router.push(`/projects/${project.id}`);
    };

    return (
        <ProjectGanttChart 
            onProjectClick={handleProjectClick}
            className="w-full"
        />
    );
}
