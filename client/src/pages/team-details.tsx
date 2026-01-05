import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Team, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TeamDetailsPage() {
    const [match, params] = useRoute("/teams/:id");
    const id = params?.id ? parseInt(params.id) : 0;
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const { data: team, isLoading: teamLoading } = useQuery<Team>({
        queryKey: [`/api/teams/${id}`],
        enabled: !!id,
    });

    const { data: members, isLoading: membersLoading } = useQuery<User[]>({
        queryKey: [`/api/teams/${id}/members`],
        enabled: !!id,
    });

    // Simple checking if current user is manager would require fetching managers or checking role logic better.
    // For now assuming any member can see, but buttons disabled if permission denied by backend (optimistic UI or handled by error).
    // Ideally fetch managers too.

    const removeMemberMutation = useMutation({
        mutationFn: (userId: number) => apiRequest("DELETE", `/api/teams/${id}/members/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/teams/${id}/members`] });
            toast({ title: "Membro removido", description: "O usuário foi removido do time." });
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message || "Falha ao remover membro", variant: "destructive" });
        }
    });

    if (teamLoading) return <div className="p-8 text-center">Carregando time...</div>;
    if (!team) return <div className="p-8 text-center">Time não encontrado</div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/teams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                    <p className="text-muted-foreground">{team.description}</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Membros ({members?.length || 0})</CardTitle>
                        <AddMemberDialog teamId={id} />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members?.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span>{member.fullName}</span>
                                            {/* Identify current user visually */}
                                            {member.id === currentUser?.id && <span className="text-xs text-muted-foreground">(Você)</span>}
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => {
                                                    if (confirm("Remover este membro?")) removeMemberMutation.mutate(member.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AddMemberDialog({ teamId }: { teamId: number }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { toast } = useToast();

    // Search users
    const { data: searchResults } = useQuery<User[]>({
        queryKey: ["/api/users/search", query],
        queryFn: () => apiRequest("GET", `/api/users/search?q=${query}`).then(res => res.json()),
        enabled: query.length >= 2,
    });

    const addMemberMutation = useMutation({
        mutationFn: (userId: number) => apiRequest("POST", `/api/teams/${teamId}/members`, { userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
            toast({ title: "Membro adicionado", description: "Usuário adicionado ao time." });
            setOpen(false);
            setQuery("");
        },
        onError: (e: any) => {
            toast({ title: "Erro", description: "Não foi possível adicionar (verifique permissões).", variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Membro
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Membro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                        {query.length < 2 && <div className="text-center text-sm text-gray-500 p-4">Digite para buscar...</div>}

                        {searchResults?.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                <div>
                                    <div className="font-medium">{user.fullName}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => addMemberMutation.mutate(user.id)}
                                    disabled={addMemberMutation.isPending}
                                >
                                    Adicionar
                                </Button>
                            </div>
                        ))}

                        {query.length >= 2 && searchResults?.length === 0 && (
                            <div className="text-center text-sm text-gray-500 p-4">Nenhum usuário encontrado.</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
