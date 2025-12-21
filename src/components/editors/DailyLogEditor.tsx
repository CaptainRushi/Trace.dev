import { useState } from 'react';
import { Save } from 'lucide-react';

interface LogSection {
  id: string;
  label: string;
  placeholder: string;
}

const sections: LogSection[] = [
  { id: 'workedOn', label: 'What I worked on today', placeholder: '- Implemented user authentication\n- Fixed API response caching' },
  { id: 'completed', label: 'What I completed today', placeholder: '- User login flow\n- Password reset endpoint' },
  { id: 'notCompleted', label: 'What I did not complete', placeholder: '- Email verification\n- Rate limiting' },
  { id: 'blockers', label: 'Blockers / notes', placeholder: '- Waiting on design specs\n- Need API access from team' },
];

export function DailyLogEditor() {
  const [values, setValues] = useState<Record<string, string>>({
    workedOn: '',
    completed: '',
    notCompleted: '',
    blockers: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{today}</span>
          <span className="text-muted-foreground/50">|</span>
          <span className="font-mono text-xs text-muted-foreground">daily log</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded-sm transition-colors">
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>

      {/* Log Sections */}
      <div className="grid gap-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {section.label}
            </label>
            <textarea
              value={values[section.id]}
              onChange={(e) => handleChange(section.id, e.target.value)}
              placeholder={section.placeholder}
              rows={4}
              className="w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
