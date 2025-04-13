import { create } from 'zustand'

interface CompanyConfig {
  id: string
  name: string
  themeColor: string
  showShiftForm: boolean
  // 必要に応じて増やせる！
}

interface CompanyState {
  company: CompanyConfig | null
  setCompany: (config: CompanyConfig) => void
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  setCompany: (config) => set({ company: config }),
}))
