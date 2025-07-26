import { IUser } from './user.types';

export interface IProject {
    id?: number;
    title: string;
    description?: string;
    client?: string;
    startDate?: string;
    endDate?: string;
    department?: {
        id: number;
        name: string;
    }[];
    users?: IUser[];
    createdAt?: string;
    updatedAt?: string;
}

export interface IProjectForm {
    title: string;
    description?: string;
    client?: string;
    startDate?: string;
    endDate?: string;
    departmentIds: number[];
    userIds?: number[];
} 

export interface TimelineTabProps {
    users: IUser[];
  }

export interface ProjectStage {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    color: string;
    icon: string;
    progress: number;
  }
  
export interface ProjectTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }