import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import whatsappApi from "../../../api/whatsappApi";

export default function CreateWhatsAppTemplate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "MARKETING",
    languageCode: "en",
    bodyText: "",
    footerText: "",
    metaTemplateId: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.bodyText.trim()) {
      setError("Name and body are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Build components array matching API structure
      const components = [
        {
          type: "BODY",
          text: form.bodyText
        }
      ];
      
      if (form.footerText) {
        components.push({
          type: "FOOTER",
          text: form.footerText
        });
      }
      
      const payload = {
        name: form.name,
        category: form.category,
        languageCode: form.languageCode,
        metaTemplateId: form.metaTemplateId || undefined,
        components: components
      };

      await whatsappApi.createTemplate(payload);
      setSuccess("Template created successfully");
      setTimeout(() => {
        navigate('/communication/whatsapp/templates');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Create WhatsApp Template</h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Template Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                  <option value="MARKETING">MARKETING</option>
                  <option value="UTILITY">UTILITY</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Language</label>
                <input type="text" className="form-control" name="languageCode" value={form.languageCode} onChange={handleChange} />
              </div>

              <div className="col-12">
                <label className="form-label">Meta Template ID (optional)</label>
                <input type="text" className="form-control" name="metaTemplateId" value={form.metaTemplateId} onChange={handleChange} />
              </div>

              <div className="col-12">
                <label className="form-label">Body *</label>
                <textarea className="form-control" rows={6} name="bodyText" value={form.bodyText} onChange={handleChange} required />
              </div>

              <div className="col-12">
                <label className="form-label">Footer (optional)</label>
                <input type="text" className="form-control" name="footerText" value={form.footerText} onChange={handleChange} />
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Template'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
