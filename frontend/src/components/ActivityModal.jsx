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
                <div className="p-4 sm:p-6 tf-bd border-b shrink-0 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 tf-text-subtle" />
                            </div>
                            <input
                                type="text"
                                className="tf-field tf-field-icon-start block w-full"
                                placeholder="Search activity..."
                                aria-label="Search workspace activity"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "all" 
                                        ? "tf-btn-primary" 
                                        : "tf-btn-ghost tf-bg-2"
                                }`}
                            >
                                All Activity
                            </button>
                            <button
                                onClick={() => setFilter("tasks")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "tasks" 
                                        ? "tf-badge-info font-semibold" 
                                        : "tf-btn-ghost tf-bg-2"
                                }`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => setFilter("projects")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "projects" 
                                        ? "tf-badge-accent font-semibold" 
                                        : "tf-btn-ghost tf-bg-2"
                                }`}
                            >
                                Projects
                            </button>
                            <button
                                onClick={() => setFilter("clients")}
                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                                    filter === "clients" 
                                        ? "tf-badge-warning font-semibold" 
                                        : "tf-btn-ghost tf-bg-2"
                                }`}
                            >
                                Clients
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 tf-bg-2">
                    {filteredActivities.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center tf-text-muted">
                            <div className="mb-4 rounded-full tf-bg-3 p-4">
                                <Calendar size={24} className="tf-text-subtle" />
                            </div>
                            <p className="text-[14px] font-medium tf-text">
                                No activity found
                            </p>
                            <p className="text-[13px] mt-1 max-w-sm tf-text-muted">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredActivities.map((activity) => (
                                <div 
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 tf-card-base rounded-xl"
                                >
                                    <div className={`p-2.5 rounded-xl shrink-0 ${activity.color}`}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-semibold tf-text truncate">
                                                {activity.title}
                                            </p>
                                            <span className="text-[11px] font-medium tf-text-muted shrink-0 whitespace-nowrap">
                                                {activity.time}
                                            </span>
                                        </div>
                                        <p className="text-sm tf-text-secondary line-clamp-2">
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
