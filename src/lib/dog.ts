"use client";

import { DOG } from "@/lib/demo/data";
import { createLocalStore } from "@/lib/local-store";

/** 반려견 프로필 — 온보딩(S04)에서 입력한 값. 입력 전에는 시연용 '콩이'를 보여준다 */
export interface DogProfile { name: string; breed: string; weightKg: number | null; age: string }

const store = createLocalStore<DogProfile>("sherpy.dog", DOG);

export const useDog = store.use;
export const saveDog = (d: DogProfile) => store.set(d);
