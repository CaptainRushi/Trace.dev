
import { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Database } from "lucide-react";

export function DatabaseEditor() {
  const { dbDocs, upsertDbDoc, selectedProjectId } = useProjectStore();
  const [loading, setLoading] = useState(false);

  const [schemaNotes, setSchemaNotes] = useState("");
  const [migrationNotes, setMigrationNotes] = useState("");
  const [tableNotes, setTableNotes] = useState("");

  useEffect(() => {
    if (dbDocs) {
      setSchemaNotes(dbDocs.schema_notes || "");
      setMigrationNotes(dbDocs.migration_notes || "");
      setTableNotes(dbDocs.table_notes || "");
    } else {
      setSchemaNotes("");
      setMigrationNotes("");
      setTableNotes("");
    }
  }, [dbDocs]);

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      await upsertDbDoc({
        id: dbDocs?.id,
        project_id: selectedProjectId,
        schema_notes: schemaNotes,
        migration_notes: migrationNotes,
        table_notes: tableNotes
      });
      toast.success("Database docs updated");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Database Documentation</h2>
        </div>
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schema">Schema Design</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="tables">Key Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Schema Architecture</CardTitle>
              <CardDescription>ERD notes, relationships, and constraints</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[300px] font-mono"
                placeholder="## Users Table..."
                value={schemaNotes}
                onChange={(e) => setSchemaNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle>Migration Log</CardTitle>
              <CardDescription>Track tough migrations and rollback plans</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[300px] font-mono"
                placeholder="- 2024-01: Added new index..."
                value={migrationNotes}
                onChange={(e) => setMigrationNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Table Dictionary</CardTitle>
              <CardDescription>Notes on specific table usage and gotchas</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[300px] font-mono"
                placeholder="notes on 'daily_logs'..."
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
