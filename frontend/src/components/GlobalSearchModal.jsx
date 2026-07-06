import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, Loader2, Briefcase, CheckSquare, Users, User } from "lucide-react";
import Modal from "./Modal";
import useWorkspace from "../context/useWorkspace";
import { searchWorkspace } from "../services/searchService";
import { showError } from "../utils/alerts";

export default function GlobalSearchModal({ open, onClose }) {
    const { workspace } = useWorkspace();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const resultsContainerRef = useRef(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ projects: [], tasks: [], clients: [], members: [] });
    const [loading, setLoading] = useState(false);
    
    // For keyboard navigation
    const [flattenedResults, setFlattenedResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Get active workspace ID
    const workspaceId = workspace?._id || workspace?.id;

    // Reset when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                setQuery("");
                setResults({ projects: [], tasks: [], clients: [], members: [] });
                setFlattenedResults([]);
                setSelectedIndex(-1);
            }, 0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    // Debounce search
    useEffect(() => {
        if (!query.trim() || !workspaceId) {
            setTimeout(() => {
                setResults({ projects: [], tasks: [], clients: [], members: [] });
                setFlattenedResults([]);
                setLoading(false);
            }, 0);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchWorkspace(workspaceId, query);
                
                // Flatten results for keyboard navigation
                const flat = [];
                if (data.projects) flat.push(...data.projects.map(item => ({ ...item, _type: 'project' })));
                if (data.tasks) flat.push(...data.tasks.map(item => ({ ...item, _type: 'task' })));
                if (data.clients) flat.push(...data.clients.map(item => ({ ...item, _type: 'client' })));
                if (data.members) flat.push(...data.members.map(item => ({ ...item, _type: 'member' })));

                setResults(data);
                setFlattenedResults(flat);
                setSelectedIndex(flat.length > 0 ? 0 : -1);
            } catch {
                showError("Search failed to load results");
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, workspaceId]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % flattenedResults.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + flattenedResults.length) % flattenedResults.length);
            } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
                e.preventDefault();
                handleSelectResult(flattenedResults[selectedIndex]);
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, flattenedResults, selectedIndex]);

    // Scroll active item into view
    useEffect(() => {
        if (selectedIndex >= 0 && resultsContainerRef.current) {
            const activeEl = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }
    }, [selectedIndex, flattenedResults.length]);

    function handleSelectResult(item) {
        onClose();
        switch (item._type) {
            case "project":
                navigate(`/projects/${item._id}`);
                break;
            case "task":
                navigate(`/tasks/${item._id}?project=${item.project}`);
                break;
            case "client":
                navigate(`/clients`);
                break;
            case "member":
                navigate(`/members`);
                break;
            default:
                break;
        }
    };

    // Derived flags
    const hasResults = flattenedResults.length > 0;
    const isSearching = !!query.trim();

    return (
        <Modal open={open} onClose={onClose} title="Search TaskFlow Pro" wide>
            <div className="p-4 sm:p-6 space-y-6">
                
                {/* Search Input Area */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                        placeholder="Search projects, tasks, clients, members..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        </div>
                    )}
                </div>

                {/* Results Area */}
                <div 
                    ref={resultsContainerRef}
                    className="max-h-[50vh] overflow-y-auto"
                >
                    {!isSearching && (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                            Start typing to search across your workspace.
                        </div>
                    )}

                    {isSearching && !loading && !hasResults && (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No results found for "{query}".
                        </div>
                    )}

                    {hasResults && (
                        <div className="space-y-6">
                            <ResultSection 
                                title="Projects" 
                                items={results.projects} 
                                type="project"
                                icon={Briefcase}
                                flattenedResults={flattenedResults}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelectResult}
                                renderSubtitle={(item) => `${item.status?.replace('_', ' ')} • ${item.priority} Priority`}
                            />
                            <ResultSection 
                                title="Tasks" 
                                items={results.tasks} 
                                type="task"
                                icon={CheckSquare}
                                flattenedResults={flattenedResults}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelectResult}
                                renderSubtitle={(item) => `${item.status?.replace('_', ' ')} • ${item.priority} Priority`}
                            />
                            <ResultSection 
                                title="Clients" 
                                items={results.clients} 
                                type="client"
                                icon={Users}
                                flattenedResults={flattenedResults}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelectResult}
                                renderSubtitle={(item) => item.company || item.email || "Client"}
                            />
                            <ResultSection 
                                title="Members" 
                                items={results.members} 
                                type="member"
                                icon={User}
                                flattenedResults={flattenedResults}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelectResult}
                                renderSubtitle={(item) => item.role?.replace('_', ' ') || item.email || "Member"}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function ResultSection({ title, items, type, icon: Icon, flattenedResults, selectedIndex, onSelect, renderSubtitle }) {
    if (!items || items.length === 0) return null;

    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-2">
                {title}
            </h3>
            <ul className="space-y-2">
                {items.map((item) => {
                    const globalIndex = flattenedResults.findIndex(r => r._id === item._id && r._type === type);
                    const isActive = selectedIndex === globalIndex;
                    
                    return (
                        <li 
                            key={item._id}
                            data-index={globalIndex}
                            onClick={() => onSelect({ ...item, _type: type })}
                            className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                isActive 
                                    ? "bg-indigo-50/80 dark:bg-indigo-500/10 ring-1 ring-indigo-100 dark:ring-indigo-500/20" 
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                <div className={`p-2 rounded-lg ${
                                    isActive 
                                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" 
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className={`text-sm font-semibold truncate ${
                                        isActive ? "text-indigo-900 dark:text-indigo-100" : "text-slate-900 dark:text-slate-100"
                                    }`}>
                                        {item.title || item.name}
                                    </p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 capitalize">
                                        {type}
                                    </span>
                                </div>
                                <p className={`mt-1 text-xs truncate capitalize ${
                                    isActive ? "text-indigo-600/80 dark:text-indigo-300/80" : "text-slate-500 dark:text-slate-400"
                                }`}>
                                    {renderSubtitle(item)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
