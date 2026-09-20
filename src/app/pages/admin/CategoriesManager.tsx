import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCMS } from '../../context/CMSContext';
import type { CategoryNode } from '../../context/CMSContext';
import { buildCategoryTree } from '../../utils/categoryTree';
import { Input } from '../../components/ui/input';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit2,
  Save,
  X,
  Upload,
  Hash,
  Check,
  FolderTree,
  Eye,
  EyeOff
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface EditingCategory {
  path: string;
  name: string;
  slug: string;
  code: string;
  imageUrl: string;
}

export function CategoriesManager() {
  const navigate = useNavigate();
  
  // Safe access to CMS context with fallback
  let data, updateCategories, updateCategoryTree;
  try {
    const cms = useCMS();
    data = cms.data;
    updateCategories = cms.updateCategories;
    updateCategoryTree = cms.updateCategoryTree;
  } catch (e) {
    console.error('CategoriesManager: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    updateCategories = async () => {};
    updateCategoryTree = () => {};
  }
  
  const [categories, setCategories] = useState(data.categories);
  const [categoryTreeData, setCategoryTreeData] = useState(data.categoryTree);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<EditingCategory | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryLevel, setNewCategoryLevel] = useState(1);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<string>('');
  const [disabledSubcategories, setDisabledSubcategories] = useState<Set<string>>(
    new Set(data.categoryTree?.filter((n: any) => n.status === 0 || n.disabled).map((n: any) => n.path) || [])
  );

  // Toggle subcategory visibility status
  const handleToggleSubcategoryStatus = (path: string) => {
    setDisabledSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(path)) { next.delete(path); } else { next.add(path); }
      return next;
    });

    setCategoryTreeData(prevTree => prevTree.map(node => {
      if (node.path === path) {
        const currentlyDisabled = disabledSubcategories.has(path);
        return { ...node, status: currentlyDisabled ? 1 : 0, disabled: !currentlyDisabled };
      }
      return node;
    }));
  };

  // Build tree from category tree data
  const categoryTree = buildCategoryTree(categoryTreeData);
  const hasTreeData = categoryTree.length > 0;

  // Get statistics
  const getTreeStats = () => {
    const levelCounts: Record<number, number> = {};
    categoryTreeData.forEach(node => {
      levelCounts[node.level] = (levelCounts[node.level] || 0) + 1;
    });
    return levelCounts;
  };

  const stats = hasTreeData ? getTreeStats() : {};
  const maxLevel = Math.max(...Object.keys(stats).map(Number), 0);

  // Handle updating a category
  const handleUpdateCategory = (path: string, updates: Partial<CategoryNode>) => {
    const updatedTree = categoryTreeData.map(node => 
      node.path === path ? { ...node, ...updates } : node
    );
    setCategoryTreeData(updatedTree);
  };

  const [deletePath, setDeletePath] = useState<string | null>(null);

  // Handle deleting a category
  const confirmDeleteCategory = () => {
    if (!deletePath) return;
    const path = deletePath;
    const targetNode = categoryTreeData.find(node => node.path === path);
    
    const updatedTree = categoryTreeData.filter(node => 
      node.path && node.path !== path && !node.path.startsWith(path + '/')
    );
    
    if (targetNode) {
      setCategories(prev => prev.filter(cat => cat !== targetNode.name));
    }
    
    setCategoryTreeData(updatedTree);
    setDeletePath(null);
    notify.success('Category deleted successfully');
  };

  // Handle adding a child category
  const handleAddChild = (parentPath: string) => {
    const parent = categoryTreeData.find(n => n.path === parentPath);
    if (!parent) return;

    const newSlug = `new-category-${Date.now()}`;
    const newPath = `${parentPath}/${newSlug}`;
    
    const newCategory: CategoryNode = {
      name: 'New Category',
      slug: newSlug,
      code: newSlug,
      path: newPath,
      fullPath: `${parent.fullPath} > New Category`,
      level: parent.level + 1,
      parent: parent.name,
      imageUrl: '',
      productCount: 0,
      hasChildren: false,
      children: []
    };

    setCategoryTreeData([...categoryTreeData, newCategory]);
    notify.info('Added new child category item. Remember to click "Save All Changes".');
  };

  // Handle adding a new category at any level
  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      notify.warning('Please enter a category name');
      return;
    }

    const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let path = slug;
    let fullPath = newCategoryName;
    let parentName = '';

    if (newCategoryLevel > 1 && newCategoryParent) {
      const parent = categoryTreeData.find(n => n.path === newCategoryParent);
      if (parent) {
        path = `${parent.path}/${slug}`;
        fullPath = `${parent.fullPath} > ${newCategoryName}`;
        parentName = parent.name;
      }
    }

    const newCategory: CategoryNode = {
      name: newCategoryName,
      slug,
      code: slug,
      path,
      fullPath,
      level: newCategoryLevel,
      parent: parentName,
      imageUrl: '',
      productCount: 0,
      hasChildren: false,
      children: []
    };

    setCategoryTreeData([...categoryTreeData, newCategory]);
    setShowAddDialog(false);
    setNewCategoryName('');
    setNewCategoryLevel(1);
    setNewCategoryParent('');
    notify.success(`Category "${newCategoryName}" created`);
  };

  // Save all changes to the server
  const handleSaveChanges = async () => {
    setSaving(true);
    
    try {
      const flattenedData = categoryTreeData.map(node => {
        const { children, ...nodeWithoutChildren } = node;
        const isNodeDisabled = disabledSubcategories.has(node.path);
        return {
          ...nodeWithoutChildren,
          status: isNodeDisabled ? 0 : 1,
          disabled: isNodeDisabled
        };
      });
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      };
      
      const response = await fetch(`${API_URL}/categories/tree`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(flattenedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save categories: ${response.status} ${errorText}`);
      }

      await response.json();
      
      if (updateCategoryTree) {
        updateCategoryTree(flattenedData);
      }
      if (updateCategories) {
        await updateCategories(categories);
      }

      notify.success('Category hierarchy saved successfully!');
    } catch (error) {
      notify.error('Failed to save categories: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    updateCategories(categories).then(() => {
      notify.success('Categories saved successfully!');
    }).catch((error) => {
      notify.error('Failed to save categories: ' + error.message);
    });
  };

  const addCategory = () => {
    setCategories([...categories, 'New Category']);
  };

  const updateCategory = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const deleteCategory = (index: number) => {
    if (categories[index] === 'All Equipment') {
      notify.warning('Cannot delete "All Equipment" category');
      return;
    }
    setCategories(categories.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <FolderTree className="size-6 text-[#E31837]" />
            Categories Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {hasTreeData 
              ? `Managing ${data.categoryTree.length} hierarchical categories across ${maxLevel} levels` 
              : `Managing ${categories.length} categories`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/import-categories')}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="size-4" />
            Import CSV
          </button>
          {hasTreeData ? (
            <>
              <button
                onClick={() => setShowAddDialog(true)}
                className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-4 text-[#E31837]" />
                Add Category
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={addCategory}
                className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-4 text-[#E31837]" />
                Add Category
              </button>
              <button
                onClick={handleSave}
                className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Save className="size-4" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Category Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight">Add New Category</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Create a category node at any level in the tree</p>
              </div>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewCategoryName('');
                  setNewCategoryLevel(1);
                  setNewCategoryParent('');
                }}
                className="size-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Category Name *</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Commercial Ovens"
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Target Level *</label>
                <select
                  value={newCategoryLevel}
                  onChange={(e) => {
                    setNewCategoryLevel(Number(e.target.value));
                    setNewCategoryParent('');
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E31837]"
                >
                  <option value={1}>Level 1 (Top Root Level)</option>
                  <option value={2}>Level 2 (Subcategory)</option>
                  <option value={3}>Level 3 (Sub-subcategory)</option>
                  <option value={4}>Level 4 (Detailed Item Group)</option>
                </select>
              </div>

              {newCategoryLevel > 1 && (
                <div>
                  <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Parent Category *</label>
                  <select
                    value={newCategoryParent}
                    onChange={(e) => setNewCategoryParent(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E31837]"
                  >
                    <option value="">Select a Level {newCategoryLevel - 1} parent...</option>
                    {categoryTreeData
                      .filter(n => n.level === newCategoryLevel - 1)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(n => (
                        <option key={n.path} value={n.path}>{n.fullPath}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 bg-slate-50/50 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewCategoryName('');
                  setNewCategoryLevel(1);
                  setNewCategoryParent('');
                }}
                className="flex-1 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCategory}
                className="flex-1 h-10 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="size-4" />
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {hasTreeData ? (
        <div className="space-y-4">
          {/* Hierarchy Statistics Card */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                <div className="size-10 bg-red-50 text-[#E31837] rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                  <Hash className="size-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-[#0f172a] leading-none">{data.categoryTree.length}</p>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mt-1">Total Categories</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                {Object.entries(stats).sort(([a], [b]) => Number(a) - Number(b)).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <div className={`size-2.5 rounded-full ${
                      Number(level) === 1 ? 'bg-[#0f172a]' :
                      Number(level) === 2 ? 'bg-blue-500' :
                      Number(level) === 3 ? 'bg-purple-500' :
                      Number(level) === 4 ? 'bg-[#E31837]' : 'bg-slate-400'
                    }`} />
                    <div>
                      <p className="text-xs font-black text-[#0f172a] leading-none">{count}</p>
                      <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider mt-0.5">Level {level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tree View Card Container */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                  <Folder className="size-4.5 text-[#E31837]" />
                  Category Hierarchy Tree
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-slate-100 text-[#0f172a] border-slate-300">L1</span>
                  Level 1 (Top)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-blue-50 text-blue-700 border-blue-200">L2</span>
                  Level 2
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-purple-50 text-purple-700 border-purple-200">L3</span>
                  Level 3
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border bg-rose-50 text-[#E31837] border-rose-200">L4</span>
                  Level 4
                </span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              {/* All Equipment Root */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0f172a] text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-2xs mb-2">
                <Folder className="size-4 text-slate-300" />
                <span className="flex-1">All Equipment</span>
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {data.products.length} products
                </span>
              </div>

              {/* Category Tree */}
              <div className="space-y-0.5 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
                {categoryTree
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((rootNode) => (
                  <CategoryTreeNode 
                    key={rootNode.path} 
                    node={rootNode} 
                    level={0}
                    displayLevel={rootNode.level}
                    onUpdate={handleUpdateCategory}
                    onDelete={(path) => setDeletePath(path)}
                    onAddChild={handleAddChild}
                    expandedNodes={expandedNodes}
                    setExpandedNodes={setExpandedNodes}
                    editingNode={editingNode}
                    setEditingNode={setEditingNode}
                    disabledSubcategories={disabledSubcategories}
                    onToggleStatus={handleToggleSubcategoryStatus}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Flat List Editor (Legacy Fallback) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-sm sm:text-base font-black text-[#0f172a]">Edit Categories</h2>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={category}
                    onChange={(e) => updateCategory(index, e.target.value)}
                    disabled={category === 'All Equipment'}
                    className={`h-10 text-xs font-semibold rounded-xl ${category === 'All Equipment' ? 'bg-slate-100' : 'bg-slate-50'}`}
                    placeholder="Use ' > ' for subcategories"
                  />
                  <button
                    onClick={() => deleteCategory(index)}
                    disabled={category === 'All Equipment'}
                    className="size-10 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-sm sm:text-base font-black text-[#0f172a]">Category Preview</h2>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {categories.map((category, index) => {
                const productCount = category === 'All Equipment'
                  ? data.products.length
                  : data.products.filter(p => p.category === category || p.category?.startsWith(category + ' > ')).length;
                
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                    <span>{category}</span>
                    <span className="bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-600">
                      {productCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletePath}
        onClose={() => setDeletePath(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        description="Are you sure you want to delete this category? This will also delete all of its child subcategories from the hierarchy tree."
        confirmText="Delete Category"
      />
    </div>
  );
}

// Recursive tree component with modern admin styling
function CategoryTreeNode({ 
  node, 
  level = 0, 
  displayLevel,
  onUpdate,
  onDelete,
  onAddChild,
  expandedNodes,
  setExpandedNodes,
  editingNode,
  setEditingNode,
  disabledSubcategories,
  onToggleStatus
}: { 
  node: CategoryNode; 
  level?: number; 
  displayLevel: number;
  onUpdate: (path: string, updates: Partial<CategoryNode>) => void;
  onDelete: (path: string) => void;
  onAddChild: (parentPath: string) => void;
  expandedNodes: Set<string>;
  setExpandedNodes: (nodes: Set<string>) => void;
  editingNode: EditingCategory | null;
  setEditingNode: (node: EditingCategory | null) => void;
  disabledSubcategories?: Set<string>;
  onToggleStatus?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name || '');
  
  const hasChildren = node.children && node.children.length > 0;
  
  const levelColors: Record<number, string> = {
    1: 'bg-slate-100 text-[#0f172a] border-slate-300',
    2: 'bg-blue-50 text-blue-700 border-blue-200',
    3: 'bg-purple-50 text-purple-700 border-purple-200',
    4: 'bg-rose-50 text-[#E31837] border-rose-200',
  };
  
  const levelColor = levelColors[displayLevel] || 'bg-slate-100 text-slate-700 border-slate-300';

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== node.name) {
      onUpdate(node.path, { name: editName.trim() });
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(node.name);
    setEditing(false);
  };

  return (
    <div className="border-l border-slate-200/80 ml-2">
      <div 
        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl group transition-all"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="size-6 flex items-center justify-center hover:bg-slate-200/60 rounded-lg text-slate-500 transition-colors cursor-pointer"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />
          ) : (
            <div className="size-4" />
          )}
        </button>

        {/* Folder Icon */}
        {hasChildren ? (
          expanded ? <FolderOpen className="size-4 text-[#0f172a]" /> : <Folder className="size-4 text-[#0f172a]" />
        ) : (
          <Hash className="size-3.5 text-slate-400" />
        )}

        {/* Level Badge */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${levelColor}`}>
          L{displayLevel}
        </span>

        {/* Category Name */}
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 flex-1 text-xs font-semibold bg-white border-slate-300 rounded-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveEdit}
              className="size-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="font-extrabold text-xs sm:text-sm text-[#0f172a] flex-1">{node.name}</span>
            
            {/* Status Pill Badge (L1 only) */}
            {displayLevel === 1 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                node.enabled !== false 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {node.enabled !== false ? 'Visible' : 'Hidden'}
              </span>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {displayLevel === 1 && (
                <button
                  onClick={() => onUpdate(node.path, { enabled: node.enabled === false })}
                  className="size-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                  title={node.enabled !== false ? "Hide from navigation" : "Show in navigation"}
                >
                  {node.enabled !== false ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 text-slate-400" />}
                </button>
              )}
              
              <button
                onClick={() => setEditing(true)}
                className="size-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                title="Edit category"
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                onClick={() => onAddChild(node.path)}
                className="size-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-emerald-600 cursor-pointer"
                title="Add child category"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                onClick={() => onDelete(node.path)}
                className="size-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] cursor-pointer"
                title="Delete category"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Product Count Badge */}
        {node.productCount > 0 && (
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {node.productCount} products
          </span>
        )}
        
        {/* Children Count */}
        {hasChildren && (
          <span className="text-xs font-semibold text-slate-400">
            ({node.children.length})
          </span>
        )}
      </div>

      {/* Render Children */}
      {expanded && hasChildren && (
        <div className="ml-2">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              displayLevel={child.level}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
              editingNode={editingNode}
              setEditingNode={setEditingNode}
              disabledSubcategories={disabledSubcategories}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}