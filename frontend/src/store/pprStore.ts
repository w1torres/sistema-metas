import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PPRFaixa, Role } from '../types';
import { GRUPO_COORDENADORES, GRUPO_DEMAIS, GRUPO_GERENTES, roleParaGrupoPPR } from '../utils/ppr';

interface NovaFaixaInput {
  cargo: string;
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}

interface FaixaRascunho {
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}

interface PPRState {
  faixas: PPRFaixa[];
  addFaixa: (input: NovaFaixaInput) => { ok: true } | { ok: false; error: string };
  updateFaixa: (id: string, input: NovaFaixaInput) => { ok: true } | { ok: false; error: string };
  deleteFaixa: (id: string) => void;
  faixaPara: (role: Role, cargo: string | undefined, percentual: number) => PPRFaixa | undefined;
  // Substitui de uma vez todas as faixas de um cargo — usado pela edição em lote da
  // Tabela PPR, para evitar falsos positivos de sobreposição ao salvar várias faixas
  // editadas ao mesmo tempo (validar sequencialmente contra o estado antigo gera
  // conflitos espúrios mesmo quando o conjunto final é consistente).
  substituirFaixasDoCargo: (cargo: string, faixas: FaixaRascunho[]) => { ok: true } | { ok: false; error: string };
}

function newId(): string {
  return `ppr-${crypto.randomUUID().slice(0, 8)}`;
}

function validar(input: NovaFaixaInput, faixasExistentes: PPRFaixa[], ignorarId?: string): string | null {
  if (!input.cargo.trim()) return 'Cargo é obrigatório';
  if (input.faixaMin < 0 || input.faixaMin > 999) return 'Faixa mínima inválida';
  if (input.faixaMax <= input.faixaMin) return 'Faixa máxima deve ser maior que a mínima';
  if (input.multiplo < 0) return 'Múltiplo não pode ser negativo';

  const cargo = input.cargo.trim().toUpperCase();
  const sobrepoe = faixasExistentes.some(
    (f) =>
      f.id !== ignorarId &&
      f.cargo === cargo &&
      input.faixaMin < f.faixaMax &&
      input.faixaMax > f.faixaMin,
  );
  if (sobrepoe) return 'Já existe uma faixa cadastrada para este cargo que se sobrepõe a este intervalo';

  return null;
}

// Bandas comuns às 3 colunas da Tabela de Múltiplos de PPR — cada usuário (ver
// roleParaGrupoPPR) cai em um dos 3 grupos abaixo pelo seu Papel/Perfil, e
// todos os grupos usam as mesmas 8 faixas de atingimento, só o múltiplo pago
// varia por grupo.
const BANDAS_MULTIPLO: { faixaMin: number; faixaMax: number; multiplos: Record<string, number> }[] = [
  { faixaMin: 95, faixaMax: 999, multiplos: { [GRUPO_GERENTES]: 3, [GRUPO_COORDENADORES]: 2.5, [GRUPO_DEMAIS]: 2 } },
  { faixaMin: 92.5, faixaMax: 94.99, multiplos: { [GRUPO_GERENTES]: 2.75, [GRUPO_COORDENADORES]: 2.25, [GRUPO_DEMAIS]: 1.75 } },
  { faixaMin: 90, faixaMax: 92.49, multiplos: { [GRUPO_GERENTES]: 2.5, [GRUPO_COORDENADORES]: 2, [GRUPO_DEMAIS]: 1.5 } },
  { faixaMin: 85, faixaMax: 89.99, multiplos: { [GRUPO_GERENTES]: 2.25, [GRUPO_COORDENADORES]: 1.75, [GRUPO_DEMAIS]: 1.25 } },
  { faixaMin: 80, faixaMax: 84.99, multiplos: { [GRUPO_GERENTES]: 2, [GRUPO_COORDENADORES]: 1.5, [GRUPO_DEMAIS]: 1 } },
  { faixaMin: 75, faixaMax: 79.99, multiplos: { [GRUPO_GERENTES]: 1.75, [GRUPO_COORDENADORES]: 1.25, [GRUPO_DEMAIS]: 0.75 } },
  { faixaMin: 70, faixaMax: 74.99, multiplos: { [GRUPO_GERENTES]: 1.5, [GRUPO_COORDENADORES]: 1, [GRUPO_DEMAIS]: 0.5 } },
  { faixaMin: 0, faixaMax: 69.99, multiplos: { [GRUPO_GERENTES]: 0, [GRUPO_COORDENADORES]: 0, [GRUPO_DEMAIS]: 0 } },
];

