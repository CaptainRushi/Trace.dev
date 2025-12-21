import { useState } from 'react';
import { Copy, Check, Shield, Eye, EyeOff } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

export function APIKeyVault() {
  const { apiKeys, selectedProjectId } = useProjectStore();
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const projectKeys = apiKeys.filter((k) => k.projectId === selectedProjectId);
  const selectedKey = projectKeys.find((k) => k.id === selectedKeyId);

  const handleCopy = (keyId: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(keyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (keyId: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  return (
    <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100vh-200px)]">
      {/* Key List */}
      <div className="border border-border rounded-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 bg-muted/30 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            API Packets
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {projectKeys.map((key) => (
            <button
              key={key.id}
              onClick={() => setSelectedKeyId(key.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 border-b border-border transition-colors",
                selectedKeyId === key.id
                  ? "bg-muted/50"
                  : "hover:bg-muted/20"
              )}
            >
              <div className="font-mono text-sm text-foreground">{key.platform}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-sm",
                  key.environment === 'production'
                    ? "bg-destructive/20 text-destructive"
                    : key.environment === 'staging'
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-primary/20 text-primary"
                )}>
                  {key.environment}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Key Detail */}
      <div className="border border-border rounded-sm overflow-hidden flex flex-col">
        {selectedKey ? (
          <>
            <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-medium text-foreground">
                  {selectedKey.platform}
                </span>
                <span className={cn(
                  "ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-sm",
                  selectedKey.environment === 'production'
                    ? "bg-destructive/20 text-destructive"
                    : selectedKey.environment === 'staging'
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-primary/20 text-primary"
                )}>
                  {selectedKey.environment}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-mono">Encrypted</span>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Key Name */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                  Key Name
                </label>
                <div className="font-mono text-sm text-foreground bg-input border border-border px-3 py-2 rounded-sm">
                  {selectedKey.keyName}
                </div>
              </div>

              {/* Key Value */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                  Value
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-sm text-foreground bg-input border border-border px-3 py-2 rounded-sm">
                    {revealedIds.has(selectedKey.id)
                      ? 'ghp_1234567890abcdefghij'
                      : selectedKey.maskedKey}
                  </div>
                  <button
                    onClick={() => toggleReveal(selectedKey.id)}
                    className="p-2 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {revealedIds.has(selectedKey.id) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(selectedKey.id, selectedKey.maskedKey)}
                    className="p-2 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {copiedId === selectedKey.id ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20">
              <p className="text-xs font-mono text-destructive/80">
                Secrets are encrypted at rest. Never expose in client code.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-mono">
            Select an API packet
          </div>
        )}
      </div>
    </div>
  );
}
