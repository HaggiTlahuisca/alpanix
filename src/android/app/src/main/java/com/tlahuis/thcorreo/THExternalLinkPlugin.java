package com.tlahuis.thcorreo;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Abre únicamente enlaces web en el navegador predeterminado de Android. */
@CapacitorPlugin(name = "THExternalLink")
public class THExternalLinkPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String input=call.getString("url", "");
        try {
            Uri uri=Uri.parse(input);
            String scheme=uri.getScheme();
            if (scheme==null || !("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))
                    || uri.getHost()==null || uri.getHost().isEmpty() || uri.getUserInfo()!=null) {
                call.reject("Solo enlaces HTTP/HTTPS válidos");return;
            }
            Intent intent=new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No se encontró un navegador para abrir este enlace",e);
        } catch (Exception e) {
            call.reject("Enlace no válido",e);
        }
    }
}
