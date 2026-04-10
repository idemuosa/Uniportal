import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initializeMobile() {
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
