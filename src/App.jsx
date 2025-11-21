import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword, // NEW
    signInWithEmailAndPassword       // NEW
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
    getDoc
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

if (Object.keys(firebaseConfig).length === 0) {
    Object.assign(firebaseConfig, {
      apiKey: "AIzaSyBy63f-nQa9PaYc_9gWSCH5wf7NhlgZbvk",
      authDomain: "jewellery-inventory-app.firebaseapp.com",
      projectId: "jewellery-inventory-app",
      storageBucket: "jewellery-inventory-app.firebasestorage.app",
      messagingSenderId: "803305655750",
      appId: "1:803305655750:web:a84ef0a031fe3e99fb76c7",
      measurementId: "G-XV6Z1JFT07"
    });
}

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
} catch (e) {
    console.error("Error initializing Firebase:", e);
}

// --- SVG Icons ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconPencil = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IconSave = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconCamera = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconReport = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconList = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconTruck = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10v1a2 2 0 002 2h2m-2-4h.808c.227 0 .393.185.393.411 0 .227-.166.411-.393.411H14m-5 4v-4m-8-12h17.172a2 2 0 011.414.586l3.364 3.364A2 2 0 0121 11.414V15a1 1 0 01-1 1h-1M5 16h10V8H5v8z" /></svg>;
const IconHamburger = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconSale = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-3m0-4V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>; // NEW

// --- Constants ---
const DEFAULT_CATEGORIES = ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Pendant', 'Bangle'];
const DEFAULT_METALS = {
    'Gold': ['24k', '22k', '18k', '14k'],
    'Platinum': ['Pt 950', 'Pt 900'],
    'Silver': ['925 Sterling'],
    'White Gold': ['18k', '14k']
};
const DEFAULT_METAL_CATEGORY_MAP = {
    'Gold': ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Pendant', 'Bangle'],
    'Platinum': ['Ring', 'Necklace', 'Earrings'],
    'Silver': ['Ring', 'Pendant', 'Earrings'],
    'White Gold': ['Ring', 'Necklace', 'Bracelet']
};

const DEFAULT_METAL_RATES = { 'Gold': 65.00, 'Platinum': 35.00, 'Silver': 0.80, 'White Gold': 60.00 };
// START CODE MERGE - STEP 1 (Default value for making charges per metal)
const DEFAULT_MAKING_CHARGES_PER_METAL = { 
    'Gold': 200, 
    'Silver': 20, 
    'Platinum': 300, 
    "White Gold": 220 
};
// END CODE MERGE

const DEFAULT_TAX_RATE = 5; 
const STONE_TYPES = ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Other'];
const STONE_CUTS = ['Round', 'Princess', 'Emerald', 'Oval', 'Marquise', 'Pear', 'Other'];
const STONE_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'Other'];
const STONE_CLARITIES = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'Other'];
const STATUS_OPTIONS = ['In Stock', 'Sold', 'Reserved', 'In Repair'];
const ROLES = { ADMIN: 'Admin', MANAGER: 'Manager', STAFF: 'Staff' };

// --- Utility Functions ---
// START CODE MERGE - STEP 6 (Update Price Calculation)
function calculateBaseValue(item, metalRates, makingChargesPerMetal) {
    let baseValue = 0;
    let totalMakingCharges = 0; // Initialize total making charges
    
    if (item && item.metals && metalRates) {
        item.metals.forEach(metal => {
            const netWeight = parseFloat(metal.netWeight || 0);
            const rate = parseFloat(metalRates[metal.type] || 0);
            baseValue += netWeight * rate;
            
            // Apply metal-wise making charge
            const mcPerMetal = parseFloat(makingChargesPerMetal[metal.type] || 0);
            totalMakingCharges += (netWeight * mcPerMetal) || 0;
        });
    }

    // baseValue now includes metal cost + metal-wise making charges
    baseValue += totalMakingCharges;
    
    // Add flat making charges and stone value (if they exist outside the metal-wise model)
    baseValue += parseFloat(item.stoneValue || 0);
    return baseValue;
}
// END CODE MERGE

// --- Reusable Components ---
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

