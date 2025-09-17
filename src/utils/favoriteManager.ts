/**
 * 즐겨찾기 쉼터 관리 유틸리티
 */

export interface FavoriteManager {
  getFavorites: () => string[];
  addFavorite: (shelterId: string) => void;
  removeFavorite: (shelterId: string) => void;
  isFavorite: (shelterId: string) => boolean;
  toggleFavorite: (shelterId: string) => boolean; // 반환값: 즐겨찾기 추가됨 여부
}

class FavoriteManagerImpl implements FavoriteManager {
  private readonly STORAGE_KEY = 'favoriteShelters';

  getFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const favorites = localStorage.getItem(this.STORAGE_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  addFavorite(shelterId: string): void {
    if (typeof window === 'undefined') return;
    
    const favorites = this.getFavorites();
    if (!favorites.includes(shelterId)) {
      favorites.push(shelterId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    }
  }

  removeFavorite(shelterId: string): void {
    if (typeof window === 'undefined') return;
    
    const favorites = this.getFavorites();
    const updatedFavorites = favorites.filter(id => id !== shelterId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFavorites));
  }

  isFavorite(shelterId: string): boolean {
    return this.getFavorites().includes(shelterId);
  }

  toggleFavorite(shelterId: string): boolean {
    const isFav = this.isFavorite(shelterId);
    if (isFav) {
      this.removeFavorite(shelterId);
      return false;
    } else {
      this.addFavorite(shelterId);
      return true;
    }
  }
}

export const favoriteManager = new FavoriteManagerImpl();