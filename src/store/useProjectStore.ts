"use client"
import { create } from 'zustand'

type State = {
  projectId: string | null
  setProjectId: (id: string) => void
}

export const useProjectStore = create<State>((set) => ({
  projectId: null,
  setProjectId: (id) => set({ projectId: id }),
}))


