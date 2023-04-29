package com.codepushdiff

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.FileInputStream
import java.io.FileNotFoundException

const val JSON_FILE_NAME = "changed.json"

class AssetsModule (reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AssetsModule"

    override fun getConstants(): Map<String, Any> {
        val scriptUrl = reactApplicationContext.sourceURL ?: return emptyMap()
        try {
            if (scriptUrl.startsWith("/")) {
                val path = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1) + JSON_FILE_NAME
                val bufferReader = FileInputStream(path).bufferedReader()
                val data = bufferReader.use { it.readText() }
                return mutableMapOf(
                    "changed" to  data,
                )
            }
        } catch (error: FileNotFoundException) {
            return  emptyMap()
        }
        return emptyMap()
    }

    @ReactMethod
    fun empty() {}
}