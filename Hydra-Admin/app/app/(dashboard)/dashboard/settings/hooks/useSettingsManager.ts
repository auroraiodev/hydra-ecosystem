'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { tcgsAPI, settingsAPI, notificationsAPI, usersAPI, maintenanceAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Tcg { id: string; name: string; display_name: string; }
interface User { id: string; email: string; }
interface AppSettings {
  siteName: string; adminEmail: string; supportEmail: string;
  maxProductsPerPage: string | number; taxRate: string | number;
  shippingCost: string | number; enableNotifications: boolean;
  enableTwoFactor: boolean; importationTax: string | number;
  importationProfit: string | number; importationFixedFee: string | number;
  siteLogo: string; siteLoader: string;
}

interface SettingsState {
  settings: AppSettings; tcgs: Tcg[]; loadingTcgs: boolean; loadingSettings: boolean;
  savingSettings: boolean; testNotif: { userId: string; title: string; message: string };
  sendingNotif: boolean; userSearchOpen: boolean; users: User[];
  loadingUsers: boolean; userSearchQuery: string; clearingCache: boolean;
  exportingDb: boolean; resettingFactory: boolean;
  tcgDialogOpen: boolean; newTcgName: string; newTcgDisplayName: string; savingTcg: boolean;
}

type SettingsAction =
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'UPDATE_SETTINGS'; update: Partial<AppSettings> }
  | { type: 'SET_TCGS'; tcgs: Tcg[] }
  | { type: 'SET_LOADING_TCGS'; loading: boolean }
  | { type: 'SET_LOADING_SETTINGS'; loading: boolean }
  | { type: 'SET_SAVING_SETTINGS'; saving: boolean }
  | { type: 'UPDATE_TEST_NOTIF'; update: Partial<{ userId: string; title: string; message: string }> }
  | { type: 'SET_SENDING_NOTIF'; sending: boolean }
  | { type: 'SET_USER_SEARCH_OPEN'; open: boolean }
  | { type: 'SET_USERS'; users: User[] }
  | { type: 'SET_LOADING_USERS'; loading: boolean }
  | { type: 'SET_USER_SEARCH_QUERY'; query: string }
  | { type: 'SET_CLEARING_CACHE'; clearing: boolean }
  | { type: 'SET_EXPORTING_DB'; exporting: boolean }
  | { type: 'SET_RESETTING_FACTORY'; resetting: boolean }
  | { type: 'SET_TCG_DIALOG_OPEN'; open: boolean }
  | { type: 'SET_NEW_TCG_NAME'; name: string }
  | { type: 'SET_NEW_TCG_DISPLAY_NAME'; displayName: string }
  | { type: 'SET_SAVING_TCG'; saving: boolean }
  | { type: 'ADD_TCG'; tcg: Tcg }
  | { type: 'REMOVE_TCG'; id: string };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_SETTINGS': return { ...state, settings: action.settings };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.update } };
    case 'SET_TCGS': return { ...state, tcgs: action.tcgs };
    case 'SET_LOADING_TCGS': return { ...state, loadingTcgs: action.loading };
    case 'SET_LOADING_SETTINGS': return { ...state, loadingSettings: action.loading };
    case 'SET_SAVING_SETTINGS': return { ...state, savingSettings: action.saving };
    case 'UPDATE_TEST_NOTIF': return { ...state, testNotif: { ...state.testNotif, ...action.update } };
    case 'SET_SENDING_NOTIF': return { ...state, sendingNotif: action.sending };
    case 'SET_USER_SEARCH_OPEN': return { ...state, userSearchOpen: action.open };
    case 'SET_USERS': return { ...state, users: action.users };
    case 'SET_LOADING_USERS': return { ...state, loadingUsers: action.loading };
    case 'SET_USER_SEARCH_QUERY': return { ...state, userSearchQuery: action.query };
    case 'SET_CLEARING_CACHE': return { ...state, clearingCache: action.clearing };
    case 'SET_EXPORTING_DB': return { ...state, exportingDb: action.exporting };
    case 'SET_RESETTING_FACTORY': return { ...state, resettingFactory: action.resetting };
    case 'SET_TCG_DIALOG_OPEN': return { ...state, tcgDialogOpen: action.open };
    case 'SET_NEW_TCG_NAME': return { ...state, newTcgName: action.name };
    case 'SET_NEW_TCG_DISPLAY_NAME': return { ...state, newTcgDisplayName: action.displayName };
    case 'SET_SAVING_TCG': return { ...state, savingTcg: action.saving };
    case 'ADD_TCG': return { ...state, tcgs: [...state.tcgs, action.tcg] };
    case 'REMOVE_TCG': return { ...state, tcgs: state.tcgs.filter((t) => t.id !== action.id) };
    default: return state;
  }
}

