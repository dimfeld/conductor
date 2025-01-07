import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { projects, projectTechnologies, projectFrameworks, projectStates } from './schema';

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type ProjectTechnology = InferSelectModel<typeof projectTechnologies>;
export type NewProjectTechnology = InferInsertModel<typeof projectTechnologies>;

export type ProjectFramework = InferSelectModel<typeof projectFrameworks>;
export type NewProjectFramework = InferInsertModel<typeof projectFrameworks>;

export type ProjectState = InferSelectModel<typeof projectStates>;
export type NewProjectState = InferInsertModel<typeof projectStates>;
