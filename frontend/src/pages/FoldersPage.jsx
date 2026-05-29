import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Folder, Plus, Edit2, Trash2, MoreVertical, Search, Loader2 } from 'lucide-react';
import api from '../api/axios';
import UpgradeModal from '../components/UpgradeModal';

const FoldersPage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const plan = user?.subscription?.plan || 'free';
    const isFolderLocked = plan === 'free' || plan === 'local';

    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [folderName, setFolderName] = useState('');
    const [folderColor, setFolderColor] = useState('#F8F8F8');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isFolderLocked) {
            fetchFolders();
        } else {
            setLoading(false);
        }
    }, [isFolderLocked]);

    const fetchFolders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/folders');
            setFolders(data);
        } catch (error) {
            console.error("Failed to fetch folders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFolder = async () => {
        if (!folderName.trim()) return;
        setIsSaving(true);
        try {
            if (editingFolder) {
                await api.put(`/folders/${editingFolder._id}`, { name: folderName, color: folderColor });
            } else {
                await api.post('/folders', { name: folderName, color: folderColor });
            }
            await fetchFolders();
            setIsCreateModalOpen(false);
            setEditingFolder(null);
            setFolderName('');
            setFolderColor('#F8F8F8');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save folder');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this folder? QR codes will be moved to Uncategorized.')) return;
        try {
            await api.delete(`/folders/${id}`);
            await fetchFolders();
        } catch (error) {
            alert('Failed to delete folder');
        }
    };

    const openCreate = () => {
        setEditingFolder(null);
        setFolderName('');
        setFolderColor('#F8F8F8');
        setIsCreateModalOpen(true);
    };

    const openEdit = (folder, e) => {
        e.stopPropagation();
        setEditingFolder(folder);
        setFolderName(folder.name);
        setFolderColor(folder.color || '#F8F8F8');
        setIsCreateModalOpen(true);
    };

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (isFolderLocked) {
        return (
            <div className="p-6 md:p-8 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <UpgradeModal isOpen={true} onClose={() => navigate('/dashboard')} type="premium_feature" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 min-h-screen bg-slate-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Folders</h1>
                    <p className="text-sm text-slate-500 mt-1">Organize your QR codes into categories</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    New Folder
                </button>
            </div>

            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white shadow-sm"
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredFolders.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Folder className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No folders found</h3>
                    <p className="text-slate-500 text-sm mb-4">Create a folder to start organizing your QR codes.</p>
                    <button onClick={openCreate} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
                        Create Folder
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFolders.map(folder => (
                        <div 
                            key={folder._id} 
                            onClick={() => navigate(`/qrcodes?folder=${folder._id}`)}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: folder.color || '#F8F8F8' }}>
                                    <Folder className="text-slate-600" size={20} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => openEdit(folder, e)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-md">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(folder._id); }} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-md">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg truncate">{folder.name}</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">
                                    {folder.qrCount} QR Codes
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingFolder ? 'Edit Folder' : 'Create Folder'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                                <input 
                                    type="text" 
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    placeholder="e.g. Marketing Campaign"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Color</label>
                                <div className="flex gap-2">
                                    {['#F8F8F8', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#FCE7F3', '#F3E8FF'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFolderColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${folderColor === color ? 'border-slate-400 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveFolder} 
                                disabled={isSaving || !folderName.trim()}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoldersPage;
