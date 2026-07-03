import { useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import Modal from "./Modal";

export default function ActivityModal({ open, onClose, activities = [] }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // Memoize filtered activities
    const filteredActivities = useMemo(() => {
        let result = activities;

        // Apply type filter
        if (filter !== "all") {
            result = result.filter(act => {
                if (filter === "tasks" && (act.id.includes("task_create") || act.id.includes("task_complete"))) return true;
                if (filter === "projects" && act.id.includes("proj_create")) return true;
                if (filter === "clients" && act.id.includes("client_create")) return true;
                return false;
            });
        }

        // Apply text search
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(act => 
                act.title.toLowerCase().includes(query) || 
                (act.desc && act.desc.toLowerCase().includes(query))
            );
        }

        return result;
    }, [activities, search, filter]);

    return (
        <Modal open={open} onClose={onClose} title="Workspace Activity" wide>
            <div className="flex flex-col h-[75vh] max-h-[800px]">
                
                {/* Header Controls */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 shrink-0 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                placeholder="Search activity..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "all" 
                                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                }`}
                            >
                                All Activity
                            </button>
                            <button
                                onClick={() => setFilter("tasks")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "tasks" 
                                        ? "bg-blue-500 text-white" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                }`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => setFilter("projects")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "projects" 
                                        ? "bg-indigo-500 text-white" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                }`}
                            >
                                Projects
                            </button>
                            <button
                                onClick={() => setFilter("clients")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "clients" 
                                        ? "bg-amber-500 text-white" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                }`}
                            >
                                Clients
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    {filteredActivities.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                            <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                <Calendar size={24} className="text-slate-400" />
                            </div>
                            <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                                No activity found
                            </p>
                            <p className="text-[13px] mt-1 max-w-sm">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredActivities.map((activity) => (
                                <div 
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className={`p-2.5 rounded-xl shrink-0 ${activity.color}`}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {activity.title}
                                            </p>
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
                                                {activity.time}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {activity.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
