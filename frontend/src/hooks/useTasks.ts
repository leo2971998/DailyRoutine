// useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { env } from '@/lib/env'
import type { ListResponse, Task } from '@/types'

type TaskFilters = {
    is_completed?: boolean
}

export function useTasks(userId: string = env.DEMO_USER_ID, filters: TaskFilters = {}) {
    const completion = filters.is_completed
    const statusKey = completion === undefined ? 'all' : completion ? 'complete' : 'incomplete'

    return useQuery<Task[]>({
        queryKey: ['tasks', userId, statusKey],
        queryFn: async () => {
            if (!userId) {
                return []
            }

            const params: Record<string, unknown> = { user_id: userId }
            if (typeof completion === 'boolean') {
                params.is_completed = completion
            }

            const { data } = await api.get<ListResponse<Task>>('/tasks', { params })
            return data.items
        },
        enabled: !!userId,
    })
}

type CreateTaskVariables = {
    description: string
    due_date: string | null
    priority: Task['priority']
    user_id?: string
}

export function useCreateTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ user_id, ...payload }: CreateTaskVariables) => {
            const body = {
                user_id: user_id ?? env.DEMO_USER_ID,
                ...payload,
            }
            const { data } = await api.post<Task>('/tasks', body)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}

export function useToggleTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { taskId: string; is_completed: boolean }) => {
            const { taskId, is_completed } = payload
            const { data } = await api.patch<Task>(`/tasks/${taskId}`, { is_completed })
            return data
        },
        onMutate: async ({ taskId, is_completed }) => {
            await qc.cancelQueries({ queryKey: ['tasks'] });
            const snapshots = qc.getQueriesData<Task[]>(['tasks']);
            let movedTask: Task | undefined;

            snapshots.forEach(([key, data]) => {
                if (!Array.isArray(data)) return;
                const statusKey = Array.isArray(key) ? key[2] : undefined;
                if (statusKey === 'incomplete') {
                    const updated = data.filter((task) => {
                        if (task._id === taskId) {
                            movedTask = { ...task, is_completed };
                            return !is_completed;
                        }
                        return true;
                    });
                    qc.setQueryData(key, updated);
                } else if (statusKey === 'complete') {
                    const updated = [...data];
                    const idx = updated.findIndex((t) => t._id === taskId);
                    if (idx >= 0) {
                        if (!is_completed) updated.splice(idx, 1);
                        else updated[idx] = { ...updated[idx], is_completed };
                    } else if (movedTask && is_completed) {
                        updated.unshift(movedTask);
                    }
                    qc.setQueryData(key, updated);
                } else {
                    // 'all'
                    const updated = data.map((t) => (t._id === taskId ? { ...t, is_completed } : t));
                    qc.setQueryData(key, updated);
                }
            });

            return { taskId, is_completed };
        },
        onError: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}

type UpdateTaskVariables = {
    taskId: string
    updates: Partial<Pick<Task, 'description' | 'priority' | 'due_date'>>
}

export function useUpdateTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ taskId, updates }: UpdateTaskVariables) => {
            const { data } = await api.patch<Task>(`/tasks/${taskId}`, updates)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}

export function useDeleteTask() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (taskId: string) => {
            await api.delete(`/tasks/${taskId}`)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
        },
    })
}
