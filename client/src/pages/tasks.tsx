import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Filter, FolderPlus, Folder, MoreVertical, CalendarClock, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TaskModal from "@/components/task-modal";
import ProjectModal from "@/components/project-modal"; // New Component
import { formatDuration } from "@/lib/timer-utils";
import { apiRequest } from "@/lib/queryClient";
import type { TaskWithStats, Project } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const [selectedTask, setSelectedTask] = useState<TaskWithStats | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Project Management State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("in_progress");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch Tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<TaskWithStats[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch Projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const isLoading = isLoadingTasks || isLoadingProjects;

  // Derived State: Active and Completed Tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(task => {
      // 1. Filter by Search
      const matchesSearch = searchTerm === "" ||
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Filter by Status (Completion)
      // "all" -> show everything
      // "in_progress" -> !isCompleted
      // "completed" -> isCompleted
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_progress" && !task.isCompleted) ||
        (statusFilter === "completed" && task.isCompleted);

      // 3. Filter by Color
      const matchesColor = colorFilter === "all" || task.color === colorFilter;

      // Show active tasks OR completed tasks.
      // Since completeTask sets isActive to false, we must explicitly allow isCompleted tasks.
      const isVisible = task.isActive || task.isCompleted;

      return matchesSearch && matchesStatus && matchesColor && isVisible;
    });
  }, [tasks, searchTerm, statusFilter, colorFilter]);

  // Unique Colors for Filter
  const availableColors = useMemo(() => {
    if (!tasks) return [];
    const colors = Array.from(new Set(tasks.map(task => task.color)));
    return colors.sort();
  }, [tasks]);



  // Group Active Tasks by Project
  const tasksByProject = useMemo(() => {
    if (!projects || !filteredTasks) return { grouped: [], tasksWithoutProject: [] };

    // Create a map of tasks by project ID
    const projectMap = new Map<number, TaskWithStats[]>();

    // Initialize map with all projects (to show empty projects too)
    projects.forEach(project => {
      // Filter out inactive projects if needed, but user might want to see them if they have tasks
      if (project.isActive) {
        projectMap.set(project.id, []);
      }
    });

    // Distribute tasks
    const tasksWithoutProject: TaskWithStats[] = [];
    filteredTasks.forEach(task => {
      if (task.projectId) {
        const projectTasks = projectMap.get(task.projectId);
        if (projectTasks) {
          projectTasks.push(task);
        } else {
          // Project might be inactive or not found (shouldn't happen with FK)
          // Add to orphan list or handle gracefully
          tasksWithoutProject.push(task);
        }
      } else {
        tasksWithoutProject.push(task);
      }
    });

    // Convert map to array and sort
    const grouped = projects
      .filter(p => p.isActive)
      .map(project => ({
        project,
        tasks: projectMap.get(project.id) || []
      }))
      .filter(group => {
        // Show project if it has tasks OR if there are no filters applied (so we can see empty projects to add tasks)
        // Or always show projects? Let's hide empty projects ONLY if text search/color filter is active to reduce noise
        if (searchTerm || colorFilter !== 'all') {
          return group.tasks.length > 0;
        }
        return true;
      });

    return { grouped, tasksWithoutProject };
  }, [projects, filteredTasks, searchTerm, colorFilter]);

  // Mutations
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Sucesso", description: "Atividade excluída com sucesso", variant: "success" });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir atividade", variant: "destructive" }),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tasks/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Sucesso", description: "Atividade concluída com sucesso", variant: "success" });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao concluir atividade", variant: "destructive" }),
  });

  const reopenTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/tasks/${id}/reopen`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Sucesso", description: "Atividade reaberta com sucesso", variant: "success" });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao reabrir atividade", variant: "destructive" }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Sucesso", description: "Projeto excluído com sucesso", variant: "success" });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir projeto (verifique se há tarefas vinculadas)", variant: "destructive" }),
  });

  // Handlers
  const handleNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskWithStats) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta atividade?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto? As tarefas associadas podem ser afetadas.")) {
      deleteProjectMutation.mutate(id);
    }
  };


  // Migration Mutation
  const migrationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/fix-projects");
      return res.json();
    },
    onSuccess: (data) => {
      const stats = data.stats;
      toast({
        title: "Migração Concluída",
        description: `Projetos criados: ${stats.projectsCreated}, Tarefas migradas: ${stats.tasksMigrated}`,
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => toast({ title: "Erro", description: "Falha na migração", variant: "destructive" }),
  });

  const handleMigration = () => {
    if (window.confirm("Isso irá criar projetos 'Pessoal' para usuários que não têm e mover tarefas órfãs. Deseja continuar?")) {
      migrationMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Atividades</h1>
          <p className="text-gray-500">Organize suas tarefas por projetos.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {/* <Button variant="outline" onClick={handleMigration} disabled={migrationMutation.isPending}>
                {migrationMutation.isPending ? "Migrando..." : "Reparar Projetos"}
              </Button> */}
              <Button variant="outline" onClick={handleNewProject}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
            </>
          )}
          <Button onClick={handleNewTask}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8 border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Cor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cores</SelectItem>
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                      <span className="capitalize">Cor</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Project Groups */}
      <div className="space-y-8">
        {tasksByProject.grouped.map(({ project, tasks }) => (
          <div key={project.id} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {tasks.length}
                </span>
                {project.isPersonal && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    Pessoal
                  </span>
                )}
              </div>

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditProject(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Projeto
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Projeto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Project Stats (Deadline & Estimates) */}
            {(project.deadline || (!project.isPersonal && project.estimatedHours)) && (
              <div className="flex flex-wrap items-center gap-6 pb-2 text-sm text-gray-500 pl-7">
                {project.deadline && (
                  <div className={`flex items-center gap-1.5 ${new Date(project.deadline) < new Date() ? 'text-red-600 font-medium' : ''}`}>
                    <CalendarClock className="h-4 w-4" />
                    <span>
                      Prazo: {format(new Date(project.deadline), "dd/MM/yyyy")}
                      {new Date(project.deadline) < new Date() && " (Atrasado)"}
                    </span>
                  </div>
                )}

                {!project.isPersonal && project.estimatedHours && (
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Horas: {Math.round((tasks.reduce((acc, t) => acc + (t.totalTime || 0), 0) / 3600) * 10) / 10}h / {project.estimatedHours}h</span>
                        <span className={
                          (tasks.reduce((acc, t) => acc + (t.totalTime || 0), 0) / 3600) > project.estimatedHours
                            ? "text-red-600"
                            : "text-gray-600"
                        }>
                          {Math.round(((tasks.reduce((acc, t) => acc + (t.totalTime || 0), 0) / 3600) / project.estimatedHours) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(((tasks.reduce((acc, t) => acc + (t.totalTime || 0), 0) / 3600) / project.estimatedHours) * 100, 100)}
                        className="h-2"
                        indicatorClassName={
                          (tasks.reduce((acc, t) => acc + (t.totalTime || 0), 0) / 3600) > project.estimatedHours
                            ? "bg-red-500"
                            : undefined
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onComplete={() => completeTaskMutation.mutate(task.id)}
                    onReopen={() => reopenTaskMutation.mutate(task.id)}
                    isCompleting={completeTaskMutation.isPending}
                    isDeleting={deleteTaskMutation.isPending}
                    isReopening={reopenTaskMutation.isPending}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Nenhuma atividade ativa neste projeto.</p>
                  <Button variant="link" size="sm" onClick={handleNewTask} className="mt-2 text-indigo-600">
                    + Adicionar atividade
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))
        }

        {/* Tasks without projects (Fallback) */}
        {
          tasksByProject.tasksWithoutProject.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-lg font-semibold text-gray-800">Sem Projeto</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                  {tasksByProject.tasksWithoutProject.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasksByProject.tasksWithoutProject.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onComplete={() => completeTaskMutation.mutate(task.id)}
                    onReopen={() => reopenTaskMutation.mutate(task.id)}
                    isCompleting={completeTaskMutation.isPending}
                    isDeleting={deleteTaskMutation.isPending}
                    isReopening={reopenTaskMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )
        }
      </div >



      {/* Modals */}
      < TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      < ProjectModal
        project={selectedProject}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div >
  );
}

// Sub-components for cleaner code
function TaskCard({ task, onEdit, onDelete, onComplete, onReopen, isCompleting, isDeleting, isReopening }: any) {
  const isCompleted = task.isCompleted;

  return (
    <Card className={`hover:shadow-md transition-shadow border-l-4 ${isCompleted ? 'bg-gray-50 opacity-90' : ''}`} style={{ borderLeftColor: task.color }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className={`font-semibold text-gray-900 line-clamp-1 ${isCompleted ? 'decoration-slice' : ''}`} title={task.name}>{task.name}</h4>
          <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
            {!isCompleted && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Edit className="h-3 w-3 text-gray-500" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-600" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{task.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="text-xs text-gray-500">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  Concluída
                </span>
                <span className="text-xs text-gray-400">
                  {task.completedAt && new Date(task.completedAt).toLocaleDateString()}
                </span>
              </div>
            ) : task.activeEntries > 0 ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Em andamento
              </span>
            ) : (
              <span>{formatDuration(task.totalTime)}</span>
            )}
          </div>

          {isCompleted ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
              onClick={onReopen}
              disabled={isReopening}
            >
              Reabrir
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-green-200 hover:bg-green-50 text-green-700"
              onClick={onComplete}
              disabled={isCompleting}
            >
              Concluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


