import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getPreferences, updatePreferences } from '../services/notificationService';
import { showSuccess, showError } from '../utils/alerts';
import { Loader2 } from 'lucide-react';

export default function NotificationSettingsModal({ open, onClose }) {
  const [preferences, setPreferences] = useState({
    taskAssigned: true,
    taskCommented: true,
    taskStatusChanged: true,
    roleChanged: true,
    support: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await getPreferences();
      if (data && data.data) {
        setPreferences({
          taskAssigned: data.data.taskAssigned ?? true,
          taskCommented: data.data.taskCommented ?? true,
          taskStatusChanged: data.data.taskStatusChanged ?? true,
          roleChanged: data.data.roleChanged ?? true,
          support: data.data.support ?? true,
        });
      }
    } catch {
      showError("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => loadPreferences(), 0);
    }
  }, [open]);

  const handleChange = (field) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      showSuccess("Notification settings saved");
      onClose();
    } catch {
      showError("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Notification Settings" maxWidth="sm">
      <div className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Choose which notifications you'd like to receive in the app.
          <br/>
          <span className="text-xs italic mt-2 block opacity-80">
            Note: Important account and workspace emails are always sent. Task activity notifications appear in the app.
          </span>
        </p>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="pt-2 pb-2">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In-App Notifications</h4>
            </div>
            
            <ToggleOption 
              label="Task Assignments" 
              description="When you are assigned to a new task" 
              checked={preferences.taskAssigned} 
              onChange={() => handleChange('taskAssigned')} 
            />
            <ToggleOption 
              label="Task Comments" 
              description="When someone comments on a task you're involved in" 
              checked={preferences.taskCommented} 
              onChange={() => handleChange('taskCommented')} 
            />
            <ToggleOption 
              label="Task Status Changes" 
              description="When a task you're assigned to or created changes status" 
              checked={preferences.taskStatusChanged} 
              onChange={() => handleChange('taskStatusChanged')} 
            />
            <ToggleOption 
              label="Workspace Role Updates" 
              description="When your role changes in a workspace" 
              checked={preferences.roleChanged} 
              onChange={() => handleChange('roleChanged')} 
            />
            <ToggleOption 
              label="Support Requests" 
              description="When your support request is received or updated" 
              checked={preferences.support} 
              onChange={() => handleChange('support')} 
            />


          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ToggleOption({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        disabled={disabled}
        aria-checked={checked}
        onClick={onChange}
        className={`${
          checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
        } relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed`}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-4' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}
