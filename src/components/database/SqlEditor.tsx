
import Editor from '@monaco-editor/react';
import { useSchemaStore } from '@/stores/schemaStore';
import { useTheme } from 'next-themes';

export function SqlEditor() {
    const { sql, syncSqlToVisual } = useSchemaStore();
    const { theme } = useTheme();

    return (
        <div className="h-full w-full bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage="sql"
                theme="vs-dark"
                value={sql}
                onChange={(val) => val !== undefined && syncSqlToVisual(val)}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: 'JetBrains Mono, monospace'
                }}
            />
        </div>
    );
}
