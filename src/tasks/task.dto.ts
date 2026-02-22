export class CreateTaskDto {
  userId: number;
  title: string;
  description?: string;
  status?: string;
  isAvailable?: boolean;
  isPrivate?: boolean;
  projectContent?: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  isAvailable?: boolean;
  isPrivate?: boolean;
  projectContent?: string;
}
