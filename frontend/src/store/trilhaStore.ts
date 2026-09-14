import { create } from 'zustand';
import type { Trilha } from '../types';
import mockData from '../data/mockData.json';

interface TrilhaState {
  trilhas: Trilha[];
}

export const useTrilhaStore = create<TrilhaState>(() => ({
  trilhas: mockData.trilhas as Trilha[],
}));
