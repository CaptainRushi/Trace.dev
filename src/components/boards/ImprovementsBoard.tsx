
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUpRight, Clock, Ban } from "lucide-react";

export function ImprovementsBoard() {
  const { improvements, addImprovement, deleteImprovement, selectedProjectId } = useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<'improve' | 'tomorrow' | 'stop'>('improve');

  const handleAdd = async () => {
    if (!selectedProjectId) return;
    if (!content) return;
    try {
      await addImprovement(selectedProjectId, category, content);
      toast.success("Item added");
      setDialogOpen(false);
      setContent("");
    } catch (error: any) {
      toast.error("Failed to add item");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteImprovement(id);
      toast.success("Item deleted");
    } catch (error: any) {
      toast.error("Failed to delete item");
    }
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'improve': return <ArrowUpRight className="h-4 w-4 text-primary" />;
      case 'tomorrow': return <Clock className="h-4 w-4 text-orange-400" />;
      case 'stop': return <Ban className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'improve': return 'default';
      case 'tomorrow': return 'secondary';
      case 'stop': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Continuous Improvement</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Improvement / Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improve">Improve (Do)</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow (Plan)</SelectItem>
                    <SelectItem value="stop">Stop (Avoid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="What needs to change?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Add Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="text-right w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {improvements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No improvement items tracked.
                </TableCell>
              </TableRow>
            ) : (
              improvements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={getBadgeVariant(item.category) as any} className="flex w-fit items-center gap-1">
                      {getIcon(item.category)}
                      <span className="capitalize">{item.category}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{item.content}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
