package com.tlahuis.alpanix;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "THBatterySettings")
public class THBatterySettingsPlugin extends Plugin {
    private static final String PREFS = "alpanix_battery_permission_v1";
    private static final String AUTO_ASKED = "request_shown_once";

    // Petición nativa automática UNA vez tras el primer acceso. Android decide;
    // si se rechaza, no insistir en cada apertura. El botón manual permanece.
    @PluginMethod public void requestOnce(PluginCall call) {
        JSObject out = new JSObject();
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
        PowerManager pm = (PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
        boolean exempt = supported && pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        out.put("exempt", exempt);
        out.put("requested", false);
        if (exempt) {
            // Ya está permitida: no volver a pedirla automáticamente si después
            // cambia la preferencia del sistema.
            getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .edit().putBoolean(AUTO_ASKED, true).commit();
        }
        if (!supported || exempt || getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .getBoolean(AUTO_ASKED, false) || getActivity() == null) {
            call.resolve(out); return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent request = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getContext().getPackageName()));
                // Marcar antes de lanzar para evitar varias ventanas al reiniciar Activity.
                if (!getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                        .edit().putBoolean(AUTO_ASKED, true).commit()) {
                    call.reject("No se pudo registrar la preferencia de batería"); return;
                }
                getActivity().startActivity(request);
                out.put("requested", true);
                call.resolve(out);
            } catch (Exception e) {
                // Si el fabricante no implementa el diálogo, dejar disponible
                // la petición manual desde Ajustes sin insistencia automática.
                call.resolve(out);
            }
        });
    }
    @PluginMethod public void status(PluginCall call) {
        boolean available=Build.VERSION.SDK_INT>=Build.VERSION_CODES.M;
        PowerManager pm=(PowerManager)getContext().getSystemService(android.content.Context.POWER_SERVICE);
        boolean exempt=available && pm!=null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        JSObject result=new JSObject();
        result.put("available", available);
        result.put("exempt", exempt);
        call.resolve(result);
    }
    @PluginMethod public void requestExemption(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT>=Build.VERSION_CODES.M) {
                Intent request=new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:"+getContext().getPackageName()));
                getActivity().startActivity(request);
            } else {
                launchAppDetails();
            }
            call.resolve();
        } catch (Exception ignored) {
            try { launchAppDetails(); call.resolve(); }
            catch (Exception e) {call.reject("No se pudieron abrir los ajustes de batería",e);}
        }
    }
    private void launchAppDetails() {
        Intent intent=new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:"+getContext().getPackageName()));
        getActivity().startActivity(intent);
    }
    @PluginMethod public void openSettings(PluginCall call) {
        try{ launchAppDetails();call.resolve(); }
        catch(Exception e){call.reject("No se pudieron abrir los ajustes de Alpanix",e);}
    }
}
