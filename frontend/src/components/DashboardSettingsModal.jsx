import { useState, useEffect } from "react";
import Modal from "./Modal";
import AppSelect from "./ui/AppSelect";

const defaultSettings = {
    dateRange: "Last 30 Days",
    showProjectsCard: true,
    showActiveTasksCard: true,
    showCompletedTasksCard: true,
    showOverdueTasksCard: true,
    showTrendChart: true,
    showLatestUpdates: true,
    showRecentProjects: true,
    activityCount: 5,
};

const dateRangeOptions = [
    { value: "Today", label: "Today" },
    { value: "Last 7 Days", label: "Last 7 Days" },
    { value: "Last 30 Days", label: "Last 30 Days" },
    { value: "This Month", label: "This Month" },
    { value: "This Year", label: "This Year" },
];

export default function DashboardSettingsModal({ open, onClose, onSave }) {
    const [settings, setSettings] = useState(defaultSettings);

    useEffect(() => {
        if (open) {
            const saved = localStorage.getItem("taskflow_dashboard_settings");
            setTimeout(() => {
                if (saved) {
                    try {
                        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
                    } catch {
                        setSettings(defaultSettings);
                    }
                } else {
                    setSettings(defaultSettings);
                }
            }, 0);
        }
    }, [open]);

    const handleSave = () => {
        localStorage.setItem("taskflow_dashboard_settings", JSON.stringify(settings));
        if (onSave) onSave(settings);
        onClose();
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Modal open={open} onClose={onClose} title="Dashboard Settings">
            <div className="space-y-6">
                
                {/* Default Date Range */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Default Date Range
                    </h3>
                    <AppSelect 
                        value={settings.dateRange}
                        onChange={(val) => setSettings(prev => ({ ...prev, dateRange: val }))}
                        options={dateRangeOptions}
                    />
                </div>

                {/* Card Visibility */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Widget Visibility
                    </h3>
                    <div className="space-y-3">
                        <Toggle 
                            label="Show Total Projects Card" 
                            checked={settings.showProjectsCard} 
                            onChange={() => toggleSetting('showProjectsCard')} 
                        />
                        <Toggle 
                            label="Show Active Tasks Card" 
                            checked={settings.showActiveTasksCard} 
                            onChange={() => toggleSetting('showActiveTasksCard')} 
                        />
                        <Toggle 
                            label="Show Completed Tasks Card" 
                            checked={settings.showCompletedTasksCard} 
                            onChange={() => toggleSetting('showCompletedTasksCard')} 
                        />
                        <Toggle 
                            label="Show Overdue Tasks Card" 
                            checked={settings.showOverdueTasksCard} 
                            onChange={() => toggleSetting('showOverdueTasksCard')} 
                        />
                        <Toggle 
                            label="Show Task Volume Trend" 
                            checked={settings.showTrendChart} 
                            onChange={() => toggleSetting('showTrendChart')} 
                        />
                        <Toggle 
                            label="Show Latest Updates" 
                            checked={settings.showLatestUpdates} 
                            onChange={() => toggleSetting('showLatestUpdates')} 
                        />
                        <Toggle 
                            label="Show Recent Projects" 
                            checked={settings.showRecentProjects} 
                            onChange={() => toggleSetting('showRecentProjects')} 
                        />
                    </div>
                </div>

                {/* Activity Display Limit */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Activity Display
                    </h3>
                    <div className="flex gap-3">
                        {[3, 5, 10].map(num => (
                            <button
                                key={num}
                                onClick={() => setSettings(prev => ({ ...prev, activityCount: num }))}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                    settings.activityCount === num
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                }`}
                            >
                                Latest {num}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    >
                        Save Settings
                    </button>
                </div>

            </div>
        </Modal>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
            <div className="relative">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={checked} 
                    onChange={onChange} 
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
            </div>
        </label>
    );
}
