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
                    <AppSelect 
                        label="Default date range"
                        inputId="dashboard-default-date-range"
                        value={settings.dateRange}
                        onChange={(val) => setSettings(prev => ({ ...prev, dateRange: val }))}
                        options={dateRangeOptions}
                        helpText="Used when the dashboard opens."
                    />
                </div>

                {/* Card Visibility */}
                <div>
                    <h3 className="tf-title-card mb-3">
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
                    <h3 className="tf-title-card mb-3">
                        Activity Display
                    </h3>
                    <div className="flex gap-3">
                        {[3, 5, 10].map(num => (
                            <button
                                key={num}
                                onClick={() => setSettings(prev => ({ ...prev, activityCount: num }))}
                                type="button"
                                aria-pressed={settings.activityCount === num}
                                className={`tf-btn-base flex-1 ${
                                    settings.activityCount === num
                                        ? "tf-btn-secondary tf-text-accent border-[var(--tf-accent)]"
                                        : "tf-btn-outline"
                                }`}
                            >
                                Latest {num}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="tf-bd flex items-center justify-end gap-2 border-t pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="tf-btn-base tf-btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="tf-btn-base tf-btn-primary"
                    >
                        Save settings
                    </button>
                </div>

            </div>
        </Modal>
    );
}

/*
 * A real checkbox stays in the markup and carries the state, so the
 * control keeps its label association, keyboard behaviour and screen
 * reader semantics. `.tf-switch` only draws it.
 */
function Toggle({ label, checked, onChange }) {
    return (
        <label className="group flex cursor-pointer items-center justify-between gap-4">
            <span className="tf-body-sm group-hover:tf-text transition-colors">
                {label}
            </span>

            <input
                type="checkbox"
                className="tf-sr-only peer"
                checked={checked}
                onChange={onChange}
            />

            <span
                aria-hidden="true"
                data-checked={checked ? "true" : "false"}
                className="tf-switch peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--tf-accent)]"
            />
        </label>
    );
}
