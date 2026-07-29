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
    <Modal
      open={open}
      onClose={onClose}
      title="Notification Settings"
      description="Choose which activity should appear in your notification center."
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="tf-btn-base tf-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="tf-btn-base tf-btn-primary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Settings
          </button>
        </>
      }
    >
      <div>
        <p className="text-sm tf-text-muted mb-6">
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
              <h4 className="text-[13px] font-bold uppercase tracking-wider tf-text-muted">In-App Notifications</h4>
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

      </div>
    </Modal>
  );
}

function ToggleOption({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm font-medium tf-text">{label}</p>
        <p className="text-xs tf-text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        disabled={disabled}
        aria-checked={checked}
        onClick={onChange}
        data-checked={checked}
        className="tf-switch"
      />
    </div>
  );
}
