'use client';

import { create } from 'zustand';
import type { TransformStep, TransformData, TransformResult } from '@/lib/transformer/types';
import { executePipeline, createStep, generateStepId } from '@/lib/transformer';

interface TransformState {
  // Source data
  sourceData: TransformData | null;

  // Transform pipeline
  steps: TransformStep[];

  // Preview result
  previewResult: (TransformResult & { stepResults?: TransformResult[] }) | null;
  isPreviewLoading: boolean;

  // Actions
  setSourceData: (data: TransformData | null) => void;
  addStep: (type: TransformStep['type']) => void;
  removeStep: (id: string) => void;
  updateStep: (id: string, updates: Partial<TransformStep>) => void;
  updateStepConfig: (id: string, config: Partial<TransformStep['config']>) => void;
  moveStep: (fromIndex: number, toIndex: number) => void;
  toggleStep: (id: string) => void;
  duplicateStep: (id: string) => void;
  clearSteps: () => void;
  executePreview: () => void;
  reset: () => void;
}

const initialState = {
  sourceData: null,
  steps: [],
  previewResult: null,
  isPreviewLoading: false,
};

export const useTransformStore = create<TransformState>((set, get) => ({
  ...initialState,

  setSourceData: (data) => {
    set({ sourceData: data, previewResult: null, steps: [] });
  },

  addStep: (type) => {
    const { sourceData, previewResult, steps } = get();

    // Get current headers from preview or source
    const headers = previewResult?.headers || sourceData?.headers || [];

    const newStep = createStep(type, headers);
    set({ steps: [...steps, newStep] });

    // Auto-execute preview
    get().executePreview();
  },

  removeStep: (id) => {
    set((state) => ({
      steps: state.steps.filter((s) => s.id !== id),
    }));
    get().executePreview();
  },

  updateStep: (id, updates) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === id ? ({ ...s, ...updates } as TransformStep) : s
      ),
    }));
    get().executePreview();
  },

  updateStepConfig: (id, configUpdates) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === id
          ? ({ ...s, config: { ...s.config, ...configUpdates } } as TransformStep)
          : s
      ),
    }));
    get().executePreview();
  },

  moveStep: (fromIndex, toIndex) => {
    set((state) => {
      const newSteps = [...state.steps];
      const [removed] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, removed);
      return { steps: newSteps };
    });
    get().executePreview();
  },

  toggleStep: (id) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === id ? ({ ...s, enabled: !s.enabled } as TransformStep) : s
      ),
    }));
    get().executePreview();
  },

  duplicateStep: (id) => {
    const { steps } = get();
    const stepIndex = steps.findIndex((s) => s.id === id);
    if (stepIndex === -1) return;

    const stepToDuplicate = steps[stepIndex];
    const newStep = {
      ...stepToDuplicate,
      id: generateStepId(),
      config: { ...stepToDuplicate.config },
    } as TransformStep;

    const newSteps = [...steps];
    newSteps.splice(stepIndex + 1, 0, newStep);
    set({ steps: newSteps });
    get().executePreview();
  },

  clearSteps: () => {
    set({ steps: [], previewResult: null });
  },

  executePreview: () => {
    const { sourceData, steps } = get();

    if (!sourceData) {
      set({ previewResult: null });
      return;
    }

    if (steps.length === 0) {
      set({
        previewResult: {
          success: true,
          headers: sourceData.headers,
          rows: sourceData.rows,
          rowsAffected: 0,
        },
      });
      return;
    }

    set({ isPreviewLoading: true });

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const result = executePipeline(sourceData, steps);
      set({ previewResult: result, isPreviewLoading: false });
    }, 0);
  },

  reset: () => {
    set(initialState);
  },
}));
