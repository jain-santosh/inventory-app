import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    addDoc, 
    deleteDoc, 
    collection, 
    onSnapshot,
    query,
    getDocs,
    setLogLevel
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBy63f-nQa9PaYc_9gWSCH5wf7NhlgZbvk",
  authDomain: "jewellery-inventory-app.firebaseapp.com",
  projectId: "jewellery-inventory-app",
  storageBucket: "jewellery-inventory-app.firebasestorage.app",
  messagingSenderId: "803305655750",
  appId: "1:803305655750:web:a84ef0a031fe3e99fb76c7",
  measurementId: "G-XV6Z1JFT07"
};

const appId = firebaseConfig.projectId || 'default-app-id';

let db;
let auth;
let storage;

// Initialize Firebase
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app); 
    setLogLevel('Debug');
} catch (e) {
    console.error("Error initializing Firebase:", e);
}

// --- SVG Icons ---

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconPencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconSave = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconCamera = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconReport = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconList = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);


// --- Default Data Constants ---
const DEFAULT_CATEGORIES = ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Pendant', 'Bangle'];
const METAL_TYPES = ['Gold', 'Platinum', 'Silver', 'White Gold'];
const METAL_PURITIES = {
    'Gold': ['24k', '22k', '18k', '14k'],
    'Platinum': ['Pt 950', 'Pt 900'],
    'Silver': ['925 Sterling'],
    'White Gold': ['18k', '14k']
};
const STONE_TYPES = ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Other'];
const STONE_CUTS = ['Round', 'Princess', 'Emerald', 'Oval', 'Marquise', 'Pear', 'Other'];
const STONE_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'Other'];
const STONE_CLARITIES = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'Other'];
const STATUS_OPTIONS = ['In Stock', 'Sold', 'Reserved', 'In Repair'];

// --- Utility Functions ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- React Components ---

/**
 * Main Application Component
 */
export default function App() {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // App State
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredInventory, setFilteredInventory] = useState([]);
    
    // Navigation State
    const [activeTab, setActiveTab] = useState('inventory'); 

    // Firestore paths
    const inventoryCollectionPath = `artifacts/${appId}/users/${userId}/inventory`;
    const publicDataPath = `artifacts/${appId}/public/data`;

    // --- Authentication ---
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthReady(true);
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (e) {
                    console.error("Auth Error:", e);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;

        // Fetch Categories
        const categoriesCollectionPath = `${publicDataPath}/categories`;
        const categoriesQuery = query(collection(db, categoriesCollectionPath));

        const unsubscribeCategories = onSnapshot(categoriesQuery, async (snapshot) => {
            let fetchedCategories = snapshot.docs.map(doc => doc.data().name);
            let newCategories = [...fetchedCategories];
            let defaultsToAdd = [];

            DEFAULT_CATEGORIES.forEach(defaultCat => {
                if (!fetchedCategories.includes(defaultCat)) {
                    newCategories.push(defaultCat);
                    defaultsToAdd.push(defaultCat);
                }
            });

            setCategories(newCategories.sort());

            for (const catName of defaultsToAdd) {
                try {
                    await setDoc(doc(db, categoriesCollectionPath, catName), { name: catName });
                } catch (e) {
                    console.error("Error adding default category:", e);
                }
            }
        }, (error) => {
            console.error("Error fetching categories:", error);
            setCategories(DEFAULT_CATEGORIES);
        });

        // Fetch Inventory
        const inventoryQuery = query(collection(db, inventoryCollectionPath));
        setIsLoading(true);

        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                ...doc.data(), // Spread data first (to avoid null 'id' field from db overwriting real ID)
                id: doc.id     // Ensure real ID takes precedence
            }));
            setInventory(items);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching inventory:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeCategories();
            unsubscribeInventory();
        };

    }, [isAuthReady, userId, inventoryCollectionPath, publicDataPath]);

    // --- Search & Filtering ---
    useEffect(() => {
        const debouncedFilter = debounce(() => {
            if (!searchTerm) {
                setFilteredInventory(inventory);
                return;
            }
            
            const lowerCaseSearch = searchTerm.toLowerCase();
            const filtered = inventory.filter(item => 
                (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
                (item.sku && item.sku.toLowerCase().includes(lowerCaseSearch)) ||
                (item.huid && item.huid.toLowerCase().includes(lowerCaseSearch)) ||
                (item.category && item.category.toLowerCase().includes(lowerCaseSearch))
            );
            setFilteredInventory(filtered);
        }, 300);

        debouncedFilter();
    }, [searchTerm, inventory]);
    
    // --- CRUD Handlers ---

    const handleFormSave = async (itemData) => {
        if (!userId) return;

        try {
            // Destructure 'id' out of the data so we don't save it as a field in the doc
            // This keeps the DB clean and prevents the 'id: null' bug
            const { id, ...dataToSave } = itemData;

            if (id) {
                const itemRef = doc(db, inventoryCollectionPath, id);
                await setDoc(itemRef, dataToSave);
            } else {
                await addDoc(collection(db, inventoryCollectionPath), dataToSave);
            }
            closeForm();
        } catch (e) {
            console.error("Error saving item:", e);
        }
    };

    const handleDelete = async (itemId) => {
        if (!userId || !itemId) return;
        if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, inventoryCollectionPath, itemId));
            } catch (e) {
                console.error("Error deleting item:", e);
                alert("Failed to delete item: " + e.message);
            }
        }
    };

    const openForm = (item = null) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingItem(null);
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-4">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Jewellery Inventory
                        </h1>
                        
                        {/* Navigation Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'inventory' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <IconList /> Manage Items
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'report' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <IconReport /> Stock Report
                            </button>
                        </div>

                        {activeTab === 'inventory' && (
                            <button
                                onClick={() => openForm(null)}
                                disabled={!isAuthReady} 
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
                            >
                                <IconPlus />
                                <span>Add Item</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-8 pb-16">
                
                {/* Search Bar (Shared) */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by SKU, Name, HUID, or Category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Content Views */}
                {!isAuthReady || (isLoading && inventory.length === 0) ? (
                    <LoadingSpinner message={!isAuthReady ? "Authenticating..." : "Loading..."} />
                ) : activeTab === 'inventory' ? (
                    <InventoryList
                        items={filteredInventory}
                        onEdit={openForm}
                        onDelete={handleDelete}
                    />
                ) : (
                    <StockReport items={filteredInventory} />
                )}
            </main>

            {/* Item Form Modal */}
            {showForm && (
                <ItemForm
                    // Key ensures component re-mounts when switching between Add (null) and Edit (item.id)
                    // This fixes the issue of state not resetting
                    key={editingItem ? editingItem.id : 'new-item'}
                    item={editingItem}
                    categories={categories}
                    onSave={handleFormSave}
                    onClose={closeForm}
                    userId={userId}
                    appId={appId}
                />
            )}
        </div>
    );
}

