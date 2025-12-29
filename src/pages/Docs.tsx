import { useState, useMemo } from 'react';
import { DOCS_DATA } from '@/content/docsData';
import {
    Search, Book, ChevronRight, Menu, X,
    Lightbulb, AlertCircle, Info, ExternalLink,
    ArrowLeft, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Docs() {
    const navigate = useNavigate();
    const [activeSectionId, setActiveSectionId] = useState(DOCS_DATA[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const activeSection = useMemo(() =>
        DOCS_DATA.find(s => s.id === activeSectionId) || DOCS_DATA[0]
        , [activeSectionId]);

    const filteredSections = useMemo(() => {
        if (!searchQuery) return DOCS_DATA;
        return DOCS_DATA.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const handleSectionClick = (id: string) => {
        setActiveSectionId(id);
        setIsSidebarOpen(false);
        const scrollTarget = document.getElementById('docs-content-area');
        if (scrollTarget) {
            scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Documentation Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-border flex flex-col gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="w-fit -ml-2 text-muted-foreground hover:text-foreground gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary">
                                <Book className="w-6 h-6" />
                                <h1 className="font-bold tracking-tight text-xl">Docs Center</h1>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search documentation..."
                                className="pl-9 bg-muted/50 border-transparent focus:bg-background h-11 text-sm rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Sections List */}
                    <ScrollArea className="flex-1">
                        <nav className="p-4 space-y-1">
                            {filteredSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => handleSectionClick(section.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all group text-left",
                                        activeSectionId === section.id
                                            ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <span className="truncate">{section.title}</span>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 shrink-0 transition-transform",
                                        activeSectionId === section.id ? "translate-x-0" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                                    )} />
                                </button>
                            ))}
                        </nav>
                    </ScrollArea>

                    {/* Sidebar Footer */}
                    <div className="p-6 border-t border-border bg-muted/20">
                        <div className="bg-card/50 border border-border rounded-xl p-4">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Support Email</p>
                            <a
                                href="mailto:rushikeshbodke574@gmail.com"
                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-2 break-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> rushikeshbodke574@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
                {/* Mobile Top Bar */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <Book className="w-5 h-5 text-primary" />
                        <span className="font-bold">Docs Center</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                </header>

                <ScrollArea id="docs-content-area" className="flex-1">
                    <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 lg:py-24">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-12 bg-muted/30 w-fit px-3 py-1.5 rounded-full">
                            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button>
                            <ChevronRight className="w-3 h-3 opacity-50" />
                            <span className="text-foreground font-medium">{activeSection.title}</span>
                        </div>

                        {/* Article Content */}
                        <article
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: activeSection.content }}
                        />

                        {/* Enhanced Feedback Module */}
                        <div className="mt-24 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-card to-muted/20 p-10 rounded-3xl border border-border shadow-2xl shadow-black/20">
                            <div className="text-center md:text-left">
                                <h4 className="font-bold text-2xl mb-2 text-foreground">Was this page helpful?</h4>
                                <p className="text-muted-foreground">Help us build a better documentation experience for everyone.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 gap-3 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50 transition-all rounded-2xl border-2"
                                    onClick={() => toast.success("Awesome! Glad we could help. ✨")}
                                >
                                    <ThumbsUp className="w-5 h-5" /> Yes, thanks!
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 gap-3 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all rounded-2xl border-2"
                                    onClick={() => toast.info("Noted. We'll improve this section! �️")}
                                >
                                    <ThumbsDown className="w-5 h-5" /> Not really
                                </Button>
                            </div>
                        </div>

                        {/* Massive Pagination Buttons */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-border">
                            {(() => {
                                const currentIndex = DOCS_DATA.findIndex(s => s.id === activeSectionId);
                                const prev = DOCS_DATA[currentIndex - 1];
                                const next = DOCS_DATA[currentIndex + 1];

                                return (
                                    <>
                                        {prev ? (
                                            <button
                                                onClick={() => handleSectionClick(prev.id)}
                                                className="flex flex-col items-start gap-4 p-8 rounded-3xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all group text-left relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2 text-primary">
                                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform duration-300" />
                                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Previous</span>
                                                </div>
                                                <span className="text-2xl font-black group-hover:text-primary transition-colors leading-tight">{prev.title}</span>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
                                            </button>
                                        ) : <div />}

                                        {next ? (
                                            <button
                                                onClick={() => handleSectionClick(next.id)}
                                                className="flex flex-col items-end gap-4 p-8 rounded-3xl border-2 border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all group text-right relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2 text-primary">
                                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Next</span>
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                                                </div>
                                                <span className="text-2xl font-black group-hover:text-primary transition-colors leading-tight">{next.title}</span>
                                                <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
                                            </button>
                                        ) : <div />}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </ScrollArea>
            </main>

            {/* CSS Overrides for Premium Documentation Aesthetics */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .prose h1 { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 2.5rem; color: hsl(var(--foreground)); line-height: 1.1; }
                .prose h2 { font-size: 2rem; font-weight: 800; margin-top: 4rem; margin-bottom: 1.5rem; border-bottom: 2px solid hsl(var(--border)); padding-bottom: 0.75rem; color: hsl(var(--foreground)); }
                .prose h3 { font-size: 1.5rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.25rem; color: hsl(var(--primary)); }
                .prose p { margin-bottom: 1.75rem; line-height: 1.8; color: hsl(var(--muted-foreground)); font-size: 1.125rem; }
                .prose ul, .prose ol { margin-bottom: 2rem; padding-left: 1.75rem; list-style-position: outside; }
                .prose li { margin-bottom: 0.75rem; color: hsl(var(--muted-foreground)); font-size: 1.125rem; }
                .prose strong { color: hsl(var(--foreground)); font-weight: 700; }
                .prose blockquote { border-left: 4px solid hsl(var(--primary)); padding-left: 1.5rem; font-style: italic; color: hsl(var(--foreground)/0.8); margin: 2rem 0; }
                .prose .note, .prose .tip, .prose .warning { border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            ` }} />
        </div>
    );
}
