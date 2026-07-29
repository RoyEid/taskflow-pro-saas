import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import useWorkspace from "../context/useWorkspace";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clientService";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import TableSkeleton from "../components/ui/TableSkeleton";
import Modal from "../components/Modal";
import { showSuccess, showError, confirmDelete } from "../utils/alerts";
import { Search, Plus, Edit2, Trash2, Users } from "lucide-react";

const emptyClientForm = {
  name: "",
  email: "",
  companyName: "",
  phone: "",
  notes: "",
};

function normalizeClients(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.clients)) return data.clients;

  if (Array.isArray(data?.data?.clients)) return data.data.clients;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getWorkspaceId(workspace) {
  return workspace?._id || workspace?.id || null;
}

function getClientId(client) {
  return client?._id || client?.id || null;
}

function Clients() {
  const navigate = useNavigate();
  const { workspace, memberRole } = useWorkspace();

  const workspaceId = getWorkspaceId(workspace);
  const isMemberRole = memberRole === "member";

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClientForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const loadClients = useCallback(async () => {
    await Promise.resolve();

    if (!workspaceId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getClients(workspaceId);
      setClients(normalizeClients(data));
    } catch {
      setClients([]);
      setError("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;

    async function runLoadClients() {
      await Promise.resolve();

      if (!cancelled) {
        await loadClients();
      }
    }

    runLoadClients();

    return () => {
      cancelled = true;
    };
  }, [loadClients]);

  const openCreateModal = () => {
    setEditingClient(null);
    setForm(emptyClientForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);

    setForm({
      name: client?.name || "",
      email: client?.email || "",
      companyName: client?.companyName || "",
      phone: client?.phone || "",
      notes: client?.notes || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditingClient(null);
      setForm(emptyClientForm);
      setFormError("");
    }
  };

  const handleDelete = async (client) => {
    const clientId = getClientId(client);

    if (!workspaceId || !clientId) {
      showError("Missing workspace or client information.");
      return;
    }

    try {
      await deleteClient(workspaceId, clientId);
      await loadClients();
      showSuccess("Client deactivated successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to delete client.");
    }
  };

  const openDeleteConfirm = async (client) => {
    const confirmed = await confirmDelete({
      title: "Deactivate Client",
      text: `Are you sure you want to deactivate ${
        client?.name || "this client"
      }? This will hide the client from active lists.`,
      confirmButtonText: "Deactivate",
    });

    if (confirmed) {
      await handleDelete(client);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    const cleanForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      companyName: form.companyName.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };

    if (!cleanForm.name || !cleanForm.email) {
      setFormError("Name and email are required.");
      return;
    }

    if (!workspaceId) {
      setFormError("No workspace selected.");
      return;
    }

    setSaving(true);

    try {
      if (editingClient) {
        const clientId = getClientId(editingClient);

        if (!clientId) {
          setFormError("Missing client information.");
          return;
        }

        await updateClient(workspaceId, clientId, cleanForm);
      } else {
        await createClient(workspaceId, cleanForm);
      }

      await loadClients();

      setShowModal(false);
      setEditingClient(null);
      setForm(emptyClientForm);

      showSuccess(
        editingClient
          ? "Client updated successfully"
          : "Client created successfully"
      );
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to save client."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return clients;

    return clients.filter((client) => {
      const name = client?.name || "";
      const companyName = client?.companyName || "";
      const email = client?.email || "";
      const phone = client?.phone || "";

      return (
        name.toLowerCase().includes(query) ||
        companyName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query)
      );
    });
  }, [clients, searchQuery]);

  if (!workspace) {
    return (
      <DashboardLayout>
        <PageHeader title="Clients" subtitle="Manage your workspace clients." />

        <div className="mt-10">
          <EmptyState
            title="No workspace selected"
            description="Please select a workspace to view clients."
            action="Go to Workspaces"
            onAction={() => navigate("/workspaces")}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage the clients you work with in this workspace."
        action={!isMemberRole ? openCreateModal : undefined}
        actionLabel={!isMemberRole ? "New Client" : undefined}
        actionIcon={!isMemberRole ? <Plus size={16} /> : undefined}
      />

      {error && (
        <div className="tf-alert tf-alert-error mb-5" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl tf-card-base overflow-hidden">
        <div className="flex flex-col gap-3 tf-bd border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 tf-text-subtle"
            />

            <input
              type="text"
              placeholder="Search clients..."
              aria-label="Search clients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tf-field tf-field-icon-start w-full sm:w-72"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={4} className="mx-4 my-4 w-[calc(100%-2rem)]" />
        ) : filteredClients.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={<Users size={24} className="tf-text-subtle" />}
              title={searchQuery ? "No clients found" : "No clients yet"}
              description={
                searchQuery
                  ? "Try adjusting your search query."
                  : "Add your first client to start managing projects for them."
              }
              action={!searchQuery && !isMemberRole ? "Add Client" : undefined}
              onAction={!searchQuery && !isMemberRole ? openCreateModal : undefined}
            />
          </div>
        ) : (
          <div>
            {/* Mobile Card Layout */}
            <div className="md:hidden tf-bd divide-y">
              {filteredClients.map((client) => {
                const clientId = getClientId(client);
                const clientName = client?.name || "Unnamed Client";
                const clientEmail = client?.email || "No email";
                const createdDate = client?.createdAt
                  ? new Date(client.createdAt).toLocaleDateString()
                  : "—";

                return (
                  <div
                    key={clientId || clientName}
                    onClick={() => !isMemberRole && openEditModal(client)}
                    className="p-4 active:tf-bg-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl tf-bg-3 text-[13px] font-bold tf-text-accent">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold tf-text truncate">
                            {clientName}
                          </p>
                          <p className="text-[12px] tf-text-muted truncate">
                            {clientEmail}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client?.status || "active"} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between text-[12px]">
                      <div className="tf-text-muted">
                        <span className="font-medium tf-text-secondary">Company:</span> {client?.companyName || "—"}
                      </div>
                      <div className="tf-text-subtle">
                        Added {createdDate}
                      </div>
                    </div>

                    {!isMemberRole && (
                      <div className="mt-4 flex items-center justify-end gap-2 tf-bd border-t pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(client);
                          }}
                          className="tf-btn-base tf-btn-secondary tf-size-sm"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(client);
                          }}
                          className="tf-btn-base tf-btn-danger tf-size-sm"
                        >
                          <Trash2 size={12} /> Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="tf-scroll-x hidden md:block">
              <table className="tf-table min-w-[800px]">
                <thead>
                  <tr>
                    <th>Client Info</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Added</th>
                    {!isMemberRole && <th>Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client) => {
                    const clientId = getClientId(client);
                    const clientName = client?.name || "Unnamed Client";
                    const clientEmail = client?.email || "No email";
                    const createdDate = client?.createdAt
                      ? new Date(client.createdAt).toLocaleDateString()
                      : "—";

                    return (
                      <tr
                        key={clientId || clientName}
                        onClick={() => !isMemberRole && openEditModal(client)}
                        className="group/row cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl tf-bg-3 text-[13px] font-bold tf-text-accent transition-transform duration-300 group-hover/row:scale-110">
                              {clientName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-[13px] font-semibold leading-tight tf-text">
                                {clientName}
                              </p>

                              <p className="mt-0.5 text-[12px] tf-text-muted">
                                {clientEmail}
                              </p>

                              {client?.phone && (
                                <p className="mt-0.5 text-[11px] tf-text-subtle">
                                  {client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-[13px] font-medium tf-text-secondary">
                          {client?.companyName || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={client?.status || "active"} />
                        </td>

                        <td className="px-6 py-4 text-[13px] tf-text-muted">
                          {createdDate}
                        </td>

                        {!isMemberRole && (
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(client)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                aria-label={`Edit ${clientName}`}
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(client)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                aria-label={`Delete ${clientName}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingClient ? "Edit Client" : "Add Client"}
      >
        {formError && (
          <div className="tf-alert tf-alert-error mb-4" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="tf-label" htmlFor="client-name">
                Name *
              </label>

              <input
                id="client-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="tf-field w-full"
                required
              />
            </div>

            <div>
              <label className="tf-label" htmlFor="client-email">
                Email *
              </label>

              <input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="tf-field w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="tf-label" htmlFor="client-company">
                Company
              </label>

              <input
                id="client-company"
                type="text"
                value={form.companyName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                className="tf-field w-full"
              />
            </div>

            <div>
              <label className="tf-label" htmlFor="client-phone">
                Phone
              </label>

              <input
                id="client-phone"
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="tf-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="tf-label" htmlFor="client-notes">
              Notes
            </label>

            <textarea
              id="client-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="tf-field w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="tf-btn-base tf-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="tf-btn-base tf-btn-primary"
            >
              {saving ? "Saving..." : "Save Client"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Clients;
