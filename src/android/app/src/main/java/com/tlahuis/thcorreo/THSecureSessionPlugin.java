package com.tlahuis.thcorreo;

import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import java.util.concurrent.Executor;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "THSecureSession")
public class THSecureSessionPlugin extends Plugin {
    private static final String KEY_ALIAS = "thcorreo_token_keystore_v1";
    private static final String PREFS = "thcorreo_secure_session_v1";
    private static final String IV_KEY = "iv";
    private static final String VALUE_KEY = "value";
    private static final String BIO_KEY = "biometrics_enabled";

    private boolean canUseBiometric() {
        return BiometricManager.from(getContext()).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS;
    }

    private void promptBiometric(PluginCall call, Runnable authorized) {
        if (!canUseBiometric() || !(getActivity() instanceof FragmentActivity)) {
            call.reject("Biometría fuerte no disponible; utiliza la contraseña maestra.");return;
        }
        getActivity().runOnUiThread(() -> {
            Executor executor=ContextCompat.getMainExecutor(getContext());
            BiometricPrompt prompt=new BiometricPrompt((FragmentActivity)getActivity(), executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);authorized.run();
                    }
                    @Override public void onAuthenticationError(int code, CharSequence text) {
                        super.onAuthenticationError(code,text);call.reject("Autenticación biométrica cancelada o no disponible");
                    }
                });
            BiometricPrompt.PromptInfo info=new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Desbloquear Alpanix")
                .setSubtitle("Confirma tu identidad para acceder a tu sesión")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setNegativeButtonText("Usar contraseña")
                .build();
            prompt.authenticate(info);
        });
    }

    @PluginMethod public void biometricStatus(PluginCall call) {
        JSObject info=new JSObject();
        info.put("available",canUseBiometric());
        info.put("enabled",prefs().getBoolean(BIO_KEY,false));
        call.resolve(info);
    }
    @PluginMethod public void enableBiometric(PluginCall call) {
        if (prefs().getBoolean(BIO_KEY,false)) {call.resolve();return;}
        promptBiometric(call,()->{
            if (prefs().edit().putBoolean(BIO_KEY,true).commit())call.resolve();
            else call.reject("No se pudo guardar la preferencia biométrica");
        });
    }
    @PluginMethod public void disableBiometric(PluginCall call) {
        if (!prefs().getBoolean(BIO_KEY,false)) {call.resolve();return;}
        promptBiometric(call,()->{
            if (prefs().edit().putBoolean(BIO_KEY,false).commit())call.resolve();
            else call.reject("No se pudo desactivar la biometría");
        });
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE);
    }

    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry)store.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256).build());
        return generator.generateKey();
    }

    @PluginMethod
    public void save(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) { call.reject("Token vacío"); return; }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            byte[] ciphertext = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
            boolean ok = prefs().edit()
                    .putString(IV_KEY, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                    .putString(VALUE_KEY, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                    .commit();
            if (!ok) throw new Exception("No se pudo guardar la sesión");
            call.resolve();
        } catch (Exception e) { call.reject("Error al guardar sesión cifrada", e); }
    }

    @PluginMethod
    public void load(PluginCall call) {
        if (prefs().getBoolean(BIO_KEY,false)) {
            promptBiometric(call,()->loadAuthorized(call));
        } else loadAuthorized(call);
    }

    private void loadAuthorized(PluginCall call) {
        JSObject result = new JSObject();
        String iv = prefs().getString(IV_KEY, null);
        String value = prefs().getString(VALUE_KEY, null);
        if (iv == null || value == null) {
            result.put("token", JSObject.NULL);
            call.resolve(result);
            return;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(),
                    new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)));
            String token = new String(cipher.doFinal(Base64.decode(value, Base64.NO_WRAP)), StandardCharsets.UTF_8);
            result.put("token", token);
            call.resolve(result);
        } catch (Exception e) {
            // Por ejemplo, se restauraron preferencias en otro teléfono sin clave Keystore.
            prefs().edit().remove(IV_KEY).remove(VALUE_KEY).apply();
            result.put("token", JSObject.NULL);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        prefs().edit().remove(IV_KEY).remove(VALUE_KEY).apply();
        call.resolve();
    }
}
