"use client";

import { create } from "zustand";
import { ExecutionFrame, SupportedLanguage, TopicId } from "@/lib/dsa/core/types";
import { DSA_TOPICS } from "@/lib/dsa/core/codeSnippets";
import { executeTopicMethod } from "@/lib/dsa/registry";

interface VisualizerState {
  topicId: TopicId;
  methodId: string;
  language: SupportedLanguage;
  frames: ExecutionFrame[];
  currentStep: number;
  isPlaying: boolean;
  speedMs: number;
  valuesInput: string;
  targetInput: string;
  indexInput: string;
  pointerName: string;
  bytesInput: string;
  countInput: string;
  recursionArg: string;
  forceWorstCase: boolean;
  createCycle: boolean;

  initTopic: (topicId: TopicId) => void;
  setMethod: (methodId: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setStep: (step: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setSpeedMs: (ms: number) => void;
  updateSandboxField: (
    field: Partial<{
      valuesInput: string;
      targetInput: string;
      indexInput: string;
      pointerName: string;
      bytesInput: string;
      countInput: string;
      recursionArg: string;
      forceWorstCase: boolean;
      createCycle: boolean;
    }>
  ) => void;
  runSimulation: () => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  topicId: "arrays",
  methodId: "insertAt",
  language: "ts",
  frames: [],
  currentStep: 0,
  isPlaying: false,
  speedMs: 650,
  valuesInput: "10, 20, 30, 40",
  targetInput: "99",
  indexInput: "1",
  pointerName: "p",
  bytesInput: "16",
  countInput: "4",
  recursionArg: "5",
  forceWorstCase: false,
  createCycle: false,

  initTopic: (topicId) => {
    const topic = DSA_TOPICS[topicId];
    const firstMethod = topic.methods[0];
    const dp = firstMethod.defaultParams;
    const frames = executeTopicMethod({
      topicId,
      methodId: firstMethod.id,
      valuesInput: dp.valuesInput,
      targetInput: dp.targetInput,
      indexInput: dp.indexInput,
      pointerName: dp.pointerName,
      bytesInput: dp.bytesInput,
      countInput: dp.countInput,
      recursionArg: dp.recursionArg,
      forceWorstCase: Boolean(dp.forceWorstCase),
      createCycle: Boolean(dp.createCycle),
    });

    set({
      topicId,
      methodId: firstMethod.id,
      frames,
      currentStep: 0,
      isPlaying: false,
      valuesInput: dp.valuesInput ?? "",
      targetInput: dp.targetInput ?? "",
      indexInput: dp.indexInput ?? "",
      pointerName: dp.pointerName ?? "p",
      bytesInput: dp.bytesInput ?? "16",
      countInput: dp.countInput ?? "4",
      recursionArg: dp.recursionArg ?? "5",
      forceWorstCase: Boolean(dp.forceWorstCase),
      createCycle: Boolean(dp.createCycle),
    });
  },

  setMethod: (methodId) => {
    const { topicId } = get();
    const method = DSA_TOPICS[topicId].methods.find((m) => m.id === methodId) ?? DSA_TOPICS[topicId].methods[0];
    const dp = method.defaultParams;
    const frames = executeTopicMethod({
      topicId,
      methodId: method.id,
      valuesInput: dp.valuesInput,
      targetInput: dp.targetInput,
      indexInput: dp.indexInput,
      pointerName: dp.pointerName,
      bytesInput: dp.bytesInput,
      countInput: dp.countInput,
      recursionArg: dp.recursionArg,
      forceWorstCase: Boolean(dp.forceWorstCase),
      createCycle: Boolean(dp.createCycle),
    });

    set({
      methodId: method.id,
      frames,
      currentStep: 0,
      isPlaying: false,
      valuesInput: dp.valuesInput ?? "",
      targetInput: dp.targetInput ?? "",
      indexInput: dp.indexInput ?? "",
      pointerName: dp.pointerName ?? "p",
      bytesInput: dp.bytesInput ?? "16",
      countInput: dp.countInput ?? "4",
      recursionArg: dp.recursionArg ?? "5",
      forceWorstCase: Boolean(dp.forceWorstCase),
      createCycle: Boolean(dp.createCycle),
    });
  },

  setLanguage: (language) => set({ language }),

  setStep: (step) => {
    const maxStep = Math.max(0, get().frames.length - 1);
    const clamped = Math.max(0, Math.min(maxStep, step));
    set({ currentStep: clamped, isPlaying: false });
  },

  stepForward: () => {
    const { currentStep, frames } = get();
    if (currentStep < frames.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1, isPlaying: false });
    }
  },

  togglePlay: () => {
    const { isPlaying, currentStep, frames } = get();
    if (!isPlaying && currentStep >= frames.length - 1) {
      set({ currentStep: 0, isPlaying: true });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setSpeedMs: (speedMs) => set({ speedMs }),

  updateSandboxField: (field) => set((prev) => ({ ...prev, ...field })),

  runSimulation: () => {
    const state = get();
    const frames = executeTopicMethod({
      topicId: state.topicId,
      methodId: state.methodId,
      valuesInput: state.valuesInput,
      targetInput: state.targetInput,
      indexInput: state.indexInput,
      pointerName: state.pointerName,
      bytesInput: state.bytesInput,
      countInput: state.countInput,
      recursionArg: state.recursionArg,
      forceWorstCase: state.forceWorstCase,
      createCycle: state.createCycle,
    });
    set({ frames, currentStep: 0, isPlaying: false });
  },
}));