function FormInput({ label, name, value, onChange, type = 'text', required = false, step }) {
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
                step={step || (type === 'number' ? '0.01' : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function FormSelect({ label, name, value, onChange, options, required = false, children }) {
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
                {children} 
                
                {!children && options && options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

function PriceRow({ label, value, isFinal = false, isBase = false }) {
    return (
        <div className={`flex justify-between ${isFinal ? 'text-lg font-bold text-blue-900 border-t pt-2 mt-2 border-blue-300' : isBase ? 'text-gray-500' : 'text-gray-800'}`}>
            <span>{label}</span>
            <span className="font-mono">{value.toFixed(2)}</span>
        </div>
    );
}

// --- Login View Component (NEW) ---

function LoginView({ onAuthSuccess }) {
    // ... (LoginView component remains unchanged)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // onAuthStateChanged handler in App.js will take over
        } catch (e) {
            console.error("Auth Failed:", e);
            const msg = e.code.includes('email-already-in-use') ? 'Email already registered. Try logging in.' :
                         e.code.includes('wrong-password') ? 'Invalid credentials.' :
                         e.code.includes('user-not-found') ? 'User not found. Try signing up.' :
                         'Authentication failed. Check your network or credentials.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 sm:p-8 space-y-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    {isLoginMode ? 'Welcome to GemVault' : 'Create Account'}
                </h2>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput 
                        name="email" 
                        label="Email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <FormInput 
                        name="password" 
                        label="Password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-150 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        type="button" 
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                    >
                        {isLoginMode ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}


// --- Main Application Component ---
const App = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'Admin', 'Manager', 'Staff'
    const [isLoggedIn, setIsLoggedIn] = useState(false); // NEW: Track if user is authenticated/logged in
    
    // App State
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [metalConfig, setMetalConfig] = useState(DEFAULT_METALS); 
    const [metalCategoryMap, setMetalCategoryMap] = useState(DEFAULT_METAL_CATEGORY_MAP);
    const [metalRates, setMetalRates] = useState(DEFAULT_METAL_RATES);
    const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
    // START CODE MERGE - STEP 2 (Add makingChargesPerMetal State Variable)
    const [makingChargesPerMetal, setMakingChargesPerMetal] = useState({});
    // END CODE MERGE
    
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // New: Filter States
    const [categoryFilter, setCategoryFilter] = useState('');
    const [metalFilter, setMetalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('In Stock'); // Default to In Stock for easy view

    // Navigation State
    const [activeTab, setActiveTab] = useState('inventory'); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar

    const sidebarRef = useRef(null); // Ref for sidebar for click outside
    
    // Firestore paths
    const inventoryCollectionPath = `artifacts/${appId}/public/data/inventory`;
    const publicDataPath = `artifacts/${appId}/public/data`;
    const usersCollectionPath = `artifacts/${appId}/public/data/users`;
    const suppliersCollectionPath = `${publicDataPath}/suppliers`;
    const purchaseOrdersCollectionPath = `${publicDataPath}/purchase_orders`;

    // --- Authentication & Role Assignment ---
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !user.isAnonymous) { // NEW: Only process if a *logged-in* user exists
                setUserId(user.uid);
                setIsLoggedIn(true);
                await checkAndAssignRole(user.uid, user.email); // Pass email for new users
                setIsAuthReady(true);
            } else {
                // Not logged in (or is an anonymous user from an old session)
                setUserId(null);
                setUserRole(null);
                setIsLoggedIn(false);
                setIsAuthReady(true); // Allow UI to render LoginView
            }
        });

        return () => unsubscribe();
    }, []);

    const checkAndAssignRole = async (uid, email) => { // Updated to accept email
        if (!db) return;
        const userRef = doc(db, usersCollectionPath, uid);
        
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserRole(userSnap.data().role);
            } else {
                const usersQuery = query(collection(db, usersCollectionPath));
                const allUsersSnap = await getDocs(usersQuery);
                
                let newRole = ROLES.STAFF; 
                if (allUsersSnap.empty) {
                    newRole = ROLES.ADMIN;
                }

                await setDoc(userRef, {
                    uid: uid,
                    email: email, // Store email
                    role: newRole,
                    joinedAt: new Date().toISOString(),
                    name: email ? email.split('@')[0] : `User ${uid.substring(0, 5)}` 
                });
                setUserRole(newRole);
            }
        } catch (e) {
            console.error("Error assigning role:", e);
            setUserRole(ROLES.STAFF);
        }
    };
    
    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            // State will be cleared by onAuthStateChanged listener
            setActiveTab('inventory');
        } catch (e) {
            console.error("Logout failed:", e);
            alert("Failed to log out.");
        }
    };


    // --- Data Fetching ---
    useEffect(() => {
        if (!isAuthReady || !userId || !db || !isLoggedIn) return; // Wait for successful login

        // 1. Fetch Categories
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

        // 2. Fetch Metal Settings
        const metalsDocRef = doc(db, `${publicDataPath}/settings`, 'metals');
        const unsubscribeMetals = onSnapshot(metalsDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                setMetalConfig(docSnapshot.data());
            } else {
                try {
                     await setDoc(metalsDocRef, DEFAULT_METALS);
                } catch (e) {}
                setMetalConfig(DEFAULT_METALS);
            }
        }, (error) => {});
        
        // 3. Fetch Metal Category Mapping
        const mapDocRef = doc(db, `${publicDataPath}/settings`, 'metalCategoryMap');
        const unsubscribeMap = onSnapshot(mapDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                setMetalCategoryMap(docSnapshot.data());
            } else {
                try {
                     await setDoc(mapDocRef, DEFAULT_METAL_CATEGORY_MAP);
                } catch (e) {}
                setMetalCategoryMap(DEFAULT_METAL_CATEGORY_MAP);
            }
        }, (error) => {});

        // 4. Fetch Global Rates and Tax
        const ratesDocRef = doc(db, `${publicDataPath}/settings`, 'globalRates');
        const unsubscribeRates = onSnapshot(ratesDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setMetalRates(data.metalRates || DEFAULT_METAL_RATES);
                setTaxRate(data.taxRate || DEFAULT_TAX_RATE);
                // START CODE MERGE - STEP 3 (Fetch makingChargesPerMetal from Firestore)
                setMakingChargesPerMetal(data.makingChargesPerMetal || DEFAULT_MAKING_CHARGES_PER_METAL);
                // END CODE MERGE
            } else {
                 try {
                     // START CODE MERGE - STEP 1 (Update default structure on creation)
                     await setDoc(ratesDocRef, { 
                         metalRates: DEFAULT_METAL_RATES, 
                         taxRate: DEFAULT_TAX_RATE,
                         makingChargesPerMetal: DEFAULT_MAKING_CHARGES_PER_METAL 
                     });
                     // END CODE MERGE
                } catch (e) {}
                setMetalRates(DEFAULT_METAL_RATES);
                setTaxRate(DEFAULT_TAX_RATE);
                setMakingChargesPerMetal(DEFAULT_MAKING_CHARGES_PER_METAL);
            }
        }, (error) => {});


        // 5. Fetch Inventory
        const inventoryQuery = query(collection(db, inventoryCollectionPath));
        setIsLoading(true);

        const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setInventory(items);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching inventory:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribeCategories();
            unsubscribeMetals();
            unsubscribeMap(); 
            unsubscribeRates();
            unsubscribeInventory();
        };

    }, [isAuthReady, userId, inventoryCollectionPath, publicDataPath, isLoggedIn]);

    // --- Search & Filtering Logic (omitted for brevity, maintained in file structure) ---
    const filteredInventory = useMemo(() => {
        let items = inventory;
        
        // 1. Apply Search Term (SKU, Name, HUID, Category)
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            items = items.filter(item => 
                (item.name && item.name.toLowerCase().includes(lowerCaseSearch)) ||
                (item.sku && item.sku.toLowerCase().includes(lowerCaseSearch)) ||
                (item.huid && item.huid.toLowerCase().includes(lowerCaseSearch)) ||
                (item.category && item.category.toLowerCase().includes(lowerCaseSearch))
            );
        }

        // 2. Apply Status Filter (Only in Manage Tab)
        if (activeTab === 'inventory' && statusFilter) {
            items = items.filter(item => item.status === statusFilter);
        }

        // 3. Apply Category Filter
        if (categoryFilter) {
            items = items.filter(item => item.category === categoryFilter);
        }

        // 4. Apply Metal Filter (checks first metal type)
        if (metalFilter) {
            items = items.filter(item => 
                item.metals && item.metals.length > 0 && item.metals[0].type === metalFilter
            );
        }
        
        return items;
    }, [inventory, searchTerm, statusFilter, categoryFilter, metalFilter, activeTab]);
    
    // --- CRUD Handlers (omitted for brevity, maintained in file structure) ---

    const handleFormSave = async (itemData) => {
        if (!userId) return;

        try {
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
        if (userRole === ROLES.STAFF) {
            alert("Access Denied: Staff cannot delete items.");
            return;
        }

        if (!userId || !itemId) return;
        // NOTE: window.confirm is used here, which should be replaced by a custom modal in a full production app.
        if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, inventoryCollectionPath, itemId));
            } catch (e) {
                console.error("Error deleting item:", e);
                alert("Failed to delete item: " + e.message);
            }
        }
    };

    const handleSaleComplete = async (itemId, finalPrice, discount, tax) => {
        if (!userId || !itemId) return;
        
        try {
            // 1. Update Inventory Status to Sold
            await setDoc(doc(db, inventoryCollectionPath, itemId), { 
                status: 'Sold',
                saleDate: new Date().toISOString(),
                finalPrice: finalPrice,
                discount: discount,
                tax: tax
            }, { merge: true });

            // 2. Optional: Log Sale to a separate sales collection for reports (Future Module)
            console.log(`Sale recorded for item ${itemId} at ${finalPrice}`);

            alert(`Sale completed! Final Price: $${finalPrice.toFixed(2)}`);
            setActiveTab('inventory'); // Go back to inventory view
        } catch (e) {
            console.error("Error completing sale:", e);
            alert("Failed to complete sale: " + e.message);
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setIsSidebarOpen(false); // Close sidebar on tab click
    };

    // Close sidebar if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is on the button itself to prevent double closing
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen && !event.target.closest('button')) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    // --- Render ---

    const metalOptions = Object.keys(metalConfig);
    const statusOptions = STATUS_OPTIONS;

    // Show login screen if not authenticated
    if (isAuthReady && !isLoggedIn) {
        return <LoginView />;
    }

    if (!isAuthReady || isLoading) {
        return <LoadingSpinner message={!isAuthReady ? "Initializing Authentication..." : "Loading Inventory Data..."} />;
    }


    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800 pb-20">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="flex justify-between items-center h-16">
                        {/* Hamburger Icon for Mobile & Branding */}
                        <div className="flex items-center gap-3">
                            <button onClick={toggleSidebar} className="sm:hidden p-2 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-md">
                                <IconHamburger />
                            </button>
                            
                            {/* Logo and Name (Desktop & Mobile) */}
                            <img 
                                src="/assets/logo.png" 
                                alt="GemVault Logo" 
                                className="h-8 sm:h-10 w-auto" 
                                onError={(e) => { e.target.style.display = 'none'; e.target.onerror = null; }} 
                            />
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                GemVault
                            </h1>
                            {userRole && (
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                    userRole === ROLES.ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                    userRole === ROLES.MANAGER ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {userRole}
                                </span>
                            )}
                        </div>
                        
                        {/* Desktop Navigation Tabs */}
                        <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => handleTabClick('inventory')}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                    activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <IconList /> Manage
                            </button>
                            <button
                                onClick={() => handleTabClick('report')}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                    activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <IconReport /> Reports
                            </button>
                             <button
                                onClick={() => handleTabClick('sales')}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                    activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <IconSale /> POS
                            </button>

                            {(userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) && (
                                <button
                                    onClick={() => handleTabClick('suppliers')}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                        activeTab === 'suppliers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <IconTruck /> Suppliers
                                </button>
                            )}
                            
                            {(userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) && (
                                <button
                                    onClick={() => handleTabClick('settings')}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                        activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <IconSettings /> Settings
                            </button>
                            )}
                            
                            {userRole === ROLES.ADMIN && (
                                <button
                                    onClick={() => handleTabClick('users')}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                        activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <IconUsers /> Users
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab === 'inventory' && (
                                <button
                                    onClick={() => openForm(null)}
                                    className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 text-sm"
                                >
                                    <IconPlus />
                                    <span>Add Item</span>
                                </button>
                            )}
                            <button 
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg shadow-sm hover:bg-red-100 transition duration-150"
                            >
                                <IconLogOut />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            <div 
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 w-64 bg-white z-40 shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out sm:hidden`}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    {/* Brand Name in Sidebar */}
                    <div className="flex items-center gap-3">
                        <img 
                            src="/assets/logo.png" 
                            alt="GemVault Logo" 
                            className="h-8 w-auto" 
                            onError={(e) => { e.target.style.display = 'none'; e.target.onerror = null; }} 
                        />
                        <h2 className="text-xl font-semibold text-gray-900">GemVault</h2>
                    </div>
                    <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900 p-2">
                        <IconClose />
                    </button>
                </div>
                <nav className="flex flex-col p-4 space-y-2">
                    <button
                        onClick={() => handleTabClick('inventory')}
                        className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                            activeTab === 'inventory' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <IconList /> Manage Inventory
                    </button>
                    <button
                        onClick={() => handleTabClick('report')}
                        className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                            activeTab === 'report' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <IconReport /> Reports
                    </button>
                    <button
                        onClick={() => handleTabClick('sales')}
                        className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                            activeTab === 'sales' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <IconSale /> POS
                    </button>
                    {(userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) && (
                        <button
                            onClick={() => handleTabClick('suppliers')}
                            className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                                activeTab === 'suppliers' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <IconTruck /> Suppliers
                        </button>
                    )}
                    {(userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) && (
                        <button
                            onClick={() => handleTabClick('settings')}
                            className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                                activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <IconSettings /> Settings
                        </button>
                    )}
                    {userRole === ROLES.ADMIN && (
                        <button
                            onClick={() => handleTabClick('users')}
                            className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-md transition-colors ${
                                activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <IconUsers /> Users
                        </button>
                    )}
                </nav>
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                    User: {userId ? userId.substring(0, 8) : '...'}
                    <p className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border mt-1 w-fit ${
                        userRole === ROLES.ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        userRole === ROLES.MANAGER ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        Role: {userRole}
                    </p>
                </div>
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden" onClick={toggleSidebar}></div>}


            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-4 sm:mt-8">
                
                {(activeTab === 'inventory' || activeTab === 'report' || activeTab === 'sales') && (
                    <div className="mb-4 sm:mb-6">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                    </div>
                )}
                
                {/* NEW: Inventory Filters (Shown only on Inventory tab) */}
                {activeTab === 'inventory' && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Filter Stock</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormSelect 
                                label="Status"
                                name="statusFilter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={['---Select Status---', ...statusOptions]}
                            />
                            <FormSelect 
                                label="Category"
                                name="categoryFilter"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                options={['---Select Category---', ...categories]}
                            />
                            <FormSelect 
                                label="Primary Metal"
                                name="metalFilter"
                                value={metalFilter}
                                onChange={(e) => setMetalFilter(e.target.value)}
                                options={['---Select Primary Metal---', ...metalOptions]}
                            />
                        </div>
                    </div>
                )}


                {activeTab === 'inventory' ? (
                    <InventoryList
                        items={filteredInventory}
                        onEdit={openForm}
                        onDelete={handleDelete}
                        userRole={userRole}
                    />
                ) : activeTab === 'report' ? (
                    <StockReport items={filteredInventory} metalConfig={metalConfig} />
                ) : activeTab === 'sales' ? (
                    <POSView 
                        items={inventory} 
                        metalRates={metalRates}
                        taxRate={taxRate}
                        // Pass new prop
                        makingChargesPerMetal={makingChargesPerMetal} 
                        onSaleComplete={handleSaleComplete}
                    />
                ) : activeTab === 'settings' ? (
                    <SettingsView 
                        categories={categories} 
                        metalConfig={metalConfig}
                        metalCategoryMap={metalCategoryMap}
                        metalRates={metalRates}
                        taxRate={taxRate}
                        // Pass new prop
                        makingChargesPerMetal={makingChargesPerMetal} 
                        publicDataPath={publicDataPath}
                    />
                ) : activeTab === 'users' && userRole === ROLES.ADMIN ? (
                    <UserManagementView 
                        usersCollectionPath={usersCollectionPath} 
                        currentUserId={userId} // Pass current user ID for self-deletion check
                    />
                ) : activeTab === 'suppliers' && (userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) ? (
                    <SuppliersView 
                        suppliersCollectionPath={suppliersCollectionPath} 
                        purchaseOrdersCollectionPath={purchaseOrdersCollectionPath}
                        metalConfig={metalConfig} // Pass for PO Material selection
                        categories={categories} // Pass for PO Material selection
                        openItemForm={openForm} // Function to trigger Item Edit Modal after PO completion
                    />
                ) : null}
            </main>
            
            {activeTab === 'inventory' && (
                <button
                    onClick={() => openForm(null)}
                    className="sm:hidden fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 z-40"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {showForm && (
                <ItemForm
                    key={editingItem ? editingItem.id : 'new-item'}
                    item={editingItem}
                    categories={categories}
                    metalConfig={metalConfig}
                    metalCategoryMap={metalCategoryMap}
                    // Pass new prop
                    makingChargesPerMetal={makingChargesPerMetal}
                    onSave={handleFormSave}
                    onClose={closeForm}
                />
            )}
        </div>
    );
}

// --- Component Definitions (omitted for brevity, defined in file structure) ---

function InventoryList({ items, onDelete, onEdit, userRole }) {
    // ... (InventoryList component remains largely unchanged)
    if (items.length === 0) {
        return <div className="text-center p-12 bg-white rounded-lg shadow text-gray-500"><h3 className="text-xl font-medium">No inventory items found.</h3><p className="mt-2">Click "Add Item" to get started.</p></div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:hidden">
                {items.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                        <div className="flex-shrink-0"><img className="h-20 w-20 rounded-lg object-cover bg-gray-100 border border-gray-100" src={item.imageUrl || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'; }} /></div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div><div className="flex justify-between items-start"><h3 className="text-base font-semibold text-gray-900 truncate">{item.name}</h3><span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${item.status === 'Sold' ? 'bg-red-100 text-red-700' : item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span></div><p className="text-xs text-gray-500 font-mono mt-0.5">{item.sku} • {item.category}</p><div className="mt-2 text-sm text-gray-700">{item.metals && item.metals.length > 0 && (<span className="block">{item.metals[0].grossWeight}g <span className="text-xs text-gray-500">{item.metals[0].purity}</span></span>)}</div></div>
                            <div className="flex justify-end gap-3 mt-2"><button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded bg-blue-50">Edit</button>{userRole !== ROLES.STAFF && (<button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded bg-red-50">Delete</button>)}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="hidden sm:block bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / HUID</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-16 w-16"><img className="h-16 w-16 rounded-lg object-cover bg-gray-100" src={item.imageUrl || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'; }} /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{item.name}</div><div className="text-sm text-gray-500">{item.category}</div></div></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">SKU: {item.sku}</div><div className="text-sm text-gray-500">HUID: {item.huid}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.metals && item.metals.length > 0 && (<div>{item.metals[0].grossWeight}g {item.metals[0].purity} {item.metals[0].type}</div>)}{item.stones && item.stones.length > 0 && (<div>{item.stones.length} stone{item.stones.length > 1 ? 's' : ''} (incl. {item.stones[0].carat}ct {item.stones[0].type})</div>)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Sold' ? 'bg-red-100 text-red-800' : item.status === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4 transition duration-150 p-2 rounded-full hover:bg-blue-50"><IconPencil /></button>{userRole !== ROLES.STAFF && (<button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-full hover:bg-red-50"><IconTrash /></button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// Pass new prop
const ItemForm = ({ item, categories, metalConfig, metalCategoryMap, makingChargesPerMetal, onSave, onClose }) => { 
    const initialMetalType = (item?.metals?.[0]?.type || Object.keys(metalConfig)[0] || 'Gold');
    // Removed makingCharges and stoneValue default from metal object, as they will be calculated on metal change, not stored in a new item object
    const defaultState = useMemo(() => ({ id: null, name: '', sku: '', huid: '', category: '', status: STATUS_OPTIONS[0], imageUrl: '', metals: [{ type: initialMetalType, purity: '', netWeight: 0, grossWeight: 0 }], stones: [] }), [initialMetalType]);
    if (defaultState.metals[0].type && metalConfig[defaultState.metals[0].type]) { defaultState.metals[0].purity = metalConfig[defaultState.metals[0].type][0] || ''; }
    
    // Adjusted initial state logic for existing items to match new structure
    const [formData, setFormData] = useState(() => {
        if (item) {
            // Remove legacy metal.makingCharges and metal.stoneValue, as the ItemForm no longer tracks them there.
            const updatedMetals = item.metals?.map(({ makingCharges, stoneValue, ...m }) => ({ ...m })) || defaultState.metals; 
            return { ...defaultState, ...item, id: item.id, metals: updatedMetals };
        }
        return defaultState;
    });

    const availableCategories = useMemo(() => {
        const primaryMetal = formData.metals[0]?.type;
        const mappedCategories = metalCategoryMap[primaryMetal] || [];
        if (mappedCategories.length === 0) return categories;
        return categories.filter(cat => mappedCategories.includes(cat));
    }, [formData.metals, metalCategoryMap, categories]);

    useEffect(() => {
        // Re-run this effect when `item` changes (e.g., when opening the modal)
        if (item) {
            // Ensure any old `makingCharges` is preserved as a *flat* charge on the main object
            // and that metal objects are cleaned of old, pre-metal-wise fields
            const updatedMetals = item.metals?.map(({ makingCharges, stoneValue, ...m }) => ({ ...m })) || defaultState.metals; 
            setFormData({ ...defaultState, ...item, id: item.id, metals: updatedMetals });
        } else { setFormData(defaultState); }
        setImagePreview(item?.imageUrl || null); setImageFile(null);
    }, [item?.id]);

    useEffect(() => {
        const currentCategory = formData.category;
        if (currentCategory && !availableCategories.includes(currentCategory)) { const newCategory = availableCategories.length > 0 ? availableCategories[0] : ''; setFormData(prev => ({ ...prev, category: newCategory })); } 
        else if (!currentCategory && availableCategories.length > 0) { setFormData(prev => ({ ...prev, category: availableCategories[0] })); }
    }, [availableCategories]); 

    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
    const [errorMessage, setErrorMessage] = useState(""); 

    const handleImageChange = (e) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setImageFile(file); const reader = new FileReader(); reader.onloadend = () => { setImagePreview(reader.result); }; reader.readAsDataURL(file); setFormData(prev => ({ ...prev, imageUrl: '' })); } };
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (name === 'imageUrl') { setImagePreview(value); setImageFile(null); } };
    const handleMetalChange = (index, e) => {
        const { name, value } = e.target;
        const newMetals = [...formData.metals];
        let newValue = value;
        if (name === 'netWeight' || name === 'grossWeight') { newValue = parseFloat(value) || 0; }
        
        newMetals[index] = { ...newMetals[index], [name]: newValue };
        
        if (name === 'type') { 
            newMetals[index].purity = metalConfig[value]?.[0] || '';
        }
        setFormData(prev => ({ ...prev, metals: newMetals }));
    };
    // Removed makingCharges & stoneValue fields from default metal object
    const addMetal = () => { const firstMetal = Object.keys(metalConfig)[0] || 'Gold'; setFormData(prev => ({ ...prev, metals: [...prev.metals, { type: firstMetal, purity: metalConfig[firstMetal]?.[0] || '', netWeight: 0, grossWeight: 0 }] })); };
    const removeMetal = (index) => { setFormData(prev => ({ ...prev, metals: prev.metals.filter((_, i) => i !== index) })); };
    const handleStoneChange = (index, e) => { const { name, value } = e.target; const newStones = [...formData.stones]; newStones[index] = { ...newStones[index], [name]: value }; setFormData(prev => ({ ...prev, stones: newStones })); };
    const addStone = () => { setFormData(prev => ({ ...prev, stones: [...prev.stones, { type: STONE_TYPES[0], carat: '', cut: STONE_CUTS[0], color: STONE_COLORS[0], clarity: STONE_CLARITIES[0] }] })); };
    const removeStone = (index) => { setFormData(prev => ({ ...prev, stones: prev.stones.filter((_, i) => i !== index) })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setErrorMessage("");
        if (!formData.name || !formData.sku || !formData.category) { setErrorMessage("Please fill in all required fields (Name, SKU, Category)."); return; }
        setIsUploading(true);
        let finalItemData = { ...formData };
        if (imageFile) {
            try { if (!userId || !appId || !storage) { throw new Error("Auth or storage not ready"); } const storagePath = `artifacts/${appId}/users/${userId}/inventory_images/${Date.now()}_${imageFile.name}`; const storageRef = ref(storage, storagePath); await uploadBytes(storageRef, imageFile); const downloadURL = await getDownloadURL(storageRef); finalItemData.imageUrl = downloadURL; } catch (e) { console.error("Error uploading image:", e); setErrorMessage(`Image upload failed: ${e.message}`); setIsUploading(false); return; }
        }
        try { await onSave(finalItemData); } catch (e) { console.error("Error saving item:", e); setErrorMessage(`Failed to save item: ${e.message}`); } finally { setIsUploading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center sm:items-start sm:pt-16 p-4 sm:p-0 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] sm:max-h-none flex flex-col">
                <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white rounded-t-lg z-10"><h2 className="text-xl sm:text-2xl font-semibold">{item ? 'Edit Item' : 'Add New Item'}</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><IconClose /></button></div>
                {errorMessage && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4 sm:m-6" role="alert"><p className="font-bold">Error:</p><p className="text-sm">{errorMessage}</p></div>)}
                <div className="overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
                    <form id="item-form" onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        <div className="border-b pb-6 space-y-4"><h3 className="text-lg font-medium text-gray-900">Basic Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormInput name="name" label="Item Name" value={formData.name} onChange={handleInputChange} required /><FormInput name="sku" label="SKU" value={formData.sku} onChange={handleInputChange} required /><FormInput name="huid" label="HUID" value={formData.huid} onChange={handleInputChange} /><FormSelect name="category" label="Category" value={formData.category} onChange={handleInputChange} options={availableCategories} required /><FormSelect name="status" label="Status" value={formData.status} onChange={handleInputChange} options={STATUS_OPTIONS} required /><div className="sm:col-span-2 space-y-2"><label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label><div className="flex flex-col sm:flex-row items-start sm:items-center gap-4"><img className="h-24 w-24 sm:h-20 sm:w-20 rounded-lg object-cover bg-gray-100 border mx-auto sm:mx-0" src={imagePreview || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'} alt="Preview" onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image'; }} /><div className="flex-1 w-full space-y-2"><label htmlFor="image-upload" className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 cursor-pointer w-full"><IconCamera /><span>Capture / Upload</span><input id="image-upload" name="image-upload" type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleImageChange} /></label><FormInput name="imageUrl" label="Or paste Image URL" value={formData.imageUrl} onChange={handleInputChange} /></div></div></div></div></div>
                        <div className="border-b pb-6 space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">Metal Details</h3><button type="button" onClick={addMetal} className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"><IconPlus /> Add</button></div>{formData.metals.map((metal, index) => (<div key={index} className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 border rounded-lg bg-gray-50 relative"><FormSelect name="type" label="Type" value={metal.type} onChange={(e) => handleMetalChange(index, e)} options={Object.keys(metalConfig)} /><FormSelect name="purity" label="Purity" value={metal.purity} onChange={(e) => handleMetalChange(index, e)} options={metalConfig[metal.type] || []} /><FormInput name="netWeight" label="Net(g)" type="number" value={metal.netWeight} onChange={(e) => handleMetalChange(index, e)} /><FormInput name="grossWeight" label="Gross(g)" type="number" value={metal.grossWeight} onChange={(e) => handleMetalChange(index, e)} /><div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center items-end pb-1"><button type="button" onClick={() => removeMetal(index)} className="text-red-600 hover:text-red-800 p-2 disabled:opacity-50" disabled={formData.metals.length <= 1}><IconTrash /></button></div></div>))}</div>
                        <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">Stone Details</h3><button type="button" onClick={addStone} className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"><IconPlus /> Add</button></div>{formData.stones.map((stone, index) => (<div key={index} className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-3 border rounded-lg bg-gray-50"><FormSelect name="type" label="Type" value={stone.type} onChange={(e) => handleStoneChange(index, e)} options={STONE_TYPES} /><FormInput name="carat" label="Carat" type="number" value={stone.carat} onChange={(e) => handleStoneChange(index, e)} /><FormSelect name="cut" label="Cut" value={stone.cut} onChange={(e) => handleStoneChange(index, e)} options={STONE_CUTS} /><FormSelect name="color" label="Color" value={stone.color} onChange={(e) => handleStoneChange(index, e)} options={STONE_COLORS} /><FormSelect name="clarity" label="Clarity" value={stone.clarity} onChange={(e) => handleStoneChange(index, e)} options={STONE_CLARITIES} /><div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center items-end pb-1"><button type="button" onClick={() => removeStone(index)} className="text-red-600 hover:text-red-800 p-2"><IconTrash /></button></div></div>))}</div>
                    </form>
                </div>
                <div className="flex justify-end items-center gap-4 p-4 sm:p-6 border-t sticky bottom-0 bg-white rounded-b-lg z-10">
                    <button type="button" onClick={onClose} className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
                    <button type="submit" form="item-form" disabled={isUploading} className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">{isUploading ? (<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<IconSave />)}<span>{isUploading ? 'Saving...' : 'Save Item'}</span></button>
                </div>
            </div>
        </div>
    );
};

function StockReport({ items, metalConfig }) {
    // ... (StockReport component remains largely unchanged)
    const stats = useMemo(() => {
        const result = { totalItems: 0, metals: {}, groupedStock: {} };
        items.forEach(item => {
            if (item.status !== 'Sold') {
                result.totalItems += 1;
                let primaryMetal = 'Unknown Metal';
                if (item.metals && item.metals.length > 0) { primaryMetal = item.metals[0].type; }
                const catName = item.category || 'Uncategorized';
                const groupKey = `${catName}_${primaryMetal}`;
                if (!result.groupedStock[groupKey]) { result.groupedStock[groupKey] = { name: catName, primaryMetal: primaryMetal, count: 0, gross: 0, net: 0, metalTypes: new Set() }; }
                result.groupedStock[groupKey].count += 1;
                result.groupedStock[groupKey].metalTypes.add(primaryMetal);
                if (item.metals) {
                    item.metals.forEach(m => {
                        const g = parseFloat(m.grossWeight || 0); const n = parseFloat(m.netWeight || 0);
                        if (!result.metals[m.type]) { result.metals[m.type] = { gross: 0, net: 0 }; }
                        result.metals[m.type].gross += g; result.metals[m.type].net += n;
                        result.groupedStock[groupKey].gross += g; result.groupedStock[groupKey].net += n;
                        if (m.type) result.groupedStock[groupKey].metalTypes.add(m.type);
                    });
                }
            }
        });
        return result;
    }, [items]);

    const stockRows = Object.values(stats.groupedStock).sort((a, b) => {
        const catCompare = a.name.localeCompare(b.name);
        if (catCompare !== 0) return catCompare;
        return a.primaryMetal.localeCompare(b.primaryMetal);
    });

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total In-Stock</div><div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalItems} <span className="text-sm font-normal text-gray-400">Items</span></div></div>
                {Object.entries(stats.metals).map(([type, data]) => (<div key={type} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{type} Stock</div><div className="mt-1 flex justify-between items-end"><div><span className="text-xl font-bold text-gray-900">{data.net.toFixed(2)}</span><span className="ml-1 text-xs text-gray-500">g Net</span></div><div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{data.gross.toFixed(2)}g Grs</div></div></div>))}
            </div>
            <div className="block sm:hidden space-y-4">
                <div className="flex justify-between items-center px-1"><h3 className="text-lg font-medium text-gray-900">Category Summary</h3><span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{stockRows.length} Groups</span></div>
                {stockRows.map((group, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4"><div><div className="font-bold text-gray-900 text-lg">{group.name}</div><div className="text-sm text-gray-500">{group.primaryMetal}</div></div><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{group.count} Items</span></div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4"><div><div className="text-xs text-gray-500 uppercase">Gross Weight</div><div className="text-gray-700 font-mono font-medium">{group.gross.toFixed(2)}g</div></div><div className="text-right"><div className="text-xs text-blue-600 uppercase font-bold">Net Weight</div><div className="text-blue-700 font-mono text-xl font-bold">{group.net.toFixed(2)}g</div></div></div>
                    </div>
                ))}
            </div>
            <div className="hidden sm:block bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">Category & Metal Summary</h3><span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{stockRows.length} Groups</span></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metal Type</th><th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Total Gross (g)</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">Total Net (g)</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {stockRows.map((group, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="px-6 py-4 font-medium text-gray-900">{group.name}</td><td className="px-6 py-4 text-gray-600">{group.primaryMetal}</td><td className="px-6 py-4 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{group.count}</span></td><td className="px-6 py-4 text-right text-gray-600 bg-gray-50/50 font-mono">{group.gross.toFixed(2)}</td><td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30 font-mono text-base">{group.net.toFixed(2)}</td></tr>
                            ))}
                        </tbody>
                        {stockRows.length > 0 && <tfoot className="bg-gray-100 font-semibold text-gray-900"><tr><td className="px-6 py-3">Total</td><td className="px-6 py-3"></td><td className="px-6 py-3 text-center">{stats.totalItems}</td><td className="px-6 py-3 text-right">{stockRows.reduce((sum, group) => sum + group.gross, 0).toFixed(2)}</td><td className="px-6 py-3 text-right text-blue-800 bg-blue-100">{stockRows.reduce((sum, group) => sum + group.net, 0).toFixed(2)}</td></tr></tfoot>}
                    </table>
                </div>
            </div>
        </div>
    );
}

// Pass new prop
function POSView({ items, metalRates, taxRate, makingChargesPerMetal, onSaleComplete }) {
    const availableItems = items.filter(item => item.status === 'In Stock');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [discountPct, setDiscountPct] = useState(0);
    const selectedItem = availableItems.find(i => i.id === selectedItemId);
    
    // Total Metal Cost + Total Metal-wise Making Charges + Stone Value
    const baseValue = useMemo(() => {
        if (!selectedItem) return 0;
        // Updated to use the new calculateBaseValue that includes metal-wise MC
        return calculateBaseValue(selectedItem, metalRates, makingChargesPerMetal);
    }, [selectedItem, metalRates, makingChargesPerMetal]); 

    // Calculate total making charges from the new model for display purposes
    const makingChargesTotal = useMemo(() => {
        if (!selectedItem) return 0;
        // START CODE MERGE - STEP 7 (POS Auto Price Update for Display)
        let totalMC = selectedItem.metals.reduce((t, m) => {
            const netWeight = parseFloat(m.netWeight || 0);
            const mcPerMetal = parseFloat(makingChargesPerMetal[m.type] || 0);
            return t + (netWeight * mcPerMetal) || 0;
        }, 0);
        
        // Include standalone stone value if present
        totalMC += parseFloat(selectedItem.stoneValue || 0);
        return totalMC;
        // END CODE MERGE
    }, [selectedItem, makingChargesPerMetal]);

    const metalValue = useMemo(() => {
        if (!selectedItem) return 0;
        return selectedItem.metals.reduce((t, m) => t + (parseFloat(m.netWeight || 0) * parseFloat(metalRates[m.type] || 0)), 0);
    }, [selectedItem, metalRates]);


    const subtotal = baseValue; // BaseValue now contains everything before tax/discount
    const discountAmount = subtotal * (discountPct / 100);
    const taxableBase = subtotal - discountAmount;
    const taxAmount = taxableBase * (taxRate / 100);
    const finalPrice = taxableBase + taxAmount;
    
    const handleCompleteSale = () => {
        if (!selectedItem) { alert('Please select an item for sale.'); return; }
        onSaleComplete(selectedItemId, finalPrice, discountPct, taxAmount);
        setSelectedItemId(''); setDiscountPct(0);
    };
    const handleReset = () => { setSelectedItemId(''); setDiscountPct(0); };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Select Item for Sale</h3>
                    <FormSelect label="Inventory Item (SKU - Name - Category)" name="selectedItem" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} options={[''].concat(availableItems.map(item => item.id))}>
                         <option value="">-- Select Item --</option>
                         {availableItems.map(item => (<option key={item.id} value={item.id}>{`${item.sku} - ${item.name} (${item.category})`}</option>))}
                    </FormSelect>
                    <small className="block text-gray-500 mt-2">Only items currently "In Stock" are shown.</small>
                    {availableItems.length === 0 && <p className="mt-4 text-red-500 font-medium">No items available for sale in stock.</p>}
                </div>
                {selectedItem && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-300">
                        <h4 className="text-lg font-semibold mb-4 border-b pb-2">Item Details</h4>
                        <div className="flex gap-4 sm:gap-6">
                            <img className="h-24 w-24 rounded-lg object-cover bg-gray-100 flex-shrink-0" src={selectedItem.imageUrl || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=Item'} alt={selectedItem.name} onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=Item'; }} />
                            <div className="flex-1">
                                <div className="text-xl font-bold text-gray-900">{selectedItem.name}</div>
                                <div className="text-sm text-gray-600">SKU: {selectedItem.sku} | HUID: {selectedItem.huid}</div>
                                <div className="text-xs text-gray-500 mt-1">{selectedItem.metals?.map(m => `${m.netWeight}g ${m.purity} ${m.type}`).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-1">
                <div className="bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-200 sticky top-20 space-y-4">
                    <h3 className="text-xl font-bold text-blue-800 border-b border-blue-300 pb-3">Checkout</h3>
                    <div className="space-y-2 text-sm">
                        <PriceRow label="Metal Value" value={metalValue} isBase />
                        {/* Updated calculation to use makingChargesTotal derived from metal-wise MC */}
                        <PriceRow label="Making Charges + Stones" value={makingChargesTotal} /> 
                        <div className="h-px bg-gray-200 my-3"></div>
                        <PriceRow label="Subtotal" value={subtotal} />
                    </div>
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input type="number" value={discountPct} onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" disabled={!selectedItem} />
                        <small className="block text-red-500 mt-1">{discountAmount.toFixed(2)} deducted.</small>
                    </div>
                    <div className="pt-2 border-t border-blue-200 space-y-2">
                        <PriceRow label={`Tax (${taxRate}%)`} value={taxAmount} />
                        <PriceRow label="Total Payable" value={finalPrice} isFinal />
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <button onClick={handleCompleteSale} disabled={!selectedItem || finalPrice <= 0} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold shadow-md hover:bg-green-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed">Complete Sale</button>
                        <button onClick={handleReset} type="button" className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuppliersView({ suppliersCollectionPath, purchaseOrdersCollectionPath, metalConfig, categories, openItemForm }) {
    // ... (SuppliersView component remains largely unchanged)
    const [suppliers, setSuppliers] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [isEditingPO, setIsEditingPO] = useState(false);
    const [editingPO, setEditingPO] = useState(null);
    const [newPOData, setNewPOData] = useState({ supplierId: '', type: 'Metal', materialName: '', quantity: '', date: new Date().toISOString().slice(0, 10), status: 'Pending' });

    const availableMetals = Object.keys(metalConfig);
    const availableCategories = categories;

    const availableMaterials = useMemo(() => {
        const type = isEditingPO ? editingPO?.type : newPOData.type;
        if (type === 'Metal') return availableMetals;
        if (type === 'Finished Goods') return availableCategories;
        return STONE_TYPES;
    }, [newPOData.type, availableMetals, availableCategories, isEditingPO, editingPO]);

    useEffect(() => {
        if (availableMaterials.length > 0) {
            if (isEditingPO && editingPO) {
                 if (!availableMaterials.includes(editingPO.materialName)) { setEditingPO(prev => ({ ...prev, materialName: availableMaterials[0] })); }
            } else {
                 if (!availableMaterials.includes(newPOData.materialName)) { setNewPOData(prev => ({ ...prev, materialName: availableMaterials[0] })); }
            }
        }
    }, [availableMaterials, isEditingPO]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, suppliersCollectionPath), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSuppliers(list);
            if (list.length > 0 && !newPOData.supplierId) { setNewPOData(prev => ({ ...prev, supplierId: list[0].id })); }
        });
        return () => unsubscribe();
    }, [suppliersCollectionPath]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, purchaseOrdersCollectionPath), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPurchaseOrders(list);
        });
        return () => unsubscribe();
    }, [purchaseOrdersCollectionPath]);

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        if (!newSupplierName.trim()) return;
        try { await addDoc(collection(db, suppliersCollectionPath), { name: newSupplierName.trim(), contact: '', addedAt: new Date().toISOString() }); setNewSupplierName(''); } catch (e) { console.error("Error adding supplier:", e); }
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try { await deleteDoc(doc(db, suppliersCollectionPath, id)); } catch (e) { console.error("Error deleting supplier:", e); }
        }
    };

    const handlePOChange = (e) => {
        const { name, value } = e.target;
        let update = { [name]: value };
        if (name === 'type') { update.materialName = ''; }
        if (isEditingPO && editingPO) { setEditingPO(prev => ({ ...prev, ...update })); } else { setNewPOData(prev => ({ ...prev, ...update })); }
    };

    const openEditPO = (po) => { setEditingPO(po); setIsEditingPO(true); };
    const closeEditPO = () => { setIsEditingPO(false); setEditingPO(null); };
    
    const handleSavePO = async (e) => {
        e.preventDefault();
        const poToSave = isEditingPO ? editingPO : newPOData;
        if (!poToSave.supplierId || !poToSave.quantity || !poToSave.type || !poToSave.materialName) { alert("Please fill in all required PO fields."); return; }
        const supplierName = suppliers.find(s => s.id === poToSave.supplierId)?.name || 'Unknown';
        const dataToSave = { ...poToSave, supplierName: supplierName, quantity: parseFloat(poToSave.quantity) };
        try {
            if (isEditingPO) {
                await setDoc(doc(db, purchaseOrdersCollectionPath, poToSave.id), dataToSave);
                closeEditPO();
            } else {
                dataToSave.orderNumber = `PO-${Date.now().toString().slice(-6)}`;
                await addDoc(collection(db, purchaseOrdersCollectionPath), dataToSave);
                setNewPOData(prev => ({ ...prev, quantity: '' }));
            }
        } catch (e) { console.error("Error saving PO:", e); alert("Failed to save Purchase Order.");}
    };

    const handleUpdatePOStatus = async (po, newStatus) => {
        if (po.status === 'Completed' && newStatus === 'Completed') return;
        try {
            await setDoc(doc(db, purchaseOrdersCollectionPath, po.id), { status: newStatus }, { merge: true });
            if (newStatus === 'Completed') {
                const newStockItem = await reflectPOInInventory(po);
                if (newStockItem) { openItemForm(newStockItem); }
            }
        } catch (e) { console.error("Error updating PO status:", e); alert("Failed to update PO status."); }
    };
    
    const reflectPOInInventory = async (po) => {
        if (!db) return null;
        const baseItem = {
            name: `${po.materialName} Stock from PO ${po.orderNumber}`,
            sku: `PO-${po.orderNumber}-STOCK`,
            huid: '',
            category: po.type === 'Metal' ? 'Raw Metal' : po.type === 'Stone' ? 'Loose Stone' : po.materialName,
            status: 'In Stock',
            imageUrl: '',
            // No making charges on raw material/new stock item
            makingCharges: 0, 
            stoneValue: 0
        };
        if (po.type === 'Metal') {
            baseItem.metals = [{ type: po.materialName, purity: metalConfig[po.materialName]?.[0] || '', netWeight: po.quantity.toFixed(2), grossWeight: po.quantity.toFixed(2) }];
            baseItem.category = 'Raw Metal';
        } else if (po.type === 'Stone') {
            baseItem.stones = [{ type: po.materialName, carat: po.quantity.toFixed(2), cut: 'Round', color: 'G', clarity: 'SI1' }];
            baseItem.category = 'Loose Stone';
        } else if (po.type === 'Finished Goods') {
            baseItem.category = po.materialName;
        }
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/inventory`), baseItem);
            return { id: docRef.id, ...baseItem };
        } catch (e) { console.error("Error reflecting PO in inventory:", e); return null; }
    };

    const getSupplierName = (id) => suppliers.find(s => s.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">Procurement Management</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50"><h3 className="text-lg font-medium text-gray-900">Supplier Database</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <form onSubmit={handleAddSupplier} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-gray-700">Add New Vendor</h4>
                            <input type="text" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Vendor Name (e.g., ABC Bullion)" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500" required />
                            <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Supplier</button>
                        </form>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="font-semibold text-gray-700 mb-3">Active Suppliers ({suppliers.length})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {suppliers.map(supplier => (
                                <div key={supplier.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                    <span className="font-medium text-gray-800">{supplier.name}</span>
                                    <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"><IconTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50"><h3 className="text-lg font-medium text-gray-900">Purchase Order (PO) Tracking</h3></div>
                <div className="p-6 space-y-6">
                    <form onSubmit={handleSavePO} className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4 border-b pb-6">
                        <div className="sm:col-span-6 text-lg font-semibold text-gray-700 mb-2">{isEditingPO ? `Edit PO ${editingPO.orderNumber}` : 'Create New PO'}</div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                             <select name="supplierId" value={isEditingPO ? editingPO.supplierId : newPOData.supplierId} onChange={handlePOChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white">
                                 {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                        </div>
                        <FormSelect name="type" label="PO Type" value={isEditingPO ? editingPO.type : newPOData.type} onChange={handlePOChange} options={['Metal', 'Stone', 'Finished Goods']} required />
                        <FormSelect name="materialName" label={`Material Name (${(isEditingPO ? editingPO.type : newPOData.type) === 'Finished Goods' ? 'Category' : (isEditingPO ? editingPO.type : newPOData.type)})`} value={isEditingPO ? editingPO.materialName : newPOData.materialName} onChange={handlePOChange} options={availableMaterials} required />
                        <FormInput name="quantity" label="Quantity (g/ct/pcs)" type="number" value={isEditingPO ? editingPO.quantity : newPOData.quantity} onChange={handlePOChange} required />
                        <FormInput name="date" label="Order Date" type="date" value={isEditingPO ? (editingPO.date.slice(0,10) || new Date().toISOString().slice(0, 10)) : newPOData.date} onChange={handlePOChange} required />
                        <div className="sm:col-span-1 flex items-end gap-2">
                            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEditingPO ? 'Update PO' : 'Add PO'}</button>
                            {isEditingPO && <button type="button" onClick={closeEditPO} className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>}
                        </div>
                    </form>
                    <h4 className="font-semibold text-gray-700 mb-3">All Purchase Orders</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {purchaseOrders.sort((a, b) => b.orderNumber.localeCompare(a.orderNumber)).map(po => (
                                    <tr key={po.id}>
                                        <td className="px-4 py-3 font-mono text-gray-900">{po.orderNumber}</td>
                                        <td className="px-4 py-3">{getSupplierName(po.supplierId)}</td>
                                        <td className="px-4 py-3 text-gray-600">{po.materialName} ({po.type})</td>
                                        <td className="px-4 py-3 text-right font-medium">{po.quantity}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${po.status === 'Completed' ? 'bg-green-100 text-green-800' : po.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{po.status}</span></td>
                                        <td className="px-4 py-3 text-center flex gap-2 justify-center">
                                            {po.status !== 'Completed' && <button onClick={() => handleUpdatePOStatus(po, 'Completed')} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition duration-150" title="Mark Complete & Add to Inventory">Receive</button>}
                                            <button onClick={() => openEditPO(po)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition duration-150" title="Edit Purchase Order"><IconPencil /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {purchaseOrders.length === 0 && <p className="text-center text-gray-500 py-6">No purchase orders added yet.</p>}
                </div>
            </div>
        </div>
    );
}

// Added currentUserId prop
function UserManagementView({ usersCollectionPath, currentUserId }) {
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const q = query(collection(db, usersCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        });
        return () => unsubscribe();
    }, [usersCollectionPath]);

    const handleChangeRole = async (userId, newRole) => {
        if (window.confirm(`Change role to ${newRole}?`)) {
            try { await setDoc(doc(db, usersCollectionPath, userId), { role: newRole }, { merge: true }); } catch(e) { console.error("Error updating role:", e); alert("Failed to update role."); }
        }
    };

    // NEW: Handle user deletion
    const handleDeleteUser = async (userToDelete) => {
        if (userToDelete.id === currentUserId) {
            alert("You cannot delete your own user account from this interface.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the user "${userToDelete.name || userToDelete.email || userToDelete.id}"? This will permanently remove them from the system.`)) {
            try {
                await deleteDoc(doc(db, usersCollectionPath, userToDelete.id));
            } catch(e) { 
                console.error("Error deleting user:", e); 
                alert("Failed to delete user: " + e.message); 
            }
        }
    };
    
    const RoleBadge = ({ role }) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role === ROLES.ADMIN ? 'bg-purple-100 text-purple-800' : role === ROLES.MANAGER ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{role}</span>;
    const RoleSelector = ({ user }) => <select value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"><option value={ROLES.ADMIN}>Admin</option><option value={ROLES.MANAGER}>Manager</option><option value={ROLES.STAFF}>Staff</option></select>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-medium text-gray-900">User Management</h3><p className="text-sm text-gray-500">Manage staff roles and permissions.</p></div>
            <div className="sm:hidden p-4 space-y-4">
                {users.map(user => {
                    const isCurrentUser = user.id === currentUserId;
                    return (
                        <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                                <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'} {isCurrentUser && <span className="text-xs text-blue-500">(You)</span>}</div>
                                <RoleBadge role={user.role} />
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500"><span>ID: <span className="font-mono text-xs">{user.id}</span></span></div>
                            <div className="flex justify-between items-center">
                                <RoleSelector user={user} />
                                <button
                                    onClick={() => handleDeleteUser(user)}
                                    disabled={isCurrentUser}
                                    title={isCurrentUser ? "Cannot delete yourself" : "Delete User"}
                                    className={`p-2 rounded-full transition duration-150 ${isCurrentUser ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800 hover:bg-red-50'}`}
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                            const isCurrentUser = user.id === currentUserId;
                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'} {isCurrentUser && <span className="text-xs text-blue-500">(You)</span>}</div><div className="text-xs text-gray-500 font-mono">{user.id}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={user.role} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-4">
                                        <RoleSelector user={user} />
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={isCurrentUser}
                                            title={isCurrentUser ? "Cannot delete yourself" : "Delete User"}
                                            className={`transition duration-150 p-2 rounded-full ${isCurrentUser ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900 hover:bg-red-50'}`}
                                        >
                                            <IconTrash />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SettingsView({ categories, metalConfig, metalCategoryMap, metalRates, taxRate, makingChargesPerMetal, publicDataPath }) {
    const [newCategory, setNewCategory] = useState("");
    const [newMetal, setNewMetal] = useState("");
    const [newPurity, setNewPurity] = useState("");
    const [selectedMetalForPurity, setSelectedMetalForPurity] = useState(Object.keys(metalConfig)[0] || "");
    const [selectedMetalForMapping, setSelectedMetalForMapping] = useState(Object.keys(metalCategoryMap)[0] || Object.keys(metalConfig)[0] || "");
    const [localMetalRates, setLocalMetalRates] = useState(metalRates);
    const [localTaxRate, setLocalTaxRate] = useState(taxRate);
    // START CODE MERGE - STEP 2/3 (Local state for Making Charges per Metal)
    const [localMakingChargesPerMetal, setLocalMakingChargesPerMetal] = useState(makingChargesPerMetal);
    // END CODE MERGE

    // Update local state when parent props change
    useEffect(() => { setLocalMetalRates(metalRates); setLocalTaxRate(taxRate); }, [metalRates, taxRate]);
    // START CODE MERGE - STEP 2/3 (Update local making charges when parent prop changes)
    useEffect(() => { setLocalMakingChargesPerMetal(makingChargesPerMetal); }, [makingChargesPerMetal]);
    // END CODE MERGE

    const handleMetalRateChange = (metalType, value) => { setLocalMetalRates(prev => ({ ...prev, [metalType]: parseFloat(value) || 0 })); };
    const handleTaxRateChange = (e) => { setLocalTaxRate(parseFloat(e.target.value) || 0); };
    
    // START CODE MERGE - STEP 4 (Add handler for Making Charges update)
    const handleUpdateMC = (metal, value) => {
         const updated = {...localMakingChargesPerMetal, [metal]: parseFloat(value) || 0};
         setLocalMakingChargesPerMetal(updated);
    };
    // END CODE MERGE

    // START CODE MERGE - STEP 4 (Update save handler for global rates)
    const handleSaveGlobalRates = async () => { 
        try { 
            await setDoc(doc(db, `${publicDataPath}/settings`, 'globalRates'), { 
                metalRates: localMetalRates, 
                taxRate: localTaxRate,
                makingChargesPerMetal: localMakingChargesPerMetal // Save new field
            }); 
            alert("Global rates updated successfully!"); 
        } catch(e) { 
            console.error("Error saving global rates:", e); 
            alert("Failed to save global rates."); 
        } 
    };
    // END CODE MERGE

    const handleAddCategory = async (e) => { e.preventDefault(); if (!newCategory.trim()) return; try { await setDoc(doc(db, `${publicDataPath}/categories`, newCategory.trim()), { name: newCategory.trim() }); setNewCategory(""); } catch(e) { console.error(e); alert("Error adding category"); } };
    const handleDeleteCategory = async (catName) => { if(window.confirm(`Delete category "${catName}"?`)) { try { await deleteDoc(doc(db, `${publicDataPath}/categories`, catName)); const updatedMap = { ...metalCategoryMap }; Object.keys(updatedMap).forEach(metal => { updatedMap[metal] = updatedMap[metal].filter(c => c !== catName); }); await setDoc(doc(db, `${publicDataPath}/settings`, 'metalCategoryMap'), updatedMap); } catch(e) { console.error(e); alert("Error deleting category"); } } };

    const handleAddMetal = async (e) => { 
        e.preventDefault(); 
        if (!newMetal.trim()) return; 
        const metalName = newMetal.trim(); 
        const updatedConfig = { ...metalConfig, [metalName]: [] }; 
        const updatedMap = { ...metalCategoryMap, [metalName]: [] }; 
        const updatedRates = { ...localMetalRates, [metalName]: 0 }; 
        // Add default making charge for new metal
        const updatedMC = { ...localMakingChargesPerMetal, [metalName]: 0 }; 
        
        try { 
            await setDoc(doc(db, `${publicDataPath}/settings`, 'metals'), updatedConfig); 
            await setDoc(doc(db, `${publicDataPath}/settings`, 'metalCategoryMap'), updatedMap); 
            await setDoc(doc(db, `${publicDataPath}/settings`, 'globalRates'), { 
                metalRates: updatedRates, 
                taxRate: localTaxRate,
                makingChargesPerMetal: updatedMC // Save new MC field
            }); 
            setNewMetal(""); 
            setSelectedMetalForPurity(metalName); 
            setSelectedMetalForMapping(metalName); 
            // Update local state after successful save
            setLocalMakingChargesPerMetal(updatedMC); 
        } catch(e) { console.error(e); alert("Error adding metal"); } 
    };
    
    const handleDeleteMetal = async (metalName) => { 
        if(window.confirm(`Delete Metal "${metalName}"?`)) { 
            const updatedConfig = { ...metalConfig }; delete updatedConfig[metalName]; 
            const updatedMap = { ...metalCategoryMap }; delete updatedMap[metalName]; 
            const updatedRates = { ...localMetalRates }; delete updatedRates[metalName]; 
            // Remove making charge for deleted metal
            const updatedMC = { ...localMakingChargesPerMetal }; delete updatedMC[metalName];
            
            try { 
                await setDoc(doc(db, `${publicDataPath}/settings`, 'metals'), updatedConfig); 
                await setDoc(doc(db, `${publicDataPath}/settings`, 'metalCategoryMap'), updatedMap); 
                await setDoc(doc(db, `${publicDataPath}/settings`, 'globalRates'), { 
                    metalRates: updatedRates, 
                    taxRate: localTaxRate,
                    makingChargesPerMetal: updatedMC // Save updated MC field
                }); 
                const remainingMetals = Object.keys(updatedConfig); 
                if (selectedMetalForPurity === metalName) setSelectedMetalForPurity(remainingMetals[0] || ""); 
                if (selectedMetalForMapping === metalName) setSelectedMetalForMapping(remainingMetals[0] || "");
                // Update local state after successful save
                setLocalMakingChargesPerMetal(updatedMC); 
            } catch(e) { console.error(e); alert("Error deleting metal"); } 
        } 
    };

    const handleAddPurity = async (e) => { e.preventDefault(); if (!newPurity.trim() || !selectedMetalForPurity) return; const currentPurities = metalConfig[selectedMetalForPurity] || []; if (currentPurities.includes(newPurity.trim())) return; const updatedConfig = { ...metalConfig, [selectedMetalForPurity]: [...currentPurities, newPurity.trim()] }; try { await setDoc(doc(db, `${publicDataPath}/settings`, 'metals'), updatedConfig); setNewPurity(""); } catch(e) { console.error(e); alert("Error adding purity"); } };
    const handleDeletePurity = async (metal, purity) => { if(window.confirm(`Remove purity "${purity}"?`)) { const currentPurities = metalConfig[metal]; const updatedConfig = { ...metalConfig, [metal]: currentPurities.filter(p => p !== purity) }; try { await setDoc(doc(db, `${publicDataPath}/settings`, 'metals'), updatedConfig); } catch(e) { console.error(e); alert("Error removing purity"); } } };

    const handleToggleMapping = async (metalName, categoryName) => { const currentMappedCategories = metalCategoryMap[metalName] || []; let updatedCategories; if (currentMappedCategories.includes(categoryName)) { updatedCategories = currentMappedCategories.filter(c => c !== categoryName); } else { updatedCategories = [...currentMappedCategories, categoryName].sort(); } const updatedMap = { ...metalCategoryMap, [metalName]: updatedCategories }; try { await setDoc(doc(db, `${publicDataPath}/settings`, 'metalCategoryMap'), updatedMap); } catch (e) { console.error("Error updating mapping:", e); alert("Error updating mapping."); } };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">Global Settings & Configuration</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-red-50"><h3 className="text-lg font-bold text-red-800">Critical: Live Pricing & Tax Rates</h3><p className="text-sm text-red-600">Used for POS calculations.</p></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">Metal Rates (per Gram in $)</h4>
                        {Object.keys(localMetalRates).map(metal => (
                            <div key={metal} className="flex justify-between items-center gap-4">
                                <label className="text-sm font-medium w-24">{metal}:</label>
                                <div className="flex flex-1 items-center border border-gray-300 rounded-lg shadow-sm">
                                    <span className="bg-gray-50 p-2 rounded-l-lg border-r text-gray-500">$</span>
                                    <input type="number" value={localMetalRates[metal] || ''} onChange={(e) => handleMetalRateChange(metal, e.target.value)} step="0.01" className="w-full px-2 py-2 focus:outline-none focus:ring-0 rounded-r-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">Sales Tax / GST Rate</h4>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium w-28">Tax Rate:</label>
                            <div className="flex flex-1 items-center border border-gray-300 rounded-lg shadow-sm">
                                <input type="number" value={localTaxRate} onChange={handleTaxRateChange} step="0.1" min="0" max="100" className="w-full px-2 py-2 focus:outline-none focus:ring-0 rounded-l-lg" />
                                <span className="bg-gray-50 p-2 rounded-r-lg border-l text-gray-500">%</span>
                            </div>
                        </div>
                        {/* START CODE MERGE - STEP 4 (Making Charges per Metal input fields) */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-700 border-b pb-2 pt-2">Making Charges (per Gram in $)</h4>
                            {Object.keys(localMakingChargesPerMetal).map(metal => (
                                <div key={`mc-${metal}`} className="flex justify-between items-center gap-4">
                                    <label className="text-sm font-medium w-24">{metal}:</label>
                                    <div className="flex flex-1 items-center border border-gray-300 rounded-lg shadow-sm">
                                        <span className="bg-gray-50 p-2 rounded-l-lg border-r text-gray-500">$</span>
                                        <input 
                                            type="number" 
                                            value={localMakingChargesPerMetal[metal] || 0} 
                                            onChange={(e) => handleUpdateMC(metal, e.target.value)} 
                                            step="0.01" 
                                            className="w-full px-2 py-2 focus:outline-none focus:ring-0 rounded-r-lg" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* END CODE MERGE */}
                    </div>
                    
                </div>
                <div className="p-6 border-t bg-gray-50 flex justify-end"><button onClick={handleSaveGlobalRates} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Save Global Rates & Tax</button></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-medium text-gray-900">Categories</h3></div>
                <div className="p-6">
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-6"><input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New Category Name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button></form>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">{categories.map(cat => (<span key={cat} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{cat}<button onClick={() => handleDeleteCategory(cat)} className="ml-2 text-gray-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></span>))}</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-medium text-gray-900">Metals & Purity</h3></div>
                <div className="p-6 space-y-6">
                    <div className="border-b pb-6"><h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Metal Type</h4><form onSubmit={handleAddMetal} className="flex gap-2"><input type="text" value={newMetal} onChange={(e) => setNewMetal(e.target.value)} placeholder="e.g. Rose Gold" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Metal</button></form></div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Manage Purities</h4>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4"><select value={selectedMetalForPurity} onChange={(e) => setSelectedMetalForPurity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">{Object.keys(metalConfig).map(m => <option key={m} value={m}>{m}</option>)}</select><form onSubmit={handleAddPurity} className="flex gap-2 flex-1"><input type="text" value={newPurity} onChange={(e) => setNewPurity(e.target.value)} placeholder={`Add purity for ${selectedMetalForPurity}`} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button></form></div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><div className="flex justify-between items-center mb-3"><span className="font-medium text-gray-700">{selectedMetalForPurity} Purities:</span><button onClick={() => handleDeleteMetal(selectedMetalForPurity)} className="text-xs text-red-600 hover:underline">Delete {selectedMetalForPurity} Metal</button></div><div className="flex flex-wrap gap-2">{metalConfig[selectedMetalForPurity]?.map(purity => (<span key={purity} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-gray-300 text-gray-700 shadow-sm">{purity}<button onClick={() => handleDeletePurity(selectedMetalForPurity, purity)} className="ml-1.5 text-gray-400 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></span>))}</div></div>
                    </div>
                </div>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-medium text-gray-900">Metal Compatibility Mapping</h3><p className="text-sm text-gray-500">Select which categories can use a specific metal. This filters the list in the Item Form.</p></div>
                <div className="p-6 space-y-4">
                    <select value={selectedMetalForMapping} onChange={(e) => setSelectedMetalForMapping(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4">{Object.keys(metalConfig).map(m => <option key={`map-${m}`} value={m}>{m}</option>)}</select>
                    <div className="flex flex-wrap gap-3 max-h-64 overflow-y-auto p-2 border border-dashed rounded-lg">
                        {categories.map(cat => {
                            const isMapped = metalCategoryMap[selectedMetalForMapping]?.includes(cat);
                            return (<button key={`map-cat-${cat}`} type="button" onClick={() => handleToggleMapping(selectedMetalForMapping, cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isMapped ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-500'}`}>{cat}</button>);
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}

// --- Mount Application ---
// The final export remains App for the environment's entry point
export default App;