const initialState: SettingsState = {
  settings: {
    siteName: 'Hydra MTG', adminEmail: 'admin@example.com', supportEmail: 'support@example.com',
    maxProductsPerPage: '20', taxRate: '8', shippingCost: '10', enableNotifications: true,
    enableTwoFactor: false, importationTax: '0.20', importationProfit: '0.20',
    importationFixedFee: '0', siteLogo: '', siteLoader: '',
  },
  tcgs: [], loadingTcgs: true, loadingSettings: true, savingSettings: false,
  testNotif: { userId: '', title: '🔔 Test', message: 'Esta es una notificación de prueba.' },
  sendingNotif: false, userSearchOpen: false, users: [], loadingUsers: false,
  userSearchQuery: '', clearingCache: false, exportingDb: false, resettingFactory: false,
  tcgDialogOpen: false, newTcgName: '', newTcgDisplayName: '', savingTcg: false,
};

export function useSettingsManager() {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  useEffect(() => {
    if (!state.userSearchOpen) return;
    const timer = setTimeout(async () => {
      dispatch({ type: 'SET_LOADING_USERS', loading: true });
      try {
        const response = await usersAPI.list(state.userSearchQuery);
        dispatch({ type: 'SET_USERS', users: Array.isArray(response) ? response : (response?.data ?? []) });
      } catch { /* empty */ } finally { dispatch({ type: 'SET_LOADING_USERS', loading: false }); }
    }, state.userSearchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [state.userSearchOpen, state.userSearchQuery]);

  useEffect(() => {
    const init = async () => {
      try {
        const raw = await settingsAPI.get();
        const data = raw?.data || raw;
        if (data && Object.keys(data).length > 0) {
          dispatch({ type: 'SET_SETTINGS', settings: {
            siteName: data.site_name || '',
            adminEmail: data.admin_email || '',
            supportEmail: data.support_email || '',
            maxProductsPerPage: data.max_products_per_page || 20,
            taxRate: data.tax_rate || 0,
            shippingCost: data.shipping_cost || 0,
            enableNotifications: data.enable_notifications === 'true',
            enableTwoFactor: data.enable_two_factor === 'true',
            importationTax: data.importTaxRate || 0,
            importationProfit: data.profitRate || 0,
            importationFixedFee: data.importation_fixed_fee || 0,
            siteLogo: data.site_logo || '',
            siteLoader: data.site_loader || '',
          }});
        }
      } catch { toast.error('No se pudo cargar la configuración.'); }
      finally { dispatch({ type: 'SET_LOADING_SETTINGS', loading: false }); }

      try {
        const data = await tcgsAPI.list();
        dispatch({ type: 'SET_TCGS', tcgs: Array.isArray(data) ? data : (data?.tcgs ?? []) });
      } catch { toast.error('No se pudieron cargar los TCGs.'); }
      finally { dispatch({ type: 'SET_LOADING_TCGS', loading: false }); }
    };
    init();
  }, []);

  const handleSave = async () => {
    dispatch({ type: 'SET_SAVING_SETTINGS', saving: true });
    try {
      await settingsAPI.update({
        site_name: state.settings.siteName,
        admin_email: state.settings.adminEmail,
        support_email: state.settings.supportEmail,
        max_products_per_page: state.settings.maxProductsPerPage,
        tax_rate: state.settings.taxRate,
        shipping_cost: state.settings.shippingCost,
        enable_notifications: String(state.settings.enableNotifications),
        enable_two_factor: String(state.settings.enableTwoFactor),
        importTaxRate: state.settings.importationTax,
        profitRate: state.settings.importationProfit,
        importation_fixed_fee: state.settings.importationFixedFee,
        site_logo: state.settings.siteLogo,
        site_loader: state.settings.siteLoader,
      });
      // Re-fetch to confirm persistence
      const raw = await settingsAPI.get();
      const saved = raw?.data || raw;
      console.log('[Settings] GET after save response:', saved);
      if (saved && Object.keys(saved).length > 0) {
        dispatch({ type: 'SET_SETTINGS', settings: {
          siteName: saved.site_name || '',
          adminEmail: saved.admin_email || '',
          supportEmail: saved.support_email || '',
          maxProductsPerPage: saved.max_products_per_page || 20,
          taxRate: saved.tax_rate || 0,
          shippingCost: saved.shipping_cost || 0,
          enableNotifications: saved.enable_notifications === 'true',
          enableTwoFactor: saved.enable_two_factor === 'true',
          importationTax: saved.importTaxRate || 0,
          importationProfit: saved.profitRate || 0,
          importationFixedFee: saved.importation_fixed_fee || 0,
          siteLogo: saved.site_logo || '',
          siteLoader: saved.site_loader || '',
        }});
      }
      toast.success('Configuraciones guardadas');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'desconocido';
      toast.error(`Error al guardar: ${msg}`);
    }
    finally { dispatch({ type: 'SET_SAVING_SETTINGS', saving: false }); }
  };

  const refreshTcgs = useCallback(async () => {
    try {
      const data = await tcgsAPI.list();
      dispatch({ type: 'SET_TCGS', tcgs: Array.isArray(data) ? data : (data?.tcgs ?? []) });
    } catch {
      toast.error('Error al recargar TCGs');
    }
  }, []);

  const handleTcgAdd = () => {
    dispatch({ type: 'SET_NEW_TCG_NAME', name: '' });
    dispatch({ type: 'SET_NEW_TCG_DISPLAY_NAME', displayName: '' });
    dispatch({ type: 'SET_TCG_DIALOG_OPEN', open: true });
  };

  const handleTcgCreate = async () => {
    if (!state.newTcgName.trim() || !state.newTcgDisplayName.trim()) {
      toast.error('Nombre y nombre visible son requeridos');
      return;
    }
    dispatch({ type: 'SET_SAVING_TCG', saving: true });
    try {
      await tcgsAPI.create({ name: state.newTcgName.trim(), display_name: state.newTcgDisplayName.trim() });
      toast.success('TCG creado');
      dispatch({ type: 'SET_TCG_DIALOG_OPEN', open: false });
      await refreshTcgs();
    } catch {
      toast.error('Error al crear TCG');
    } finally {
      dispatch({ type: 'SET_SAVING_TCG', saving: false });
    }
  };

  const handleTcgDelete = async (id: string) => {
    try {
      await tcgsAPI.delete(id);
      toast.success('TCG eliminado');
      dispatch({ type: 'REMOVE_TCG', id });
    } catch {
      toast.error('Error al eliminar TCG');
    }
  };

  const handleSendTestNotif = async () => {
    dispatch({ type: 'SET_SENDING_NOTIF', sending: true });
    try {
      await notificationsAPI.broadcast({
        ...(state.testNotif.userId ? { userId: state.testNotif.userId } : {}),
        title: state.testNotif.title,
        message: state.testNotif.message
      });
      toast.success('Notificación enviada');
    } catch { toast.error('Error al enviar'); }
    finally { dispatch({ type: 'SET_SENDING_NOTIF', sending: false }); }
  };

  const handleClearCache = async () => {
    dispatch({ type: 'SET_CLEARING_CACHE', clearing: true });
    try { await maintenanceAPI.clearCache(); toast.success('Caché limpiada'); }
    catch { toast.error('Error'); } finally { dispatch({ type: 'SET_CLEARING_CACHE', clearing: false }); }
  };

  const handleExportDb = async () => {
    dispatch({ type: 'SET_EXPORTING_DB', exporting: true });
    try { const res = await maintenanceAPI.backupDatabase(); if (res?.url) window.open(res.url, '_blank'); }
    catch { toast.error('Error'); } finally { dispatch({ type: 'SET_EXPORTING_DB', exporting: false }); }
  };

  const handleFactoryReset = async () => {
    if (!confirm('¿Seguro?')) return;
    dispatch({ type: 'SET_RESETTING_FACTORY', resetting: true });
    try { await maintenanceAPI.restoreDatabase('factory-reset', true); toast.success('Restaurado'); }
    catch { toast.error('Error'); } finally { dispatch({ type: 'SET_RESETTING_FACTORY', resetting: false }); }
  };

  return {
    state,
    dispatch,
    handleSave,
    handleTcgAdd,
    handleTcgCreate,
    handleTcgDelete,
    handleSendTestNotif,
    handleClearCache,
    handleExportDb,
    handleFactoryReset,
  };
}
