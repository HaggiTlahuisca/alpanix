package com.tlahuis.alpanix;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "THFileSave")
public class THFileSavePlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("name", "archivo");
        String input = call.getString("data");
        if (input == null || input.length() > 30_000_000) {
            call.reject("Archivo inválido o demasiado grande");
            return;
        }
        // El nombre recibido proviene de WebDAV: no permitir rutas ni nombres especiales.
        fileName = fileName.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        if (fileName.isEmpty() || fileName.equals(".") || fileName.equals("..")) fileName = "archivo";
        if (fileName.length() > 150) fileName = fileName.substring(0,150);
        byte[] bytes;
        try { bytes = Base64.decode(input, Base64.DEFAULT); }
        catch (IllegalArgumentException e) { call.reject("Archivo Base64 inválido"); return; }
        if (bytes.length > 20 * 1024 * 1024) { call.reject("Descarga mayor de 20 MiB"); return; }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Alpanix");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("No se pudo crear el archivo");
                try (OutputStream stream = resolver.openOutputStream(uri)) {
                    if (stream == null) throw new IllegalStateException("Sin acceso a Descargas");
                    stream.write(bytes);
                } catch (Exception e) { resolver.delete(uri,null,null); throw e; }
                ContentValues ready = new ContentValues();
                ready.put(MediaStore.Downloads.IS_PENDING,0);
                resolver.update(uri,ready,null,null);
            } else {
                // Android 9 y anteriores: directorio privado sin permiso global.
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null || (!dir.exists() && !dir.mkdirs())) throw new IllegalStateException("Sin directorio de descargas");
                File target = new File(dir, fileName);
                try (OutputStream stream = new FileOutputStream(target)) { stream.write(bytes); }
            }
            JSObject result = new JSObject();
            result.put("name",fileName);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("No se pudo guardar el archivo: " + e.getMessage());
        }
    }
}