/**
 * New Module: Stock Report & Details View
 */
function StockReport({ items }) {
    const stats = useMemo(() => {
        const result = {
            totalItems: items.length,
            metals: {} 
        };

        items.forEach(item => {
            if (item.status !== 'Sold') {
                if (item.metals) {
                    item.metals.forEach(m => {
                        if (!result.metals[m.type]) {
                            result.metals[m.type] = { gross: 0, net: 0, count: 0 };
                        }
                        result.metals[m.type].gross += parseFloat(m.grossWeight || 0);
                        result.metals[m.type].net += parseFloat(m.netWeight || 0);
                        result.metals[m.type].count += 1;
                    });
                }
            }
        });
        return result;
    }, [items]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm font-medium text-gray-500">Total In-Stock Items</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalItems}</div>
                </div>

                {Object.entries(stats.metals).map(([type, data]) => (
                    <div key={type} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-sm font-medium text-gray-500">Total {type} Stock</div>
                        <div className="mt-2 flex justify-between items-baseline">
                            <div>
                                <span className="text-2xl font-bold text-gray-900">{data.net.toFixed(2)}</span>
                                <span className="ml-1 text-sm text-gray-500">g Net</span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {data.gross.toFixed(2)}g Gross
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Detailed Stock List</h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {items.length} Records
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / HUID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metal & Purity</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Gross Wt (g)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">Net Wt (g)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {items.map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-600">
                                        <div>{item.sku}</div>
                                        {item.huid && <div className="text-xs text-gray-400">{item.huid}</div>}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.category}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {item.metals && item.metals.map((m, i) => (
                                            <div key={i}>{m.type} <span className="text-xs bg-gray-200 px-1 rounded">{m.purity}</span></div>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600 bg-gray-50/50">
                                        {item.metals && item.metals.reduce((sum, m) => sum + parseFloat(m.grossWeight||0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30">
                                        {item.metals && item.metals.reduce((sum, m) => sum + parseFloat(m.netWeight||0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            item.status === 'Sold' ? 'bg-red-100 text-red-800' :
                                            item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner({ message }) {
    return (
        <div className="flex flex-col items-center justify-center p-16 text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="mt-4 text-lg">{message}</span>
        </div>
    );
}

/**
 * Inventory List Table Component
 */
function InventoryList({ items, onEdit, onDelete }) {
    if (items.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-lg shadow text-gray-500">
                <h3 className="text-xl font-medium">No inventory items found.</h3>
                <p className="mt-2">Click "Add Item" to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / HUID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-16 w-16">
                                            <img 
                                                className="h-16 w-16 rounded-lg object-cover bg-gray-100" 
                                                src={item.imageUrl || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} 
                                                alt={item.name} 
                                                onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'; }}
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500">{item.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">SKU: {item.sku}</div>
                                    <div className="text-sm text-gray-500">HUID: {item.huid}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.metals && item.metals.length > 0 && (
                                        <div>{item.metals[0].grossWeight}g {item.metals[0].purity} {item.metals[0].type}</div>
                                    )}
                                    {item.stones && item.stones.length > 0 && (
                                        <div>{item.stones.length} stone{item.stones.length > 1 ? 's' : ''} (incl. {item.stones[0].carat}ct {item.stones[0].type})</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        item.status === 'Sold' ? 'bg-red-100 text-red-800' :
                                        item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4 transition duration-150 p-2 rounded-full hover:bg-blue-50">
                                        <IconPencil />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => onDelete(item.id)} 
                                        className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-50"
                                    >
                                        <IconTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Item Add/Edit Form Component (Modal)
 */
function ItemForm({ item, categories, onSave, onClose, userId, appId }) { 
    
    // Standardize default state for easy reset
    const defaultState = {
        id: null,
        name: '',
        sku: '',
        huid: '',
        category: categories[0] || '',
        status: STATUS_OPTIONS[0],
        imageUrl: '',
        metals: [{ type: METAL_TYPES[0], purity: METAL_PURITIES['Gold'][0], netWeight: '', grossWeight: '' }],
        stones: []
    };

    // Initialize state with existing item OR defaults
    const [formData, setFormData] = useState(defaultState);

    // Sync state with props: Ensures form data updates if the item prop changes
    useEffect(() => {
        if (item) {
            setFormData({
                ...defaultState,
                ...item,
                id: item.id // Explicitly ensure ID is synced
            });
        } else {
            setFormData(defaultState);
        }
    }, [item]);

    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
    const [errorMessage, setErrorMessage] = useState(""); 

    // Re-sync image preview when item changes
    useEffect(() => {
        setImagePreview(item?.imageUrl || null);
        setImageFile(null);
    }, [item]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setFormData(prev => ({ ...prev, imageUrl: '' }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'imageUrl') {
            setImagePreview(value);
            setImageFile(null);
        }
    };

    // --- Metal Sub-form Handlers ---
    const handleMetalChange = (index, e) => {
        const { name, value } = e.target;
        const newMetals = [...formData.metals];
        newMetals[index] = { ...newMetals[index], [name]: value };

        if (name === 'type') {
            newMetals[index].purity = METAL_PURITIES[value]?.[0] || '';
        }
        
        setFormData(prev => ({ ...prev, metals: newMetals }));
    };

    const addMetal = () => {
        setFormData(prev => ({
            ...prev,
            metals: [...prev.metals, { type: METAL_TYPES[0], purity: METAL_PURITIES['Gold'][0], netWeight: '', grossWeight: '' }]
        }));
    };

    const removeMetal = (index) => {
        setFormData(prev => ({
            ...prev,
            metals: prev.metals.filter((_, i) => i !== index)
        }));
    };

    // --- Stone Sub-form Handlers ---
    const handleStoneChange = (index, e) => {
        const { name, value } = e.target;
        const newStones = [...formData.stones];
        newStones[index] = { ...newStones[index], [name]: value };
        setFormData(prev => ({ ...prev, stones: newStones }));
    };

    const addStone = () => {
        setFormData(prev => ({
            ...prev,
            stones: [...prev.stones, { type: STONE_TYPES[0], carat: '', cut: STONE_CUTS[0], color: STONE_COLORS[0], clarity: STONE_CLARITIES[0] }]
        }));
    };

    const removeStone = (index) => {
        setFormData(prev => ({
            ...prev,
            stones: prev.stones.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        
        if (!formData.name || !formData.sku || !formData.category) {
            setErrorMessage("Please fill in all required fields (Name, SKU, Category).");
            return;
        }

        setIsUploading(true);
        let finalItemData = { ...formData };

        if (imageFile) {
            try {
                if (!userId || !appId || !storage) {
                    throw new Error("Auth or storage not ready");
                }
                const storagePath = `artifacts/${appId}/users/${userId}/inventory_images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, imageFile);
                const downloadURL = await getDownloadURL(storageRef);
                finalItemData.imageUrl = downloadURL;
            } catch (e) {
                console.error("Error uploading image:", e);
                setErrorMessage(`Image upload failed: ${e.message}`);
                setIsUploading(false);
                return;
            }
        }
        
        try {
            await onSave(finalItemData); 
        } catch (e) {
            console.error("Error saving item:", e);
            setErrorMessage(`Failed to save item: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 pb-16 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-semibold">
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <IconClose />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    
                    {/* --- Section 1: Basic Info --- */}
                    <div className="border-b pb-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput name="name" label="Item Name" value={formData.name} onChange={handleInputChange} required />
                            <FormInput name="sku" label="SKU (Stock Keeping Unit)" value={formData.sku} onChange={handleInputChange} required />
                            <FormInput name="huid" label="HUID (Hallmark Unique ID)" value={formData.huid} onChange={handleInputChange} />
                            
                            <FormSelect name="category" label="Category" value={formData.category} onChange={handleInputChange} options={categories} required />
                            <FormSelect name="status" label="Status" value={formData.status} onChange={handleInputChange} options={STATUS_OPTIONS} required />

                            {/* --- New Image Upload Section --- */}
                            <div className="sm:col-span-2 space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Image
                                </label>
                                <div className="flex items-center gap-4">
                                    <img 
                                        className="h-20 w-20 rounded-lg object-cover bg-gray-100 border" 
                                        src={imagePreview || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} 
                                        alt="Preview" 
                                        onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'; }}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 cursor-pointer"
                                        >
                                            <IconCamera />
                                            <span>Capture / Upload</span>
                                            <input
                                                id="image-upload"
                                                name="image-upload"
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="sr-only"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                        <FormInput name="imageUrl" label="Or paste Image URL" value={formData.imageUrl} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Section 2: Metals --- */}
                    <div className="border-b pb-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Metal Details</h3>
                            <button
                                type="button"
                                onClick={addMetal}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                            >
                                <IconPlus /> Add Metal
                            </button>
                        </div>

                        {formData.metals.map((metal, index) => (
                            <div key={index} className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 border rounded-lg">
                                <FormSelect name="type" label="Metal Type" value={metal.type} onChange={(e) => handleMetalChange(index, e)} options={METAL_TYPES} />
                                <FormSelect name="purity" label="Purity" value={metal.purity} onChange={(e) => handleMetalChange(index, e)} options={METAL_PURITIES[metal.type] || []} />
                                <FormInput name="netWeight" label="Net Wt. (g)" type="number" value={metal.netWeight} onChange={(e) => handleMetalChange(index, e)} />
                                <FormInput name="grossWeight" label="Gross Wt. (g)" type="number" value={metal.grossWeight} onChange={(e) => handleMetalChange(index, e)} />
                                <button
                                    type="button"
                                    onClick={() => removeMetal(index)}
                                    className="text-red-600 hover:text-red-800 self-end mb-2 disabled:opacity-50"
                                    disabled={formData.metals.length <= 1}
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* --- Section 3: Stones --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Stone Details</h3>
                            <button
                                type="button"
                                onClick={addStone}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                            >
                                <IconPlus /> Add Stone
                            </button>
                        </div>

                        {formData.stones.map((stone, index) => (
                            <div key={index} className="grid grid-cols-2 sm:grid-cols-6 gap-4 p-4 border rounded-lg">
                                <FormSelect name="type" label="Stone Type" value={stone.type} onChange={(e) => handleStoneChange(index, e)} options={STONE_TYPES} />
                                <FormInput name="carat" label="Carat" type="number" value={stone.carat} onChange={(e) => handleStoneChange(index, e)} />
                                <FormSelect name="cut" label="Cut" value={stone.cut} onChange={(e) => handleStoneChange(index, e)} options={STONE_CUTS} />
                                <FormSelect name="color" label="Color" value={stone.color} onChange={(e) => handleStoneChange(index, e)} options={STONE_COLORS} />
                                <FormSelect name="clarity" label="Clarity" value={stone.clarity} onChange={(e) => handleStoneChange(index, e)} options={STONE_CLARITIES} />
                                <button
                                    type="button"
                                    onClick={() => removeStone(index)}
                                    className="text-red-600 hover:text-red-800 self-end mb-2"
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* --- Error Message Display --- */}
                    {errorMessage && (
                        <div className="text-center p-3 bg-red-100 text-red-700 rounded-lg">
                            {errorMessage}
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex justify-end items-center gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <IconSave />
                            )}
                            <span>{isUploading ? 'Saving...' : 'Save Item'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Reusable Form Components ---

function FormInput({ label, name, value, onChange, type = 'text', required = false }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                required={required}
                step={type === 'number' ? '0.01' : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function FormSelect({ label, name, value, onChange, options, required = false }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}