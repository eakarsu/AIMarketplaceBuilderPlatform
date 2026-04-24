import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { features } from '../featureConfig';
import FormModal from '../components/FormModal';
import AIOutput from '../components/AIOutput';

export default function FeaturePage({ feature, showToast, setCurrentPage }) {
  const config = features[feature];
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(config.endpoint);
      setItems(data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, showToast]);

  useEffect(() => {
    setSelectedItem(null);
    setShowModal(false);
    fetchItems();
  }, [feature, fetchItems]);

  const handleCreate = async (formData) => {
    try {
      await api.post(config.endpoint, formData);
      showToast('Item created successfully');
      setShowModal(false);
      fetchItems();
    } catch (err) {
      showToast('Failed to create item', 'error');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await api.put(`${config.endpoint}/${editItem.id}`, formData);
      showToast('Item updated successfully');
      setShowModal(false);
      setEditItem(null);
      fetchItems();
      if (selectedItem && selectedItem.id === editItem.id) {
        const { data } = await api.get(`${config.endpoint}/${editItem.id}`);
        setSelectedItem(data);
      }
    } catch (err) {
      showToast('Failed to update item', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${config.endpoint}/${id}`);
      showToast('Item deleted successfully');
      if (selectedItem && selectedItem.id === id) setSelectedItem(null);
      fetchItems();
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleGenerate = async (id) => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`${config.endpoint}/${id}/generate`);
      showToast('AI content generated successfully');
      setSelectedItem(data);
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.error || 'AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setShowModal(true);
  };

  if (!config) return <div className="page-body">Feature not found</div>;

  // Detail View
  if (selectedItem) {
    return (
      <>
        <div className="page-header">
          <h2>{config.icon} {config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="page-body">
          <button className="back-btn" onClick={() => setSelectedItem(null)}>
            ← Back to list
          </button>
          <div className="detail-view">
            <div className="detail-header">
              <h3>{selectedItem[config.nameField]}</h3>
              <div className="detail-actions">
                <button className="btn btn-ai btn-sm" onClick={() => handleGenerate(selectedItem.id)} disabled={aiLoading}>
                  {aiLoading ? <span className="spinner"></span> : '✨ Generate AI'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openEdit(selectedItem)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}>Delete</button>
              </div>
            </div>
            <div className="detail-body">
              <div className="detail-grid">
                {config.fields.map(field => (
                  <div key={field.name} className="detail-field">
                    <label>{field.label}</label>
                    <div className="value">
                      {config.formatValue
                        ? config.formatValue(field.name, selectedItem[field.name])
                        : (selectedItem[field.name] || '—')}
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem[config.aiField] && (
                <div className="detail-field">
                  <label>AI Generated Content</label>
                  <AIOutput content={selectedItem[config.aiField]} />
                </div>
              )}
            </div>
          </div>
        </div>

        {showModal && (
          <FormModal
            fields={config.fields}
            item={editItem}
            onSubmit={editItem ? handleUpdate : handleCreate}
            onClose={() => { setShowModal(false); setEditItem(null); }}
            title={editItem ? `Edit ${config.title}` : `New ${config.title}`}
          />
        )}
      </>
    );
  }

  // List View
  return (
    <>
      <div className="page-header">
        <h2>{config.icon} {config.title}</h2>
        <p>{config.description}</p>
      </div>
      <div className="page-body">
        <div className="data-table-container">
          <div className="table-header">
            <h3>{items.length} Items</h3>
            <button className="btn btn-primary" onClick={openCreate}>
              + New Item
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="icon">{config.icon}</div>
              <p>No items yet. Create your first one!</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {config.columns.map(col => (
                    <th key={col}>{config.columnLabels[col]}</th>
                  ))}
                  <th>AI</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelectedItem(item)}>
                    {config.columns.map(col => (
                      <td key={col} style={col === 'status' ? {} : {}}>
                        {col === 'status' ? (
                          <span className={`card-badge ${item[col] === 'active' ? 'green' : ''}`}>
                            {item[col]}
                          </span>
                        ) : config.formatValue ? (
                          config.formatValue(col, item[col])
                        ) : (
                          String(item[col] || '—').substring(0, 60)
                        )}
                      </td>
                    ))}
                    <td>
                      {item[config.aiField] ? (
                        <span className="card-badge purple">Generated</span>
                      ) : (
                        <span className="card-badge">Pending</span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ai btn-sm" onClick={() => { setSelectedItem(item); handleGenerate(item.id); }}>
                          ✨ AI
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <FormModal
          fields={config.fields}
          item={editItem}
          onSubmit={editItem ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          title={editItem ? `Edit ${config.title}` : `New ${config.title}`}
        />
      )}
    </>
  );
}
