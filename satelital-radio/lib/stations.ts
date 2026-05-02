import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Interfaz para representar una emisora de radio desde Firestore
 */
export interface Radio {
  id: string;
  name: string;
  country?: string;
  streamUrl: string;
  logoUrl?: string;
  isFavorite?: boolean;
  tags?: string[];
}

/**
 * Obtiene todas las emisoras públicas de la colección "public_radios" en Firestore
 */
export async function getPublicRadios(): Promise<Radio[]> {
  const col = collection(db, "public_radios");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name ?? "",
      country: data.country ?? "",
      streamUrl: data.streamUrl ?? data.stream_url ?? data.stream ?? "",
      logoUrl: data.logoUrl ?? data.logo_url ?? data.logo ?? "",
      isFavorite: !!data.isFavorite,
      tags: Array.isArray(data.tags) ? data.tags : [],
    } as Radio;
  });
}
