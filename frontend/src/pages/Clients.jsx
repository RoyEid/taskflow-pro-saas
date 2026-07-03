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
import LoadingState from "../components/LoadingState";
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
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Clients
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage the clients you work with in this workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isMemberRole && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus size={16} />
              New Client
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative transition-transform duration-300 hover:scale-[1.02] focus-within:scale-[1.02]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-700 shadow-sm outline-none transition-all placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600 sm:w-72"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading clients..." />
        ) : filteredClients.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={<Users size={24} className="text-slate-400" />}
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
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
                    className="p-4 active:bg-slate-50 dark:active:bg-slate-800/40 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[13px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {clientName}
                          </p>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                            {clientEmail}
                          </p>
                        </div>
                      </div>
                      <Badge variant={client?.status || "active"} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between text-[12px]">
                      <div className="text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Company:</span> {client?.companyName || "—"}
                      </div>
                      <div className="text-slate-400">
                        Added {createdDate}
                      </div>
                    </div>

                    {!isMemberRole && (
                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(client);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(client);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-650 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50">
                    <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Client Info
                    </th>

                    <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Company
                    </th>

                    <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      Added
                    </th>

                    {!isMemberRole && (
                      <th className="px-6 py-3.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    )}
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
                        className="group/row cursor-pointer border-b border-slate-100 transition-colors duration-300 last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[13px] font-bold text-indigo-600 transition-transform duration-300 group-hover/row:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400">
                              {clientName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                                {clientName}
                              </p>

                              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                                {clientEmail}
                              </p>

                              {client?.phone && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                          {client?.companyName || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={client?.status || "active"} />
                        </td>

                        <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400">
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
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Name *
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Email *
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Company
              </label>

              <input
                type="text"
                value={form.companyName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Phone
              </label>

              <input
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-all duration-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
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