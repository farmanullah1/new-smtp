import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Tag, Layers, CheckCircle2, FileText, Archive, Clock } from 'lucide-react';
import { getItems, createItem, updateItem, deleteItem, getItemStats } from '../api/items';
import { ItemModal } from '../components/ItemModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export const DashboardPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [itemModal, setItemModal] = useState({ isOpen: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null, loading: false });

  const toast = useToast();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        getItems({
          page,
          limit: 8,
          q: searchQuery,
          status: statusFilter,
          category: categoryFilter,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }),
        getItemStats()
      ]);

      setItems(itemsRes.items || []);
      setPagination(itemsRes.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      if (statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, categoryFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSaveItem = async (data) => {
    if (itemModal.item) {
      // Update
      await updateItem(itemModal.item.id, data);
      toast.success('Item resource updated successfully');
    } else {
      // Create
      await createItem(data);
      toast.success('New item resource created successfully');
    }
    fetchItems();
  };

  const handleDeleteItem = async () => {
    if (!deleteModal.itemId) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await deleteItem(deleteModal.itemId);
      toast.success('Item deleted successfully');
      setDeleteModal({ isOpen: false, itemId: null, loading: false });
      fetchItems();
    } catch (err) {
      toast.error(err.message || 'Failed to delete item');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge badge-danger">High Priority</span>;
      case 'medium':
        return <span className="badge badge-warning">Medium</span>;
      default:
        return <span className="badge badge-info">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-active">Active</span>;
      case 'draft':
        return <span className="badge badge-draft">Draft</span>;
      case 'archived':
        return <span className="badge badge-archived">Archived</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Resource Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Production CRUD operations connected directly to your Microsoft SQL Server
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setItemModal({ isOpen: true, item: null })}
        >
          <Plus size={18} /> New Resource
        </button>
      </div>

      {/* Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Resources</span>
            <Layers size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc' }}>{stats.total}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Active Items</span>
            <CheckCircle2 size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#34d399' }}>{stats.active}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Drafts</span>
            <FileText size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#fbbf24' }}>{stats.draft}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Archived</span>
            <Archive size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#94a3b8' }}>{stats.archived}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748b' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search items by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '38px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '140px' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '150px' }}
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="security">Security</option>
            <option value="frontend">Frontend</option>
            <option value="database">Database</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading resources from database...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Layers size={48} color="#475569" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>No Resource Items Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            {searchQuery || statusFilter || categoryFilter
              ? 'No items match your active filters. Try adjusting search criteria.'
              : 'Create your first resource item to manage project components.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setItemModal({ isOpen: true, item: null })}
          >
            <Plus size={16} /> Create Resource
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600', textTransform: 'capitalize' }}>
                    {item.category || 'General'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {getPriorityBadge(item.priority)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', color: '#f8fafc', marginBottom: '8px', lineHeight: 1.3 }}>
                  {item.title}
                </h3>

                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
                  {item.description || 'No detailed description provided.'}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Tag size={10} color="#818cf8" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {new Date(item.createdAt).toLocaleDateString()}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setItemModal({ isOpen: true, item })}
                    title="Edit Item"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteModal({ isOpen: true, itemId: item.id, loading: false })}
                    title="Delete Item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px'
        }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            &larr; Previous
          </button>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            Page <strong style={{ color: '#f8fafc' }}>{pagination.currentPage}</strong> of {pagination.totalPages} ({pagination.totalItems} total)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next &rarr;
          </button>
        </div>
      )}

      {/* Item Create/Edit Modal */}
      <ItemModal
        isOpen={itemModal.isOpen}
        item={itemModal.item}
        onClose={() => setItemModal({ isOpen: false, item: null })}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Resource Item"
        message="Are you sure you want to permanently delete this item? This action cannot be reversed."
        confirmText="Delete Resource"
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={handleDeleteItem}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, loading: false })}
      />
    </div>
  );
};