const SEED_FAIXAS: PPRFaixa[] = BANDAS_MULTIPLO.flatMap((banda, idx) =>
  Object.entries(banda.multiplos).map(([cargo, multiplo]) => ({
    id: `ppr-seed-${idx}-${cargo.replace(/\s+/g, '-')}`,
    cargo,
    faixaMin: banda.faixaMin,
    faixaMax: banda.faixaMax,
    multiplo,
  })),
);

export const usePPRStore = create<PPRState>()(
  persist(
    (set, get) => ({
      faixas: SEED_FAIXAS,

      addFaixa: (input) => {
        const erro = validar(input, get().faixas);
        if (erro) return { ok: false, error: erro };

        const nova: PPRFaixa = { id: newId(), ...input, cargo: input.cargo.trim().toUpperCase() };
        set((state) => ({ faixas: [...state.faixas, nova] }));
        return { ok: true };
      },

      updateFaixa: (id, input) => {
        const erro = validar(input, get().faixas, id);
        if (erro) return { ok: false, error: erro };

        set((state) => ({
          faixas: state.faixas.map((f) => (f.id === id ? { ...f, ...input, cargo: input.cargo.trim().toUpperCase() } : f)),
        }));
        return { ok: true };
      },

      deleteFaixa: (id) => {
        set((state) => ({ faixas: state.faixas.filter((f) => f.id !== id) }));
      },

      substituirFaixasDoCargo: (cargo, faixas) => {
        const cargoNorm = cargo.trim().toUpperCase();
        if (!cargoNorm) return { ok: false, error: 'Cargo é obrigatório' };

        // Lista vazia = remover o cargo inteiro da tabela
        if (faixas.length === 0) {
          set((state) => ({ faixas: state.faixas.filter((f) => f.cargo !== cargoNorm) }));
          return { ok: true };
        }

        for (const f of faixas) {
          if (Number.isNaN(f.faixaMin) || f.faixaMin < 0 || f.faixaMin > 999) return { ok: false, error: 'Faixa mínima inválida' };
          if (Number.isNaN(f.faixaMax) || f.faixaMax <= f.faixaMin) return { ok: false, error: 'Faixa máxima deve ser maior que a mínima' };
          if (Number.isNaN(f.multiplo) || f.multiplo < 0) return { ok: false, error: 'Múltiplo não pode ser negativo' };
        }

        const ordenadas = [...faixas].sort((a, b) => a.faixaMin - b.faixaMin);
        for (let i = 1; i < ordenadas.length; i += 1) {
          if (ordenadas[i].faixaMin < ordenadas[i - 1].faixaMax) {
            return {
              ok: false,
              error: `As faixas ${ordenadas[i - 1].faixaMin}%–${ordenadas[i - 1].faixaMax}% e ${ordenadas[i].faixaMin}%–${ordenadas[i].faixaMax}% se sobrepõem`,
            };
          }
        }

        const novasFaixas: PPRFaixa[] = ordenadas.map((f) => ({ id: newId(), cargo: cargoNorm, ...f }));
        set((state) => ({ faixas: [...state.faixas.filter((f) => f.cargo !== cargoNorm), ...novasFaixas] }));
        return { ok: true };
      },

      faixaPara: (role, cargo, percentual) => {
        const grupo = roleParaGrupoPPR(role, cargo);
        if (!grupo) return undefined;
        const faixasCargo = get()
          .faixas.filter((f) => f.cargo === grupo)
          .sort((a, b) => a.faixaMin - b.faixaMin);
        if (faixasCargo.length === 0) return undefined;

        const exata = faixasCargo.find((f) => percentual >= f.faixaMin && percentual <= f.faixaMax);
        if (exata) return exata;

        const ultima = faixasCargo[faixasCargo.length - 1];
        return percentual > ultima.faixaMax ? ultima : undefined;
      },
    }),
    // v2: a Tabela de Múltiplos passou de "uma faixa por cargo individual" para
    // "3 grupos de cargos" (ver BANDAS_MULTIPLO) — nome novo para não herdar o
    // formato antigo de quem já tinha o app aberto (persistido no localStorage).
    { name: 'metas-ppr-v2' },
  ),
);
