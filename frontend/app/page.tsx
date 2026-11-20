
"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  email: string;
  glucose: number;
  haemoglobin: number;
  cholesterol: number;
  remarks: string | null;
}

const API_URL = "http://127.0.0.1:8000/api/patients/";

const emptyForm = {
  full_name: "",
  date_of_birth: "",
  email: "",
  glucose: "",
  haemoglobin: "",
  cholesterol: "",
};

type PatientForm = typeof emptyForm;

function formatDate(date: string) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getErrorMessage(result: any) {
  if (Array.isArray(result?.detail)) {
    return result.detail.map((item: any) => item.msg).join(", ");
  }
  return result?.detail || "Something went wrong.";
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PatientForm>(emptyForm);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  async function fetchPatients() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok) throw new Error(getErrorMessage(result));

      setPatients(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm(data: PatientForm) {
    if (!data.full_name.trim()) return "Full name is required.";
    if (!data.email.trim()) return "Email is required.";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) return "Enter a valid email address.";

    if (!data.date_of_birth) return "Date of birth is required.";

    const today = new Date();
    const dob = new Date(`${data.date_of_birth}T00:00:00`);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (dob >= todayStart) return "Date of birth must be in the past.";

    const values = [data.glucose, data.haemoglobin, data.cholesterol];

    for (const value of values) {
      const number = Number(value);
      if (value.trim() === "" || !Number.isFinite(number) || number < 0 || number > 9999.99) {
        return "Blood values must be valid numbers between 0 and 9999.99.";
      }
    }

    return "";
  }

  async function handleAddPatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      date_of_birth: formData.date_of_birth,
      email: formData.email.trim(),
      glucose: Number(formData.glucose),
      haemoglobin: Number(formData.haemoglobin),
      cholesterol: Number(formData.cholesterol),
    };

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));

      setFormData(emptyForm);
      setShowForm(false);
      setSuccess("Patient added successfully.");
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add patient.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(patient: Patient) {
    setEditingPatient(patient);
    setFormData({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      email: patient.email,
      glucose: String(patient.glucose),
      haemoglobin: String(patient.haemoglobin),
      cholesterol: String(patient.cholesterol),
    });
    setSelectedPatient(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  }

  async function handleUpdatePatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPatient) return;

    setError("");
    setSuccess("");

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      date_of_birth: formData.date_of_birth,
      email: formData.email.trim(),
      glucose: Number(formData.glucose),
      haemoglobin: Number(formData.haemoglobin),
      cholesterol: Number(formData.cholesterol),
    };

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}${editingPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));

      setEditingPatient(null);
      setFormData(emptyForm);
      setSuccess("Patient updated successfully. AI remarks have been refreshed.");
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update patient.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePatient(patient: Patient) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.full_name} (ID: ${patient.id})?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}${patient.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));

      setSelectedPatient(null);
      setSuccess(`${patient.full_name} was deleted successfully.`);
      await fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete patient.");
    }
  }

  const availableRemarks = patients.filter(
    (p) => p.remarks && !p.remarks.toLowerCase().includes("unavailable")
  ).length;

  const pendingRemarks = patients.length - availableRemarks;

  const formIsOpen = showForm || editingPatient !== null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 bg-slate-950 p-6 text-white md:block">
          <h1 className="text-2xl font-bold">HealthPredict</h1>
          <p className="mt-2 text-sm text-slate-400">
            Patient Management System
          </p>

          <nav className="mt-12 space-y-3">
            <div className="rounded-lg bg-blue-600 px-4 py-3 font-medium">
              Dashboard
            </div>
            <div className="rounded-lg px-4 py-3 text-slate-300">
              Patients
            </div>
            <div className="rounded-lg px-4 py-3 text-slate-300">
              Health Reports
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="min-w-0 flex-1 p-5 md:p-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="mt-1 text-slate-500">
                Welcome to your Health Prediction System
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchPatients}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium hover:bg-slate-50"
              >
                Refresh Records
              </button>

              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingPatient(null);
                  setFormData(emptyForm);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                {formIsOpen ? "Close Form" : "+ Add Patient"}
              </button>
            </div>
          </header>

          {success && (
            <div className="mb-5 rounded-lg bg-green-100 p-4 text-green-800">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Add / Edit Form */}
          {formIsOpen && (
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-bold">
                {editingPatient ? `Edit Patient #${editingPatient.id}` : "Add New Patient"}
              </h3>
              <p className="mb-6 text-sm text-slate-500">
                Enter patient details and blood test values.
              </p>

              <form onSubmit={editingPatient ? handleUpdatePatient : handleAddPatient}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {[
                    { name: "full_name", label: "Full Name", type: "text", placeholder: "Enter full name" },
                    { name: "date_of_birth", label: "Date of Birth", type: "date", placeholder: "" },
                    { name: "email", label: "Email Address", type: "email", placeholder: "example@email.com" },
                    { name: "glucose", label: "Glucose", type: "number", placeholder: "Enter glucose value" },
                    { name: "haemoglobin", label: "Haemoglobin", type: "number", placeholder: "Enter haemoglobin value" },
                    { name: "cholesterol", label: "Cholesterol", type: "number", placeholder: "Enter cholesterol value" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="mb-2 block text-sm font-medium">
                        {field.label} *
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof PatientForm]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        required
                        min={field.type === "date" ? undefined : field.type === "number" ? "0" : undefined}
                        max={field.type === "date" ? new Date().toLocaleDateString("en-CA") : field.type === "number" ? "9999.99" : undefined}
                        step={field.type === "number" ? "0.01" : undefined}
                        className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  {editingPatient
                    ? "AI remarks will be regenerated when you update this patient."
                    : "Gemini AI will generate general health screening remarks after saving."}
                  {" "}These remarks are informational, not a medical diagnosis.
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingPatient ? "Update Patient" : "Save Patient"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPatient(null);
                      setFormData(emptyForm);
                      setError("");
                    }}
                    className="rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Patients" value={patients.length} description="Saved patient records" />
            <StatCard title="AI Remarks Available" value={availableRemarks} description="Records with remarks" />
            <StatCard title="Pending AI Remarks" value={pendingRemarks} description="Need AI remarks" />
          </div>

          {/* Patient Table */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-xl font-bold">Patient Records</h3>
              <p className="mt-1 text-sm text-slate-500">
                View and manage all registered patients
              </p>
            </div>

            {loading ? (
              <p className="p-8 text-center text-slate-500">Loading patient records...</p>
            ) : patients.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No patient records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Patient Name</th>
                      <th className="p-4">Date of Birth</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Glucose</th>
                      <th className="p-4">Haemoglobin</th>
                      <th className="p-4">Cholesterol</th>
                      <th className="p-4">AI Remarks</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-t hover:bg-slate-50">
                        <td className="p-4">{patient.id}</td>
                        <td className="p-4 font-medium">{patient.full_name}</td>
                        <td className="p-4 whitespace-nowrap">{formatDate(patient.date_of_birth)}</td>
                        <td className="p-4">{patient.email}</td>
                        <td className="p-4">{patient.glucose}</td>
                        <td className="p-4">{patient.haemoglobin}</td>
                        <td className="p-4">{patient.cholesterol}</td>
                        <td className="p-4">
                          {patient.remarks &&
                          !patient.remarks.toLowerCase().includes("unavailable") ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                              Available
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium hover:bg-slate-200"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEdit(patient)}
                              className="rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePatient(patient)}
                              className="rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Health Prediction System · Powered by FastAPI, MySQL and Gemini AI
          </p>
        </section>
      </div>

      {/* View Patient Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Patient Details</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Patient ID: {selectedPatient.id}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Full Name" value={selectedPatient.full_name} />
              <Detail label="Date of Birth" value={formatDate(selectedPatient.date_of_birth)} />
              <Detail label="Email" value={selectedPatient.email} />
              <Detail label="Glucose" value={String(selectedPatient.glucose)} />
              <Detail label="Haemoglobin" value={String(selectedPatient.haemoglobin)} />
              <Detail label="Cholesterol" value={String(selectedPatient.cholesterol)} />
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-900">AI-Generated Remarks</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selectedPatient.remarks || "No AI remarks are available for this patient."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                General informational output only. Not a medical diagnosis.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openEdit(selectedPatient)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Edit Patient
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg border px-5 py-2 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
