import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, Layout, Settings, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import type { Team } from "@shared/schema";

export default function TeamsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: teams, isLoading } = useQuery<Team[]>({
        queryKey: ["/api/teams"],
    });

    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);

    const deleteTeamMutation = useMutation({
        mutationFn: async (teamId: number) => {
            await apiRequest("DELETE", `/api/teams/${teamId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
            toast({ title: "Time excluído", description: "O time foi removido com sucesso.", variant: "success" });
            setDeletingTeamId(null);
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao excluir o time.", variant: "destructive" });
        }
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Times</h1>
                    <p className="text-muted-foreground">Gerencie seus times e colaboradores.</p>
                </div>
                <CreateTeamDialog />
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse h-40 bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams?.map((team) => (
                        <div key={team.id} className="group relative">
                            <Link href={`/teams/${team.id}`}>
                                <a className="block transition-transform hover:scale-[1.02]">
                                    <Card className="h-full cursor-pointer hover:border-primary">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="line-clamp-2">
                                                {team.description || "Sem descrição"}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </a>
                            </Link>

                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTeam(team);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                {user?.role === 'admin' && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingTeamId(team.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {teams?.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            Você ainda não participa de nenhum time. Crie um novo time para começar!
                        </div>
                    )}
                </div>
            )}

            {editingTeam && (
                <EditTeamDialog
                    team={editingTeam}
                    open={!!editingTeam}
                    onOpenChange={(open) => !open && setEditingTeam(null)}
                />
            )}

            <AlertDialog open={!!deletingTeamId} onOpenChange={(open) => !open && setDeletingTeamId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Time?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este time? Essa ação não pode ser desfeita e removerá todos os membros e gerentes associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingTeamId && deleteTeamMutation.mutate(deletingTeamId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CreateTeamDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createTeamMutation = useMutation({
        mutationFn: async (data: { name: string; description: string }) => {
            // isActive is true by default or required? Schema says isActive default true.
            return apiRequest("POST", "/api/teams", { ...data, isActive: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
            toast({ title: "Sucesso", description: "Time criado com sucesso!", variant: "success" });
            setOpen(false);
            setName("");
            setDescription("");
        },
        onError: () => {
            toast({ title: "Erro", description: "Não foi possível criar o time.", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createTeamMutation.mutate({ name, description });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Time
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Novo Time</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Time</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Desenvolvimento"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            placeholder="Objetivos e propósito do time..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createTeamMutation.isPending}>
                            {createTeamMutation.isPending ? "Criando..." : "Criar Time"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditTeamDialog({ team, open, onOpenChange }: { team: Team, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [name, setName] = useState(team.name);
    const [description, setDescription] = useState(team.description || "");

    const updateTeamMutation = useMutation({
        mutationFn: async (data: { name: string; description: string }) => {
            return apiRequest("PUT", `/api/teams/${team.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
            toast({ title: "Sucesso", description: "Time atualizado com sucesso!", variant: "success" });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: "Erro", description: "Não foi possível atualizar o time.", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        updateTeamMutation.mutate({ name, description });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Time</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Time</Label>
                        <Input
                            id="edit-name"
                            placeholder="Ex: Desenvolvimento"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Objetivos e propósito do time..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateTeamMutation.isPending}>
                            {updateTeamMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
