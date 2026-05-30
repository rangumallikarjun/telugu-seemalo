import { create } from "zustand";
import { persist } from "zustand/middleware";

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_ROOM_SETTINGS = {
  floorType:    "wood",
  wallColor:    "#F5F0EB",
  wallTexture:  "paint",
  ceilingType:  "plain",
  lightMode:    "day",
  windowStyle:  "large",
  curtainStyle: "panel",
  curtainColor: "#E8E0D0",
};

const useRoomBuilderStore = create(
  persist(
    (set, get) => ({
      // ── Active room ─────────────────────────────────────────────────────
      activeRoom: null,
      setActiveRoom: (room) =>
        set({ activeRoom: room, selectedItemId: null, placingItem: null }),
      exitRoom: () =>
        set({ activeRoom: null, selectedItemId: null, placingItem: null }),

      // ── Room settings (floor/wall/ceiling) per room ─────────────────────
      roomSettings: {},
      getRoomSettings: (roomId) =>
        get().roomSettings[roomId] ?? { ...DEFAULT_ROOM_SETTINGS },
      updateRoomSettings: (roomId, patch) =>
        set((s) => ({
          roomSettings: {
            ...s.roomSettings,
            [roomId]: { ...DEFAULT_ROOM_SETTINGS, ...s.roomSettings[roomId], ...patch },
          },
        })),

      // ── Placed furniture items per room ─────────────────────────────────
      placedItemsByRoom: {},
      getPlacedItems: (roomId) => get().placedItemsByRoom[roomId] ?? [],
      addPlacedItem: (roomId, item) =>
        set((s) => ({
          placedItemsByRoom: {
            ...s.placedItemsByRoom,
            [roomId]: [...(s.placedItemsByRoom[roomId] ?? []), { ...item, id: uid() }],
          },
        })),
      updatePlacedItem: (roomId, itemId, patch) =>
        set((s) => ({
          placedItemsByRoom: {
            ...s.placedItemsByRoom,
            [roomId]: (s.placedItemsByRoom[roomId] ?? []).map((i) =>
              i.id === itemId ? { ...i, ...patch } : i
            ),
          },
        })),
      removePlacedItem: (roomId, itemId) =>
        set((s) => ({
          placedItemsByRoom: {
            ...s.placedItemsByRoom,
            [roomId]: (s.placedItemsByRoom[roomId] ?? []).filter((i) => i.id !== itemId),
          },
          selectedItemId: s.selectedItemId === itemId ? null : s.selectedItemId,
        })),
      clearRoom: (roomId) =>
        set((s) => ({
          placedItemsByRoom: { ...s.placedItemsByRoom, [roomId]: [] },
          selectedItemId: null,
        })),

      // ── Selection & transform ────────────────────────────────────────────
      selectedItemId: null,
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      transformMode: "translate",
      setTransformMode: (mode) => set({ transformMode: mode }),

      // ── Item being placed (cursor-follow ghost) ──────────────────────────
      placingItem: null,
      setPlacingItem: (item) =>
        set({ placingItem: item, selectedItemId: null }),

      // ── Sidebar state ────────────────────────────────────────────────────
      sidebarTab: "furniture",   // "furniture" | "materials" | "products"
      setSidebarTab: (t) => set({ sidebarTab: t }),
      furnitureCategory: null,
      setFurnitureCategory: (c) => set({ furnitureCategory: c }),

      // ── Selected Telugu Seemalo product detail ───────────────────────────
      selectedProduct: null,
      setSelectedProduct: (p) => set({ selectedProduct: p }),

      // ── Quote / cart ─────────────────────────────────────────────────────
      quotedItems: [],
      addToQuote: (product, roomName) =>
        set((s) => {
          const key = `${product.id}-${roomName}`;
          const ex = s.quotedItems.find((q) => q._key === key);
          if (ex) {
            return {
              quotedItems: s.quotedItems.map((q) =>
                q._key === key ? { ...q, qty: q.qty + 1 } : q
              ),
            };
          }
          return {
            quotedItems: [
              ...s.quotedItems,
              { ...product, qty: 1, room: roomName, _key: key },
            ],
          };
        }),
      updateQuoteQty: (key, qty) =>
        set((s) => ({
          quotedItems:
            qty <= 0
              ? s.quotedItems.filter((q) => q._key !== key)
              : s.quotedItems.map((q) =>
                  q._key === key ? { ...q, qty } : q
                ),
        })),
      removeFromQuote: (key) =>
        set((s) => ({
          quotedItems: s.quotedItems.filter((q) => q._key !== key),
        })),
      clearQuote: () => set({ quotedItems: [] }),

      // ── Camera preset ────────────────────────────────────────────────────
      cameraPreset: "perspective", // "perspective" | "top" | "front"
      setCameraPreset: (p) => set({ cameraPreset: p }),

      // ── Snap to grid ─────────────────────────────────────────────────────
      snapToGrid: true,
      toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      gridSize: 0.5,
    }),
    {
      name: "ts-room-builder-v2",
      partialize: (s) => ({
        placedItemsByRoom: s.placedItemsByRoom,
        roomSettings: s.roomSettings,
        quotedItems: s.quotedItems,
      }),
    }
  )
);

export default useRoomBuilderStore;
