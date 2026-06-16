import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function initializeMobile() {
  // Only initialize Capacitor plugins on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('Running on web - skipping native plugin initialization');
    return;
  }

  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Light });
    
    // Handle back button for Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    console.log('Mobile initialization complete');
  } catch (error) {
    console.warn('Capacitor plugins not available:', error);
  }
}
