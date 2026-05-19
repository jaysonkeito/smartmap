import { create } from 'zustand';

export type ViewType = 'home' | 'map' | 'profile' | 'help' | 'admin';

export interface UserInfo {
  userId: string;
  name: string;
  role: string;
  isAdmin: boolean;
}

export interface RoomInfo {
  id: number;
  name: string;
  buildingId: number;
}

export interface BuildingInfo {
  id: number;
  name: string;
  description: string | null;
  coordinates: string;
  color: string | null;
  rooms: RoomInfo[];
}

export interface RoomOccupant {
  userId: string;
  name: string;
  role: string;
  loginTime: string;
}

export interface RoomStatus {
  room: {
    id: number;
    name: string;
    buildingName: string;
  };
  faculty: RoomOccupant[];
  staff: RoomOccupant[];
  students: RoomOccupant[];
}

export interface SearchResult {
  rooms: { id: number; name: string; buildingName: string }[];
  users: { userId: string; name: string; role: string; currentRoom: string | null }[];
}

interface AppState {
  // Auth
  user: UserInfo | null;
  isLoggedIn: boolean;
  flashMessage: { type: 'success' | 'error'; text: string } | null;
  login: (user: UserInfo) => void;
  logout: () => void;
  setFlashMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;

  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Building/Room selection
  selectedBuilding: BuildingInfo | null;
  setSelectedBuilding: (building: BuildingInfo | null) => void;
  selectedRoomStatus: RoomStatus | null;
  setSelectedRoomStatus: (status: RoomStatus | null) => void;

  // Room login status
  currentRoomLogin: { roomId: number; roomName: string } | null;
  setCurrentRoomLogin: (login: { roomId: number; roomName: string } | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult | null;
  setSearchResults: (results: SearchResult | null) => void;

  // Buildings data
  buildings: BuildingInfo[];
  setBuildings: (buildings: BuildingInfo[]) => void;

  // Active logins by building
  activeLoginsByBuilding: Record<number, number>;
  setActiveLoginsByBuilding: (logins: Record<number, number>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isLoggedIn: false,
  flashMessage: null,
  login: (user) => set({ user, isLoggedIn: true, flashMessage: null }),
  logout: () =>
    set({
      user: null,
      isLoggedIn: false,
      currentView: 'home',
      selectedBuilding: null,
      selectedRoomStatus: null,
      currentRoomLogin: null,
      flashMessage: null,
    }),
  setFlashMessage: (msg) => set({ flashMessage: msg }),

  // Navigation
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),

  // Building/Room selection
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  selectedRoomStatus: null,
  setSelectedRoomStatus: (status) => set({ selectedRoomStatus: status }),

  // Room login
  currentRoomLogin: null,
  setCurrentRoomLogin: (login) => set({ currentRoomLogin: login }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: null,
  setSearchResults: (results) => set({ searchResults: results }),

  // Buildings data
  buildings: [],
  setBuildings: (buildings) => set({ buildings }),

  // Active logins by building
  activeLoginsByBuilding: {},
  setActiveLoginsByBuilding: (logins) => set({ activeLoginsByBuilding: logins }),
}));
