import { useState } from 'react';
import { Save, Database } from 'lucide-react';

export function DatabaseEditor() {
  const [content, setContent] = useState<Record<string, string>>({
    dbType: 'PostgreSQL 15',
    schema: `-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active'
);`,
    migrations: `## Migration Log

### 2024-01-15
- Added \`last_activity\` column to projects table
- Created index on \`user_id\`

### 2024-01-10
- Initial schema setup
- Created users and projects tables`,
    tables: `## Tables Overview

| Table | Rows | Size |
|-------|------|------|
| users | 150 | 24KB |
| projects | 89 | 16KB |
| api_keys | 234 | 8KB |`,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">database documentation</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded-sm transition-colors">
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>

      {/* DB Type */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Database Type
        </label>
        <input
          type="text"
          value={content.dbType}
          onChange={(e) => setContent((prev) => ({ ...prev, dbType: e.target.value }))}
          className="w-full max-w-xs bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Schema Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Schema Notes
        </label>
        <textarea
          value={content.schema}
          onChange={(e) => setContent((prev) => ({ ...prev, schema: e.target.value }))}
          rows={10}
          className="w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Migration Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Migration Notes
        </label>
        <textarea
          value={content.migrations}
          onChange={(e) => setContent((prev) => ({ ...prev, migrations: e.target.value }))}
          rows={8}
          className="w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Tables Overview */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Tables Overview
        </label>
        <textarea
          value={content.tables}
          onChange={(e) => setContent((prev) => ({ ...prev, tables: e.target.value }))}
          rows={6}
          className="w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
        />
      </div>
    </div>
  );
}
