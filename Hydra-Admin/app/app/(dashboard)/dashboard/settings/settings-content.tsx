'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpinnerIos20Regular } from '@fluentui/react-icons';

import { GeneralSettings } from './components/GeneralSettings';
import { TaxSettings } from './components/TaxSettings';
import { FeatureSettings } from './components/FeatureSettings';
import { BrandSettings } from './components/BrandSettings';
import { TcgSettings } from './components/TcgSettings';
import { NotificationTest } from './components/NotificationTest';
import { MaintenanceActions } from './components/MaintenanceActions';

import { useSettingsManager } from './hooks/useSettingsManager';

export default function SettingsContent() {
  const {
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
  } = useSettingsManager();

  const {
    settings, tcgs, loadingTcgs, loadingSettings, savingSettings,
    testNotif, sendingNotif, userSearchOpen, users, loadingUsers,
    userSearchQuery, clearingCache, exportingDb, resettingFactory,
    tcgDialogOpen, newTcgName, newTcgDisplayName, savingTcg,
  } = state;

  if (loadingSettings) return (
    <PageLayout>
      <PageHeader title="Configuración" description="Gestiona la configuración del panel." />
      <div className="space-y-4 max-w-3xl">
        {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map(key => <Skeleton key={key} className="h-40 w-full rounded-xl" />)}
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      <PageHeader title="Configuración" description="Gestiona la configuración del panel." />
      <div className="space-y-4 max-w-3xl pb-20">
        <GeneralSettings settings={settings} onUpdate={(u) => dispatch({ type: 'UPDATE_SETTINGS', update: u })} />
        <TaxSettings settings={settings} onUpdate={(u) => dispatch({ type: 'UPDATE_SETTINGS', update: u })} />
        <FeatureSettings settings={settings} onUpdate={(u) => dispatch({ type: 'UPDATE_SETTINGS', update: u })} />
        <BrandSettings settings={settings} onUpdate={(u) => dispatch({ type: 'UPDATE_SETTINGS', update: u })} />
        <TcgSettings tcgs={tcgs} loading={loadingTcgs} onAdd={handleTcgAdd} onDelete={handleTcgDelete} />
        <Dialog open={tcgDialogOpen} onOpenChange={(o) => dispatch({ type: 'SET_TCG_DIALOG_OPEN', open: o })}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nuevo TCG</DialogTitle>
              <DialogDescription>Agrega un nuevo juego soportado en la plataforma</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tcgName">Código del juego</Label>
                <Input
                  id="tcgName"
                  value={newTcgName}
                  onChange={(e) => dispatch({ type: 'SET_NEW_TCG_NAME', name: e.target.value })}
                  placeholder="mtg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tcgDisplayName">Nombre visible</Label>
                <Input
                  id="tcgDisplayName"
                  value={newTcgDisplayName}
                  onChange={(e) => dispatch({ type: 'SET_NEW_TCG_DISPLAY_NAME', displayName: e.target.value })}
                  placeholder="Magic: The Gathering"
                />
              </div>
              <Button className="w-full" onClick={handleTcgCreate} disabled={savingTcg}>
                {savingTcg ? <SpinnerIos20Regular className="size-4 animate-spin mr-2" /> : null}
                Crear TCG
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <NotificationTest
          testNotif={testNotif}
          onUpdate={(u) => dispatch({ type: 'UPDATE_TEST_NOTIF', update: u })}
          onSend={handleSendTestNotif}
          sending={sendingNotif}
          users={users}
          loadingUsers={loadingUsers}
          userSearchOpen={userSearchOpen}
          onUserSearchOpenChange={(o) => dispatch({ type: 'SET_USER_SEARCH_OPEN', open: o })}
          userSearchQuery={userSearchQuery}
          onUserSearchQueryChange={(q) => dispatch({ type: 'SET_USER_SEARCH_QUERY', query: q })}
        />
        <MaintenanceActions
          onClearCache={handleClearCache}
          clearingCache={clearingCache}
          onExportDb={handleExportDb}
          exportingDb={exportingDb}
          onFactoryReset={handleFactoryReset}
          resettingFactory={resettingFactory}
        />
        <div className="fixed bottom-8 right-8 z-50">
          <Button size="lg" onClick={handleSave} disabled={savingSettings} className="shadow-2xl rounded-full px-8 h-14">
            {savingSettings ? <SpinnerIos20Regular className="size-5 animate-spin mr-2" /> : null}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
