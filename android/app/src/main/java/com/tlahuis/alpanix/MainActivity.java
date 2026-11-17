package com.tlahuis.alpanix;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(THSecureSessionPlugin.class);
        registerPlugin(THBatterySettingsPlugin.class);
        registerPlugin(THFileSavePlugin.class);
        registerPlugin(THExternalLinkPlugin.class);
        super.onCreate(savedInstanceState);
        // La WebView decide si navega o si estamos en la bandeja unificada.
        // En la raíz Android finaliza la Activity con finish(), sin matar el proceso.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "(function(){try{return window.__thcorreoBack?window.__thcorreoBack():'stay'}catch(e){return 'stay'}})()",
                        result -> {
                            if ("\"exit\"".equals(result)) {
                                runOnUiThread(() -> finish());
                            }
                        }
                    );
                }
            }
        });
    }
}
