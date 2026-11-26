export type Role = 'admin' | 'student';
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: string;
  avatar?: string;
}
export interface Category { id: string; name: string; color: string; description?: string }
export interface Subject extends Category { userId: string; categoryId: string; createdAt: string }
export interface Task {
  id: string;
  title: string;
  subjectId: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}
export const statuses = { todo: 'À faire', 'in-progress': 'En cours', done: 'Terminée' } satisfies Record<TaskStatus, string>;
export const priorities = { low: 'Basse', medium: 'Moyenne', high: 'Haute' } satisfies Record<Priority, string>;
export function localDate(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
