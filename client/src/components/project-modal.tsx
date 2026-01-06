import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type Project, type InsertProject } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectModalProps {
    project?: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<InsertProject>({
        resolver: zodResolver(insertProjectSchema),
        defaultValues: {
            name: "",
            description: "",
            isActive: true,
            isPersonal: false,
        },
    });

    useEffect(() => {
        if (project) {
            form.reset({
                name: project.name,
                description: project.description || "",
                isActive: project.isActive,
                isPersonal: project.isPersonal || false,
            });
        } else {
            form.reset({
                name: "",
                description: "",
                isActive: true,
                isPersonal: false,
            });
        }
    }, [project, form, isOpen]);

    const createMutation = useMutation({
        mutationFn: async (data: InsertProject) => {
            const res = await apiRequest("POST", "/api/projects", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            toast({
                title: "Sucesso",
                description: "Projeto criado com sucesso",
                variant: "success",
            });
            onClose();
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Falha ao criar projeto",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: InsertProject) => {
            if (!project) return;
            const res = await apiRequest("PUT", `/api/projects/${project.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            toast({
                title: "Sucesso",
                description: "Projeto atualizado com sucesso",
                variant: "success",
            });
            onClose();
        },
        onError: () => {
            toast({
                title: "Erro",
                description: "Falha ao atualizar projeto",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertProject) => {
        if (project) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {project ? "Editar Projeto" : "Novo Projeto"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do projeto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descrição do projeto (opcional)"
                                            className="resize-none"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!form.watch("isPersonal") && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="estimatedHours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horas Estimadas</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Ex: 100"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="deadline"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="mb-2.5">Prazo de Entrega</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: ptBR })
                                                            ) : (
                                                                <span>Selecione uma data</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {project ? "Salvar Alterações" : "Criar Projeto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
