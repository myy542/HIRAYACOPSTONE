// firebase/firestore.js
import { db } from './config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ============================================
// ENROLLMENT FUNCTIONS
// ============================================

// Save new enrollment
export async function saveEnrollment(data) {
    try {
        const docRef = await addDoc(collection(db, "enrollments"), {
            ...data,
            createdAt: serverTimestamp(),
            status: 'pending'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving enrollment: ", error);
        return { success: false, error: error.message };
    }
}

// Get all enrollments
export async function getAllEnrollments() {
    try {
        const q = query(collection(db, "enrollments"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const enrollments = [];
        querySnapshot.forEach((doc) => {
            enrollments.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: enrollments };
    } catch (error) {
        console.error("Error getting enrollments: ", error);
        return { success: false, error: error.message };
    }
}

// Get enrollment by ID
export async function getEnrollmentById(id) {
    try {
        const docRef = doc(db, "enrollments", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: "Enrollment not found" };
        }
    } catch (error) {
        console.error("Error getting enrollment: ", error);
        return { success: false, error: error.message };
    }
}

// Update enrollment status
export async function updateEnrollmentStatus(id, status) {
    try {
        const docRef = doc(db, "enrollments", id);
        await updateDoc(docRef, {
            status: status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating enrollment: ", error);
        return { success: false, error: error.message };
    }
}

// Delete enrollment
export async function deleteEnrollment(id) {
    try {
        await deleteDoc(doc(db, "enrollments", id));
        return { success: true };
    } catch (error) {
        console.error("Error deleting enrollment: ", error);
        return { success: false, error: error.message };
    }
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

// Save user profile after registration
export async function saveUserProfile(userId, data) {
    try {
        await setDoc(doc(db, "users", userId), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving user profile: ", error);
        return { success: false, error: error.message };
    }
}

// Get user profile
export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: "User not found" };
        }
    } catch (error) {
        console.error("Error getting user profile: ", error);
        return { success: false, error: error.message };
    }
}

console.log('📁 Firestore functions ready!');